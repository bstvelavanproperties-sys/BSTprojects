import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import brand, { propertyLabels, propertyTypes, typeLabel } from "../config/brand.js";
import {
  clearAdminToken,
  createProperty,
  deleteProperty,
  fetchAdminSession,
  fetchContent,
  fetchHealth,
  fetchLeads,
  fetchProperties,
  fetchUploadConfig,
  getAdminToken,
  importProperties,
  setAdminToken,
  updateContent,
  updateLeadStatus,
  updateProperty,
} from "../lib/api.js";
import AdminLogin from "./AdminLogin.jsx";
import { exportLeadsCsv, exportPropertiesCsv, parseCsv, PROPERTY_CSV_FIELDS } from "../lib/storage.js";
import { formatINR, priceText } from "../lib/format.js";
import { uploadImageToCloudinary, uploadVideoToCloudinary } from "../lib/cloudinary.js";
import { AREA_UNITS } from "@bstv/shared/units.js";
import { defaultPropertyImage } from "@bstv/shared/propertyImages.js";
import {
  MAX_PROPERTY_IMAGES,
  MAX_PROPERTY_VIDEOS,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  formatBytes,
} from "@bstv/shared/media.js";
import { cloudinaryPoster } from "../lib/format.js";
import { ArrowUp, Close, Play } from "../components/Icons.jsx";

const LEAD_STATUSES = ["new", "contacted", "scheduled", "visited", "converted", "closed"];

