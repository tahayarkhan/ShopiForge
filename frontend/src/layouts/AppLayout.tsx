import { NavLink, Outlet } from 'react-router-dom';

/** Small geometric mark — reads as "SF" even without the wordmark */
function ForgeMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Rounded square “forge plate” */}
      <rect
        x="1"
        y="1"
        width="26"
        height="26"
        rx="6"
        fill="var(--color-forge)"
      />
      {/* Simplified S / flame curve */}
      <path
        d="M8.5 18.5c1.8 1.6 4.2 2 6.2.6 1.6-1.1 2-2.8 1.2-4.2-.6-1.1-1.8-1.6-3.2-1.8-1.2-.2-2-.6-2.2-1.4-.2-.8.4-1.5 1.6-1.7 1.4-.3 2.8.2 3.8 1.2"
        stroke="var(--color-paper)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* F stem */}
      <path
        d="M18 8.5v11M18 8.5h3.5M18 13.5h2.5"
        stroke="var(--color-paper)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen">
      {/* 2.2 — header surface (not flat white) */}
      <header
        className="border-b border-[var(--color-ink)]/10 bg-[var(--color-paper)]/80 backdrop-blur-md"
      >
        {/* Same max width as <main> so header + page content align */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          {/* Left: mark + wordmark */}
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 no-underline"
          >
            <ForgeMark />
            <span
              className="text-lg font-semibold tracking-tight text-[var(--color-ink)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ShopiForge
            </span>
          </NavLink>

          {/* Center/right nav */}
          <nav className="flex items-center gap-6 text-sm">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                [
                  'transition-colors',
                  isActive
                    ? 'font-semibold text-[var(--color-forge)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]',
                ].join(' ')
              }
            >
              Dashboard
            </NavLink>

            {/* Right slot for shop domain — wire in Step 3.
                Keep the placeholder so the layout already has a home for it. */}
            {/* <span className="text-[var(--color-muted)]">mystore.myshopify.com</span> */}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}