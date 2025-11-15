/**
 * OAuth Client ID Endpoint
 * VidaExtra® - Calculadora AC-4
 *
 * Retorna OAuth Client ID de forma segura
 */

export default function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientId = process.env.OAUTH_CLIENT_ID;

  if (!clientId) {
    console.error("Missing OAUTH_CLIENT_ID environment variable");
    return res.status(500).json({ error: "OAuth configuration missing" });
  }

  res.status(200).json({ clientId });
}
