"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12 11.204 3.045a1.125 1.125 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
      />
    ),
  },
  {
    href: "/courses",
    label: "Cursos",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
      />
    ),
  },
  {
    href: "/categories",
    label: "Categorías",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122"
      />
    ),
  },
  {
    href: "/users",
    label: "Usuarios",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname.startsWith("/login")) {
    return null;
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex flex-col justify-between border-b border-brand-blue-800 bg-brand-blue-975 text-brand-blue-50 md:sticky md:top-0 md:h-screen md:w-64 md:flex-none md:border-b-0 md:border-r">
      <div>
        <div className="flex items-center gap-3 px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand asset from a trusted external CDN, not user content */}
          <img
            src="https://media.awakelab.world/MARCA_AWK26/awakelab_isotipo_fondo-oscuro_transparente.png"
            alt="Awakelab"
            className="h-8 w-8"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">Gestor de plataformas</p>
            <p className="text-xs text-brand-blue-300">Moodle · Awakelab</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex shrink-0 items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition ${
                  active
                    ? "border-brand-cyan-500 bg-white/5 font-medium text-brand-cyan-400"
                    : "border-transparent text-brand-blue-100 hover:bg-white/5 hover:text-white"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="size-5 shrink-0"
                >
                  {link.icon}
                </svg>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-brand-blue-100 transition hover:bg-white/5 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5 shrink-0">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3H21"
            />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