const statusTint = {
  new: "bg-brand-50 text-brand-600",
  contacted: "bg-amber-50 text-amber-700",
  scheduled: "bg-blue-50 text-blue-700",
  visited: "bg-purple-50 text-purple-700",
  converted: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const emptyProperty = {
  title: "",
  listingType: "sale",
  propertyType: "plot",
  labels: ["residential"],
  status: "available",
  price: "",
  hidePrice: false,
  pricePrefix: "",
  priceSuffix: "",
  priceNote: "",
  bedrooms: "",
  bathrooms: "",
  areaValue: "",
  areaUnit: "sqft",
  facing: "",
  furnishing: "",
  locationText: "",
  locality: "",
  city: "",
  state: "Tamil Nadu",
  pincode: "",
  images: "",
  videos: "",
  amenities: "",
  featured: false,
  nriFriendly: false,
  description: "",
};

// The form keeps media as newline/comma-separated text so the paste-a-URL escape
// hatch and the uploader can write to the same field.
const parseList = (value) =>
  String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

// Everything that differs between the photo and video uploaders, in one place.
const MEDIA = {
  image: {
    field: "images",
    max: MAX_PROPERTY_IMAGES,
    noun: "photo",
    accept: "image/*",
    maxBytes: MAX_IMAGE_BYTES,
    send: uploadImageToCloudinary,
  },
  video: {
    field: "videos",
    max: MAX_PROPERTY_VIDEOS,
    noun: "video",
    accept: "video/*",
    maxBytes: MAX_VIDEO_BYTES,
    send: uploadVideoToCloudinary,
  },
};

const Field = ({ label, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-bold text-navy-700">{label}</span>
    {children}
  </label>
);

// Drives both the photo and the video uploader — they differ only by the MEDIA entry.
const MediaUploader = ({
  kind,
  heading,
  urls,
  upload,
  onSelect,
  onRemove,
  value,
  onChangeText,
  ready,
  children,
}) => {
  const { max, noun, accept, maxBytes } = MEDIA[kind];
  const full = urls.length >= max;
  const mine = upload.kind === kind; // messages belong to the uploader that ran
  const busy = mine && upload.active;

  return (
    <>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-bold text-navy-700">{heading}</span>
        <span className={`text-xs font-bold ${full ? "text-brand-600" : "text-muted"}`}>
          {urls.length} of {max}
        </span>
      </div>

      {!ready ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Uploads are off. Set <code className="font-mono">CLOUDINARY_CLOUD_NAME</code>,{" "}
          <code className="font-mono">CLOUDINARY_API_KEY</code> and{" "}
          <code className="font-mono">CLOUDINARY_API_SECRET</code> on the server, then restart it.
        </div>
      ) : full ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-surface p-4 text-center text-sm text-muted">
          Maximum of {max} {noun}s reached. Remove one to add another.
        </div>
      ) : (
        <div className="relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/60 px-5 py-6 text-center transition-colors hover:border-brand-500">
          <ArrowUp size={24} className="mb-2 text-brand-500" />
          <span className="font-extrabold text-navy-700">
            {busy ? upload.message : `Choose ${noun}s to upload`}
          </span>
          <span className="mt-1 text-xs text-muted">
            Up to {max - urls.length} more · max {formatBytes(maxBytes)} each
          </span>
          <input
            type="file"
            accept={accept}
            multiple
            disabled={upload.active}
            onChange={onSelect}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
            aria-label={`Upload property ${noun}s to Cloudinary`}
          />
        </div>
      )}

      {mine && upload.message && !upload.active && (
        <p className="mt-2 text-sm font-bold text-green-700">{upload.message}</p>
      )}
      {mine && upload.error && <p className="mt-2 text-sm font-bold text-brand-600">{upload.error}</p>}

      {urls.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url, index) => (
            <li key={`${url}-${index}`} className="relative overflow-hidden rounded-xl bg-surface">
              <img
                src={kind === "video" ? cloudinaryPoster(url, 400) : url}
                alt={`${noun} ${index + 1}`}
                className="aspect-[4/3] h-full w-full object-cover"
              />
              {kind === "video" && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-navy-700">
                    <Play size={18} filled />
                  </span>
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-2 right-2 rounded-full bg-navy-900/85 p-1.5 text-white hover:bg-brand-500"
                aria-label={`Remove ${noun} ${index + 1}`}
              >
                <Close size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {children}

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-bold text-navy-700">
          Or paste {noun} URLs, one per line (max {max})
        </span>
        <textarea className="field min-h-20" value={value} onChange={onChangeText} />
      </label>
      <span className="mt-1 block text-xs text-muted">
        {kind === "video"
          ? "A still from the first frame is used as the thumbnail. Videos load only when played."
          : "Cloudinary images are automatically resized and optimized when displayed."}
      </span>
    </>
  );
};

// ---------------------------------------------------------------------------
function PropertyForm({ initial, onSave, onCancel, saving, uploadsReady }) {
  const [form, setForm] = useState(initial);
  // One uploader runs at a time; `kind` decides which block shows the message.
  const [upload, setUpload] = useState({ kind: null, active: false, message: "", error: "" });
  const set = (key) => (event) =>
    setForm((prev) => ({
      ...prev,
      [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  const toggleLabel = (slug) =>
    setForm((prev) => ({
      ...prev,
      labels: prev.labels.includes(slug)
        ? prev.labels.filter((item) => item !== slug)
        : [...prev.labels, slug],
    }));

  const imageUrls = parseList(form.images);
  const videoUrls = parseList(form.videos);

  const uploadMedia = (kind) => async (event) => {
    const { field, max, noun, send } = MEDIA[kind];
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    // The cap is checked against what's in the form right now, so re-opening the
    // picker after a partial upload can't sneak past it.
    const room = max - parseList(form[field]).length;
    if (room <= 0) {
      setUpload({ kind, active: false, message: "", error: `Limit reached — ${max} ${noun}s per property.` });
      return;
    }

    const accepted = files.slice(0, room);
    const skipped = files.length - accepted.length;
    const uploaded = [];

    const commit = (urls) =>
      setForm((prev) => ({ ...prev, [field]: [...parseList(prev[field]), ...urls].join("\n") }));

    try {
      for (const [index, file] of accepted.entries()) {
        setUpload({
          kind,
          active: true,
          message: `Uploading ${index + 1} of ${accepted.length}: ${file.name}`,
          error: "",
        });
        uploaded.push(await send(file));
      }

      commit(uploaded);
      setUpload({
        kind,
        active: false,
        message: `${uploaded.length} ${noun}${uploaded.length === 1 ? "" : "s"} uploaded.`,
        error: skipped
          ? `${skipped} file${skipped === 1 ? "" : "s"} skipped — only ${max} ${noun}s allowed per property.`
          : "",
      });
    } catch (error) {
      // Whatever made it up is still kept, so a failure halfway through a batch
      // doesn't cost the admin the uploads that already succeeded.
      if (uploaded.length) commit(uploaded);
      setUpload({
        kind,
        active: false,
        message: uploaded.length ? `${uploaded.length} ${noun}${uploaded.length === 1 ? "" : "s"} uploaded.` : "",
        error: error.message,
      });
    }
  };

  const removeMedia = (kind) => (removeIndex) => {
    const { field } = MEDIA[kind];
    setForm((prev) => ({
      ...prev,
      [field]: parseList(prev[field]).filter((_, index) => index !== removeIndex).join("\n"),
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      price: Number(form.price) || 0,
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      areaValue: Number(form.areaValue) || 0,
      // Sliced here too: the paste-a-URL textarea bypasses the uploader's cap, and
      // the API would silently drop the extras anyway. Trimming now keeps what the
      // admin sees after saving the same as what they typed.
      images: parseList(form.images).slice(0, MAX_PROPERTY_IMAGES),
      videos: parseList(form.videos).slice(0, MAX_PROPERTY_VIDEOS),
      amenities: parseList(form.amenities),
    });
  };

  return (
    <form onSubmit={submit} className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-navy-700">
          {initial._id ? "Edit property" : "Add property"}
        </h2>
        <button type="button" onClick={onCancel} aria-label="Close form" className="text-muted hover:text-navy-700">
          <Close size={22} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title *" className="sm:col-span-2">
          <input className="field" value={form.title} onChange={set("title")} required />
        </Field>

        <Field label="Listing type">
          <select className="field" value={form.listingType} onChange={set("listingType")}>
            <option value="sale">For sale</option>
            <option value="rent">For rent</option>
          </select>
        </Field>

        <Field label="Property type">
          <select className="field" value={form.propertyType} onChange={set("propertyType")}>
            {propertyTypes.map((type) => (
              <option key={type.slug} value={type.slug}>
                {type.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Price (₹)">
          <input className="field" type="number" min="0" value={form.price} onChange={set("price")} />
          <span className="mt-1 block text-xs font-bold text-brand-500">
            {form.hidePrice || !(Number(form.price) > 0)
              ? "Displays as Price on Request"
              : `Displays as ${formatINR(form.price)}`}
          </span>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.hidePrice}
              onChange={set("hidePrice")}
              className="h-4 w-4 accent-brand-500"
            />
            <span className="text-sm font-bold text-navy-700">Hide price</span>
          </label>
        </Field>

        <Field label="Status">
          <select className="field" value={form.status} onChange={set("status")}>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </select>
        </Field>

        <Field label="Price prefix">
          <input className="field" value={form.pricePrefix} onChange={set("pricePrefix")} placeholder="Per Flat" />
        </Field>

        <Field label="Price suffix">
          <input className="field" value={form.priceSuffix} onChange={set("priceSuffix")} placeholder="Per Acre / Per Month" />
        </Field>

        <Field label="Price note" className="sm:col-span-2">
          <input className="field" value={form.priceNote} onChange={set("priceNote")} placeholder="Total Price 2.40 Cr" />
        </Field>

        <Field label="Area value">
          <input className="field" type="number" step="0.01" value={form.areaValue} onChange={set("areaValue")} />
        </Field>

        <Field label="Area unit">
          <select className="field" value={form.areaUnit} onChange={set("areaUnit")}>
            {Object.entries(AREA_UNITS).map(([slug, unit]) => (
              <option key={slug} value={slug}>
                {unit.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Bedrooms">
          <input className="field" type="number" value={form.bedrooms} onChange={set("bedrooms")} />
        </Field>

        <Field label="Bathrooms">
          <input className="field" type="number" value={form.bathrooms} onChange={set("bathrooms")} />
        </Field>

        <Field label="City *">
          <input className="field" value={form.city} onChange={set("city")} required />
        </Field>

        <Field label="Locality">
          <input className="field" value={form.locality} onChange={set("locality")} />
        </Field>

        <Field label="Full location text" className="sm:col-span-2">
          <input
            className="field"
            value={form.locationText}
            onChange={set("locationText")}
            placeholder="Avadi, Tamil Nadu, India"
          />
        </Field>

        <Field label="Facing">
          <input className="field" value={form.facing} onChange={set("facing")} />
        </Field>

        <Field label="Furnishing">
          <input className="field" value={form.furnishing} onChange={set("furnishing")} />
        </Field>

        <div className="sm:col-span-2">
          <MediaUploader
            kind="image"
            heading="Property photos"
            urls={imageUrls}
            upload={upload}
            onSelect={uploadMedia("image")}
            onRemove={removeMedia("image")}
            value={form.images}
            onChangeText={set("images")}
            ready={uploadsReady}
          >
            {!imageUrls.length && (
              <div className="mt-4 flex items-center gap-4 rounded-xl bg-surface p-3">
                <img
                  src={defaultPropertyImage(form.propertyType)}
                  alt=""
                  className="h-20 w-28 rounded-lg object-cover"
                />
                <div>
                  <p className="font-extrabold text-navy-700">Default image selected</p>
                  <p className="text-xs text-muted">
                    This {typeLabel(form.propertyType).toLowerCase()} image will be shown until a
                    photo is uploaded.
                  </p>
                </div>
              </div>
            )}
          </MediaUploader>
        </div>

        <div className="sm:col-span-2">
          <MediaUploader
            kind="video"
            heading="Property videos"
            urls={videoUrls}
            upload={upload}
            onSelect={uploadMedia("video")}
            onRemove={removeMedia("video")}
            value={form.videos}
            onChangeText={set("videos")}
            ready={uploadsReady}
          />
        </div>

        <Field label="Amenities (comma separated)" className="sm:col-span-2">
          <textarea className="field min-h-20" value={form.amenities} onChange={set("amenities")} />
        </Field>

        <Field label="Description" className="sm:col-span-2">
          <textarea className="field min-h-28" value={form.description} onChange={set("description")} />
        </Field>

        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-bold text-navy-700">Category labels</span>
          <div className="flex gap-2">
            {propertyLabels.map((label) => (
              <button
                key={label.slug}
                type="button"
                onClick={() => toggleLabel(label.slug)}
                className={`pill ${form.labels.includes(label.slug) ? "pill-active" : ""}`}
              >
                {label.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={form.featured} onChange={set("featured")} className="h-4 w-4 accent-brand-500" />
          <span className="text-sm font-bold text-navy-700">Show in Featured Property</span>
        </label>

        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={form.nriFriendly} onChange={set("nriFriendly")} className="h-4 w-4 accent-brand-500" />
          <span className="text-sm font-bold text-navy-700">
            NRI-friendly{" "}
            <span className="font-semibold text-muted">
              — shows the badge and appears on the NRI page
            </span>
          </span>
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="submit" className="btn-brand" disabled={saving || upload.active}>
          {upload.active ? "Uploading…" : saving ? "Saving…" : initial._id ? "Save changes" : "Add property"}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
export default function AdminApp() {
  const [tab, setTab] = useState("properties");
  const [health, setHealth] = useState(null);
  const [token, setToken] = useState(getAdminToken());
  const [notice, setNotice] = useState("");
  // null while the session check is in flight — avoids flashing the login form
  // at someone who is already signed in.
  const [session, setSession] = useState(null);

  const [properties, setProperties] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [leads, setLeads] = useState([]);
  const [content, setContent] = useState({});
  // Whether the server holds Cloudinary credentials. Runtime state now, not a
  // build-time constant — the credentials live on the server, so changing them
  // takes a restart rather than a rebuild.
  const [uploadsReady, setUploadsReady] = useState(false);
  const fileInput = useRef(null);

  const loadProperties = useCallback(
    () =>
      // `status: ""` used to be here, which failed validation server-side and silently
      // fell back to available-only — so a property the operator marked sold vanished
      // from their own table and could never be edited back.
      fetchProperties({ limit: 48, includeClosed: "true" })
        .then((data) => setProperties(data.items))
        .catch(() => setProperties([])),
    [],
  );

  useEffect(() => {
    fetchAdminSession()
      .then(setSession)
      // An unreachable API shouldn't lock the operator out behind a login that
      // cannot succeed — show the panel and let the individual calls report.
      .catch(() => setSession({ configured: false, authenticated: true }));
  }, []);

  const signedIn = session?.authenticated;

  useEffect(() => {
    if (!signedIn) return;
    fetchHealth().then(setHealth).catch(() => setHealth({ ok: false }));
    loadProperties();
    fetchLeads().then(setLeads).catch(() => setLeads([]));
    fetchContent().then(setContent).catch(() => setContent({}));
    fetchUploadConfig()
      .then((config) => setUploadsReady(Boolean(config.configured)))
      .catch(() => setUploadsReady(false));
  }, [signedIn, loadProperties]);

  const signOut = () => {
    clearAdminToken();
    setSession({ ...session, authenticated: false });
  };

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 4000);
  };

  const saveProperty = async (data) => {
    setSaving(true);
    try {
      if (editing?._id) await updateProperty(editing._id, data);
      else await createProperty(data);
      await loadProperties();
      setEditing(null);
      flash("Property saved.");
    } catch (error) {
      flash(error.message);
    } finally {
      setSaving(false);
    }
  };

  const removeProperty = async (property) => {
    if (!window.confirm(`Delete "${property.title}"? This cannot be undone.`)) return;
    try {
      await deleteProperty(property._id);
      await loadProperties();
      flash("Property deleted.");
    } catch (error) {
      flash(error.message);
    }
  };

  const onImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) return flash("No rows found in that file.");
      const result = await importProperties(rows);
      await loadProperties();
      flash(`Imported ${result.created}, skipped ${result.skipped}.`);
    } catch (error) {
      flash(error.message);
    } finally {
      event.target.value = "";
    }
  };

  const changeLeadStatus = async (lead, status) => {
    await updateLeadStatus(lead._id, status);
    setLeads((prev) => prev.map((item) => (item._id === lead._id ? { ...item, status } : item)));
  };

  const saveContent = async (event) => {
    event.preventDefault();
    try {
      await updateContent(content);
      flash("Homepage content saved.");
    } catch (error) {
      flash(error.message);
    }
  };

  const toForm = (property) => ({
    ...emptyProperty,
    ...property,
    images: (property.images || []).join("\n"),
    videos: (property.videos || []).join("\n"),
    amenities: (property.amenities || []).join(", "),
    labels: property.labels || [],
  });

  if (session === null) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>;
  }

  if (!signedIn) {
    return <AdminLogin onSuccess={() => setSession({ ...session, authenticated: true })} />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-gray-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={brand.logo} alt="" className="h-9 w-9 rounded-full object-contain" />
            <span className="font-extrabold text-navy-700">{brand.shortName} Admin</span>
          </div>

          <div className="flex items-center gap-4">
            {health && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  health.database === "connected"
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {health.database === "connected" ? "MongoDB connected" : "Memory mode"}
              </span>
            )}
            <Link to="/" className="text-sm font-bold text-brand-500 hover:underline">
              View site →
            </Link>
            {session.configured && (
              <button
                type="button"
                onClick={signOut}
                className="text-sm font-bold text-muted hover:text-brand-500"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="container-page py-8">
        {health?.database !== "connected" && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong className="font-extrabold">Memory mode.</strong> Changes last until the server
            restarts. Set <code className="font-mono">MONGODB_URI</code> in <code className="font-mono">.env</code> for
            real persistence.
          </div>
        )}

        {notice && (
          <div role="status" className="mb-6 rounded-xl bg-navy-700 p-4 text-sm font-semibold text-white">
            {notice}
          </div>
        )}

        <nav className="mb-8 flex flex-wrap gap-2">
          {[
            ["properties", `Properties (${properties.length})`],
            ["leads", `Leads (${leads.length})`],
            ["content", "Homepage"],
            ["settings", "Settings"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`pill ${tab === key ? "pill-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* ---------------- Properties ---------------- */}
        {tab === "properties" && (
          <div className="space-y-6">
            {editing ? (
              <PropertyForm
                initial={editing}
                onSave={saveProperty}
                onCancel={() => setEditing(null)}
                saving={saving}
                uploadsReady={uploadsReady}
              />
            ) : (
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn-brand" onClick={() => setEditing({ ...emptyProperty })}>
                  Add property
                </button>
                <button type="button" className="btn-outline" onClick={() => exportPropertiesCsv(properties)}>
                  Export CSV
                </button>
                <button type="button" className="btn-outline" onClick={() => fileInput.current?.click()}>
                  Import CSV
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onImport}
                  className="hidden"
                  aria-label="Import properties CSV"
                />
              </div>
            )}

            <div className="card overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    {["Property", "Type", "Price", "City", "Status", ""].map((heading) => (
                      <th key={heading} className="px-5 py-3 font-bold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property._id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-bold text-navy-700">{property.title}</p>
                        <p className="text-xs text-muted">{property.slug}</p>
                      </td>
                      <td className="px-5 py-3 text-muted">{typeLabel(property.propertyType)}</td>
                      <td className="px-5 py-3 font-bold text-brand-500">
                        {priceText(property)}
                        {/* The public label hides the number — staff still need to see it. */}
                        {property.hidePrice && Number(property.price) > 0 && (
                          <span className="block text-xs font-semibold text-muted">
                            hidden · {formatINR(property.price)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted">{property.city}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold capitalize text-gray-700">
                          {property.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditing(toForm(property))}
                          className="mr-3 font-bold text-brand-500 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeProperty(property)}
                          className="font-bold text-muted hover:text-brand-500"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!properties.length && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-muted">
                        No properties yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- Leads ---------------- */}
        {tab === "leads" && (
          <div className="space-y-6">
            <button type="button" className="btn-outline" onClick={() => exportLeadsCsv(leads)}>
              Export leads CSV
            </button>

            <div className="card overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-gray-100 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    {["Received", "Contact", "Interest", "Source", "Status"].map((heading) => (
                      <th key={heading} className="px-5 py-3 font-bold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead._id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 whitespace-nowrap text-muted">
                        {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-bold text-navy-700">{lead.name || "—"}</p>
                        <a href={`tel:${lead.phone}`} className="text-xs text-brand-500">
                          {lead.phone}
                        </a>
                        {lead.email && <p className="text-xs text-muted">{lead.email}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-navy-700">{lead.propertyTitle || lead.type}</p>
                        {lead.message && (
                          <p className="max-w-xs truncate text-xs text-muted">{lead.message}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted">{lead.source}</td>
                      <td className="px-5 py-3">
                        <select
                          value={lead.status}
                          onChange={(event) => changeLeadStatus(lead, event.target.value)}
                          aria-label={`Status for ${lead.name || lead.phone}`}
                          className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                            statusTint[lead.status] || "bg-gray-100"
                          }`}
                        >
                          {LEAD_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {!leads.length && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted">
                        No leads yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- Homepage content ---------------- */}
        {tab === "content" && (
          <form onSubmit={saveContent} className="card max-w-2xl p-6">
            <h2 className="mb-5 text-xl font-extrabold text-navy-700">Homepage content</h2>
            <div className="space-y-4">
              {[
                ["heroHeadline", "Hero headline"],
                ["heroSubline", "Hero subline"],
                ["heroImage", "Hero image URL"],
                ["featuredTitle", "Featured section title"],
                ["featuredSubtitle", "Featured section subtitle"],
                ["rentalTitle", "Rental section title"],
                ["announcement", "Announcement"],
                ["nriPopupTitle", "NRI popup — title (leave blank to hide the popup)"],
                ["nriPopupBody", "NRI popup — message"],
                ["nriPopupCta", "NRI popup — button label"],
              ].map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    className="field"
                    value={content[key] || ""}
                    onChange={(event) => setContent((prev) => ({ ...prev, [key]: event.target.value }))}
                  />
                </Field>
              ))}
            </div>
            <button type="submit" className="btn-brand mt-6">
              Save content
            </button>
          </form>
        )}

        {/* ---------------- Settings ---------------- */}
        {tab === "settings" && (
          <div className="card max-w-2xl p-6">
            <h2 className="mb-2 text-xl font-extrabold text-navy-700">Access</h2>

            {session.configured ? (
              <>
                <p className="mb-5 text-sm leading-relaxed text-muted">
                  Signed in as <strong className="text-navy-700">{session.username}</strong>. The
                  session expires after 12 hours. To change the username or password, update{" "}
                  <code className="font-mono">ADMIN_USERNAME</code> /{" "}
                  <code className="font-mono">ADMIN_PASSWORD</code> on the server and restart —
                  changing the password signs out every device.
                </p>
                <button type="button" className="btn-outline" onClick={signOut}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <strong className="font-extrabold">This admin panel is unprotected.</strong> Set{" "}
                  <code className="font-mono">ADMIN_USERNAME</code> and{" "}
                  <code className="font-mono">ADMIN_PASSWORD</code> on the server to require a login.
                </div>
                <p className="mb-3 text-sm leading-relaxed text-muted">
                  Alternatively, if the server sets a static{" "}
                  <code className="font-mono">ADMIN_TOKEN</code>, enter it here to authorise writes.
                </p>
                <div className="flex gap-3">
                  <input
                    className="field"
                    type="password"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="Admin token"
                  />
                  <button
                    type="button"
                    className="btn-brand shrink-0"
                    onClick={() => {
                      setAdminToken(token);
                      flash("Token saved to this browser.");
                    }}
                  >
                    Save
                  </button>
                </div>
              </>
            )}

            <h3 className="mt-8 mb-2 font-extrabold text-navy-700">CSV import columns</h3>
            <p className="rounded-lg bg-surface p-3 font-mono text-xs leading-relaxed break-words text-muted">
              {PROPERTY_CSV_FIELDS.join(", ")}
            </p>
            <p className="mt-2 text-xs text-muted">
              Multi-value fields (labels, amenities, images, videos) use <code className="font-mono">|</code> as
              the separator. Export first to get a template.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
