"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, ReferenceLine, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Send, Bot, AlertTriangle, Trash2, Plus, Menu,
  Stethoscope, MessageSquare, Clock, X, ChevronRight,
  Sparkles, Pencil, Check, Copy, RotateCcw, Activity,
  ShieldAlert, ListChecks, TrendingUp, Zap, Heart,
  FlaskConical, ChevronDown,
} from "lucide-react";
import { SimpleThemeToggle } from "@/components/mode-toggle";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message { id: string; role: "user" | "assistant"; content: string; createdAt: string; }
interface LocalMatch { name: string; score: number; severity: "mild" | "moderate" | "severe"; }
interface Session { id: string; title: string; updatedAt: string; _count: { messages: number }; }
interface AnalysisData {
  urgency: number;
  summary: string;
  seekCare: boolean;
  redFlags: string[];
  conditions: { name: string; score: number; severity: string; reason: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SEVERITY_COLOR: Record<string, string> = { mild: "#10b981", moderate: "#f59e0b", severe: "#f43f5e" };
const SEVERITY_BG: Record<string, string> = { mild: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", moderate: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800", severe: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" };
const URGENCY_META: Record<number, { label: string; color: string; bg: string; border: string; dot: string; ring: string }> = {
  1: { label: "Self-care at home",    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  2: { label: "See GP this week",     color: "text-teal-600 dark:text-teal-400",    bg: "bg-teal-50 dark:bg-teal-950/30",    border: "border-teal-200 dark:border-teal-800",    dot: "bg-teal-500",    ring: "ring-teal-200"    },
  3: { label: "See doctor < 24 h",   color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/30",  border: "border-amber-200 dark:border-amber-800",  dot: "bg-amber-500",   ring: "ring-amber-200"   },
  4: { label: "Urgent care today",   color: "text-orange-600 dark:text-orange-400",  bg: "bg-orange-50 dark:bg-orange-950/30",border: "border-orange-200 dark:border-orange-800", dot: "bg-orange-500",  ring: "ring-orange-200"  },
  5: { label: "EMERGENCY — call 911",color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-50 dark:bg-rose-950/30",    border: "border-rose-300 dark:border-rose-800",    dot: "bg-rose-500",    ring: "ring-rose-300"    },
};
const EXAMPLE_SYMPTOMS = [
  "fever","headache","cough","fatigue","nausea","chest pain",
  "shortness of breath","sore throat","body aches","vomiting","dizziness","runny nose",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseAnalysisData(response: string): { clean: string; data: AnalysisData | null } {
  const match = response.match(/---ANALYSIS_DATA---\s*([\s\S]*?)\s*---END_DATA---/);
  if (!match) return { clean: response, data: null };
  try {
    const data: AnalysisData = JSON.parse(match[1]);
    const clean = response.replace(/---ANALYSIS_DATA---[\s\S]*?---END_DATA---/, "").trim();
    return { clean, data };
  } catch { return { clean: response, data: null }; }
}

function extractSymptoms(msg: string): string[] {
  const m = msg.match(/symptoms?[:\s]+(.+?)\./i);
  if (!m) return [];
  return m[1].split(",").map(s => s.trim()).filter(Boolean);
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      h1: ({ children }) => <h1 className="text-base font-bold mt-4 mb-2 first:mt-0 border-b border-border pb-1">{children}</h1>,
      h2: ({ children }) => <h2 className="text-sm font-bold mt-4 mb-1.5 first:mt-0 text-primary/90">{children}</h2>,
      h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>,
      p:  ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p>,
      ul: ({ children }) => <ul className="mb-2 pl-1 space-y-0.5">{children}</ul>,
      ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 space-y-0.5">{children}</ol>,
      li: ({ children }) => <li className="flex gap-2 text-sm"><span className="text-primary mt-1 shrink-0">•</span><span>{children}</span></li>,
      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      em:     ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
      blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic text-xs bg-muted/30 py-1 rounded-r-lg">{children}</blockquote>,
      code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
      hr: () => <hr className="border-border my-3" />,
    }}>{content}</ReactMarkdown>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center py-1">
      {[0,1,2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
      ))}
    </div>
  );
}

// ─── Loading Dashboard skeleton ───────────────────────────────────────────────
function LoadingDashboard({ symptoms }: { symptoms: string[] }) {
  const steps = [
    "Parsing symptom patterns…",
    "Running differential analysis…",
    "Ranking conditions by likelihood…",
    "Calculating urgency triage…",
    "Generating clinical report…",
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-4 space-y-4">
      {/* Centred overlay */}
      <div className="fixed inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-20 pointer-events-none">
        <div className="text-center space-y-5 px-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-primary/40 animate-ping" style={{ animationDelay: "300ms" }} />
            <div className="relative w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg">
              <Stethoscope className="w-9 h-9 text-primary" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-base">Analysing your symptoms</p>
            <p className="text-xs text-muted-foreground min-h-4 transition-all">{steps[step]}</p>
          </div>
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
              {symptoms.map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">{s}</span>
              ))}
            </div>
          )}
          <div className="flex gap-1.5 justify-center">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Background skeleton */}
      <div className="animate-pulse space-y-4 opacity-30">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-5 h-52 rounded-2xl bg-muted" />
          <div className="col-span-12 md:col-span-3 h-52 rounded-2xl bg-muted" />
          <div className="col-span-12 md:col-span-4 h-52 rounded-2xl bg-muted" />
        </div>
        <div className="h-80 rounded-2xl bg-muted" />
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-8 h-56 rounded-2xl bg-muted" />
          <div className="col-span-12 md:col-span-4 h-56 rounded-2xl bg-muted" />
        </div>
        <div className="h-48 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

