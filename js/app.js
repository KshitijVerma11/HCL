/**
 * Main Application Controller (P_299)
 * Connects UI, Leaflet Maps, Chart.js, Node.js REST API, GeoEngine, and IoT telemetry.
 */

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

document.addEventListener('DOMContentLoaded', async () => {
    const startupError = document.getElementById('startup-error');
    const engineStatus = document.getElementById('system-engine-status');

    try {
        const response = await fetch('/api/incidents');
        if (!response.ok) {
            throw new Error(`Incident dataset request failed with HTTP ${response.status}.`);
        }
        const result = await response.json();
        if (!result.data || !Array.isArray(result.data)) {
            throw new Error('API returned invalid incident dataset payload.');
        }

        GeoEngine.loadIncidents(result.data);

        if (typeof L === 'undefined' || typeof Chart === 'undefined') {
            throw new Error('Map or chart library failed to load; check access to the configured CDN.');
        }

        engineStatus.textContent = '● Online';
        engineStatus.style.color = '#34D399';
    } catch (error) {
        startupError.textContent = `Unable to initialize dashboard: ${error.message}. Ensure the Node.js server is running and required CDNs are reachable.`;
        startupError.hidden = false;
        engineStatus.textContent = '● Offline';
        engineStatus.style.color = '#EF4444';
        console.error('Application startup failed:', error);
        return;
    }

    // 1. Tab Navigation
    initTabs();

    // 2. Initialize Leaflet Map & Spatial Blackspots
    await initMap();

    // 3. Initialize Real-Time Simulator & API Predictions
    initSimulator();

    // 4. Initialize Route Corridor Analyzer
    initRouteAnalyzer();

    // 5. Initialize Live IoT Telemetry & Anomaly Stream
    initIoTStream();

    // 6. Initialize Model Analytics & Charts
    initAnalytics();

    // 7. Initialize REST API Explorer
    initApiExplorer();
});


/* ==========================================================================
   1. TAB NAVIGATION
   ========================================================================== */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');

            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Invalidate Leaflet map size when tab becomes visible
            if (targetId === 'tab-map' && window.leafletMap) {
                setTimeout(() => { window.leafletMap.invalidateSize(); }, 200);
            }
        });
    });
}


/* ==========================================================================
   2. LEAFLET GEOSPATIAL MAP & HOTSPOTS
   ========================================================================== */
let leafletMap;
let incidentLayerGroup, hotspotLayerGroup, iotLayerGroup;

async function initMap() {
    // Center map around Delhi NCR Corridor (28.6139, 77.2090)
    leafletMap = L.map('map').setView([28.6139, 77.2090], 12);
    window.leafletMap = leafletMap;

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let tileOptions = {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    };

    try {
        const configRes = await fetch('/api/config/map');
        if (configRes.ok) {
            const config = await configRes.json();
            if (config.tile_url) {
                tileUrl = config.tile_url;
                if (config.attribution) tileOptions.attribution = config.attribution;
                if (config.subdomains) tileOptions.subdomains = config.subdomains;
                if (config.max_zoom) tileOptions.maxZoom = config.max_zoom;
            }
        }
    } catch {
        // Fallback to default CARTO Dark Matter basemap
    }

    L.tileLayer(tileUrl, tileOptions).addTo(leafletMap);

    incidentLayerGroup = L.layerGroup().addTo(leafletMap);
    hotspotLayerGroup = L.layerGroup().addTo(leafletMap);
    iotLayerGroup = L.layerGroup().addTo(leafletMap);

    // Update KPI counters
    const incidentCountEl = document.getElementById('kpi-incidents-count');
    const analyticsCountEl = document.getElementById('analytics-dataset-count');
    const hotspotsCountEl = document.getElementById('kpi-hotspots-count');

    if (incidentCountEl) incidentCountEl.textContent = GeoEngine.incidents.length.toLocaleString();
    if (analyticsCountEl) analyticsCountEl.textContent = GeoEngine.incidents.length.toLocaleString();
    if (hotspotsCountEl) hotspotsCountEl.textContent = `${GeoEngine.hotspots.length} Zones`;

    // Render layers
    renderMapIncidents();
    renderMapHotspots();
    renderHotspotsTable();

    // Map Click Listener: Query nearest blackspot cluster via REST API
    leafletMap.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        try {
            const res = await fetch(`/api/hotspots/nearest?lat=${lat.toFixed(5)}&lon=${lng.toFixed(5)}`);
            if (!res.ok) return;
            const payload = await res.json();
            const nearest = payload.data;
            if (nearest && nearest.hotspot_id) {
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent(`
                        <div style="font-family: 'Inter', sans-serif; font-size: 0.85rem;">
                            <strong style="color: #38BDF8;">📍 Nearest Hazard Zone</strong><br>
                            <strong>Hotspot:</strong> ${escapeHtml(nearest.hotspot_id)} (${escapeHtml(nearest.hazard_tier)})<br>
                            <strong>Distance:</strong> ${nearest.distance_km} km away<br>
                            <strong>Cluster Avg Risk:</strong> ${nearest.avg_risk_score}/100<br>
                            <strong>Total Incidents:</strong> ${nearest.incident_count}
                        </div>
                    `)
                    .openOn(leafletMap);
            }
        } catch (err) {
            console.warn('Nearest hotspot lookup failed:', err);
        }
    });

    // Bind Filter Controls
    document.getElementById('map-filter-road').addEventListener('change', renderMapIncidents);
    document.getElementById('map-filter-weather').addEventListener('change', renderMapIncidents);
    
    const riskSlider = document.getElementById('map-filter-risk');
    const riskVal = document.getElementById('map-filter-risk-val');
    riskSlider.addEventListener('input', (e) => {
        riskVal.textContent = e.target.value;
        renderMapIncidents();
    });

    document.getElementById('layer-show-hotspots').addEventListener('change', (e) => {
        if (e.target.checked) hotspotLayerGroup.addTo(leafletMap);
        else leafletMap.removeLayer(hotspotLayerGroup);
    });

    document.getElementById('layer-show-iot').addEventListener('change', (e) => {
        if (e.target.checked) iotLayerGroup.addTo(leafletMap);
        else leafletMap.removeLayer(iotLayerGroup);
    });
}

