# Software Requirements Specification (SRS)

## IoT-Enabled Road Safety & Blackspot Warning Platform (Version 1.0)
**Document Standard**: IEEE 830-1998 Compatible  
**Domain**: Embedded Systems & IoT  
**Target Organization**: HCLTech BTech Capstone Review  
**Date**: September 2026  

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for the **IoT-Enabled Road Safety & Blackspot Warning Platform**. It guides firmware developers, cloud backend engineers, and test teams during the development and evaluation of the system.

### 1.2 Scope of the System
The platform consists of two integrated subsystems:
1. **Embedded Roadside Units (RSUs)**: ESP32 microcontrollers deployed at statutory road blackspots equipped with environmental sensors, crash impact accelerometers, roadside OLED signage, and high-intensity optical hazard beacons.
2. **Central Safety Intelligence Server & Dashboard**: A zero-dependency Node.js HTTP/REST server that ingests RSU telemetry, cross-references spatial clusters against 55 official Delhi Traffic Police blackspots, calculates dynamic corridor risk scores, and renders an accessible dark-sky web dashboard.

### 1.3 Definitions and Acronyms
- **RSU**: Roadside Unit (embedded roadside sensing and signaling device).
- **BOM**: Bill of Materials.
- **GPIO**: General Purpose Input/Output.
- **MQTT**: Message Queuing Telemetry Transport (lightweight publish-subscribe protocol).
- **QoS**: Quality of Service.
- **CSP**: Content Security Policy.
- **PWA**: Progressive Web App.
- **MoRTH**: Ministry of Road Transport and Highways (India).

---

## 2. Overall Description

### 2.1 Product Perspective
The platform functions as an end-to-end cyber-physical IoT system. Distributed hardware nodes interface with the physical road environment, perform local signal filtering, and communicate with the central server via Wi-Fi/MQTT or cellular fallback.

```mermaid
graph TD
    subgraph Physical World
        RoadSurface["Road Surface (Water/Ice)"]
        Vehicles["Passing Traffic (Speed & Density)"]
        Weather["Atmosphere (Fog / Rain / Temp)"]
        Barrier["Guardrail / Barrier (Impact Force)"]
    end

    subgraph Embedded Tier (RSU)
        RainSensor["Rain/Conductivity Sensor"]
        HCSR04["Ultrasonic / Doppler Sensor"]
        DHT22["DHT22 (Temp & Humidity)"]
        MPU6050["MPU6050 (3-Axis IMU)"]
        ESP32["ESP32 Microcontroller"]
        OLED["0.96 inch SSD1306 OLED"]
        RGB["RGB Hazard Strobe"]
        Buzzer["Active Piezo Buzzer"]
    end

    subgraph Cloud / Central Tier
        MQTTBroker["HiveMQ / MQTT Broker"]
        NodeCore["Node.js Server (Port 8000)"]
        GeoEngine["Spatial Blackspot Engine"]
        MLEngine["Corridor Risk Model"]
    end

    subgraph Client Tier
        Browser["Responsive Twilight Dashboard"]
        PWA["PWA Mobile App (Add to Home)"]
        PoliceDesk["Delhi Traffic Police Dispatcher"]
    end

    RoadSurface --> RainSensor
    Vehicles --> HCSR04
    Weather --> DHT22
    Barrier --> MPU6050

    RainSensor --> ESP32
    HCSR04 --> ESP32
    DHT22 --> ESP32
    MPU6050 --> ESP32

    ESP32 --> OLED
    ESP32 --> RGB
    ESP32 --> Buzzer

    ESP32 -->|MQTT / HTTP| MQTTBroker
    MQTTBroker --> NodeCore
    NodeCore --> GeoEngine
    NodeCore --> MLEngine

    NodeCore --> Browser
    NodeCore --> PWA
    NodeCore --> PoliceDesk
```

### 2.2 User Classes and Characteristics
1. **Highway Commuters / Motorists**: View instant safety warnings on roadside OLED screens and check real-time blackspot risk scores via the mobile-friendly web dashboard.
2. **Traffic Police & Highway Patrol**: Monitor live sensor readings across all 55 statutory blackspots, receive instant alert triggers for crash impacts or flash waterlogging, and dispatch emergency units.
3. **Embedded Systems Engineers / Admins**: Calibrate sensors, monitor battery/solar voltage telemetry, simulate edge anomalies, and update firmware over Wi-Fi.

---

## 3. Specific Requirements

### 3.1 Functional Requirements (FR)

