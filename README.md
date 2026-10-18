# Relay — LoRaWAN emergency messaging UI

React + Vite dashboard for emergency team messaging and LoRaWAN field-device status.

## Run locally

```sh
npm install
npm run dev
```

Without a backend URL, the app is in **demo mode**. Messages are saved in browser storage only. Device status, map locations, network health, and starter messages are sample data; nothing is transmitted over LoRaWAN.

## Connect a LoRaWAN backend

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to your authenticated application backend. Restart the Vite dev server after changing environment variables.

The React client uses this JSON API:

- `GET /api/messages` → `{ "messages": [{ "id": "m-1", "author": "Maya Kim", "initials": "MK", "device": "device-eui", "time": "09:38", "text": "Check-in", "status": "Queued by network server" }] }`
- `GET /api/devices` → `{ "devices": [{ "id": "device-eui", "name": "Field unit", "detail": "Checked in 2m ago", "status": "Available", "initials": "MK" }] }`
- `POST /api/messages` with `{ "recipientDeviceId": "device-eui", "text": "Need assistance" }` → `{ "id": "m-2", "status": "Queued by network server", "createdAt": "2026-10-18T06:00:00Z" }`

The app refreshes messages and devices every 10 seconds. The POST response status is displayed as returned by the backend; the UI does not claim end-device delivery unless the backend reports it. The API should return an appropriate non-2xx response with `{ "error": "..." }` for rejected messages. The client sends same-origin session cookies (`credentials: include`), so configure HTTPS, authentication, CSRF protection, and CORS appropriately.

The backend must securely integrate your selected LoRaWAN network server (for example, The Things Stack or ChirpStack), authenticate operators, validate recipient membership, encode payloads for the registered device and regional plan, enqueue downlinks, consume delivery/receive events, and keep network-server credentials out of browser code. A LoRaWAN downlink can be delayed or fail; build message expiry, retries, receipt verification, and a separately tested emergency fallback into the deployment.

This workspace does not include a gateway, network-server credentials, or that backend. Therefore the live LoRaWAN delivery path cannot be enabled just by running the React app. Do not use this preview as a life-safety system.
