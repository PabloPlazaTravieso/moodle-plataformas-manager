import { NextRequest, NextResponse } from "next/server";
import { deleteCourse, updateCourse, MoodleError } from "@/lib/moodle";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  try {
    await updateCourse({
      id: Number(id),
      fullname: body.fullname,
      shortname: body.shortname,
      categoryid: Number(body.categoryid),
      summary: body.summary,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al actualizar el curso";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await deleteCourse(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al borrar el curso";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
