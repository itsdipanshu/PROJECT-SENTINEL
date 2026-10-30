"""
Demonstration scenario for Project Sentinel:
Fictional flood-prone district in Bihar, India.
All records are explicitly tagged is_demo=True and labelled DEMO.
"""

from sqlalchemy.orm import Session
import datetime
from backend.app.models.models import (
    Incident, DisasterAssessment, RescueTeam, RescueMember,
    Resource, Shelter, Hospital, EmergencyAlert, RecoveryProject,
    ApplicationSetting
)


def load_demo_data(db: Session) -> dict:
    """Populate database with fictional Bihar flood disaster demonstration scenario."""
    # Check if demo data already loaded
    existing = db.query(Incident).filter(Incident.is_demo == True).first()
    if existing:
        return {"status": "already_loaded", "message": "Demo data is already present in the database."}

    now = datetime.datetime.utcnow()

    # 1. Incidents
    incidents = [
        Incident(
            incident_id="DEMO-INC-001",
            title="[DEMO] Koshi River Embankment Breach Alert",
            disaster_category="Flood",
            description="Rising water levels in the Koshi river basin caused partial embankment breach near Village Birpur. Inundation reported in Ward 4 & 5.",
            location_name="Birpur, Supaul District",
            latitude=26.5218,
            longitude=87.0142,
            reported_at=now - datetime.timedelta(hours=4),
            severity="Critical",
            risk_category="CRITICAL",
            reported_by="District Disaster Management Authority (Demo)",
            affected_population=4500,
            estimated_damage="Severe crop damage and 120 houses partially submerged",
            status="Response Active",
            assigned_coordinator="Inspector Rajesh Sharma",
            is_demo=True,
            notes="Requires 4 inflatable rescue boats and evacuation to Birpur High School Shelter."
        ),
        Incident(
            incident_id="DEMO-INC-002",
            title="[DEMO] Heavy Waterlogging in Low-lying Agricultural Belt",
            disaster_category="Heavy Rainfall",
            description="Continuous rainfall of 180mm recorded in 12 hours. Drainage channels choked; standing paddy crops inundated.",
            location_name="Saharghat, Madhubani",
            latitude=26.5891,
            longitude=85.8741,
            reported_at=now - datetime.timedelta(hours=8),
            severity="High",
            risk_category="HIGH",
            reported_by="Local Field Officer (Demo)",
            affected_population=2100,
            estimated_damage="Agricultural loss across 400 hectares",
            status="Confirmed",
            assigned_coordinator="Officer Anita Roy",
            is_demo=True,
            notes="Water pumps deployed for de-watering."
        ),
        Incident(
            incident_id="DEMO-INC-003",
            title="[DEMO] Riverbank Soil Erosion Threatening Bridge Pier",
            disaster_category="Flood",
            description="High velocity river current eroding eastern riverbank near NH-107 approach road.",
            location_name="Simri Bakhtiyarpur, Saharsa",
            latitude=25.8821,
            longitude=86.5812,
            reported_at=now - datetime.timedelta(hours=14),
            severity="Moderate",
            risk_category="MODERATE",
            reported_by="PWD Infrastructure Engineer (Demo)",
            affected_population=800,
            estimated_damage="Approach road edge collapsed",
            status="Under Verification",
            assigned_coordinator="Eng. Sunil Kumar",
            is_demo=True,
            notes="Sandbagging reinforcement underway."
        ),
        Incident(
            incident_id="DEMO-INC-004",
            title="[DEMO] Flash Runoff Inundation at Market Area",
            disaster_category="Heavy Rainfall",
            description="Storm runoff accumulated up to 3 feet in main commercial market. Power supply isolated as precaution.",
            location_name="Darbhanga Urban Sector 3",
            latitude=26.1542,
            longitude=85.8918,
            reported_at=now - datetime.timedelta(hours=2),
            severity="Moderate",
            risk_category="MODERATE",
            reported_by="Municipal Control Room (Demo)",
            affected_population=1200,
            estimated_damage="Commercial inventory water damage",
            status="Monitoring",
            assigned_coordinator="P. K. Verma",
            is_demo=True,
            notes="Electricity restored in Phase 1."
        )
    ]
    db.add_all(incidents)

    # 2. Disaster Assessments
    assessments = [
        DisasterAssessment(
            assessment_id="DEMO-ASM-001",
            disaster_type="Flood",
            location_name="Koshi Basin Zone A (Supaul)",
            latitude=26.52,
            longitude=87.01,
            risk_score=88.5,
            risk_category="CRITICAL",
            input_data_json='{"rainfall_24h_mm": 210, "river_level_meters": 74.2, "danger_level_meters": 71.5, "soil_saturation_pct": 92}',
            contributing_factors_json='{"river_overtop_threat": 40, "rainfall_intensity": 28, "soil_saturation": 20.5}',
            explanation="River level exceeds danger mark by 2.7m combined with 92% ground saturation.",
            suggested_precautions_json='["Immediate evacuation of zones below 70m elevation", "Deploy NDRF 9th Battalion", "Establish flood camps on high ridge"]',
            data_quality="High",
            assessment_type="Rule-Based",
            is_demo=True
        ),
        DisasterAssessment(
            assessment_id="DEMO-ASM-002",
            disaster_type="Heavy Rainfall",
            location_name="Madhubani Rural Belt",
            latitude=26.58,
            longitude=85.87,
            risk_score=72.0,
            risk_category="HIGH",
            input_data_json='{"rainfall_24h_mm": 185, "drainage_capacity_pct": 35, "soil_saturation_pct": 84}',
            contributing_factors_json='{"drainage_choke": 35, "rainfall_volume": 25, "terrain_slope": 12}',
            explanation="Low drainage outflow combined with continuous downpour.",
            suggested_precautions_json='["Clear main drainage culverts", "Distribute halogen tablets", "Keep emergency shelters prepared"]',
            data_quality="Good",
            assessment_type="Rule-Based",
            is_demo=True
        )
    ]
    db.add_all(assessments)

    # 3. Rescue Teams
    teams = [
        RescueTeam(
            team_id="DEMO-TEAM-01",
            name="[DEMO] NDRF 9th Battalion - Alpha Unit",
            team_type="NDRF",
            leader_name="Commander Arun Mishra",
            contact_number="+91-9876500101",
            member_count=35,
            equipment_summary="6 Inflatable Motorboats, 50 Life Vests, Deep Water Divers, Satellite Comms",
            base_location="Supaul District Headquarters",
            status="Deployed",
            latitude=26.512,
            longitude=87.008,
            is_demo=True
        ),
        RescueTeam(
            team_id="DEMO-TEAM-02",
            name="[DEMO] SDRF Bihar - Rapid Response Unit 2",
            team_type="SDRF",
            leader_name="Inspector R. K. Yadav",
            contact_number="+91-9876500102",
            member_count=25,
            equipment_summary="4 Flood Rescue Boats, Medical First Responders, Drone Surveillance",
            base_location="Saharsa Police Lines",
            status="Available",
            latitude=25.885,
            longitude=86.592,
            is_demo=True
        ),
        RescueTeam(
            team_id="DEMO-TEAM-03",
            name="[DEMO] Civil Defense Medical & Triage Team",
            team_type="Medical Corps",
            leader_name="Dr. S. Mukherjee",
            contact_number="+91-9876500103",
            member_count=18,
            equipment_summary="Mobile Clinic, Trauma Care Kits, Anti-venom, Water Purification Kits",
            base_location="Darbhanga Medical College Base",
            status="Available",
            latitude=26.158,
            longitude=85.899,
            is_demo=True
        )
    ]
    db.add_all(teams)

    # 4. Shelters
    shelters = [
        Shelter(
            shelter_id="DEMO-SHELTER-01",
            name="[DEMO] Birpur Senior Secondary School Relief Camp",
            location_name="Birpur, Supaul",
            latitude=26.525,
            longitude=87.018,
            total_capacity=800,
            current_occupancy=420,
            contact_person="Manoj Kumar (Principal / Camp In-charge)",
            contact_number="+91-9876500201",
            facilities_json='["Community Kitchen", "Purified Water Tanks", "Separate Women Ward", "Diesel Generator"]',
            accessibility_info="Accessible by NH-106 High Elevation Approach",
            status="Operational",
            is_demo=True
        ),
        Shelter(
            shelter_id="DEMO-SHELTER-02",
            name="[DEMO] Madhubani Community Indoor Stadium",
            location_name="Madhubani Town",
            latitude=26.358,
            longitude=86.071,
            total_capacity=1200,
            current_occupancy=350,
            contact_person="Suresh Prasad",
            contact_number="+91-9876500202",
            facilities_json='["Medical Desk", "Sanitation Blocks", "Emergency Lighting", "Food Supply Hub"]',
            accessibility_info="Open on all four city radial roads",
            status="Operational",
            is_demo=True
        )
    ]
    db.add_all(shelters)

    # 5. Hospitals
    hospitals = [
        Hospital(
            hospital_id="DEMO-HOSP-01",
            name="[DEMO] Supaul District Sadar Hospital",
            address="Court Road, Supaul, Bihar 852131",
            location_name="Supaul Sadar",
            latitude=26.124,
            longitude=86.602,
            contact_number="+91-6473-222100",
            emergency_dept_available=True,
            total_beds=150,
            available_beds=38,
            available_ambulances=6,
            medical_facilities_json='["24/7 Trauma Care", "ICU 12 Beds", "Blood Bank", "Disaster Emergency Ward"]',
            status="Operational",
            is_demo=True
        ),
        Hospital(
            hospital_id="DEMO-HOSP-02",
            name="[DEMO] Darbhanga Medical College & Hospital (DMCH)",
            address="Benta, Laheriasarai, Darbhanga, Bihar 846003",
            location_name="Darbhanga Urban",
            latitude=26.142,
            longitude=85.897,
            contact_number="+91-6272-255200",
            emergency_dept_available=True,
            total_beds=400,
            available_beds=85,
            available_ambulances=12,
            medical_facilities_json='["Super Specialty Surgical", "Advanced ICU", "Burn Care", "Helipad Access"]',
            status="Operational",
            is_demo=True
        )
    ]
    db.add_all(hospitals)

    # 6. Resources
    resources = [
        Resource(
            resource_id="DEMO-RES-01",
            name="[DEMO] Packaged Drinking Water (20L Cans)",
            category="Drinking water",
            quantity=2500,
            unit="Cans",
            storage_location="Supaul Central Relief Depot",
            available_quantity=1800,
            reserved_quantity=500,
            deployed_quantity=200,
            condition="Good",
            is_demo=True
        ),
        Resource(
            resource_id="DEMO-RES-02",
            name="[DEMO] Ready-to-Eat Emergency Food Ration Kits",
            category="Food",
            quantity=5000,
            unit="Packets",
            storage_location="Supaul Central Relief Depot",
            available_quantity=3400,
            reserved_quantity=1000,
            deployed_quantity=600,
            condition="Good",
            is_demo=True
        ),
        Resource(
            resource_id="DEMO-RES-03",
            name="[DEMO] Inflatable Rescue Boats with Outboard Motors",
            category="Rescue boats",
            quantity=16,
            unit="Boats",
            storage_location="NDRF 9th Bn Water Depot",
            available_quantity=8,
            reserved_quantity=2,
            deployed_quantity=6,
            condition="Good",
            is_demo=True
        ),
        Resource(
            resource_id="DEMO-RES-04",
            name="[DEMO] High-Capacity Water De-watering Pumps (50 HP)",
            category="Power generators",
            quantity=12,
            unit="Pumps",
            storage_location="Irrigation Dept Warehouse",
            available_quantity=5,
            reserved_quantity=2,
            deployed_quantity=5,
            condition="Good",
            is_demo=True
        ),
        Resource(
            resource_id="DEMO-RES-05",
            name="[DEMO] Essential Flood Trauma & Antivenom Medical Kits",
            category="Medicines",
            quantity=350,
            unit="Kits",
            storage_location="District Health Store",
            available_quantity=210,
            reserved_quantity=80,
            deployed_quantity=60,
            condition="Good",
            is_demo=True
        )
    ]
    db.add_all(resources)

    # 7. Emergency Alerts
    alerts = [
        EmergencyAlert(
            alert_id="DEMO-ALERT-01",
            title="[DEMO] RED ALERT: Rapid Water Influx at Birpur Barrage",
            alert_type="Flood warning",
            severity="Critical",
            message="Discharge from barrage crossed 3.2 lakh cusecs. Immediate evacuation of low-lying floodplains advised.",
            location_name="Koshi Basin - Supaul / Madhubani",
            status="Active",
            is_demo=True,
            created_at=now - datetime.timedelta(minutes=45)
        ),
        EmergencyAlert(
            alert_id="DEMO-ALERT-02",
            title="[DEMO] ORANGE ALERT: Sustained Heavy Rainfall Predicted (Next 24h)",
            alert_type="Heavy rainfall alert",
            severity="High",
            message="Meteorological radar indicates intense convective storm clouds moving towards North Bihar districts.",
            location_name="North Bihar Region",
            status="Active",
            is_demo=True,
            created_at=now - datetime.timedelta(hours=3)
        ),
        EmergencyAlert(
            alert_id="DEMO-ALERT-03",
            title="[DEMO] LOGISTICS WARNING: High Shelter Intake in Birpur Ward 5",
            alert_type="Shelter capacity warning",
            severity="Moderate",
            message="Birpur Senior Secondary School relief camp occupancy reached 52%. Recommend activating secondary camp.",
            location_name="Birpur High School Shelter",
            status="Active",
            is_demo=True,
            created_at=now - datetime.timedelta(hours=1)
        )
    ]
    db.add_all(alerts)

    # 8. Recovery Projects
    recovery = [
        RecoveryProject(
            project_id="DEMO-REC-01",
            title="[DEMO] Birpur Left Guide Bund Geo-bag Reinforcement",
            location_name="Birpur, Supaul",
            infrastructure_type="Bridges",
            estimated_cost=4500000.0,
            actual_expenditure=1200000.0,
            status="In Progress",
            progress_percent=35,
            is_demo=True
        ),
        RecoveryProject(
            project_id="DEMO-REC-02",
            title="[DEMO] Rural Feeder Road NH-107 Culvert Restoration",
            location_name="Simri Bakhtiyarpur",
            infrastructure_type="Roads",
            estimated_cost=2800000.0,
            actual_expenditure=400000.0,
            status="Planned",
            progress_percent=15,
            is_demo=True
        )
    ]
    db.add_all(recovery)

    # Update demo setting
    demo_setting = db.query(ApplicationSetting).filter(ApplicationSetting.setting_key == "demo_mode_loaded").first()
    if demo_setting:
        demo_setting.setting_value = "true"

    db.commit()
    return {
        "status": "success",
        "message": "Fictional Bihar flood demonstration scenario loaded successfully. All records tagged with [DEMO].",
        "incidents_count": len(incidents),
        "shelters_count": len(shelters),
        "teams_count": len(teams),
        "alerts_count": len(alerts)
    }


def clear_demo_data(db: Session) -> dict:
    """Safely remove all demonstration records while preserving user records."""
    db.query(Incident).filter(Incident.is_demo == True).delete()
    db.query(DisasterAssessment).filter(DisasterAssessment.is_demo == True).delete()
    db.query(RescueTeam).filter(RescueTeam.is_demo == True).delete()
    db.query(Shelter).filter(Shelter.is_demo == True).delete()
    db.query(Hospital).filter(Hospital.is_demo == True).delete()
    db.query(Resource).filter(Resource.is_demo == True).delete()
    db.query(EmergencyAlert).filter(EmergencyAlert.is_demo == True).delete()
    db.query(RecoveryProject).filter(RecoveryProject.is_demo == True).delete()

    demo_setting = db.query(ApplicationSetting).filter(ApplicationSetting.setting_key == "demo_mode_loaded").first()
    if demo_setting:
        demo_setting.setting_value = "false"

    db.commit()
    return {"status": "success", "message": "All demonstration scenario records successfully cleared."}