function renderMapIncidents() {
    incidentLayerGroup.clearLayers();

    const roadFilter = document.getElementById('map-filter-road').value;
    const weatherFilter = document.getElementById('map-filter-weather').value;
    const minRisk = parseFloat(document.getElementById('map-filter-risk').value);
    const emptyStateEl = document.getElementById('map-empty-state');

    const filtered = GeoEngine.incidents.filter(inc => {
        const roadMatch = roadFilter === 'ALL' || inc.road_type === roadFilter;
        const weatherMatch = weatherFilter === 'ALL' || inc.weather_condition === weatherFilter;
        const riskMatch = inc.risk_score >= minRisk;
        return roadMatch && weatherMatch && riskMatch;
    });

    if (emptyStateEl) {
        emptyStateEl.hidden = filtered.length > 0;
    }

    // Sample up to 600 incidents for high 60fps browser rendering
    const displayList = filtered.slice(0, 600);

    displayList.forEach(inc => {
        let color = '#34D399'; // Aurora Mint
        if (inc.risk_score > 75) color = '#F87171'; // Crescent Coral
        else if (inc.risk_score > 55) color = '#FB923C'; // Sunset Orange
        else if (inc.risk_score > 30) color = '#FBBF24'; // Golden Amber

        const radius = Math.max(3, Math.min(7.5, inc.risk_score / 13));
        const circle = L.circleMarker([inc.latitude, inc.longitude], {
            radius: radius,
            fillColor: color,
            color: 'rgba(255, 255, 255, 0.4)',
            weight: 0.75,
            opacity: 0.85,
            fillOpacity: 0.72
        });

        circle.bindPopup(`
            <div style="font-family: 'Inter', sans-serif; font-size: 0.85rem; line-height: 1.6;">
                <div style="color: ${color}; font-weight: 700; font-size: 0.92rem; margin-bottom: 4px;">
                    ${escapeHtml(inc.incident_id)} (${escapeHtml(inc.risk_level)} Risk)
                </div>
                <div style="color: #9DB2CE;">
                    <span style="color: #F8FAFC; font-weight: 600;">Risk Score:</span> ${inc.risk_score}/100<br>
                    <span style="color: #F8FAFC; font-weight: 600;">Road:</span> ${escapeHtml(inc.road_type)}<br>
                    <span style="color: #F8FAFC; font-weight: 600;">Weather:</span> ${escapeHtml(inc.weather_condition)}<br>
                    <span style="color: #F8FAFC; font-weight: 600;">Speed:</span> ${inc.average_speed_kmh} km/h<br>
                    <span style="color: #F8FAFC; font-weight: 600;">Traffic Density:</span> ${inc.traffic_density_veh_hr} veh/hr
                </div>
            </div>
        `);

        incidentLayerGroup.addLayer(circle);
    });
}

