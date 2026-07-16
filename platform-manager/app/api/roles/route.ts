import { NextResponse } from "next/server";
import { getAssignableRoles, MoodleError } from "@/lib/moodle";

export async function GET() {
  try {
    const roles = await getAssignableRoles();
    return NextResponse.json({ roles });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al obtener los roles";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
