import { NextResponse } from "next/server";
import { deleteCourseNote, updateCourseNote, MoodleError } from "@/lib/moodle";

export async function PATCH(request: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  const body = await request.json();

  try {
    await updateCourseNote(Number(noteId), body.content);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al actualizar la nota";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;

  try {
    await deleteCourseNote(Number(noteId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al borrar la nota";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
