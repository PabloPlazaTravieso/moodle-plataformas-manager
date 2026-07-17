import { NextResponse } from "next/server";
import { deleteCategory, getCategories, MoodleError } from "@/lib/moodle";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categoryId = Number(id);

  try {
    const categories = await getCategories();
    const category = categories.find((c) => c.id === categoryId);

    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
    }

    if (category.parent === 0) {
      // Moodle refuses to delete a top-level category without being told where to move its
      // contents (it won't fall back to "root" on its own). Prefer moving to another existing
      // top-level category; only delete recursively (destroying any courses inside) as a last
      // resort, and only when there truly is nowhere else to put them.
      const otherRoot = categories.find((c) => c.parent === 0 && c.id !== categoryId);

      if (otherRoot) {
        await deleteCategory(categoryId, { newParentId: otherRoot.id });
      } else {
        await deleteCategory(categoryId, { recursive: true });
      }
    } else {
      await deleteCategory(categoryId, { newParentId: category.parent });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al borrar la categoría";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
