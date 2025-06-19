"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
// Quitar imports de mocks
// import { generateMockZones, generateMockCattle } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"

export interface Cattle {
  id: string
  name: string
  description: string
  imageUrl: string
  position: { type: "Point"; coordinates: [number, number] } // GeoJSON
  connected: boolean
  zoneId: string | null
}

export interface Zone {
  id: string
  name: string
  description: string
  bounds: {
    type: "Polygon"
    coordinates: [[[[number, number], [number, number], [number, number], [number, number], [number, number]]]]
  } // GeoJSON
  color: string
}

interface GeoSearch {
  center: [number, number] // lat, lng
  radius: number // in km
}

interface CattleContextType {
  cattle: Cattle[]
  zones: Zone[]
  loading: boolean
  connectedCattle: number
  selectedCattleId: string | null
  setSelectedCattleId: (id: string | null) => void
  selectedZoneId: string | null
  setSelectedZoneId: (id: string | null) => void
  geoSearch: GeoSearch | null
  setGeoSearch: (search: GeoSearch | null) => void
}

const CattleContext = createContext<CattleContextType | undefined>(undefined)

export function CattleProvider({ children }: { children: React.ReactNode }) {
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCattleId, setSelectedCattleId] = useState<string | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [geoSearch, setGeoSearch] = useState<GeoSearch | null>(null)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()

  // Inicializar datos solo si el usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated) return

    async function loadData() {
      setLoading(true)
      try {
        const [zonesRes, cattleRes] = await Promise.all([
          fetch("/api/zones").then((r) => r.json()),
          fetch("/api/cattle").then((r) => r.json()),
        ])
        setZones(zonesRes.data)
        setCattle(cattleRes.data)
      } catch (e) {
        toast({
          title: "Error cargando datos",
          description: String(e),
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Reproducir sonido de bienvenida
    const audio = new Audio("/moo.mp3")
    audio.play().catch((e) => console.log("Error reproduciendo audio:", e))
  }, [isAuthenticated])

  // Función para actualizar la posición de una vaca en la base de datos
  async function updateCowPositionInDb(id: string, lat: number, lng: number) {
    try {
      const res = await fetch("/api/cattle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, lat, lng }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error actualizando posición en la base de datos")
      }
    } catch (e) {
      console.error("Error actualizando posición en la base de datos:", e)
    }
  }

  // Simular movimiento de vacas solo si el usuario está autenticado
  useEffect(() => {
    if (loading || !isAuthenticated || zones.length === 0) return

    const movementInterval = setInterval(() => {
      setCattle((prevCattle) => {
        return prevCattle.map((cow) => {
          // Solo mover vacas conectadas
          if (!cow.connected) return cow

          // Obtener los límites de la granja (primera zona)
          const farmZone = zones[0]
          const { minLat, maxLat, minLng, maxLng } = getBoundsFromPolygon(farmZone.bounds)

          // Movimiento aleatorio pequeño
          const latChange = (Math.random() - 0.5) * 0.001
          const lngChange = (Math.random() - 0.5) * 0.001

          // Calcular nueva posición (GeoJSON: [lng, lat])
          let newLng = cow.position.coordinates[0] + lngChange
          let newLat = cow.position.coordinates[1] + latChange

          // Verificar si la nueva posición estaría fuera de la granja
          const wouldBeOutside = newLat < minLat || newLat > maxLat || newLng < minLng || newLng > maxLng

          // Si estaría fuera, ajustamos la posición para mantenerla dentro de los límites
          if (wouldBeOutside && Math.random() > 0.005) {
            newLat = Math.max(minLat, Math.min(maxLat, newLat))
            newLng = Math.max(minLng, Math.min(maxLng, newLng))
          }

          const newPosition = {
            type: "Point",
            coordinates: [newLng, newLat], // GeoJSON: [lng, lat]
          }

          // Ordena las zonas para que "farm" sea la última
          const orderedZones = [
            ...zones.filter((z) => z.id !== "farm"),
            ...zones.filter((z) => z.id === "farm"),
          ]

          let newZoneId: string | null = null

          for (const zone of orderedZones) {
            const {
              minLat: zMinLat,
              maxLat: zMaxLat,
              minLng: zMinLng,
              maxLng: zMaxLng,
            } = getBoundsFromPolygon(zone.bounds)

            if (
              newPosition.coordinates[1] >= zMinLat &&
              newPosition.coordinates[1] <= zMaxLat &&
              newPosition.coordinates[0] >= zMinLng &&
              newPosition.coordinates[0] <= zMaxLng
            ) {
              newZoneId = zone.id
              break
            }
          }

          // Verificar si salió de la zona general (primera zona)
          const isOutside =
            newPosition.coordinates[1] < minLat ||
            newPosition.coordinates[1] > maxLat ||
            newPosition.coordinates[0] < minLng ||
            newPosition.coordinates[0] > maxLng

          if (isOutside) {
            // Alerta: vaca fuera de la granja
            const audio = new Audio("/alert.mp3")
            audio.play().catch((e) => console.log("Error reproduciendo alerta:", e))

            // Usamos setTimeout para evitar actualizar el estado durante el renderizado
            setTimeout(() => {
              toast({
                title: "¡Alerta de seguridad!",
                description: `${cow.name} ha salido de los límites de la granja`,
                variant: "destructive",
              })
            }, 0)

            // Enviar notificación push si está permitido
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("¡Alerta de seguridad!", {
                body: `${cow.name} ha salido de los límites de la granja`,
                icon: "/cow-icon.png",
              })
            }
          }

          // Después de calcular newLat y newLng:
          updateCowPositionInDb(cow.id, newLat, newLng) // <-- sigue igual, porque la API espera lat, lng

          return {
            ...cow,
            position: newPosition,
            zoneId: newZoneId,
          }
        })
      })
    }, 2000)

    return () => clearInterval(movementInterval)
  }, [loading, zones, toast, isAuthenticated])

  // Simular desconexiones aleatorias solo si el usuario está autenticado
  useEffect(() => {
    if (loading || !isAuthenticated) return

    const disconnectionInterval = setInterval(() => {
      setCattle((prevCattle) => {
        return prevCattle.map((cow) => {
          // 10% de probabilidad de cambiar el estado de conexión
          if (Math.random() < 0.1) {
            return {
              ...cow,
              connected: !cow.connected,
            }
          }
          return cow
        })
      })
    }, 30000) // Cada 30 segundos

    return () => clearInterval(disconnectionInterval)
  }, [loading, isAuthenticated])

  // Calcular cantidad de vacas conectadas
  const connectedCattle = cattle.filter((cow) => cow.connected).length

  return (
    <CattleContext.Provider
      value={{
        cattle,
        zones,
        loading,
        connectedCattle,
        selectedCattleId,
        setSelectedCattleId,
        selectedZoneId,
        setSelectedZoneId,
        geoSearch,
        setGeoSearch,
      }}
    >
      {children}
    </CattleContext.Provider>
  )
}

export function useCattle() {
  const context = useContext(CattleContext)
  if (context === undefined) {
    throw new Error("useCattle must be used within a CattleProvider")
  }
  return context
}

// Utilidad para obtener lat/lng de una vaca
export function getCowLatLng(cow: Cattle): [number, number] {
  // GeoJSON: [lng, lat]
  return [cow.position.coordinates[1], cow.position.coordinates[0]]
}

// Función para obtener los límites (minLat, maxLat, minLng, maxLng) de un polígono GeoJSON
function getBoundsFromPolygon(polygon: any): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const coords = polygon.coordinates[0]
  let minLat = coords[0][1]
  let maxLat = coords[0][1]
  let minLng = coords[0][0]
  let maxLng = coords[0][0]

  for (const coord of coords) {
    const [lng, lat] = coord
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
  }

  return { minLat, maxLat, minLng, maxLng }
}
