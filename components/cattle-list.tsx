"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, MapPin, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCattle, getCowLatLng } from "@/lib/cattle-context"
import Fuse from "fuse.js"

// Función para calcular la distancia entre dos puntos (Haversine formula)
/*function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distancia en km
}*/

async function fetchCattleByGeo(lat: number, lng: number, radius: number) {
  const res = await fetch(`/api/cattle?lat=${lat}&lng=${lng}&radius=${radius}`)
  if (!res.ok) throw new Error("Error al buscar vacas por ubicación")
  return await res.json()
}

export default function CattleList() {
  const { cattle, zones, selectedCattleId, setSelectedCattleId, setGeoSearch, searchTrigger, setSearchTrigger } =
    useCattle()
  const [searchTerm, setSearchTerm] = useState("")
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [radius, setRadius] = useState("")
  const [filteredCattle, setFilteredCattle] = useState<Cattle[] | null>(null)
  const [isLocationSearchActive, setIsLocationSearchActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Effect to handle search trigger from map
  useEffect(() => {
    if (searchTrigger) {
      setShowAdvancedSearch(true)
      setLatitude(searchTrigger.lat.toString())
      setLongitude(searchTrigger.lng.toString())
      setRadius("1.5")
      setSearchTrigger(null) // Reset the trigger
    }
  }, [searchTrigger, setSearchTrigger])

  // Configura Fuse.js para búsqueda difusa por nombre y descripción
  const fuse = useMemo(
    () =>
      new Fuse(cattle, {
        keys: ["name", "description"],
        threshold: 0.3,
      }),
    [cattle],
  )

  // Handler para búsqueda avanzada
  const handleGeoSearch = async () => {
    setIsLoading(true)
    try {
      const lat = Number.parseFloat(latitude)
      const lng = Number.parseFloat(longitude)
      const rad = Number.parseFloat(radius)
      if (!isNaN(lat) && !isNaN(lng) && !isNaN(rad)) {
        const res = await fetch(`/api/cattle?lat=${lat}&lng=${lng}&radius=${rad}`)
        const data = await res.json()
        setFilteredCattle(data.data) // o setFilteredCattle(data) según tu API
        setIsLocationSearchActive(true)
        setGeoSearch({ center: [lat, lng], radius: rad })
      }
    } catch (e) {
      // Manejo de error
    } finally {
      setIsLoading(false)
    }
  }

  // Para limpiar la búsqueda avanzada
  const clearGeoSearch = () => {
    setFilteredCattle(null)
    setIsLocationSearchActive(false)
    setGeoSearch(null)
  }

  // useMemo solo para búsqueda por texto
  const fuzzyCattle = useMemo(() => {
    let result = cattle
    if (searchTerm.trim() !== "") {
      result = fuse.search(searchTerm).map((r) => r.item)
    }
    return result
  }, [cattle, fuse, searchTerm])

  // Decide qué mostrar
  const cattleToShow = isLocationSearchActive && filteredCattle !== null ? filteredCattle : fuzzyCattle

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Buscar nombre, descripción o ->"
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 h-7 w-7 px-0"
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
        >
          <MapPin className="h-4 w-4" />
          <span className="sr-only">Búsqueda avanzada</span>
        </Button>
      </div>

      {/* Búsqueda avanzada */}
      {showAdvancedSearch && (
        <div className="rounded-md border p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2 flex justify-between items-center">
            <span>Búsqueda por coordenadas</span>
            {isLocationSearchActive && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Filtro activo
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label htmlFor="latitude" className="text-xs">
                Latitud
              </Label>
              <Input
                id="latitude"
                type="number"
                placeholder="Ej: 40.7128"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="longitude" className="text-xs">
                Longitud
              </Label>
              <Input
                id="longitude"
                type="number"
                placeholder="Ej: -74.0060"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="mb-3">
            <Label htmlFor="radius" className="text-xs">
              Radio (km)
            </Label>
            <Input
              id="radius"
              type="number"
              placeholder="Ej: 5"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="w-full"
              onClick={handleGeoSearch}
              disabled={!latitude || !longitude || !radius}
            >
              Buscar
            </Button>
            <Button size="sm" variant="outline" className="w-full" onClick={clearGeoSearch}>
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {isLocationSearchActive && (
        <div className="flex items-center justify-between bg-green-50 p-2 rounded-md">
          <span className="text-xs text-green-700">Mostrando ganado en un radio de {radius} km</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearGeoSearch}>
            <X className="h-4 w-4" />
            <span className="sr-only">Limpiar filtro</span>
          </Button>
        </div>
      )}

      <Separator />

      <div className="space-y-1">
        {Array.isArray(cattleToShow) && cattleToShow.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No se encontraron resultados</p>
        ) : (
          Array.isArray(cattleToShow) &&
          cattleToShow.map((cow) => (
            <div
              key={cow.id}
              className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
                selectedCattleId === cow.id ? "bg-green-50" : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedCattleId(selectedCattleId === cow.id ? null : cow.id)}
            >
              <div className="flex-shrink-0 mr-3">
                <div className="relative">
                  <img
                    src={cow.imageUrl || "/placeholder.svg"}
                    alt={cow.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      cow.connected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cow.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {cow.zoneId && cow.zoneId !== "farm" ? (
                    <span>Zona: {zones.find((z) => z.id === cow.zoneId)?.name || "Desconocida"}</span>
                  ) : (
                    <span className="text-yellow-600">Zona: Granja completa</span>
                  )}
                </p>
              </div>
              {!cow.connected && (
                <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                  Offline
                </Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
