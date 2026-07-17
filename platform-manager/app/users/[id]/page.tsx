"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { MoodleUser, UserCourse } from "@/lib/moodle";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [user, setUser] = useState<MoodleUser | null>(null);
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      const [usersRes, coursesRes] = await Promise.all([
        fetch("/api/users"),
        fetch(`/api/users/${userId}/courses`),
      ]);
      const usersData = await usersRes.json();
      const coursesData = await coursesRes.json();

      if (!usersRes.ok) {
        setError(usersData.error ?? "Error al cargar el usuario");
      } else {
        const found = usersData.users.find((u: MoodleUser) => u.id === Number(userId));
        setUser(found ?? null);
      }

      if (coursesRes.ok) {
        setCourses(coursesData.courses);
      }

      setLoading(false);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    loadData();
  }, [userId]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/users" className="mb-6 inline-block text-sm text-slate-500 hover:underline dark:text-slate-400">
        ← Volver a Usuarios
      </Link>

      {loading && <p className="text-sm text-slate-500">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && !user && <p className="text-sm text-slate-500">Usuario no encontrado.</p>}

      {!loading && user && (
        <>
          <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {user.firstname} {user.lastname}
          </h1>
          <p className="mb-6 text-slate-500 dark:text-slate-400">
            {user.username} · {user.email}
          </p>

          <div className="mb-8 flex flex-wrap gap-2">
            {user.roles.length > 0 ? (
              user.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                >
                  {role}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Sin roles asignados</span>
            )}
          </div>

          <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">Cursos matriculados</h2>

          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {courses.map((course) => (
              <li key={course.id} className="flex items-center justify-between px-4 py-3">
                <Link href={`/courses/${course.id}`} className="text-sm font-medium text-slate-900 hover:underline dark:text-slate-100">
                  {course.fullname}
                </Link>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    course.visible
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {course.visible ? "Visible" : "Oculto"}
                </span>
              </li>
            ))}
            {courses.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">No está matriculado en ningún curso.</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
