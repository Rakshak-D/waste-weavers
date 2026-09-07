import Link from "next/link";

export default function ProductNotFound() {
  return <main className="min-h-screen bg-[#f7f2e9] px-5 py-24 text-center text-[#332a22]"><p className="eyebrow">Piece not found</p><h1 className="mt-4 font-serif text-5xl">This weave is elsewhere.</h1><p className="mx-auto mt-4 max-w-md text-[#68584a]">The piece may have been archived or the link may be incorrect.</p><Link className="mt-8 inline-block rounded-full bg-[#5f4630] px-6 py-3 text-sm font-medium text-[#fffdf8]" href="/shop">Back to the collection</Link></main>;
}