function renderMapHotspots() {
    hotspotLayerGroup.clearLayers();

    GeoEngine.hotspots.forEach(h => {
        const isExtreme = h.hazard_tier && h.hazard_tier.includes('Extreme');
        const haloRadius = isExtreme ? 18 : 13;
        const haloColor = isExtreme ? '#F43F5E' : '#F97316';

        // Outer soft radiant hazard halo
        const outerHalo = L.circleMarker([h.grid_lat, h.grid_lon], {
            radius: haloRadius,
            fillColor: haloColor,
            color: haloColor,
            weight: 1.2,
            opacity: 0.75,
            fillOpacity: 0.22
        });

        // Inner luminous core beacon
        const innerCore = L.circleMarker([h.grid_lat, h.grid_lon], {
            radius: 4,
            fillColor: '#FFFFFF',
            color: haloColor,
            weight: 2,
            opacity: 0.95,
            fillOpacity: 1
        });

        const locLabel = h.location_name ? `${escapeHtml(h.location_name)} (${escapeHtml(h.hotspot_id)})` : escapeHtml(h.hotspot_id);
        const corridorInfo = h.corridor ? `<div style="color: #FBBF24; font-size: 0.8rem; margin-bottom: 4px;">📍 ${escapeHtml(h.corridor)}</div>` : '';

        const popupContent = `
            <div style="font-family: 'Inter', sans-serif; font-size: 0.86rem; line-height: 1.6;">
                <div style="color: ${haloColor}; font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">
                    🚨 ${locLabel}
                </div>
                ${corridorInfo}
                <div style="color: #9DB2CE;">
                    <span style="color: #F8FAFC; font-weight: 600;">Hazard Tier:</span> <span style="color:${haloColor}; font-weight:600;">${escapeHtml(h.hazard_tier)}</span><br>
                    <span style="color: #F8FAFC; font-weight: 600;">Recorded Incidents:</span> ${h.incident_count}<br>
                    <span style="color: #F8FAFC; font-weight: 600;">Avg Risk Score:</span> ${h.avg_risk_score}/100<br>
                    <span style="color: #F8FAFC; font-weight: 600;">Hazard Index:</span> ${h.composite_hazard_index}<br>
                    <span style="color: #F8FAFC; font-weight: 600;">Dominant Road:</span> ${escapeHtml(h.predominant_road_type)}<br>
                    <span style="color: #F8FAFC; font-weight: 600;">Weather Hazard:</span> ${escapeHtml(h.predominant_weather)}
                </div>
            </div>
        `;

        outerHalo.bindPopup(popupContent);
        innerCore.bindPopup(popupContent);

        hotspotLayerGroup.addLayer(outerHalo);
        hotspotLayerGroup.addLayer(innerCore);
    });
}

