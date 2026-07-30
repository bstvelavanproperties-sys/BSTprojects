import { useMemo, useState } from "react";
import { calculateEmi, formatFullINR, formatINR } from "../lib/format.js";

export default function EmiCalculator({ price = 0 }) {
  const [downPercent, setDownPercent] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const principal = Math.max(0, Math.round(price * (1 - downPercent / 100)));
  const { emi, total, interest } = useMemo(
    () => calculateEmi(principal, rate, years),
    [principal, rate, years],
  );

  if (!price) return null;

  const Row = ({ id, label, value, children }) => (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-bold text-navy-700">
          {label}
        </label>
        <span className="text-sm font-extrabold text-brand-500">{value}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="card p-6">
      <h3 className="mb-1 text-xl font-extrabold text-navy-700">Home loan EMI</h3>
      <p className="mb-5 text-sm text-muted">An estimate — your bank's terms will differ.</p>

      <div className="space-y-4">
        <Row id="emi-down" label="Down payment" value={`${downPercent}% · ${formatINR(price - principal)}`}>
          <input
            id="emi-down"
            type="range"
            min={0}
            max={80}
            step={5}
            value={downPercent}
            onChange={(event) => setDownPercent(Number(event.target.value))}
            className="w-full accent-brand-500"
          />
        </Row>

        <Row id="emi-rate" label="Interest rate" value={`${rate}%`}>
          <input
            id="emi-rate"
            type="range"
            min={6}
            max={15}
            step={0.1}
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
            className="w-full accent-brand-500"
          />
        </Row>

        <Row id="emi-years" label="Loan term" value={`${years} years`}>
          <input
            id="emi-years"
            type="range"
            min={1}
            max={30}
            step={1}
            value={years}
            onChange={(event) => setYears(Number(event.target.value))}
            className="w-full accent-brand-500"
          />
        </Row>
      </div>

      <div className="mt-6 rounded-xl bg-tint p-5 text-center">
        <p className="mb-1 text-sm font-bold text-muted">Monthly EMI</p>
        <p className="text-3xl font-extrabold text-brand-500">
          {formatFullINR(Math.round(emi))}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        {[
          ["Loan amount", formatINR(principal)],
          ["Interest", formatINR(Math.round(interest))],
          ["Total payable", formatINR(Math.round(total))],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-100 p-2.5">
            <dt className="mb-0.5 text-muted">{label}</dt>
            <dd className="font-extrabold text-navy-700">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
