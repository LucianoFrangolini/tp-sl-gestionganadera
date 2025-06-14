import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getDb } from "@/lib/mongodb"

// Sanitizador simple para strings
function sanitizeString(str: string, maxLen = 100) {
  return str.replace(/[^\w\s@.áéíóúÁÉÍÓÚñÑ-]/g, "").slice(0, maxLen)
}

/**
 * GET /api/cattle
 * Permite filtrar por término, zona, estado de conexión y búsqueda geoespacial
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const cattleCollection = db.collection("cattle")

    const searchParams = request.nextUrl.searchParams
    const searchRaw = searchParams.get("search") || ""
    const zoneId = sanitizeString(searchParams.get("zoneId") || "")
    const connected = searchParams.get("connected")
    const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat") || "") : null
    const lng = searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng") || "") : null
    const radius = searchParams.get("radius") ? Number.parseFloat(searchParams.get("radius") || "") : null

    // Construir query
    const query: any = {}

    // Filtro por término de búsqueda
    if (searchRaw) {
      const search = sanitizeString(searchRaw)
      const safeRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      query.$or = [
        { name: safeRegex },
        { description: safeRegex },
      ]
    }

    // Filtro por zona
    if (zoneId) {
      query.zoneId = zoneId
    }

    // Filtro por estado de conexión
    if (connected === "true" || connected === "false") {
      query.connected = connected === "true"
    }

    // Filtro geoespacial
    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      typeof radius === "number" &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      !isNaN(radius)
    ) {
      // Mongo espera el radio en metros
      query.position = {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radius * 1000, // km a metros
        },
      }
    }

    // Buscar en la base
    const cattle = await cattleCollection.find(query).toArray()

    return NextResponse.json(
      {
        success: true,
        data: cattle,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al obtener ganado:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener ganado",
      },
      { status: 500 },
    )
  }
}
