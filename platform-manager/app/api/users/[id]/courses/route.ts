import { NextResponse } from "next/server";
import { getUserCourses, MoodleError } from "@/lib/moodle";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const courses = await getUserCourses(Number(id));
    return NextResponse.json({ courses });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al obtener los cursos del usuario";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
