"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Course, CourseCategory } from "@/lib/moodle";
import { useToast } from "../components/toast";

const PAGE_SIZE = 6;

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function timestampToDateInput(timestamp: number): string {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function dateInputToTimestamp(value: string): number | undefined {
  if (!value) return undefined;
  return Math.floor(new Date(`${value}T00:00:00Z`).getTime() / 1000);
}

const PLACEHOLDER_GRADIENTS = [
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-fuchsia-400 to-purple-600",
  "from-rose-400 to-pink-600",
];

function CourseCard({
  course,
  categoryName,
  categories,
  onChanged,
}: {
  course: Course;
  categoryName: string;
  categories: CourseCategory[];
  onChanged: () => void;
}) {
  const gradient = PLACEHOLDER_GRADIENTS[course.id % PLACEHOLDER_GRADIENTS.length];
  const { notify } = useToast();

  const [editing, setEditing] = useState(false);
  const [fullname, setFullname] = useState(course.fullname);
  const [shortname, setShortname] = useState(course.shortname);
  const [summary, setSummary] = useState(course.summary);
  const [categoryid, setCategoryid] = useState(String(course.categoryid));
  const [startdate, setStartdate] = useState(timestampToDateInput(course.startdate));
  const [enddate, setEnddate] = useState(timestampToDateInput(course.enddate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullname,
        shortname,
        categoryid,
        summary,
        startdate: dateInputToTimestamp(startdate),
        enddate: dateInputToTimestamp(enddate),
      }),
    });
    const data = await response.json();

    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Error al actualizar el curso");
      return;
    }

    setEditing(false);
    notify(`Curso "${fullname}" actualizado`);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar el curso "${course.fullname}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const response = await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      notify(data.error ?? "Error al borrar el curso", "error");
      return;
    }

    notify(`Curso "${course.fullname}" borrado`);
    onChanged();
  }

  async function handleToggleVisible() {
    const response = await fetch(`/api/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !course.visible }),
    });
    const data = await response.json();

    if (!response.ok) {
      notify(data.error ?? "Error al cambiar la visibilidad del curso", "error");
      return;
    }

    onChanged();
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="flex flex-col gap-2 rounded-xl border border-brand-blue-100 bg-white p-5 shadow-sm dark:border-brand-blue-800 dark:bg-brand-blue-975"
      >
        <input
          className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
          placeholder="Nombre completo"
          required
        />
        <input
          className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
          value={shortname}
          onChange={(e) => setShortname(e.target.value)}
          placeholder="Nombre corto"
          required
        />
        <select
          className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
          value={categoryid}
          onChange={(e) => setCategoryid(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <textarea
          className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Resumen del curso (opcional)"
          rows={3}
        />
        <div className="flex gap-2">
          <label className="flex-1 text-xs text-brand-blue-500 dark:text-brand-blue-300">
            Inicio
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              value={startdate}
              onChange={(e) => setStartdate(e.target.value)}
            />
          </label>
          <label className="flex-1 text-xs text-brand-blue-500 dark:text-brand-blue-300">
            Fin
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              value={enddate}
              onChange={(e) => setEnddate(e.target.value)}
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="mt-1 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-md bg-brand-blue-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-blue-800 disabled:opacity-50 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 rounded-md border border-brand-blue-100 px-3 py-1.5 text-sm dark:border-brand-blue-700"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-brand-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-brand-blue-800 dark:bg-brand-blue-975">
      <Link href={`/courses/${course.id}`}>
        {course.imageurl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Moodle image proxied through our own API
          <img
            src={`/api/courses/${course.id}/image`}
            alt=""
            className="h-32 w-full object-cover"
          />
        ) : (
          <div className={`flex h-32 w-full items-center justify-center bg-gradient-to-br ${gradient} text-2xl font-semibold text-white/90`}>
            {course.shortname.slice(0, 2).toUpperCase()}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between p-5">
        <Link href={`/courses/${course.id}`}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-medium text-brand-blue-975 group-hover:text-brand-blue-600 dark:text-brand-blue-50 dark:group-hover:text-brand-cyan-400">
              {course.fullname}
            </h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggleVisible();
              }}
              title="Cambiar visibilidad"
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                course.visible
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-brand-blue-100 text-brand-blue-600 hover:bg-brand-blue-200 dark:bg-brand-blue-800 dark:text-brand-blue-300"
              }`}
            >
              {course.visible ? "Visible" : "Oculto"}
            </button>
          </div>
          <p className="text-sm text-brand-blue-500 dark:text-brand-blue-300">{course.shortname}</p>
          <p className="mt-1 text-xs text-brand-blue-400 dark:text-brand-blue-400">{categoryName}</p>
          {course.summary && (
            <p className="mt-2 line-clamp-2 text-sm text-brand-blue-600 dark:text-brand-blue-300">
              {stripHtml(course.summary)}
            </p>
          )}
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <Link
            href={`/courses/${course.id}`}
            className="text-sm font-medium text-brand-blue-600 hover:underline dark:text-brand-blue-300"
          >
            Ver matriculados →
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-brand-blue-500 hover:text-brand-blue-900 dark:text-brand-blue-300 dark:hover:text-brand-cyan-400"
            >
              Editar
            </button>
            <button onClick={handleDelete} className="text-sm text-red-600 hover:text-red-800">
              Borrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const { notify } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [fullname, setFullname] = useState("");
  const [shortname, setShortname] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryid, setCategoryid] = useState("");
  const [startdate, setStartdate] = useState("");
  const [enddate, setEnddate] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    const [coursesRes, categoriesRes] = await Promise.all([fetch("/api/courses"), fetch("/api/categories")]);
    const coursesData = await coursesRes.json();
    const categoriesData = await categoriesRes.json();

    if (!coursesRes.ok) {
      setError(coursesData.error ?? "Error al cargar los cursos");
    } else {
      setCourses(coursesData.courses);
    }

    if (categoriesRes.ok) {
      setCategories(categoriesData.categories);
      if (categoriesData.categories.length > 0) {
        setCategoryid(String(categoriesData.categories[0].id));
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    loadData();
  }, []);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (id: number) => map.get(id) ?? `Categoría ${id}`;
  }, [categories]);

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesTerm = !term || c.fullname.toLowerCase().includes(term) || c.shortname.toLowerCase().includes(term);
      const matchesCategory = !categoryFilter || c.categoryid === Number(categoryFilter);
      return matchesTerm && matchesCategory;
    });
  }, [courses, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageCourses = filteredCourses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setCreating(true);

    const response = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullname,
        shortname,
        categoryid,
        summary,
        startdate: dateInputToTimestamp(startdate),
        enddate: dateInputToTimestamp(enddate),
      }),
    });
    const data = await response.json();

    setCreating(false);

    if (!response.ok) {
      setFormError(data.error ?? "Error al crear el curso");
      return;
    }

    notify(`Curso "${fullname}" creado`);
    setFullname("");
    setShortname("");
    setSummary("");
    setStartdate("");
    setEnddate("");
    setShowForm(false);
    await loadData();
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-blue-975 dark:text-brand-blue-50">Cursos</h1>
        <div className="flex gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not page navigation */}
          <a
            href="/api/courses?export=csv"
            className="rounded-md border border-brand-blue-100 px-4 py-2 text-sm font-medium text-brand-blue-700 hover:bg-brand-blue-50 dark:border-brand-blue-700 dark:text-brand-blue-200 dark:hover:bg-brand-blue-900/40"
          >
            Exportar CSV
          </a>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-brand-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-800 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
          >
            {showForm ? "Cancelar" : "+ Nuevo curso"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-brand-blue-100 bg-white p-6 shadow-sm dark:border-brand-blue-800 dark:bg-brand-blue-975"
        >
          <h2 className="mb-4 text-sm font-medium text-brand-blue-975 dark:text-brand-blue-50">Crear curso</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              placeholder="Nombre completo"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required
            />
            <input
              className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              placeholder="Nombre corto"
              value={shortname}
              onChange={(e) => setShortname(e.target.value)}
              required
            />
            <select
              className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              value={categoryid}
              onChange={(e) => setCategoryid(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="mt-4 w-full rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
            placeholder="Resumen del curso (opcional)"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
          />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <label className="text-xs text-brand-blue-500 dark:text-brand-blue-300">
              Fecha de inicio (opcional)
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
                value={startdate}
                onChange={(e) => setStartdate(e.target.value)}
              />
            </label>
            <label className="text-xs text-brand-blue-500 dark:text-brand-blue-300">
              Fecha de fin (opcional)
              <input
                type="date"
                className="mt-1 w-full rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
                value={enddate}
                onChange={(e) => setEnddate(e.target.value)}
              />
            </label>
          </div>
          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={creating}
            className="mt-4 rounded-md bg-brand-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-800 disabled:opacity-50 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
          >
            {creating ? "Creando..." : "Crear curso"}
          </button>
        </form>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          className="w-full max-w-sm rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-brand-blue-400">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                categoryName={categoryName(course.categoryid)}
                categories={categories}
                onChanged={loadData}
              />
            ))}
            {filteredCourses.length === 0 && (
              <p className="col-span-full py-10 text-center text-brand-blue-400">
                {search ? "Ningún curso coincide con la búsqueda." : "No hay cursos todavía."}
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-brand-blue-100 px-3 py-1.5 disabled:opacity-40 dark:border-brand-blue-700"
              >
                Anterior
              </button>
              <span className="text-brand-blue-400">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-brand-blue-100 px-3 py-1.5 disabled:opacity-40 dark:border-brand-blue-700"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
