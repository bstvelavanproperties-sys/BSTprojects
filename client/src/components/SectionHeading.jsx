export default function SectionHeading({ title, subtitle, className = "" }) {
  return (
    <div className={`mb-10 text-center ${className}`}>
      <h2 className="h-section">{title}</h2>
      {subtitle && <p className="mt-3 text-base text-muted">{subtitle}</p>}
    </div>
  );
}
