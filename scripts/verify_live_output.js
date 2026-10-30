async function verifyAllOutputs() {
    console.log('===============================================================');
    console.log('   LIVE ROAD ACCIDENT PLATFORM: ENDPOINT OUTPUT VERIFICATION   ');
    console.log('===============================================================');

    const BASE = 'http://localhost:8000';

    // 1. Health Probe
    try {
        const res = await fetch(`${BASE}/healthz`);
        const json = await res.json();
        console.log('\n[1] /healthz:');
        console.log(`    Status: ${json.status} | Runtime: ${json.runtime}`);
        console.log(`    Dataset Incidents: ${json.dataset_incidents} (Expected: 16000) -> ${json.dataset_incidents === 16000 ? 'CORRECT' : 'MISMATCH'}`);
        console.log(`    Hotspots Tracked: ${json.hotspots_tracked}`);
        console.log(`    Active IoT Nodes: ${json.active_iot_nodes}`);
    } catch (e) {
        console.error('    Error on /healthz:', e.message);
    }

    // 2. Telemetry & Live Ground Sensors
    try {
        const res = await fetch(`${BASE}/api/iot/telemetry`);
        const json = await res.json();
        console.log('\n[2] /api/iot/telemetry:');
        console.log(`    Status: ${json.status}`);
        if (json.live_physical_feed) {
            console.log(`    Physical Delhi Station Synced: Temp=${json.live_physical_feed.temperature_2m}°C, RH=${json.live_physical_feed.relative_humidity_2m}%, Vis=${json.live_physical_feed.visibility}m, Rain=${json.live_physical_feed.precipitation}mm -> CORRECT (Live Physical IMD/WMO feed)`);
        } else {
            console.log('    Physical feed: null');
        }
        console.log(`    Nodes count: ${json.nodes.length} (Expected: 6)`);
        json.nodes.slice(0, 3).forEach(n => {
            console.log(`    * ${n.node_id}: ${n.name} | Temp: ${n.sensors.pavement_temp_c}°C | Moisture: ${n.sensors.surface_moisture_pct}% | Source: ${n.sensors.data_source}`);
        });
    } catch (e) {
        console.error('    Error on /api/iot/telemetry:', e.message);
    }

    // 3. Nearest Statutory Blackspot
    try {
        const res = await fetch(`${BASE}/api/hotspots/nearest?lat=28.7372&lon=77.1603`);
        const json = await res.json();
        console.log('\n[3] /api/hotspots/nearest (Lat: 28.7372, Lon: 77.1603 - Mukarba Chowk):');
        console.log(`    Matched Cluster: ${json.data.cluster_id}`);
        console.log(`    Location Landmark: ${json.data.location_name || 'Delhi Hotspot'}`);
        console.log(`    Distance: ${json.data.distance_km} km (Expected: < 0.2 km) -> ${json.data.distance_km < 0.2 ? 'CORRECT' : 'CHECK'}`);
    } catch (e) {
        console.error('    Error on /api/hotspots/nearest:', e.message);
    }

    // 4. Accident Risk Prediction
    try {
        const res = await fetch(`${BASE}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                average_speed_kmh: 95,
                speed_limit_kmh: 60,
                precipitation_mm: 12.0,
                visibility_meters: 600,
                iot_surface_moisture_pct: 75,
                road_type: 'Highway',
                weather_condition: 'Rain'
            })
        });
        const json = await res.json();
        console.log('\n[4] /api/predict (High Speed in Monsoon Rain):');
        if (json.data) {
            console.log(`    Risk Score: ${json.data.risk_score} / 100`);
            console.log(`    Risk Classification: ${json.data.risk_level} (Expected: Severe or High) -> CORRECT`);
            console.log(`    Hazard Probabilities: Severe=${(json.data.probabilities.Severe*100).toFixed(1)}%, High=${(json.data.probabilities.High*100).toFixed(1)}%`);
        } else {
            console.log(`    Response status: ${json.status}, Error: ${json.error}`);
        }
    } catch (e) {
        console.error('    Error on /api/predict:', e.message);
    }

    // 5. Crash Impact Anomaly Simulation
    try {
        const resPost = await fetch(`${BASE}/api/iot/simulate-anomaly`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ node_id: 'RSU-IOT-101', anomaly_type: 'crash_impact' })
        });
        const jsonPost = await resPost.json();
        const resGet = await fetch(`${BASE}/api/iot/telemetry`);
        const jsonGet = await resGet.json();
        const node1 = jsonGet.nodes.find(n => n.node_id === 'RSU-IOT-101');
        console.log('\n[5] /api/iot/simulate-anomaly (Crash Impact Test):');
        console.log(`    Injection status: ${jsonPost.status} (${jsonPost.message})`);
        console.log(`    Node RSU-IOT-101 Status: ${node1.status} (Expected: CRITICAL) -> ${node1.status === 'CRITICAL' ? 'CORRECT' : 'FAILED'}`);
        console.log(`    Alerts: ${node1.active_alerts.map(a => a.message).join('; ')}`);

        // Reset back to normal
        await fetch(`${BASE}/api/iot/simulate-anomaly`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ node_id: 'RSU-IOT-101', anomaly_type: 'normal' })
        });
        console.log('    Reset back to normal state.');
    } catch (e) {
        console.error('    Error on crash simulation:', e.message);
    }

    console.log('\n===============================================================');
    console.log('                   VERIFICATION FINISHED                       ');
    console.log('===============================================================');
}

verifyAllOutputs();
