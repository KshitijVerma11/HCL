#!/usr/bin/env python3
"""
IoT MQTT Telemetry Bridge Script
Project: IoT-Enabled Road Safety & Blackspot Warning Platform
Standard: HCLTech Embedded Systems & IoT Training Curriculum
Description: Listens for incoming ESP32 RSU telemetry on HiveMQ / local broker
             and synchronizes node states with the central REST server.
"""

import json
import sys
import time
try:
    import paho.mqtt.client as mqtt
    import requests
except ImportError:
    print("[Error] Required Python packages not found.")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883
MQTT_TOPIC = "delhi/rsu/+/telemetry"
ALERT_TOPIC = "delhi/rsu/+/alerts"
REST_SERVER_URL = "http://localhost:8000/api/iot/simulate-anomaly"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT Bridge] Connected to HiveMQ Broker ({MQTT_BROKER}:{MQTT_PORT})")
        client.subscribe(MQTT_TOPIC)
        client.subscribe(ALERT_TOPIC)
        print(f"[MQTT Bridge] Subscribed to {MQTT_TOPIC} and {ALERT_TOPIC}")
    else:
        print(f"[MQTT Bridge] Connection failed with result code: {rc}")

def on_message(client, userdata, msg):
    try:
        payload_str = msg.payload.decode("utf-8")
        data = json.loads(payload_str)
        node_id = data.get("node_id", "UNKNOWN")
        state = data.get("state", "normal")
        temp = data.get("temp_c", 0.0)
        wetness = data.get("wetness_pct", 0)
        impact = data.get("impact_g", 0.0)

        print(f"[Packet Received] Node: {node_id} | State: {state.upper()} | Temp: {temp}°C | Wetness: {wetness}% | Impact: {impact}g")

        # Forward critical hazard anomalies to local Node.js server
        if state != "normal":
            resp = requests.post(REST_SERVER_URL, json={
                "node_id": node_id,
                "anomaly_type": state
            }, timeout=2.0)
            if resp.status_code == 200:
                print(f" -> Successfully forwarded anomaly '{state}' for {node_id} to central dashboard.")
    except Exception as e:
        print(f"[Error] Failed to process message: {e}")

def main():
    client = mqtt.Client(client_id="HCLTech_RoadSafety_Bridge_" + str(int(time.time())))
    client.on_connect = on_connect
    client.on_message = on_message

    print(f"Starting IoT MQTT Bridge connecting to {MQTT_BROKER}...")
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_forever()
    except KeyboardInterrupt:
        print("\nStopping bridge. Exiting gracefully.")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    main()

