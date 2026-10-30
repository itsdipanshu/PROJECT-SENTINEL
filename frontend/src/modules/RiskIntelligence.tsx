import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Droplets,
  CloudRain,
  Mountain,
  Wind,
  Sun,
  Flame,
  CheckCircle2,
  Sparkles,
  Save,
  RotateCcw,
  Layers,
  ChevronRight,
  Calendar,
  Trash2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '../components/Badge';

interface RiskResult {
  disaster_type: string;
  risk_score: number;
  risk_category: string;
  contributing_factors: Record<string, number>;
  explanation: string;
  suggested_precautions: string[];
  data_quality: string;
}

interface HistoricalAssessment {
  id: number;
  assessment_id: string;
  disaster_type: string;
  location_name: string;
  risk_score: number;
  risk_category: string;
  data_quality: string;
  assessment_type: string;
  created_at: string;
  is_demo: boolean;
  explanation: string;
  suggested_precautions: string[];
  contributing_factors: Record<string, number>;
}

interface RiskIntelligenceProps {
  onNavigateToAI: (prompt?: string, autoSend?: boolean) => void;
}

export const RiskIntelligence: React.FC<RiskIntelligenceProps> = ({ onNavigateToAI }) => {
  const [selectedDisaster, setSelectedDisaster] = useState<string>('Flood');
  const [locationName, setLocationName] = useState<string>('Koshi Basin Sector 4');
  const [latitude, setLatitude] = useState<string>('26.5218');
  const [longitude, setLongitude] = useState<string>('87.0142');

  // Form parameter states
  const [floodParams, setFloodParams] = useState({
    rainfall_24h_mm: 160,
    river_level_m: 72.8,
    danger_level_m: 71.0,
    soil_saturation_pct: 85,
    distance_to_river_km: 1.5,
    drainage_condition: 'Poor',
  });

  const [rainParams, setRainParams] = useState({
    rainfall_intensity_mm_hr: 35,
    total_rainfall_mm: 140,
    duration_hours: 6,
    ground_saturation_pct: 80,
  });

  const [landslideParams, setLandslideParams] = useState({
    slope_degrees: 38,
    soil_type: 'Clay',
    rainfall_48h_mm: 110,
    vegetation_cover: 'Sparse',
  });

  const [stormParams, setStormParams] = useState({
    wind_speed_kmh: 75,
    pressure_hpa: 988,
    rainfall_mm: 85,
  });

  const [heatwaveParams, setHeatwaveParams] = useState({
    temperature_celsius: 43.5,
    duration_days: 4,
    humidity_pct: 45,
  });

  const [droughtParams, setDroughtParams] = useState({
    rainfall_deficit_pct: 60,
    soil_moisture_pct: 25,
    reservoir_storage_pct: 30,
  });

  const [previewResult, setPreviewResult] = useState<RiskResult | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoricalAssessment[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoricalAssessment | null>(null);

  const disasterTabs = [
    { id: 'Flood', label: 'Flood Risk', icon: Droplets },
    { id: 'Heavy Rainfall', label: 'Heavy Rainfall', icon: CloudRain },
    { id: 'Landslide', label: 'Landslide', icon: Mountain },
    { id: 'Storm', label: 'Storm & Cyclone', icon: Wind },
    { id: 'Heatwave', label: 'Heatwave', icon: Sun },
    { id: 'Drought', label: 'Drought', icon: Flame },
  ];

  const getCurrentParams = () => {
    switch (selectedDisaster) {
      case 'Flood':
        return floodParams;
      case 'Heavy Rainfall':
        return rainParams;
      case 'Landslide':
        return landslideParams;
      case 'Storm':
        return stormParams;
      case 'Heatwave':
        return heatwaveParams;
      case 'Drought':
        return droughtParams;
      default:
        return floodParams;
    }
  };

  const calculatePreview = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/risk/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disaster_type: selectedDisaster,
          location_name: locationName,
          parameters: getCurrentParams(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewResult(data);
      }
    } catch (err) {
      console.error('Failed to preview risk score:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/risk/assessments');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to load historical assessments:', err);
    }
  };

  useEffect(() => {
    calculatePreview();
  }, [
    selectedDisaster,
    locationName,
    floodParams,
    rainParams,
    landslideParams,
    stormParams,
    heatwaveParams,
    droughtParams,
  ]);

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSaveAssessment = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:8000/api/risk/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disaster_type: selectedDisaster,
          location_name: locationName,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          parameters: getCurrentParams(),
          assessed_by: 'Senior Disaster Analyst',
          is_demo: false,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await loadHistory();
      }
    } catch (err) {
      console.error('Error saving assessment:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHistory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/api/risk/assessments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory(history.filter((h) => h.id !== id));
        if (selectedHistoryItem?.id === id) {
          setSelectedHistoryItem(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete assessment:', err);
    }
  };

  const chartData = previewResult?.contributing_factors
    ? Object.entries(previewResult.contributing_factors).map(([name, score]) => ({
        name: name.length > 20 ? name.slice(0, 18) + '...' : name,
        full_name: name,
        points: score,
      }))
    : [];

  const getCategoryBadgeVariant = (cat?: string) => {
    switch (cat) {
      case 'CRITICAL':
        return 'critical';
      case 'VERY HIGH':
      case 'HIGH':
        return 'warning';
      case 'MODERATE':
        return 'info';
      case 'LOW':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#111827] border border-[#1f2d42] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold font-mono text-white tracking-wide">
              MULTI-HAZARD RISK INTELLIGENCE ENGINE
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Transparent, configurable rule-based risk evaluation based on meteorological and hydrological observations.
            Supports 6 disaster categories with mathematical factor attribution and actionable safety protocols.
          </p>
        </div>

        <button
          onClick={() => onNavigateToAI(
            `Explain the current ${selectedDisaster} disaster risk assessment. Calculated Risk Score: ${previewResult ? previewResult.risk_score : 'Elevated'}/100 (${previewResult ? previewResult.risk_category : 'Active Alert'}). What are the primary contributing factors, community safety guidelines, and SDRF prepositioning advisories under NDMA standards?`,
            true
          )}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-semibold flex items-center space-x-2 transition shadow-lg shadow-cyan-600/30"
        >
          <Sparkles className="w-4 h-4" />
          <span>Explain with Sentinel AI</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Disaster Categories Tab Bar */}
      <div className="flex flex-wrap gap-2">
        {disasterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedDisaster === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedDisaster(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-mono font-semibold transition ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                  : 'bg-[#111827] text-slate-400 hover:text-white hover:bg-slate-800 border border-[#1f2d42]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Form on Left, Live Assessment Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#111827] border border-[#1f2d42] rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2d42]">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-cyan-400 flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>{selectedDisaster} Assessment Parameters</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Auto-evaluates in real-time</span>
          </div>

          {/* Location inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Target Location</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Dynamic Inputs Based on Category */}
          {selectedDisaster === 'Flood' && (
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">24h Rainfall: {floodParams.rainfall_24h_mm} mm</span>
                  <span className="text-cyan-400 font-bold">{floodParams.rainfall_24h_mm >= 150 ? 'Severe' : floodParams.rainfall_24h_mm >= 70 ? 'Moderate' : 'Low'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="350"
                  value={floodParams.rainfall_24h_mm}
                  onChange={(e) => setFloodParams({ ...floodParams, rainfall_24h_mm: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">River Level (meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={floodParams.river_level_m}
                    onChange={(e) => setFloodParams({ ...floodParams, river_level_m: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Danger Mark (meters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={floodParams.danger_level_m}
                    onChange={(e) => setFloodParams({ ...floodParams, danger_level_m: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">Soil Saturation (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={floodParams.soil_saturation_pct}
                    onChange={(e) => setFloodParams({ ...floodParams, soil_saturation_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">Distance to River (km)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={floodParams.distance_to_river_km}
                    onChange={(e) => setFloodParams({ ...floodParams, distance_to_river_km: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">Drainage Condition</label>
                  <select
                    value={floodParams.drainage_condition}
                    onChange={(e) => setFloodParams({ ...floodParams, drainage_condition: e.target.value })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  >
                    <option value="Good">Good (Unblocked)</option>
                    <option value="Fair">Fair (Minor obstruction)</option>
                    <option value="Poor">Poor (Choked/Damaged)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedDisaster === 'Heavy Rainfall' && (
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Rainfall Intensity: {rainParams.rainfall_intensity_mm_hr} mm/hr</span>
                  <span className="text-cyan-400 font-bold">{rainParams.rainfall_intensity_mm_hr >= 50 ? 'Torrential' : rainParams.rainfall_intensity_mm_hr >= 25 ? 'Heavy' : 'Moderate'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rainParams.rainfall_intensity_mm_hr}
                  onChange={(e) => setRainParams({ ...rainParams, rainfall_intensity_mm_hr: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Cumulative Rainfall (mm)</label>
                  <input
                    type="number"
                    value={rainParams.total_rainfall_mm}
                    onChange={(e) => setRainParams({ ...rainParams, total_rainfall_mm: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    value={rainParams.duration_hours}
                    onChange={(e) => setRainParams({ ...rainParams, duration_hours: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedDisaster === 'Landslide' && (
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Slope Gradient: {landslideParams.slope_degrees}°</span>
                  <span className="text-amber-400 font-bold">{landslideParams.slope_degrees >= 35 ? 'High Steepness' : 'Moderate'}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={landslideParams.slope_degrees}
                  onChange={(e) => setLandslideParams({ ...landslideParams, slope_degrees: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">Soil Type</label>
                  <select
                    value={landslideParams.soil_type}
                    onChange={(e) => setLandslideParams({ ...landslideParams, soil_type: e.target.value })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  >
                    <option value="Loose Debris">Loose Debris</option>
                    <option value="Clay">Saturated Clay</option>
                    <option value="Hard Rock">Hard Bedrock</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">48h Rain (mm)</label>
                  <input
                    type="number"
                    value={landslideParams.rainfall_48h_mm}
                    onChange={(e) => setLandslideParams({ ...landslideParams, rainfall_48h_mm: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-300 block mb-1">Vegetation Cover</label>
                  <select
                    value={landslideParams.vegetation_cover}
                    onChange={(e) => setLandslideParams({ ...landslideParams, vegetation_cover: e.target.value })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  >
                    <option value="Barren">Barren / Deforested</option>
                    <option value="Sparse">Sparse Shrub</option>
                    <option value="Dense">Dense Forest</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedDisaster === 'Storm' && (
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Wind Velocity: {stormParams.wind_speed_kmh} km/h</span>
                  <span className="text-cyan-400 font-bold">{stormParams.wind_speed_kmh >= 90 ? 'Gale Force' : 'High Wind'}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="180"
                  value={stormParams.wind_speed_kmh}
                  onChange={(e) => setStormParams({ ...stormParams, wind_speed_kmh: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Barometric Pressure (hPa)</label>
                  <input
                    type="number"
                    value={stormParams.pressure_hpa}
                    onChange={(e) => setStormParams({ ...stormParams, pressure_hpa: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Storm Rain (mm)</label>
                  <input
                    type="number"
                    value={stormParams.rainfall_mm}
                    onChange={(e) => setStormParams({ ...stormParams, rainfall_mm: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedDisaster === 'Heatwave' && (
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Ambient Temp: {heatwaveParams.temperature_celsius}°C</span>
                  <span className="text-red-400 font-bold">{heatwaveParams.temperature_celsius >= 44 ? 'Severe Heatwave' : 'Warm'}</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="52"
                  step="0.5"
                  value={heatwaveParams.temperature_celsius}
                  onChange={(e) => setHeatwaveParams({ ...heatwaveParams, temperature_celsius: parseFloat(e.target.value) })}
                  className="w-full accent-red-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Duration (Consecutive Days)</label>
                  <input
                    type="number"
                    value={heatwaveParams.duration_days}
                    onChange={(e) => setHeatwaveParams({ ...heatwaveParams, duration_days: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Relative Humidity (%)</label>
                  <input
                    type="number"
                    value={heatwaveParams.humidity_pct}
                    onChange={(e) => setHeatwaveParams({ ...heatwaveParams, humidity_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedDisaster === 'Drought' && (
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Rainfall Deficit: {droughtParams.rainfall_deficit_pct}%</span>
                  <span className="text-amber-400 font-bold">{droughtParams.rainfall_deficit_pct >= 50 ? 'Severe Deficit' : 'Moderate'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={droughtParams.rainfall_deficit_pct}
                  onChange={(e) => setDroughtParams({ ...droughtParams, rainfall_deficit_pct: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Soil Moisture Remaining (%)</label>
                  <input
                    type="number"
                    value={droughtParams.soil_moisture_pct}
                    onChange={(e) => setDroughtParams({ ...droughtParams, soil_moisture_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Reservoir Storage (%)</label>
                  <input
                    type="number"
                    value={droughtParams.reservoir_storage_pct}
                    onChange={(e) => setDroughtParams({ ...droughtParams, reservoir_storage_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#1f2d42] flex items-center justify-between">
            <button
              onClick={calculatePreview}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-medium transition flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Recalculate</span>
            </button>

            <button
              onClick={handleSaveAssessment}
              disabled={saving}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-semibold transition flex items-center space-x-2 shadow-lg shadow-cyan-600/20"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Assessment Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Assessment to SQLite'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Calculated Risk Score & Factors (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Risk Gauge Card */}
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Calculated Risk Score
              </span>
              <Badge variant={getCategoryBadgeVariant(previewResult?.risk_category)} size="md">
                {previewResult?.risk_category || 'CALCULATING'}
              </Badge>
            </div>

            <div className="flex items-baseline space-x-3">
              <div className="text-5xl font-mono font-bold text-white tracking-tight">
                {previewResult?.risk_score ?? '--'}
              </div>
              <div className="text-slate-400 font-mono text-sm">/ 100</div>
            </div>

            {/* Explanation rationale */}
            <div className="p-3 bg-[#0d131f] border border-[#1f2d42] rounded-lg text-xs text-slate-300 leading-relaxed font-sans">
              {previewResult?.explanation || 'Adjust parameters on the left to evaluate risk.'}
            </div>

            {/* Factor breakdown chart */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Factor Point Contribution Breakdown
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 45]} />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={120} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d131f', borderColor: '#1f2d42', color: '#fff' }}
                    />
                    <Bar dataKey="points" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Points" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Suggested precautions */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Standard Precautions Checklist
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {previewResult?.suggested_precautions.map((p, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Assessments Records Table */}
      <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2d42]">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
              Historical Disaster Risk Records ({history.length})
            </h3>
          </div>
          <Badge variant="info" size="sm">SQLite Audited</Badge>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1f2d42] text-slate-400">
                <th className="py-2.5 px-3">Assessment ID</th>
                <th className="py-2.5 px-3">Disaster Type</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Quality</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No risk assessment records logged. Submit an assessment above.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedHistoryItem(item)}
                    className="border-b border-slate-800/60 hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-3 font-bold text-cyan-300">{item.assessment_id}</td>
                    <td className="py-3 px-3 text-slate-200">{item.disaster_type}</td>
                    <td className="py-3 px-3 text-white">{item.location_name}</td>
                    <td className="py-3 px-3 font-bold text-white">{item.risk_score}</td>
                    <td className="py-3 px-3">
                      <Badge variant={getCategoryBadgeVariant(item.risk_category)} size="sm">
                        {item.risk_category}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{item.data_quality}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className="p-1 text-slate-400 hover:text-red-400 transition"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Historical Assessment Detail Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1f2d42] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2d42]">
              <div>
                <h4 className="text-sm font-bold font-mono text-white">
                  {selectedHistoryItem.assessment_id} – {selectedHistoryItem.disaster_type}
                </h4>
                <p className="text-xs text-slate-400 font-mono">📍 {selectedHistoryItem.location_name}</p>
              </div>
              <Badge variant={getCategoryBadgeVariant(selectedHistoryItem.risk_category)} size="md">
                {selectedHistoryItem.risk_category} ({selectedHistoryItem.risk_score}/100)
              </Badge>
            </div>

            <div className="space-y-3 text-xs font-sans text-slate-300">
              <p className="leading-relaxed">{selectedHistoryItem.explanation}</p>
              <div>
                <div className="font-mono text-slate-400 text-[11px] uppercase mb-1">Precautions:</div>
                <ul className="space-y-1 list-disc list-inside">
                  {selectedHistoryItem.suggested_precautions.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1f2d42] flex justify-between items-center">
              <button
                onClick={() => onNavigateToAI(
                  `Explain this historical disaster assessment: Assessment ID ${selectedHistoryItem.assessment_id} for ${selectedHistoryItem.disaster_type} in ${selectedHistoryItem.location_name} (Risk Score: ${selectedHistoryItem.risk_score}/100, Level: ${selectedHistoryItem.risk_category}). What are the key lessons learned and preventive civil defence measures?`,
                  true
                )}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain in Sentinel AI Chat</span>
              </button>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
