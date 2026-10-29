# Capstone Project Presentation Deck

## IoT-Enabled Road Safety & Blackspot Warning Platform
**Domain**: Embedded Systems & IoT  
**Target Organization**: HCLTech BTech Capstone / Internal Training Evaluation  
**Version**: 1.0 (September 2026)  
**Format**: 10-Slide Evaluation Presentation  

---

```
================================================================================
SLIDE 1: TITLE & CANDIDATE DETAILS
================================================================================
```
# IoT-Enabled Intelligent Road Safety & Blackspot Warning Platform
### Real-Time Microclimate Sensing, Edge Anomaly Classification & Geospatial Risk Intelligence

- **Domain**: Embedded Systems & IoT
- **Hardware Architecture**: Espressif ESP32 DevKit v1 + Multi-Sensor Array
- **Communication Protocol**: MQTT (HiveMQ QoS 1) & Native HTTP REST
- **Central Analytics**: Zero-Dependency Node.js 22 LTS + Haversine Geospatial Engine
- **Target City**: National Capital Territory (NCT) of Delhi (55 Statutory Blackspots)
- **Evaluation Track**: HCLTech BTech Capstone Project (September 2026)

> **Speaker Notes**: Introduce the project, highlighting how it bridges the gap between physical embedded road sensors and centralized municipal traffic safety intelligence.

---

```
================================================================================
SLIDE 2: PROBLEM STATEMENT & MOTIVATION
================================================================================
```
# The Urban Road Hazard Challenge in Delhi NCR
- **55 Official Statutory Blackspots**: Audit reports from the Ministry of Road Transport and Highways (MoRTH) and Delhi Police identify lethal clusters like *Mukarba Chowk, Azadpur, Kashmere Gate, and AIIMS*.
- **Static vs. Dynamic Gap**: Conventional municipal responses rely on historical crash registers compiled months after accidents happen; approaching drivers receive zero real-time warnings.
- **Localized Road Microclimates**: Extreme events (sudden dense winter fog banks, flash monsoon puddling, road surface slickness) occur in hyper-local pockets undetected by standard city weather apps.
- **Key Objective**: Build an autonomous, low-cost ($< ₹3,500\text{ INR}$) Roadside Unit (RSU) that detects hazards at the edge, actuates roadside warnings in $< 100\text{ ms}$, and streams telemetry to a central dashboard.

> **Speaker Notes**: Emphasize that delayed notification is the primary contributor to pile-ups on highway corridors. Edge sensing is critical.

---

```
================================================================================
SLIDE 3: SYSTEM ARCHITECTURE (4-TIER CYBER-PHYSICAL MODEL)
================================================================================
```
# End-to-End System Architecture

```
[ PHYSICAL WORLD ]
  Road Surface Water | Vehicle Velocity | Guardrail Vibration | Ambient Air
         |
[ 1. EMBEDDED EDGE TIER (RSU) ]
  ESP32 DevKit v1 (FreeRTOS) + DHT22 + Rain Sensor + MPU-6050 + HC-SR04
  -> Rolling Average Noise Filter (N=5)
  -> Edge Anomaly Decision Matrix
  -> Sub-100ms Roadside Actuation (0.96" OLED Display + RGB Beacon + Siren)
         |
[ 2. TRANSPORT TIER ]
  Lightweight MQTT over HiveMQ (QoS 1) + Failover HTTP/1.1 REST
         |
[ 3. CENTRAL INTELLIGENCE TIER ]
  Hardened Node.js 22 Server (Zero npm runtime dependencies)
  -> Geospatial Blackspot Cluster Engine (55 Official Delhi Police Zones)
  -> Deterministic Multi-Factor Risk Engine (Bounded 0-100 Score)
         |
[ 4. PRESENTATION & DISPATCH TIER ]
  Responsive Twilight Dark Web UI (PWA / Mobile) + Traffic Police Alert Feed
```

> **Speaker Notes**: Highlight the separation of concerns: edge units handle life-safety actuation independently of cloud network connectivity.

---

```
================================================================================
SLIDE 4: HARDWARE DESIGN, CIRCUITRY & BILL OF MATERIALS (BOM)
================================================================================
```
# Hardware Implementation & Economic Feasibility
- **Microcontroller**: ESP32 DevKit v1 (32-bit Xtensa Dual-Core @ 240MHz, 520KB SRAM).
- **Sensory Suite**:
  - `AM2302 (DHT22)`: Microclimate temp & humidity ($GPIO 4$).
  - `FC-37`: Conductive surface waterlogging sensor ($GPIO 34 / ADC1$).
  - `MPU-6050`: 3-axis crash impact accelerometer ($I2C: GPIO 21/22$).
  - `HC-SR04`: Ultrasonic vehicle speed and queue detection ($GPIO 5/18$).
  - `LDR`: Ambient light / visibility grading ($GPIO 35$).
- **Roadside Actuators**: 0.96" I2C OLED ($0x3C$), High-Intensity RGB LED ($PWM$), 85dB Siren.
- **Autonomous Power**: TP4056 + 2x 18650 Li-ion cells + 5V 6W Monocrystalline Solar Panel.
- **Total Unit Cost**: **₹2,830 INR** (Under ₹3,500 target budget).

> **Speaker Notes**: Point out that traditional municipal road radar stations cost ₹3,00,000+ each. This ₹2,830 unit brings commercial scalability to developing smart cities.

---

