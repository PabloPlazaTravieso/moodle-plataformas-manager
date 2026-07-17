import { getActivityLog, getSiteInfo } from "@/lib/moodle";
import { ActivityCharts } from "./activity-charts";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  let error: string | null = null;
  let info: Awaited<ReturnType<typeof getSiteInfo>> | null = null;
  let logEntries: Awaited<ReturnType<typeof getActivityLog>> = [];

  // Run both Moodle calls in parallel: they're independent, and this environment's
  // requests are slow enough that running them sequentially roughly doubles load time.
  const [infoResult, logResult] = await Promise.allSettled([getSiteInfo(), getActivityLog()]);

  if (infoResult.status === "fulfilled") {
    info = infoResult.value;
  } else {
    error = infoResult.reason instanceof Error ? infoResult.reason.message : "Error desconocido al conectar con Moodle";
  }

  if (logResult.status === "fulfilled") {
    logEntries = logResult.value;
  }
  // If logResult rejected, the dashboard still works without the charts.

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          No se pudo conectar con Moodle: {error}
        </p>
      )}

      {info && (
        <>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            {info.fullname} ({info.shortname}) — {info.release}
          </p>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Usuarios" value={info.usercount} />
            <StatCard label="Cursos" value={info.coursecount} />
            <StatCard label="Versión" value={info.version} />
            <StatCard label="Release" value={info.release} />
          </div>

          <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">Actividad reciente</h2>
          <ActivityCharts entries={logEntries} />
        </>
      )}
    </div>
  );
}
