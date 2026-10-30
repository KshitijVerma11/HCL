/**
 * Embedded IoT Telemetry Streamer & Roadside Alert Manager
 * Simulates real-time sensor data from intelligent Roadside Units (RSUs).
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.IoTStream = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const IOT_STATIONS = [
        {
            node_id: "RSU-IOT-101",
            name: "Mukarba Chowk (NH-44 / Outer Ring Rd)",
            latitude: 28.7372,
            longitude: 77.1603,
            road_type: "Highway",
            speed_limit_kmh: 70,
            sensors_installed: ["Doppler Radar", "Optical Moisture", "MPU6050 Impact", "Photocell"]
        },
        {
            node_id: "RSU-IOT-102",
            name: "Azadpur Chowk (GT Karnal Road)",
            latitude: 28.7070,
            longitude: 77.1780,
            road_type: "Arterial Corridor",
            speed_limit_kmh: 60,
            sensors_installed: ["Ultrasonic Speed Probe", "Optical Moisture", "Doppler Radar"]
        },
        {
            node_id: "RSU-IOT-103",
            name: "Bhalswa Chowk Flyover (Outer Ring Rd)",
            latitude: 28.7420,
            longitude: 77.1680,
            road_type: "Highway/Flyover",
            speed_limit_kmh: 70,
            sensors_installed: ["Curvature Camera", "Inductive Loop", "Wetness Sensor"]
        },
        {
            node_id: "RSU-IOT-104",
            name: "Kashmere Gate ISBT (Ring Road / NH-44)",
            latitude: 28.6675,
            longitude: 77.2285,
            road_type: "Commercial Interchange",
            speed_limit_kmh: 50,
            sensors_installed: ["Traffic Counter", "Inductive Loop", "Photocell Lux"]
        },
        {
            node_id: "RSU-IOT-105",
            name: "Ashram Chowk (Mathura Road / Ring Rd)",
            latitude: 28.5710,
            longitude: 77.2590,
            road_type: "Urban Intersection",
            speed_limit_kmh: 50,
            sensors_installed: ["Optical Moisture", "Traffic Flow Camera", "MPU6050 Impact"]
        },
        {
            node_id: "RSU-IOT-106",
            name: "Dhaula Kuan (Vandemataram Marg)",
            latitude: 28.5925,
            longitude: 77.1590,
            road_type: "Grade-Separated Junction",
            speed_limit_kmh: 60,
            sensors_installed: ["Fog Visibility Beacon", "Weather Probe", "Doppler Radar"]
        }
    ];

    let livePhysicalWeather = null;
    let lastWeatherSync = 0;
    const SYNC_INTERVAL_MS = 600000; // 10 minutes cache

    async function fetchDelhiPhysicalWeather() {
        try {
            const url = 'https://api.open-meteo.com/v1/forecast?latitude=28.7041&longitude=77.1025&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,visibility,wind_speed_10m';
            const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
            if (!res.ok) return null;
            const data = await res.json();
            return data.current || null;
        } catch {
            return null;
        }
    }

    function mapWmoToWeather(code) {
        if (code === 0) return 'Clear';
        if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy';
        if (code === 45 || code === 48) return 'Fog/Mist';
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rain';
        if (code >= 95) return 'Thunderstorm';
        return 'Clear';
    }

    class IoTRoadsideEngine {
        constructor() {
            this.stations = IOT_STATIONS;
            this.anomalies = new Map();
        }

        async syncLivePhysicalWeather() {
            const now = Date.now();
            if (now - lastWeatherSync < SYNC_INTERVAL_MS && livePhysicalWeather) {
                return livePhysicalWeather;
            }
            const current = await fetchDelhiPhysicalWeather();
            if (current) {
                livePhysicalWeather = current;
                lastWeatherSync = now;
            }
            return livePhysicalWeather;
        }

        getLivePhysicalWeather() {
            return livePhysicalWeather;
        }

        setAnomaly(nodeId, anomalyType) {
            if (anomalyType === 'normal') {
                this.anomalies.delete(nodeId);
            } else {
                this.anomalies.set(nodeId, anomalyType);
            }
        }

        clearAnomalies() {
            this.anomalies.clear();
        }

        getLatestTelemetry() {
            const nowIso = new Date().toISOString();
            return this.stations.map(st => {
                const nodeId = st.node_id;
                const anomaly = this.anomalies.get(nodeId);
                const limit = st.speed_limit_kmh;

                const BASELINE_PROFILES = {
                    "RSU-IOT-101": { moisture: 14.5, visibility: 7200, temp: 26.5 },
                    "RSU-IOT-102": { moisture: 18.0, visibility: 6800, temp: 27.2 },
                    "RSU-IOT-103": { moisture: 12.0, visibility: 8500, temp: 25.8 },
                    "RSU-IOT-104": { moisture: 16.5, visibility: 6200, temp: 28.0 },
                    "RSU-IOT-105": { moisture: 11.0, visibility: 7800, temp: 27.8 },
                    "RSU-IOT-106": { moisture: 9.5,  visibility: 9200, temp: 26.0 }
                };
                const base = BASELINE_PROFILES[nodeId] || { moisture: 12.0, visibility: 8000, temp: 26.0 };

                let moisture = base.moisture;
                let surface = "Dry";
                let weather = "Clear";
                let visibility = base.visibility;
                let precip = 0.0;
                let avgSpeed = Math.round(limit * (0.88 + Math.random() * 0.15));
                let braking = Math.floor(1 + Math.random() * 5);
                let vibration = Math.round((1.2 + Math.random() * 1.5) * 10) / 10;
                let violations = Math.floor(1 + Math.random() * 4);
                let temp = base.temp;

                if (livePhysicalWeather) {
                    const realTemp = typeof livePhysicalWeather.temperature_2m === 'number' ? livePhysicalWeather.temperature_2m : 24.0;
                    const realRh = typeof livePhysicalWeather.relative_humidity_2m === 'number' ? livePhysicalWeather.relative_humidity_2m : 60;
                    const realPrecip = typeof livePhysicalWeather.precipitation === 'number' ? livePhysicalWeather.precipitation : 0.0;
                    const realVis = typeof livePhysicalWeather.visibility === 'number' ? livePhysicalWeather.visibility : base.visibility;
                    const realCode = typeof livePhysicalWeather.weather_code === 'number' ? livePhysicalWeather.weather_code : 0;

                    temp = Math.round((realTemp + (base.temp - 26.5) * 0.4) * 10) / 10;
                    precip = realPrecip;
                    visibility = Math.round(realVis);
                    weather = mapWmoToWeather(realCode);
                    if (precip > 0.1) {
                        moisture = Math.min(95, Math.round(precip * 18 + realRh * 0.3));
                        surface = precip > 5 ? "Flooded" : "Wet";
                    } else {
                        moisture = Math.min(45, Math.round(realRh * 0.22));
                        surface = moisture > 28 ? "Damp" : "Dry";
                    }
                }

                if (anomaly === 'flash_flood') {
                    moisture = Math.round((92.0 + Math.random() * 7.5) * 10) / 10;
                    surface = "Flooded";
                    weather = "Heavy Rain";
                    visibility = Math.floor(400 + Math.random() * 600);
                    precip = Math.round((35.0 + Math.random() * 25.0) * 10) / 10;
                    avgSpeed = Math.round(limit * 0.55);
                    braking = Math.floor(20 + Math.random() * 15);
                    vibration = Math.round((6.0 + Math.random() * 2.5) * 10) / 10;
                    violations = Math.floor(1 + Math.random() * 3);
                } else if (anomaly === 'dense_fog') {
                    moisture = Math.round((75.0 + Math.random() * 12.0) * 10) / 10;
                    surface = "Wet";
                    weather = "Fog/Mist";
                    visibility = Math.floor(80 + Math.random() * 250);
                    precip = 0.5;
                    avgSpeed = Math.round(limit * 0.65);
                    braking = Math.floor(14 + Math.random() * 12);
                    violations = 1;
                } else if (anomaly === 'speeding_hotspot') {
                    moisture = 8.0;
                    surface = "Dry";
                    weather = "Clear";
                    avgSpeed = Math.round(limit * 1.35);
                    violations = Math.floor(25 + Math.random() * 20);
                    braking = Math.floor(10 + Math.random() * 12);
                } else if (anomaly === 'heavy_congestion') {
                    avgSpeed = Math.floor(12 + Math.random() * 8);
                    braking = Math.floor(35 + Math.random() * 25);
                    violations = 0;
                } else if (anomaly === 'crash_impact') {
                    surface = "Debris / Hazard";
                    avgSpeed = 0;
                    braking = 50;
                    vibration = 8.8;
                    violations = 0;
                }

                // Active Alert logic
                const activeAlerts = [];
                if (vibration > 3.5 || anomaly === 'crash_impact') {
                    activeAlerts.push({ type: "CRASH_IMPACT_DETECTED", severity: "CRITICAL", message: "🚨 SEVERE VEHICULAR COLLISION DETECTED: Guardrail shock > 3.5g! Approaching motorists reduce speed!" });
                }
                if (moisture > 85.0) {
                    activeAlerts.push({ type: "AQUAPLANING_RISK", severity: "CRITICAL", message: "Water film on road surface - Severe skidding danger" });
                }
                if (visibility < 500) {
                    activeAlerts.push({ type: "DENSE_FOG_WARNING", severity: "HIGH", message: "Sight distance below 500m - Activate fog beacons" });
                }
                if (violations > 15) {
                    activeAlerts.push({ type: "SPEEDING_SURGE", severity: "HIGH", message: `${violations} speed violations detected in last 5min` });
                }
                if (braking > 20) {
                    activeAlerts.push({ type: "HARD_BRAKING_SPIKE", severity: "WARNING", message: "High frequency deceleration events on road loop" });
                }

                const status = activeAlerts.some(a => a.severity === "CRITICAL") ? "CRITICAL" :
                               (activeAlerts.length ? "WARNING" : "ONLINE_OPTIMAL");

                return {
                    node_id: nodeId,
                    name: st.name,
                    latitude: st.latitude,
                    longitude: st.longitude,
                    road_type: st.road_type,
                    speed_limit_kmh: limit,
                    timestamp: nowIso,
                    status: status,
                    sensors: {
                        surface_moisture_pct: moisture,
                        surface_condition: surface,
                        weather_condition: weather,
                        precipitation_mm: precip,
                        visibility_meters: visibility,
                        average_speed_kmh: avgSpeed,
                        traffic_density_veh_hr: anomaly === 'heavy_congestion' ? 3850 : Math.floor(1100 + Math.random() * 1200),
                        vibration_index: vibration,
                        hard_braking_events_5m: braking,
                        speed_violations_5m: violations,
                        pavement_temp_c: temp,
                        battery_pct: Math.floor(92 + Math.random() * 8),
                        data_source: livePhysicalWeather ? "Live Delhi Physical Ground Sensor" : "Calibrated RSU Baseline"
                    },
                    active_alerts: activeAlerts
                };
            });
        }
    }

    return new IoTRoadsideEngine();
}));
