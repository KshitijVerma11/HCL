'use strict';

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { createServer, loadIncidentData, parseCsvRow, RateLimiter } = require('../server.js');

let server;
let baseUrl;

before(async () => {
    server = createServer({
        allowedOrigins: 'https://dashboard.example',
        enableLogging: false
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (server) {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});

test('CSV parser supports quoted commas and escaped quotes', () => {
    assert.deepEqual(parseCsvRow('"road, segment","said ""slow down"""'), ['road, segment', 'said "slow down"']);
});

test('historical dataset loads with coordinates and risk labels', () => {
    const incidents = loadIncidentData();
    assert.ok(incidents.length > 0);
    assert.ok(incidents.every(row =>
        Number.isFinite(row.latitude) &&
        Number.isFinite(row.longitude) &&
        Number.isFinite(row.risk_score) &&
        typeof row.risk_level === 'string'
    ));
});

test('health endpoint reports the loaded incident dataset', async () => {
    const response = await fetch(`${baseUrl}/healthz`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.status, 'healthy');
    assert.equal(body.dataset_incidents, loadIncidentData().length);
    assert.match(response.headers.get('content-security-policy'), /tile\.openstreetmap\.org/);
});

test('incidents endpoint serves historical CSV records', async () => {
    const response = await fetch(`${baseUrl}/api/incidents`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.count, body.data.length);
    assert.ok(body.data.length > 0);
});

test('prediction endpoint validates and scores a valid request', async () => {
    const response = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ average_speed_kmh: 0, speed_limit_kmh: 80 })
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.ok(body.data.risk_score >= 0 && body.data.risk_score <= 100);
    assert.equal(body.data.input_summary.avg_speed_kmh, 0);
});

test('prediction endpoint allows same-origin POST requests with Origin header', async () => {
    const response = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'origin': baseUrl
        },
        body: JSON.stringify({ average_speed_kmh: 70, speed_limit_kmh: 80 })
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'success');
});

test('prediction endpoint rejects invalid numeric values and malformed JSON', async () => {
    const invalidFeature = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ latitude: 91 })
    });
    assert.equal(invalidFeature.status, 400);

    const invalidJson = await fetch(`${baseUrl}/api/predict`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{invalid'
    });
    assert.equal(invalidJson.status, 400);
});

test('batch endpoint enforces the route waypoint limit', async () => {
    const response = await fetch(`${baseUrl}/api/batch-predict`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ waypoints: Array.from({ length: 101 }, () => ({})) })
    });
    assert.equal(response.status, 400);
});

test('batch endpoint processes valid route waypoints', async () => {
    const response = await fetch(`${baseUrl}/api/batch-predict`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            route_name: 'Test Corridor',
            waypoints: [
                { latitude: 28.61, longitude: 77.20, average_speed_kmh: 80 },
                { latitude: 28.62, longitude: 77.21, average_speed_kmh: 110 }
            ]
        })
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'success');
    assert.equal(body.data.route_name, 'Test Corridor');
    assert.equal(body.data.total_waypoints, 2);
});

test('CORS only permits configured origins', async () => {
    const permitted = await fetch(`${baseUrl}/api/health`, {
        headers: { origin: 'https://dashboard.example' }
    });
    assert.equal(permitted.headers.get('access-control-allow-origin'), 'https://dashboard.example');

    const denied = await fetch(`${baseUrl}/api/health`, {
        headers: { origin: 'https://untrusted.example' }
    });
    assert.equal(denied.status, 403);
});

