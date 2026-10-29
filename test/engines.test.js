'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const MLEngine = require('../js/ml_engine.js');
const GeoEngine = require('../js/geo_engine.js');
const IoTStream = require('../js/iot_stream.js');

test('browser application controller parses successfully', () => {
    const appSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
    assert.doesNotThrow(() => new vm.Script(appSource));
});

test('risk prediction returns bounded score and probabilities summing to one', () => {
    const prediction = MLEngine.predictSingle({
        average_speed_kmh: 140,
        speed_limit_kmh: 80,
        precipitation_mm: 25,
        visibility_meters: 900
    });
    assert.ok(prediction.risk_score >= 0 && prediction.risk_score <= 100);
    const probabilityTotal = Object.values(prediction.probabilities).reduce((sum, value) => sum + value, 0);
    assert.ok(Math.abs(probabilityTotal - 1) < 0.01);
});

test('batch prediction preserves valid zero coordinates', () => {
    const result = MLEngine.predictBatch([{ latitude: 0, longitude: 0 }]);
    assert.equal(result.waypoint_predictions[0].latitude, 0);
    assert.equal(result.waypoint_predictions[0].longitude, 0);
});

test('haversine distance remains finite for antipodal coordinates', () => {
    assert.ok(Number.isFinite(GeoEngine.haversineDistance(0, 0, 0, 180)));
});

test('historical incidents replace generated demo rows and rebuild hotspots', () => {
    const originalCount = GeoEngine.incidents.length;
    const sample = [{
        incident_id: 'TEST-1',
        latitude: 28.61,
        longitude: 77.20,
        road_type: 'Highway',
        weather_condition: 'Clear',
        risk_score: 42,
        risk_level: 'Moderate'
    }];
    assert.equal(GeoEngine.loadIncidents(sample), 1);
    assert.equal(GeoEngine.incidents[0].incident_id, 'TEST-1');
    assert.ok(originalCount > 0);
});

test('IoT anomaly injection produces a critical flood alert', () => {
    const nodeId = IoTStream.stations[0].node_id;
    IoTStream.setAnomaly(nodeId, 'flash_flood');
    const telemetry = IoTStream.getLatestTelemetry().find(node => node.node_id === nodeId);
    assert.equal(telemetry.status, 'CRITICAL');
    assert.ok(telemetry.active_alerts.some(alert => alert.type === 'AQUAPLANING_RISK'));
    IoTStream.setAnomaly(nodeId, 'normal');
});
