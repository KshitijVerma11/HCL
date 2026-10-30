'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const MLEngine = require('./js/ml_engine.js');
const GeoEngine = require('./js/geo_engine.js');
const IoTStream = require('./js/iot_stream.js');

const ROOT = __dirname;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_BATCH_SIZE = 100;
const MAX_DATASET_ROWS = 100000;
const DEFAULT_PORT = 8000;
const RISK_LEVELS = new Set(['Low', 'Moderate', 'High', 'Severe']);

function loadEnvFile(envPath = path.join(ROOT, '.env')) {
    if (!fs.existsSync(envPath)) return;
    try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) {
                process.env[key] = val;
            }
        }
    } catch {
        // Silently continue
    }
}
loadEnvFile();

const FAVICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#38BDF8" d="M16 2L4 7v10c0 7.5 5.5 13 12 15 6.5-2 12-7.5 12-15V7L16 2z"/><circle cx="16" cy="11" r="2.5" fill="#EF4444"/><circle cx="16" cy="17" r="2.5" fill="#F59E0B"/><circle cx="16" cy="23" r="2.5" fill="#10B981"/></svg>';

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8'
};

const NUMERIC_FIELDS = new Set([
    'latitude', 'longitude', 'speed_limit_kmh', 'road_curvature',
    'road_elevation_grade', 'hour_of_day', 'day_of_week', 'is_weekend',
    'is_rush_hour', 'temperature_c', 'precipitation_mm', 'visibility_meters',
    'wind_speed_kmh', 'traffic_density_veh_hr', 'average_speed_kmh',
    'heavy_vehicle_pct', 'iot_surface_moisture_pct', 'iot_vibration_index',
    'iot_hard_braking_events_hr', 'iot_speed_violations_hr', 'risk_score'
]);

const NUMERIC_RANGES = {
    latitude: [-90, 90],
    longitude: [-180, 180],
    speed_limit_kmh: [0, 300],
    road_curvature: [0, 1],
    road_elevation_grade: [-100, 100],
    hour_of_day: [0, 23],
    day_of_week: [0, 6],
    is_weekend: [0, 1],
    is_rush_hour: [0, 1],
    temperature_c: [-100, 100],
    precipitation_mm: [0, 1000],
    visibility_meters: [0, 100000],
    wind_speed_kmh: [0, 500],
    traffic_density_veh_hr: [0, 100000],
    average_speed_kmh: [0, 300],
    heavy_vehicle_pct: [0, 100],
    iot_surface_moisture_pct: [0, 100],
    iot_vibration_index: [0, 100],
    iot_hard_braking_events_hr: [0, 100000],
    iot_speed_violations_hr: [0, 100000]
};

const CATEGORICAL_FIELDS = new Set([
    'road_type', 'weather_condition', 'surface_condition', 'lighting_condition'
]);

class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

class RateLimiter {
    constructor(windowMs = 60000, maxRequests = 120) {
        this.windowMs = Math.max(1000, Number(windowMs) || 60000);
        this.maxRequests = Math.max(1, Number(maxRequests) || 120);
        this.clients = new Map();
        this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }

    check(key) {
        const now = Date.now();
        const cutoff = now - this.windowMs;
        let timestamps = this.clients.get(key);

        if (!timestamps) {
            timestamps = [];
            this.clients.set(key, timestamps);
        } else {
            timestamps = timestamps.filter(time => time > cutoff);
            this.clients.set(key, timestamps);
        }

        if (timestamps.length >= this.maxRequests) {
            const oldest = timestamps[0];
            const retryAfterSec = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
            return {
                allowed: false,
                limit: this.maxRequests,
                remaining: 0,
                retryAfterSec: retryAfterSec
            };
        }

        timestamps.push(now);
        return {
            allowed: true,
            limit: this.maxRequests,
            remaining: this.maxRequests - timestamps.length,
            retryAfterSec: Math.ceil(this.windowMs / 1000)
        };
    }

