import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Home,
  Building2,
  Users,
  Navigation,
  Sparkles,
  X,
} from 'lucide-react';
import { Badge } from '../components/Badge';

interface MapIncident {
  id: number;
  type: string;
  name: string;
  category: string;
  severity: string;
  status: string;
  location_name: string;
  lat: number;
  lng: number;
  details: string;
  is_demo: boolean;
}

interface MapShelter {
  id: number;
  type: string;
  name: string;
  location_name: string;
  lat: number;
  lng: number;
  capacity: number;
  occupancy: number;
  available: number;
  contact: string;
  status: string;
  is_demo: boolean;
}

interface MapHospital {
  id: number;
  type: string;
  name: string;
  address: string;
  location_name: string;
  lat: number;
  lng: number;
  total_beds: number;
  available_beds: number;
  ambulances: number;
  contact: string;
  status: string;
  is_demo: boolean;
}

interface MapRescueTeam {
  id: number;
  type: string;
  name: string;
  team_type: string;
  leader: string;
  contact: string;
  members: number;
  status: string;
  base: string;
  lat: number;
  lng: number;
  equipment: string;
  is_demo: boolean;
}

interface DisasterMapProps {
  onNavigateToAI: (prompt?: string, autoSend?: boolean) => void;
}

export const DisasterMap: React.FC<DisasterMapProps> = ({ onNavigateToAI }) => {
  const [incidents, setIncidents] = useState<MapIncident[]>([]);
  const [shelters, setShelters] = useState<MapShelter[]>([]);
  const [hospitals, setHospitals] = useState<MapHospital[]>([]);
  const [teams, setTeams] = useState<MapRescueTeam[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  // Layer toggles
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showTeams, setShowTeams] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);

  // Selected item drawer
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Routing calculator state
  const [routeStart, setRouteStart] = useState<string>('Birpur Village (Inundated)');
  const [routeDest, setRouteDest] = useState<string>('Birpur Relief Shelter Camp');
  const [calculatedRoute, setCalculatedRoute] = useState<any | null>(null);
  const [routingActive, setRoutingActive] = useState<boolean>(false);

  const fetchGisData = async () => {
    try {
      const [featRes, zonesRes, routesRes] = await Promise.all([
        fetch('http://localhost:8000/api/gis/features'),
        fetch('http://localhost:8000/api/gis/zones'),
        fetch('http://localhost:8000/api/gis/routes'),
      ]);

      if (featRes.ok) {
        const data = await featRes.json();
        setIncidents(data.incidents || []);
        setShelters(data.shelters || []);
        setHospitals(data.hospitals || []);
        setTeams(data.rescue_teams || []);
      }
      if (zonesRes.ok) {
        const zData = await zonesRes.json();
        setZones(zData.features || []);
      }
      if (routesRes.ok) {
        const rData = await routesRes.json();
        setRoutes(rData.features || []);
      }
    } catch (err) {
      console.error('Failed to load GIS data:', err);
    }
  };

  useEffect(() => {
    fetchGisData();
  }, []);

  const handleCalculateRoute = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/gis/route-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_point_name: routeStart,
          destination_name: routeDest,
          start_lat: 26.5218,
          start_lng: 87.0142,
          dest_lat: 26.525,
          dest_lng: 87.018,
          avoid_hazards: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalculatedRoute(data);
        setRoutingActive(true);
      }
    } catch (err) {
      console.error('Error calculating route:', err);
    }
  };

  // Coordinate projections for the schematic GIS grid canvas
  // Bounds covering North Bihar (Lat: 25.7 to 26.8, Lng: 85.5 to 87.3)
  const minLat = 25.7, maxLat = 26.8;
  const minLng = 85.5, maxLng = 87.3;

  const projectToPercent = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    return {
      x: Math.min(95, Math.max(5, x)),
      y: Math.min(95, Math.max(5, y)),
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111827] border border-[#1f2d42] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <MapPin className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold font-mono text-white tracking-wider uppercase">
              INTERACTIVE GIS DISASTER MAP & SPATIAL COMMAND
            </h2>
            <Badge variant="demo" size="sm">OFFLINE TACTICAL SCHEMATIC</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Local GeoJSON polygons and spatial entities rendered 100% offline without external third-party tile APIs.
            Coordinate markers synchronized with SQLite database records.
          </p>
        </div>

        <button
          onClick={() => onNavigateToAI(
            "Please analyze the current Koshi Basin tactical map situation. Assess the flood inundation danger zones (Critical Inundation Zone A, High Risk Zone B), active emergency incidents, shelter capacities, and provide NDMA tactical recommendations for field commanders.",
            true
          )}
          className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-cyan-600/30"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Consult AI on Map Area</span>
        </button>
      </div>

      {/* Main Map Container & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left GIS Tactical Map Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-[#090d16] border border-[#1f2d42] rounded-2xl overflow-hidden shadow-2xl relative min-h-[580px] flex flex-col justify-between select-none">
          {/* Top Layer Quick Toggles Bar */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-1.5 bg-[#0d131f]/90 backdrop-blur border border-[#1f2d42] p-2 rounded-xl shadow-lg">
            <button
              onClick={() => setShowIncidents(!showIncidents)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition ${
                showIncidents ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Incidents ({incidents.length})</span>
            </button>

            <button
              onClick={() => setShowZones(!showZones)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition ${
                showZones ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Risk Zones ({zones.length})</span>
            </button>

            <button
              onClick={() => setShowShelters(!showShelters)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition ${
                showShelters ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Home className="w-3 h-3" />
              <span>Shelters ({shelters.length})</span>
            </button>

            <button
              onClick={() => setShowHospitals(!showHospitals)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition ${
                showHospitals ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Hospitals ({hospitals.length})</span>
            </button>

            <button
              onClick={() => setShowTeams(!showTeams)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition ${
                showTeams ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Teams ({teams.length})</span>
            </button>

            <button
              onClick={() => setShowRoutes(!showRoutes)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition ${
                showRoutes ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Navigation className="w-3 h-3" />
              <span>Corridors ({routes.length})</span>
            </button>
          </div>

          {/* Coordinate Watermark & Offline Status Indicator */}
          <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-[#0d131f]/90 backdrop-blur border border-[#1f2d42] px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>NORTH BIHAR GRID (26.5° N, 86.8° E)</span>
          </div>

          {/* Schematic Vector Map Area */}
          <div className="w-full h-full relative overflow-hidden flex-1 min-h-[580px]">
            {/* Background Tactical Grid Pattern */}
            <svg className="w-full h-full absolute inset-0 opacity-20 pointer-events-none">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2d42" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Schematic Koshi River Basin Waterway */}
              <path
                d="M 120 0 Q 300 200 450 320 T 700 580"
                fill="none"
                stroke="#0284c7"
                strokeWidth="14"
                strokeOpacity="0.35"
              />
              <path
                d="M 280 0 Q 380 240 500 580"
                fill="none"
                stroke="#0369a1"
                strokeWidth="8"
                strokeOpacity="0.25"
              />
            </svg>

            {/* Evacuation Corridors Paths Overlay */}
            {showRoutes && (
              <svg className="w-full h-full absolute inset-0 pointer-events-none z-10">
                {/* Simulated Path Line across Birpur Corridor */}
                <line
                  x1="82%"
                  y1="22%"
                  x2="85%"
                  y2="20%"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
                <line
                  x1="82%"
                  y1="22%"
                  x2="52%"
                  y2="68%"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeDasharray="4,4"
                />
                {routingActive && (
                  <line
                    x1="82%"
                    y1="22%"
                    x2="85%"
                    y2="20%"
                    stroke="#10b981"
                    strokeWidth="5"
                    strokeOpacity="0.8"
                  />
                )}
              </svg>
            )}

            {/* Risk Zones GeoJSON Simulated Polygons */}
            {showZones && (
              <>
                {/* Zone 1: Koshi River Embankment High Inundation */}
                <div
                  className="absolute rounded-3xl border-2 border-red-500/60 bg-red-500/15 backdrop-blur-xs flex items-center justify-center cursor-pointer transition hover:bg-red-500/25 z-0"
                  style={{ top: '15%', left: '72%', width: '180px', height: '140px' }}
                  onClick={() =>
                    setSelectedEntity({
                      type: 'zone',
                      name: 'Koshi Embankment Inundation Zone A',
                      risk_level: 'CRITICAL',
                      details: 'Low-lying riverine plain susceptible to 3.2 lakh cusecs flow.',
                    })
                  }
                >
                  <span className="text-[10px] font-mono font-bold text-red-300 uppercase tracking-wider bg-red-950/80 px-2 py-0.5 rounded border border-red-500/40">
                    CRITICAL FLOOD ZONE
                  </span>
                </div>

                {/* Zone 2: Madhubani Waterlogging Zone */}
                <div
                  className="absolute rounded-3xl border-2 border-amber-500/50 bg-amber-500/10 backdrop-blur-xs flex items-center justify-center cursor-pointer transition hover:bg-amber-500/20 z-0"
                  style={{ top: '24%', left: '20%', width: '160px', height: '120px' }}
                  onClick={() =>
                    setSelectedEntity({
                      type: 'zone',
                      name: 'Kamla-Balan Waterlogging Zone B',
                      risk_level: 'HIGH',
                      details: 'Severe runoff choke; standing agricultural inundation.',
                    })
                  }
                >
                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                    HIGH RISK ZONE B
                  </span>
                </div>
              </>
            )}

            {/* Entity Markers Pin Layer */}
            {/* 1. Incidents */}
            {showIncidents &&
              incidents.map((inc) => {
                const pos = projectToPercent(inc.lat, inc.lng);
                return (
                  <div
                    key={`inc-${inc.id}`}
                    onClick={() => setSelectedEntity({ ...inc, entity_type: 'Incident' })}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group z-20"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-red-400 opacity-75"></span>
                      <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg shadow-red-500/50 group-hover:scale-125 transition">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#0d131f] border border-red-500/40 text-[10px] font-mono text-white rounded whitespace-nowrap shadow-xl pointer-events-none transition">
                      {inc.name}
                    </div>
                  </div>
                );
              })}

            {/* 2. Shelters */}
            {showShelters &&
              shelters.map((s) => {
                const pos = projectToPercent(s.lat, s.lng);
                return (
                  <div
                    key={`shelter-${s.id}`}
                    onClick={() => setSelectedEntity({ ...s, entity_type: 'Shelter' })}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group z-20"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-125 transition">
                      <Home className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#0d131f] border border-blue-500/40 text-[10px] font-mono text-white rounded whitespace-nowrap shadow-xl pointer-events-none transition">
                      {s.name} ({s.available} spaces)
                    </div>
                  </div>
                );
              })}

            {/* 3. Hospitals */}
            {showHospitals &&
              hospitals.map((h) => {
                const pos = projectToPercent(h.lat, h.lng);
                return (
                  <div
                    key={`hosp-${h.id}`}
                    onClick={() => setSelectedEntity({ ...h, entity_type: 'Hospital' })}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group z-20"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 border-2 border-white flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover:scale-125 transition">
                      <Building2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#0d131f] border border-emerald-500/40 text-[10px] font-mono text-white rounded whitespace-nowrap shadow-xl pointer-events-none transition">
                      {h.name} ({h.available_beds} beds)
                    </div>
                  </div>
                );
              })}

            {/* 4. Rescue Teams */}
            {showTeams &&
              teams.map((t) => {
                const pos = projectToPercent(t.lat || 26.5, t.lng || 87.0);
                return (
                  <div
                    key={`team-${t.id}`}
                    onClick={() => setSelectedEntity({ ...t, entity_type: 'RescueTeam' })}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group z-20"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-cyan-600 border-2 border-white flex items-center justify-center shadow-lg shadow-cyan-500/40 group-hover:scale-125 transition">
                      <Users className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#0d131f] border border-cyan-500/40 text-[10px] font-mono text-white rounded whitespace-nowrap shadow-xl pointer-events-none transition">
                      {t.name} ({t.status})
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Bottom Map Legend */}
          <div className="p-3 bg-[#0d131f]/95 border-t border-[#1f2d42] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400 z-20">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span>Active Incident</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
                <span>Relief Shelter</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span>
                <span>Hospital</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-600"></span>
                <span>NDRF Base</span>
              </span>
            </div>
            <div className="text-cyan-400 text-[10px]">
              Offline SVG Spatial Engine
            </div>
          </div>
        </div>

        {/* Right Sidebar: Entity Inspector & Routing Calculator (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Entity Details Drawer */}
          {selectedEntity ? (
            <div className="bg-[#111827] border border-cyan-500/40 rounded-xl p-5 shadow-xl relative space-y-3">
              <button
                onClick={() => setSelectedEntity(null)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2">
                <Badge variant="info" size="sm">
                  {selectedEntity.entity_type || selectedEntity.type}
                </Badge>
                {selectedEntity.is_demo && (
                  <Badge variant="demo" size="sm">DEMO RECORD</Badge>
                )}
              </div>

              <h3 className="text-sm font-bold font-mono text-white">
                {selectedEntity.name}
              </h3>

              <div className="space-y-2 text-xs font-mono text-slate-300">
                {selectedEntity.location_name && (
                  <div>📍 Location: <span className="text-white">{selectedEntity.location_name}</span></div>
                )}
                {selectedEntity.severity && (
                  <div>⚠️ Severity: <span className="text-red-400 font-bold">{selectedEntity.severity}</span></div>
                )}
                {selectedEntity.status && (
                  <div>🔄 Operational Status: <span className="text-cyan-400">{selectedEntity.status}</span></div>
                )}
                {selectedEntity.capacity && (
                  <div>🏠 Capacity: <span className="text-white">{selectedEntity.occupancy} / {selectedEntity.capacity} occupants</span></div>
                )}
                {selectedEntity.available_beds !== undefined && (
                  <div>🏥 Bed Availability: <span className="text-emerald-400 font-bold">{selectedEntity.available_beds} beds free</span></div>
                )}
                {selectedEntity.equipment && (
                  <div>🎒 Equipment: <span className="text-slate-300">{selectedEntity.equipment}</span></div>
                )}
              </div>

              <div className="pt-3 border-t border-[#1f2d42]">
                <button
                  onClick={() => onNavigateToAI(
                    `Perform immediate disaster intelligence analysis for this entity:\n- Type: ${selectedEntity.entity_type || selectedEntity.type || 'Entity'}\n- Name: ${selectedEntity.name}\n- Location: ${selectedEntity.location_name || 'Koshi Sector'}\n- Status/Severity: ${selectedEntity.severity || selectedEntity.status || 'Active'}\n- Details: ${selectedEntity.details || selectedEntity.equipment || selectedEntity.contact || 'No additional details'}\n\nWhat are the critical risks, casualty prevention protocols, and recommended emergency response actions according to NDMA guidelines?`,
                    true
                  )}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Entity with Sentinel AI</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 shadow-lg text-center space-y-2">
              <MapPin className="w-8 h-8 text-cyan-500/50 mx-auto" />
              <div className="text-xs font-mono font-bold text-white uppercase">Entity Inspector</div>
              <p className="text-[11px] text-slate-400">
                Click any marker or risk zone on the map to inspect its real-time SQLite record.
              </p>
            </div>
          )}

          {/* Emergency Evacuation Routing Calculator */}
          <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-[#1f2d42]">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                Evacuation Route Planner
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Origin Point</label>
                <input
                  type="text"
                  value={routeStart}
                  onChange={(e) => setRouteStart(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Safe Destination Refuge</label>
                <input
                  type="text"
                  value={routeDest}
                  onChange={(e) => setRouteDest(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleCalculateRoute}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-semibold transition flex items-center justify-center space-x-2"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Calculate Safe Evacuation Route</span>
              </button>
            </div>

            {calculatedRoute && (
              <div className="p-3 bg-[#0d131f] border border-emerald-500/30 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-emerald-400 font-bold">Suggested Path Ready</span>
                  <span className="text-slate-400">~{calculatedRoute.estimated_distance_km} km</span>
                </div>
                <p className="text-[11px] text-amber-300 font-sans italic">
                  ⚠️ {calculatedRoute.disclaimer}
                </p>
                <div className="text-[11px] font-mono text-slate-400">
                  Via: Elevated Guide Bund Bypass (Elevation ~74m)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
