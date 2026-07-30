// Loads the development fixtures in src/data/properties.js into MongoDB.
//
// This replaces the auto-seed that used to run inside the API's boot sequence. That
// version fired against any empty database on first connect, so pointing the service
// at a fresh production Atlas cluster silently filled it with 24 invented listings
// that then had to be hunted down and deleted by hand.
//
// Seeding is now something you ask for:
//
//   npm run seed          # insert fixtures if the collection is empty
//   npm run seed -- --force   # wipe existing properties first
//
// It refuses to touch a production database, because there is no situation in which
// filling your live catalogue with fictional inventory is the intent.

import "../src/config/loadEnv.js";
import mongoose from "mongoose";

import { properties as fixtures } from "../src/data/properties.js";
import Property from "../src/models/Property.js";

const force = process.argv.includes("--force");
const uri = (process.env.MONGODB_URI || "").trim();

const die = (message) => {
  console.error(`\n${message}\n`);
  process.exit(1);
};

if (!uri) die("MONGODB_URI is not set — nothing to seed.");

if (process.env.NODE_ENV === "production") {
  die(
    "Refusing to seed with NODE_ENV=production.\n" +
      "These are invented demo listings, not real inventory. If you genuinely want them\n" +
      "in this database, run the command again without NODE_ENV=production set.",
  );
}

// A second guard beyond NODE_ENV, which is easy to forget when running a one-off
// command against a connection string copied from the Render dashboard.
if (/prod/i.test(uri) && !force) {
  die(
    'MONGODB_URI looks like a production cluster (it contains "prod").\n' +
      "Re-run with --force if that is really where you want demo data.",
  );
}

await mongoose.connect(uri);

const existing = await Property.countDocuments();

if (existing > 0 && !force) {
  console.log(
    `${existing} propert${existing === 1 ? "y" : "ies"} already present — nothing inserted.\n` +
      "Pass --force to delete them and reseed.",
  );
  await mongoose.disconnect();
  process.exit(0);
}

if (force && existing > 0) {
  await Property.deleteMany({});
  console.log(`Deleted ${existing} existing propert${existing === 1 ? "y" : "ies"}.`);
}

// _id is stripped: the fixtures use their slug as a stand-in id for in-memory mode,
// which is not a valid ObjectId.
await Property.insertMany(fixtures.map(({ _id, ...rest }) => rest));
console.log(`Seeded ${fixtures.length} demo properties.`);

await mongoose.disconnect();
