import { MongoClient } from "mongodb"

const users = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@ejemplo.com",
    role: "Administrador",
    createdAt: "2023-01-15",
  },
  {
    id: "2",
    name: "Juan Pérez",
    email: "juan@ejemplo.com",
    role: "Supervisor",
    createdAt: "2023-02-20",
  },
  {
    id: "3",
    name: "María López",
    email: "maria@ejemplo.com",
    role: "Operador",
    createdAt: "2023-03-10",
  },
  {
    id: "4",
    name: "Carlos Rodríguez",
    email: "carlos@ejemplo.com",
    role: "Operador",
    createdAt: "2023-04-05",
  },
  {
    id: "5",
    name: "Ana Martínez",
    email: "ana@ejemplo.com",
    role: "Supervisor",
    createdAt: "2023-05-12",
  },
]

async function main() {
  const uri = "mongodb://localhost:27017"
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db("gestion_ganadera")
    const collection = db.collection("users")
    await collection.deleteMany({})
    await collection.insertMany(users)
    console.log("Colección 'users' poblada con éxito.")
  } finally {
    await client.close()
  }
}

main().catch(console.error)
