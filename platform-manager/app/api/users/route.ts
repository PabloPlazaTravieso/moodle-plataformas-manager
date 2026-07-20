import { NextRequest, NextResponse } from "next/server";
import { createUser, getUsers, MoodleError } from "@/lib/moodle";
import { csvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  try {
    const users = await getUsers();

    if (request.nextUrl.searchParams.get("export") === "csv") {
      return csvResponse("usuarios.csv", [
        ["username", "firstname", "lastname", "email", "roles", "confirmed", "suspended"],
        ...users.map((u) => [
          u.username,
          u.firstname,
          u.lastname,
          u.email,
          u.roles.join(" "),
          u.confirmed,
          u.suspended,
        ]),
      ]);
    }

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
