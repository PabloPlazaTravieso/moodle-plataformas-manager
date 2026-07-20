import { NextResponse } from "next/server";
import { deleteCourseNote, MoodleError } from "@/lib/moodle";

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
