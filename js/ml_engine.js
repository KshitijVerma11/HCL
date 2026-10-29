/**
 * Road Risk Engine: transparent heuristic scoring in pure JavaScript.
 * Provides risk estimates, class probabilities, factor explainability,
 * and automated safety recommendations.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.MLEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    const RISK_LEVEL_CLASSES = ['Low', 'Moderate', 'High', 'Severe'];
    const RISK_COLORS = {
        'Low': '#10B981',       // Emerald Green
        'Moderate': '#F59E0B',  // Amber Yellow
        'High': '#F97316',      // Vibrant Orange
        'Severe': '#EF4444'     // Crimson Red
    };

    // Coefficients match the heuristic formula below; they are not learned weights.
    const RISK_FACTOR_WEIGHTS = [
        { feature: "Speed ratio", coefficient: 20 },
        { feature: "Overspeed", coefficient: 16 },
        { feature: "Road curvature", coefficient: 16 },
        { feature: "Elevation grade", coefficient: 8 },
        { feature: "Precipitation", coefficient: 18 },
        { feature: "Low visibility", coefficient: 18 },
        { feature: "Traffic density", coefficient: 14 },
        { feature: "Heavy vehicles", coefficient: 10 },
        { feature: "Surface moisture", coefficient: 12 },
        { feature: "Hard braking", coefficient: 14 },
        { feature: "Road vibration", coefficient: 8 },
        { feature: "Speed violations", coefficient: 10 },
        { feature: "Unlit road", coefficient: 14 },
        { feature: "Lit road at night", coefficient: 6 },
        { feature: "Flooded or icy surface", coefficient: 18 },
        { feature: "Wet surface", coefficient: 8 },
        { feature: "Intersection or roundabout", coefficient: 8 }
    ];

    class RoadRiskScorer {
        constructor() {
            this.version = "1.0.0";
            this.modelType = "Rule-based road risk scoring (JavaScript)";
        }

        /**
         * Normalizes and validates input features
         */
        normalizeInput(inp) {
            inp = inp || {};
            const number = (field, fallback) =>
                inp[field] === undefined || inp[field] === null || inp[field] === ''
                    ? fallback
                    : Number(inp[field]);
            return {
                latitude: number('latitude', 28.6139),
                longitude: number('longitude', 77.2090),
                road_type: inp.road_type || "Highway",
                speed_limit_kmh: number('speed_limit_kmh', 80),
                road_curvature: number('road_curvature', 0.2),
                road_elevation_grade: number('road_elevation_grade', 0.0),
                hour_of_day: number('hour_of_day', 14),
                day_of_week: number('day_of_week', 2),
                is_weekend: number('is_weekend', 0),
                is_rush_hour: number('is_rush_hour', 0),
                weather_condition: inp.weather_condition || "Clear",
                surface_condition: inp.surface_condition || "Dry",
                lighting_condition: inp.lighting_condition || "Daylight",
                temperature_c: number('temperature_c', 25.0),
                precipitation_mm: number('precipitation_mm', 0.0),
                visibility_meters: number('visibility_meters', 10000),
                wind_speed_kmh: number('wind_speed_kmh', 15.0),
                traffic_density_veh_hr: number('traffic_density_veh_hr', 1200),
                average_speed_kmh: number('average_speed_kmh', 75.0),
                heavy_vehicle_pct: number('heavy_vehicle_pct', 12.0),
                iot_surface_moisture_pct: number('iot_surface_moisture_pct', 10.0),
                iot_vibration_index: number('iot_vibration_index', 2.5),
                iot_hard_braking_events_hr: number('iot_hard_braking_events_hr', 5),
                iot_speed_violations_hr: number('iot_speed_violations_hr', 3)
            };
        }

        /**
         * Deterministic heuristic risk estimate
         */
        predictSingle(rawInput) {
            const d = this.normalizeInput(rawInput);

            // 1. Compute physical & empirical risk components
            let risk = 0.0;

            // Speed & overspeeding
            const speedRatio = d.average_speed_kmh / 120.0;
            const overspeed = Math.max(0, d.average_speed_kmh - d.speed_limit_kmh);
            risk += speedRatio * 20.0;
            risk += (overspeed / 20.0) * 16.0;

            // Curvature & geometry
            risk += Math.pow(d.road_curvature, 1.3) * 16.0;
            risk += (Math.abs(d.road_elevation_grade) / 8.0) * 8.0;

            // Weather & precipitation
            risk += (d.precipitation_mm / 50.0) * 18.0;
            risk += (Math.max(0, 3000.0 - d.visibility_meters) / 3000.0) * 18.0;

            // Traffic volume & heavy trucks
            risk += (d.traffic_density_veh_hr / 4000.0) * 14.0;
            risk += (d.heavy_vehicle_pct / 50.0) * 10.0;

            // IoT Roadside Telemetry
            risk += (d.iot_surface_moisture_pct / 100.0) * 12.0;
            risk += (d.iot_hard_braking_events_hr / 50.0) * 14.0;
            risk += (d.iot_vibration_index / 10.0) * 8.0;
            risk += (d.iot_speed_violations_hr / 40.0) * 10.0;

            // Categorical hazard penalties
            if (d.lighting_condition === 'Dark - No Street Lights') risk += 14.0;
            else if (d.lighting_condition === 'Dark - Street Lights On') risk += 6.0;

            if (d.surface_condition === 'Flooded' || d.surface_condition === 'Ice/Snow') risk += 18.0;
            else if (d.surface_condition === 'Wet') risk += 8.0;

            if (d.road_type === 'Intersection' || d.road_type === 'Roundabout') risk += 8.0;

            // Scale to 0 - 100
            let finalScore = Math.min(99.5, Math.max(2.5, risk * 0.65));
            finalScore = Math.round(finalScore * 10) / 10;

            // Determine Risk Tier
            let level = 'Low';
            if (finalScore > 75.0) level = 'Severe';
            else if (finalScore > 55.0) level = 'High';
            else if (finalScore > 30.0) level = 'Moderate';

            // Calculate class probability distributions (Softmax approximation)
            const probabilities = this.calculateProbabilities(finalScore, level);

            // Explainable hazard drivers
            const factors = this.explainRiskFactors(d, finalScore);

            // Automated Safety Interventions
            const recommendations = this.generateRecommendations(level, factors);

            return {
                risk_score: finalScore,
                risk_level: level,
                risk_level_color: RISK_COLORS[level],
                probabilities: probabilities,
                top_contributing_factors: factors,
                safety_recommendations: recommendations,
                input_summary: {
                    road_type: d.road_type,
                    weather: d.weather_condition,
                    surface: d.surface_condition,
                    visibility_m: d.visibility_meters,
                    traffic_density: d.traffic_density_veh_hr,
                    avg_speed_kmh: d.average_speed_kmh,
                    iot_braking_events: d.iot_hard_braking_events_hr
                }
            };
        }

        /**
         * Calculates multi-class probability spread
         */
        calculateProbabilities(score, level) {
            let pLow = 0, pMod = 0, pHigh = 0, pSev = 0;

            if (score <= 30) {
                pLow = 0.70 + (30 - score) * 0.009;
                pMod = 1.0 - pLow;
            } else if (score <= 55) {
                const ratio = (score - 30) / 25;
                pMod = 0.65;
                pLow = (1 - ratio) * 0.25;
                pHigh = ratio * 0.25;
            } else if (score <= 75) {
                const ratio = (score - 55) / 20;
                pHigh = 0.68;
                pMod = (1 - ratio) * 0.20;
                pSev = ratio * 0.20;
            } else {
                pSev = 0.72 + (score - 75) * 0.009;
                pHigh = 1.0 - pSev;
            }

            const total = pLow + pMod + pHigh + pSev;
            return {
                'Low': Math.round((pLow / total) * 1000) / 1000,
                'Moderate': Math.round((pMod / total) * 1000) / 1000,
                'High': Math.round((pHigh / total) * 1000) / 1000,
                'Severe': Math.round((pSev / total) * 1000) / 1000
            };
        }

        /**
         * Explains the driving factors contributing to the predicted risk
         */
        explainRiskFactors(inp, score) {
            const factors = [];

            if (inp.precipitation_mm > 15 || ['Rain', 'Heavy Rain', 'Snow'].includes(inp.weather_condition)) {
                factors.push({
                    factor: "Adverse Weather & Precipitation",
                    impact: "High",
                    detail: `${inp.weather_condition} with ${inp.precipitation_mm} mm/h precipitation`
                });
            }

            if (inp.visibility_meters < 1500) {
                factors.push({
                    factor: "Severely Restricted Visibility",
                    impact: "High",
                    detail: `Sight distance restricted to ${inp.visibility_meters} meters`
                });
            }

            if (inp.average_speed_kmh > inp.speed_limit_kmh * 1.1) {
                const diff = (inp.average_speed_kmh - inp.speed_limit_kmh).toFixed(1);
                factors.push({
                    factor: "Speeding & Velocity Disparity",
                    impact: "High",
                    detail: `Traffic exceeding speed limit (${inp.speed_limit_kmh} km/h) by ${diff} km/h`
                });
            }

            if (inp.road_curvature > 0.45) {
                factors.push({
                    factor: "Sharp Road Geometry & Curvature",
                    impact: "Medium",
                    detail: `High curvature index (${inp.road_curvature.toFixed(2)}) at road segment`
                });
            }

            if (inp.iot_hard_braking_events_hr > 20) {
                factors.push({
                    factor: "IoT Hard Braking Spike",
                    impact: "High",
                    detail: `Roadside sensors detected ${inp.iot_hard_braking_events_hr} rapid deceleration events/hr`
                });
            }

            if (['Wet', 'Flooded', 'Ice/Snow'].includes(inp.surface_condition)) {
                factors.push({
                    factor: "Low Pavement Friction & Aquaplaning Risk",
                    impact: "High",
                    detail: `Pavement is ${inp.surface_condition} with ${inp.iot_surface_moisture_pct}% moisture film`
                });
            }

            if (inp.lighting_condition === 'Dark - No Street Lights') {
                factors.push({
                    factor: "Unlit Nighttime Corridor",
                    impact: "Medium",
                    detail: "Darkness without illumination increases driver reaction time"
                });
            }

            if (factors.length === 0) {
                factors.push({
                    factor: "Optimal Baseline Conditions",
                    impact: "Low",
                    detail: "Road geometry, weather, and traffic volume within standard safety margins"
                });
            }

            return factors;
        }

        /**
         * Automated safety interventions
         */
        generateRecommendations(level, factors) {
            const recs = [];
            if (['High', 'Severe'].includes(level)) {
                recs.push("🚨 Activate Variable Message Signs (VMS) with dynamic speed reduction.");
                recs.push("⚠️ Broadcast hazardous corridor alert to connected vehicle telemetry.");
            }

            for (const f of factors) {
                const name = f.factor;
                if (name.includes("Weather") || name.includes("Precipitation")) {
                    recs.push("🌧️ Alert road drainage maintenance for aquaplaning mitigation.");
                }
                if (name.includes("Visibility")) {
                    recs.push("🌫️ Switch on fog-piercing reflective highway LED beacons.");
                }
                if (name.includes("Braking") || name.includes("Speeding")) {
                    recs.push("🚓 Dispatch highway traffic patrol & trigger radar speed cameras.");
                }
                if (name.includes("Friction") || name.includes("Aquaplaning")) {
                    recs.push("🚜 Deploy high-friction anti-skid surface treatment.");
                }
            }

            if (recs.length === 0) {
                recs.push("✅ Road conditions nominal. Cruising speed flow permitted.");
            }

            return recs.slice(0, 4);
        }

        /**
         * Batch route prediction across multi-waypoints
         */
        predictBatch(waypoints) {
            const predictions = [];
            const scores = [];
            const highRiskSegments = [];

            waypoints.forEach((wp, idx) => {
                const pred = this.predictSingle(wp);
                pred.waypoint_index = idx;
                pred.latitude = wp.latitude !== undefined ? wp.latitude : 28.6139;
                pred.longitude = wp.longitude !== undefined ? wp.longitude : 77.2090;
                predictions.push(pred);
                scores.push(pred.risk_score);

                if (['High', 'Severe'].includes(pred.risk_level)) {
                    highRiskSegments.push({
                        waypoint_index: idx,
                        lat: pred.latitude,
                        lon: pred.longitude,
                        risk_score: pred.risk_score,
                        risk_level: pred.risk_level,
                        primary_hazard: pred.top_contributing_factors[0] ? pred.top_contributing_factors[0].factor : "Traffic Flow"
                    });
                }
            });

            const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            const maxScore = scores.length ? Math.max(...scores) : 0;

            let routeLevel = "Low";
            if (maxScore > 75) routeLevel = "Severe";
            else if (avgScore > 55) routeLevel = "High";
            else if (avgScore > 30) routeLevel = "Moderate";

            return {
                total_waypoints: waypoints.length,
                overall_route_risk_level: routeLevel,
                overall_route_risk_color: RISK_COLORS[routeLevel],
                average_risk_score: Math.round(avgScore * 10) / 10,
                peak_risk_score: Math.round(maxScore * 10) / 10,
                high_risk_segments_count: highRiskSegments.length,
                high_risk_segments: highRiskSegments,
                waypoint_predictions: predictions
            };
        }

        getModelMetadata() {
            return {
                model_type: this.modelType,
                version: this.version,
                evaluation_status: "not_evaluated",
                evaluation_note: "This heuristic scorer has not been validated against a held-out labeled dataset.",
                classes: RISK_LEVEL_CLASSES,
                risk_factors: RISK_FACTOR_WEIGHTS
            };
        }
    }

    return new RoadRiskScorer();
}));
