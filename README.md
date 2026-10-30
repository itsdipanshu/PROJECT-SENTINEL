# PROJECT SENTINEL – DISASTER INTELLIGENCE NETWORK
> **Unified, 100% Local-First Emergency Intelligence & Disaster Operations Center**

---

## 🛡️ Executive Summary

**PROJECT SENTINEL** is a disaster intelligence and emergency response operations platform designed to operate **100% locally** on Windows workstations. Built strictly to eliminate cloud dependence, paid SaaS subscriptions, and remote API keys, Sentinel provides emergency commanders, coordinators, and field teams with mission-critical capabilities across all operational stages:

- **Before Disaster (Mitigation & Preparedness):** Multi-hazard risk assessment (Flood, Heavy Rainfall, Landslide, Storm, Heatwave, Drought), mathematical factor attribution, hazard forecasting, resource prepositioning.
- **During Disaster (Response & Rescue):** Real-time incident lifecycle triage, offline GIS spatial mapping, NDRF/SDRF team deployments, strict resource inventory allocation, shelter occupancy and hospital bed monitoring, emergency broadcast alerts.
- **After Disaster (Recovery & Reconstruction):** Infrastructure restoration tracking, budget vs. actual expenditure monitoring, automated NDMA-standard PDF/CSV Situation Reports (SITREP), and comprehensive audit trails.
- **Local AI (Sentinel AI Assistant):** Open-weight Gemma model running with **100% GPU acceleration** on the local NVIDIA RTX 3050 GPU via safe Ollama CLI subprocess pipes (zero cloud leakage, zero network latency).

---

## ⚙️ Non-Negotiable Technology Architecture

| Dimension | Specification | Verification & Implementation |
| :--- | :--- | :--- |
| **Operating System** | Windows 11 64-bit | Local native process execution |
| **Local AI Engine** | Ollama CLI (`0.40.13`) | **100% local subprocess standard input pipe** |
| **Installed Model** | `gemma4:e4b` (ID: `dc35e8d9c606`) | Offloaded to **NVIDIA RTX 3050 Laptop GPU (4 GB VRAM)** |
| **External AI APIs** | **NONE** | 0 OpenAI, 0 Gemini, 0 Claude, 0 Groq, 0 HuggingFace |
| **Database** | SQLite 3 via SQLAlchemy ORM | Local file `data/database/sentinel.db` (33 relational tables) |
| **Backend** | Python 3.14 + FastAPI + Pydantic | Localhost-only internal endpoints (`127.0.0.1:8000`) |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS | Ultra-fast responsive command-center dark UI (`127.0.0.1:5173`) |
| **GIS Mapping** | Vector schematic engine + Leaflet | 100% offline, zero third-party map tiles or paid Google APIs |
| **Document Export**| ReportLab PDF + CSV | NDMA-standard reports generated from live SQLite queries |

---

## 🚀 Quick Launch Guide

Project Sentinel includes automated batch scripts for one-click setup and launching.

### 1. Launch Sentinel
Double-click `start.bat` in the project root:
```bat
start.bat
```
This automatically:
1. Verifies that Ollama is active on your local machine.
2. Boots the Python FastAPI backend on `http://127.0.0.1:8000`.
3. Boots the Vite React frontend on `http://127.0.0.1:5173`.
4. Opens your default web browser to the Sentinel Command Center.

### 2. Stop Sentinel
Double-click `stop.bat` in the project root:
```bat
stop.bat
```
Cleanly terminates the backend and frontend background tasks on ports 8000 and 5173 without disturbing Ollama or unrelated programs.

### 3. Re-install or Reset Dependencies
```bat
setup.bat
```
Re-creates the Python virtual environment (`backend/venv`), installs pip packages, and initializes all 33 SQLite database tables.

---

## 🔑 Default Roles & Accounts

Project Sentinel comes pre-configured with local role-based access accounts:

| Username | Default Password | Role | Operational Echelon |
| :--- | :--- | :--- | :--- |
| **`admin`** | `Sentinel@2026` | **Super Administrator** | Full platform authority, user management, audit logs, and settings |
| **`coordinator`** | `Sentinel@2026` | **Emergency Coordinator** | Incident triage, rescue team mission dispatch, resource allocation |
| **`responder`** | `Sentinel@2026` | **Rescue Team Member** | Field team status updates, incident progress notes, intake reports |
| **`analyst`** | `Sentinel@2026` | **Data Analyst** | Dataset upload, hazard risk evaluations, SitRep document exports |

---

## 🖥️ Operational Modules Walkthrough

