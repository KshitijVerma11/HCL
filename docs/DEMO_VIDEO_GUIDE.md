# Complete Spoken Script for Video Recording
## IoT-Enabled Road Safety & Accident Detection Platform
**Target**: HCLTech BTech Capstone Project (Embedded Systems & IoT)  
**Speaker**: BTech Capstone Project Lead  
**Target Duration**: ~3 to 4 Minutes  
**Resolution**: 1080p (Full HD), 16:9 Aspect Ratio  

---

## 🎬 Pre-Recording Checklist (Do Before Pressing Record)
1. **Start the Platform**: Open your terminal in VS Code and ensure the server is running:
   ```bash
   npm start
   ```
2. **Open Browser**: Open Google Chrome or Edge at `http://localhost:8000`. Keep it full screen (`F11` or maximized).
3. **Have Second Window Ready**: Have your VS Code or terminal open in the background so you can switch to it (`Alt + Tab`) to run `npm test`.
4. **Recording Tool**: Use **Windows Game Bar** (`Win + G` -> Record) or **OBS Studio**. Speak clearly into your microphone.

---

## 🎙️ WORD-FOR-WORD SPOKEN SCRIPT

---

### [0:00 – 0:40] Scene 1: Introduction & Problem Statement
**Screen Focus**: Full screen on the Web Dashboard (`http://localhost:8000`), showing the top header: *"🚨 Live Road Accident Detection System"*.

> **Spoke Words:**  
> *"Hello everyone and respected evaluators. My name is [Your Name], and today I am presenting my BTech Capstone Project under the HCLTech Embedded Systems and IoT curriculum.*  
>  
> *Our project is titled: **IoT-Enabled Road Accident Detection and Blackspot Warning Platform**.*  
>  
> *Every year, thousands of fatal accidents occur across Indian highways, with a severe concentration in high-risk blackspots. In Delhi NCR alone, the Delhi Traffic Police and MoRTH have identified 55 statutory high-fatality blackspot corridors—such as Mukarba Chowk, Azadpur, and Bhalswa Flyover.*  
>  
> *Our goal is to eliminate detection delays by deploying low-cost, solar-powered ESP32 Roadside Units that detect crashes in sub-seconds and warn approaching drivers before collisions occur."*

---

### [0:40 – 1:30] Scene 2: Hardware Architecture & Circuitry
**Screen Focus**: Switch to the **BOM or Circuit Diagram** (or point your webcam at your ESP32 board, or show the circuit schematic in `docs/HARDWARE_CIRCUIT.md`).

> **Spoke Words:**  
> *"Let us look at the Embedded IoT hardware architecture.*  
>  
> *Each Roadside Unit (RSU) is built on an **ESP32 DevKit dual-core microcontroller** running firmware written in C++ with FreeRTOS multitasking.*  
>  
> *The RSU interfaces with four critical sensor modalities:*  
> 1. *An **MPU-6050 3-axis accelerometer** attached to the highway crash barrier to detect physical structural shock.*  
> 2. *An **HC-SR04 ultrasonic and microwave Doppler speed radar** to monitor vehicle velocity and sudden deceleration.*  
> 3. *An **optical pavement moisture sensor** to monitor road slipperiness and waterlogging.*  
> 4. *And a **DHT22 microclimate sensor** measuring ambient temperature and humidity.*  
>  
> *The entire roadside node is powered by an autonomous solar power budget with an 18650 lithium battery subsystem, costing just **₹2,830 INR per unit**, making large-scale deployment feasible for municipal transport authorities."*

---

### [1:30 – 2:30] Scene 3: Live Dashboard & Real-Time Delhi Blackspot Map
**Screen Focus**: Switch back to browser, on **Tab 1: 🚨 Accident & Blackspot Map**.