    cleanup() {
        const cutoff = Date.now() - this.windowMs;
        for (const [key, timestamps] of this.clients.entries()) {
            const valid = timestamps.filter(t => t > cutoff);
            if (valid.length === 0) {
                this.clients.delete(key);
            } else {
                this.clients.set(key, valid);
            }
        }
    }

    close() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.clients.clear();
    }
}

function parseCsvRow(line) {
    const fields = [];
    let field = '';
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (quoted && line[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                quoted = !quoted;
            }
        } else if (char === ',' && !quoted) {
            fields.push(field);
            field = '';
        } else {
            field += char;
        }
    }

    if (quoted) {
        throw new Error('Unclosed quoted field in accident dataset.');
    }
    fields.push(field);
    return fields;
}

function loadIncidentData(filePath = path.join(ROOT, 'data', 'raw_accidents.csv')) {
    const csv = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const lines = csv.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
        throw new Error('The accident dataset must contain a header and at least one incident.');
    }

    const headers = parseCsvRow(lines[0]).map(header => header.trim());
    const requiredHeaders = [
        'incident_id', 'latitude', 'longitude', 'road_type',
        'weather_condition', 'average_speed_kmh', 'traffic_density_veh_hr',
        'risk_score', 'risk_level'
    ];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length) {
        throw new Error(`Accident dataset is missing required columns: ${missingHeaders.join(', ')}.`);
    }
    if (lines.length - 1 > MAX_DATASET_ROWS) {
        throw new Error(`Accident dataset exceeds the ${MAX_DATASET_ROWS} row limit.`);
    }

    return lines.slice(1).map((line, index) => {
        const values = parseCsvRow(line);
        if (values.length !== headers.length) {
            throw new Error(`Invalid accident dataset row ${index + 2}: column count does not match the header.`);
        }

        const incident = {};
        headers.forEach((header, column) => {
            const value = values[column].trim();
            if (NUMERIC_FIELDS.has(header)) {
                const number = Number(value);
                if (!value || !Number.isFinite(number)) {
                    throw new Error(`Invalid numeric value for '${header}' on accident dataset row ${index + 2}.`);
                }
                incident[header] = number;
            } else {
                incident[header] = value;
            }
        });

        if (incident.latitude < -90 || incident.latitude > 90 ||
            incident.longitude < -180 || incident.longitude > 180 ||
            incident.risk_score < 0 || incident.risk_score > 100) {
            throw new Error(`Out-of-range coordinate or risk score on accident dataset row ${index + 2}.`);
        }
        if (!incident.incident_id || !incident.road_type ||
            !incident.weather_condition || !RISK_LEVELS.has(incident.risk_level)) {
            throw new Error(`Missing or invalid incident label on accident dataset row ${index + 2}.`);
        }
        return incident;
    });
}

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
    const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (contentType !== 'application/json') {
        throw new HttpError(415, 'Content-Type must be application/json.');
    }

    let body = '';
    for await (const chunk of req) {
        body += chunk.toString('utf8');
        if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
            throw new HttpError(413, `Request body exceeds ${MAX_BODY_BYTES} bytes.`);
        }
    }

    try {
        const parsed = JSON.parse(body);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('JSON body must be an object.');
        }
        return parsed;
    } catch (error) {
        throw new HttpError(400, `Invalid JSON request body: ${error.message}`);
    }
}

function validatePredictionInput(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new HttpError(400, 'Prediction input must be a JSON object.');
    }

    for (const [field, value] of Object.entries(input)) {
        if (Object.hasOwn(NUMERIC_RANGES, field)) {
            const range = NUMERIC_RANGES[field];
            if (!Number.isFinite(value) || value < range[0] || value > range[1]) {
                throw new HttpError(400, `Field '${field}' must be a number between ${range[0]} and ${range[1]}.`);
            }
        } else if (!CATEGORICAL_FIELDS.has(field) || typeof value !== 'string' || value.length > 100) {
            throw new HttpError(400, `Field '${field}' must be a string no longer than 100 characters.`);
        }
    }
}

function isSameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) {
        return true;
    }
    const host = req.headers.host;
    if (!host) {
        return false;
    }
    try {
        const originUrl = new URL(origin);
        return originUrl.host.toLowerCase() === host.toLowerCase();
    } catch {
        return false;
    }
}

