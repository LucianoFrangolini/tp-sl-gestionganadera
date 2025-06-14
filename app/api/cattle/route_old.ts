import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * GET /api/cattle
 * Obtiene la lista de ganado con opciones de filtrado
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de búsqueda de la URL
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const zoneId = searchParams.get("zoneId")
    const connected = searchParams.get("connected")
    const lat = searchParams.get("lat") ? Number.parseFloat(searchParams.get("lat") || "") : null
    const lng = searchParams.get("lng") ? Number.parseFloat(searchParams.get("lng") || "") : null
    const radius = searchParams.get("radius") ? Number.parseFloat(searchParams.get("radius") || "") : null

    // Simulación de datos de ganado
    const cattle = [
      {
        id: "cow-1",
        name: "Bella",
        description: "Holstein de 5 años, alta productora de leche",
        imageUrl: "/placeholder.svg?height=200&width=200",
        position: [40.7128, -74.006] as [number, number],
        connected: true,
        zoneId: "farm",
      },
      {
        id: "cow-2",
        name: "Luna",
        description: "Jersey de 3 años, excelente calidad de leche",
        imageUrl: "/placeholder.svg?height=200&width=200",
        position: [40.7138, -74.008] as [number, number],
        connected: true,
        zoneId: "stables",
      },
      {
        id: "cow-3",
        name: "Estrella",
        description: "Angus de 4 años, buena para carne",
        imageUrl: "/placeholder.svg?height=200&width=200",
        position: [40.7148, -74.007] as [number, number],
        connected: false,
        zoneId: "pasture",
      },
      // Otros animales se agregarían aquí
    ]

    // Función para calcular la distancia entre dos puntos (Haversine formula)
    function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371 // Radio de la Tierra en km
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c // Distancia en km
    }

    // Aplicar filtros
    let filteredCattle = cattle

    // Filtrar por término de búsqueda
    if (search) {
      filteredCattle = filteredCattle.filter((cow) => cow.name.toLowerCase().includes(search.toLowerCase()))
    }

    // Filtrar por zona
    if (zoneId) {
      filteredCattle = filteredCattle.filter((cow) => cow.zoneId === zoneId)
    }

    // Filtrar por estado de conexión
    if (connected !== null) {
      const isConnected = connected === "true"
      filteredCattle = filteredCattle.filter((cow) => cow.connected === isConnected)
    }

    // Filtrar por ubicación (coordenadas y radio)
    if (lat !== null && lng !== null && radius !== null) {
      filteredCattle = filteredCattle.filter((cow) => {
        const distance = calculateDistance(lat, lng, cow.position[0], cow.position[1])
        return distance <= radius
      })
    }

    return NextResponse.json(
      {
        success: true,
        data: filteredCattle,
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
