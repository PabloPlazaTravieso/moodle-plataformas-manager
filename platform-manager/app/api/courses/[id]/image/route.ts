import { NextRequest, NextResponse } from "next/server";
import { fetchCourseImage, getCourses, MoodleError, uploadCourseImage } from "@/lib/moodle";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const courses = await getCourses();
    const course = courses.find((c) => c.id === Number(id));

    if (!course?.imageurl) {
      return NextResponse.json({ error: "Este curso no tiene imagen" }, { status: 404 });
    }

    const moodleResponse = await fetchCourseImage(course.imageurl);
    const contentType = moodleResponse.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(moodleResponse.body, {
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al obtener la imagen del curso";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se ha recibido ningún archivo" }, { status: 400 });
  }

  try {
    await uploadCourseImage(Number(id), file);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof MoodleError ? e.message : "Error al subir la imagen del curso";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
