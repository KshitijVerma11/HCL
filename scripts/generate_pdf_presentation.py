import os
import subprocess

def generate_pdf_presentation():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    docs_dir = os.path.join(base_dir, "docs")
    html_file = os.path.join(docs_dir, "PRESENTATION_DECK.html")
    pdf_file = os.path.join(docs_dir, "PRESENTATION_DECK.pdf")

    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HCLTech BTech Capstone Presentation Deck</title>
<style>
    @page {
        size: 297mm 167.06mm; /* 16:9 widescreen landscape */
        margin: 0;
    }
    * {
        box-sizing: border-box;
    }
    body {
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
        background-color: #090e17;
        color: #f8fafc;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .slide {
        width: 297mm;
        height: 167.06mm;
        padding: 14mm 18mm;
        position: relative;
        page-break-after: always;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: #090e17;
        overflow: hidden;
    }
    .slide-header {
        margin-bottom: 4mm;
    }
    .slide-cat {
        font-size: 8pt;
        font-weight: 700;
        color: #f59e0b;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 3px;
    }
    .slide-title {
        font-size: 19pt;
        font-weight: 800;
        color: #ffffff;
        margin: 0;
        line-height: 1.2;
    }
    .slide-content {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12mm;
        align-items: stretch;
    }
    .card {
        background: #0e1828;
        border: 1.5px solid #1e3a5f;
        border-radius: 8px;
        padding: 14px 18px;
        display: flex;
        flex-direction: column;
    }
    .card-title {
        font-size: 11.5pt;
        font-weight: 700;
        color: #34d399;
        margin-bottom: 10px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 6px;
    }
    .card-title.amber { color: #f59e0b; }
    .card-title.red { color: #ef4444; }
    .card-title.white { color: #ffffff; }

    .bullet-list {
        margin: 0;
        padding: 0;
        list-style: none;
        font-size: 9.5pt;
        color: #e2e8f0;
        line-height: 1.55;
    }
    .bullet-list li {
        margin-bottom: 8px;
        position: relative;
        padding-left: 14px;
    }
    .bullet-list li::before {
        content: "•";
        color: #f59e0b;
        position: absolute;
        left: 0;
        font-weight: bold;
    }
    .bullet-list li strong {
        color: #ffffff;
    }

    .slide-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 4mm;
        font-size: 7.5pt;
        color: #94a3b8;
    }

    /* Title Slide Specifics */
    .title-slide {
        background: linear-gradient(135deg, #090e17 0%, #0d1b2a 60%, #1e3a5f 100%);
        justify-content: center;
        padding: 20mm 24mm;
    }
    .title-banner {
        font-size: 11pt;
        font-weight: 700;
        color: #f59e0b;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 12px;
    }
    .main-title {
        font-size: 28pt;
        font-weight: 800;
        line-height: 1.2;
        color: #ffffff;
        margin-bottom: 12px;
    }
    .main-sub {
        font-size: 13pt;
        color: #cbd5e1;
        margin-bottom: 24px;
        max-width: 800px;
        line-height: 1.4;
    }
    .title-meta-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-top: 10px;
    }
    .title-meta-card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        padding: 10px 14px;
        font-size: 8.5pt;
        color: #e2e8f0;
    }
    .title-meta-card strong {
        color: #f59e0b;
        display: block;
        margin-bottom: 4px;
        font-size: 9.5pt;
    }
</style>
</head>
<body>

<!-- SLIDE 1: TITLE -->
<div class="slide title-slide">
    <div class="title-banner">HCLTech BTech Capstone Project | September 2026</div>
    <div class="main-title">IoT-Enabled Intelligent Road Safety &amp;<br>Blackspot Warning Platform</div>
    <div class="main-sub">Real-Time Roadside Sensing, Sub-100ms Autonomous Edge Actuation &amp; Central Geospatial Hazard Intelligence</div>

    <div class="title-meta-grid">
        <div class="title-meta-card">
            <strong>Embedded Hardware Tier</strong>
            ESP32 DevKit v1 Dual-Core | FreeRTOS<br>
            DHT22, FC-37 Rain, MPU6050, Ultrasonic<br>
            SSD1306 OLED &amp; High-Power RGB Strobe
        </div>
        <div class="title-meta-card">
            <strong>IoT Transport &amp; Cloud Core</strong>
            MQTT (HiveMQ QoS 1) &amp; HTTP REST<br>
            Zero-Dependency Node.js 22 LTS Server<br>
            Sliding-Window Rate Limiter &amp; CSP
        </div>
        <div class="title-meta-card">
            <strong>Statutory Data &amp; Verification</strong>
            55 Statutory Delhi Police Blackspots<br>
            16,000 Georeferenced Crash Incidents<br>
            28 / 28 Automated Tests Passing (100%)
        </div>
    </div>
    <div class="slide-footer" style="margin-top: 20px;">
        <div>Domain: Embedded Systems &amp; IoT</div>
        <div>HCLTech Internal Training Evaluation</div>
    </div>
</div>

<!-- SLIDE 2: PROBLEM STATEMENT -->
<div class="slide">
    <div class="slide-header">
        <div class="slide-cat">HCLTech BTech Capstone — Embedded Systems &amp; IoT | Slide 2 of 10</div>
        <div class="slide-title">Problem Statement: Lethal Urban Blackspots &amp; Road Microclimates</div>
    </div>
    <div class="slide-content">
        <div class="card" style="border-color: #ef4444;">
            <div class="card-title red">Current Municipal Road Safety Bottlenecks</div>
            <ul class="bullet-list">
                <li><strong>Static, Post-Incident Crash Registers:</strong> Historical data (FSI) is compiled weeks or months after collisions; approaching motorists receive zero dynamic warnings.</li>
                <li><strong>Hyper-Local Road Microclimates:</strong> Sudden dense winter smog (&lt;50m visibility) or localized monsoon waterlogging occur in isolated pockets undetected by citywide weather apps.</li>
                <li><strong>Insufficient Driver Reaction Time:</strong> Traveling at 60–80 km/h, human reaction time (~1.5s) is inadequate to prevent high-speed pile-ups without automated roadside cues.</li>
                <li><strong>Prohibitive ITS Radar Costs:</strong> Commercial radar gantries cost ₹3,00,000+ each, rendering dense citywide deployment financially unfeasible.</li>
            </ul>
        </div>
        <div class="card" style="border-color: #34d399;">
            <div class="card-title">Our Cyber-Physical Solution &amp; Scope</div>
            <ul class="bullet-list">
                <li><strong>Autonomous Roadside Units (RSU):</strong> Low-cost (₹2,830 INR) solar edge nodes stationed directly at designated high-fatality blackspots.</li>
                <li><strong>Sub-100ms Driver Actuation:</strong> Direct GPIO/PWM RGB strobing (4Hz), piezo buzzer, and OLED advisory text alert drivers in under 32ms.</li>
                <li><strong>Dual MQTT / HTTP Telemetry:</strong> Publishes synchronized microclimate and crash impact packets over HiveMQ (QoS 1) and REST endpoints.</li>
                <li><strong>55 Statutory Blackspots Covered:</strong> Real-time geospatial fusion with official Delhi Traffic Police high-fatality corridors.</li>
            </ul>
        </div>
    </div>
    <div class="slide-footer">
        <div>Problem Statement &amp; Motivation</div>
        <div>Slide 2</div>
    </div>
</div>

<!-- SLIDE 3: ARCHITECTURE -->
<div class="slide">
    <div class="slide-header">
        <div class="slide-cat">HCLTech BTech Capstone — Embedded Systems &amp; IoT | Slide 3 of 10</div>
        <div class="slide-title">System Design: 4-Tier Cyber-Physical Architecture</div>
    </div>
    <div class="slide-content" style="grid-template-columns: repeat(4, 1fr); gap: 6mm;">
        <div class="card">
            <div class="card-title">Tier 1: Edge (RSU)</div>
            <ul class="bullet-list" style="font-size: 8.5pt;">
                <li><strong>ESP32 DevKit v1:</strong> Dual-core FreeRTOS.</li>
                <li><strong>Sensors:</strong> DHT22, FC-37, MPU6050, Ultrasonic, LDR.</li>
                <li><strong>Noise Filter:</strong> 5-sample rolling average.</li>
                <li><strong>Roadside Actuators:</strong> 0.96" OLED, RGB Strobe, Siren.</li>
                <li><strong>Latency:</strong> 32 ms measured.</li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title amber">Tier 2: Transport</div>
            <ul class="bullet-list" style="font-size: 8.5pt;">
                <li><strong>MQTT v3.1.1:</strong> HiveMQ Cloud Broker (QoS 1).</li>
                <li><strong>Topic:</strong> <code>delhi/rsu/+/telemetry</code></li>
                <li><strong>HTTP/1.1 REST:</strong> Port 8000 fallback gateway.</li>
                <li><strong>Offline Fault Tolerance:</strong> Autonomous local operation during network dropouts.</li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title white">Tier 3: Analytics</div>
            <ul class="bullet-list" style="font-size: 8.5pt;">
                <li><strong>Node.js 22 LTS:</strong> Zero external npm runtime dependencies.</li>
                <li><strong>Geospatial Engine:</strong> 55 Delhi blackspots.</li>
                <li><strong>Risk Engine:</strong> Deterministic [0, 100] multi-factor model.</li>
                <li><strong>Rate Limiter:</strong> 120 req/min sliding window.</li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title">Tier 4: Operations</div>
            <ul class="bullet-list" style="font-size: 8.5pt;">
                <li><strong>Twilight Dark UI:</strong> High-contrast driver interface.</li>
                <li><strong>CARTO Dark Tiles:</strong> Vector map rendering.</li>
                <li><strong>1-Click Scenarios:</strong> Clear, Rain, Night, Rush Hour.</li>
                <li><strong>Mobile PWA:</strong> Offline installable web app.</li>
            </ul>
        </div>
    </div>
    <div class="slide-footer">
        <div>System Architecture &amp; Data Flow</div>
        <div>Slide 3</div>
    </div>
</div>

<!-- SLIDE 4: HARDWARE & BOM -->
<div class="slide">
    <div class="slide-header">
        <div class="slide-cat">HCLTech BTech Capstone — Embedded Systems &amp; IoT | Slide 4 of 10</div>
        <div class="slide-title">Hardware Engineering: Circuit Design &amp; Bill of Materials (BOM)</div>
    </div>
    <div class="slide-content">
        <div class="card">
            <div class="card-title amber">Itemized Bill of Materials (₹2,830 Total)</div>
            <ul class="bullet-list" style="font-size: 8.5pt;">
                <li><strong>1. ESP32 DevKit v1 (Dual-Core 240MHz):</strong> ₹450 (Robu.in)</li>
                <li><strong>2. DHT22 Digital Temp &amp; Humidity:</strong> ₹220 (Amazon)</li>
                <li><strong>3. FC-37 Rain &amp; Moisture Module:</strong> ₹85 (Robu.in)</li>
                <li><strong>4. MPU-6050 3-Axis Accelerometer:</strong> ₹140 (Robu.in)</li>
                <li><strong>5. HC-SR04 Ultrasonic Distance Sensor:</strong> ₹110 (Amazon)</li>
                <li><strong>6. 0.96" I2C OLED Display (128x64):</strong> ₹190 (Robu.in)</li>
                <li><strong>7. RGB LEDs (x2) &amp; Active Buzzer:</strong> ₹130 (Robu.in)</li>
                <li><strong>8. TP4056 + 2x 18650 Li-ion Cells (5200mAh):</strong> ₹485 (Local)</li>
                <li><strong>9. 5V 6W Monocrystalline Solar Panel:</strong> ₹480 (Amazon)</li>
                <li><strong>10. IP65 Weatherproof Box &amp; Wiring:</strong> ₹540 (Local)</li>
                <li style="color: #f59e0b; font-weight: bold; margin-top: 6px;">★ TOTAL UNIT COST: ₹2,830 INR (Target: &lt; ₹3,500)</li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title">GPIO Pinout &amp; Solar Power Autonomy</div>
            <ul class="bullet-list" style="font-size: 8.8pt;">
                <li><strong>Pin Assignments:</strong><br>
                    • DHT22: GPIO 4 (10k pull-up) | Rain ADC: GPIO 34<br>
                    • MPU-6050: I2C GPIO 21 (SDA), 22 (SCL), 19 (INT)<br>
                    • Ultrasonic: GPIO 5 (TRIG), 18 (ECHO)<br>
                    • RGB LED: GPIO 25 (R), 26 (G), 27 (B) PWM<br>
                    • SSD1306 OLED: I2C addr 0x3C | Buzzer: GPIO 14
                </li>
                <li><strong>Solar Energy Balance:</strong><br>
                    • Power Consumption: 140mA @ 5V = 16.8 Wh/day<br>
                    • Battery Reserve: 2x 18650 = 22 Hours without sun<br>
                    • Solar Harvest: 5V 6W panel yields 17.85 Wh/day<br>
                    • Result: Perpetual off-grid autonomous operation
                </li>
            </ul>
        </div>
    </div>
    <div class="slide-footer">
        <div>Hardware &amp; Circuit Engineering</div>
        <div>Slide 4</div>
    </div>
</div>

<!-- SLIDE 5: EDGE FIRMWARE -->
<div class="slide">
    <div class="slide-header">
        <div class="slide-cat">HCLTech BTech Capstone — Embedded Systems &amp; IoT | Slide 5 of 10</div>
        <div class="slide-title">Edge Firmware Intelligence: Sub-100ms Autonomous Actuation</div>
    </div>
    <div class="slide-content">
        <div class="card">
            <div class="card-title white">Firmware Architecture (C++ FreeRTOS)</div>
            <ul class="bullet-list">
                <li><strong>Rolling Average Noise Filter:</strong> 5-sample circular buffer dampens transient analog spikes on ADC moisture pins to prevent false flood triggers.</li>
                <li><strong>Multi-Threading on Dual Cores:</strong> Core 1 handles time-critical sensor polling and actuation interrupts; Core 0 handles Wi-Fi and MQTT transmission.</li>
                <li><strong>Edge Anomaly Decision Matrix:</strong> Evaluates crash impacts (|a| &gt; 3.5g), flash waterlogging (&gt;80% wetness), and dense fog banks (&gt;92% humidity).</li>
                <li><strong>Sub-100ms Driver Actuation:</strong> Measured at 32 ms latency from physical impact to red strobe (4Hz), buzzer siren, and OLED hazard rendering.</li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title amber">Roadside States &amp; Signaling Modes</div>
            <ul class="bullet-list">
                <li><strong style="color: #ef4444;">CRASH IMPACT (|a| &gt; 3.5g):</strong> Rapid 4Hz Flashing Red + Siren + OLED 'CRITICAL HAZARD: VEHICLE CRASH'</li>
                <li><strong style="color: #f59e0b;">FLASH FLOOD (&gt;80% Wetness):</strong> Pulsing Amber (2Hz) + OLED 'WARNING: ROAD WATERLOGGED'</li>
                <li><strong style="color: #f59e0b;">DENSE FOG BANK (&gt;92% RH):</strong> Slow Amber Strobe + OLED 'DENSE FOG: VISIBILITY &lt; 100M'</li>
                <li><strong style="color: #f59e0b;">WET SLIPPERY ROAD (35%–75%):</strong> Solid Amber + OLED 'CAUTION: WET SLIPPERY ROAD'</li>
                <li><strong style="color: #34d399;">NORMAL CONDITIONS:</strong> Solid Green + OLED 'CORRIDOR CLEAR: CONDITIONS OPTIMAL'</li>
            </ul>
        </div>
    </div>
    <div class="slide-footer">
        <div>Embedded Firmware &amp; Actuation</div>
        <div>Slide 5</div>
    </div>
</div>

<!-- SLIDE 6: GEOSPATIAL ENGINE -->
<div class="slide">
    <div class="slide-header">
        <div class="slide-cat">HCLTech BTech Capstone — Embedded Systems &amp; IoT | Slide 6 of 10</div>
        <div class="slide-title">Central Geospatial Engine: 55 Official Delhi Blackspots</div>
    </div>
    <div class="slide-content">
        <div class="card">
            <div class="card-title white">Statutory Data Provenance (Delhi Police &amp; MoRTH)</div>
            <ul class="bullet-list">
                <li><strong>16,000 Georeferenced Incidents:</strong> Loaded from raw_accidents.csv, centered around high-fatality corridors in Delhi NCR.</li>
                <li><strong>55 Statutory Blackspots Mapped:</strong> Mukarba Chowk, Azadpur, Bhalswa Chowk, Kashmere Gate, AIIMS Flyover, Ashram Chowk, Dhaula Kuan, Peeragarhi, etc.</li>
                <li><strong>Haversine Spatial Binning:</strong> Clusters incidents into 500-meter hazard zones, outputting GeoJSON FeatureCollections in &lt; 2ms.</li>
                <li><strong>Nearest Hotspot Proximity API:</strong> <code>GET /api/hotspots/nearest?lat=...&amp;lon=...</code> returns distance in km and official landmark name.</li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title">Deterministic Multi-Factor Risk Scoring</div>
            <ul class="bullet-list">
                <li><strong>Transparent Heuristic Formulation:</strong> Bounded strictly in [0, 100], avoiding unverified black-box ML drift.</li>
                <li><strong>Risk Input Factors:</strong><br>
                    • Speed Delta Factor (avg_speed vs speed_limit)<br>
                    • Surface Wetness &amp; Precipitation<br>
                    • Lighting &amp; Visibility (Day / Twilight / Night)<br>
                    • Road Geometry (Curvature &amp; Elevation Grade)<br>
                    • Real-Time Roadside IoT Anomaly Boost
                </li>
                <li><strong>Zero-Dependency Performance:</strong> Sub-25ms response time on Node.js 22 LTS standard libraries.</li>
            </ul>
        </div>
    </div>
    <div class="slide-footer">
        <div>Geospatial &amp; Risk Analytics</div>
        <div>Slide 6</div>
    </div>
</div>

<!-- SLIDE 7: USER EXPERIENCE & PWA -->
<div class="slide">
    <div class="slide-header">
        <div class="slide-cat">HCLTech BTech Capstone — Embedded Systems &amp; IoT | Slide 7 of 10</div>
        <div class="slide-title">User Experience: Mountain Twilight UI &amp; Progressive Web App</div>
    </div>
    <div class="slide-content">
        <div class="card">
            <div class="card-title amber">Twilight Aesthetic Design Principles</div>
            <ul class="bullet-list">
                <li><strong>Driver Night Contrast (#090E17):</strong> Deep midnight slate palette prevents driver glare and eye fatigue during late-night dashboard use.</li>
                <li><strong>Leaflet CARTO Dark Basemap:</strong> High-contrast dark vector tiles with custom CSS filters highlighting red blackspot hazard clusters.</li>
                <li><strong>Floating Pill Navigation:</strong> Streamlined 6-tab interface with signature amber active indicator dot for zero user confusion.</li>
                <li><strong>1-Click Scenario Testing:</strong><br>
                    • ☀️ Clear Day Drive | • 🌧️ Heavy Monsoon Rain<br>
                    • 🌙 Late Night Highway | • 🚦 Peak Rush Hour
                </li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title">PWA &amp; Public Accessibility</div>
            <ul class="bullet-list">
                <li><strong>Progressive Web App (manifest.json):</strong> Users and traffic officers can 'Install' or 'Add to Home Screen' on Android and iOS devices.</li>
                <li><strong>Social Sharing &amp; SEO Metadata:</strong> Open Graph and Twitter Card tags configured with high-contrast social previews for WhatsApp and LinkedIn.</li>
                <li><strong>Live IoT Telemetry Feed:</strong> Real-time roadside unit telemetry automatically polls every 4 seconds, pulsating red on anomaly detection.</li>
                <li><strong>Search Engine Ready:</strong> Native robots.txt and sitemap directives served directly by Node.js server.</li>
            </ul>
        </div>
    </div>
    <div class="slide-footer">
        <div>Human-Machine Interface &amp; PWA</div>
        <div>Slide 7</div>
    </div>
</div>

<!-- SLIDE 8: TESTING & QUALITY -->
<div class="slide">
    <div class="slide-header">
        <div class="slide-cat">HCLTech BTech Capstone — Embedded Systems &amp; IoT | Slide 8 of 10</div>
        <div class="slide-title">Verification &amp; Quality: 28/28 Automated Tests &amp; Security</div>
    </div>
    <div class="slide-content">
        <div class="card">
            <div class="card-title white">Automated Test Suite (100% Pass Rate)</div>
            <ul class="bullet-list" style="font-size: 8.8pt;">
                <li><strong>Command: npm test (node --test):</strong> Executes 28 unit and integration tests with zero failures.</li>
                <li><strong>Engine Verification:</strong><br>
                    • Risk score bounded strictly in [0, 100]<br>
                    • Probabilities sum exactly to 1.0<br>
                    • Antipodal coordinate handling (zero NaN)<br>
                    • IoT anomaly injection (critical flood alert)<br>
                    • CSV parser with quoted commas and escapes
                </li>
                <li><strong>Server &amp; API Verification:</strong><br>
                    • 405 Method Not Allowed handling<br>
                    • Static path traversal shield (HTTP 404)<br>
                    • Favicon SVG handler (HTTP 200)<br>
                    • Web App manifest &amp; robots.txt integrity
                </li>
            </ul>
        </div>
        <div class="card">
            <div class="card-title">Enterprise Security Hardening</div>
            <ul class="bullet-list" style="font-size: 9pt;">
                <li><strong>Sliding-Window IP Rate Limiter:</strong> 120 requests/minute per client IP to mitigate denial-of-service and sensor flooding.</li>
                <li><strong>Strict Content Security Policy (CSP):</strong> Blocks inline script injections and restricts scripts and styles to trusted CDNs.</li>
                <li><strong>HTTP Security Headers:</strong> X-Frame-Options: DENY (anti-clickjacking), X-Content-Type-Options: nosniff, Referrer-Policy.</li>
                <li><strong>Secret Redaction &amp; Clean Config:</strong> No hardcoded credentials; CARTO and CORS variables loaded securely from .env.</li>
            </ul>
        </div>
    </div>
    <div class="slide-footer">
        <div>Quality Assurance &amp; Security</div>
        <div>Slide 8</div>
    </div>
</div>

<!-- SLIDE 9: PRACTICAL IMPACT -->
<div class="slide">
    <div class="slide-header">
        <div class="slide-cat">HCLTech BTech Capstone — Embedded Systems &amp; IoT | Slide 9 of 10</div>
        <div class="slide-title">Practical Impact: Municipal Scalability &amp; Road Safety ROI</div>
    </div>
    <div class="slide-content">
        <div class="card">
            <div class="card-title">Preserving the 'Golden Hour'</div>
            <p style="font-size: 9.5pt; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;">
                Instant crash impact telemetry (|a| &gt; 3.5g) dispatched over MQTT reaches emergency CAT ambulances and traffic police dispatchers within seconds, cutting trauma response latency during critical injury windows.
            </p>
            <div class="card-title amber" style="margin-top: 8px;">Affordable Smart City Scaling</div>
            <p style="font-size: 9.5pt; color: #cbd5e1; line-height: 1.5; margin: 0;">
                At ₹2,830 per node, equipping all 55 statutory Delhi blackspots costs ₹1,55,650 INR in total hardware—compared to ₹1.65 Crore for commercial ITS radar gantries.
            </p>
        </div>
        <div class="card">
            <div class="card-title white">Driver Behavioral Feedback</div>
            <p style="font-size: 9.5pt; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;">
                High-visibility roadside OLED screens display safe speed advisories before motorists enter blind curves and fog zones, prompting immediate speed deceleration.
            </p>
            <div class="card-title" style="margin-top: 8px;">Integrated Command Center (ICCC)</div>
            <p style="font-size: 9.5pt; color: #cbd5e1; line-height: 1.5; margin: 0;">
                Standard MQTT topics allow seamless ingestion into Delhi Smart City / NDMC traffic management centers for automated police patrol dispatch.
            </p>
        </div>
    </div>
    <div class="slide-footer">
        <div>Socioeconomic Value &amp; ROI</div>
        <div>Slide 9</div>
    </div>
</div>

<!-- SLIDE 10: CONCLUSION -->
<div class="slide">
    <div class="slide-header">
        <div class="slide-cat">HCLTech BTech Capstone — Embedded Systems &amp; IoT | Slide 10 of 10</div>
        <div class="slide-title">Summary: Complete HCLTech Submission Deliverables</div>
    </div>
    <div class="slide-content">
        <div class="card">
            <div class="card-title">Final Submission Checklist (100% Completed)</div>
            <ul class="bullet-list" style="font-size: 8.8pt;">
                <li>✔ Source code saved &amp; accessible in version control (git tag v1.0)</li>
                <li>✔ Problem Statement document in docs/PROBLEM_STATEMENT.md</li>
                <li>✔ Software Requirement Specification in docs/SRS.md</li>
                <li>✔ System Architecture &amp; sequence flows in docs/ARCHITECTURE.md</li>
                <li>✔ Bill of Materials (₹2,830) in docs/BOM.md &amp; HARDWARE_CIRCUIT.md</li>
                <li>✔ Working ESP32 C++ firmware in firmware/esp32_rsu_telemetry.ino</li>
                <li>✔ Unit &amp; System test results (28/28 tests passing) in docs/TEST_RESULTS.md</li>
                <li>✔ Final presentation deck in docs/PRESENTATION_DECK.pptx &amp; .pdf</li>
                <li>✔ Comprehensive project report in docs/PROJECT_REPORT.docx &amp; .pdf</li>
                <li>✔ Zero hardcoded credentials; .env and security hardening enforced</li>
            </ul>
        </div>
        <div class="card" style="border-color: #f59e0b;">
            <div class="card-title amber">Live Platform &amp; Demonstration Details</div>
            <ul class="bullet-list" style="font-size: 9.5pt;">
                <li><strong>Live Web Dashboard:</strong><br><a href="http://localhost:8000" style="color: #38bdf8;">http://localhost:8000</a></li>
                <li><strong>Live Health Probe:</strong><br><a href="http://localhost:8000/healthz" style="color: #38bdf8;">http://localhost:8000/healthz</a></li>
                <li><strong>Git Milestone Release:</strong> Tag <code>v1.0</code> (Master Branch)</li>
                <li><strong>Demo Video Walkthrough Guide:</strong> <code>docs/DEMO_VIDEO_GUIDE.md</code></li>
                <li style="margin-top: 14px; color: #f59e0b; font-size: 11pt; font-weight: bold;">
                    Thank You! Ready for Evaluator Demonstration &amp; Q&amp;A.
                </li>
            </ul>
        </div>
    </div>
    <div class="slide-footer">
        <div>Conclusion &amp; Deliverables Checklist</div>
        <div>Slide 10</div>
    </div>
</div>

</body>
</html>
"""

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"Generated HTML slide presentation at: {html_file}")

    file_url = f"file:///{html_file.replace(os.sep, '/')}"
    res = subprocess.run([
        edge_path,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={pdf_file}",
        file_url
    ], capture_output=True, text=True)

    if os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 0:
        print(f"Successfully generated PDF presentation at: {pdf_file} (Size: {os.path.getsize(pdf_file)} bytes)")
    else:
        print(f"Error generating PDF presentation. Edge output: {res.stderr}")

if __name__ == "__main__":
    generate_pdf_presentation()
