import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Cpu,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Badge } from '../components/Badge';

interface Message {
  id: number;
  conversation_id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_name: string;
  execution_time_seconds: number;
  created_at: string;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface AIAssistantProps {
  initialPrompt?: string;
  autoSend?: boolean;
  onClearInitialPrompt?: () => void;
  onGenerationChange?: (generating: boolean, seconds: number, title?: string) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  initialPrompt,
  autoSend,
  onClearInitialPrompt,
  onGenerationChange,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationSeconds, setGenerationSeconds] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Sync generation status to parent App & Header
  useEffect(() => {
    const currentConv = conversations.find((c) => c.id === activeConvId);
    onGenerationChange?.(isGenerating, generationSeconds, currentConv?.title || 'Tactical Query');
  }, [isGenerating, generationSeconds, activeConvId, conversations]);

  // Live progress timer while model computes
  useEffect(() => {
    let interval: any = null;
    if (isGenerating) {
      setGenerationSeconds(0);
      const start = Date.now();
      interval = setInterval(() => {
        setGenerationSeconds(Math.round((Date.now() - start) / 100) / 10);
      }, 100);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  // Background polling while generating: ensures UI updates the moment SQLite saves assistant response
  useEffect(() => {
    if (!isGenerating || !activeConvId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/ai/conversations/${activeConvId}`);
        if (res.ok) {
          const data = await res.json();
          const msgs: Message[] = data.messages || [];
          if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.role === 'assistant') {
              setMessages(msgs);
              setIsGenerating(false);
              loadConversations();
            }
          }
        }
      } catch (err) {
        console.error('Polling conversation update error:', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [isGenerating, activeConvId]);
  const [selectedModel, setSelectedModel] = useState<string>('gemma4:e4b');
  const [availableModels, setAvailableModels] = useState<string[]>(['gemma4:e4b']);
  const [aiStatus, setAiStatus] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  // Load conversations and AI status on mount
  useEffect(() => {
    loadAiStatus();
    loadConversations();
  }, []);

  // Handle incoming prompts from other modules (Map, CommandCenter, Risk, etc.)
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      if (autoSend) {
        handleSendMessage(initialPrompt);
      } else {
        setInputPrompt(initialPrompt);
      }
      onClearInitialPrompt?.();
    }
  }, [initialPrompt]);

  const loadAiStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/ai/status');
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data);
        if (data.active_model) {
          setSelectedModel(data.active_model);
        }
        if (data.available_models && data.available_models.length > 0) {
          setAvailableModels(data.available_models.map((m: any) => m.name));
        }
      }
    } catch (e) {
      console.error('Failed to load AI status:', e);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/ai/conversations');
      if (res.ok) {
        const data: Conversation[] = await res.json();
        setConversations(data);
        if (data.length > 0 && activeConvId === null && !isGenerating) {
          selectConversation(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  };

  const selectConversation = async (id: number) => {
    setActiveConvId(id);
    try {
      const res = await fetch(`http://localhost:8000/api/ai/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error('Failed to load conversation details:', e);
    }
  };

  const startNewConversation = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/ai/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Disaster Consultation' }),
      });
      if (res.ok) {
        const newConv: Conversation = await res.json();
        setConversations([newConv, ...conversations]);
        setActiveConvId(newConv.id);
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to create new conversation:', e);
    }
  };

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/api/ai/conversations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = conversations.filter((c) => c.id !== id);
        setConversations(remaining);
        if (activeConvId === id) {
          if (remaining.length > 0) {
            selectConversation(remaining[0].id);
          } else {
            setActiveConvId(null);
            setMessages([]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || isGenerating) return;

    setInputPrompt('');
    setIsGenerating(true);

    // If no active conversation, create one immediately so UI and backend are synced upfront
    let targetConvId = activeConvId;
    if (!targetConvId) {
      try {
        const createRes = await fetch('http://localhost:8000/api/ai/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: promptToSend.length > 35 ? promptToSend.slice(0, 35) + '...' : promptToSend
          })
        });
        if (createRes.ok) {
          const newConv: Conversation = await createRes.json();
          targetConvId = newConv.id;
          setActiveConvId(newConv.id);
          setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
        }
      } catch (err) {
        console.error('Failed to create conversation upfront:', err);
      }
    }

