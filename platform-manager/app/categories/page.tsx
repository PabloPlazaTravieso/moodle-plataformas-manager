"use client";

import { useEffect, useState } from "react";
import type { CourseCategory } from "@/lib/moodle";
import { useToast } from "../components/toast";

export default function CategoriesPage() {
  const { notify } = useToast();
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("0");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadCategories() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/categories");
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Error al cargar las categorías");
    } else {
      setCategories(data.categories);
    }

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    loadCategories();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setCreating(true);

    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parent }),
    });
    const data = await response.json();

    setCreating(false);

    if (!response.ok) {
      setFormError(data.error ?? "Error al crear la categoría");
      return;
    }

    notify(`Categoría "${name}" creada`);
    setName("");
    setParent("0");
    setShowForm(false);
    await loadCategories();
  }

  async function handleDelete(category: CourseCategory) {
    if (
      !confirm(
        `¿Borrar la categoría "${category.name}"? Si es posible, sus cursos se moverán a otra categoría; si no queda ninguna disponible, se borrarán junto con la categoría.`,
      )
    ) {
      return;
    }

    const response = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      notify(data.error ?? "Error al borrar la categoría", "error");
      return;
    }

    notify(`Categoría "${category.name}" borrada`);
    await loadCategories();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-blue-975 dark:text-brand-blue-50">Categorías</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-brand-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-800 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
        >
          {showForm ? "Cancelar" : "+ Nueva categoría"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-brand-blue-100 bg-white p-6 shadow-sm dark:border-brand-blue-800 dark:bg-brand-blue-975"
        >
          <h2 className="mb-4 text-sm font-medium text-brand-blue-975 dark:text-brand-blue-50">Crear categoría</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <select
              className="rounded-md border border-brand-blue-100 px-3 py-2 text-sm dark:border-brand-blue-700 dark:bg-brand-blue-950"
              value={parent}
              onChange={(e) => setParent(e.target.value)}
            >
              <option value="0">Sin categoría padre (raíz)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={creating}
            className="mt-4 rounded-md bg-brand-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-800 disabled:opacity-50 dark:bg-brand-cyan-600 dark:text-brand-blue-999 dark:hover:bg-brand-cyan-500"
          >
            {creating ? "Creando..." : "Crear categoría"}
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-brand-blue-400">Cargando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <table className="w-full overflow-hidden rounded-xl border border-brand-blue-100 text-left text-sm dark:border-brand-blue-800">
          <thead className="bg-brand-blue-50 dark:bg-brand-blue-900/40">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Categoría padre</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-blue-100 bg-white dark:divide-brand-blue-800 dark:bg-brand-blue-975">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-2">{category.name}</td>
                <td className="px-4 py-2">
                  {category.parent === 0
                    ? "—"
                    : (categories.find((c) => c.id === category.parent)?.name ?? category.parent)}
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => handleDelete(category)} className="text-sm text-red-600 hover:text-red-800">
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-brand-blue-400">
                  No hay categorías todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
