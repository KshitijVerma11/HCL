# Hardware Circuit Design, Pinout & EasyEDA Schematic Guide

## IoT Roadside Unit (RSU) - Embedded Systems
**Target Organization**: HCLTech Embedded Systems & IoT Training Review  
**Microcontroller**: ESP32 DevKit v1 (30-Pin NodeMCU ESP-WROOM-32)  
**EDA Tool**: EasyEDA Standard Edition / KiCad  
**Version**: 1.0 (September 2026)  

---

## 1. ESP32 GPIO Pinout & Connection Mapping

The table below details the complete wiring layout for connecting the sensors, actuators, and communication buses to the ESP32:

| Component | Pin Name | ESP32 GPIO Pin | Signal Type | Electrical Characteristic | Description / Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DHT22** | DATA | `GPIO 4` | Digital I/O | $10\text{k}\Omega$ pull-up to 3.3V | Microclimate temperature & relative humidity sensor. |
| **DHT22** | VCC / GND | `3V3` / `GND` | Power | 3.3V DC | Regulated sensor supply. |
| **Rain Sensor (YL-83)** | Analog OUT (AO)| `GPIO 34` | Analog Input (ADC1) | 0 to 3.3V (12-bit ADC: 0-4095) | Measures surface moisture level (lower voltage = wetter surface). |
| **Rain Sensor (YL-83)** | VCC / GND | `3V3` / `GND` | Power | 3.3V DC | Controlled analog comparator power. |
| **MPU-6050 (GY-521)** | SDA | `GPIO 21` | I2C Data | Hardware I2C (Wire 0) | Accelerometer/Gyro communication ($400\text{kHz}$). |
| **MPU-6050 (GY-521)** | SCL | `GPIO 22` | I2C Clock | Hardware I2C (Wire 0) | Accelerometer/Gyro clock line. |
| **MPU-6050 (GY-521)** | INT | `GPIO 19` | Digital Interrupt | Active-high edge interrupt | Immediate interrupt trigger upon severe crash impact ($> 3.5\text{g}$). |
| **MPU-6050 (GY-521)** | VCC / GND | `3V3` / `GND` | Power | 3.3V DC | Low-noise inertial sensor power. |
| **HC-SR04** | TRIG | `GPIO 5` | Digital Output | $10\mu\text{s}$ pulse | Emits $40\text{kHz}$ ultrasonic sound wave. |
| **HC-SR04** | ECHO | `GPIO 18` | Digital Input | Voltage divider ($5\text{V} \rightarrow 3.3\text{V}$) | Measures time-of-flight; $1\text{k}\Omega + 2\text{k}\Omega$ divider protects GPIO. |
| **HC-SR04** | VCC / GND | `VIN (5V)` / `GND` | Power | 5V DC from battery / USB | Requires 5V for transducer transmitter. |
| **SSD1306 OLED (0.96")**| SDA | `GPIO 21` | I2C Data (Shared) | I2C address `0x3C` | Displays roadside hazard alert messages. |
| **SSD1306 OLED (0.96")**| SCL | `GPIO 22` | I2C Clock (Shared) | I2C address `0x3C` | Clock line shared with MPU-6050. |
| **RGB LED (Red)** | Anode | `GPIO 25` | PWM (LEDC Channel 0) | Through $330\Omega$ resistor | Flashes red at 4Hz during severe crash or flash flood hazard. |
| **RGB LED (Green)** | Anode | `GPIO 26` | PWM (LEDC Channel 1) | Through $330\Omega$ resistor | Solid green indicates normal road status. |
| **RGB LED (Blue)** | Anode | `GPIO 27` | PWM (LEDC Channel 2) | Through $330\Omega$ resistor | Combined with Red for Amber caution illumination. |
| **Active Buzzer** | Positive (+) | `GPIO 14` | Digital Output | NPN 2N2222 driver / $1\text{k}\Omega$ base | Emits $85\text{dB}$ high-frequency warning acoustic alert. |
| **LDR Sensor Module** | DO / AO | `GPIO 35` | Analog Input (ADC1) | 0 to 3.3V (12-bit ADC) | Measures ambient lux level to detect dusk, fog, or night. |

---

## 2. EasyEDA Circuit Schematic Guide

To construct this circuit in EasyEDA (Standard or Pro), follow these schematic creation steps:

```
                  +----------------------------------------------------+
                  |               ESP32 DevKit v1 (30-Pin)             |
                  |                                                    |
                  | [3V3] ----+--------+--------+-------+              |
                  |           |        |        |       |              |
                  |         DHT22   RainMod   MPU6050  OLED            |
                  |          VCC      VCC       VCC    VCC             |
                  |                                                    |
                  | [GND] ---- Common Ground Bus ---------------------+|
                  |                                                    |
[GPIO 4]  <-------+-- DHT22 DATA (with 10k pull-up to 3V3)             |
[GPIO 34] <-------+-- Rain Sensor Analog OUT (0-4095 ADC)              |
[GPIO 35] <-------+-- LDR Sensor Analog OUT (0-4095 ADC)               |
                  |                                                    |
[GPIO 21] <-------+-- Shared I2C SDA Bus ----> [MPU6050 SDA] & [OLED SDA]
[GPIO 22] <-------+-- Shared I2C SCL Bus ----> [MPU6050 SCL] & [OLED SCL]
[GPIO 19] <-------+-- MPU6050 INT (Motion/Crash Interrupt)             |
                  |                                                    |
[GPIO 5]  --------+--> HC-SR04 TRIG Pulse                              |
[GPIO 18] <-------+-- HC-SR04 ECHO (via 1k/2k Ohm Voltage Divider)     |
                  |                                                    |
[GPIO 25] --------+--> 330 Ohm --> Red LED Anode                       |
[GPIO 26] --------+--> 330 Ohm --> Green LED Anode                     |
[GPIO 27] --------+--> 330 Ohm --> Blue LED Anode                      |
[GPIO 14] --------+--> 1k Ohm --> 2N2222 Transistor Base --> 5V Buzzer |
                  |                                                    |
                  | [VIN 5V] <---+-- TP4056 OUT+ (5V Boosted)          |
                  | [GND]    <---+-- TP4056 OUT-                       |
                  +----------------------------------------------------+
                                      |
                      [TP4056 Charger & Protection Module]
                                 ^             ^
                                 |             |
                       [5V 6W Solar Panel]  [2x 18650 Li-Ion Cell 3.7V]
```

### Steps to Import into EasyEDA:
1. Open [EasyEDA](https://easyeda.com) and create a New Project named `ESP32_Roadside_Unit_RSU`.
2. In the Component Library search for:
   - `ESP32-DEVKIT-V1` (JLCPCB Part: `C2859187` or generic 30-pin symbol).
   - `DHT22` (JLCPCB Part: `C168359`).
   - `MPU-6050` (JLCPCB Part: `C24112`).
   - `SSD1306-0.96-OLED-I2C` (JLCPCB Part: `C114251`).
   - `HC-SR04` ultrasonic sensor header.
3. Wire the buses according to the GPIO mapping table above.
4. Run the **Design Rule Check (DRC)** in EasyEDA to verify zero unconnected nets.
5. Export the schematic as PDF and Gerber files for PCB fabrication.

---

## 3. Power Budget & Solar Autonomy Calculation

To guarantee 24/7 continuous operation even during consecutive monsoon rain or heavy winter smog days:

- **Average Current Draw**:
  - ESP32 active + Wi-Fi listening: $\sim 80\text{ mA}$
  - Wi-Fi transmit burst (every 4s, duration 100ms): $\sim 180\text{ mA}$
  - Sensors (DHT22, MPU6050, Ultrasonic, Rain): $\sim 25\text{ mA}$
  - Actuators (OLED + LEDs): $\sim 35\text{ mA}$
  - **Weighted Average Operating Current**: $\approx 140\text{ mA}$ at $5\text{V}$ ($0.70\text{ Watts}$).
- **Daily Energy Consumption**:
  $$E_{\text{daily}} = 0.70\text{ W} \times 24\text{ hours} = 16.8\text{ Watt-hours (Wh)}$$
- **Battery Capacity**:
  - $2 \times 18650\text{ cells (each } 3.7\text{V}, 2600\text{mAh}) = 5200\text{mAh} = 19.24\text{ Wh}$.
  - Usable energy at $80\%$ DoD (Depth of Discharge) $= 15.4\text{ Wh} \approx \mathbf{22 \text{ hours}}$ without solar input.
- **Solar Harvesting**:
  - $5\text{V}, 6\text{W}$ solar panel produces up to $1.2\text{A}$ at peak sun.
  - With an average of only **3.5 peak sun hours** per day in Delhi winter:
    $$E_{\text{harvested}} = 6\text{ W} \times 3.5\text{ hours} \times 0.85\text{ (efficiency)} = 17.85\text{ Wh} > 16.8\text{ Wh}$$
  - The solar harvest **exceeds the daily consumption**, providing perpetual autonomous energy.

---

## 4. Sensor Calibration Procedures

1. **Rain / Surface Moisture Sensor Calibration**:
   - **Dry State (Clear road)**: Analog reading $\approx 3600 - 4095$ ($0\%$ wetness).
   - **Damp Surface (Light drizzle)**: Analog reading $\approx 2200 - 3200$ ($25\% - 50\%$ wetness).
   - **Submerged / Waterlogged Road**: Analog reading $< 1200$ ($> 85\%$ wetness).
   - Firmware maps the raw 12-bit ADC value:
     $$\text{Wetness \%} = \text{constrain}\left( \frac{4095 - \text{ADC}}{4095 - 800} \times 100, 0, 100 \right)$$

2. **MPU-6050 Crash Impact Calibration**:
   - Offset calibration performed at boot: averages 100 resting samples to establish $1.0\text{g}$ gravitational baseline on the Z-axis.
   - Dynamic acceleration magnitude:
     $$a_{\text{net}} = \sqrt{a_x^2 + a_y^2 + a_z^2}$$
   - Any reading where $\vert a_{\text{net}} \vert > 3.5\text{g}$ triggers the crash impact interrupt.

