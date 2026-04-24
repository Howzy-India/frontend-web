/**
 * ClientChatWidget — Floating AI sales assistant for howzy.in
 *
 * Interaction:
 *   • Tap FAB → full-screen Voice Overlay (Android Gemini-style)
 *     ‣ Auto-greets in user's native language with a female voice
 *     ‣ Auto-listens → processes → responds → auto-listens (loop)
 *     ‣ "Type instead" → TextChatPanel fallback (same session shared)
 *
 * Conversation is a sales lead generation flow: collect demographics
 * (name, phone, location), gather property preferences, search and present
 * results, then create an enquiry.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Bot, Loader2, Mic, Send, RefreshCw,
  MapPin, Tag,
} from 'lucide-react';
import { api } from '../services/api';

// ─── Browser Speech helpers ───────────────────────────────────────────────────

const SpeechRec: any =
  typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
    : undefined;

/** Track active audio so stopSpeaking() can cancel it immediately. */
let activeAudio: HTMLAudioElement | null = null;

function stopSpeaking() {
  if (activeAudio) { activeAudio.pause(); activeAudio = null; }
  window.speechSynthesis?.cancel();
}

/** Detect TTS language from AI reply text. */
function detectLang(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  return 'en-IN';
}

/** Load available TTS voices; resolve after voiceschanged fires if needed. */
async function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!window.speechSynthesis) return [];
  let voices = window.speechSynthesis.getVoices();
  if (voices.length) return voices;
  return new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const onChanged = () => resolve(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener('voiceschanged', onChanged, { once: true });
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 700);
  });
}

// ─── Voice selection ──────────────────────────────────────────────────────────

export interface VoiceOption {
  id: string;
  label: string;
  lang: string;
  voiceName: string;
  description: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'en-female-a', label: 'Priya (English)', lang: 'en-IN', voiceName: 'en-IN-Neural2-A', description: 'Warm Indian English' },
  { id: 'en-female-d', label: 'Ananya (English)', lang: 'en-IN', voiceName: 'en-IN-Neural2-D', description: 'Clear Indian English' },
  { id: 'hi-female-a', label: 'Kavya (Hindi)', lang: 'hi-IN', voiceName: 'hi-IN-Neural2-A', description: 'Natural Hindi female' },
  { id: 'ta-female-a', label: 'Meera (Tamil)', lang: 'ta-IN', voiceName: 'ta-IN-Neural2-A', description: 'Natural Tamil female' },
];

// Active voice selection — persisted in localStorage
let selectedVoiceId = localStorage.getItem('howzy_voice') ?? 'en-female-a';

export function getSelectedVoice(): VoiceOption {
  return VOICE_OPTIONS.find(v => v.id === selectedVoiceId) ?? VOICE_OPTIONS[0];
}

export function setSelectedVoice(id: string) {
  selectedVoiceId = id;
  localStorage.setItem('howzy_voice', id);
}

async function getFemaleVoice(lang: string): Promise<SpeechSynthesisVoice | null> {
  const voices = await loadVoices();
  const prefix = lang.slice(0, 2);
  const forLang = voices.filter(v => v.lang.startsWith(prefix));
  const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria',
    'karen', 'moira', 'fiona', 'tessa', 'veena', 'heera'];
  return forLang.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k)))
    ?? forLang[0]
    ?? null;
}

/** Browser Web Speech fallback (used if backend TTS fails). */
async function speakBrowser(text: string, lang: string): Promise<void> {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.9;
  utt.pitch = 1.1;
  const voice = await getFemaleVoice(lang);
  if (voice) utt.voice = voice;
  return new Promise<void>((resolve) => {
    utt.onend = () => resolve();
    utt.onerror = () => resolve();
    window.speechSynthesis.speak(utt);
  });
}

/**
 * Speak text using Google Cloud TTS Neural2 voice.
 * Uses the user-selected voice; falls back to browser TTS if backend fails.
 */
