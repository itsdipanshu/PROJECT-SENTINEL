import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Home,
  Building2,
  Users,
  Navigation,
  Sparkles,
  X,
  Layers,
  Compass,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

type TileLayerMode = 'dark' | 'osm' | 'satellite';

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

  // Map Tile Style
  const [tileMode, setTileMode] = useState<TileLayerMode>('dark');

  // Selected item drawer
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Routing calculator state
  const [routeStart, setRouteStart] = useState<string>('Birpur Village (Inundated)');
  const [routeDest, setRouteDest] = useState<string>('Birpur Relief Shelter Camp');
  const [calculatedRoute, setCalculatedRoute] = useState<any | null>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups
  const incidentsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const sheltersLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const hospitalsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const teamsLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const zonesLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const routesLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const routingLineRef = useRef<L.Polyline | null>(null);

  // Default Center: North Bihar / Koshi Basin
  const defaultCenter: [number, number] = [26.35, 86.85];
  const defaultZoom = 9;

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

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Add Tile Layer
    const tileUrl = getTileUrl(tileMode);
    const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Add layer groups to map
    incidentsLayerRef.current.addTo(map);
    sheltersLayerRef.current.addTo(map);
    hospitalsLayerRef.current.addTo(map);
    teamsLayerRef.current.addTo(map);
    zonesLayerRef.current.addTo(map);
    routesLayerRef.current.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer when tileMode changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(getTileUrl(tileMode), { maxZoom: 19 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [tileMode]);

  const getTileUrl = (mode: TileLayerMode) => {
    switch (mode) {
      case 'osm':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'dark':
      default:
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
  };

  // Render & Sync Incidents Layer
  useEffect(() => {
    const layer = incidentsLayerRef.current;
    layer.clearLayers();
    if (!showIncidents) return;

    incidents.forEach((inc) => {
      if (!inc.lat || !inc.lng) return;

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-red-500 opacity-70"></span>
            <div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg shadow-red-500/60 transition-transform hover:scale-125">
              <span class="text-white font-bold text-xs">!</span>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([inc.lat, inc.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; color: #0f172a; min-width: 180px;">
          <strong style="color: #dc2626; font-size: 12px;">🚨 ${inc.name}</strong><br/>
          <span style="color: #475569;">Severity: <b>${inc.severity}</b></span><br/>
          <span style="color: #475569;">Location: ${inc.location_name}</span><br/>
          <p style="margin-top: 4px; font-size: 10px;">${inc.details}</p>
        </div>
      `);
      marker.on('click', () => {
        setSelectedEntity({ ...inc, entity_type: 'Incident' });
      });
      layer.addLayer(marker);
    });
  }, [incidents, showIncidents]);

  // Render & Sync Shelters Layer
  useEffect(() => {
    const layer = sheltersLayerRef.current;
    layer.clearLayers();
    if (!showShelters) return;

    shelters.forEach((s) => {
      if (!s.lat || !s.lng) return;

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="w-7 h-7 rounded-lg bg-blue-600 border-2 border-white flex items-center justify-center shadow-md shadow-blue-500/50 hover:scale-125 transition-transform cursor-pointer">
            <span class="text-white font-bold text-[10px]">⛺</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([s.lat, s.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; color: #0f172a; min-width: 180px;">
          <strong style="color: #2563eb; font-size: 12px;">⛺ ${s.name}</strong><br/>
          <span style="color: #475569;">Capacity: ${s.capacity} (Avail: <b>${s.available}</b>)</span><br/>
          <span style="color: #475569;">Contact: ${s.contact}</span>
        </div>
      `);
      marker.on('click', () => {
        setSelectedEntity({ ...s, entity_type: 'Shelter' });
      });
      layer.addLayer(marker);
    });
  }, [shelters, showShelters]);

  // Render & Sync Hospitals Layer
  useEffect(() => {
    const layer = hospitalsLayerRef.current;
    layer.clearLayers();
    if (!showHospitals) return;

    hospitals.forEach((h) => {
      if (!h.lat || !h.lng) return;

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="w-7 h-7 rounded-lg bg-emerald-600 border-2 border-white flex items-center justify-center shadow-md shadow-emerald-500/50 hover:scale-125 transition-transform cursor-pointer">
            <span class="text-white font-bold text-[10px]">🏥</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([h.lat, h.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; color: #0f172a; min-width: 180px;">
          <strong style="color: #059669; font-size: 12px;">🏥 ${h.name}</strong><br/>
          <span style="color: #475569;">Beds: ${h.available_beds} avail / ${h.total_beds} total</span><br/>
          <span style="color: #475569;">Ambulances: ${h.ambulances} | ${h.contact}</span>
        </div>
      `);
      marker.on('click', () => {
        setSelectedEntity({ ...h, entity_type: 'Hospital' });
      });
      layer.addLayer(marker);
    });
  }, [hospitals, showHospitals]);

  // Render & Sync Rescue Teams Layer
  useEffect(() => {
    const layer = teamsLayerRef.current;
    layer.clearLayers();
    if (!showTeams) return;

    teams.forEach((t) => {
      const lat = t.lat || 26.5;
      const lng = t.lng || 87.0;

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="w-7 h-7 rounded-lg bg-cyan-600 border-2 border-white flex items-center justify-center shadow-md shadow-cyan-500/50 hover:scale-125 transition-transform cursor-pointer">
            <span class="text-white font-bold text-[10px]">🛡️</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lng], { icon });
      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; color: #0f172a; min-width: 180px;">
          <strong style="color: #0891b2; font-size: 12px;">🛡️ ${t.name}</strong><br/>
          <span style="color: #475569;">Leader: ${t.leader} | Members: ${t.members}</span><br/>
          <span style="color: #475569;">Status: <b>${t.status}</b></span>
        </div>
      `);
      marker.on('click', () => {
        setSelectedEntity({ ...t, entity_type: 'RescueTeam' });
      });
      layer.addLayer(marker);
    });
  }, [teams, showTeams]);

  // Render Flood Inundation Polygons (Zones)
  useEffect(() => {
    const layer = zonesLayerRef.current;
    layer.clearLayers();
    if (!showZones) return;

    // If backend provided GeoJSON features, use them
    if (zones && zones.length > 0) {
      zones.forEach((zone) => {
        const geoLayer = L.geoJSON(zone, {
          style: {
            color: '#ef4444',
            weight: 2,
            fillColor: '#ef4444',
            fillOpacity: 0.25,
            dashArray: '4, 4'
          },
          onEachFeature: (feature, l) => {
            l.on('click', () => {
              setSelectedEntity({
                type: 'zone',
                name: feature.properties?.name || 'Flood Inundation Sector',
                risk_level: feature.properties?.risk_level || 'CRITICAL',
                details: feature.properties?.description || 'Active riverine flood inundation zone.'
              });
            });
          }
        });
        layer.addLayer(geoLayer);
      });
    } else {
      // Fallback synthetic polygon over Koshi Embankment Basin
      const koshiZoneCoords: [number, number][] = [
        [26.65, 86.92],
        [26.58, 87.08],
        [26.42, 87.02],
        [26.35, 86.88],
        [26.50, 86.82]
      ];
      const polygon1 = L.polygon(koshiZoneCoords, {
        color: '#ef4444',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.25,
        dashArray: '5, 5'
      });
      polygon1.on('click', () => {
        setSelectedEntity({
          type: 'zone',
          name: 'Koshi Embankment Inundation Zone A',
          risk_level: 'CRITICAL',
          details: 'Low-lying riverine plain susceptible to 3.2 lakh cusecs discharge from Koshi Barrage.'
        });
      });
      layer.addLayer(polygon1);

      // Kamla Balan Zone
      const kamlaZoneCoords: [number, number][] = [
        [26.38, 86.20],
        [26.32, 86.38],
        [26.18, 86.32],
        [26.22, 86.16]
      ];
      const polygon2 = L.polygon(kamlaZoneCoords, {
        color: '#f59e0b',
        weight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.2,
        dashArray: '4, 4'
      });
      polygon2.on('click', () => {
        setSelectedEntity({
          type: 'zone',
          name: 'Kamla-Balan Waterlogging Zone B',
          risk_level: 'HIGH',
          details: 'Severe runoff choke point causing prolonged standing water on agricultural tracts.'
        });
      });
      layer.addLayer(polygon2);
    }
  }, [zones, showZones]);

  // Render Evacuation Routes
  useEffect(() => {
    const layer = routesLayerRef.current;
    layer.clearLayers();
    if (!showRoutes) return;

    if (routes && routes.length > 0) {
      routes.forEach((route) => {
        const geoLayer = L.geoJSON(route, {
          style: {
            color: '#06b6d4',
            weight: 3,
            dashArray: '6, 6'
          }
        });
        layer.addLayer(geoLayer);
      });
    } else {
      // Default evacuation corridor connecting Birpur to Supaul
      const corridorCoords: [number, number][] = [
        [26.52, 87.01],
        [26.44, 86.92],
        [26.28, 86.74],
        [26.12, 86.60]
      ];
      const line = L.polyline(corridorCoords, {
        color: '#06b6d4',
        weight: 3,
        dashArray: '6, 6'
      });
      layer.addLayer(line);
    }
  }, [routes, showRoutes]);

  // Handle Calculated Route Display
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
          dest_lat: 26.125,
          dest_lng: 86.605,
          avoid_hazards: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalculatedRoute(data);

        if (mapInstanceRef.current && data.path_coordinates) {
          if (routingLineRef.current) {
            mapInstanceRef.current.removeLayer(routingLineRef.current);
          }
          const polyline = L.polyline(data.path_coordinates, {
            color: '#10b981',
            weight: 5,
            opacity: 0.9
          }).addTo(mapInstanceRef.current);
          routingLineRef.current = polyline;
          mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        }
      }
    } catch (err) {
      console.error('Error calculating route:', err);
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(defaultCenter, defaultZoom);
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
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
              GEOGRAPHIC GIS DISASTER COMMAND MAP
            </h2>
            <Badge variant="demo" size="sm">LIVE INTERACTIVE TILES</Badge>
          </div>
          <p className="text-xs text-slate-400">
            Real geographic map rendering North Bihar flood zones, evacuation corridors, relief camps, and hospitals.
          </p>
        </div>

        <button
          onClick={() => onNavigateToAI(
            "Please analyze the current Koshi Basin tactical map situation. Assess the flood inundation danger zones (Critical Inundation Zone A, High Risk Zone B), active emergency incidents, shelter capacities, and provide NDMA tactical recommendations for field commanders.",
            true
          )}
          className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-cyan-600/30 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Consult AI on Map Area</span>
        </button>
      </div>

      {/* Main Map Container & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left GIS Tactical Map Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-[#090d16] border border-[#1f2d42] rounded-2xl overflow-hidden shadow-2xl relative min-h-[600px] flex flex-col justify-between select-none">
          {/* Top Layer Quick Toggles Bar */}
          <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-1.5 bg-[#0d131f]/90 backdrop-blur border border-[#1f2d42] p-2 rounded-xl shadow-lg">
            <button
              onClick={() => setShowIncidents(!showIncidents)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition cursor-pointer ${
                showIncidents ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Incidents ({incidents.length})</span>
            </button>

            <button
              onClick={() => setShowZones(!showZones)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition cursor-pointer ${
                showZones ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Risk Zones ({zones.length || 2})</span>
            </button>

            <button
              onClick={() => setShowShelters(!showShelters)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition cursor-pointer ${
                showShelters ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Home className="w-3 h-3" />
              <span>Shelters ({shelters.length})</span>
            </button>

            <button
              onClick={() => setShowHospitals(!showHospitals)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition cursor-pointer ${
                showHospitals ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Hospitals ({hospitals.length})</span>
            </button>

            <button
              onClick={() => setShowTeams(!showTeams)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition cursor-pointer ${
                showTeams ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Teams ({teams.length})</span>
            </button>

            <button
              onClick={() => setShowRoutes(!showRoutes)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center space-x-1.5 transition cursor-pointer ${
                showRoutes ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Navigation className="w-3 h-3" />
              <span>Corridors</span>
            </button>
          </div>

          {/* Top-Right: Map Style Switcher & Zoom Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex items-center space-x-2">
            {/* Tile Layer Selector */}
            <div className="bg-[#0d131f]/90 backdrop-blur border border-[#1f2d42] p-1 rounded-xl shadow-lg flex items-center space-x-1 text-[11px] font-mono">
              <button
                onClick={() => setTileMode('dark')}
                className={`px-2 py-1 rounded transition ${tileMode === 'dark' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Tactical Dark Map"
              >
                Dark
              </button>
              <button
                onClick={() => setTileMode('osm')}
                className={`px-2 py-1 rounded transition ${tileMode === 'osm' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Street & City Map"
              >
                Streets
              </button>
              <button
                onClick={() => setTileMode('satellite')}
                className={`px-2 py-1 rounded transition ${tileMode === 'satellite' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Satellite Imagery"
              >
                Satellite
              </button>
            </div>

            {/* Zoom & Fit View */}
            <div className="bg-[#0d131f]/90 backdrop-blur border border-[#1f2d42] p-1 rounded-xl shadow-lg flex items-center space-x-1">
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                title="Reset Sector View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Leaflet Real Interactive Map DOM Container */}
          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[600px] flex-1 z-0 relative"
            style={{ backgroundColor: '#070b13' }}
          />

          {/* Bottom Map Legend */}
          <div className="p-3 bg-[#0d131f]/95 border-t border-[#1f2d42] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400 z-[1000]">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span>Incident Pin</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-600"></span>
                <span>Relief Shelter</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span>
                <span>Hospital</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-600"></span>
                <span>NDRF Team</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-2 rounded border border-red-500 bg-red-500/30"></span>
                <span>Flood Zone</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-cyan-400 text-[10px]">
              <Compass className="w-3 h-3" />
              <span>North Bihar Grid (26.35° N, 86.85° E)</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Entity Inspector & Routing Calculator (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Entity Inspector Drawer */}
          {selectedEntity ? (
            <div className="bg-[#111827] border border-cyan-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#1f2d42] pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {selectedEntity.type || selectedEntity.entity_type || 'Entity'}
                  </span>
                  <h3 className="text-sm font-bold font-mono text-white truncate max-w-[200px]">
                    {selectedEntity.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-300">
                {selectedEntity.category && (
                  <div>
                    <span className="text-slate-500">Category:</span> {selectedEntity.category}
                  </div>
                )}
                {selectedEntity.severity && (
                  <div>
                    <span className="text-slate-500">Severity:</span>{' '}
                    <span className="text-red-400 font-bold">{selectedEntity.severity}</span>
                  </div>
                )}
                {selectedEntity.location_name && (
                  <div>
                    <span className="text-slate-500">Location:</span> {selectedEntity.location_name}
                  </div>
                )}
                {selectedEntity.capacity && (
                  <div>
                    <span className="text-slate-500">Capacity:</span> {selectedEntity.capacity} occupants (
                    {selectedEntity.available} free)
                  </div>
                )}
                {selectedEntity.available_beds !== undefined && (
                  <div>
                    <span className="text-slate-500">Beds Available:</span>{' '}
                    <span className="text-emerald-400 font-bold">{selectedEntity.available_beds}</span> / {selectedEntity.total_beds}
                  </div>
                )}
                {selectedEntity.leader && (
                  <div>
                    <span className="text-slate-500">Commander:</span> {selectedEntity.leader} ({selectedEntity.members} members)
                  </div>
                )}
                {selectedEntity.details && (
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-[#1f2d42]">
                    {selectedEntity.details}
                  </p>
                )}
              </div>

              <button
                onClick={() =>
                  onNavigateToAI(
                    `Perform tactical analysis for mapped entity: "${selectedEntity.name}" (${selectedEntity.type || selectedEntity.entity_type || 'Disaster Entity'}). Details: ${JSON.stringify(selectedEntity)}. What are the highest priority mitigation, containment, or evacuation measures recommended according to NDMA flood protocols?`,
                    true
                  )
                }
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 transition shadow cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze Entity with Sentinel AI</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#111827] border border-[#1f2d42] rounded-2xl p-5 text-center text-slate-500 text-xs font-mono space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-600" />
              <p>Click any map marker, flood polygon, or evacuation corridor to inspect operational telemetry.</p>
            </div>
          )}

          {/* Emergency Evacuation Corridor Routing Calculator */}
          <div className="bg-[#111827] border border-[#1f2d42] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-[#1f2d42] pb-3">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold font-mono text-white tracking-wider uppercase">
                EMERGENCY EVACUATION ROUTE CALCULATOR
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Origin (Affected Incident Zone)
                </label>
                <input
                  type="text"
                  value={routeStart}
                  onChange={(e) => setRouteStart(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Destination Safe Refuge
                </label>
                <input
                  type="text"
                  value={routeDest}
                  onChange={(e) => setRouteDest(e.target.value)}
                  className="w-full bg-[#0d131f] border border-[#1f2d42] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleCalculateRoute}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium flex items-center justify-center space-x-1.5 transition shadow cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Calculate Safe Evacuation Corridor</span>
              </button>
            </div>

            {calculatedRoute && (
              <div className="p-3 bg-[#0d131f] border border-emerald-500/40 rounded-xl space-y-2 text-xs font-mono text-slate-300">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Route Status: COMPUTED</span>
                  <span>~{calculatedRoute.estimated_distance_km} km</span>
                </div>
                <p className="text-[10px] text-amber-300/80 leading-relaxed">
                  ⚠️ {calculatedRoute.disclaimer}
                </p>
                <div className="space-y-1 pt-1 border-t border-[#1f2d42]">
                  {calculatedRoute.waypoints.map((wp: any, i: number) => (
                    <div key={i} className="flex items-center space-x-2 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="truncate">{wp.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
