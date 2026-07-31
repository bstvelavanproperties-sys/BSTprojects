// The question-and-answer copy, shared because it is rendered twice: once as the visible
// page (client/src/pages/Faqs.jsx, client/src/pages/Nri.jsx) and once as FAQPage structured
// data (shared/pageMeta.js).
//
// Those two MUST stay identical. Google's structured data policy requires FAQ markup to match
// content visible on the page, and shipping schema for questions a visitor cannot see is a
// manual-action risk rather than a clever shortcut. Keeping one array is what guarantees it.

export const faqs = [
  {
    q: "Do you charge a fee for helping me find a property?",
    a: "No. Our search service is free for buyers and tenants. We're paid by the owner on a completed transaction, and we'll always tell you upfront where our commission sits.",
  },
  {
    q: "Are the listings on this site verified?",
    a: "Yes. Every listing is checked before it goes live — we confirm ownership, look at the title documents and visit the property. Anything we can't verify doesn't get published.",
  },
  {
    q: "What documents should I check before buying?",
    a: "At minimum: the parent document and sale deed, an encumbrance certificate covering at least 15 years, patta or chitta for land, approved layout plans, and the latest tax receipts. Our documentation team walks you through all of it.",
  },
  {
    q: "Can you manage a property I own but don't live near?",
    a: "That's exactly what our property management service is for. We handle tenants, rent collection, maintenance and periodic inspections, and send you a regular report.",
  },
  {
    q: "How long does a typical sale take to close?",
    a: "For a clean title with a ready buyer, six to eight weeks is realistic. Loan approvals and any title corrections are usually what extends it.",
  },
  {
    q: "Do you help with home loans?",
    a: "We don't lend, but we work with several banks and can introduce you to a manager who handles property loans. The EMI calculator on each listing gives you a rough starting point.",
  },
];

// The NRI page's own set. Same scope discipline as the loan and finance copy elsewhere: we
// describe what WE do and what the process looks like, and we point at the buyer's own
// chartered accountant for anything that is genuinely tax or FEMA advice. Answering those
// questions ourselves would be advice we are not licensed to give.
export const nriFaqs = [
  {
    q: "Can an NRI buy property in India without flying down?",
    a: "Yes. Most of our NRI buyers complete the purchase without travelling, by appointing someone they trust — a family member or our representative — through a registered power of attorney. We prepare the POA and walk whoever signs it through registration.",
  },
  {
    q: "What is a power of attorney and how do I get one from abroad?",
    a: "It authorises a named person to sign and register on your behalf. From abroad it is executed at the Indian consulate or notarised locally and then adjudicated in India. We draft it, tell you exactly which consulate steps apply to your country, and handle the India-side registration.",
  },
  {
    q: "Which property can an NRI buy in India?",
    a: "Residential and commercial property is generally open to NRIs. Agricultural land, plantations and farmhouses are the usual exceptions and cannot normally be purchased. We flag which category a listing falls into before you spend time on it, and we'll tell you plainly when something isn't available to you.",
  },
  {
    q: "How does the payment work from an overseas account?",
    a: "Payments are routed through your NRE or NRO account, or by normal banking channels. We coordinate the paperwork with your bank and your chartered accountant — we don't handle your funds ourselves, and anything involving remittance limits or repatriation should come from your own adviser.",
  },
  {
    q: "Is TDS deducted when an NRI buys or sells?",
    a: "There are withholding requirements on property transactions, and the rate differs depending on whether you are the buyer or the seller and how long the property was held. This is exactly where we bring in your chartered accountant rather than guessing — we make sure the paperwork reaches them in time.",
  },
  {
    q: "Who looks after the property once I go back?",
    a: "We do, if you'd like. Tenant sourcing, agreements, rent collection, maintenance, property tax and periodic inspections, with a regular report to you — the same management service our resident owners use.",
  },
];
