import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

/**
 * GET /api/zones
 * Obtiene la lista de zonas
 */
export async function GET() {
  try {
    const db = await getDb()
    const zones = await db.collection("zones").find().toArray()
    return NextResponse.json(
      {
        success: true,
        data: zones,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al obtener zonas:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener zonas",
      },
      { status: 500 },
    )
  }
}
