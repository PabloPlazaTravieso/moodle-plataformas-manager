import { NextRequest, NextResponse } from "next/server";
import { deleteUser, updateUser, MoodleError } from "@/lib/moodle";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  try {
    await updateUser({
      id: Number(id),
      firstname: body.firstname,
      lastname: body.lastname,
      email: body.email,
      suspended: body.suspended,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al actualizar el usuario";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await deleteUser(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al borrar el usuario";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
