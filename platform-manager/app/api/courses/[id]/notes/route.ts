import { NextRequest, NextResponse } from "next/server";
import { addCourseNote, getCourseNotes, MoodleError } from "@/lib/moodle";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const notes = await getCourseNotes(Number(id));
    return NextResponse.json({ notes });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al obtener las notas";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  try {
    const result = await addCourseNote(Number(id), body.content);
    return NextResponse.json({ note: result });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al añadir la nota";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