test('preflight OPTIONS request succeeds for allowed origins', async () => {
    const response = await fetch(`${baseUrl}/api/predict`, {
        method: 'OPTIONS',
        headers: { origin: 'https://dashboard.example' }
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://dashboard.example');
});

test('API endpoints return 405 Method Not Allowed for unsupported verbs', async () => {
    const responseGet = await fetch(`${baseUrl}/api/predict`, { method: 'GET' });
    assert.equal(responseGet.status, 405);
    assert.equal(responseGet.headers.get('allow'), 'POST');

    const responsePost = await fetch(`${baseUrl}/api/incidents`, { method: 'POST', headers: { 'content-type': 'application/json' } });
    assert.equal(responsePost.status, 405);
    assert.equal(responsePost.headers.get('allow'), 'GET');
});

test('static file server prevents path traversal', async () => {
    const response = await fetch(`${baseUrl}/%2e%2e/server.js`);
    assert.equal(response.status, 404);
    const sourceFile = await fetch(`${baseUrl}/server.js`);
    assert.equal(sourceFile.status, 404);
});

test('favicon request returns SVG icon with 200 status', async () => {
    const response = await fetch(`${baseUrl}/favicon.ico`);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').includes('image/svg+xml'));
    const text = await response.text();
    assert.ok(text.includes('<svg'));
});

test('hotspots endpoint returns GeoJSON feature collection', async () => {
    const response = await fetch(`${baseUrl}/api/hotspots`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.type, 'FeatureCollection');
    assert.ok(Array.isArray(body.features));
});

test('hotspots nearest endpoint returns closest cluster', async () => {
    const response = await fetch(`${baseUrl}/api/hotspots/nearest?lat=28.6139&lon=77.2090`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'success');
    assert.ok(Number.isFinite(body.data.distance_km));
});

test('IoT telemetry endpoint returns latest readings', async () => {
    const response = await fetch(`${baseUrl}/api/iot/telemetry`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'success');
    assert.ok(Array.isArray(body.nodes));
    assert.ok(body.nodes.length > 0);
});

test('IoT anomaly simulation endpoint validates input and sets anomaly', async () => {
    const invalidNode = await fetch(`${baseUrl}/api/iot/simulate-anomaly`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ node_id: 'RSU-NONEXISTENT', anomaly_type: 'flash_flood' })
    });
    assert.equal(invalidNode.status, 400);

    const validNode = await fetch(`${baseUrl}/api/iot/simulate-anomaly`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ node_id: 'RSU-IOT-101', anomaly_type: 'flash_flood' })
    });
    assert.equal(validNode.status, 200);

    // Reset back to normal
    await fetch(`${baseUrl}/api/iot/simulate-anomaly`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ node_id: 'RSU-IOT-101', anomaly_type: 'normal' })
    });
});

test('rate limiter throttles requests exceeding limit', () => {
    const limiter = new RateLimiter(60000, 3);
    const ip = '192.168.1.100';

    assert.equal(limiter.check(ip).allowed, true);
    assert.equal(limiter.check(ip).allowed, true);
    assert.equal(limiter.check(ip).allowed, true);

    const blocked = limiter.check(ip);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfterSec > 0);
    limiter.close();
});

test('model metadata does not claim unmeasured model accuracy', async () => {
    const response = await fetch(`${baseUrl}/api/model/metrics`);
    const body = await response.json();
    assert.equal(body.evaluation_status, 'not_evaluated');
    assert.equal(body.metrics, undefined);
});

test('map configuration endpoint returns tile configuration', async () => {
    const response = await fetch(`${baseUrl}/api/config/map`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'success');
    assert.ok(typeof body.tile_url === 'string');
    assert.ok(body.tile_url.includes('basemaps.cartocdn.com'));
});

test('public metadata endpoints serve web manifest and robots.txt', async () => {
    const manifestRes = await fetch(`${baseUrl}/manifest.json`);
    assert.equal(manifestRes.status, 200);
    assert.ok(manifestRes.headers.get('content-type').includes('application/json'));
    const manifest = await manifestRes.json();
    assert.equal(manifest.name, 'Road Safety Intelligence Platform');

    const robotsRes = await fetch(`${baseUrl}/robots.txt`);
    assert.equal(robotsRes.status, 200);
    assert.ok(robotsRes.headers.get('content-type').includes('text/plain'));
    const robots = await robotsRes.text();
    assert.ok(robots.includes('User-agent: *'));
});


