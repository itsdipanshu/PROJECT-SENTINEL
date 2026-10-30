import { useState, useEffect } from 'react';
import { Sidebar, type NavItem } from './components/Sidebar';
import { Header, type CurrentUser } from './components/Header';
import { AIAssistant } from './modules/AIAssistant';
import { CommandCenter } from './modules/CommandCenter';
import { RiskIntelligence } from './modules/RiskIntelligence';
import { DisasterMap } from './modules/DisasterMap';
import { OperationsHub, type OperationsTab } from './modules/OperationsHub';
import { ReportsAndRecovery, type ReportsRecoveryTab } from './modules/ReportsAndRecovery';
import { Administration } from './modules/Administration';
import { DataManagement } from './modules/DataManagement';
import { Activity } from 'lucide-react';

interface SystemHealth {
  status: string;
  system: string;
  version: string;
  database: {
    status: string;
    engine: string;
    tables_count: number;
  };
  ai_engine: {
    installed: boolean;
    running: boolean;
    version: string | null;
    active_model: string | null;
    processor: string | null;
    available_models: Array<{ name: string; id: string; size: string }>;
  };
}

export function App() {
  const [currentNav, setCurrentNav] = useState<NavItem>('command-center');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);

  // Active User session state
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    username: 'admin',
    full_name: 'Admin Commander',
    role: 'Super Administrator'
  });

  // AI Assistant auto-prompt pass-through
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);
  const [aiAutoSend, setAiAutoSend] = useState<boolean>(false);

  const handleNavigateToAI = (prompt?: string, autoSend: boolean = false) => {
    setAiInitialPrompt(prompt);
    setAiAutoSend(autoSend);
    setCurrentNav('ai-assistant');
  };

  const fetchHealth = async () => {
    try {
      const [hRes, aRes] = await Promise.all([
        fetch('http://localhost:8000/api/health'),
        fetch('http://localhost:8000/api/dashboard/alerts?limit=10')
      ]);

      if (hRes.ok) {
        const data = await hRes.json();
        setHealth(data);
        setIsBackendConnected(true);
      } else {
        setIsBackendConnected(false);
      }

      if (aRes.ok) {
        const aData = await aRes.json();
        setActiveAlertsCount(aData.length);
      }
    } catch {
      setIsBackendConnected(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (nav: NavItem): string => {
    switch (nav) {
      case 'command-center':
        return 'Command Center Dashboard';
      case 'risk-intelligence':
        return 'Disaster Risk Intelligence';
      case 'live-map':
        return 'Interactive GIS Disaster Map';
      case 'ai-assistant':
        return 'Sentinel AI Assistant (Gemma Local)';
      case 'incidents':
        return 'Emergency Incident Management';
      case 'rescue':
        return 'Rescue Teams & Operations';
      case 'resources':
        return 'Emergency Resource Inventory';
      case 'shelters':
        return 'Emergency Shelter Management';
      case 'hospitals':
        return 'Hospital & Medical Facilities';
      case 'alerts':
        return 'Emergency Alert Center';
      case 'reports':
        return 'Situation Reports & Export';
      case 'recovery':
        return 'Post-Disaster Recovery';
      case 'data-management':
        return 'Data & Dataset Center';
      case 'settings':
        return 'System & AI Settings';
      default:
        return 'Command Center';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex">
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentNav={currentNav}
        onNavigate={setCurrentNav}
        activeIncidentsCount={0}
        criticalAlertsCount={activeAlertsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Fixed Header with Alerts Bell and Account Switcher */}
        <Header
          pageTitle={getPageTitle(currentNav)}
          isBackendConnected={isBackendConnected}
          ollamaModel={health?.ai_engine.active_model || 'gemma4:e4b'}
          isOllamaRunning={Boolean(health?.ai_engine.running)}
          onRefresh={fetchHealth}
          activeAlertCount={activeAlertsCount}
          onNavigate={setCurrentNav}
          currentUser={currentUser}
          onSwitchUser={setCurrentUser}
        />

        {/* Content Container */}
        <main className="flex-1 pt-20 p-8 space-y-6">
          {/* Conditional Module Rendering */}
          {currentNav === 'ai-assistant' ? (
            <AIAssistant
              initialPrompt={aiInitialPrompt}
              autoSend={aiAutoSend}
              onClearInitialPrompt={() => {
                setAiInitialPrompt(undefined);
                setAiAutoSend(false);
              }}
            />
          ) : currentNav === 'command-center' ? (
            <CommandCenter
              onNavigateToAI={handleNavigateToAI}
              onNavigateToIncidents={() => setCurrentNav('incidents')}
              onNavigateToMap={() => setCurrentNav('live-map')}
            />
          ) : currentNav === 'risk-intelligence' ? (
            <RiskIntelligence
              onNavigateToAI={handleNavigateToAI}
            />
          ) : currentNav === 'live-map' ? (
            <DisasterMap
              onNavigateToAI={handleNavigateToAI}
            />
          ) : ['incidents', 'rescue', 'resources', 'shelters', 'hospitals', 'alerts'].includes(currentNav) ? (
            <OperationsHub
              initialTab={currentNav as OperationsTab}
              onNavigateToAI={handleNavigateToAI}
            />
          ) : ['reports', 'recovery'].includes(currentNav) ? (
            <ReportsAndRecovery
              initialTab={currentNav as ReportsRecoveryTab}
              onNavigateToAI={handleNavigateToAI}
            />
          ) : currentNav === 'settings' ? (
            <Administration
              onNavigateToAI={handleNavigateToAI}
            />
          ) : currentNav === 'data-management' ? (
            <DataManagement
              onNavigateToAI={handleNavigateToAI}
            />
          ) : (
            <div className="bg-[#111827] border border-[#1f2d42] rounded-xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-bold font-mono text-white">
                {getPageTitle(currentNav)}
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Module shell registered. Ready for progressive phase activation.
              </p>
              <button
                onClick={() => setCurrentNav('command-center')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white rounded-lg border border-slate-700 transition"
              >
                Back to Command Center
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
