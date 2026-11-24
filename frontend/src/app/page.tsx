import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-16 sm:px-8 sm:py-24">
      <section className="max-w-3xl">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-brand-700">
          A community for builders
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
          Build with purpose. Grow with feedback.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Share your work, get thoughtful peer reviews, and see how each new
          version moves your project forward.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            Explore projects
          </Link>
          <Link
            href="/submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            Upload a project
          </Link>
        </div>
      </section>
    </main>
  );
}
