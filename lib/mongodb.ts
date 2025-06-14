import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
const dbName = process.env.MONGODB_DB || "gestion_ganadera"

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (!(global as any)._mongoClientPromise) {
  client = new MongoClient(uri)
  ;(global as any)._mongoClientPromise = client.connect()
}
clientPromise = (global as any)._mongoClientPromise

export async function getDb() {
  const client = await clientPromise
  return client.db(dbName)
}
