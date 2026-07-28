// A lead sitting in a database nobody refreshes is a lost sale. Every enquiry is also
// emailed to the agent. The browser separately opens a prefilled WhatsApp link, so the
// two channels fail independently.

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const row = (label, value) =>
  value
    ? `<tr><td style="padding:6px 14px 6px 0;color:#6b7280;">${label}</td>
         <td style="padding:6px 0;color:#14315f;font-weight:600;">${escapeHtml(value)}</td></tr>`
    : "";

export const sendLeadEmail = async (lead) => {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;

  if (!apiKey || !to) {
    return { sent: false, reason: "RESEND_API_KEY or LEAD_NOTIFY_EMAIL not configured" };
  }

  const subject = lead.propertyTitle
    ? `New enquiry — ${lead.propertyTitle}`
    : `New ${lead.type.replace("-", " ")} lead — ${lead.name || lead.phone}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;">
      <h2 style="color:#dc1c24;margin:0 0 4px;">${escapeHtml(subject)}</h2>
      <p style="color:#6b7280;margin:0 0 18px;">Received ${new Date().toLocaleString("en-IN")}</p>
      <table style="border-collapse:collapse;font-size:14px;">
        ${row("Name", lead.name)}
        ${row("Phone", lead.phone)}
        ${row("Email", lead.email)}
        ${row("Type", lead.type)}
        ${row("Property", lead.propertyTitle)}
        ${row("Budget", lead.budget)}
        ${row("Preferred time", lead.preferredTime)}
        ${row("Message", lead.message)}
        ${row("Source", lead.source)}
        ${row("Campaign", lead.utmCampaign)}
        ${row("Landing page", lead.landingPage)}
      </table>
    </div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || "onboarding@resend.dev",
        to: [to],
        subject,
        html,
        // Replying to the notification reaches the enquirer directly.
        reply_to: lead.email || undefined,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.warn(`Lead email failed (${response.status}): ${detail}`);
      return { sent: false, reason: `HTTP ${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    // Never let a notification failure break the enquiry submission.
    console.warn(`Lead email error: ${error.message}`);
    return { sent: false, reason: error.message };
  }
};
