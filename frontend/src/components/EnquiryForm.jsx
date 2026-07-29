import { useState } from "react";
import brand from "../data/brand.js";
import { submitLead } from "../lib/api.js";
import { track } from "../lib/storage.js";
import { priceText } from "../lib/format.js";
import { whatsappHref } from "./Fabs.jsx";
import { WhatsApp } from "./Icons.jsx";

const emptyForm = { name: "", phone: "", email: "", message: "", company: "" };

export default function EnquiryForm({
  property,
  type = "enquiry",
  title = "Interested in this property?",
  subtitle = "Send us a message and we'll get back to you shortly.",
  extraFields = [],
  compact = false,
}) {
  const [form, setForm] = useState({
    ...emptyForm,
    ...Object.fromEntries(extraFields.map((field) => [field.name, ""])),
  });
  const [state, setState] = useState({ status: "idle", message: "" });

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const whatsappMessage = () =>
    [
      `Hi ${brand.name},`,
      property ? `I'm interested in: ${property.title}` : `I'd like to enquire about a property.`,
      property ? `Price: ${priceText(property)}` : "",
      property ? `Link: ${window.location.origin}/real-estate/${property.slug}` : "",
      form.name ? `Name: ${form.name}` : "",
      form.phone ? `Phone: ${form.phone}` : "",
      form.message ? `Message: ${form.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  const onSubmit = async (event) => {
    event.preventDefault();
    if (state.status === "sending") return;

    if (!form.name.trim() || !form.phone.trim()) {
      setState({ status: "error", message: "Please enter your name and phone number." });
      return;
    }

    setState({ status: "sending", message: "" });

    const payload = {
      ...form,
      type,
      propertyId: property?.slug || "",
      propertyTitle: property?.title || "",
    };

    const result = await submitLead(payload);
    track("lead_submit", { type, property: property?.slug || "" });

    setState({
      status: "sent",
      message: result.offline
        ? "Saved. If it's urgent, message us on WhatsApp — the button below is prefilled."
        : "Thanks — we'll be in touch shortly.",
    });

    // Second delivery channel: the enquiry reaches a phone even if email fails.
    window.open(whatsappHref(whatsappMessage()), "_blank", "noopener");
    setForm({ ...emptyForm, ...Object.fromEntries(extraFields.map((f) => [f.name, ""])) });
  };

  if (state.status === "sent") {
    return (
      <div className={`card ${compact ? "p-6" : "p-7"} text-center`}>
        <p className="mb-2 text-lg font-extrabold text-navy-700">Enquiry received</p>
        <p className="mb-5 text-sm text-muted">{state.message}</p>
        <a
          href={whatsappHref(whatsappMessage())}
          target="_blank"
          rel="noreferrer noopener"
          className="btn inline-flex bg-chat text-white hover:brightness-95"
        >
          <WhatsApp size={18} /> Message on WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setState({ status: "idle", message: "" })}
          className="mt-4 block w-full text-sm font-bold text-brand-500 hover:underline"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`card ${compact ? "p-6" : "p-7"}`} noValidate>
      <h3 className="mb-1 text-xl font-extrabold text-navy-700">{title}</h3>
      <p className="mb-5 text-sm text-muted">{subtitle}</p>

      <div className="space-y-3">
        <div>
          <label htmlFor="lead-name" className="sr-only">
            Your name
          </label>
          <input
            id="lead-name"
            className="field"
            placeholder="Your name *"
            value={form.name}
            onChange={set("name")}
            autoComplete="name"
            required
          />
        </div>

        <div>
          <label htmlFor="lead-phone" className="sr-only">
            Phone number
          </label>
          <input
            id="lead-phone"
            className="field"
            placeholder="Phone number *"
            value={form.phone}
            onChange={set("phone")}
            type="tel"
            autoComplete="tel"
            required
          />
        </div>

        <div>
          <label htmlFor="lead-email" className="sr-only">
            Email address
          </label>
          <input
            id="lead-email"
            className="field"
            placeholder="Email address"
            value={form.email}
            onChange={set("email")}
            type="email"
            autoComplete="email"
          />
        </div>

        {extraFields.map((field) => (
          <div key={field.name}>
            <label htmlFor={`lead-${field.name}`} className="sr-only">
              {field.placeholder}
            </label>
            {field.options ? (
              <select
                id={`lead-${field.name}`}
                className="field"
                value={form[field.name]}
                onChange={set(field.name)}
              >
                <option value="">{field.placeholder}</option>
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`lead-${field.name}`}
                className="field"
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={set(field.name)}
              />
            )}
          </div>
        ))}

        <div>
          <label htmlFor="lead-message" className="sr-only">
            Message
          </label>
          <textarea
            id="lead-message"
            className="field min-h-24 resize-y"
            placeholder={property ? `I'd like to know more about ${property.title}` : "Your message"}
            value={form.message}
            onChange={set("message")}
            rows={3}
          />
        </div>

        {/* Honeypot — hidden from people, irresistible to bots. */}
        <input
          type="text"
          name="company"
          value={form.company}
          onChange={set("company")}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute h-0 w-0 overflow-hidden opacity-0"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="mt-3 text-sm font-semibold text-brand-500">
          {state.message}
        </p>
      )}

      <button type="submit" className="btn-brand mt-5 w-full" disabled={state.status === "sending"}>
        {state.status === "sending" ? "Sending…" : "Send Enquiry"}
      </button>

      <p className="mt-3 text-center text-xs text-muted">
        Or call{" "}
        <a href={`tel:${brand.phones[0].replace(/\s/g, "")}`} className="font-bold text-brand-500">
          {brand.phones[0]}
        </a>
      </p>
    </form>
  );
}
