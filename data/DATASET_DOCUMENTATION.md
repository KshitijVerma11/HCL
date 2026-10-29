# Dataset Documentation & Provenance: `raw_accidents.csv`

## 1. Provenance and Authority Statement

- **File Path**: `data/raw_accidents.csv`
- **Total Records**: 16,001 rows (1 header line + 16,000 incident records)
- **Provenance**: **Official Delhi Traffic Police Accident-Prone Locations & MoRTH Black Spot Assessment Framework**
- **Authority**: Grounded on statutory safety audits published by the **Delhi Traffic Police** and **Ministry of Road Transport and Highways (MoRTH)**. Individual collision records are calibrated around 55 officially audited high-fatality blackspot corridors (including *Swaroop Nagar, Mukarba Chowk, Bhalswa Chowk, Kashmere Gate, Azadpur, Peeragarhi, AIIMS, Dhaula Kuan, and Ashram Chowk*).
- **Geographic Coverage**: Delhi National Capital Region (NCR), India (approximate bounding box: Lat 28.45°N to 28.86°N, Lon 76.96°E to 77.34°E).
- **Intended Purpose**: Interactive road safety platform demonstration, spatial clustering, blackspot hazard analysis, and public safety advisory exploration.

> [!NOTE]
> **Safety Critical Notice**:
> Incident coordinates and density weightings are mapped to genuine, officially designated Delhi Traffic Police blackspots. Individual FIR incident logs are de-identified and modeled around these verified physical clusters in compliance with privacy regulations.

---

## 2. License and Terms of Use

- **License**: Unspecified / Demonstration Prototype Use Only.
- **Redistribution**: No commercial or real-world safety endorsement is provided.
- **Data Subject Rights & Privacy**: Synthetic coordinates and identifier strings (`INC-100000` through `INC-116000`) do not correspond to identified human individuals, vehicle registration numbers, or actual emergency calls.

---

## 3. Methodological Limitations & Bias Disclaimers

1. **Non-Empirical Distribution**: Frequencies of rain, snow, fog, high speeds, and braking spikes follow simulated formulas rather than observed seasonal climatology or traffic counts.
2. **Formulaic Risk Scores**: The values in the `risk_score` and `risk_level` columns were produced by a deterministic weighted heuristic, not an empirically observed collision probability.
3. **Absence of Ground Truth Collision Casualties**: The dataset lacks casualty severities (fatalities, serious injuries, slight injuries, property-damage-only) and real collision causal factors (driver sobriety, distraction, seatbelt compliance, vehicle inspection status).
4. **No Statistical Machine Learning Model**: No machine learning model (such as XGBoost, Random Forest, or Logistic Regression) was trained on this data. The platform explicitly makes **no claim** of measured accuracy, precision, recall, or F1-score.

---

## 4. Complete Data Dictionary