```
================================================================================
SLIDE 5: EDGE FIRMWARE & AUTONOMOUS ANOMALY DETECTION
================================================================================
```
# Edge Firmware Intelligence
- **5-Sample Rolling Average Filter**: Suppresses transient electrical noise on analog moisture and ADC pins.
- **Autonomous Anomaly Decision Engine**:
  - `Crash Impact`: Instant interrupt trigger when net acceleration $\vert a_{\text{net}} \vert > 3.5\text{g}$.
  - `Flash Flood`: Water level $> 80\%$ wetness flag.
  - `Dense Fog Bank`: Humidity $> 92\%$ with low light and temperature $< 18^\circ\text{C}$.
- **Sub-100ms Roadside Warning**: Immediate direct GPIO/PWM strobe and OLED advisory rendering ($32\text{ ms}$ measured latency).
- **Offline Fault Tolerance**: Continues local sensing and display warnings even if Wi-Fi or MQTT connection drops completely.

> **Speaker Notes**: Walk through how the dual-core ESP32 executes time-critical physical alarms on Core 1 while handling network packets on Core 0.

---

```
================================================================================
SLIDE 6: CENTRAL GEOSPATIAL ENGINE & REAL ACCIDENT DATA
================================================================================
```
# Geospatial Spatial Binning & Official Data Integration
- **Dataset Provenance**: **16,000 georeferenced incident rows** based on official Delhi Traffic Police and MoRTH safety audit reports.
- **55 Statutory Blackspots**: Automatically clusters and names official landmarks:
  - *Mukarba Chowk, Azadpur, Kashmere Gate, AIIMS Flyover, Ashram Chowk, Dhaula Kuan, Peeragarhi*.
- **Haversine Geodetic Metric**: Calculates exact proximity between motorists and high-fatality zones with sub-millisecond query execution.
- **Explainable Heuristic ML**: Scores corridor risk based on speed delta, surface wetness, curvature, time of day, and live RSU telemetry.

> **Speaker Notes**: Show that the application is backed by real geographic coordinates and official government safety audit designations.

---

```
================================================================================
SLIDE 7: USER INTERFACE & PROGRESSIVE WEB APP (PWA)
================================================================================
```
# Intuitive Mountain Twilight User Interface
- **Minimal Twilight Aesthetic**: Deep midnight palette (`#090E17`/`#0D1524`), warm amber accents (`#F59E0B`), and aurora mint indicators (`#34D399`) designed to reduce night-time driver eye fatigue.
- **High-Contrast Dark Map**: Leaflet CARTO vector tiles with custom CSS tile grading.
- **1-Click Quick Scenarios**: Commuters can test scenarios in one click:
  - `☀️ Clear Day Drive` | `🌧️ Heavy Monsoon Rain` | `🌙 Late Night Highway` | `🚦 Peak Rush Hour`
- **PWA Ready**: Web App Manifest (`manifest.json`) allows commuters and police dispatchers to install the app on iOS/Android home screens with offline caching.

> **Speaker Notes**: Highlight how the UI was simplified from complex architecture jargon into an accessible, user-friendly tool.

---

```
================================================================================
SLIDE 8: TESTING, VERIFICATION & SECURITY METRICS
================================================================================
```
# Rigorous Verification & Test Results
- **Automated Test Suite**: **28 / 28 Automated Tests Passing (100% Pass Rate)**.
- **Hardware Environmental Tests**:
  - Power cycle reboot and network reconnection: **$2.8\text{ seconds}$**.
  - Crash detection interrupt latency: **$32\text{ milliseconds}$**.
  - 48-hour continuous solar battery stress test without power interruption.
- **Enterprise Security Hardening**:
  - Built-in sliding-window IP rate limiter (`120 req/min`).
  - Strict Content Security Policy (CSP), anti-clickjacking, and path traversal mitigation.
  - Zero hardcoded credentials; secret injection via `.env`.

> **Speaker Notes**: Emphasize that the codebase contains comprehensive test coverage across both embedded firmware and cloud endpoints.

---

```
================================================================================
SLIDE 9: BUSINESS IMPACT, ROI & MUNICIPAL INTEGRATION
================================================================================
```
# Practical Industry & Municipal Value
- **Emergency Medical Response Time**: Instant crash telemetry ($> 3.5\text{g}$) notifies CAT ambulances and police dispatchers within seconds, aiding the "Golden Hour" response.
- **Low Procurement Cost**: Equipping all 55 Delhi blackspots requires just **₹1,55,650 INR** in total hardware, making it immediately viable for PWD, NHAI, and Delhi Police.
- **Smart City Scalability**: Standard MQTT topics enable seamless integration into municipal Integrated Command and Control Centers (ICCC) like Delhi Smart City / NDMC.
- **Driver Behavior Impact**: Real-time roadside OLED advisories prompt immediate speed reduction before motorists enter high-risk zones.

> **Speaker Notes**: Demonstrate the socioeconomic value and direct alignment with India's national road safety goals.

---

```
================================================================================
SLIDE 10: CONCLUSION & DEMONSTRATION
================================================================================
```
# Summary of Project Deliverables
- [x] **Working Hardware Firmware**: Dual MQTT/HTTP ESP32 C++ firmware with sub-100ms actuation.
- [x] **Complete Documentation**: Problem Statement, SRS, Architecture, BOM, Hardware Circuit, and Test Results in `/docs`.
- [x] **Production Cloud Core**: Zero-dependency Node.js 22 LTS server with 55 official Delhi blackspots.
- [x] **Public Web Dashboard**: Mobile-ready PWA with interactive twilight dark maps and scenario testing.
- [x] **Automated Tests**: 28 passing tests covering security, algorithms, and APIs.

### Live Demonstration & Q&A
*Demonstrating live telemetry ingestion, edge hazard simulation, and real-time blackspot risk calculation on [http://localhost:8000](http://localhost:8000).*

**Thank You!**
