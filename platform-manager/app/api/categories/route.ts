import { NextRequest, NextResponse } from "next/server";
import { createCategory, getCategories, MoodleError } from "@/lib/moodle";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al obtener las categorías";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const result = await createCategory({
      name: body.name,
      parent: body.parent ? Number(body.parent) : undefined,
    });
    return NextResponse.json({ category: result[0] });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al crear la categoría";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