async function speak(text: string, lang = 'en-IN'): Promise<void> {
  const voice = getSelectedVoice();
  const effectiveLang = lang !== 'en-IN' ? lang : voice.lang;
  const voiceName = lang !== 'en-IN' ? undefined : voice.voiceName;
  try {
    const { audioContent } = await api.textToSpeech(text, effectiveLang, voiceName);
    const binary = atob(audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    return new Promise<void>((resolve) => {
      const audio = new Audio(url);
      activeAudio = audio;
      audio.onended = () => { URL.revokeObjectURL(url); activeAudio = null; resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); activeAudio = null; resolve(); };
      audio.play().catch(() => { activeAudio = null; resolve(); });
    });
  } catch {
    await speakBrowser(text, effectiveLang);
  }
}

/** Return welcome greeting — separate display text (clean) and speak text (pronounceable). */
// getNativeGreeting removed — the assistant no longer auto-greets; it speaks
// only in response to a user hold on the AI button.

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  tool_results?: PropertyResult[];
}

interface PropertyResult {
  id: string;
  name: string;
  type: string;
  details?: { location?: string; city?: string; price?: string; budget?: string };
}

export interface ClientChatWidgetProps {
  uid?: string;
  userEmail?: string;
  onLoginClick?: () => void; // kept for backward compat; no longer used
  /** Incrementing counter that triggers the voice overlay to open from outside (e.g. header/footer AI button). */
  openSignal?: number;
  /** Increments each time the user presses (pointer-down) the AI button — starts push-to-talk recording. */
  holdStartSignal?: number;
  /** Increments each time the user releases (pointer-up/leave/cancel) the AI button — stops recording and sends. */
  holdEndSignal?: number;
}

// ─── Root Widget ──────────────────────────────────────────────────────────────

