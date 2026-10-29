# Live Demo Video Script & Walkthrough Guide

## IoT-Enabled Road Safety & Blackspot Warning Platform
**Target Organization**: HCLTech Embedded Systems & IoT Training Review  
**Standard**: Follows HCLTech Step 8 (Demo & Presentation)  
**Format**: 3 to 5-Minute Evaluation Video Recording Script  

---

## Video Outline & Timing Breakdown

| Segment | Timing | Screen / Visual Focus | Narration & Action Points |
| :---: | :---: | :--- | :--- |
| **1. Introduction** | 0:00 – 0:45 | Title Slide & Web Dashboard Header | *"Welcome to the demonstration of the IoT-Enabled Intelligent Road Safety Platform, developed under the HCLTech Embedded Systems & IoT curriculum. This project addresses the 55 statutory high-fatality blackspots across Delhi NCR."* |
| **2. Hardware & RSU Overview** | 0:45 – 1:30 | ESP32 Hardware Unit / Schematic Diagram | *"Here is the Roadside Unit (RSU). Powered by an ESP32 dual-core microcontroller, it interfaces with a DHT22 microclimate sensor, surface moisture sensor, HC-SR04 ultrasonic speed detector, and MPU-6050 crash accelerometer, operating on a solar-charged 18650 battery subsystem costing ₹2,830 INR."* |
| **3. Live Edge Anomaly & Actuation** | 1:30 – 2:30 | Serial Monitor + Hardware Actuators | *"Let us trigger a road hazard condition—waterlogging or crash impact. Watch how the ESP32 rolling average filter detects the threshold and immediately actuates the roadside OLED display and red RGB strobe in under 32 milliseconds."* |
| **4. Cloud Telemetry & Map Visualization** | 2:30 – 3:45 | Web Dashboard at `http://localhost:8000` | *"Simultaneously, the RSU publishes MQTT telemetry packets to HiveMQ. Here on our twilight dark dashboard, the Mukarba Chowk node instantly pulses red. Commuters can view the safe speed advisory, while police dispatchers receive real-time alerts."* |
| **5. Testing & Conclusion** | 3:45 – 4:30 | Terminal running `npm test` & Slides | *"The software is backed by 28 automated unit, integration, and security tests passing with 100% success. Thank you for your review."* |

---

## Step-by-Step Instructions to Record Your Demo Video

1. **Start the Local Web Platform**:
   ```sh
   npm start
   ```
   Open `http://localhost:8000` in Google Chrome or Microsoft Edge.
2. **Open the Terminal in VS Code**:
   Run the automated test suite to demonstrate quality:
   ```sh
   npm test
   ```
3. **Record using OBS Studio or Windows Game Bar (`Win + G`)**:
   - Record in 1080p resolution at 30/60 fps.
   - Follow the 5-segment script above.
4. **Upload to Google Drive / YouTube**:
   - Set visibility to *Unlisted* or *Public*.
   - Replace the placeholder link in `README.md` with your video URL.