> **Spoke Words:**  
> *(Action: Move mouse over the map showing 55 blackspots and point out the live weather banner)*  
> *"Now let's examine our live central monitoring dashboard running at `localhost:8000`.*  
>  
> *Notice this blue status bar at the top: our platform is continuously synchronized with **live physical ground weather radar from Open-Meteo and IMD**, feeding real-time Delhi air temperature, pavement moisture, and atmospheric visibility.*  
>  
> *On this interactive geospatial map, you can see all **55 statutory Delhi Traffic Police blackspots** marked with calibrated risk radiuses.*  
>  
> *(Action: Click anywhere on a road near Mukarba Chowk or GT Karnal Road)*  
> *If a commuter or autonomous vehicle navigates anywhere on this corridor, our spatial Haversine algorithm instantly pinpoints the nearest blackspot, exact geodetic distance in kilometers, and current hazard tier."*

---

### [2:30 – 3:30] Scene 4: Live Crash Impact Anomaly Detection & Actuation
**Screen Focus**: Click on **Tab 2: 📡 Roadside Accident Detectors**.

> **Spoke Words:**  
> *(Action: Click on Tab 2: '📡 Roadside Accident Detectors')*  
> *"Next, let's examine the heart of the system: our **Roadside Accident Detectors**.*  
>  
> *Here we have active telemetry streams from 6 major Delhi blackspot corridors—including Mukarba Chowk, Azadpur Chowk, and Bhalswa Flyover.*  
>  
> *Let us simulate a high-speed vehicle barrier collision to demonstrate our edge shock detection.*  
>  
> *(Action: Select 'RSU-IOT-101 (Mukarba Chowk)' in the dropdown. In the scenario dropdown, choose '💥 Crash Impact Anomaly (> 3.5g Structural Shock)'. Click the blue 'Update Station Conditions' button.)*  
>  
> *(Action: Point mouse to the flashing red alert card)*  
> *Look at that: within sub-seconds, the ESP32 rolling-average filter detects a severe **3.85g barrier shock**!*  
> *The station card immediately transitions into a **flashing critical red alert**, triggering emergency dispatch and activating edge visual warnings in **under 32 milliseconds**."*

---

### [3:30 – 4:10] Scene 5: Trip Risk Scanner & Heuristic Engine
**Screen Focus**: Click on **Tab 3: 🛡️ Accident Risk Scanner**.

> **Spoke Words:**  
> *(Action: Click on Tab 3: '🛡️ Accident Risk Scanner')*  
> *"In addition to crash detection, our platform provides preventive intelligence through the **Accident Risk Scanner**.*  
>  
> *Before a commercial driver or commuter sets off, they can configure their route conditions—such as driving on a Highway in Heavy Rain with high pavement moisture.*  
>  
> *(Action: Click the blue button: '⚡ Calculate Trip Safety Score')*  
> *The engine evaluates the trip parameters and immediately computes the safety risk score—in this case 78 out of 100, High Risk.*  
> *It breaks down the likelihood across Low, Moderate, High, and Severe categories, lists the exact contributing factors like reduced pavement friction, and outputs actionable driver recommendations such as reducing speed below 50 km/h."*

---

### [4:10 – 4:45] Scene 6: Verification, Automated Tests & Conclusion
**Screen Focus**: Switch to the Terminal window in VS Code.

> **Spoke Words:**  
> *(Action: In the terminal, type and run: `npm test`)*  
> *"To ensure enterprise software quality, our entire platform is backed by an automated test suite.*  
>  
> *(Action: Let the test output scroll and show green)*  
> *As you can see, all **28 automated tests are passing with 100% success**, covering input validation, rate limiting, geodetic distance calculations, and edge sensor telemetry.*  
>  
> *All deliverables—including the IEEE-style Project Report, Software Requirement Specification, Architecture Diagram, Bill of Materials, and Presentation Deck—are fully documented under the `/docs` directory, and the release is tagged as **version 1.0**.*  
>  
> *Thank you very much to HCLTech and the mentors for your time and guidance. I am now open to any questions."*

---

## ⏱️ Video Pacing Summary:
* **0:00 - 0:40**: Problem & Blackspots
* **0:40 - 1:30**: Hardware & Circuitry (ESP32, Sensors, ₹2,830 BOM)
* **1:30 - 2:30**: Map & Live Delhi Ground Weather
* **2:30 - 3:30**: Crash Impact Anomaly (>3.5g shock & sub-second alert)
* **3:30 - 4:10**: Trip Risk Scanner & Recommendations
* **4:10 - 4:45**: Automated Tests (`npm test` 28/28) & Conclusion
