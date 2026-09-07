export function CatalogueUnavailable() {
  return (
    <section className="border border-[#dfd2be] bg-[#fffdf8] px-6 py-14 text-center">
      <p className="eyebrow">Catalogue pause</p>
      <h2 className="mt-3 font-serif text-3xl text-[#332a22]">The collection is resting for a moment.</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#68584a]">The catalogue needs its database connection before it can be displayed. Please configure the local PostgreSQL environment and try again.</p>
    </section>
  );
}