// ─── Chat Popup ───────────────────────────────────────────────────────────────
interface ChatPopupProps {
  open: boolean;
  onClose: () => void;
  messages: Message[];
  loading: boolean;
  chatInput: string;
  setChatInput: (v: string) => void;
  onSend: (text: string) => void;
  copiedId: string | null;
  onCopy: (id: string, content: string) => void;
  onRetry: (content: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  chatTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
}
function ChatPopup({ open, onClose, messages, loading, chatInput, setChatInput, onSend, copiedId, onCopy, onRetry, messagesEndRef, chatTextareaRef }: ChatPopupProps) {
  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(chatInput); }
  }
  return (
    <div className={`fixed bottom-20 right-3 sm:right-6 z-50 flex flex-col transition-all duration-300 origin-bottom-right ${open ? "scale-100 opacity-100 pointer-events-auto" : "scale-90 opacity-0 pointer-events-none"}`}
      style={{ width: "min(380px, calc(100vw - 24px))", height: 520 }}>
      <div className="flex flex-col h-full rounded-2xl border border-border shadow-2xl bg-card overflow-hidden">
        {/* popup header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Follow-up Chat</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{loading ? "Thinking…" : "Ask anything about your results"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center pt-8 space-y-2">
              <FlaskConical className="w-8 h-8 text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground">No messages yet. Ask a follow-up question about your diagnosis.</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`group/msg flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "items-end"}`}>
              <div className={`flex flex-col gap-0.5 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {msg.role === "user" ? (
                  <div className="bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-tr-sm text-xs font-medium leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="bg-muted/50 border border-border px-3 py-2 rounded-2xl rounded-bl-sm text-xs leading-relaxed">
                    <MarkdownMessage content={msg.content} />
                  </div>
                )}
                <div className={`flex items-center gap-1 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <span className="text-[9px] text-muted-foreground/40">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <div className="flex gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                    <button onClick={() => onCopy(msg.id, msg.content)} className="p-0.5 rounded hover:bg-muted text-muted-foreground/40 hover:text-muted-foreground">
                      {copiedId === msg.id ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                    </button>
                    {msg.role === "user" && idx === messages.length - 1 && !loading && (
                      <button onClick={() => onRetry(msg.content)} className="p-0.5 rounded hover:bg-muted text-muted-foreground/40 hover:text-muted-foreground">
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading && <TypingDots />}
          <div ref={messagesEndRef} />
        </div>

        {/* disclaimer */}
        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 border-t border-amber-100 dark:border-amber-900/30 shrink-0">
          <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
            Informational only — consult a licensed physician.
          </p>
        </div>

        {/* input */}
        <div className="p-2.5 border-t border-border bg-card shrink-0">
          <form onSubmit={(e) => { e.preventDefault(); onSend(chatInput); }}
            className="flex gap-2 items-end bg-muted/40 border border-border rounded-xl px-3 py-1.5 focus-within:border-primary/50 focus-within:bg-background transition-all">
            <textarea ref={chatTextareaRef} value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a follow-up question…"
              disabled={loading} rows={1}
              className="flex-1 bg-transparent text-xs resize-none outline-none placeholder:text-muted-foreground/50 py-0.5 min-h-5 max-h-24 leading-relaxed disabled:opacity-50" />
            <Button type="submit" disabled={loading || !chatInput.trim()} size="icon" className="h-7 w-7 rounded-lg shrink-0 disabled:opacity-30">
              <Send className="w-3 h-3" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [localMatches, setLocalMatches] = useState<LocalMatch[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [analysedSymptoms, setAnalysedSymptoms] = useState<string[]>([]);

  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const symptomInputRef = useRef<HTMLInputElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const hasResult = messages.length > 0;
  // Show loader: fetching AND no analysis data yet
  const showLoader = loading && hasResult && !analysisData;

  useEffect(() => { fetchSessions(); }, []);
  useEffect(() => {
    if (chatOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, chatOpen]);
  useEffect(() => {
    const el = chatTextareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 96) + "px"; }
  }, [chatInput]);

  async function fetchSessions() {
    const res = await fetch("/api/sessions");
    if (res.ok) setSessions(await res.json());
  }

  async function loadSession(id: string) {
    setActiveSessionId(id);
    setLocalMatches([]);
    setAnalysisData(null);
    setAnalysedSymptoms([]);
    setSymptoms([]);
    setSymptomInput("");
    setChatOpen(false);
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) {
      const data = await res.json();
      const lastAI = [...data.messages].reverse().find((m: Message) => m.role === "assistant");
      if (lastAI) { const { data: ad } = parseAnalysisData(lastAI.content); if (ad) setAnalysisData(ad); }
      const firstUser = data.messages.find((m: Message) => m.role === "user");
      if (firstUser) setAnalysedSymptoms(extractSymptoms(firstUser.content));
      setMessages(data.messages.map((m: Message) => {
        if (m.role === "assistant") { const { clean } = parseAnalysisData(m.content); return { ...m, content: clean }; }
        return m;
      }));
    }
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (activeSessionId === id) resetState();
    fetchSessions();
  }

  function startRename(session: Session, e: React.MouseEvent) {
    e.stopPropagation();
    setRenamingId(session.id);
    setRenameValue(session.title);
    setTimeout(() => renameInputRef.current?.select(), 0);
  }

  async function commitRename(id: string) {
    if (!renameValue.trim()) { cancelRename(); return; }
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameValue.trim() }),
    });
    setRenamingId(null);
    fetchSessions();
  }

  function cancelRename() { setRenamingId(null); setRenameValue(""); }

  function copyMessage(id: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function resetState() {
    setActiveSessionId(null);
    setMessages([]);
    setLocalMatches([]);
    setAnalysisData(null);
    setAnalysedSymptoms([]);
    setSymptoms([]);
    setSymptomInput("");
    setChatInput("");
    setChatOpen(false);
    setUnreadCount(0);
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setChatInput("");
    const userMsg: Message = {
      id: `temp-user-${Date.now()}`, role: "user", content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), sessionId: activeSessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveSessionId(data.sessionId);
      setLocalMatches(data.localMatches || []);
      const { clean, data: ad } = parseAnalysisData(data.response);
      if (ad) setAnalysisData(ad);
      if (!analysedSymptoms.length) setAnalysedSymptoms(extractSymptoms(text));
      setMessages(prev => [
        ...prev,
        { id: `temp-ai-${Date.now()}`, role: "assistant", content: clean, createdAt: new Date().toISOString() },
      ]);
      if (!chatOpen) setUnreadCount(c => c + 1);
      fetchSessions();
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: "Something went wrong. Please try again.", createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, activeSessionId, chatOpen, analysedSymptoms.length]);

  function commitSymptom(raw: string) {
    const trimmed = raw.trim().toLowerCase().replace(/,$/, "");
    if (trimmed && !symptoms.includes(trimmed)) setSymptoms(prev => [...prev, trimmed]);
    setSymptomInput("");
  }

  function handleSymptomKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commitSymptom(symptomInput); }
    else if (e.key === "Backspace" && !symptomInput && symptoms.length) setSymptoms(prev => prev.slice(0,-1));
    else if (e.key === "Escape") setSymptomInput("");
  }

  async function analyzeSymptoms() {
    const all = symptomInput.trim() ? [...symptoms, symptomInput.trim().toLowerCase()] : symptoms;
    if (!all.length) return;
    setSymptomInput("");
    setSymptoms([]);
    await sendMessage(`I have the following symptoms: ${all.join(", ")}. Please give me a concise analysis.`);
  }

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = (analysisData?.conditions ?? localMatches.map(m => ({
    name: m.name, score: m.score, severity: m.severity, reason: "",
  }))).map(c => ({
    name: c.name.length > 22 ? c.name.slice(0, 20) + "…" : c.name,
    fullName: c.name,
    pct: Math.round(c.score * 100),
    severity: c.severity,
    reason: (c as { reason?: string }).reason ?? "",
  }));

  const radarData = chartData.slice(0, 6).map(c => ({ subject: c.name, value: c.pct }));
  const urgencyMeta = analysisData ? (URGENCY_META[analysisData.urgency] ?? URGENCY_META[1]) : null;
  const symptomsDisplay = analysedSymptoms.length ? analysedSymptoms : localMatches.map(m => m.name);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-xl px-3.5 py-2.5 shadow-xl text-xs max-w-56 space-y-1">
        <p className="font-bold text-sm leading-snug">{d.fullName}</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[d.severity] ?? "#6366f1" }} />
          <span className="font-bold text-base" style={{ color: SEVERITY_COLOR[d.severity] ?? "#6366f1" }}>{d.pct}%</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${SEVERITY_BG[d.severity] ?? ""}`}>{d.severity}</span>
        </div>
        {d.reason && <p className="text-muted-foreground leading-relaxed text-[11px] border-t border-border pt-1.5">{d.reason}</p>}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 lg:z-auto ${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 border-r border-border flex flex-col shrink-0 overflow-hidden bg-card`}>
        <div className="p-4 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Stethoscope className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Symptom AI</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Clinical Dashboard</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { resetState(); if (window.innerWidth < 1024) setSidebarOpen(false); }}
            className="w-full h-8 text-xs font-semibold gap-1.5 border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all">
            <Plus className="w-3.5 h-3.5" /> New Consultation
          </Button>
        </div>
        <div className="px-3 pt-3 pb-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">History</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 ? (
            <div className="text-center pt-8 px-4 space-y-2">
              <MessageSquare className="w-7 h-7 text-muted-foreground/25 mx-auto" />
              <p className="text-xs text-muted-foreground">No consultations yet.</p>
            </div>
          ) : sessions.map(session => (
            <div key={session.id}
              onClick={() => { if (renamingId !== session.id) { loadSession(session.id); if (window.innerWidth < 1024) setSidebarOpen(false); } }}
              className={`group flex items-start justify-between gap-1.5 p-2.5 rounded-xl cursor-pointer transition-all ${activeSessionId === session.id ? "bg-primary/10" : "hover:bg-muted/60"}`}>
              <div className="flex-1 min-w-0">
                {renamingId === session.id ? (
                  <form onSubmit={e => { e.preventDefault(); commitRename(session.id); }}
                    onClick={e => e.stopPropagation()} className="flex items-center gap-1">
                    <input ref={renameInputRef} value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === "Escape") cancelRename(); }}
                      onBlur={() => commitRename(session.id)}
                      className="flex-1 min-w-0 text-xs font-semibold bg-background border border-primary/40 rounded px-1.5 py-0.5 outline-none focus:border-primary"
                      autoFocus />
                    <button type="submit" className="text-primary hover:text-primary/70 shrink-0"><Check className="w-3 h-3" /></button>
                  </form>
                ) : (
                  <p className={`font-semibold truncate text-xs leading-snug ${activeSessionId === session.id ? "text-primary" : ""}`}>{session.title}</p>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-muted-foreground/70" />
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    {" · "}{session._count.messages} msgs
                  </p>
                </div>
              </div>
              {renamingId !== session.id && (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/10 hover:text-primary" onClick={e => startRename(session, e)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={e => deleteSession(session.id, e)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="border-b border-border px-4 py-2.5 flex items-center gap-3 bg-card/80 backdrop-blur sticky top-0 z-10 shadow-sm shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(v => !v)} className="h-8 w-8 shrink-0 rounded-lg">
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-sm leading-tight shrink-0">Symptom Checker AI</h1>
                {/* ── Symptom pills inline in header (hidden on mobile) ── */}
                {hasResult && symptomsDisplay.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1 flex-wrap">
                    <FlaskConical className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                    {symptomsDisplay.slice(0, 5).map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-[10px] font-semibold leading-none">{s}</span>
                    ))}
                    {symptomsDisplay.length > 5 && (
                      <span className="text-[10px] text-muted-foreground">+{symptomsDisplay.length - 5} more</span>
                    )}
                  </div>
                )}
              </div>
              {!hasResult && <p className="text-[11px] text-muted-foreground leading-tight hidden sm:block">Clinical AI-powered diagnostic dashboard</p>}
            </div>
          </div>
          {hasResult && (
            <div className="flex items-center gap-2 shrink-0">
              {urgencyMeta && (
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${urgencyMeta.bg} ${urgencyMeta.border} ${urgencyMeta.color}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${urgencyMeta.dot} animate-pulse`} />
                  {urgencyMeta.label}
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={resetState} className="text-xs gap-1.5 text-muted-foreground hover:text-primary">
                <Plus className="w-3.5 h-3.5" /> New
              </Button>
              <SimpleThemeToggle />
            </div>
          )}
          {!hasResult && <SimpleThemeToggle />}
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {!hasResult ? (
            /* ── SYMPTOM BUILDER ── */
            <div className="px-4 py-8 flex flex-col items-center justify-center min-h-full">
              <div className="w-full max-w-xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-sm">
                    <Stethoscope className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Clinical Symptom Analysis</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Enter your symptoms to receive a ranked differential diagnosis, probability scores, urgency triage, and a personalised action plan — all displayed on an interactive clinical dashboard.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Activity, label: "AI Model", val: "Gemini 2.5" },
                    { icon: ListChecks, label: "Disease DB", val: "20+ conditions" },
                    { icon: Zap, label: "Analysis", val: "Instant" },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
                      <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                      <p className="text-sm font-bold">{val}</p>
                      <p className="text-[11px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Chip input */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Your Symptoms</label>
                  <div className="flex flex-wrap gap-2 min-h-14 p-3 rounded-2xl border border-border bg-card focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all cursor-text"
                    onClick={() => symptomInputRef.current?.focus()}>
                    {symptoms.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                        {s}
                        <button type="button" onClick={e => { e.stopPropagation(); setSymptoms(prev => prev.filter(x => x !== s)); }} className="hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input ref={symptomInputRef} value={symptomInput}
                      onChange={e => { const v = e.target.value; if (v.includes(",")) { v.split(",").forEach(p => commitSymptom(p)); } else setSymptomInput(v); }}
                      onKeyDown={handleSymptomKeyDown}
                      onBlur={() => { if (symptomInput.trim()) commitSymptom(symptomInput); }}
                      placeholder={symptoms.length === 0 ? "e.g. fever, headache, cough…" : "Add more…"}
                      className="flex-1 min-w-36 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50" />
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-2">
                    <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-muted font-mono">,</kbd> — add</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">⌫</kbd> — remove last</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">Esc</kbd> — clear</span>
                  </div>
                </div>

                <Button onClick={analyzeSymptoms} disabled={(symptoms.length === 0 && !symptomInput.trim()) || loading}
                  className="w-full h-12 font-semibold gap-2 rounded-xl text-sm">
                  {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? "Analysing…" : "Run Diagnostic Analysis"}
                  {!loading && <ChevronRight className="w-4 h-4 opacity-60" />}
                </Button>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold text-center uppercase tracking-widest">Common symptoms</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {EXAMPLE_SYMPTOMS.filter(s => !symptoms.includes(s)).map(s => (
                      <button key={s} type="button" onClick={() => setSymptoms(prev => [...prev, s])}
                        className="px-3 py-1 rounded-full border border-border text-xs hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          ) : showLoader ? (
            /* ── LOADER ── */
            <LoadingDashboard symptoms={symptomsDisplay.length ? symptomsDisplay : symptoms} />

          ) : (
            /* ── DASHBOARD ── */
            <div className="p-4 space-y-4">

              {/* ═══ Row 1: Urgency hero (col-5) + Stats grid (col-3) + Radar (col-4) ═══ */}
              <div className="grid grid-cols-12 gap-4">

                {/* Urgency hero */}
                {urgencyMeta && (
                  <Card className={`col-span-12 md:col-span-5 border-2 ${urgencyMeta.border} ${urgencyMeta.bg} flex flex-col`}>
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Urgency Triage</p>
                          {analysisData?.seekCare && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[10px] font-bold shrink-0">
                              <ShieldAlert className="w-3 h-3" /> Seek care
                            </span>
                          )}
                        </div>
                        <div className="flex items-end gap-3 mb-4">
                          <span className="text-7xl font-black leading-none tabular-nums" style={{ color: SEVERITY_COLOR[["","mild","mild","moderate","severe","severe"][analysisData?.urgency ?? 1]] }}>
                            {analysisData?.urgency}
                          </span>
                          <div className="pb-1">
                            <p className="text-[10px] text-muted-foreground font-medium">out of 5</p>
                            <p className={`text-sm font-bold leading-tight ${urgencyMeta.color}`}>{urgencyMeta.label}</p>
                          </div>
                        </div>
                        {/* segmented meter */}
                        <div className="flex gap-1.5 mb-4">
                          {[1,2,3,4,5].map(n => (
                            <div key={n} className={`flex-1 h-3 rounded-full transition-all ${n <= (analysisData?.urgency ?? 0) ? urgencyMeta.dot : "bg-border"}`} />
                          ))}
                        </div>
                        {analysisData?.summary && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{analysisData.summary}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stats 2×2 grid */}
                <div className={`${urgencyMeta ? "col-span-12 md:col-span-3" : "col-span-12 md:col-span-5"} grid grid-cols-2 gap-3 content-start`}>
                  {[
                    { icon: Heart, val: chartData.length, label: "conditions", sub: "identified", color: "text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/20", border: "border-rose-100 dark:border-rose-900" },
                    { icon: Activity, val: `${chartData[0]?.pct ?? 0}%`, label: "top match", sub: chartData[0]?.name ?? "—", color: "text-primary", bg: "bg-primary/5", border: "border-primary/15" },
                    { icon: AlertTriangle, val: analysisData?.redFlags?.length ?? 0, label: "red flags", sub: "detected", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-100 dark:border-amber-900" },
                    { icon: Zap, val: symptomsDisplay.length || symptoms.length, label: "symptoms", sub: "reported", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-100 dark:border-violet-900" },
                  ].map(({ icon: Icon, val, label, sub, color, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-2xl p-3.5 flex flex-col gap-1`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                      <p className="text-2xl font-black leading-none tabular-nums">{val}</p>
                      <div>
                        <p className="text-[11px] font-semibold leading-tight">{label}</p>
                        <p className="text-[10px] text-muted-foreground truncate leading-snug">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Radar chart */}
                <Card className={`${urgencyMeta ? "col-span-12 md:col-span-4" : "col-span-12 md:col-span-4"}`}>
                  <CardHeader className="pb-0 pt-4 px-4">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Activity className="w-3 h-3" /> Risk Profile Radar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-1 pb-3 pt-0">
                    <ResponsiveContainer width="100%" height={230}>
                      <RadarChart data={radarData} margin={{ top: 12, right: 24, bottom: 8, left: 24 }}>
                        <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} tickCount={4} />
                        <Radar name="Likelihood %" dataKey="value"
                          stroke="hsl(var(--primary))" fill="hsl(var(--primary))"
                          fillOpacity={0.18} strokeWidth={2}
                          dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }} />
                        <Tooltip formatter={(v: number | undefined) => v !== undefined ? [`${v}%`, "Likelihood"] : ["—", "Likelihood"]}
                          contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid hsl(var(--border))" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* ═══ Row 2: Full-width Differential Diagnosis bar chart ═══ */}
              <Card>
                <CardHeader className="pb-1 pt-4 px-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Zap className="w-3 h-3" /> Differential Diagnosis — Likelihood by Condition
                    </CardTitle>
                    <div className="flex gap-4">
                      {(["mild","moderate","severe"] as const).map(s => (
                        <div key={s} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: SEVERITY_COLOR[s] }} />
                          <span className="capitalize font-medium">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-2">
                  <ResponsiveContainer width="100%" height={Math.max(chartData.length * 52 + 24, 200)}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 56, top: 4, bottom: 4 }} barCategoryGap="28%">
                      <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="4 4" opacity={0.5} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} tickCount={6} />
                      <YAxis type="category" dataKey="name" width={145}
                        tick={{ fontSize: 11.5, fill: "hsl(var(--foreground))", fontWeight: 600 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 6, fillOpacity: 0.5 }} />
                      <ReferenceLine x={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3" strokeOpacity={0.4} label={{ value: "50%", position: "top", fontSize: 9, fill: "hsl(var(--muted-foreground))", opacity: 0.6 }} />
                      <Bar dataKey="pct" radius={[0, 8, 8, 0]} maxBarSize={28}
                        label={{ position: "right", fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 700, formatter: (v: unknown) => typeof v === "number" ? `${v}%` : "" }}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={SEVERITY_COLOR[entry.severity] ?? "#6366f1"} fillOpacity={0.9} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* ═══ Row 3: Conditions detail (col-8) + Red flags + Next steps (col-4) ═══ */}
              <div className="grid grid-cols-12 gap-4">

                {/* Conditions ranked list */}
                <Card className="col-span-12 md:col-span-8">
                  <CardHeader className="pb-1 pt-4 px-5">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <ListChecks className="w-3 h-3" /> Conditions — Ranked Detail
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-2 space-y-2.5">
                    {chartData.map((c, i) => (
                      <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-muted/30 border border-border hover:bg-muted/50 hover:border-border/80 transition-all group">
                        {/* rank badge */}
                        <span className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-sm"
                          style={{ background: SEVERITY_COLOR[c.severity] ?? "#6366f1" }}>
                          #{i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          {/* name row */}
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold">{c.fullName}</p>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEVERITY_BG[c.severity] ?? ""}`}>{c.severity}</span>
                              <span className="text-sm font-black tabular-nums" style={{ color: SEVERITY_COLOR[c.severity] }}>{c.pct}%</span>
                            </div>
                          </div>
                          {/* progress bar — double height, gradient */}
                          <div className="w-full bg-border/60 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full transition-all duration-700"
                              style={{ width: `${c.pct}%`, background: `linear-gradient(90deg, ${SEVERITY_COLOR[c.severity]}99, ${SEVERITY_COLOR[c.severity]})` }} />
                          </div>
                          {c.reason && <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{c.reason}</p>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Right column: red flags + next steps */}
                <div className="col-span-12 md:col-span-4 space-y-4">
                  {analysisData?.redFlags && analysisData.redFlags.length > 0 && (
                    <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
                      <CardHeader className="pb-1 pt-4 px-4">
                        <CardTitle className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" /> Red Flags
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-2 space-y-2">
                        {analysisData.redFlags.map((f, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-2.5 bg-rose-100/70 dark:bg-rose-900/25 rounded-xl border border-rose-200 dark:border-rose-800">
                            <span className="text-rose-500 shrink-0 mt-0.5 text-sm">⚠</span>
                            <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-snug font-medium">{f}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-1 pt-4 px-4">
                      <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <ChevronDown className="w-3 h-3" /> Next Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-2 space-y-3">
                      {[
                        { text: "Review the differential diagnosis above", icon: "1" },
                        { text: "Note any red flag symptoms carefully", icon: "2" },
                        { text: urgencyMeta ? urgencyMeta.label : "Follow urgency guidance", icon: "3" },
                        { text: "Use Follow-up Chat for questions", icon: "4" },
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center mt-0.5">{step.icon}</span>
                          <p className="text-xs text-muted-foreground leading-relaxed">{step.text}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ═══ Row 4: Full Clinical Report ═══ */}
              <Card>
                <CardHeader className="pb-1 pt-4 px-5">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Bot className="w-3 h-3" /> Full Clinical Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-2">
                  {messages.filter(m => m.role === "assistant").slice(-1).map(m => (
                    <MarkdownMessage key={m.id} content={m.content} />
                  ))}
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </div>

      {/* ── Floating Chat Button ── */}
      {hasResult && !showLoader && (
        <>
          <ChatPopup
            open={chatOpen}
            onClose={() => { setChatOpen(false); }}
            messages={messages}
            loading={loading}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSend={text => sendMessage(text)}
            copiedId={copiedId}
            onCopy={copyMessage}
            onRetry={text => sendMessage(text)}
            messagesEndRef={messagesEndRef}
            chatTextareaRef={chatTextareaRef}
          />
          <button
            onClick={() => { setChatOpen(v => !v); setUnreadCount(0); }}
            className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
          >
            {chatOpen ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            <span className="text-sm font-semibold">{chatOpen ? "Close" : "Follow-up Chat"}</span>
            {!chatOpen && unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
        </>
      )}
    </div>
  );
}
