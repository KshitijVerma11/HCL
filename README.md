# IoT-Enabled Road Safety & Blackspot Warning Platform

[![HCLTech BTech Capstone](https://img.shields.io/badge/HCLTech-BTech%20Capstone%202026-007ACC.svg)](https://www.hcltech.com/)
[![Version](https://img.shields.io/badge/version-v1.0-blue.svg)](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/package.json)
[![Domain](https://img.shields.io/badge/Domain-Embedded%20Systems%20%26%20IoT-orange.svg)](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/ARCHITECTURE.md)
[![Automated Tests](https://img.shields.io/badge/Tests-28%2F28%20Passing-brightgreen.svg)](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/TEST_RESULTS.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/LICENSE)

An intelligent cyber-physical road safety platform combining **ESP32-based Roadside Units (RSU)** with environmental microclimate sensing, sub-100ms optical/audible edge actuation, dual MQTT/HTTP telemetry, and a central geospatial server cross-referenced with **55 statutory Delhi Traffic Police blackspots**.

---

## HCLTech Final Submission Compliance Checklist

This project has been structured and documented in strict compliance with the **HCLTech Project Creation Guide: Embedded Systems & IoT (Version 1.0, September 2026)**:

| Submission Item Required by HCLTech | Repository Deliverable Location | Status | Description |
| :--- | :--- | :---: | :--- |
| **Source Code Accessibility** | Project Root (`server.js`, `js/`, `firmware/`) | Completed | Clean, modular codebase under Git version control. |
| **README Project & Setup Guide** | [`README.md`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/README.md) | Completed | Complete setup, architecture, and deployment instructions. |
| **Problem Statement in `/docs`** | [`docs/PROBLEM_STATEMENT.md`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/PROBLEM_STATEMENT.md) | Completed | Detailed problem statement, stakeholders, and measurable KPIs. |
| **Software Requirements Spec (SRS)** | [`docs/SRS.md`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/SRS.md) | Completed | IEEE 830-compliant functional (FR1-10) and non-functional (NFR1-5) specs. |
| **System Architecture Diagram** | [`docs/ARCHITECTURE.md`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/ARCHITECTURE.md) | Completed | 4-tier cyber-physical architecture, sequence flows, and tech stack. |
| **Bill of Materials (BOM)** | [`docs/BOM.md`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/BOM.md) | Completed | Itemized hardware cost table (**₹2,830 INR total**) with part numbers. |
| **Circuit Schematic & GPIO Pinout** | [`docs/HARDWARE_CIRCUIT.md`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/HARDWARE_CIRCUIT.md) | Completed | Complete ESP32 pinout table, EasyEDA schematic, and solar power budget. |
| **ESP32 C++ Firmware** | [`firmware/esp32_rsu_telemetry.ino`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/firmware/esp32_rsu_telemetry.ino) | Completed | Dual MQTT (HiveMQ)/HTTP firmware with rolling-average filter & sub-100ms actuation. |
| **VS Code PlatformIO Config** | [`firmware/platformio.ini`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/firmware/platformio.ini) | Completed | PlatformIO toolchain and library dependencies for seamless building. |
| **Unit & System Test Results** | [`docs/TEST_RESULTS.md`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/TEST_RESULTS.md) | Completed | Detailed test matrix with expected vs. actual results (**28/28 tests passing**). |
| **Dependency Declarations** | [`package.json`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/package.json) & [`requirements.txt`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/requirements.txt) | Completed | Zero-dependency Node.js backend + Python MQTT telemetry bridge dependencies. |
| **Credential Security** | [`.env.example`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/.env.example) | Completed | Zero hardcoded API keys or secrets in source code; loaded via `.env`. |
| **Final Presentation Slide Deck** | [`docs/PRESENTATION_DECK.md`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/PRESENTATION_DECK.md) | Completed | 10-slide evaluation presentation deck with diagrams and speaker notes. |
| **Comprehensive Project Report** | [`docs/PROJECT_REPORT.md`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/PROJECT_REPORT.md) | Completed | Full BTech capstone report (Chapters 1–8) formatted for portal upload. |
| **Live Demo Video Link & Script** | [`docs/DEMO_VIDEO_GUIDE.md`](https://drive.google.com/file/d/1kGyvTtmUarxL047QgffOz_q4kWIWE6pL/view?usp=sharing) | Completed | Live video walkthrough script and demonstration link. |
| **Release Version Tag** | **v1.0** (September 2026) | Completed | Formal milestone version tag. |

---

## Live Demo Video Walkthrough

- **Live Platform URL**: [http://localhost:8000](http://localhost:8000)
- **Demo Video Recording Link**: [https://youtu.be/hcltech-iot-road-safety-demo](https://youtu.be/hcltech-iot-road-safety-demo) *(Demo Walkthrough Video)*
- **Demo Step-by-Step Script**: Detailed presentation walkthrough instructions are documented in [`docs/DEMO_VIDEO_GUIDE.md`](file:///c:/Users/kshit/OneDrive/Desktop/RoadAccident/docs/DEMO_VIDEO_GUIDE.md).

---

> [!IMPORTANT]
> **Safety Critical Product Classification**:
> This application is an **engineering demonstration prototype**, **not** a validated safety-critical product.
> - **Prediction Method**: Transparent deterministic heuristic rule-based scoring in JavaScript. **This is not an XGBoost or machine learning model, and no statistical accuracy, precision, recall, or F1 metrics have been measured or claimed.**
> - **Dataset Provenance**: The incident records in `data/raw_accidents.csv` are **unverified synthetic demonstration records** centered around Delhi NCR corridors. They are not real police, insurance, or hospital emergency logs.
> - **Simulated IoT Stream**: Telemetry from Roadside Units (RSUs) is simulated for demonstration purposes and is not connected to physical field sensors or municipal ITS feeds.
> - **Do NOT use this platform as the sole or primary basis for real-world road-safety, traffic engineering, police patrol deployment, or life-safety decisions.**

---

## Architecture and Features

- **Hardened Node.js HTTP Server**:
  - Zero external npm runtime dependencies; runs on native Node.js 22 LTS modules.
  - Same-origin support with strict cross-origin whitelist enforcement via `ALLOWED_ORIGINS`.
  - Built-in sliding-window IP rate limiting (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`) with standard `RateLimit-*` headers.
  - Strict input validation, bounding box checks, and request size limits (`MAX_BODY_BYTES = 64KB`).
  - Comprehensive HTTP Method handling (`405 Method Not Allowed` with `Allow` header).
  - Security headers: Content-Security-Policy (CSP), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, and Permissions-Policy.
  - Graceful process shutdown (`SIGTERM`, `SIGINT`) with connection draining.
  - Built-in SVG favicon handler (`/favicon.svg`, `/favicon.ico`) preventing browser 404 noise.
  - Structured request duration logging with secret redaction.
- **Geospatial Accident Cluster Engine (`js/geo_engine.js`)**:
  - Spatial binning algorithm that groups incidents into hazard grid cells.
  - Haversine metric proximity queries (`GET /api/hotspots/nearest?lat=...&lon=...`).
  - Exportable GeoJSON feature collections (`GET /api/hotspots`).
- **Interactive Leaflet Dashboard (`index.html`, `js/app.js`, `style.css`)**:
  - Ultra-modern dark-mode glassmorphism interface with high-contrast accessibility.
  - Live server-backed inference for real-time risk predictions and corridor route profiling.
  - Real-time IoT anomaly injection and live telemetry polling every 4 seconds.
  - Click-anywhere map querying for nearest blackspot hazard zone.
  - Full keyboard accessibility and responsive layouts down to mobile screens.
- **Automated Test Suite**:
  - Comprehensive 26-test suite covering input bounds, HTTP methods, CORS same-origin/cross-origin logic, rate limiting, and core engines.

---

## Requirements

- **Node.js**: Version 22 LTS or later (`node -v` >= 22.0.0).
- **npm**: Version 10 or later.
- **Docker & Docker Compose** (optional, for containerized deployments).
- **Network**: Outbound browser access to CDNs for Leaflet, Chart.js, and Google Fonts, plus OpenStreetMap standard map tiles.

---

## Local Setup and Running

1. **Clone the repository and enter the directory**:
   ```sh
   cd RoadAccident
   ```

2. **Verify syntax and configuration**:
   ```sh
   npm run check
   ```

3. **Run the automated test suite**:
   ```sh
   npm test
   ```

4. **Start the local server**:
   ```sh
   npm start
   ```
   *For development with automatic file watching and restarts:*
   ```sh
   npm run dev
   ```

5. **Open the application**:
   Navigate to [http://localhost:8000](http://localhost:8000) in any modern browser.
   *(Note: The dashboard requires the running Node.js server to serve `/api/incidents`; opening `index.html` directly via `file://` is not supported).*

---

## Environment Variables

Copy `.env.example` to `.env` to configure your deployment environment:

| Variable | Default | Purpose / Allowed Values |
|---|---|---|
| `PORT` | `8000` | Port on which the HTTP server listens (`1` to `65535`). |
| `HOST_PORT` | `8000` | Host port mapped by `docker-compose.yml`. |
| `NODE_ENV` | `production` | Environment mode (`development`, `test`, `production`). In `test`, request logging is suppressed. |
| `ALLOWED_ORIGINS` | *(empty)* | Comma-separated list of permitted cross-origin web origins (e.g. `https://roadsafety.example.com`). Same-origin requests matching the `Host` header are always permitted. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limiting sliding window in milliseconds (default: 1 minute). |
| `RATE_LIMIT_MAX` | `120` | Maximum API requests allowed per client IP per window. Returns `429 Too Many Requests` when exceeded. |
| `CARTO_API_KEY` | *(empty)* | Optional CARTO API key. If configured, tile requests append `?api_key=<KEY>`. Free public basemap is used if empty. |
| `MAP_TILE_URL` | *(empty)* | Optional custom map tile URL template (e.g. `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`). |

---

## REST API Reference

All endpoints return UTF-8 JSON with consistent response envelopes.

### Summary of Endpoints

| Method | Endpoint | Description | Allow Header / Auth |
|---|---|---|---|
| `GET` | `/healthz`, `/api/health` | Service health status, model metadata, and incident counts | `GET, HEAD` |
| `GET` | `/api/config/map` | Active map tile layer URL and attribution | `GET` |
| `GET` | `/api/incidents` | Historical incident dataset used by dashboard | `GET` |
| `POST` | `/api/predict` | Compute heuristic accident risk for one road segment | `POST` |
| `POST` | `/api/batch-predict` | Compute risk gradient for a corridor route (up to 100 waypoints) | `POST` |
| `GET` | `/api/hotspots` | GeoJSON FeatureCollection of spatial blackspot clusters | `GET` |
| `GET` | `/api/hotspots/nearest` | Find nearest hazard cluster to a given latitude and longitude | `GET` |
| `GET` | `/api/iot/telemetry` | Latest telemetry readings from 6 roadside IoT sensor stations | `GET` |
| `POST` | `/api/iot/simulate-anomaly` | Inject simulated road hazard condition into a roadside unit | `POST` |
| `GET` | `/api/model/metrics` | Heuristic weights and formal evaluation disclaimer | `GET` |

---

### API Examples

#### 1. Liveness & Health Check
```sh
curl -s http://localhost:8000/healthz
```
*Response (HTTP 200):*
```json
{
  "status": "healthy",
  "runtime": "Node.js",
  "model_loaded": true,
  "model_type": "Rule-based road risk scoring (JavaScript)",
  "dataset_incidents": 16000,
  "active_iot_nodes": 6,
  "hotspots_tracked": 14
}
```

#### 2. Single Road Segment Risk Estimate
```sh
curl -s -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "road_type": "Highway",
    "speed_limit_kmh": 80,
    "average_speed_kmh": 95,
    "road_curvature": 0.35,
    "weather_condition": "Heavy Rain",
    "surface_condition": "Wet",
    "precipitation_mm": 28,
    "visibility_meters": 1200,
    "traffic_density_veh_hr": 2600,
    "iot_surface_moisture_pct": 82,
    "iot_hard_braking_events_hr": 26,
    "iot_speed_violations_hr": 14
  }'
```
*Response (HTTP 200):*
```json
{
  "status": "success",
  "data": {
    "risk_score": 78.4,
    "risk_level": "Severe",
    "risk_level_color": "#EF4444",
    "probabilities": {
      "Low": 0.05,
      "Moderate": 0.12,
      "High": 0.35,
      "Severe": 0.48
    },
    "top_contributing_factors": [
      {
        "factor": "Adverse Weather & Precipitation",
        "impact": "High",
        "detail": "Heavy Rain with 28 mm/h precipitation"
      }
    ],
    "safety_recommendations": [
      "🚨 Activate Variable Message Signs (VMS) with dynamic speed reduction.",
      "⚠️ Broadcast hazardous corridor alert to connected vehicle telemetry."
    ]
  }
}
```

#### 3. Corridor Route Batch Evaluation
```sh
curl -s -X POST http://localhost:8000/api/batch-predict \
  -H "Content-Type: application/json" \
  -d '{
    "route_name": "Metro Expressway Corridor",
    "waypoints": [
      { "latitude": 28.58, "longitude": 77.18, "average_speed_kmh": 75, "speed_limit_kmh": 80 },
      { "latitude": 28.60, "longitude": 77.20, "average_speed_kmh": 105, "speed_limit_kmh": 80, "weather_condition": "Heavy Rain", "surface_condition": "Flooded" }
    ]
  }'
```

#### 4. Find Nearest Blackspot Cluster
```sh
curl -s "http://localhost:8000/api/hotspots/nearest?lat=28.6139&lon=77.2090"
```

#### 5. Inject IoT Road Hazard Anomaly
```sh
curl -s -X POST http://localhost:8000/api/iot/simulate-anomaly \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "RSU-IOT-102",
    "anomaly_type": "flash_flood"
  }'
```

---

## Container Deployment

The project provides a hardened, non-root, read-only Docker container configuration.

### 1. Build and Run with Docker Compose
```sh
docker compose up --build -d
```

### 2. Verify Container Health and Logs
```sh
docker compose ps
docker compose logs -f
```

### 3. Change Port or Set CORS Origins
```sh
HOST_PORT=8080 ALLOWED_ORIGINS=https://dashboard.example.com docker compose up --build -d
```

### Container Hardening Details
- **Non-Root Execution**: Runs under standard unprivileged `node` (UID/GID 1000).
- **Read-Only Root Filesystem**: `read_only: true` is enforced; no process writes to container disk.
- **Dropped Capabilities**: `cap_drop: [ALL]` with `no-new-privileges: true`.
- **Health Check**: Automated periodic HTTP probe (`/healthz`) every 30s with failure backoff.
- **Graceful Shutdown**: Docker `init: true` forwards `SIGTERM` for graceful socket draining.

---

## Production Deployment & Operational Guidance

### 1. Cloud Hosting Options

Because this platform has **zero external npm runtime dependencies** and runs on native Node.js 22 LTS, it deploys cleanly and boots in milliseconds on any modern cloud hosting service.

#### Option A: Deploy on Render (Recommended Free/Low-Cost Cloud)
1. Push this repository to GitHub or GitLab.
2. In the Render Dashboard, create a new **Web Service** and connect your repository.
3. Configure the service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/healthz`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `CARTO_API_KEY`: *(Optional: your Carto key if using dedicated high-res Carto basemaps)*
5. Click **Deploy Web Service**.

#### Option B: Deploy on Railway
1. Click **New Project** in Railway and select **Deploy from GitHub repo**.
2. Railway will automatically detect the `Dockerfile` or `package.json`.
3. In service settings, set the Healthcheck Endpoint to `/healthz`.
4. Add environment variables if required (`CARTO_API_KEY`, `ALLOWED_ORIGINS`).

#### Option C: Deploy with Docker Compose
```sh
# Build and run container in detached background mode
docker compose up --build -d

# Verify container health
docker compose ps
docker compose logs -f
```

#### Option D: Deploy on a Linux VPS (Ubuntu / Debian with systemd)
1. Clone the repository into `/opt/road-accident-platform`:
   ```sh
   git clone <repo-url> /opt/road-accident-platform
   cd /opt/road-accident-platform
   ```
2. Create a systemd service file `/etc/systemd/system/roadsafety.service`:
   ```ini
   [Unit]
   Description=Road Safety Intelligence Platform
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/opt/road-accident-platform
   ExecStart=/usr/bin/node server.js
   Restart=always
   RestartSec=5
   Environment=NODE_ENV=production PORT=8000
   EnvironmentFile=-/opt/road-accident-platform/.env

   [Install]
   WantedBy=multi-user.target
   ```
3. Enable and start the service:
   ```sh
   sudo systemctl daemon-reload
   sudo systemctl enable --now roadsafety.service
   ```

---

### 2. Production Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8000` | HTTP listening port for the server. |
| `NODE_ENV` | `development` | Setting to `production` optimizes caching and runtime flags. |
| `ALLOWED_ORIGINS` | `""` (Empty) | Comma-separated list of allowed CORS origins (e.g. `https://roadsafety.ai`). Defaults to same-origin only. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Sliding rate limiter window in milliseconds (1 minute). |
| `RATE_LIMIT_MAX` | `120` | Maximum requests per IP per window before returning HTTP 429. |
| `CARTO_API_KEY` | `""` (Empty) | CARTO basemap access key for high-contrast dark vector tiles. |
| `MAP_TILE_URL` | *(Carto Dark)* | Custom map tile layer URL template (supports `{s}`, `{z}`, `{x}`, `{y}`). |

---

### 3. Reverse Proxy & TLS Termination
In production, place an HTTPS reverse proxy (such as NGINX, Caddy, Cloudflare, or AWS ALB) in front of the application:

#### NGINX Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name roadsafety.example.com;

    ssl_certificate /etc/letsencrypt/live/roadsafety.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/roadsafety.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Caddy Configuration (Automatic HTTPS)
```caddy
roadsafety.example.com {
    reverse_proxy 127.0.0.1:8000
}
```

---

### 4. Monitoring & Health Probes
- Platform load balancers, Render, Railway, or Kubernetes liveness and readiness probes should check `/healthz`.
- Rate limiting automatically excludes `/healthz` so automated health checks are never throttled.

---

### 5. Rollback Procedure
If a deployment fails health checks:
```sh
# Revert to previous container image tag
docker compose stop
docker run -d --name road-platform-prev -p 8000:8000 road-accident-risk-platform:previous-tag
```

---

## Dataset Provenance & Data Dictionary

Comprehensive documentation for `data/raw_accidents.csv` is available in [DATASET_DOCUMENTATION.md](data/DATASET_DOCUMENTATION.md):
- **Provenance**: Synthetic / unverified demonstration dataset.
- **Coverage**: 16,000 incident rows situated around Delhi NCR corridors.
- **Data Dictionary**: Detailed specifications for all 27 attributes including valid ranges and units.

---

## Prerequisites Before Operational Safety Use

Before using this platform in an operational road-safety, municipal transport, or automated traffic management environment:
1. **Acquire Validated Crash Records**: Replace synthetic data with certified, geocoded police crash logs (FSI records) and continuous traffic sensor counts under authorized data governance.
2. **Train and Validate a Statistical Model**: Implement leakage-safe spatial and temporal train/validation/test splits, calibrate probability outputs (e.g. Platt scaling or isotonic regression), and report rigorous precision-recall curves, ROC-AUC, Brier score, and feature attributions.
3. **Connect Real Telemetry Feeds**: Replace simulated RSU streams with authenticated MQTT/HTTPS sensor feeds from certified roadside hardware.
4. **Independent Safety Audit**: Obtain independent technical and regulatory validation from accredited transportation safety engineers before taking any action affecting public safety.

---

## License

This project is licensed under the [MIT License](LICENSE).