function renderMapIoT(nodes) {
    if (!iotLayerGroup) return;
    iotLayerGroup.clearLayers();
    if (!Array.isArray(nodes)) return;

    nodes.forEach(n => {
        const statusColor = n.status === 'CRITICAL' ? '#F87171' : (n.status === 'WARNING' ? '#F59E0B' : '#38BDF8');

        const iotIcon = L.divIcon({
            className: 'custom-iot-icon',
            html: `
                <div class="iot-beacon-ring" style="color: ${statusColor};">
                    <div style="background: ${statusColor}; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid #FFFFFF; box-shadow: 0 0 10px ${statusColor};"></div>
                </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });

        const marker = L.marker([n.latitude, n.longitude], { icon: iotIcon });
        marker.bindPopup(`
            <div style="font-family: 'Inter', sans-serif; font-size: 0.85rem; line-height: 1.6;">
                <div style="color: ${statusColor}; font-weight: 700; font-size: 0.95rem;">
                    📡 ${escapeHtml(n.node_id)}
                </div>
                <div style="color: #9DB2CE; margin-top: 2px;">
                    <span style="color: #CBD5E1;">${escapeHtml(n.name)}</span><br>
                    <span style="color: #F8FAFC; font-weight: 600;">Status:</span> <span style="color:${statusColor}; font-weight:700;">${escapeHtml(n.status)}</span><br>
                    <span style="color: #F8FAFC; font-weight: 600;">Speed:</span> ${n.sensors.average_speed_kmh} km/h (Limit: ${n.speed_limit_kmh})<br>
                    <span style="color: #F8FAFC; font-weight: 600;">Surface Moisture:</span> ${n.sensors.surface_moisture_pct}%<br>
                    <span style="color: #F8FAFC; font-weight: 600;">Hard Braking:</span> ${n.sensors.hard_braking_events_5m} events/5m
                </div>
            </div>
        `);

        iotLayerGroup.addLayer(marker);
    });
}

function renderHotspotsTable() {
    const tbody = document.querySelector('#table-hotspots tbody');
    tbody.innerHTML = '';

    if (!GeoEngine.hotspots.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 18px;">No blackspot zones detected.</td></tr>';
        return;
    }

    GeoEngine.hotspots.slice(0, 8).forEach(h => {
        const tr = document.createElement('tr');
        const locName = h.location_name || h.hotspot_id;
        const corridorSubtitle = h.corridor ? `<div style="font-size: 0.74rem; color: var(--accent-amber); font-weight: 500;">📍 ${escapeHtml(h.corridor)}</div>` : '';

        tr.innerHTML = `
            <td>
                <strong style="color: #F8FAFC;">${escapeHtml(locName)}</strong>
                ${corridorSubtitle}
            </td>
            <td><span class="badge ${h.hazard_tier.includes('Tier-1') ? 'badge-safety' : 'badge-ml'}">${escapeHtml(h.hazard_tier)}</span></td>
            <td>${h.incident_count}</td>
            <td><strong>${h.avg_risk_score}</strong></td>
            <td>${h.composite_hazard_index}</td>
            <td>${escapeHtml(h.predominant_road_type)}</td>
            <td>${escapeHtml(h.predominant_weather)}</td>
        `;
        tbody.appendChild(tr);
    });
}


/* ==========================================================================
   3. REAL-TIME RISK SIMULATOR & CHARTS
   ========================================================================== */
let probChart;

function initSimulator() {
    // Sync slider displays
    const sliders = [
        { id: 'sim-curvature', valId: 'sim-curvature-val', format: v => v },
        { id: 'sim-grade', valId: 'sim-grade-val', format: v => `${v}%` },
        { id: 'sim-hour', valId: 'sim-hour-val', format: v => `${v}:00` },
        { id: 'sim-precip', valId: 'sim-precip-val', format: v => `${v} mm` },
        { id: 'sim-visibility', valId: 'sim-visibility-val', format: v => `${v}m` },
        { id: 'sim-density', valId: 'sim-density-val', format: v => v },
        { id: 'sim-speed', valId: 'sim-speed-val', format: v => `${v} km/h` },
        { id: 'sim-moisture', valId: 'sim-moisture-val', format: v => `${v}%` },
        { id: 'sim-braking', valId: 'sim-braking-val', format: v => v },
        { id: 'sim-violations', valId: 'sim-violations-val', format: v => v }
    ];

    sliders.forEach(s => {
        const el = document.getElementById(s.id);
        const valEl = document.getElementById(s.valId);
        if (el && valEl) {
            el.addEventListener('input', (e) => {
                valEl.textContent = s.format(e.target.value);
            });
        }
    });

    // Run prediction button
    document.getElementById('btn-run-prediction').addEventListener('click', executeSimulatorPrediction);

    // Quick Scenario Presets for Beginner-Friendly Interaction
    const scenarioPresets = {
        clear: {
            'sim-road-type': 'Highway',
            'sim-speed-limit': '80',
            'sim-curvature': '0.1',
            'sim-grade': '0.5',
            'sim-hour': '14',
            'sim-weather': 'Clear',
            'sim-surface': 'Dry',
            'sim-lighting': 'Daylight',
            'sim-precip': '0',
            'sim-visibility': '8000',
            'sim-density': '400',
            'sim-speed': '75',
            'sim-moisture': '10',
            'sim-braking': '2',
            'sim-violations': '2'
        },
        rain: {
            'sim-road-type': 'Urban Arterial',
            'sim-speed-limit': '60',
            'sim-curvature': '0.4',
            'sim-grade': '2.0',
            'sim-hour': '20',
            'sim-weather': 'Heavy Rain',
            'sim-surface': 'Flooded',
            'sim-lighting': 'Dark - Street Lights On',
            'sim-precip': '45',
            'sim-visibility': '600',
            'sim-density': '1400',
            'sim-speed': '48',
            'sim-moisture': '85',
            'sim-braking': '22',
            'sim-violations': '8'
        },
        night: {
            'sim-road-type': 'Highway',
            'sim-speed-limit': '80',
            'sim-curvature': '0.25',
            'sim-grade': '1.0',
            'sim-hour': '23',
            'sim-weather': 'Clear',
            'sim-surface': 'Dry',
            'sim-lighting': 'Dark - No Street Lights',
            'sim-precip': '0',
            'sim-visibility': '1400',
            'sim-density': '250',
            'sim-speed': '110',
            'sim-moisture': '12',
            'sim-braking': '5',
            'sim-violations': '30'
        },
        rush: {
            'sim-road-type': 'Intersection',
            'sim-speed-limit': '50',
            'sim-curvature': '0.5',
            'sim-grade': '0.0',
            'sim-hour': '18',
            'sim-weather': 'Clear',
            'sim-surface': 'Dry',
            'sim-lighting': 'Dusk/Dawn',
            'sim-precip': '0',
            'sim-visibility': '3500',
            'sim-density': '2200',
            'sim-speed': '28',
            'sim-moisture': '15',
            'sim-braking': '26',
            'sim-violations': '14'
        }
    };

    document.querySelectorAll('.scenario-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.getAttribute('data-preset');
            const preset = scenarioPresets[presetKey];
            if (!preset) return;
            for (const [id, val] of Object.entries(preset)) {
                const el = document.getElementById(id);
                if (el) {
                    el.value = val;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
            executeSimulatorPrediction();
        });
    });

    // Init Probabilities Chart
    const ctx = document.getElementById('chart-probabilities').getContext('2d');
    probChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Low', 'Moderate', 'High', 'Severe'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#34D399', '#FBBF24', '#FB923C', '#F87171'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#9DB2CE', callback: v => `${v}%` }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#F8FAFC', font: { weight: '600' } }
                }
            }
        }
    });

    // Initial run
    executeSimulatorPrediction();
}

async function executeSimulatorPrediction() {
    const btn = document.getElementById('btn-run-prediction');
    const errorBanner = document.getElementById('sim-error-banner');
    errorBanner.hidden = true;
    errorBanner.textContent = '';

    const payload = {
        road_type: document.getElementById('sim-road-type').value,
        speed_limit_kmh: parseInt(document.getElementById('sim-speed-limit').value, 10),
        road_curvature: parseFloat(document.getElementById('sim-curvature').value),
        road_elevation_grade: parseFloat(document.getElementById('sim-grade').value),
        hour_of_day: parseInt(document.getElementById('sim-hour').value, 10),
        weather_condition: document.getElementById('sim-weather').value,
        surface_condition: document.getElementById('sim-surface').value,
        lighting_condition: document.getElementById('sim-lighting').value,
        precipitation_mm: parseFloat(document.getElementById('sim-precip').value),
        visibility_meters: parseInt(document.getElementById('sim-visibility').value, 10),
        traffic_density_veh_hr: parseInt(document.getElementById('sim-density').value, 10),
        average_speed_kmh: parseFloat(document.getElementById('sim-speed').value),
        iot_surface_moisture_pct: parseFloat(document.getElementById('sim-moisture').value),
        iot_hard_braking_events_hr: parseInt(document.getElementById('sim-braking').value, 10),
        iot_speed_violations_hr: parseInt(document.getElementById('sim-violations').value, 10)
    };

    btn.disabled = true;
    btn.textContent = '⚡ Estimating Risk (via POST /api/predict)...';

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || result.status !== 'success') {
            throw new Error(result.error || `Prediction request failed with status ${response.status}`);
        }

        const res = result.data;

        // Update Score & Pill
        document.getElementById('res-risk-score').textContent = res.risk_score;
        const pill = document.getElementById('res-risk-pill');
        pill.textContent = `${res.risk_level} Risk Tier`;
        pill.className = `risk-pill risk-${res.risk_level.toLowerCase()}`;

        // Update Probabilities Chart
        const probs = [
            Math.round(res.probabilities.Low * 100),
            Math.round(res.probabilities.Moderate * 100),
            Math.round(res.probabilities.High * 100),
            Math.round(res.probabilities.Severe * 100)
        ];
        probChart.data.datasets[0].data = probs;
        probChart.update();

        // Update Contributing Factors
        const factorsList = document.getElementById('res-factors-list');
        factorsList.innerHTML = '';
        res.top_contributing_factors.forEach(f => {
            const div = document.createElement('div');
            div.className = 'factor-card';
            div.innerHTML = `
                <div class="factor-name">${escapeHtml(f.factor)} <span style="font-size:0.75rem; color:#94A3B8;">(${escapeHtml(f.impact)} Impact)</span></div>
                <div class="factor-desc">${escapeHtml(f.detail)}</div>
            `;
            factorsList.appendChild(div);
        });

        // Update Recommendations
        const recsList = document.getElementById('res-recs-list');
        recsList.innerHTML = '';
        res.safety_recommendations.forEach(r => {
            const div = document.createElement('div');
            div.style.marginBottom = '4px';
            div.textContent = r;
            recsList.appendChild(div);
        });
    } catch (error) {
        errorBanner.textContent = `Prediction Error: ${error.message}`;
        errorBanner.hidden = false;
        console.error('Simulator prediction failed:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = '⚡ Run Real-Time Risk Estimate (via /api/predict)';
    }
}


/* ==========================================================================
   4. ROUTE SAFETY ANALYZER
   ========================================================================== */
let routeChart;

function initRouteAnalyzer() {
    const ctx = document.getElementById('chart-route-gradient').getContext('2d');
    routeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Corridor Accident Risk Index',
                data: [],
                borderColor: '#38BDF8',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#F59E0B',
                pointBorderColor: '#0B1321',
                pointBorderWidth: 2,
                pointRadius: 4.5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#F8FAFC' } }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#9DB2CE' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#9DB2CE' }
                }
            }
        }
    });

    document.getElementById('btn-eval-route').addEventListener('click', evaluateRoute);
    document.getElementById('route-preset').addEventListener('change', evaluateRoute);
    evaluateRoute();
}

async function evaluateRoute() {
    const btn = document.getElementById('btn-eval-route');
    const errorBanner = document.getElementById('route-error-banner');
    errorBanner.hidden = true;
    errorBanner.textContent = '';

    const preset = document.getElementById('route-preset').value;
    const numWp = preset === 'metro' ? 10 : (preset === 'hill' ? 8 : 12);
    const presetNames = {
        metro: 'Express Highway Metro Corridor',
        hill: 'Urban Arterial to Hill Bypass',
        ring: 'Downtown Commercial Ring Road'
    };

    const waypoints = [];
    for (let i = 0; i < numWp; i++) {
        const isHazard = (i === 4 || i === 5 || i === 6);
        waypoints.push({
            latitude: Number((28.58 + (i * 0.012)).toFixed(5)),
            longitude: Number((77.18 + (i * 0.012)).toFixed(5)),
            road_type: i < 7 ? 'Highway' : 'Intersection',
            speed_limit_kmh: 80,
            road_curvature: isHazard ? 0.75 : 0.15,
            weather_condition: isHazard ? 'Heavy Rain' : 'Rain',
            surface_condition: isHazard ? 'Flooded' : 'Wet',
            average_speed_kmh: isHazard ? 105 : 75,
            traffic_density_veh_hr: isHazard ? 3200 : 1800,
            precipitation_mm: isHazard ? 38.0 : 8.0,
            visibility_meters: isHazard ? 800 : 4500,
            iot_hard_braking_events_hr: isHazard ? 34 : 5
        });
    }

    btn.disabled = true;
    btn.textContent = 'Evaluating Route...';

    try {
        const response = await fetch('/api/batch-predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                route_name: presetNames[preset] || 'Custom Corridor',
                waypoints: waypoints
            })
        });

        const result = await response.json();
        if (!response.ok || result.status !== 'success') {
            throw new Error(result.error || `Route analysis failed with status ${response.status}`);
        }

        const res = result.data;
        document.getElementById('route-kpi-count').textContent = res.total_waypoints;
        document.getElementById('route-kpi-avg').textContent = res.average_risk_score;
        document.getElementById('route-kpi-peak').textContent = res.peak_risk_score;
        document.getElementById('route-kpi-hazard-count').textContent = res.high_risk_segments_count;

        routeChart.data.labels = res.waypoint_predictions.map(p => `WP-${p.waypoint_index + 1}`);
        routeChart.data.datasets[0].data = res.waypoint_predictions.map(p => p.risk_score);
        routeChart.update();
    } catch (error) {
        errorBanner.textContent = `Route Analysis Error: ${error.message}`;
        errorBanner.hidden = false;
        console.error('Route evaluation failed:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Re-evaluate Route Risk';
    }
}


/* ==========================================================================
   5. EMBEDDED IOT TELEMETRY & ALERTS
   ========================================================================== */
let iotPollInterval = null;

function initIoTStream() {
    // Populate dropdown
    const select = document.getElementById('iot-target-node');
    select.innerHTML = '';
    IoTStream.stations.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.node_id;
        opt.textContent = `${s.node_id} - ${s.name}`;
        select.appendChild(opt);
    });

    // Apply anomaly button
    document.getElementById('btn-apply-anomaly').addEventListener('click', async () => {
        const btn = document.getElementById('btn-apply-anomaly');
        const statusBanner = document.getElementById('iot-status-banner');
        statusBanner.hidden = true;
        statusBanner.textContent = '';

        const nodeId = document.getElementById('iot-target-node').value;
        const anomaly = document.getElementById('iot-anomaly-type').value;

        btn.disabled = true;
        btn.textContent = 'Applying Anomaly...';

        try {
            const response = await fetch('/api/iot/simulate-anomaly', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ node_id: nodeId, anomaly_type: anomaly })
            });

            const result = await response.json();
            if (!response.ok || result.status !== 'success') {
                throw new Error(result.error || `Failed to set anomaly (status ${response.status})`);
            }

            // Immediately refresh telemetry from server
            await fetchIoTTelemetry();
        } catch (error) {
            statusBanner.textContent = `IoT Control Error: ${error.message}`;
            statusBanner.hidden = false;
            console.error('Failed to set IoT anomaly:', error);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Apply Anomaly State (via API)';
        }
    });

    // Initial fetch
    fetchIoTTelemetry();

    // Periodic live telemetry polling from server (every 4 seconds)
    if (iotPollInterval) clearInterval(iotPollInterval);
    iotPollInterval = setInterval(fetchIoTTelemetry, 4000);
}

async function fetchIoTTelemetry() {
    const statusBanner = document.getElementById('iot-status-banner');

    try {
        const response = await fetch('/api/iot/telemetry');
        if (!response.ok) {
            throw new Error(`Telemetry endpoint returned HTTP ${response.status}`);
        }
        const result = await response.json();
        if (result.status !== 'success' || !Array.isArray(result.nodes)) {
            throw new Error('Invalid telemetry payload format.');
        }

        renderIoTTelemetry(result.nodes);
        renderMapIoT(result.nodes);
    } catch (error) {
        if (statusBanner && statusBanner.hidden) {
            statusBanner.textContent = `Telemetry Sync Notice: ${error.message}. Retrying...`;
            statusBanner.hidden = false;
        }
        console.warn('Failed to fetch IoT telemetry:', error);
    }
}

function renderIoTTelemetry(nodes) {
    const alertsContainer = document.getElementById('iot-alerts-container');
    const cardsContainer = document.getElementById('iot-cards-container');

    if (!Array.isArray(nodes) || nodes.length === 0) {
        cardsContainer.innerHTML = '<div class="empty-state">No active IoT roadside nodes detected.</div>';
        return;
    }

    // Render Active Alerts
    const allAlerts = [];
    nodes.forEach(n => {
        if (Array.isArray(n.active_alerts)) {
            n.active_alerts.forEach(a => allAlerts.push({ node: n.node_id, name: n.name, ...a }));
        }
    });

    alertsContainer.innerHTML = '';
    if (allAlerts.length > 0) {
        allAlerts.forEach(alert => {
            const div = document.createElement('div');
            div.className = 'alert-banner';
            div.innerHTML = `
                <span>🚨</span>
                <div>
                    <strong>[${escapeHtml(alert.severity)}] ${escapeHtml(alert.type)}</strong> on <strong>${escapeHtml(alert.node)} (${escapeHtml(alert.name)})</strong>: ${escapeHtml(alert.message)}
                </div>
            `;
            alertsContainer.appendChild(div);
        });
    }

    // Render Cards
    cardsContainer.innerHTML = '';
    nodes.forEach(node => {
        const statusClass = node.status === 'CRITICAL' ? 'critical' : (node.status === 'WARNING' ? 'warning' : '');
        const card = document.createElement('div');
        card.className = `iot-card ${statusClass}`;
        card.innerHTML = `
            <div class="iot-header">
                <span class="iot-id">${escapeHtml(node.node_id)}</span>
                <span class="iot-status ${node.status.toLowerCase()}">● ${escapeHtml(node.status)}</span>
            </div>
            <div style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 8px;">${escapeHtml(node.name)}</div>
            <div class="iot-metrics">
                <div class="iot-metric-item">💧 Moisture: <strong>${node.sensors.surface_moisture_pct}%</strong></div>
                <div class="iot-metric-item">🚗 Speed: <strong>${node.sensors.average_speed_kmh} km/h</strong></div>
                <div class="iot-metric-item">🛑 Hard Braking: <strong>${node.sensors.hard_braking_events_5m} / 5m</strong></div>
                <div class="iot-metric-item">⚡ Violations: <strong>${node.sensors.speed_violations_5m} / 5m</strong></div>
                <div class="iot-metric-item">🌫️ Visibility: <strong>${node.sensors.visibility_meters} m</strong></div>
                <div class="iot-metric-item">🔋 Battery: <strong>${node.sensors.battery_pct}%</strong></div>
            </div>
        `;
        cardsContainer.appendChild(card);
    });
}


/* ==========================================================================
   6. MODEL ANALYTICS & CHARTS
   ========================================================================== */
function initAnalytics() {
    const meta = MLEngine.getModelMetadata();

    // 1. Feature Importance Chart (formula coefficients)
    const ctxImp = document.getElementById('chart-feature-importance').getContext('2d');
    new Chart(ctxImp, {
        type: 'bar',
        data: {
            labels: meta.risk_factors.map(f => f.feature),
            datasets: [{
                label: 'Heuristic formula coefficient',
                data: meta.risk_factors.map(f => f.coefficient),
                backgroundColor: '#60A5FA',
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9DB2CE' } },
                y: { grid: { display: false }, ticks: { color: '#F8FAFC', font: { size: 11 } } }
            }
        }
    });

    // 2. Historical Incident Risk Tier Counts
    const ctxCm = document.getElementById('chart-confusion-matrix').getContext('2d');
    const classes = ['Low', 'Moderate', 'High', 'Severe'];
    const classCounts = classes.map(level =>
        GeoEngine.incidents.filter(incident => incident.risk_level === level).length
    );
    new Chart(ctxCm, {
        type: 'bar',
        data: {
            labels: classes,
            datasets: [{
                label: 'Historical incident count',
                data: classCounts,
                backgroundColor: ['#34D399', '#FBBF24', '#FB923C', '#F87171'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#9DB2CE' } },
                x: { grid: { display: false }, ticks: { color: '#F8FAFC', font: { size: 11 } } }
            }
        }
    });
}


/* ==========================================================================
   7. REST API EXPLORER
   ========================================================================== */
function initApiExplorer() {
    const endpointSelect = document.getElementById('api-endpoint-select');
    const requestBody = document.getElementById('api-request-body');
    const responseOutput = document.getElementById('api-response-output');
    const sendBtn = document.getElementById('btn-send-api-req');

    const samplePayloads = {
        'GET /api/health': '',
        'POST /api/predict': JSON.stringify({
            road_type: "Highway",
            speed_limit_kmh: 80,
            road_curvature: 0.35,
            weather_condition: "Heavy Rain",
            surface_condition: "Wet",
            average_speed_kmh: 95,
            visibility_meters: 1200,
            precipitation_mm: 28,
            iot_surface_moisture_pct: 82,
            iot_hard_braking_events_hr: 26
        }, null, 2),
        'POST /api/batch-predict': JSON.stringify({
            route_name: "Corridor Express Demo",
            waypoints: [
                { latitude: 28.61, longitude: 77.20, average_speed_kmh: 75, speed_limit_kmh: 80 },
                { latitude: 28.62, longitude: 77.21, average_speed_kmh: 110, speed_limit_kmh: 80, weather_condition: "Heavy Rain" }
            ]
        }, null, 2),
        'GET /api/hotspots': '',
        'GET /api/hotspots/nearest?lat=28.6139&lon=77.2090': '',
        'GET /api/iot/telemetry': '',
        'POST /api/iot/simulate-anomaly': JSON.stringify({
            node_id: "RSU-IOT-101",
            anomaly_type: "flash_flood"
        }, null, 2),
        'GET /api/model/metrics': ''
    };

    endpointSelect.addEventListener('change', (e) => {
        requestBody.value = samplePayloads[e.target.value] || '';
    });
    requestBody.value = samplePayloads[endpointSelect.value];

    sendBtn.addEventListener('click', async () => {
        const endpointStr = endpointSelect.value;
        const [method, route] = endpointStr.split(' ');
        
        sendBtn.disabled = true;
        responseOutput.textContent = '// Executing API request against server...';

        try {
            const options = {
                method: method,
                headers: { 'Content-Type': 'application/json' }
            };
            if (method === 'POST') {
                options.body = requestBody.value || '{}';
            }
            const response = await fetch(route, options);
            const resData = await response.json();
            responseOutput.textContent = JSON.stringify({
                _http_status: response.status,
                _status_text: response.statusText,
                ...resData
            }, null, 2);
        } catch (err) {
            responseOutput.textContent = `// Network or Execution Error:\n${err.message}`;
        } finally {
            sendBtn.disabled = false;
        }
    });
}
