import { MongoClient } from "mongodb";
import dns from "dns";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "vidaextra";

let client;

// Prefer public DNS to resolve SRV when local DNS blocks it
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

export async function getDb() {
  if (!uri) throw new Error("MONGODB_URI not set");
  if (!client) {
    client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
    await client.connect();
  }
  return client.db(dbName);
}

export function monthId(uid, ym) {
  return `${uid}_${ym}`;
}