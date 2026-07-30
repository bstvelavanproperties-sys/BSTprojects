import { Router } from "express";

import { toSqft } from "@bstv/shared/units.js";

import Property from "../models/Property.js";
import { live, memory } from "../lib/memory.js";
import { uniqueSlug } from "../lib/normalise.js";
import { countBy, findBySlug, nextClosedAt, normaliseProperty, sortSpec } from "../lib/properties.js";
import {
  buildMongoFilter,
  matchesInMemory,
  normaliseQuery,
  paginate,
  sortInMemory,
  PROPERTY_TYPES,
} from "../lib/query.js";
import { requireAdmin } from "../middleware/auth.js";
import { requireDatabase } from "../middleware/database.js";
import { fail } from "../middleware/errors.js";

// Mounted at /api/properties. Declaration order is preserved from the original
// single-file server so that route matching cannot shift.
const router = Router();

router.get("/", requireDatabase, async (request, response) => {
  const params = normaliseQuery(request.query);

  try {
    if (live()) {
      const filter = buildMongoFilter(params);
      const [items, total] = await Promise.all([
        // Aggregation rather than find(), only so that available stock can be ranked
        // ahead of sold/rented before the chosen sort applies — .sort() cannot order by
        // an expression. Sorting on the `status` string would happen to work
        // alphabetically today, which is a coincidence and not a contract.
        Property.aggregate([
          { $match: filter },
          { $addFields: { closedRank: { $cond: [{ $eq: ["$status", "available"] }, 0, 1] } } },
          { $sort: { closedRank: 1, ...sortSpec(params.sort) } },
          { $skip: (params.page - 1) * params.limit },
          { $limit: params.limit },
          { $unset: "closedRank" },
        ]),
        Property.countDocuments(filter),
      ]);
      const pages = Math.max(1, Math.ceil(total / params.limit));
      return response.json({ items, total, page: Math.min(params.page, pages), pages, priceIgnored: params.priceIgnored });
    }

    const filtered = memory.properties.filter((item) => matchesInMemory(item, params));
    const sorted = sortInMemory(filtered, params.sort);
    return response.json({ ...paginate(sorted, params), priceIgnored: params.priceIgnored });
  } catch (error) {
    return fail(response, 500, "Could not load properties.", error);
  }
});

router.get("/:slug", requireDatabase, async (request, response) => {
  const property = await findBySlug(request.params.slug);
  if (!property) return response.status(404).json({ error: "Property not found." });
  return response.json(property);
});

router.get("/:slug/similar", requireDatabase, async (request, response) => {
  const property = await findBySlug(request.params.slug);
  if (!property) return response.status(404).json({ error: "Property not found." });

  const criteria = {
    city: property.city,
    propertyType: property.propertyType,
    listingType: property.listingType,
  };

  if (live()) {
    const items = await Property.find({ ...criteria, status: "available", slug: { $ne: property.slug } })
      .limit(4)
      .lean();
    return response.json(items);
  }

  const items = memory.properties
    .filter(
      (item) =>
        item.slug !== property.slug &&
        item.status === "available" &&
        item.city === criteria.city &&
        item.propertyType === criteria.propertyType,
    )
    .slice(0, 4);
  return response.json(items);
});

