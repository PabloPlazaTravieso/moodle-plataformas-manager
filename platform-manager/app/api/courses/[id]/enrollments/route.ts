import { NextRequest, NextResponse } from "next/server";
import { enrolUser, getEnrolledUsers, MoodleError } from "@/lib/moodle";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const users = await getEnrolledUsers(Number(id));
    return NextResponse.json({ users });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al obtener los matriculados";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  try {
    await enrolUser(Number(id), Number(body.userid));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al matricular al alumno";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
