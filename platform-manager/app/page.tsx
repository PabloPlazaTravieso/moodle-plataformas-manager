import Link from "next/link";
import { getActivityLog, getCourses, getSiteInfo } from "@/lib/moodle";
import { ActivityCharts } from "./activity-charts";

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-brand-blue-100 bg-white p-6 shadow-sm dark:border-brand-blue-800 dark:bg-brand-blue-975">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-cyan-50 text-brand-blue-900 dark:bg-brand-blue-900/40 dark:text-brand-cyan-400">
        {icon}
      </div>
      <p className="text-sm text-brand-blue-500 dark:text-brand-blue-300">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-blue-975 dark:text-brand-blue-50">{value}</p>
    </div>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-5">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default async function DashboardPage() {
  let error: string | null = null;
  let info: Awaited<ReturnType<typeof getSiteInfo>> | null = null;
  let logEntries: Awaited<ReturnType<typeof getActivityLog>> = [];
  let recentCourses: Awaited<ReturnType<typeof getCourses>> = [];

  // Run all three Moodle calls in parallel: they're independent, and this environment's
  // requests are slow enough that running them sequentially roughly triples load time.
  const [infoResult, logResult, coursesResult] = await Promise.allSettled([
    getSiteInfo(),
    getActivityLog(),
    getCourses(),
  ]);

  if (infoResult.status === "fulfilled") {
    info = infoResult.value;
  } else {
    error = infoResult.reason instanceof Error ? infoResult.reason.message : "Error desconocido al conectar con Moodle";
  }

  if (logResult.status === "fulfilled") {
    logEntries = logResult.value;
  }
  // If logResult or coursesResult rejected, the dashboard still works without that widget.

  if (coursesResult.status === "fulfilled") {
    recentCourses = [...coursesResult.value].sort((a, b) => b.id - a.id).slice(0, 5);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-brand-blue-975 dark:text-brand-blue-50">Dashboard</h1>
      <p className="mb-6 text-sm text-brand-blue-500 dark:text-brand-blue-300">
        Resumen general de la plataforma Moodle gestionada.
      </p>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          No se pudo conectar con Moodle: {error}
        </p>
      )}

      {info && (
        <>
          <p className="mb-6 text-brand-blue-600 dark:text-brand-blue-300">
            {info.fullname} ({info.shortname}) — {info.release}
          </p>

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Usuarios"
              value={info.usercount}
              icon={<Icon path="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />}
            />
            <StatCard
              label="Cursos"
              value={info.coursecount}
              icon={<Icon path="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />}
            />
            <StatCard label="Versión" value={info.version} icon={<Icon path="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />} />
            <StatCard
              label="Release"
              value={info.release}
              icon={<Icon path="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437 1.745-1.437m6.615 8.206L3.75 12" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-4 text-lg font-medium text-brand-blue-975 dark:text-brand-blue-50">Actividad reciente</h2>
              <ActivityCharts entries={logEntries} />
            </div>

            <div>
              <h2 className="mb-4 text-lg font-medium text-brand-blue-975 dark:text-brand-blue-50">Cursos recientes</h2>
              <div className="rounded-xl border border-brand-blue-100 bg-white shadow-sm dark:border-brand-blue-800 dark:bg-brand-blue-975">
                <ul className="divide-y divide-brand-blue-100 dark:divide-brand-blue-800">
                  {recentCourses.map((course) => (
                    <li key={course.id}>
                      <Link
                        href={`/courses/${course.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-brand-cyan-50 dark:hover:bg-brand-blue-900/30"
                      >
                        <span className="truncate font-medium text-brand-blue-975 dark:text-brand-blue-50">
                          {course.fullname}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            course.visible
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-brand-blue-100 text-brand-blue-600 dark:bg-brand-blue-800 dark:text-brand-blue-300"
                          }`}
                        >
                          {course.visible ? "Visible" : "Oculto"}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {recentCourses.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-brand-blue-400">No hay cursos todavía.</li>
                  )}
                </ul>
                <Link
                  href="/courses"
                  className="block border-t border-brand-blue-100 px-4 py-3 text-center text-sm font-medium text-brand-blue-600 hover:text-brand-blue-800 dark:border-brand-blue-800 dark:text-brand-blue-300 dark:hover:text-brand-cyan-400"
                >
                  Ver todos los cursos →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