### 1. Command Center Dashboard
- **8 Primary Operational KPIs:** Live calculated counts of Total Incidents, Active Emergencies, Critical & High Risk Zones, Available vs Deployed Rescue Teams, Shelters, and Resources.
- **Dynamic Recharts Data Visualizations:** Incidents categorized by disaster classification, shelter capacity vs current occupancy.
- **Interactive Alert Panel:** Active Red and Amber high-priority emergency broadcasts.
- **Recent Incidents Feed:** Immediate 1-click **Sentinel AI Triage** button to analyze field emergencies.
- **Bihar Flood Demonstration Scenario:** 1-Click toggle to instantly load or purge realistic Koshi basin flood scenario data.

### 2. Disaster Risk Intelligence Engine
- **Multi-Hazard Quantitative Evaluation:** Evaluates 6 hazard categories: Flood, Heavy Rainfall, Landslide, Storm, Heatwave, and Drought.
- **Transparent Mathematical Scoring (0–100):** Real-time interactive preview with slider controls and dynamic contributing factor point breakdowns.
- **Classification Standards:** Low (0–35), Moderate (36–60), High (61–80), and Critical (81–100) with tailored NDMA precautions.
- **AI Explanation:** Direct shortcut connecting the calculated hazard score to Sentinel AI for detailed operational advisories.

### 3. Interactive GIS Disaster Map
- **100% Offline Tactical Schematic Engine:** Zero remote map tile dependencies or external API keys.
- **Local GeoJSON Layers:** Renders Koshi flood inundation contours, danger zones, and safe highland assembly points.
- **Layer Filters:** Toggle Incidents, Shelters, Hospitals, NDRF/SDRF Teams, and Corridors.
- **Inspector Drawer:** Click any map entity to open a real-time database inspection drawer.
- **Evacuation Route Planner:** Calculates shortest offline routing between field incident coordinates and safe emergency shelters.

### 4. Sentinel AI Assistant (Gemma Local GPU)
- **Zero Cloud Leakage:** Communicates directly with `gemma4:e4b` through safe Python CLI subprocess pipes via stdin/stdout.
- **Emergency Domain Prompts:** Pre-configured with NDMA command safety rules, casualty triage protocols, and relief distribution guidelines.
- **Session Management:** Conversations and AI message history are permanently archived in SQLite.
- **Performance Monitor:** Displays GPU token generation latency and safety disclaimers on every inference.

### 5. Emergency Incident Lifecycle Management
- **Full Operational Lifecycle:** `Reported` ➔ `Confirmed` ➔ `Response Active` ➔ `Under Control` ➔ `Resolved`.
- **Audit Timeline:** Every status advancement automatically logs an immutable timestamped event in `incident_updates`.
- **Search & Filters:** Real-time filter by disaster category, severity level, or keyword.

### 6. Search & Rescue (NDRF / SDRF) Teams
- **Team Roster:** Roster of disaster response battalions (NDRF 9th Bn, SDRF, Civil Defence, Medical Units).
- **Mission Deployments:** Deploy rescue teams to open incidents with objective logs and equipment tracking.

### 7. Centralized Emergency Resource Inventory
- **Critical Stockpiles:** Inflatable rescue boats, high-capacity dewatering pumps, ration kits, life jackets, medical trauma supplies.
- **Strict Non-Negative Enforcement:** The backend enforces database constraints ensuring resources cannot be over-allocated (HTTP 400 rejection).
- **Transaction History:** Real-time audit logging of restock, deployment, and consumption actions.

### 8. Relief Shelter & Hospital Management
- **Shelters:** Live occupancy progress bars, capacity limits, and emergency check-in intake logging.
- **Hospitals:** Real-time updates for emergency trauma beds, ICU readiness, and available ambulances.

### 9. Situation Reports (SITREP) & Document Center
- **Automated PDF & CSV Compilation:** Built with ReportLab to produce official NDMA-standard mission documents.
- **Available Reports:**
  - *Daily Situation Report (SITREP):* Active incidents, affected population estimates, shelter occupancy, hospital beds.
  - *Resource Stockpile & Logistics Audit:* Warehouse inventory status and deployed field assets.
  - *Post-Disaster Infrastructure Recovery:* Project completion rates, expenditures, and restoration forecasts.
- **Local Download Center:** 1-Click downloads stored in `data/reports/`.

### 10. Post-Disaster Recovery & Reconstruction
- **Infrastructure Tracking:** Roads, bridges, power grids, dykes, and school reconstruction works.
- **Financial Audit:** Live tracking of estimated allocated budget vs. actual expenditure.
- **Milestone Management:** Add sub-tasks and track engineering unit completion percentages.

### 11. Data Management & Offline Datasets
- **Ingestion Center:** Offline upload and validation of `.csv` and `.geojson` datasets into `data/uploads/`.
- **Preloaded Datasets:** Includes `bihar_monsoon_rainfall_2026.csv` and `kosi_river_gauge_monitoring.csv`.
- **Tabular Data Preview:** Inspect columns and sample records in a dark navy scrollable table.

