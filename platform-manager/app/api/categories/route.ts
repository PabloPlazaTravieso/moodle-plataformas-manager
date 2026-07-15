import { NextResponse } from "next/server";
import { getCategories, MoodleError } from "@/lib/moodle";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al obtener las categorías";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
