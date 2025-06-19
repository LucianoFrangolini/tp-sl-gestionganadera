"use client"

import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMap, useMapEvent, Circle, Polygon } from "react-leaflet"
import L, { LeafletMouseEvent } from "leaflet"
import "leaflet/dist/leaflet.css"
import { useCattle, getCowLatLng, Zone } from "@/lib/cattle-context"
import { Button } from "./ui/button"

// Icono personalizado para las vacas
const cowIcon = new L.Icon({
  iconUrl: "/cow-icon.jpg",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
})

// Componente para actualizar la vista del mapa
function MapUpdater({ cattle, selectedCattleId }: { cattle: Cattle[]; selectedCattleId: string | null }) {
  const map = useMap()

  useEffect(() => {
    if (selectedCattleId) {
      const selectedCow = cattle.find((cow) => cow.id === selectedCattleId)
      if (selectedCow) {
        map.setView(getCowLatLng(selectedCow), 16)
      }
    }
    setTimeout(() => map.invalidateSize(), 300)
  }, [map, cattle, selectedCattleId])

  return null
}

// Componente para mostrar popup de coordenadas al hacer click
function ClickPopup({ position, onClose }: { position: [number, number] | null; onClose: () => void }) {
  const { setSearchTrigger } = useCattle()
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (divRef.current) {
      L.DomEvent.disableClickPropagation(divRef.current)
    }
  }, [])

  if (!position) return null
  return (
    <Popup position={position} eventHandlers={{ remove: onClose }}>
      <div ref={divRef}>
        <strong>Coordenadas</strong>
        <div>
          Lat: {position[0].toFixed(6)}
          <br />
          Lng: {position[1].toFixed(6)}
        </div>
        <Button
          size="sm"
          className="mt-2 w-full"
          onClick={(e) => {
            e.stopPropagation() // Evita que se dispare el evento de click del mapa
            setSearchTrigger({ lat: position[0], lng: position[1] })
            onClose() // Cierra el popup
          }}
        >
          Buscar aquí
        </Button>
      </div>
    </Popup>
  )
}

export default function CattleMap() {
  const { cattle, zones, selectedCattleId, setSelectedCattleId, selectedZoneId, geoSearch } = useCattle()
  const [mapReady, setMapReady] = useState(false)
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(null)
  const [zonePopupData, setZonePopupData] = useState<{ position: [number, number]; zone: Zone } | null>(null)

  function MapClickHandler() {
    useMapEvent("click", (e: LeafletMouseEvent) => {
      setClickedPosition([e.latlng.lat, e.latlng.lng])
      setSelectedCattleId(null)
      setZonePopupData(null) // Cierra el popup de la zona si se hace clic en el mapa
    })
    return null
  }

  useEffect(() => {
    setMapReady(true)
  }, [])

  if (!mapReady) {
    return <div className="h-full flex items-center justify-center">Cargando mapa...</div>
  }

  return (
    <MapContainer
      center={[40.7128, -74.006]}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler />
      <ClickPopup position={clickedPosition} onClose={() => setClickedPosition(null)} />

      {/* Dibuja el círculo de búsqueda geoespacial si está activo */}
      {geoSearch && (
        <Circle
          center={geoSearch.center}
          radius={geoSearch.radius * 1000} // Convertir km a metros
          pathOptions={{
            color: "black",
            weight: 1,
            fillColor: "lightgray",
            fillOpacity: 0.3,
          }}
        />
      )}

      {/* Popup para la zona clickeada */}
      {zonePopupData && (
        <Popup position={zonePopupData.position} eventHandlers={{ remove: () => setZonePopupData(null) }}>
          <div>
            <h3 className="font-semibold">{zonePopupData.zone.name}</h3>
            <p className="text-sm">{zonePopupData.zone.description}</p>
            <hr className="my-1" />
            <div className="text-xs">
              <strong>Lat:</strong> {zonePopupData.position[0].toFixed(6)}
              <br />
              <strong>Lng:</strong> {zonePopupData.position[1].toFixed(6)}
            </div>
          </div>
        </Popup>
      )}

      {/* Renderizar zonas como polígonos */}
      {Array.isArray(zones) &&
        zones.map((zone) => {
          return Array.isArray(zone.bounds?.coordinates?.[0]) ? (
            <Polygon
              key={zone.id}
              positions={zone.bounds.coordinates[0].map(([lng, lat]) => [lat, lng])}
              pathOptions={{ color: zone.color, fillOpacity: selectedZoneId === zone.id ? 0.3 : 0.1 }}
              eventHandlers={{
                click: (e: LeafletMouseEvent) => {
                  L.DomEvent.stopPropagation(e) // Evita que se dispare el click del mapa
                  setZonePopupData({ position: [e.latlng.lat, e.latlng.lng], zone })
                },
              }}
            />
          ) : null
        })}

      {/* Renderizar vacas (sin cambios) */}
      {cattle.map((cow) => (
        <Marker
          key={cow.id}
          position={getCowLatLng(cow)}
          icon={cowIcon}
          opacity={cow.connected ? 1 : 0.5}
          eventHandlers={{
            click: (e: LeafletMouseEvent) => {
              L.DomEvent.stopPropagation(e)
              setSelectedCattleId(selectedCattleId === cow.id ? null : cow.id)
            },
          }}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-semibold">{cow.name}</h3>
              <p className="text-sm">{cow.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      <MapUpdater cattle={cattle} selectedCattleId={selectedCattleId} />
    </MapContainer>
  )
}