function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' https://unpkg.com https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; " +
        "font-src 'self' data: https://fonts.gstatic.com; " +
        "img-src 'self' data: https://unpkg.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com; " +
        "connect-src 'self' https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com; object-src 'none'; " +
        "base-uri 'self'; frame-ancestors 'none'"
    );
}

function serveStatic(req, res, pathname) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.setHeader('Allow', 'GET, HEAD');
        throw new HttpError(405, 'Method not allowed.');
    }

    let decodedPath;
    try {
        decodedPath = decodeURIComponent(pathname);
    } catch {
        throw new HttpError(400, 'Malformed URL path.');
    }

    if (decodedPath === '/favicon.ico' || decodedPath === '/favicon.svg') {
        res.writeHead(200, {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=86400'
        });
        res.end(req.method === 'HEAD' ? undefined : FAVICON_SVG);
        return;
    }

    const filePath = path.resolve(ROOT, `.${decodedPath === '/' ? '/index.html' : decodedPath}`);
    if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
        throw new HttpError(404, 'Not found.');
    }
    const relativePath = path.relative(ROOT, filePath);
    const isPublicScript = relativePath.startsWith(`js${path.sep}`) &&
        path.extname(filePath).toLowerCase() === '.js';
    const isAllowedRootFile = relativePath === 'index.html' ||
        relativePath === 'style.css' ||
        relativePath === 'manifest.json' ||
        relativePath === 'robots.txt';
    if (!isAllowedRootFile && !isPublicScript) {
        throw new HttpError(404, 'Not found.');
    }

    let content;
    try {
        content = fs.readFileSync(filePath);
    } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'EISDIR') {
            throw new HttpError(404, 'Not found.');
        }
        throw error;
    }

    res.writeHead(200, {
        'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': filePath === path.join(ROOT, 'index.html') ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(req.method === 'HEAD' ? undefined : content);
}

function createServer(options = {}) {
    const incidents = options.incidents || loadIncidentData();
    GeoEngine.loadIncidents(incidents);
    const allowedOrigins = new Set(
        (options.allowedOrigins === undefined ? process.env.ALLOWED_ORIGINS || '' : options.allowedOrigins)
            .split(',')
            .map(origin => origin.trim())
            .filter(Boolean)
    );

    const enableLogging = options.enableLogging !== undefined
        ? Boolean(options.enableLogging)
        : (process.env.NODE_ENV !== 'test');

    const rateLimiter = options.rateLimiter !== undefined
        ? options.rateLimiter
        : new RateLimiter(process.env.RATE_LIMIT_WINDOW_MS || 60000, process.env.RATE_LIMIT_MAX || 120);

    const server = http.createServer(async (req, res) => {
        const startTime = Date.now();
        setSecurityHeaders(res);
        res.setHeader('Cache-Control', 'no-store');

        if (enableLogging) {
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                const clientIp = req.socket.remoteAddress || '-';
                console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms ${clientIp}`);
            });
        }

        try {
            const requestUrl = new URL(req.url, 'http://localhost');
            const pathname = requestUrl.pathname;
            const origin = req.headers.origin;
            const sameOrigin = isSameOrigin(req);

            if (origin && (sameOrigin || allowedOrigins.has(origin))) {
                res.setHeader('Access-Control-Allow-Origin', origin);
                res.setHeader('Vary', 'Origin');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            } else if (origin && (pathname.startsWith('/api/') || req.method === 'OPTIONS')) {
                throw new HttpError(403, 'Origin is not allowed.');
            }

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            // Apply Rate Limiting to API requests (excluding health check probes)
            if (rateLimiter && pathname.startsWith('/api/') && pathname !== '/api/health') {
                const clientKey = req.socket.remoteAddress || '127.0.0.1';
                const rateCheck = rateLimiter.check(clientKey);
                res.setHeader('RateLimit-Limit', rateCheck.limit);
                res.setHeader('RateLimit-Remaining', rateCheck.remaining);
                res.setHeader('RateLimit-Reset', rateCheck.retryAfterSec);

                if (!rateCheck.allowed) {
                    res.setHeader('Retry-After', rateCheck.retryAfterSec);
                    throw new HttpError(429, 'Too many requests. Please slow down.');
                }
            }

            if (pathname === '/healthz' || pathname === '/api/health') {
                if (req.method !== 'GET' && req.method !== 'HEAD') {
                    res.setHeader('Allow', 'GET, HEAD');
                    throw new HttpError(405, 'Method not allowed.');
                }
                sendJson(res, 200, {
                    status: 'healthy',
                    runtime: 'Node.js',
                    model_loaded: true,
                    model_type: MLEngine.modelType,
                    dataset_incidents: incidents.length,
                    active_iot_nodes: IoTStream.stations.length,
                    hotspots_tracked: GeoEngine.hotspots.length
                });
                return;
            }

            if (pathname === '/api/incidents') {
                if (req.method !== 'GET') {
                    res.setHeader('Allow', 'GET');
                    throw new HttpError(405, 'Method not allowed.');
                }
                sendJson(res, 200, { status: 'success', count: incidents.length, data: incidents });
                return;
            }

            if (pathname === '/api/predict') {
                if (req.method !== 'POST') {
                    res.setHeader('Allow', 'POST');
                    throw new HttpError(405, 'Method not allowed.');
                }
                const body = await readJsonBody(req);
                validatePredictionInput(body);
                sendJson(res, 200, { status: 'success', data: MLEngine.predictSingle(body) });
                return;
            }

            if (pathname === '/api/batch-predict') {
                if (req.method !== 'POST') {
                    res.setHeader('Allow', 'POST');
                    throw new HttpError(405, 'Method not allowed.');
                }
                const body = await readJsonBody(req);
                if (!Array.isArray(body.waypoints) || body.waypoints.length === 0 || body.waypoints.length > MAX_BATCH_SIZE) {
                    throw new HttpError(400, `waypoints must be a non-empty array with at most ${MAX_BATCH_SIZE} items.`);
                }
                body.waypoints.forEach(validatePredictionInput);
                if (body.route_name !== undefined && (typeof body.route_name !== 'string' || body.route_name.length > 100)) {
                    throw new HttpError(400, 'route_name must be a string no longer than 100 characters.');
                }
                const result = MLEngine.predictBatch(body.waypoints);
                result.route_name = body.route_name || 'Custom Corridor';
                sendJson(res, 200, { status: 'success', data: result });
                return;
            }

            if (pathname === '/api/hotspots') {
                if (req.method !== 'GET') {
                    res.setHeader('Allow', 'GET');
                    throw new HttpError(405, 'Method not allowed.');
                }
                sendJson(res, 200, GeoEngine.toGeoJSON());
                return;
            }

            if (pathname === '/api/hotspots/nearest') {
                if (req.method !== 'GET') {
                    res.setHeader('Allow', 'GET');
                    throw new HttpError(405, 'Method not allowed.');
                }
                const lat = requestUrl.searchParams.has('lat') ? Number(requestUrl.searchParams.get('lat')) : 28.6139;
                const lon = requestUrl.searchParams.has('lon') ? Number(requestUrl.searchParams.get('lon')) : 77.209;
                if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
                    !Number.isFinite(lon) || lon < -180 || lon > 180) {
                    throw new HttpError(400, 'lat and lon must be valid geographic coordinates.');
                }
                sendJson(res, 200, { status: 'success', data: GeoEngine.findNearestHotspot(lat, lon) });
                return;
            }

            if (pathname === '/api/iot/telemetry') {
                if (req.method !== 'GET') {
                    res.setHeader('Allow', 'GET');
                    throw new HttpError(405, 'Method not allowed.');
                }
                if (typeof IoTStream.syncLivePhysicalWeather === 'function') {
                    await IoTStream.syncLivePhysicalWeather().catch(() => {});
                }
                sendJson(res, 200, {
                    status: 'success',
                    timestamp: new Date().toISOString(),
                    live_physical_feed: typeof IoTStream.getLivePhysicalWeather === 'function' ? IoTStream.getLivePhysicalWeather() : null,
                    nodes: IoTStream.getLatestTelemetry()
                });
                return;
            }

            if (pathname === '/api/iot/simulate-anomaly') {
                if (req.method !== 'POST') {
                    res.setHeader('Allow', 'POST');
                    throw new HttpError(405, 'Method not allowed.');
                }
                const body = await readJsonBody(req);
                const supportedAnomalies = new Set(['normal', 'flash_flood', 'dense_fog', 'speeding_hotspot', 'heavy_congestion', 'crash_impact']);
                const knownNode = IoTStream.stations.some(station => station.node_id === body.node_id);
                if (!knownNode || !supportedAnomalies.has(body.anomaly_type)) {
                    throw new HttpError(400, 'node_id or anomaly_type is not recognized.');
                }
                IoTStream.setAnomaly(body.node_id, body.anomaly_type);
                sendJson(res, 200, {
                    status: 'success',
                    message: `Anomaly '${body.anomaly_type}' applied to ${body.node_id}`
                });
                return;
            }

            if (pathname === '/api/model/metrics') {
                if (req.method !== 'GET') {
                    res.setHeader('Allow', 'GET');
                    throw new HttpError(405, 'Method not allowed.');
                }
                sendJson(res, 200, MLEngine.getModelMetadata());
                return;
            }

            if (pathname === '/api/config/map') {
                if (req.method !== 'GET') {
                    res.setHeader('Allow', 'GET');
                    throw new HttpError(405, 'Method not allowed.');
                }
                const rawKey = (process.env.CARTO_API_KEY || '').trim();
                const tileUrl = process.env.MAP_TILE_URL ||
                    (rawKey
                        ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${encodeURIComponent(rawKey)}`
                        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');
                sendJson(res, 200, {
                    status: 'success',
                    provider: rawKey || process.env.MAP_TILE_URL ? 'carto_configured' : 'carto_public',
                    tile_url: tileUrl,
                    subdomains: 'abcd',
                    max_zoom: 19,
                    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
                });
                return;
            }

            if (pathname.startsWith('/api/')) {
                throw new HttpError(404, 'API endpoint not found.');
            }

            serveStatic(req, res, pathname);
        } catch (error) {
            if (res.headersSent) {
                res.destroy(error);
                return;
            }
            const statusCode = error instanceof HttpError ? error.statusCode : 500;
            if (statusCode === 500 && enableLogging) {
                console.error('Request failed:', error);
            }
            sendJson(res, statusCode, {
                status: 'error',
                error: statusCode === 500 ? 'Internal server error.' : error.message
            });
        }
    });

    server.requestTimeout = 30000;
    server.headersTimeout = 10000;
    server.keepAliveTimeout = 5000;

    const originalClose = server.close.bind(server);
    server.close = function (callback) {
        if (rateLimiter && typeof rateLimiter.close === 'function') {
            rateLimiter.close();
        }
        return originalClose(callback);
    };

    return server;
}

function setupGracefulShutdown(server) {
    let shuttingDown = false;
    const shutdown = (signal) => {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log(`\nReceived ${signal}. Gracefully stopping Road Accident Risk Platform...`);

        server.close(error => {
            if (error) {
                console.error('Error during shutdown:', error);
                process.exit(1);
            }
            console.log('Server stopped cleanly.');
            process.exit(0);
        });

        setTimeout(() => {
            console.error('Graceful shutdown timeout exceeded. Forcing termination.');
            process.exit(1);
        }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
    const port = Number(process.env.PORT || DEFAULT_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        console.error('PORT must be an integer between 1 and 65535.');
        process.exitCode = 1;
    } else {
        const server = createServer();
        server.listen(port, '0.0.0.0', () => {
            console.log(`Road Accident Risk Platform listening on port ${port}`);
        });
        server.on('error', error => {
            console.error('Unable to start server:', error);
            process.exitCode = 1;
        });
        setupGracefulShutdown(server);
    }
}

module.exports = { createServer, loadIncidentData, parseCsvRow, RateLimiter };
