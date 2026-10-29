# Bill of Materials (BOM)

## IoT Roadside Unit (RSU) - Embedded Road Safety Platform
**Project**: IoT-Enabled Road Safety & Blackspot Warning Platform  
**Target Organization**: HCLTech Embedded Systems & IoT Training Review  
**Version**: 1.0 (September 2026)  
**Standard**: Follows HCLTech Sample BOM Format  

---

### Component Cost Breakdown (Hardware Unit Cost)

| S.No | Component Description | Part Number / Model | Qty | Unit Cost (INR) | Total Cost (INR) | Primary Supplier | Purpose / Role in System |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **1** | **ESP32 DevKit v1** (Dual-Core 240MHz, Wi-Fi + BLE, 30-Pin) | ESP-WROOM-32 | 1 | 450 | 450 | Robu.in / Amazon | Core edge processor, sensor sampling, edge anomaly classification, MQTT/HTTP transmission. |
| **2** | **DHT22 Digital Temperature & Humidity Sensor** | AM2302 | 1 | 220 | 220 | Amazon | Ambient microclimate telemetry; detects freezing temperatures and conditions conducive to dense fog. |
| **3** | **Rain / Surface Moisture Sensor Module** (Foil Plate + Comparator) | FC-37 / YL-83 | 1 | 85 | 85 | Robu.in | Detects conductive road surface wetness, rainfall intensity, and localized waterlogging/flash puddling. |
| **4** | **MPU-6050 3-Axis Accelerometer & Gyroscope** | MPU-6050 (GY-521) | 1 | 140 | 140 | Robu.in | Mounted to highway guardrail/pole; detects severe structural impacts ($> 3.5\text{g}$) from vehicular collisions. |
| **5** | **HC-SR04 Ultrasonic Distance Sensor** | HC-SR04 | 1 | 110 | 110 | Robu.in / Amazon | Measures vehicle passage interval to estimate localized traffic density and vehicle speed deltas. |
| **6** | **0.96" I2C Monochrome OLED Display** (128x64 White/Blue) | SSD1306 | 1 | 190 | 190 | Robu.in | Immediate roadside visual advisory screen for motorists approaching the blackspot danger zone. |
| **7** | **High-Power Common-Cathode RGB LED Module** (10mm Diffused) | KY-016 | 2 | 45 | 90 | Robu.in | High-visibility optical warning beacon (Green = Clear, Amber = Caution, Flashing Red = Hazard). |
| **8** | **Active Piezo Buzzer / 85dB Warning Siren Module** | 5V Active Buzzer | 1 | 40 | 40 | Robu.in | High-pitch audible hazard warning during critical vehicle collision or flash flood conditions. |
| **9** | **Light Dependent Resistor (LDR) Sensor Module** | GL5528 + LM393 | 1 | 55 | 55 | Local / Amazon | Measures ambient light level to classify day, twilight, dusk, or dark night visibility conditions. |
| **10** | **TP4056 5V 1A Li-Ion Battery Charger & Protection Board** | TP4056 Type-C | 1 | 45 | 45 | Robu.in | Manages solar battery charging and provides under-voltage/over-current battery cutoff. |
| **11** | **18650 Rechargeable Li-Ion Battery** (3.7V 2600mAh) | Samsung / LG 18650 | 2 | 220 | 440 | Robu.in / Local | Uninterruptible DC power supply providing up to 48 hours of autonomous operation during cloudy/rainy days. |
| **12** | **5V 6W Monocrystalline Outdoor Solar Panel** (170x130mm) | 5V 6W Solar Mini | 1 | 480 | 480 | Amazon / Robu.in | Harvests solar energy during daytime to ensure completely off-grid roadside deployment. |
| **13** | **IP65 Weatherproof Junction Enclosure** (150x100x70mm) | ABS Outdoor Box | 1 | 320 | 320 | Local / Amazon | Protects electronics, wiring, and battery from heavy monsoon rain, highway dust, and extreme heat. |
| **14** | **Jumper Wires, 330Ω Resistors, Breadboard & Mounting Hardware** | Assorted Kit | 1 | 165 | 165 | Local / Amazon | Interconnections, current-limiting resistors for LEDs, and mechanical mounting to roadside pole. |
| | | | | **TOTAL (INR)** | **₹2,830 INR** | | **Complete Edge Node Hardware Cost** |

---

### Hardware Cost Optimization Analysis
- **Target Budget**: Under ₹3,500 INR per deployed blackspot node.
- **Achieved Budget**: **₹2,830 INR** (~$34 USD), well within commercial feasibility for municipal transportation authorities (Delhi Traffic Police / NHAI / PWD).
- **Scalability**: For citywide deployment across all 55 designated Delhi blackspots, the total hardware procurement cost is approximately **₹1,55,650 INR**, offering immense return-on-investment compared to conventional proprietary traffic ITS radars costing ₹3,00,000+ each.
