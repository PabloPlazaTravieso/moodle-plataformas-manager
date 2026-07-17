import { NextRequest, NextResponse } from "next/server";
import { createCourse, getCourses, MoodleError } from "@/lib/moodle";

export async function GET() {
  try {
    const courses = await getCourses();
    return NextResponse.json({ courses });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al obtener los cursos";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const result = await createCourse({
      fullname: body.fullname,
      shortname: body.shortname,
      categoryid: Number(body.categoryid),
      summary: body.summary,
      startdate: body.startdate ? Number(body.startdate) : undefined,
      enddate: body.enddate ? Number(body.enddate) : undefined,
    });
    return NextResponse.json({ course: result[0] });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al crear el curso";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
