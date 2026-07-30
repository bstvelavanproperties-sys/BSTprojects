// Shared by every static page. Was a local const inside pages/Static.jsx, which is
// why it could not be reused once those pages became separate files.
export default function PageHero({ title, subtitle }) {
  return (
    <section className="bg-navy-900 py-14">
      <div className="container-page text-center">
        <h1 className="mb-2 text-4xl font-extrabold text-white sm:text-5xl">{title}</h1>
        {subtitle && <p className="mx-auto max-w-2xl text-white/70">{subtitle}</p>}
      </div>
    </section>
  );
}
