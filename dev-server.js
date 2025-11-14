/* eslint-env node */
/* global require, process */
// Simple dev server with proxy to Firebase Functions to avoid CORS during local development
// Usage: npm run dev

const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const DEFAULT_PORT = Number(process.env.PORT) || 5500;
const APP_DIR = process.cwd();
const FUNCTIONS_BASE = "https://us-central1-vidaextra-8db27.cloudfunctions.net";

const app = express();

// Parse JSON bodies
app.use(express.json());

// In-memory storage for mock events (resets when server restarts)
const mockEvents = [];

// Mock endpoint for development - createCalendarEvent
// This bypasses the need for deployed Cloud Functions during dev
app.post("/api/createCalendarEvent", async (req, res) => {
  console.log("[DEV MOCK] createCalendarEvent called with:", req.body);

  // Simulate successful event creation
  const mockEventId = `mock_${Date.now()}`;
  const mockEvent = {
    id: mockEventId,
    htmlLink: `https://calendar.google.com/calendar/event?eid=${mockEventId}`,
    status: "confirmed",
    summary: req.body.summary || "AC-4 Event",
    description: req.body.description || "",
    start: { dateTime: req.body.startISO },
    end: { dateTime: req.body.endISO },
    reminders: req.body.reminders || { useDefault: false, overrides: [] },
    created: new Date().toISOString(),
  };

  // Store event in memory
  mockEvents.push(mockEvent);

  console.log(
    "[DEV MOCK] Event created and stored. Total events:",
    mockEvents.length
  );
  console.log("[DEV MOCK] Returning mock event:", mockEvent);

  res.status(200).json(mockEvent);
});

// Mock endpoint for development - getUpcomingEvents
app.get("/api/getUpcomingEvents", async (req, res) => {
  console.log("[DEV MOCK] getUpcomingEvents called");
  console.log("[DEV MOCK] Returning", mockEvents.length, "events");

  // Filter only future events
  const now = new Date();
  const upcomingEvents = mockEvents.filter((event) => {
    const eventStart = new Date(event.start.dateTime);
    return eventStart > now;
  });

  console.log("[DEV MOCK] Future events:", upcomingEvents.length);

  res.status(200).json({
    events: upcomingEvents,
    total: upcomingEvents.length,
  });
});

// Proxy API routes to Cloud Functions
app.use(
  "/api",
  createProxyMiddleware({
    target: FUNCTIONS_BASE,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
    xfwd: true,
    logLevel: "debug",
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `[PROXY] ${req.method} ${req.url} -> ${FUNCTIONS_BASE}${req.url.replace(
          "/api",
          ""
        )}`
      );
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[PROXY] Response ${proxyRes.statusCode} for ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error(`[PROXY ERROR]`, err.message);
      res.status(500).json({ error: "Proxy error", details: err.message });
    },
  })
);

// Static files
app.use(express.static(APP_DIR));

// Serve index.html only for root path, not for other routes
app.get("/", (req, res) => {
  res.sendFile(require("path").join(APP_DIR, "index.html"));
});

function start(port) {
  const server = app.listen(port, () => {
    console.log(`Dev server running at http://localhost:${port}`);
    console.log(`Proxying API -> ${FUNCTIONS_BASE}`);
  });
  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && port !== 5501) {
      console.warn(`Port ${port} in use, retrying on 5501...`);
      start(5501);
    } else {
      console.error("Failed to start dev server:", err.message || err);
      process.exit(1);
    }
  });
}

start(DEFAULT_PORT);
