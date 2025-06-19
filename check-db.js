const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://mongodb:27017/gestion_ganadera";
const dbName = "gestion_ganadera";

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const count = await db.collection("users").countDocuments();
    console.log(count);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();