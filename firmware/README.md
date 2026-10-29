# ESP32 Roadside Unit (RSU) Firmware Guide

## HCLTech Embedded Systems & IoT Training Curriculum
**Hardware**: ESP32 DevKit v1 (30-pin)  
**IDE Supported**: VS Code + PlatformIO Extension OR Arduino IDE 2.x  
**Firmware File**: `esp32_rsu_telemetry.ino`  

---

## 1. Quick Setup via Arduino IDE

1. **Install ESP32 Board Package**:
   - Open **Arduino IDE** → **File** → **Preferences**.
   - Add this URL to *Additional Boards Manager URLs*:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to **Tools** → **Board** → **Boards Manager**, search for `esp32` by Espressif Systems and click **Install**.

2. **Install Required Libraries**:
   - Go to **Sketch** → **Include Library** → **Manage Libraries...** and install:
     - `PubSubClient` by Nick O'Leary
     - `DHT sensor library` by Adafruit
     - `Adafruit SSD1306` by Adafruit
     - `Adafruit GFX Library` by Adafruit

3. **Select Board & Port**:
   - Board: `ESP32 Dev Module` (or `DOIT ESP32 DEVKIT V1`)
   - CPU Frequency: `240MHz (WiFi/BT)`
   - Flash Frequency: `80MHz`
   - Upload Speed: `921600`
   - Port: Select your ESP32 COM port (e.g., `COM3` on Windows).

4. **Flash the Code**:
   - Configure your Wi-Fi SSID and Password in `esp32_rsu_telemetry.ino`.
   - Click the **Upload** arrow.
   - Open the **Serial Monitor** at **115200 baud** to see live boot and telemetry logs.

---

## 2. Setup via VS Code + PlatformIO

1. Open VS Code and install the **PlatformIO IDE** extension.
2. Click **File** → **Open Folder...** and select the `RoadAccident/firmware` folder.
3. PlatformIO will automatically read `platformio.ini` and download all required toolchains and libraries.
4. Click the PlatformIO **Build** checkmark icon, then click the **Upload** arrow.
5. Click the Serial Monitor plug icon to inspect live output.

---

## 3. Testing Under Realistic Roadside Conditions

As prescribed in Step 3 of the HCLTech implementation process:
1. **Power Cycle Recovery**:
   - Disconnect and reconnect 5V power.
   - Verify that the RSU re-initializes I2C, recalibrates MPU-6050, connects to Wi-Fi, and resumes telemetry within $< 3.5\text{ seconds}$.
2. **Wi-Fi Drop / Broker Disconnection**:
   - Turn off Wi-Fi or block port 1883.
   - Confirm that the RSU continues local roadside actuation: OLED hazard warnings, buzzer, and RGB LEDs continue operating autonomously without freezing or crashing.
3. **Sensor Noise / Transient Spikes**:
   - Inject momentary analog spikes to ADC pin 34.
   - Confirm that the 5-sample rolling average filter dampens the spike without triggering false positive flood alarms.
4. **Crash Impact Trigger**:
   - Gently tap the guardrail/enclosure with acceleration $> 3.5\text{g}$.
   - Verify that the RSU instantly switches to `STATE_CRASH_IMPACT`, sounds the siren, strobes red at 4Hz, and issues an immediate MQTT alert packet.
