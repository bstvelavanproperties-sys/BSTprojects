// Where a listing sits in its closing story. Imported by BOTH the client (cards,
// property page) and the server (share previews), so a property can never be "selling
// process" in one place and "SOLD" in another.
//
// A sale is not final the moment the agent flips the switch — papers are still moving.
// So marking a property sold or rented opens a short window where the site says the
// deal is in progress, and only afterwards does it declare the result.

export const SELLING_PROCESS_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

// The two statuses that mean "no longer on the market". Kept together because the whole
// mechanic is identical for both — only the word rendered at the end differs.
export const CLOSED_STATUSES = ["sold", "rented"];

export const isClosedStatus = (status) => CLOSED_STATUSES.includes(status);

/**
 * "available" | "processing" | "closed"
 *
 * `now` is injectable so tests can sit either side of the boundary without waiting
 * three days. Compared as UTC milliseconds, so no timezone can shift the cutoff.
 */
export const saleStage = (property, now = Date.now()) => {
  const status = property?.status || "available";
  if (!isClosedStatus(status)) return "available";

  const closedAt = property?.closedAt ? new Date(property.closedAt).getTime() : NaN;

  // No timestamp means the property was closed before this feature existed. It must
  // read as long-since-sold — the alternative is every historic sale suddenly
  // re-announcing itself as a live deal in progress.
  if (!Number.isFinite(closedAt)) return "closed";

  return now - closedAt < SELLING_PROCESS_DAYS * DAY_MS ? "processing" : "closed";
};

// The word the visitor actually sees. "SOLD"/"RENTED" are shouted; the interim state is
// deliberately quieter, because nothing has completed yet.
export const stageLabel = (property, now = Date.now()) => {
  const stage = saleStage(property, now);
  if (stage === "processing") return "Selling process";
  if (stage === "closed") return property?.status === "rented" ? "RENTED" : "SOLD";
  return "";
};
