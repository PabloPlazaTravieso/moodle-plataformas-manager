import { NextRequest, NextResponse } from "next/server";
import { createUser, getUsers, MoodleError } from "@/lib/moodle";

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({ users });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al obtener los usuarios";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const result = await createUser({
      username: body.username,
      password: body.password,
      firstname: body.firstname,
      lastname: body.lastname,
      email: body.email,
    });
    return NextResponse.json({ user: result[0] });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al crear el usuario";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
