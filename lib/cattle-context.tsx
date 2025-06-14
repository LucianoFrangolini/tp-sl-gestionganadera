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
  position: [number, number]
  connected: boolean
  zoneId: string | null
}

export interface Zone {
  id: string
  name: string
  description: string
  bounds: [[number, number], [number, number]] // [[lat1, lng1], [lat2, lng2]]
  color: string
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
}

const CattleContext = createContext<CattleContextType | undefined>(undefined)

export function CattleProvider({ children }: { children: React.ReactNode }) {
  const [cattle, setCattle] = useState<Cattle[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCattleId, setSelectedCattleId] = useState<string | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
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
          const [[minLat, minLng], [maxLat, maxLng]] = farmZone.bounds

          // Movimiento aleatorio pequeño
          const latChange = (Math.random() - 0.5) * 0.001
          const lngChange = (Math.random() - 0.5) * 0.001

          // Calcular nueva posición
          let newLat = cow.position[0] + latChange
          let newLng = cow.position[1] + lngChange

          // Verificar si la nueva posición estaría fuera de la granja
          const wouldBeOutside = newLat < minLat || newLat > maxLat || newLng < minLng || newLng > maxLng

          // Si estaría fuera, hay una pequeña probabilidad (0.5%) de permitirlo para simular escape
          // De lo contrario, ajustamos la posición para mantenerla dentro de los límites
          if (wouldBeOutside && Math.random() > 0.005) {
            // Ajustar la posición para mantenerla dentro de los límites
            newLat = Math.max(minLat, Math.min(maxLat, newLat))
            newLng = Math.max(minLng, Math.min(maxLng, newLng))
          }

          const newPosition: [number, number] = [newLat, newLng]

          // Determinar en qué zona está
          let newZoneId: string | null = null

          for (const zone of zones) {
            const [[zMinLat, zMinLng], [zMaxLat, zMaxLng]] = zone.bounds

            if (
              newPosition[0] >= zMinLat &&
              newPosition[0] <= zMaxLat &&
              newPosition[1] >= zMinLng &&
              newPosition[1] <= zMaxLng
            ) {
              newZoneId = zone.id
              break
            }
          }

          // Verificar si salió de la zona general (primera zona)
          const isOutside =
            newPosition[0] < minLat || newPosition[0] > maxLat || newPosition[1] < minLng || newPosition[1] > maxLng

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
