import { getSiteInfo } from "@/lib/moodle";

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

  try {
    info = await getSiteInfo();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido al conectar con Moodle";
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Usuarios" value={info.usercount} />
            <StatCard label="Cursos" value={info.coursecount} />
            <StatCard label="Versión" value={info.version} />
            <StatCard label="Release" value={info.release} />
          </div>
        </>
      )}
    </div>
  );
}
