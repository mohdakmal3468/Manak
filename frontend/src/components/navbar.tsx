import Link from "next/link";

const linkClass =
  "text-sm font-medium text-slate-600 transition-colors hover:text-brand-700";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200/80 bg-white">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-8"
      >
        <Link
          href="/"
          className="text-lg font-bold tracking-[0.14em] text-ink"
          aria-label="MANAK home"
        >
          MANAK
        </Link>
        <div className="flex items-center gap-5 sm:gap-7">
          <Link href="/explore" className={linkClass}>
            Explore
          </Link>
          <Link href="/dashboard" className={linkClass}>
            Dashboard
          </Link>
          <Link href="/submit" className={linkClass}>
            Upload Project
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className={linkClass}>
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
}
