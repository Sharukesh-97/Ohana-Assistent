import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  ExternalLink, 
  Cpu, 
  CheckCircle, 
  AlertCircle, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  Globe, 
  RefreshCw, 
  ArrowRight,
  Monitor,
  Play,
  Volume2,
  Maximize
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LogItem {
  id: string;
  text: string;
  type: "info" | "success" | "error" | "action";
}

interface BrowserAgentProps {
  url: string;
  onClose: () => void;
  onActionComplete?: (result: any) => void;
  actionTrigger?: {
    type: string;
    args: any;
    id: string;
    callback: (res: any) => void;
  } | null;
}

export const BrowserAgent: React.FC<BrowserAgentProps> = ({
  url: initialUrl,
  onClose,
  actionTrigger
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [browserActive, setBrowserActive] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>("None");
  const [localLogs, setLocalLogs] = useState<LogItem[]>([]);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [manualCheck, setManualCheck] = useState<boolean>(false);

  // Ping Local Playwright Server status on a swift timer
  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/status", {
          mode: "cors"
        });
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setIsConnected(true);
            setBrowserActive(data.browserActive);
            setCurrentUrl(data.currentUrl);
            if (data.logs && Array.isArray(data.logs)) {
              setLocalLogs(data.logs);
            }
          }
        } else {
          throw new Error("Local agent server returned unhealthy status");
        }
      } catch (err) {
        if (active) {
          setIsConnected(false);
          setBrowserActive(false);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [manualCheck]);

  // Capture incoming voice model Actions and forward them to the Real Local Playwright Agent
  useEffect(() => {
    if (!actionTrigger) return;

    const executeRealAction = async () => {
      const { type, args, callback } = actionTrigger;

      // Ensure local server is running
      if (!isConnected) {
        console.warn("[BrowserAgent] Playwright Agent is current disconnected, unable to run:", type);
        callback({ 
          error: "The Local Playwright Agent is currently disconnected. Please run 'node local-agent.js' on your computer to automate real web pages." 
        });
        return;
      }

      try {
        console.log(`[BrowserAgent] Forwarding action to Local Agent: ${type}`, args);
        const res = await fetch("http://localhost:3001/api/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
          body: JSON.stringify({ type, args })
        });

        if (res.ok) {
          const resultData = await res.json();
          callback(resultData);
          // Trigger instant status pull to refresh logs and URL
          setManualCheck(prev => !prev);
        } else {
          const errData = await res.json().catch(() => ({}));
          callback({ error: errData.error || "Failed to execute Playwright instruction." });
        }
      } catch (err: any) {
        callback({ error: `Connection failed: ${err.message || err}` });
      }
    };

    executeRealAction();
  }, [actionTrigger, isConnected]);

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(identifier);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const setupCommands = `npm install playwright express cors
npx playwright install chromium`;

  const runCommand = `node local-agent.js`;

  return (
    <div
      id="myraa-playwright-automation-hud"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in text-left"
    >
      <div className="relative w-full max-w-4xl h-[85vh] flex flex-col rounded-3xl border border-white/10 bg-slate-900/85 shadow-[0_0_90px_rgba(139,92,246,0.3)] overflow-hidden">
        
        {/* Holographic glowing grids */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />

        {/* TOP STATUS BAR */}
        <div className="relative z-10 px-6 py-4 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="text-purple-400 animate-pulse" size={20} />
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Myraa Playwright Controller</h2>
              <p className="text-[10px] text-slate-500 font-mono">Autonomous Real Browser Automation Bridge</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-slate-950/60 font-mono text-xs">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-rose-500"}`} />
              <span className={isConnected ? "text-emerald-400 font-semibold" : "text-rose-400"}>
                {isConnected ? "AGENT ACTIVE (PORT: 3001)" : "DISCONNECTED"}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 px-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition font-sans text-xs cursor-pointer flex items-center gap-1"
            >
              <X size={14} /> Dismiss HUD
            </button>
          </div>
        </div>

        {/* BOTTOM BODY SECTION */}
        <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* PANEL A: Connected Dashboard OR Setup Checklist */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-white/5 space-y-6">
            {!isConnected ? (
              // DISCONNECTED SETUP GUIDE
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 space-y-1.5">
                  <h3 className="text-xs font-mono uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-indigo-400" /> Sandboxed Cloud Environment Notice
                  </h3>
                  <p className="text-[11px] leading-relaxed font-sans">
                      Myraa runs securely inside a remote Google Cloud Run sandbox container. It cannot access your physical keyboard, speakers, or open local Chrome processes directly on your computer due to sandbox safety partitions.
                  </p>
                  <p className="text-[11px] leading-relaxed font-sans font-medium text-white/95">
                      To grant Myraa REAL, un-sandboxed voice control over your computer's browser, easily run her <b>Playwright Local Agent</b> script directly on your computer!
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">Quick Start Setup Guide</h3>
                  
                  {/* Step 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 font-mono text-[9px] font-bold text-purple-300">1</span>
                      <span className="text-xs text-slate-200 font-semibold font-mono">Install Playwright & Express dependencies</span>
                    </div>
                    <div className="relative p-3 rounded-xl bg-slate-950 font-mono text-xs border border-white/5 flex items-center justify-between group">
                      <code className="text-slate-300">{setupCommands}</code>
                      <button
                        onClick={() => copyToClipboard(setupCommands, "setup")}
                        className="p-1 px-2.5 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer flex items-center gap-1"
                      >
                        {copiedSection === "setup" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span className="text-[10px]">{copiedSection === "setup" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 font-mono text-[9px] font-bold text-purple-300">2</span>
                      <span className="text-xs text-slate-200 font-semibold font-mono">Create local-agent.js file</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Download or copy the <b>local-agent.js</b> file created in this workspace root and save it to your local project folder.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 font-mono text-[9px] font-bold text-purple-300">3</span>
                      <span className="text-xs text-slate-200 font-semibold font-mono">Launch the agent connection</span>
                    </div>
                    <div className="relative p-3 rounded-xl bg-slate-950 font-mono text-xs border border-white/5 flex items-center justify-between group">
                      <code className="text-slate-300">{runCommand}</code>
                      <button
                        onClick={() => copyToClipboard(runCommand, "run")}
                        className="p-1 px-2.5 rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer flex items-center gap-1"
                      >
                        {copiedSection === "run" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span className="text-[10px]">{copiedSection === "run" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 text-[11px] text-rose-300 leading-normal flex gap-2">
                  <AlertCircle size={14} className="shrink-0 text-rose-400 mt-0.5" />
                  <span>The Myraa interface completely removed fake simulations. Once the server registers locally, this panel will flash green instantly.</span>
                </div>
              </div>
            ) : (
              // ACTIVE BROWSER REAL-TIME STATS PANEL
              <div className="space-y-6">
                <div className="p-5 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 shadow-lg shadow-emerald-900/5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-500/10">
                    <h3 className="text-xs font-mono uppercase tracking-widest font-black text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle size={14} /> Active Session Matrix
                    </h3>
                    <span className="font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full uppercase">PLAYWRIGHT STREAMING</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <p className="text-slate-500 uppercase text-[9px] tracking-wider">Browser Port</p>
                      <p className="text-slate-200 font-bold">localhost:3001</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 uppercase text-[9px] tracking-wider">Window Mode</p>
                      <p className="text-slate-200 font-bold flex items-center gap-1">
                        <Monitor size={12} className="text-purple-400" /> Headed Chromium
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 border-t border-emerald-500/10 pt-3">
                    <p className="text-slate-500 uppercase text-[9px] font-mono tracking-wider">Active Browser URL</p>
                    <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-xl border border-white/5">
                      <span className="font-mono text-xs text-sky-400 truncate max-w-sm">{currentUrl}</span>
                      <a 
                        href={currentUrl !== "None" ? currentUrl : "#"} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 hover:text-white transition flex items-center gap-1"
                      >
                        Inspect <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Automation Command references */}
                <div className="space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold">Supported Audio Directives</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans text-slate-300">
                    <div className="p-3.5 rounded-xl border border-white/5 bg-white/5 flex gap-2.5">
                      <Play size={14} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-200">"Play [SongName]"</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Navigates to YouTube, enters query, targets the item, and starts streaming.</p>
                      </div>
                    </div>
                    
                    <div className="p-3.5 rounded-xl border border-white/5 bg-white/5 flex gap-2.5">
                      <Volume2 size={14} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-200">"Adjust volume to 50%"</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Sends automated playback properties directly into the native YouTube video controller.</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-white/5 bg-white/5 flex gap-2.5">
                      <Maximize size={14} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-200">"Go Fullscreen"</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Simulates high-speed shortcut presses to toggle optimal immersive view.</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-white/5 bg-white/5 flex gap-2.5">
                      <Globe size={14} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-200">"Scroll down / Go Back"</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Navigates layout, scroll offsets, or moves previous page steps seamlessly.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PANEL B: Embedded terminal showing REAL logs */}
          <div className="w-full md:w-80 shrink-0 flex flex-col bg-slate-950/60 p-5 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="font-mono text-xs uppercase tracking-wider text-purple-300 font-bold flex items-center gap-1.5">
                <Terminal size={14} /> Agent Console Trace
              </span>
              <span className="inline-flex h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[10px] leading-relaxed space-y-2.5 scrollbar-settings text-slate-400 pr-1 select-none">
              {localLogs.length === 0 ? (
                <div className="text-slate-600 italic py-4">
                  No automated logs recorded yet. Once Myraa receives a call instruction, logs will print here.
                </div>
              ) : (
                localLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-2 rounded-lg border leading-normal ${
                      log.type === "success" 
                        ? "text-emerald-400 bg-emerald-950/10 border-emerald-500/10" 
                        : log.type === "error" 
                        ? "text-rose-400 bg-rose-950/10 border-rose-500/10" 
                        : log.type === "action" 
                        ? "text-purple-300 bg-purple-950/20 border-purple-500/20 font-semibold"
                        : "text-slate-400 bg-white/5 border-transparent"
                    }`}
                  >
                    {log.text}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-white/5 text-[9px] font-mono text-slate-500 text-center">
              Playwright Local Sync Controller • v1.0.0
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
