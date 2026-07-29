import { useState } from "react";
import brand from "./data/brand.js";
import { adminLogin } from "./lib/api.js";

export default function AdminLogin({ onSuccess }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    try {
      await adminLogin(form.username, form.password);
      onSuccess();
    } catch (problem) {
      setError(problem.message || "Sign in failed.");
      setForm((prev) => ({ ...prev, password: "" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-7">
        <div className="mb-6 flex items-center gap-3">
          <img src={brand.logo} alt="" className="h-10 w-10 rounded-full object-contain" />
          <span className="font-extrabold text-navy-700">{brand.shortName} Admin</span>
        </div>

        <h1 className="mb-1 text-xl font-extrabold text-navy-700">Sign in</h1>
        <p className="mb-6 text-sm text-muted">Enter your admin username and password.</p>

        <label className="mb-1 block text-sm font-bold text-navy-700" htmlFor="admin-username">
          Username
        </label>
        <input
          id="admin-username"
          className="field mb-4"
          value={form.username}
          onChange={set("username")}
          autoComplete="username"
          autoFocus
          required
        />

        <label className="mb-1 block text-sm font-bold text-navy-700" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          className="field"
          type="password"
          value={form.password}
          onChange={set("password")}
          autoComplete="current-password"
          required
        />

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-brand-50 p-3 text-sm font-semibold text-brand-500">
            {error}
          </p>
        )}

        <button type="submit" className="btn-brand mt-6 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
