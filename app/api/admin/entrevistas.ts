import { NextResponse } from "next/server";

// Aquí pondrías tu lógica real para guardar en DB
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("💾 Guardando entrevista:", data);

    // TODO: Guardar en tu DB

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error guardando entrevista:", error);
    return NextResponse.json({ error: "Error guardando entrevista" }, { status: 500 });
  }
}
