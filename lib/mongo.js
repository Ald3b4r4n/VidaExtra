import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "vidaextra";

let client;

export async function getDb() {
  if (!client) {
    client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
    await client.connect();
  }
  return client.db(dbName);
}

export function monthId(id, ym) {
  return `${id}_${ym}`;
}