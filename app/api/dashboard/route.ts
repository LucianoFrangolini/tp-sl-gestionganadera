import { NextResponse } from "next/server"

/**
 * GET /api/dashboard
 * Obtiene los datos para el dashboard
 */
export async function GET(request: Request) {
  try {
    // Simulación de datos para el dashboard
    const dashboardData = {
      totalCattle: 20,
      connectedCattle: 18,
      totalZones: 7,
      alerts: 0,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        data: dashboardData,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener datos del dashboard",
      },
      { status: 500 },
    )
  }
}