| Req ID | Title | Description | Verification Method |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Multi-Sensor Acquisition** | The ESP32 firmware shall sample temperature, humidity (DHT22), precipitation/surface wetness, vehicular distance/speed (HC-SR04), and 3-axis vibration (MPU6050) every 1,000 milliseconds. | Hardware test with oscilloscope/serial monitor. |
| **FR-02** | **Edge-Side Signal Filtering** | The firmware shall apply a 5-sample rolling average to sensor values to eliminate transient electrical noise before anomaly evaluation. | Firmware unit test in VS Code PlatformIO. |
| **FR-03** | **Autonomous Edge Anomaly Detection** | The RSU shall independently evaluate physical thresholds: (a) Crash impact: $\vert a_z \vert > 3.5\text{g}$, (b) Waterlogging: moisture $> 85\%$ and rain duration $> 120\text{s}$, (c) Fog/Dense smog: humidity $> 92\%$ and visibility $< 150\text{m}$. | Unit testing with threshold perturbation. |
| **FR-04** | **Sub-100ms Roadside Actuation** | Upon detecting an anomaly, the RSU shall activate the roadside RGB strobe (Red flashing @ 4Hz), trigger the audible buzzer, and render hazard text on the 0.96" OLED display within $\le 100\text{ ms}$. | Logic analyzer / digital timing capture. |
| **FR-05** | **MQTT Telemetry Transmission** | The RSU shall format sensor telemetry as JSON and publish to topic `delhi/rsu/{node_id}/telemetry` over MQTT QoS 1 every 4 seconds or immediately on hazard detection. | MQTT Explorer / Wireshark packet capture. |
| **FR-06** | **Central Telemetry REST Endpoint** | The server shall provide `GET /api/iot/telemetry` and `POST /api/iot/simulate-anomaly` returning live status for all deployed RSUs. | Automated HTTP integration test (`node --test`). |
| **FR-07** | **Official Blackspot Spatial Clustering** | The system shall map incidents and telemetry to the 55 statutory Delhi Traffic Police blackspots within a 500m geodetic radius using Haversine calculation. | Geodetic verification test against known coordinates. |
| **FR-08** | **Deterministic Corridor Risk Scoring** | The ML engine shall calculate a composite risk score $[0, 100]$ based on road geometry, surface condition, lighting, traffic speed delta, and live RSU telemetry. | Automated test asserting outputs sum to probability 1.0. |
| **FR-09** | **Responsive Twilight Dark UI** | The frontend shall present a minimal, accessible interface featuring real-time Leaflet map rendering, CARTO dark tiles, 1-click scenario simulation, and collapsible telemetry feeds. | Browser rendering across desktop and mobile screens. |
| **FR-10** | **Offline PWA Installation** | The web application shall provide a valid Web App Manifest (`manifest.json`) and SVG icons allowing direct installation onto mobile devices. | Lighthouse PWA audit & manifest endpoint tests. |

---

### 3.2 Non-Functional Requirements (NFR)

#### NFR-01: Performance & Latency
- The backend server shall process risk inference and telemetry ingestion in under **$25 \text{ milliseconds}$** per request.
- Central API endpoints shall support at least **120 requests/minute per client IP** without performance degradation.

#### NFR-02: Reliability & Fault Tolerance
- In the event of Wi-Fi or MQTT broker disconnection, the ESP32 RSU shall enter autonomous local mode: caching the last 50 readings in internal EEPROM/SPIFFS and continuing local OLED/hazard warning actuation without interruption.
- The Node.js server shall implement graceful shutdown (`SIGTERM`, `SIGINT`) with complete connection draining and automatic port cleanup.

#### NFR-03: Security & Rate Limiting
- The server shall enforce strict Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and sanitization of all URL query and POST parameters.
- API requests shall be rate-limited via a sliding-window counter (`RATE_LIMIT_MAX = 120`, `RATE_LIMIT_WINDOW_MS = 60000`).
- No private API keys or credentials shall be committed to version control; all secrets must load from `.env`.

#### NFR-04: Usability & Human Factors
- The web interface shall achieve high contrast ratios compliant with WCAG 2.1 AA standards.
- Roadside OLED display typography must be readable from a distance of at least 15 meters during night conditions.

#### NFR-05: Maintainability & Portability
- The cloud backend shall have **zero external npm runtime dependencies**, running on standard Node.js 22 LTS modules.
- Firmware code shall be structured in modular C++ files compatible with both PlatformIO and the standard Arduino IDE.

---

## 4. Hardware & Interface Constraints

1. **Microcontroller**: Espressif ESP32 DevKit v1 (32-bit Xtensa dual-core @ 240MHz, 520KB SRAM, 4MB Flash).
2. **Power Budget**: Maximum current draw during active Wi-Fi transmit $< 240\text{ mA}$; sleep current $< 15\text{ mA}$; sustainable using a 5V 2A solar charging subsystem with 18650 Li-ion battery backup.
3. **Operating Temperature**: Industrial range: $-10^\circ\text{C}$ to $+65^\circ\text{C}$ inside an IP65 waterproof outdoor junction enclosure.
