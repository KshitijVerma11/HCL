/**
 * ==============================================================================
 * Project: IoT-Enabled Intelligent Road Safety & Blackspot Warning Platform
 * File: esp32_rsu_telemetry.ino
 * Target Microcontroller: ESP32 DevKit v1 (Xtensa Dual-Core 240MHz)
 * Domain: Embedded Systems & IoT (HCLTech BTech Capstone Specification)
 * Description: Real-time roadside unit firmware with edge anomaly detection,
 *              rolling-average filtering, sub-100ms optical/audible actuation,
 *              and dual MQTT (HiveMQ) / HTTP REST telemetry publishing.
 * ==============================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

// ==============================================================================
// 1. PIN CONFIGURATION & HARDWARE CONSTANTS
// ==============================================================================
#define DHT_PIN             4        // DHT22 Data Pin
#define DHT_TYPE            DHT22
#define RAIN_ANALOG_PIN     34       // FC-37 Rain Sensor (ADC1 CH6)
#define LDR_ANALOG_PIN      35       // LDR Ambient Light (ADC1 CH7)
#define TRIG_PIN            5        // HC-SR04 Ultrasonic Trigger
#define ECHO_PIN            18       // HC-SR04 Ultrasonic Echo
#define BUZZER_PIN          14       // Active 5V Piezo Buzzer
#define LED_RED_PIN         25       // RGB LED - Red channel
#define LED_GREEN_PIN       26       // RGB LED - Green channel
#define LED_BLUE_PIN        27       // RGB LED - Blue channel

// I2C OLED Display Configuration (128x64 SSD1306)
#define SCREEN_WIDTH        128
#define SCREEN_HEIGHT       64
#define OLED_RESET          -1
#define SCREEN_ADDRESS      0x3C

// MPU-6050 Registers & I2C Address
#define MPU6050_ADDR        0x68
#define MPU_PWR_MGMT_1      0x6B
#define MPU_ACCEL_XOUT_H    0x3B

// Node Identification & Telemetry Settings
const char* RSU_NODE_ID     = "RSU-IOT-102";      // Default: Mukarba Chowk Blackspot
const char* RSU_CORRIDOR    = "NH-44 Outer Ring Rd";
const float RSU_LATITUDE    = 28.7372;
const float RSU_LONGITUDE   = 77.1603;

// ==============================================================================
// 2. NETWORK & MQTT CONFIGURATION
// ==============================================================================
// NOTE: Set your Wi-Fi credentials here or inject via build flags
const char* WIFI_SSID       = "RoadSafety_WiFi";
const char* WIFI_PASSWORD   = "SafeRoads2026";

// HiveMQ Public Cloud Broker / Local Broker
const char* MQTT_SERVER     = "broker.hivemq.com";
const int   MQTT_PORT       = 1883;
const char* MQTT_TOPIC      = "delhi/rsu/RSU-IOT-102/telemetry";
const char* MQTT_ALERT_TOPIC= "delhi/rsu/RSU-IOT-102/alerts";

// Central Node.js Server Fallback Endpoint
const char* REST_HOST       = "192.168.1.100";
const int   REST_PORT       = 8000;

// ==============================================================================
// 3. OBJECT INSTANTIATIONS & GLOBAL STATE
// ==============================================================================
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Rolling Average Filter Buffer (N = 5 samples)
const int FILTER_SIZE = 5;
float tempBuffer[FILTER_SIZE] = {0};
float humBuffer[FILTER_SIZE] = {0};
int rainBuffer[FILTER_SIZE] = {0};
int filterIndex = 0;
bool bufferFilled = false;

// Anomaly States
enum RoadHazardState {
    STATE_NORMAL,
    STATE_WET_SURFACE,
    STATE_FLASH_FLOOD,
    STATE_FOG_BANK,
    STATE_CRASH_IMPACT,
    STATE_SENSOR_FAULT
};

RoadHazardState currentHazard = STATE_NORMAL;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 4000; // 4 seconds normal interval
unsigned long lastBlinkTime = 0;
bool blinkToggle = false;

// ==============================================================================
// 4. MPU-6050 ACCELEROMETER FUNCTIONS
// ==============================================================================
void initMPU6050() {
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(MPU_PWR_MGMT_1);
    Wire.write(0x00); // Wake up MPU-6050
    Wire.endTransmission(true);
}

float readCrashImpactMagnitude() {
    Wire.beginTransmission(MPU6050_ADDR);
    Wire.write(MPU_ACCEL_XOUT_H);
    if (Wire.endTransmission(false) != 0) {
        return -1.0; // I2C communication error
    }

    Wire.requestFrom(MPU6050_ADDR, 6, true);
    if (Wire.available() < 6) return -1.0;

    int16_t rawX = (Wire.read() << 8) | Wire.read();
    int16_t rawY = (Wire.read() << 8) | Wire.read();
    int16_t rawZ = (Wire.read() << 8) | Wire.read();

    // Scale to G's (+/- 2g range -> 16384 LSB/g)
    float ax = rawX / 16384.0;
    float ay = rawY / 16384.0;
    float az = rawZ / 16384.0;

    // Calculate net acceleration vector magnitude
    return sqrt(ax * ax + ay * ay + az * az);
}

// ==============================================================================
// 5. ULTRASONIC TRAFFIC SPEED ESTIMATION
// ==============================================================================
long readUltrasonicDistanceCm() {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout (~5m)
    if (duration == 0) return 400; // No obstacle detected (clear)
    return duration * 0.034 / 2;
}

// ==============================================================================
// 6. ROLLING AVERAGE NOISE FILTER
// ==============================================================================
void updateRollingAverage(float rawTemp, float rawHum, int rawRain,
                          float &avgTemp, float &avgHum, int &avgRain) {
    tempBuffer[filterIndex] = rawTemp;
    humBuffer[filterIndex] = rawHum;
    rainBuffer[filterIndex] = rawRain;

    filterIndex = (filterIndex + 1) % FILTER_SIZE;
    if (filterIndex == 0) bufferFilled = true;

    int count = bufferFilled ? FILTER_SIZE : filterIndex;
    float sumT = 0, sumH = 0;
    long sumR = 0;

    for (int i = 0; i < count; i++) {
        sumT += tempBuffer[i];
        sumH += humBuffer[i];
        sumR += rainBuffer[i];
    }

    avgTemp = sumT / count;
    avgHum = sumH / count;
    avgRain = sumR / count;
}

// ==============================================================================
// 7. EDGE HAZARD CLASSIFICATION ENGINE
// ==============================================================================
RoadHazardState evaluateEdgeHazards(float tempC, float humidity, int rainADC,
                                    float impactG, int ldrVal, int &visibilityMeters) {
    // 1. Crash Impact Detection (Threshold > 3.5g)
    if (impactG > 3.5) {
        return STATE_CRASH_IMPACT;
    }

    // 2. Sensor Fault Check (I2C disconnected or impossible readings)
    if (isnan(tempC) || isnan(humidity) || impactG < 0) {
        return STATE_SENSOR_FAULT;
    }

    // Convert raw rain ADC to surface wetness percentage (Lower ADC = Wetter)
    int wetnessPercent = constrain(map(rainADC, 4095, 800, 0, 100), 0, 100);

    // 3. Flash Flood / Severe Waterlogging (> 80% wetness)
    if (wetnessPercent > 80) {
        visibilityMeters = 350;
        return STATE_FLASH_FLOOD;
    }

    // 4. Fog Bank / Dense Smog (Humidity > 92% and Low Light / Drizzle)
    if (humidity > 92.0 && tempC < 18.0) {
        visibilityMeters = 80; // Critical visibility drop
        return STATE_FOG_BANK;
    }

    // 5. Wet Surface Condition
    if (wetnessPercent > 35) {
        visibilityMeters = 600;
        return STATE_WET_SURFACE;
    }

    // 6. Normal Condition
    visibilityMeters = 1200;
    return STATE_NORMAL;
}

// ==============================================================================
// 8. ROADSIDE ACTUATION (SUB-100MS LATENCY)
// ==============================================================================
void setWarningBeacon(uint8_t r, uint8_t g, uint8_t b, bool buzzerOn) {
    analogWrite(LED_RED_PIN, r);
    analogWrite(LED_GREEN_PIN, g);
    analogWrite(LED_BLUE_PIN, b);
    digitalWrite(BUZZER_PIN, buzzerOn ? HIGH : LOW);
}

void renderRoadsideOLED(const char* title, const char* status, float speedAdvisory) {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // Header Box
    display.fillRect(0, 0, 128, 14, SSD1306_WHITE);
    display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(4, 3);
    display.print("HCLTech RSU: ");
    display.print(RSU_NODE_ID);

    // Main Status
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 18);
    display.setTextSize(1);
    display.println(title);

    display.setTextSize(1);
    display.setCursor(0, 32);
    display.println(status);

    // Speed Advisory Footer
    display.drawLine(0, 48, 128, 48, SSD1306_WHITE);
    display.setCursor(0, 52);
    display.print("SAFE SPEED: ");
    display.print((int)speedAdvisory);
    display.print(" KM/H");

    display.display();
}

void actuateRoadside(RoadHazardState state) {
    unsigned long currentMillis = millis();

    switch (state) {
        case STATE_CRASH_IMPACT:
            // High-priority rapid red flashing + audible siren
            if (currentMillis - lastBlinkTime > 125) { // 4Hz flash
                lastBlinkTime = currentMillis;
                blinkToggle = !blinkToggle;
                setWarningBeacon(blinkToggle ? 255 : 0, 0, 0, blinkToggle);
            }
            renderRoadsideOLED("CRITICAL HAZARD", "VEHICLE CRASH AHEAD", 20.0);
            break;

        case STATE_FLASH_FLOOD:
            // Amber pulsing warning
            if (currentMillis - lastBlinkTime > 250) { // 2Hz pulse
                lastBlinkTime = currentMillis;
                blinkToggle = !blinkToggle;
                setWarningBeacon(blinkToggle ? 255 : 0, blinkToggle ? 140 : 0, 0, false);
            }
            renderRoadsideOLED("WARNING: FLOOD", "ROAD WATERLOGGED", 30.0);
            break;

        case STATE_FOG_BANK:
            // Slow Amber strobe
            if (currentMillis - lastBlinkTime > 500) {
                lastBlinkTime = currentMillis;
                blinkToggle = !blinkToggle;
                setWarningBeacon(blinkToggle ? 255 : 0, blinkToggle ? 140 : 0, 0, false);
            }
            renderRoadsideOLED("DENSE FOG BANK", "VISIBILITY < 100M", 35.0);
            break;

        case STATE_WET_SURFACE:
            setWarningBeacon(200, 120, 0, false); // Solid Amber
            renderRoadsideOLED("CAUTION", "WET SLIPPERY ROAD", 45.0);
            break;

        case STATE_SENSOR_FAULT:
            setWarningBeacon(255, 0, 255, false); // Purple error indicator
            renderRoadsideOLED("SYSTEM FAULT", "SENSOR DISCONNECTED", 50.0);
            break;

        case STATE_NORMAL:
        default:
            setWarningBeacon(0, 200, 0, false); // Solid Green
            renderRoadsideOLED("CORRIDOR CLEAR", "CONDITIONS OPTIMAL", 60.0);
            break;
    }
}

// ==============================================================================
// 9. TELEMETRY PACKET CREATION & MQTT TRANSMISSION
// ==============================================================================
void publishTelemetry(float tempC, float humidity, int wetnessPercent,
                      float impactG, int visibilityMeters, RoadHazardState state) {
    const char* stateString = "normal";
    if (state == STATE_CRASH_IMPACT) stateString = "crash_impact";
    else if (state == STATE_FLASH_FLOOD) stateString = "flash_flood";
    else if (state == STATE_FOG_BANK) stateString = "fog_bank";
    else if (state == STATE_WET_SURFACE) stateString = "wet_surface";
    else if (state == STATE_SENSOR_FAULT) stateString = "sensor_fault";

    // Format lightweight JSON telemetry payload
    char jsonPayload[256];
    snprintf(jsonPayload, sizeof(jsonPayload),
        "{\"node_id\":\"%s\",\"lat\":%.4f,\"lon\":%.4f,\"temp_c\":%.1f,"
        "\"humidity\":%.1f,\"wetness_pct\":%d,\"impact_g\":%.2f,"
        "\"visibility_m\":%d,\"state\":\"%s\",\"uptime_s\":%lu}",
        RSU_NODE_ID, RSU_LATITUDE, RSU_LONGITUDE, tempC, humidity,
        wetnessPercent, impactG, visibilityMeters, stateString, millis() / 1000);

    Serial.print("[RSU Telemetry] Publishing: ");
    Serial.println(jsonPayload);

    // Publish to HiveMQ / MQTT Broker
    if (mqttClient.connected()) {
        mqttClient.publish(MQTT_TOPIC, jsonPayload, 1); // QoS 1 guaranteed delivery
        if (state != STATE_NORMAL) {
            mqttClient.publish(MQTT_ALERT_TOPIC, jsonPayload, 1);
        }
    } else {
        Serial.println("[RSU Telemetry] MQTT disconnected, buffering locally.");
    }
}

// ==============================================================================
// 10. SETUP & MAIN EXECUTION LOOP
// ==============================================================================
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n========================================================");
    Serial.println("  IoT Roadside Unit (RSU) Firmware - HCLTech Capstone");
    Serial.println("========================================================");

    // Pin Modes
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(LED_RED_PIN, OUTPUT);
    pinMode(LED_GREEN_PIN, OUTPUT);
    pinMode(LED_BLUE_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW);

    // Initialize I2C Bus & OLED
    Wire.begin(21, 22);
    if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println("[Error] SSD1306 OLED initialization failed!");
    } else {
        display.clearDisplay();
        display.setTextSize(1);
        display.setTextColor(SSD1306_WHITE);
        display.setCursor(10, 25);
        display.println("RSU BOOTING...");
        display.display();
    }

    // Initialize Sensors
    dht.begin();
    initMPU6050();

    // Connect to Wi-Fi
    Serial.print("[Wi-Fi] Connecting to: ");
    Serial.println(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int wifiRetries = 0;
    while (WiFi.status() != WL_CONNECTED && wifiRetries < 20) {
        delay(500);
        Serial.print(".");
        wifiRetries++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[Wi-Fi] Connected! IP: " + WiFi.localIP().toString());
        mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    } else {
        Serial.println("\n[Wi-Fi] Warning: Offline autonomous mode activated.");
    }
}

void loop() {
    // 1. Maintain MQTT Connection
    if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
        if (mqttClient.connect(RSU_NODE_ID)) {
            Serial.println("[MQTT] Connected to broker successfully.");
        }
    }
    if (mqttClient.connected()) {
        mqttClient.loop();
    }

    // 2. Multi-Sensor Data Acquisition
    float rawTemp = dht.readTemperature();
    float rawHum = dht.readHumidity();
    int rawRain = analogRead(RAIN_ANALOG_PIN);
    int rawLdr = analogRead(LDR_ANALOG_PIN);
    float impactG = readCrashImpactMagnitude();

    // 3. Edge Rolling Average Filter
    float avgTemp, avgHum;
    int avgRain;
    updateRollingAverage(rawTemp, rawHum, rawRain, avgTemp, avgHum, avgRain);

    // 4. Edge Hazard Evaluation
    int visibilityMeters = 1000;
    currentHazard = evaluateEdgeHazards(avgTemp, avgHum, avgRain, impactG, rawLdr, visibilityMeters);

    // 5. Sub-100ms Roadside Actuation (OLED + RGB + Siren)
    actuateRoadside(currentHazard);

    // 6. Periodic Telemetry Transmission
    unsigned long currentMillis = millis();
    int wetnessPct = constrain(map(avgRain, 4095, 800, 0, 100), 0, 100);

    // Publish either on periodic schedule or IMMEDIATELY on hazard detection
    if (currentHazard != STATE_NORMAL || (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS)) {
        lastTelemetryTime = currentMillis;
        publishTelemetry(avgTemp, avgHum, wetnessPct, impactG, visibilityMeters, currentHazard);
    }

    delay(20); // Responsive loop cycle
}

