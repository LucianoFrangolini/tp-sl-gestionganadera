import { MongoClient } from "mongodb"

// Copia los tipos y datos relevantes de lib/mock-data.ts
const FARM_CENTER: [number, number] = [40.7128, -74.006]
const COW_NAMES = [
  "Bella", "Luna", "Estrella", "Manchas", "Flor", "Dulce", "Canela", "Lucero", "Princesa", "Margarita",
  "Violeta", "Rosa", "Azucena", "Perla", "Diamante", "Esmeralda", "Rubí", "Zafiro", "Ámbar", "Topacio",
]
const COW_DESCRIPTIONS = [
  "Holstein de 5 años, alta productora de leche",
  "Jersey de 3 años, excelente calidad de leche",
  "Angus de 4 años, buena para carne",
  "Hereford de 6 años, madre de 4 terneros",
  "Brahman de 2 años, resistente al calor",
  "Charolais de 7 años, gran tamaño",
  "Limousin de 3 años, buena musculatura",
  "Simmental de 4 años, doble propósito",
  "Gyr de 5 años, adaptable a climas cálidos",
  "Normando de 6 años, buena para leche y carne",
]
const COW_IMAGES = Array(20).fill("/placeholder.svg?height=200&width=200")

// Zonas mock (solo ids y bounds para asignar zoneId y limitar posiciones)
const zones: { id: string; bounds: [[number, number], [number, number]] }[] = [
  {
    id: "farm",
    bounds: [
      [FARM_CENTER[0] - 0.01, FARM_CENTER[1] - 0.01],
      [FARM_CENTER[0] + 0.01, FARM_CENTER[1] + 0.01],
    ],
  },
  {
    id: "stables",
    bounds: [
      [FARM_CENTER[0] - 0.008, FARM_CENTER[1] - 0.008],
      [FARM_CENTER[0] - 0.004, FARM_CENTER[1] - 0.004],
    ],
  },
  {
    id: "feeders",
    bounds: [
      [FARM_CENTER[0] - 0.008, FARM_CENTER[1] + 0.004],
      [FARM_CENTER[0] - 0.004, FARM_CENTER[1] + 0.008],
    ],
  },
  {
    id: "waterers",
    bounds: [
      [FARM_CENTER[0] + 0.004, FARM_CENTER[1] - 0.008],
      [FARM_CENTER[0] + 0.008, FARM_CENTER[1] - 0.004],
    ],
  },
  {
    id: "milking",
    bounds: [
      [FARM_CENTER[0] + 0.004, FARM_CENTER[1] + 0.004],
      [FARM_CENTER[0] + 0.008, FARM_CENTER[1] + 0.008],
    ],
  },
  {
    id: "maternity",
    bounds: [
      [FARM_CENTER[0] - 0.002, FARM_CENTER[1] - 0.002],
      [FARM_CENTER[0] + 0.002, FARM_CENTER[1] + 0.002],
    ],
  },
  {
    id: "pasture",
    bounds: [
      [FARM_CENTER[0] - 0.006, FARM_CENTER[1] - 0.001],
      [FARM_CENTER[0] - 0.001, FARM_CENTER[1] + 0.006],
    ],
  },
]

// Genera una posición aleatoria dentro de los bounds de la granja
function randomPosition(bounds: [[number, number], [number, number]]) {
  const [[minLat, minLng], [maxLat, maxLng]] = bounds
  const lat = minLat + Math.random() * (maxLat - minLat)
  const lng = minLng + Math.random() * (maxLng - minLng)
  return [lat, lng] as [number, number]
}

// Determina en qué zona está una posición
function getZoneId(lat: number, lng: number) {
  for (const zone of zones) {
    const [[zMinLat, zMinLng], [zMaxLat, zMaxLng]] = zone.bounds
    if (lat >= zMinLat && lat <= zMaxLat && lng >= zMinLng && lng <= zMaxLng) {
      return zone.id
    }
  }
  return null
}

// Genera los datos de cattle
function generateCattle() {
  const farmBounds = zones[0].bounds
  const cattle = []
  for (let i = 0; i < 20; i++) {
    const [lat, lng] = randomPosition(farmBounds)
    const zoneId = getZoneId(lat, lng)
    cattle.push({
      id: `cow-${i + 1}`,
      name: COW_NAMES[i % COW_NAMES.length],
      description: COW_DESCRIPTIONS[i % COW_DESCRIPTIONS.length],
      imageUrl: COW_IMAGES[i % COW_IMAGES.length],
      position: [lat, lng],
      connected: Math.random() > 0.1,
      zoneId,
    })
  }
  return cattle
}

async function main() {
  const uri = "mongodb://localhost:27017"
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db("gestion_ganadera")
    const collection = db.collection("cattle")
    const cattle = generateCattle()
    await collection.deleteMany({})
    await collection.insertMany(cattle)
    console.log("Colección 'cattle' poblada con éxito.")
  } finally {
    await client.close()
  }
}

main().catch(console.error)
