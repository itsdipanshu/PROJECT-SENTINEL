"""
Sentinel Disaster Risk Intelligence Engine:
Transparent, rule-based multi-hazard scoring engine.
Supports Flood, Heavy Rainfall, Landslide, Storm, Heatwave, and Drought.
"""

from typing import Dict, Any, List, Tuple


def get_risk_category(score: float) -> str:
    """Classify risk score into standard disaster operations levels."""
    if score >= 85.0:
        return "CRITICAL"
    elif score >= 70.0:
        return "VERY HIGH"
    elif score >= 50.0:
        return "HIGH"
    elif score >= 25.0:
        return "MODERATE"
    return "LOW"


def evaluate_flood_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transparent rule-based flood risk evaluation based on hydrological parameters.
    Weights:
    - River water level vs danger level: 35%
    - 24h Rainfall: 25%
    - Soil Saturation: 15%
    - Distance to river: 15%
    - Drainage & Elevation: 10%
    """
    rainfall_24h = float(data.get("rainfall_24h_mm", 0))
    river_level = float(data.get("river_level_m", 0))
    danger_level = float(data.get("danger_level_m", 0))
    soil_saturation = float(data.get("soil_saturation_pct", 50))
    distance_river_km = float(data.get("distance_to_river_km", 5))
    drainage = str(data.get("drainage_condition", "Fair")).lower()

    factors = {}
    score = 0.0

    # 1. River Level Factor (0-35 points)
    if danger_level > 0:
        excess = river_level - danger_level
        if excess >= 2.0:
            river_pts = 35.0
        elif excess >= 0.0:
            river_pts = 25.0 + (excess / 2.0) * 10.0
        elif excess >= -1.0:
            river_pts = 15.0
        else:
            river_pts = max(0.0, 10.0 + excess * 5.0)
    else:
        river_pts = 10.0
    factors["River Level Relative to Danger Mark"] = round(river_pts, 1)
    score += river_pts

    # 2. Rainfall Factor (0-25 points)
    if rainfall_24h >= 200:
        rain_pts = 25.0
    elif rainfall_24h >= 100:
        rain_pts = 18.0 + ((rainfall_24h - 100) / 100) * 7.0
    elif rainfall_24h >= 50:
        rain_pts = 10.0 + ((rainfall_24h - 50) / 50) * 8.0
    else:
        rain_pts = (rainfall_24h / 50) * 10.0
    factors["24-Hour Precipitation Volume"] = round(rain_pts, 1)
    score += rain_pts

    # 3. Soil Saturation Factor (0-15 points)
    soil_pts = (min(100.0, max(0.0, soil_saturation)) / 100.0) * 15.0
    factors["Soil Infiltration & Saturation"] = round(soil_pts, 1)
    score += soil_pts

    # 4. Proximity to River (0-15 points)
    if distance_river_km <= 1.0:
        dist_pts = 15.0
    elif distance_river_km <= 3.0:
        dist_pts = 10.0
    elif distance_river_km <= 7.0:
        dist_pts = 5.0
    else:
        dist_pts = 1.0
    factors["Proximity to Active Waterway"] = round(dist_pts, 1)
    score += dist_pts

    # 5. Drainage Condition (0-10 points)
    if "poor" in drainage or "choked" in drainage:
        drain_pts = 10.0
    elif "fair" in drainage or "moderate" in drainage:
        drain_pts = 5.0
    else:
        drain_pts = 1.0
    factors["Local Drainage Outflow Capacity"] = round(drain_pts, 1)
    score += drain_pts

    total_score = min(100.0, round(score, 1))
    category = get_risk_category(total_score)

    precautions = []
    if total_score >= 85:
        precautions = [
            "Issue immediate mandatory evacuation for settlements within 2km of riverbank.",
            "Deploy NDRF water rescue teams and staging motorboats at high ground.",
            "Activate emergency relief shelters and stock 48 hours of clean drinking water.",
            "De-energize electrical transformers in submerged low-lying sectors."
        ]
    elif total_score >= 50:
        precautions = [
            "Place emergency rescue teams on 30-minute alert standby.",
            "Begin preemptive clearing of major drainage canals and sluice gates.",
            "Alert hospital emergency departments and prepare anti-venom/water-purification stock.",
            "Advise residents in single-story homes to identify secondary high-elevation refuge."
        ]
    else:
        precautions = [
            "Maintain routine hydrological surveillance on river discharge gauges.",
            "Inspect embankments and bunds for minor seepage.",
            "Broadcast standard monsoon preparedness bulletins to local panchayats."
        ]

    explanation = (
        f"Calculated flood risk score is {total_score}/100 ({category}). "
        f"The primary risk contributors are {max(factors, key=factors.get)} ({factors[max(factors, key=factors.get)]} pts) "
        f"and {sorted(factors.items(), key=lambda x: x[1], reverse=True)[1][0]} ({sorted(factors.items(), key=lambda x: x[1], reverse=True)[1][1]} pts)."
    )

    return {
        "disaster_type": "Flood",
        "risk_score": total_score,
        "risk_category": category,
        "contributing_factors": factors,
        "explanation": explanation,
        "suggested_precautions": precautions,
        "data_quality": "High" if danger_level > 0 and rainfall_24h > 0 else "Preliminary"
    }


def evaluate_heavy_rainfall_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """Heavy Rainfall Assessment based on IMD intensity standards."""
    intensity_mm_hr = float(data.get("rainfall_intensity_mm_hr", 0))
    total_rainfall_mm = float(data.get("total_rainfall_mm", 0))
    duration_hrs = float(data.get("duration_hours", 1))
    saturation_pct = float(data.get("ground_saturation_pct", 50))

    score = 0.0
    factors = {}

    # Intensity (0-40)
    if intensity_mm_hr >= 50:  # Cloudburst / torrential
        int_pts = 40.0
    elif intensity_mm_hr >= 25:
        int_pts = 28.0
    elif intensity_mm_hr >= 15:
        int_pts = 18.0
    else:
        int_pts = (intensity_mm_hr / 15.0) * 10.0
    factors["Rainfall Intensity Rate"] = round(int_pts, 1)
    score += int_pts

    # Total Rainfall (0-35)
    if total_rainfall_mm >= 250:
        tot_pts = 35.0
    elif total_rainfall_mm >= 120:
        tot_pts = 25.0
    elif total_rainfall_mm >= 60:
        tot_pts = 15.0
    else:
        tot_pts = (total_rainfall_mm / 60.0) * 10.0
    factors["Cumulative Rainfall Volume"] = round(tot_pts, 1)
    score += tot_pts

    # Ground Saturation (0-25)
    sat_pts = (min(100.0, max(0.0, saturation_pct)) / 100.0) * 25.0
    factors["Pre-existing Ground Saturation"] = round(sat_pts, 1)
    score += sat_pts

    total_score = min(100.0, round(score, 1))
    category = get_risk_category(total_score)

    precautions = [
        "Issue localized urban flash flood and waterlogging alerts.",
        "Keep municipal suction and de-watering pumps on immediate standby.",
        "Clear trash grates on drainage culverts to prevent sudden backing up."
    ]

    return {
        "disaster_type": "Heavy Rainfall",
        "risk_score": total_score,
        "risk_category": category,
        "contributing_factors": factors,
        "explanation": f"Heavy rainfall intensity calculated at {intensity_mm_hr} mm/hr with cumulative precipitation of {total_rainfall_mm} mm.",
        "suggested_precautions": precautions,
        "data_quality": "Good"
    }


def evaluate_landslide_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """Landslide Risk Assessment based on slope, soil type, and triggering precipitation."""
    slope_deg = float(data.get("slope_degrees", 20))
    soil_type = str(data.get("soil_type", "Clay")).lower()
    rainfall_mm = float(data.get("rainfall_48h_mm", 50))
    vegetation = str(data.get("vegetation_cover", "Sparse")).lower()

    score = 0.0
    factors = {}

    # Slope Factor (0-35)
    if slope_deg >= 45:
        slope_pts = 35.0
    elif slope_deg >= 30:
        slope_pts = 25.0
    elif slope_deg >= 15:
        slope_pts = 15.0
    else:
        slope_pts = 5.0
    factors["Terrain Gradient & Slope Steepness"] = slope_pts
    score += slope_pts

    # Triggering Rainfall (0-35)
    if rainfall_mm >= 150:
        rain_pts = 35.0
    elif rainfall_mm >= 80:
        rain_pts = 22.0
    else:
        rain_pts = (rainfall_mm / 80.0) * 12.0
    factors["Triggering Precipitation (48h)"] = round(rain_pts, 1)
    score += rain_pts

    # Soil stability (0-20)
    if "loose" in soil_type or "debris" in soil_type:
        soil_pts = 20.0
    elif "clay" in soil_type:
        soil_pts = 14.0
    else:
        soil_pts = 5.0
    factors["Soil Shear Strength & Composition"] = soil_pts
    score += soil_pts

    # Vegetation Cover (0-10)
    if "barren" in vegetation or "deforested" in vegetation:
        veg_pts = 10.0
    elif "sparse" in vegetation:
        veg_pts = 6.0
    else:
        veg_pts = 2.0
    factors["Root Reinforcement & Land Cover"] = veg_pts
    score += veg_pts

    total_score = min(100.0, round(score, 1))
    category = get_risk_category(total_score)

    precautions = [
        "Restrict vehicular movement along vulnerable ghat roads and mountain passes.",
        "Evacuate settlements situated directly below active talus and escarpment slopes.",
        "Position earth-moving machinery (JCBs, bulldozers) at highway choke points."
    ]

    return {
        "disaster_type": "Landslide",
        "risk_score": total_score,
        "risk_category": category,
        "contributing_factors": factors,
        "explanation": f"Slope steepness ({slope_deg}°) combined with {rainfall_mm}mm triggering rain creates {category} slope instability.",
        "suggested_precautions": precautions,
        "data_quality": "High"
    }


def evaluate_storm_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """Storm & Cyclone Wind Hazard Assessment."""
    wind_kmh = float(data.get("wind_speed_kmh", 30))
    pressure_hpa = float(data.get("pressure_hpa", 1008))
    rainfall_mm = float(data.get("rainfall_mm", 20))

    score = 0.0
    factors = {}

    # Wind Speed (0-50)
    if wind_kmh >= 120:
        wind_pts = 50.0
    elif wind_kmh >= 80:
        wind_pts = 35.0
    elif wind_kmh >= 50:
        wind_pts = 20.0
    else:
        wind_pts = (wind_kmh / 50.0) * 10.0
    factors["Sustained Wind Velocity"] = round(wind_pts, 1)
    score += wind_pts

    # Pressure Drop (0-30)
    if pressure_hpa <= 970:
        press_pts = 30.0
    elif pressure_hpa <= 990:
        press_pts = 20.0
    elif pressure_hpa <= 1000:
        press_pts = 10.0
    else:
        press_pts = 2.0
    factors["Barometric Pressure Depression"] = press_pts
    score += press_pts

    # Associated Rainfall (0-20)
    rain_pts = min(20.0, (rainfall_mm / 100.0) * 20.0)
    factors["Associated Storm Rainfall"] = round(rain_pts, 1)
    score += rain_pts

    total_score = min(100.0, round(score, 1))
    category = get_risk_category(total_score)

    precautions = [
        "Secure loose tin roofing, construction hoardings, and temporary shelters.",
        "Advise fishermen and watercraft to remain docked in harbor.",
        "Prune tree branches in contact with overhead power lines."
    ]

    return {
        "disaster_type": "Storm",
        "risk_score": total_score,
        "risk_category": category,
        "contributing_factors": factors,
        "explanation": f"Sustained wind speeds of {wind_kmh} km/h with central pressure at {pressure_hpa} hPa.",
        "suggested_precautions": precautions,
        "data_quality": "Good"
    }


def evaluate_heatwave_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """Heatwave Severity Assessment based on IMD threshold."""
    temp_c = float(data.get("temperature_celsius", 35))
    consecutive_days = int(data.get("duration_days", 1))
    humidity_pct = float(data.get("humidity_pct", 40))

    score = 0.0
    factors = {}

    # Temperature (0-55)
    if temp_c >= 47:
        temp_pts = 55.0
    elif temp_c >= 44:
        temp_pts = 42.0
    elif temp_c >= 40:
        temp_pts = 28.0
    else:
        temp_pts = max(0.0, (temp_c - 30) * 2.5)
    factors["Peak Ambient Temperature"] = round(temp_pts, 1)
    score += temp_pts

    # Duration (0-25)
    dur_pts = min(25.0, consecutive_days * 5.0)
    factors["Prolonged Heat Wave Duration"] = dur_pts
    score += dur_pts

    # Heat Index / Humidity (0-20)
    hum_pts = (min(100.0, humidity_pct) / 100.0) * 20.0 if temp_c >= 38 else 5.0
    factors["Humidity & Thermal Heat Index"] = round(hum_pts, 1)
    score += hum_pts

    total_score = min(100.0, round(score, 1))
    category = get_risk_category(total_score)

    precautions = [
        "Set up shaded oral rehydration salt (ORS) kiosks at transit hubs.",
        "Adjust municipal working and school hours to avoid peak 12:00-15:00 sun.",
        "Designate air-conditioned or misted public cooling centers for vulnerable citizens."
    ]

    return {
        "disaster_type": "Heatwave",
        "risk_score": total_score,
        "risk_category": category,
        "contributing_factors": factors,
        "explanation": f"Ambient temperature of {temp_c}°C lasting {consecutive_days} consecutive days with {humidity_pct}% humidity.",
        "suggested_precautions": precautions,
        "data_quality": "High"
    }


def evaluate_drought_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """Drought Severity Assessment based on precipitation deficit and soil moisture."""
    deficit_pct = float(data.get("rainfall_deficit_pct", 20))
    soil_moisture_pct = float(data.get("soil_moisture_pct", 40))
    water_storage_pct = float(data.get("reservoir_storage_pct", 50))

    score = 0.0
    factors = {}

    # Deficit (0-45)
    def_pts = (min(100.0, max(0.0, deficit_pct)) / 100.0) * 45.0
    factors["Seasonal Rainfall Deficit"] = round(def_pts, 1)
    score += def_pts

    # Soil Moisture Loss (0-30)
    moist_deficit = max(0.0, 100.0 - soil_moisture_pct)
    moist_pts = (moist_deficit / 100.0) * 30.0
    factors["Root-Zone Soil Moisture Depletion"] = round(moist_pts, 1)
    score += moist_pts

    # Reservoir Depletion (0-25)
    res_deficit = max(0.0, 100.0 - water_storage_pct)
    res_pts = (res_deficit / 100.0) * 25.0
    factors["Surface Reservoir Depletion"] = round(res_pts, 1)
    score += res_pts

    total_score = min(100.0, round(score, 1))
    category = get_risk_category(total_score)

    precautions = [
        "Implement agricultural water rationing and promote micro-irrigation.",
        "Deploy mobile drinking water tankers to moisture-stressed villages.",
        "Enforce groundwater extraction caps on industrial consumers."
    ]

    return {
        "disaster_type": "Drought",
        "risk_score": total_score,
        "risk_category": category,
        "contributing_factors": factors,
        "explanation": f"Rainfall deficit of {deficit_pct}% with reservoir storage down to {water_storage_pct}%.",
        "suggested_precautions": precautions,
        "data_quality": "Good"
    }


def evaluate_disaster_risk(disaster_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Unified entrypoint for multi-hazard risk assessment."""
    dt = disaster_type.strip().lower()
    if "flood" in dt:
        return evaluate_flood_risk(data)
    elif "rain" in dt:
        return evaluate_heavy_rainfall_risk(data)
    elif "landslide" in dt:
        return evaluate_landslide_risk(data)
    elif "storm" in dt or "cyclone" in dt or "wind" in dt:
        return evaluate_storm_risk(data)
    elif "heat" in dt:
        return evaluate_heatwave_risk(data)
    elif "drought" in dt:
        return evaluate_drought_risk(data)
    else:
        # Default fallback
        return evaluate_flood_risk(data)

