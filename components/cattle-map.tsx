"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Rectangle, useMap, useMapEvent, Circle } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useCattle, type Cattle } from "@/lib/cattle-context"

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
        map.setView(selectedCow.position, 16)
      }
    }
    setTimeout(() => map.invalidateSize(), 300)
  }, [map, cattle, selectedCattleId])

  return null
}

// Componente para mostrar popup de coordenadas al hacer click
function ClickPopup({ position, onClose }: { position: [number, number] | null; onClose: () => void }) {
  if (!position) return null
  return (
    <Popup position={position} eventHandlers={{ remove: onClose }}>
      <div>
        <strong>Coordenadas</strong>
        <div>
          Lat: {position[0].toFixed(6)}
          <br />
          Lng: {position[1].toFixed(6)}
        </div>
      </div>
    </Popup>
  )
}

export default function CattleMap() {
  const { cattle, zones, selectedCattleId, setSelectedCattleId, selectedZoneId, geoSearch } = useCattle()
  const [mapReady, setMapReady] = useState(false)
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(null)

  function MapClickHandler() {
    useMapEvent("click", (e) => {
      setClickedPosition([e.latlng.lat, e.latlng.lng])
      setSelectedCattleId(null)
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

      {/* Renderizar zonas (sin cambios) */}
      {zones.map((zone) => (
        <Rectangle
          key={zone.id}
          bounds={zone.bounds as L.LatLngBoundsExpression}
          pathOptions={{
            color: zone.color,
            weight: 2,
            fillOpacity: selectedZoneId === zone.id ? 0.3 : 0.1,
          }}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">{zone.name}</h3>
              <p>{zone.description}</p>
            </div>
          </Popup>
        </Rectangle>
      ))}

      {/* Renderizar vacas (sin cambios) */}
      {cattle.map((cow) => (
        <Marker
          key={cow.id}
          position={cow.position}
          icon={cowIcon}
          opacity={cow.connected ? 1 : 0.5}
          eventHandlers={{
            click: (e) => {
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