export default function ClientChatWidget({
  uid, userEmail, openSignal, holdStartSignal, holdEndSignal,
}: Readonly<ClientChatWidgetProps>) {
  const [mode, setMode] = useState<'closed' | 'voice' | 'text'>('closed');
  // Shared across voice ↔ text so conversation continues seamlessly
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Open chat when parent increments openSignal OR when a hold starts.
  // Always try the voice bar first — it is tiny and sits above the footer.
  // If speech recognition isn't supported or errors out, the bar auto-escalates
  // to the TextChatPanel (see VoiceOverlay's fallback logic).
  useEffect(() => {
    if (openSignal && openSignal > 0) setMode('voice');
  }, [openSignal]);
  useEffect(() => {
    if (holdStartSignal && holdStartSignal > 0) setMode('voice');
  }, [holdStartSignal]);

  function handleClose() {
    setMode('closed');
    setSessionId(null);
    setMessages([]);
  }

  return (
    <>
      {/* Floating FAB removed. The AI voice overlay is now triggered from:
          • Desktop → AI button in the header, next to the hamburger toggle
          • Mobile  → center AI button in the bottom nav
          Both call setIsAIOpen((n) => n + 1), which this widget watches via the openSignal prop. */}

      {/* Headless voice pipeline — the AI button in the header / footer is the mic.
          No persistent chat indicator: we just listen on hold, process on release,
          and speak the reply. */}
      <AnimatePresence>
        {mode === 'voice' && (
          <VoiceOverlay
            sessionId={sessionId}
            initialMessages={messages}
            holdStartSignal={holdStartSignal}
            holdEndSignal={holdEndSignal}
            onSessionId={setSessionId}
            onMessages={setMessages}
            onTextFallback={() => setMode('text')}
          />
        )}
      </AnimatePresence>

      {/* Text chat panel — fallback when voice isn't working */}
      <AnimatePresence>
        {mode === 'text' && (
          <TextChatPanel
            uid={uid}
            userEmail={userEmail}
            sessionId={sessionId}
            initialMessages={messages}
            onSessionId={setSessionId}
            onMessages={setMessages}
            onVoice={() => setMode('voice')}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Voice Overlay (Android Gemini-style full-screen voice experience) ─────────

function VoiceOverlay({
  sessionId,
  initialMessages,
  holdStartSignal,
  holdEndSignal,
  onSessionId,
  onMessages,
  onTextFallback,
}: {
  sessionId: string | null;
  initialMessages: ChatMessage[];
  holdStartSignal?: number;
  holdEndSignal?: number;
  onSessionId: (id: string) => void;
  onMessages: (msgs: ChatMessage[]) => void;
  onTextFallback: () => void;
}) {
  // Use refs to avoid stale closures inside async callbacks
  const mountedRef = useRef(true);
  const sessionRef = useRef<string | null>(sessionId);
  const messagesRef = useRef<ChatMessage[]>(initialMessages);
  const recRef = useRef<any>(null);
  const transcriptRef = useRef('');
  // True while a push-to-talk hold is in progress, so the onend handler can
  // send the transcript immediately on release (vs. restart listening).
  const pttActiveRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    // If the browser can't do speech recognition at all, go straight to text chat.
    if (!SpeechRec) {
      onTextFallback();
      return () => { mountedRef.current = false; };
    }
    void initSession();
    return () => {
      mountedRef.current = false;
      recRef.current?.abort();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push-to-talk: start recording when the parent signals a hold start.
  useEffect(() => {
    if (holdStartSignal && holdStartSignal > 0) beginPTT();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdStartSignal]);
  // Release: stop recording; onend will auto-send the transcript.
  useEffect(() => {
    if (holdEndSignal && holdEndSignal > 0) endPTT();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdEndSignal]);

  function addMessage(msg: ChatMessage) {
    const next = [...messagesRef.current, msg];
    messagesRef.current = next;
    onMessages(next);
  }

  async function initSession() {
    try {
      if (sessionRef.current) return;
      const res = await api.createChatSession();
      if (!mountedRef.current) return;
      sessionRef.current = res.session_id;
      onSessionId(res.session_id);
    } catch {
      // Session creation failed — silently ignore; next beginPTT will retry.
    }
  }

  /** Start a push-to-talk recording session. Runs until endPTT() is called. */
  const beginPTT = useCallback(() => {
    if (!SpeechRec || !mountedRef.current) return;
    // Interrupt any ongoing TTS so the user is heard immediately.
    stopSpeaking();
    // If a previous recognizer is still alive, abort it without sending.
    pttActiveRef.current = false;
    recRef.current?.abort();

    const session = sessionRef.current;
    if (!session) {
      // Session not ready yet — try to create one then start.
      void initSession().then(() => {
        if (mountedRef.current && sessionRef.current) beginPTT();
      });
      return;
    }

    const rec = new SpeechRec();
    rec.lang = 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    recRef.current = rec;
    transcriptRef.current = '';
    pttActiveRef.current = true;

    rec.onresult = (e: any) => {
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('');
      transcriptRef.current = t;
    };
    rec.onerror = (e: any) => {
      if (!mountedRef.current) return;
      pttActiveRef.current = false;
      if (e.error === 'no-speech') return;
      // Real recognition failure — escalate to text chat so user isn't stuck.
      onTextFallback();
    };
    rec.onend = () => {
      if (!mountedRef.current) return;
      const wasActive = pttActiveRef.current;
      pttActiveRef.current = false;
      const text = transcriptRef.current.trim();
      if (wasActive && text) void sendVoice(text, session);
    };
    try {
      rec.start();
    } catch {
      // Already started — ignore.
    }
  }, []);

  /** Stop the push-to-talk recorder; onend will send the captured transcript. */
  const endPTT = useCallback(() => {
    if (!recRef.current || !pttActiveRef.current) return;
    try {
      recRef.current.stop();
    } catch {
      // Ignore — will fall through to onend.
    }
  }, []);

  async function sendVoice(text: string, sid: string) {
    if (!mountedRef.current) return;
    addMessage({ role: 'user', content: text, timestamp: new Date().toISOString() });
    try {
      const res = await api.sendChatMessage(sid, text);
      if (!mountedRef.current) return;
      addMessage({ role: 'model', content: res.reply, timestamp: new Date().toISOString(), tool_results: res.tool_results });
      await speak(res.reply, detectLang(res.reply));
    } catch {
      // Network / API error — silently ignore; user can try again by holding.
    }
  }

  // Headless: the AI button (header + footer) is the only visible control.
  // No compact bar, no overlay — just the voice pipeline.
  return null;
}

// ─── Text Chat Panel ── fallback when user can't use voice ────────────────────

function TextChatPanel({
  uid, userEmail, sessionId, initialMessages, onSessionId, onMessages, onVoice, onClose,
}: {
  uid?: string;
  userEmail?: string;
  sessionId: string | null;
  initialMessages: ChatMessage[];
  onSessionId: (id: string) => void;
  onMessages: (msgs: ChatMessage[]) => void;
  onVoice: () => void;
  onClose: () => void;
}) {
  const [localSessionId, setLocalSessionId] = useState<string | null>(sessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<ChatMessage[]>(initialMessages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!localSessionId) startSession();
    else setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (localSessionId) setTimeout(() => inputRef.current?.focus(), 300);
  }, [localSessionId]);

  function addMessage(msg: ChatMessage) {
    const next = [...messagesRef.current, msg];
    messagesRef.current = next;
    setMessages(next);
    onMessages(next);
  }

  async function startSession() {
    setSessionLoading(true);
    setError(null);
    try {
      const res = await api.createChatSession();
      setLocalSessionId(res.session_id);
      onSessionId(res.session_id);
    } catch {
      setError('Could not start chat. Please try again.');
    } finally {
      setSessionLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !localSessionId || loading) return;
    const text = input.trim();
    setInput('');
    setLoading(true);
    setError(null);
    addMessage({ role: 'user', content: text, timestamp: new Date().toISOString() });
    try {
      const res = await api.sendChatMessage(localSessionId, text);
      addMessage({ role: 'model', content: res.reply, timestamp: new Date().toISOString(), tool_results: res.tool_results });
    } catch (err: any) {
      let msg = 'Failed to send. Please try again.';
      try { const d = JSON.parse(err?.message); msg = d.error ?? msg; } catch { /* ignore */ }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PanelShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white shrink-0">
        <div className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-full">
          <Bot className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Howzy AI Assistant</p>
          <p className="text-indigo-200 text-xs">Telugu · Hindi · English</p>
        </div>
        <div className="flex items-center gap-1">
          {localSessionId && (
            <button onClick={startSession} className="p-1.5 hover:bg-white/20 rounded-lg" title="New conversation">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button onClick={onVoice} className="p-1.5 hover:bg-white/20 rounded-lg" title="Switch to voice">
            <Mic className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {sessionLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-500">Starting session…</p>
        </div>
      ) : error && !localSessionId ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={startSession} className="text-sm font-semibold text-indigo-600 hover:underline">Retry</button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && <WelcomeMessage />}
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            {loading && <TypingIndicator />}
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <div ref={messagesEndRef} />
          </div>
          <div className="px-3 py-3 border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about properties…"
                className="flex-1 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-indigo-600 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </PanelShell>
  );
}

// ─── Shared Sub-components ───────────────────────────────────────────────────

function PanelShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      key="panel"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:bottom-6 md:right-6 z-[300] md:z-[200] w-full md:w-[92vw] md:max-w-sm h-[100dvh] md:h-[560px] bg-white md:rounded-2xl shadow-2xl border-0 md:border md:border-slate-200 flex flex-col overflow-hidden"
    >
      {children}
    </motion.div>
  );
}

function WelcomeMessage() {
  return (
    <div className="flex gap-2">
      <div className="flex items-center justify-center w-7 h-7 bg-indigo-100 rounded-full shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="bg-indigo-50 rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[85%]">
        <p className="text-sm text-slate-800 leading-relaxed font-semibold">
          Welcome to Howzy.in! 👋
        </p>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          I'm your AI property advisor. I can help you find apartments, plots, villas, farm land, and more.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Telugu · Hindi · English supported
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="flex items-center justify-center w-7 h-7 bg-indigo-100 rounded-full shrink-0 mt-0.5">
          <Bot className="w-4 h-4 text-indigo-600" />
        </div>
      )}
      <div className={`max-w-[82%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-slate-100 text-slate-800 rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
        {msg.tool_results && msg.tool_results.length > 0 && (
          <div className="w-full space-y-2">
            {msg.tool_results.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: PropertyResult }) {
  const location = property.details?.location ?? property.details?.city ?? '';
  const price = property.details?.price ?? property.details?.budget ?? 'Price on Request';
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm w-full">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-1">{property.name}</p>
        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0 uppercase">
          {property.type}
        </span>
      </div>
      {location && (
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
          <MapPin className="w-3 h-3 shrink-0" />
          {location}
        </div>
      )}
      <div className="flex items-center gap-1 text-xs font-bold text-indigo-600">
        <Tag className="w-3 h-3 shrink-0" />
        {price}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="flex items-center justify-center w-7 h-7 bg-indigo-100 rounded-full shrink-0">
        <Bot className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        {[0, 150, 300].map((d) => (
          <span key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  );
}