    // Optimistically add user message to UI
    const tempUserMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: promptToSend,
      model_name: selectedModel,
      execution_time_seconds: 0.0,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: targetConvId,
          prompt: promptToSend,
          model_name: selectedModel,
        }),
      });

      if (res.ok) {
        const assistantMsg: Message = await res.json();
        // Check if message is already added by polling
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === assistantMsg.id);
          if (exists) return prev;
          return [...prev, assistantMsg];
        });
        if (assistantMsg.conversation_id && assistantMsg.conversation_id !== activeConvId) {
          setActiveConvId(assistantMsg.conversation_id);
        }
        loadConversations();
      } else {
        const errorMsg: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: '⚠️ Unable to connect to local Ollama CLI. Ensure Ollama service is running on your machine.',
          model_name: selectedModel,
          execution_time_seconds: 0.0,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (e) {
      console.error('Chat error:', e);
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ Network error communicating with local FastAPI backend on localhost:8000.',
        model_name: selectedModel,
        execution_time_seconds: 0.0,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    {
      label: 'Flood Risk Assessment',
      prompt: 'What are the top 5 primary indicators for assessing immediate flood risk in rural river basin communities?',
    },
    {
      label: 'Search & Rescue Triage',
      prompt: 'Suggest search and rescue (NDRF/SDRF) prioritization guidelines when multiple low-lying villages are submerged.',
    },
    {
      label: 'Shelter Intake Protocols',
      prompt: 'What are standard public health and safety protocols for managing emergency flood shelters during peak capacity?',
    },
    {
      label: 'Emergency Resource Rationing',
      prompt: 'How should clean drinking water and emergency medical rations be allocated during the first 24 hours of a disaster?',
    },
  ];

  return (
    <div className="flex h-[calc(100vh-6.5rem)] bg-[#0d131f] border border-[#1f2d42] rounded-xl overflow-hidden shadow-2xl">
      {/* Left Sidebar: Conversations & Local Model Selector */}
      <div className="w-72 bg-[#090d16] border-r border-[#1f2d42] flex flex-col justify-between">
        <div className="p-4 border-b border-[#1f2d42]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              AI Sessions
            </span>
            <button
              onClick={startNewConversation}
              className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 rounded text-xs font-mono font-medium flex items-center space-x-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Model Selector */}
          <div className="bg-[#111827] border border-[#1f2d42] rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Active Model</span>
              </span>
              <span className="text-emerald-400 font-bold">100% GPU</span>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-[#0d131f] border border-[#1f2d42] text-xs font-mono text-cyan-300 rounded px-2 py-1 outline-none focus:border-cyan-500"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m === 'qwen2.5:0.5b'
                    ? '⚡ qwen2.5:0.5b (Ultra Fast ~4s)'
                    : m === 'gemma4:e4b'
                    ? '🛡️ gemma4:e4b (Deep Analysis)'
                    : m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center p-6 text-xs text-slate-500 font-mono">
              No previous AI consultations. Click "New" to start.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg text-xs font-medium cursor-pointer transition ${activeConvId === conv.id
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Bot className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                  title="Delete consultation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Hardware Status Banner */}
        <div className="p-3 border-t border-[#1f2d42] bg-[#070a12] text-[11px] font-mono text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Ollama CLI: {aiStatus?.version || 'Active'}</span>
            </span>
            <Badge variant="demo" size="sm">LOCAL ONLY</Badge>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-[#0b0f19]">
        {/* Top Chat Header */}
        <div className="px-6 py-3.5 border-b border-[#1f2d42] bg-[#0d131f]/70 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
                Sentinel AI Emergency Assistant
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Running locally via Ollama CLI • Zero third-party cloud communication
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1.5 text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">
              <AlertCircle className="w-3 h-3" />
              <span>Decision Support Only</span>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4 py-8">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold font-mono text-white">
                  Sentinel Local AI Ready
                </h4>
                <p className="text-xs text-slate-400">
                  Ask tactical questions regarding disaster risk analysis, emergency shelter allocations, rescue triage priorities, or disaster dataset interpretation.
                </p>
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-4">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-3 bg-[#111827] hover:bg-slate-800 border border-[#1f2d42] hover:border-cyan-500/40 rounded-xl text-left transition group shadow-md"
                  >
                    <div className="text-xs font-mono font-semibold text-cyan-400 group-hover:text-cyan-300">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {item.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
              >
                <div
                  className={`max-w-3xl rounded-2xl p-4 shadow-lg text-xs leading-relaxed ${msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none ml-12'
                      : 'bg-[#111827] text-slate-200 border border-[#1f2d42] rounded-bl-none mr-12'
                    }`}
                >
                  {/* Assistant Header Info */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1f2d42] text-[10px] font-mono text-slate-400">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-cyan-400">SENTINEL AI</span>
                        <span>•</span>
                        <span>{msg.model_name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {msg.execution_time_seconds > 0 && (
                          <span className="flex items-center space-x-1 text-slate-400">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>{msg.execution_time_seconds}s</span>
                          </span>
                        )}
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="hover:text-cyan-300 transition flex items-center space-x-1"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap font-sans space-y-1">
                    {msg.content}
                  </div>
                </div>

                <div className="text-[9px] font-mono text-slate-500 mt-1 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}

          {/* Thinking / Generating Live Progress Bar */}
          {isGenerating && (
            <div className="flex flex-col space-y-2.5 p-4 bg-[#111827]/90 border border-cyan-500/40 rounded-2xl max-w-lg shadow-xl shadow-cyan-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 text-xs font-mono font-bold text-cyan-300">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>
                    {generationSeconds < 2
                      ? '⚡ Ingesting telemetry & parameters...'
                      : generationSeconds < 6
                      ? '🔍 Applying NDMA disaster rules on GPU...'
                      : '📝 Synthesizing operational dispatch recommendations...'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono text-[11px] font-bold">
                  ⏱️ {generationSeconds.toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-[#1f2d42]">
                <span>Engine: NVIDIA RTX 3050 (100% VRAM)</span>
                <span className="text-emerald-400 font-semibold">● Offline GPU Acceleration</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-[#1f2d42] bg-[#090d16]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-3"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Sentinel AI about emergency response, flood factors, shelter strategy..."
              disabled={isGenerating}
              className="flex-1 bg-[#111827] border border-[#1f2d42] text-xs font-mono text-white placeholder-slate-500 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isGenerating}
              className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-mono font-semibold flex items-center space-x-2 transition shadow-lg shadow-cyan-600/20"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send</span>
            </button>
          </form>

          <div className="mt-2 text-[10px] text-center text-slate-500 font-mono">
            Sentinel AI runs 100% locally via Ollama subprocess CLI. No data is sent over the Internet.
          </div>
        </div>
      </div>
    </div>
  );
};