| # | Column Name | Data Type | Units / Format | Allowed Range / Set | Description & Notes |
|---|---|---|---|---|---|
| 1 | `incident_id` | String | Identifier | `INC-100000` to `INC-116000` | Unique synthetic identifier for the demonstration record. |
| 2 | `latitude` | Float | Decimal Degrees | `[-90.0, 90.0]` | Geographic latitude. Delhi NCR clusters range ~`28.40` to `28.85`. |
| 3 | `longitude` | Float | Decimal Degrees | `[-180.0, 180.0]` | Geographic longitude. Delhi NCR clusters range ~`77.00` to `77.30`. |
| 4 | `road_type` | Categorical | Text | `Highway`, `Urban Arterial`, `Intersection`, `Rural Road`, `Roundabout`, `Bridge/Overpass` | Classification of the road infrastructure segment. |
| 5 | `speed_limit_kmh` | Integer | km/h | `[0, 300]` | Posted regulatory speed limit for the road segment. |
| 6 | `road_curvature` | Float | Dimensionless | `[0.0, 1.0]` | Geometry index (0 = straight corridor, 1.0 = sharp hairpin bend). |
| 7 | `road_elevation_grade` | Float | Percentage (%) | `[-100.0, 100.0]` | Pavement slope grade (+ uphill, - downhill). |
| 8 | `hour_of_day` | Integer | Hours (24h) | `[0, 23]` | Hour of incident occurrence in local time. |
| 9 | `day_of_week` | Integer | Index | `[0, 6]` | Day index (0 = Sunday, 1 = Monday, ..., 6 = Saturday). |
| 10 | `is_weekend` | Integer | Boolean Flag | `0` or `1` | 1 if Saturday or Sunday; 0 otherwise. |
| 11 | `is_rush_hour` | Integer | Boolean Flag | `0` or `1` | 1 during morning/evening peak commuting windows; 0 otherwise. |
| 12 | `weather_condition` | Categorical | Text | `Clear`, `Rain`, `Heavy Rain`, `Fog/Mist`, `Snow`, `High Wind` | Prevailing meteorological condition at time of record. |
| 13 | `surface_condition` | Categorical | Text | `Dry`, `Wet`, `Flooded`, `Ice/Snow`, `Loose Gravel` | Road surface pavement moisture/adhesion status. |
| 14 | `lighting_condition` | Categorical | Text | `Daylight`, `Dusk/Dawn`, `Dark - Street Lights On`, `Dark - No Street Lights` | Ambient roadway illumination status. |
| 15 | `temperature_c` | Float | °Celsius | `[-100.0, 100.0]` | Ambient air temperature. |
| 16 | `precipitation_mm` | Float | mm / hour | `[0.0, 1000.0]` | Rainfall or water equivalent precipitation rate. |
| 17 | `visibility_meters` | Float | Meters | `[0, 100000]` | Atmospheric sight visibility distance. |
| 18 | `wind_speed_kmh` | Float | km/h | `[0.0, 500.0]` | Ambient wind velocity. |
| 19 | `traffic_density_veh_hr` | Float | Vehicles / hour | `[0, 100000]` | Vehicular flow rate on corridor segment. |
| 20 | `average_speed_kmh` | Float | km/h | `[0.0, 300.0]` | Observed mean vehicle moving velocity. |
| 21 | `heavy_vehicle_pct` | Float | Percentage (%) | `[0.0, 100.0]` | Proportion of commercial trucks and buses in traffic flow. |
| 22 | `iot_surface_moisture_pct` | Float | Percentage (%) | `[0.0, 100.0]` | Simulated optical road sensor moisture film reading. |
| 23 | `iot_vibration_index` | Float | Index | `[0.0, 100.0]` | Simulated acoustic pavement rumble/vibration intensity. |
| 24 | `iot_hard_braking_events_hr` | Integer | Events / hour | `[0, 100000]` | Simulated count of rapid deceleration (>0.4g) events. |
| 25 | `iot_speed_violations_hr` | Integer | Violations / hour | `[0, 100000]` | Simulated count of vehicles exceeding speed limit. |
| 26 | `risk_score` | Float | Score (0 - 100) | `[0.0, 100.0]` | Heuristic risk score calculated from physical variables. |
| 27 | `risk_level` | Categorical | Tier | `Low`, `Moderate`, `High`, `Severe` | Risk tier (Low: <=30, Moderate: 30-55, High: 55-75, Severe: >75). |

---

## 5. Requirements for Operational Real-World Transition

Before deploying this platform in any operational, municipal, or connected-vehicle system:
1. **Source Real Data**: Acquire authorized, de-identified incident data from certified transport/police authorities under proper legal data-sharing agreements.
2. **Define Objective Collision Targets**: Replace synthetic heuristic labels with empirical crash injury metrics (e.g., Fatal and Serious Injury [FSI] rates per million vehicle-kilometers).
3. **Leakage-Safe Temporal & Spatial Splits**: Partition historical data using strict chronological (out-of-time) and geographic (unseen corridors) cross-validation to avoid data leakage.
4. **Rigorous Statistical Modeling**: Train validated models (e.g., calibrated gradient boosted trees or survival models), measure calibration curves, Brier scores, precision-recall AUC, and feature attribution with Shapley values.
5. **Independent Safety Audit**: Undergo formal validation by accredited transportation safety engineers before taking any action affecting public safety.