router.post("/", requireAdmin, requireDatabase, async (request, response) => {
  const data = normaliseProperty(request.body);
  // Price is optional — a listing may go up as Price on Request.
  if (!data.title || !data.city) {
    return response.status(400).json({ error: "Title and city are required." });
  }

  data.slug = await uniqueSlug(data.title);
  data.areaSqft = toSqft(data.areaValue, data.areaUnit);
  // A brand-new listing has no previous status, so publishing one straight as sold
  // starts its window now.
  data.closedAt = nextClosedAt("available", data.status, null);

  try {
    if (live()) {
      const created = await Property.create(data);
      return response.status(201).json(created);
    }
    const created = { _id: data.slug, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    memory.properties.unshift(created);
    return response.status(201).json(created);
  } catch (error) {
    return fail(response, 500, "Could not save the property.", error);
  }
});

router.patch("/:id", requireAdmin, requireDatabase, async (request, response) => {
  const data = normaliseProperty(request.body);
  data.areaSqft = toSqft(data.areaValue, data.areaUnit);

  try {
    if (live()) {
      // Read before write: closedAt depends on the status the property is coming FROM,
      // which findByIdAndUpdate alone never sees.
      const existing = await Property.findById(request.params.id).lean();
      if (!existing) return response.status(404).json({ error: "Property not found." });

      data.closedAt = nextClosedAt(existing.status, data.status, existing.closedAt);

      const updated = await Property.findByIdAndUpdate(request.params.id, data, { new: true });
      if (!updated) return response.status(404).json({ error: "Property not found." });
      return response.json(updated);
    }
    const index = memory.properties.findIndex((item) => String(item._id) === request.params.id);
    if (index === -1) return response.status(404).json({ error: "Property not found." });
    const previous = memory.properties[index];
    memory.properties[index] = {
      ...previous,
      ...data,
      slug: previous.slug,
      closedAt: nextClosedAt(previous.status, data.status, previous.closedAt),
      updatedAt: new Date().toISOString(),
    };
    return response.json(memory.properties[index]);
  } catch (error) {
    return fail(response, 500, "Could not update the property.", error);
  }
});

router.delete("/:id", requireAdmin, requireDatabase, async (request, response) => {
  try {
    if (live()) {
      const deleted = await Property.findByIdAndDelete(request.params.id);
      if (!deleted) return response.status(404).json({ error: "Property not found." });
      return response.json({ message: "Deleted." });
    }
    const index = memory.properties.findIndex((item) => String(item._id) === request.params.id);
    if (index === -1) return response.status(404).json({ error: "Property not found." });
    memory.properties.splice(index, 1);
    return response.json({ message: "Deleted." });
  } catch (error) {
    return fail(response, 500, "Could not delete the property.", error);
  }
});

// Bulk import — an agency's inventory lives in a spreadsheet, not a web form.
router.post("/import", requireAdmin, requireDatabase, async (request, response) => {
  const rows = Array.isArray(request.body?.rows) ? request.body.rows : [];
  if (!rows.length) return response.status(400).json({ error: "No rows supplied." });

  const results = { created: 0, skipped: 0, errors: [] };

  for (const row of rows.slice(0, 500)) {
    const data = normaliseProperty(row);
    if (!data.title || !data.city) {
      results.skipped += 1;
      results.errors.push(`Skipped "${row.title || "(untitled)"}" — title and city are required.`);
      continue;
    }
    data.slug = await uniqueSlug(data.title);
    data.areaSqft = toSqft(data.areaValue, data.areaUnit);
    // Same rule as a single create: a spreadsheet row that arrives already sold starts
    // its window at import time.
    data.closedAt = nextClosedAt("available", data.status, null);

    try {
      if (live()) {
        await Property.create(data);
      } else {
        memory.properties.unshift({
          _id: data.slug,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      results.created += 1;
    } catch (error) {
      results.skipped += 1;
      results.errors.push(`${data.title}: ${error.message}`);
    }
  }

  return response.json(results);
});

// ---------------------------------------------------------------------------
// Catalogue facets. Mounted at /api rather than /api/properties, because those are
// the URLs the client already calls — grouped here because they count properties.
// ---------------------------------------------------------------------------
export const catalogueRouter = Router();

catalogueRouter.get("/property-types", requireDatabase, async (_request, response) => {
  const counts = await countBy("propertyType");
  response.json(PROPERTY_TYPES.map((slug) => ({ slug, count: counts[slug] || 0 })));
});

catalogueRouter.get("/cities", requireDatabase, async (_request, response) => {
  const counts = await countBy("city");
  response.json(
    Object.entries(counts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city)),
  );
});

export default router;
