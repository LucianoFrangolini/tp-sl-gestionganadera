import { MongoClient } from "mongodb"

// URI para el docker compose
const MONGODB_URI= process.env.MONGODB_URI || "mongodb://mongodb:27017/gestion_ganadera"

// Centro de la granja (coordenadas de ejemplo)
const FARM_CENTER: [number, number] = [40.7128, -74.006]

// Colores para las zonas
const ZONE_COLORS = [
  "#3b82f6", // Granja (azul)
  "#ef4444", // Establos (rojo)
  "#f97316", // Comederos (naranja)
  "#22c55e", // Bebederos (verde)
  "#a855f7", // Áreas de ordeño (púrpura)
  "#ec4899", // Maternidades (rosa)
  "#84cc16", // Áreas de pastoreo (verde lima)
]

function generateMockZones() {
  const farmZone = {
    id: "farm",
    name: "Granja Completa",
    description: "Perímetro completo de la granja",
    bounds: {
      type: "Polygon",
      coordinates: [[
        [FARM_CENTER[1] - 0.01, FARM_CENTER[0] - 0.01],
        [FARM_CENTER[1] + 0.01, FARM_CENTER[0] - 0.01],
        [FARM_CENTER[1] + 0.01, FARM_CENTER[0] + 0.01],
        [FARM_CENTER[1] - 0.01, FARM_CENTER[0] + 0.01],
        [FARM_CENTER[1] - 0.01, FARM_CENTER[0] - 0.01],
      ]],
    },
    color: ZONE_COLORS[0],
  }

  const zones = [
    farmZone,
    {
      id: "stables",
      name: "Establos",
      description: "Área de descanso para el ganado",
      bounds: {
        type: "Polygon",
        coordinates: [[
          [FARM_CENTER[1] - 0.008, FARM_CENTER[0] - 0.008],
          [FARM_CENTER[1] - 0.004, FARM_CENTER[0] - 0.008],
          [FARM_CENTER[1] - 0.004, FARM_CENTER[0] - 0.004],
          [FARM_CENTER[1] - 0.008, FARM_CENTER[0] - 0.004],
          [FARM_CENTER[1] - 0.008, FARM_CENTER[0] - 0.008],
        ]],
      },
      color: ZONE_COLORS[1],
    },
    {
      id: "feeders",
      name: "Comederos",
      description: "Área de alimentación",
      bounds: {
        type: "Polygon",
        coordinates: [[
          [FARM_CENTER[1] - 0.008, FARM_CENTER[0] + 0.004],
          [FARM_CENTER[1] - 0.004, FARM_CENTER[0] + 0.004],
          [FARM_CENTER[1] - 0.004, FARM_CENTER[0] + 0.008],
          [FARM_CENTER[1] - 0.008, FARM_CENTER[0] + 0.008],
          [FARM_CENTER[1] - 0.008, FARM_CENTER[0] + 0.004],
        ]],
      },
      color: ZONE_COLORS[2],
    },
    {
      id: "waterers",
      name: "Bebederos",
      description: "Área de hidratación",
      bounds: {
        type: "Polygon",
        coordinates: [[
          [FARM_CENTER[1] + 0.004, FARM_CENTER[0] - 0.008],
          [FARM_CENTER[1] + 0.008, FARM_CENTER[0] - 0.008],
          [FARM_CENTER[1] + 0.008, FARM_CENTER[0] - 0.004],
          [FARM_CENTER[1] + 0.004, FARM_CENTER[0] - 0.004],
          [FARM_CENTER[1] + 0.004, FARM_CENTER[0] - 0.008],
        ]],
      },
      color: ZONE_COLORS[3],
    },
    {
      id: "milking",
      name: "Áreas de Ordeño",
      description: "Zona de producción de leche",
      bounds: {
        type: "Polygon",
        coordinates: [[
          [FARM_CENTER[1] + 0.004, FARM_CENTER[0] + 0.004],
          [FARM_CENTER[1] + 0.008, FARM_CENTER[0] + 0.004],
          [FARM_CENTER[1] + 0.008, FARM_CENTER[0] + 0.008],
          [FARM_CENTER[1] + 0.004, FARM_CENTER[0] + 0.008],
          [FARM_CENTER[1] + 0.004, FARM_CENTER[0] + 0.004],
        ]],
      },
      color: ZONE_COLORS[4],
    },
    {
      id: "maternity",
      name: "Maternidades",
      description: "Área para vacas preñadas y recién paridas",
      bounds: {
        type: "Polygon",
        coordinates: [[
          [FARM_CENTER[1] - 0.002, FARM_CENTER[0] - 0.002],
          [FARM_CENTER[1] + 0.002, FARM_CENTER[0] - 0.002],
          [FARM_CENTER[1] + 0.002, FARM_CENTER[0] + 0.002],
          [FARM_CENTER[1] - 0.002, FARM_CENTER[0] + 0.002],
          [FARM_CENTER[1] - 0.002, FARM_CENTER[0] - 0.002],
        ]],
      },
      color: ZONE_COLORS[5],
    },
    {
      id: "pasture",
      name: "Áreas de Pastoreo",
      description: "Zonas de alimentación natural",
      bounds: {
        type: "Polygon",
        coordinates: [[
          [FARM_CENTER[1] - 0.006, FARM_CENTER[0] - 0.001],
          [FARM_CENTER[1] - 0.001, FARM_CENTER[0] - 0.001],
          [FARM_CENTER[1] - 0.001, FARM_CENTER[0] + 0.006],
          [FARM_CENTER[1] - 0.006, FARM_CENTER[0] + 0.006],
          [FARM_CENTER[1] - 0.006, FARM_CENTER[0] - 0.001],
        ]],
      },
      color: ZONE_COLORS[6],
    },
  ]

  return zones
}

async function main() {
  const client = new MongoClient(MONGODB_URI)
  try {
    await client.connect()
    const db = client.db("gestion_ganadera")
    const collection = db.collection("zones")
    const zones = generateMockZones()
    await collection.deleteMany({})
    await collection.insertMany(zones)
    // Crear índice 2dsphere para bounds
    await collection.createIndex({ bounds: "2dsphere" })
    console.log("Colección 'zones' poblada y con índice 2dsphere.")
  } finally {
    await client.close()
  }
}

main().catch(console.error)