### 12. Security, RBAC & Administration
- **Role-Based Access Control:** Manage users across Super Admin, Coordinator, Rescuer, Analyst, and Viewer echelons.
- **System Audit Trail:** Immutable chronological log of all administrative actions, logins, status changes, and settings edits.
- **Platform Parameters:** Configure operational posture (Normal, Advisory, Code Red, Reconstruction), local Ollama model identifier, and inference execution timeouts.

---

## 🧪 Automated Testing & Verification

Project Sentinel includes an automated backend test suite written with `pytest` and `fastapi.testclient`.

To run all 24 automated tests:
```powershell
$env:PYTHONPATH="."
.\backend\venv\Scripts\pytest backend/tests/ -v
```

### Test Suite Coverage:
- `test_ai.py` (3 tests): Health check, Ollama CLI subprocess status, conversation persistence.
- `test_auth.py` (3 tests): Login, JWT verification, user registration, role promotion, audit trail.
- `test_dashboard.py` (3 tests): KPI aggregations, Recharts chart distributions, Bihar flood demo lifecycle.
- `test_data_management.py` (3 tests): Dataset auto-sync, sample tabular preview, CSV upload and deletion.
- `test_gis.py` (4 tests): Feature coordinates, GeoJSON polygon parsing, evacuation route planning.
- `test_operations.py` (4 tests): Incident lifecycle, non-negative resource inventory validation, shelter/hospital updates, emergency alert dispatch.
- `test_reports_recovery.py` (2 tests): ReportLab PDF and CSV SitRep generation, recovery project tracking.
- `test_risk.py` (2 tests): Quantitative risk preview calculation, multi-hazard assessment persistence.

**Result:** `24 passed in 5.74s` (100% pass rate).

---

## 📁 Repository Structure

```text
PROJECT SENTINEL/
├── backend/
│   ├── app/
│   │   ├── core/           # Security (bcrypt, JWT), Config settings
│   │   ├── database/       # SQLite connection, Base, init_db.py
│   │   ├── models/         # 33 SQLAlchemy relational entities
│   │   ├── routes/         # FastAPI modular API routers
│   │   │   ├── ai.py               # Local Ollama CLI chat & incident triage
│   │   │   ├── auth.py             # User accounts, RBAC, audit logs, settings
│   │   │   ├── dashboard.py        # EOC KPIs, charts, demo scenario loader
│   │   │   ├── data_management.py  # Offline CSV/GeoJSON ingestion & preview
│   │   │   ├── gis.py              # Tactical spatial schematic & routing
│   │   │   ├── operations.py       # Incidents, teams, resources, shelters, hospitals
│   │   │   ├── recovery.py         # Infrastructure reconstruction tracking
│   │   │   ├── reports.py          # SITREP & document download endpoints
│   │   │   └── risk.py             # Multi-hazard scoring engine
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── services/       # Core business engines (risk, report generator, demo data)
│   │   └── main.py         # Application entry point & router registration
│   ├── tests/              # 8 Pytest integration suites (24 tests)
│   ├── requirements.txt    # Frozen Python dependencies
│   └── venv/               # Local Python virtual environment
├── data/
│   ├── database/           # sentinel.db (SQLite database)
│   ├── datasets/           # Preloaded rainfall and river gauge CSVs
│   ├── geojson/            # Local Koshi flood zone GeoJSON contours
│   ├── reports/            # Generated PDF and CSV SITREPs
│   └── uploads/            # Operator uploaded dataset repository
├── frontend/
│   ├── src/
│   │   ├── components/     # Header, Sidebar, StatCard, Badge
│   │   ├── modules/        # 14 Full operational application views
│   │   │   ├── AIAssistant.tsx
│   │   │   ├── Administration.tsx
│   │   │   ├── CommandCenter.tsx
│   │   │   ├── DataManagement.tsx
│   │   │   ├── DisasterMap.tsx
│   │   │   ├── OperationsHub.tsx
│   │   │   ├── ReportsAndRecovery.tsx
│   │   │   └── RiskIntelligence.tsx
│   │   ├── App.tsx         # Central layout & routing
│   │   └── index.css       # Tailwind CSS styling
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Vite bundler configuration
├── scripts/
│   ├── setup.bat           # Environment installer & DB seeder
│   ├── start.bat           # Command-center launcher
│   └── stop.bat            # Process cleanup script
├── DEVELOPMENT_PROGRESS.md # Master Phase-by-Phase tracking log
├── setup.bat               # Root setup shortcut
├── start.bat               # Root start shortcut
├── stop.bat                # Root stop shortcut
└── README.md               # Complete Project Sentinel Manual
```

---

## 🔒 Confidentiality & Local Operation Notice

Project Sentinel operates completely in **offline-isolated local mode**. No telemetry, chat prompts, or emergency incident records are ever transmitted to third-party servers. All AI inference is conducted exclusively using your local open-weight model on your local GPU.
