/**
 * ClientChatWidget — Floating AI sales assistant for howzy.in
 *
 * Interaction:
 *   • Tap  → opens text-chat panel (no login required)
 *   • Hold (≥500 ms) → shows voice recording overlay → voice chat
 *
 * Voice greets in user's native language (detected from browser locale).
 * Conversation is a sales lead generation flow: collect demographics
 * (name, phone, location), gather property preferences, search and present
 * results, then create an enquiry.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Bot, Loader2, Mic, MicOff, Send, RefreshCw,
  MapPin, Tag, Volume2, VolumeX, MessageSquare,
} from 'lucide-react';
import { api } from '../services/api';

// ─── Browser Speech helpers ───────────────────────────────────────────────────

const SpeechRec: (typeof SpeechRecognition) | undefined =
  typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
    : undefined;

function speak(text: string, lang = 'en-IN'): Promise<void> {
  return new Promise<void>((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = lang;
    utt.rate = 0.93;
    utt.onend = () => resolve();
    utt.onerror = () => resolve();
    window.speechSynthesis.speak(utt);
  });
}

function stopSpeaking() { window.speechSynthesis?.cancel(); }

/** Detect TTS language from AI reply text. */
function detectLang(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';  // Telugu
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';  // Hindi
  return 'en-IN';
}

/** Return welcome greeting based on browser locale. */
function getNativeGreeting(): { text: string; lang: string } {
  const locale = navigator.language || 'en';
  if (locale.startsWith('te')) {
    return { text: 'హౌజీ.ఇన్ కు స్వాగతం! నేను మీకు ఎలా సహాయం చేయగలను?', lang: 'te-IN' };
  }
  if (locale.startsWith('hi')) {
    return { text: 'Howzy.in में आपका स्वागत है! मैं आपकी कैसे मदद कर सकता हूँ?', lang: 'hi-IN' };
  }
  if (locale.startsWith('kn')) {
    return { text: 'Howzy.in ಗೆ ಸ್ವಾಗತ! ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?', lang: 'kn-IN' };
  }
  if (locale.startsWith('ta')) {
    return { text: 'Howzy.in-க்கு வரவேற்கிறோம்! நான் உங்களுக்கு எவ்வாறு உதவலாம்?', lang: 'ta-IN' };
  }
  return { text: 'Welcome to Howzy.in! How can I help you today?', lang: 'en-IN' };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PanelMode = 'closed' | 'text' | 'voice_overlay' | 'voice_chat';

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
  onLoginClick?: () => void;
}

// ─── Root Widget ──────────────────────────────────────────────────────────────

export default function ClientChatWidget({
  uid, userEmail,
}: Readonly<ClientChatWidgetProps>) {
  const [mode, setMode] = useState<PanelMode>('closed');
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHoldRef = useRef(false);
  const [holdPct, setHoldPct] = useState(0);

  function onPointerDown() {
    didHoldRef.current = false;
    let pct = 0;
    const iv = setInterval(() => {
      pct += 20;
      setHoldPct(Math.min(pct, 100));
    }, 100);
    holdTimerRef.current = setTimeout(() => {
      clearInterval(iv);
      setHoldPct(0);
      didHoldRef.current = true;
      setMode('voice_overlay');
    }, 500);
    (holdTimerRef as any)._iv = iv;
  }

  function onPointerUp() {
    clearInterval((holdTimerRef as any)._iv);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setHoldPct(0);
    if (!didHoldRef.current) setMode('text');
    didHoldRef.current = false;
  }

  return (
    <>
      {/* Floating AI chat button — icon only */}
      <AnimatePresence>
        {mode === 'closed' && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={() => {
              clearInterval((holdTimerRef as any)._iv);
              if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
              setHoldPct(0);
              didHoldRef.current = false;
            }}
            title="Tap to chat · Hold for voice"
            className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl select-none cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-colors"
          >
            {/* Hold-progress ring */}
            {holdPct > 0 && (
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28" cy="28" r="26"
                  fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="3"
                  strokeDasharray={`${holdPct * 1.634} 163.4`}
                  strokeLinecap="round"
                />
              </svg>
            )}
            <Bot className="w-6 h-6 relative z-10" />
            <span className="text-[9px] font-bold tracking-wider relative z-10 leading-none mt-0.5">AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Voice recording overlay (hold gesture) */}
      <AnimatePresence>
        {mode === 'voice_overlay' && (
          <VoiceOverlay
            onConfirm={() => setMode('voice_chat')}
            onCancel={() => setMode('closed')}
          />
        )}
      </AnimatePresence>

      {/* Text chat panel */}
      <AnimatePresence>
        {mode === 'text' && (
          <TextChatPanel
            uid={uid}
            userEmail={userEmail}
            onVoice={() => setMode('voice_overlay')}
            onClose={() => setMode('closed')}
          />
        )}
      </AnimatePresence>

      {/* Voice chat panel */}
      <AnimatePresence>
        {mode === 'voice_chat' && (
          <VoiceChatPanel
            uid={uid}
            userEmail={userEmail}
            onTextMode={() => setMode('text')}
            onClose={() => setMode('closed')}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Voice Overlay (Android Gemini–style hold-to-speak) ──────────────────────

function VoiceOverlay({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const greeting = getNativeGreeting();

  useEffect(() => {
    // Speak the greeting and then transition to voice chat
    speak(greeting.text, greeting.lang).then(() => onConfirm());
    return () => stopSpeaking();
  }, []);

  return (
    <motion.div
      key="voice-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-indigo-950/90 backdrop-blur-md"
      onClick={onCancel}
    >
      {/* Pulsing rings */}
      <div className="relative flex items-center justify-center mb-8">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border-2 border-indigo-400/40"
            animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
            style={{ width: 80, height: 80 }}
          />
        ))}
        <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center shadow-2xl">
          <Mic className="w-9 h-9 text-white" />
        </div>
      </div>

      <p className="text-white text-lg font-semibold text-center px-8 leading-snug">
        {greeting.text}
      </p>
      <p className="text-indigo-300 text-sm mt-3">Tap anywhere to cancel</p>
    </motion.div>
  );
}


// ─── Voice Chat Panel ─────────────────────────────────────────────────────────

function VoiceChatPanel({
  uid, userEmail, onTextMode, onClose,
}: {
  uid?: string;
  userEmail?: string;
  onTextMode: () => void;
  onClose: () => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initSession();
    return () => {
      recRef.current?.abort();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function initSession() {
    try {
      const res = await api.createChatSession();
      setSessionId(res.session_id);
      if (!isMuted) {
        const greeting = getNativeGreeting();
        await speak(greeting.text, greeting.lang);
      }
    } catch {
      setError('Could not start session. Please try again.');
    }
  }

  function startListening() {
    if (!SpeechRec || isProcessing || !sessionId) return;
    recRef.current?.abort();
    const rec = new SpeechRec();
    // Use broad lang so both EN/TE/HI are captured
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = true;
    recRef.current = rec;
    transcriptRef.current = '';
    setTranscript('');
    setIsListening(true);

    rec.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join('');
      setTranscript(t);
      transcriptRef.current = t;
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => {
      setIsListening(false);
      const text = transcriptRef.current.trim();
      if (text) sendVoice(text);
    };
    rec.start();
  }

  function stopListening() {
    recRef.current?.stop();
  }

  async function sendVoice(text: string) {
    if (!sessionId) return;
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    setIsProcessing(true);
    try {
      const res = await api.sendChatMessage(sessionId, text);
      const aiMsg: ChatMessage = {
        role: 'model',
        content: res.reply,
        timestamp: new Date().toISOString(),
        tool_results: res.tool_results,
      };
      setMessages((p) => [...p, aiMsg]);
      if (!isMuted) {
        const responseLang = detectLang(res.reply);
        await speak(res.reply, responseLang);
      }
    } catch {
      setError('Failed to get a response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <PanelShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white shrink-0">
        <div className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-full">
          <Mic className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Voice Chat</p>
          <p className="text-indigo-200 text-xs truncate">{userEmail ?? 'Howzy.in Property Search'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="p-1.5 hover:bg-white/20 rounded-lg"
            title={isMuted ? 'Unmute' : 'Mute AI voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onTextMode}
            className="p-1.5 hover:bg-white/20 rounded-lg"
            title="Switch to text chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!hasMessages && !sessionId && (
          <div className="flex-1 flex flex-col items-center justify-center h-full gap-3 py-10">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            <p className="text-sm text-slate-500">Starting session…</p>
          </div>
        )}
        {!hasMessages && sessionId && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-10 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
              <Mic className="w-8 h-8 text-indigo-500" />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-[220px]">
              Hold the mic button and describe what property you're looking for.
            </p>
            <p className="text-xs text-slate-400">Telugu · Hindi · English supported</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {isProcessing && <TypingIndicator />}
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        <div ref={messagesEndRef} />
      </div>

      {/* Live transcript bubble */}
      {isListening && (
        <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 shrink-0">
          <p className="text-xs text-red-600 font-medium mb-0.5">🎙 Listening…</p>
          <p className="text-sm text-slate-700 italic min-h-[1.2em]">{transcript || '…'}</p>
        </div>
      )}

      {/* Mic button */}
      <div className="px-4 py-4 border-t border-slate-100 flex flex-col items-center gap-2 shrink-0">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onPointerDown={startListening}
          onPointerUp={stopListening}
          onPointerLeave={stopListening}
          disabled={isProcessing || !sessionId}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            isListening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white`}
        >
          {isProcessing
            ? <Loader2 className="w-7 h-7 animate-spin" />
            : isListening
              ? <MicOff className="w-7 h-7" />
              : <Mic className="w-7 h-7" />
          }
        </motion.button>
        <p className="text-xs text-slate-400 font-medium">
          {isListening ? 'Release to send' : isProcessing ? 'Processing…' : 'Hold to speak'}
        </p>
        {!SpeechRec && (
          <p className="text-xs text-amber-600 font-medium">⚠ Voice not supported — use text mode</p>
        )}
      </div>
    </PanelShell>
  );
}

// ─── Text Chat Panel ──────────────────────────────────────────────────────────

function TextChatPanel({
  uid, userEmail, onVoice, onClose,
}: {
  uid?: string;
  userEmail?: string;
  onVoice: () => void;
  onClose: () => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    if (sessionId) setTimeout(() => inputRef.current?.focus(), 300);
  }, [sessionId]);

  async function startSession() {
    setSessionLoading(true);
    setError(null);
    try {
      const res = await api.createChatSession();
      setSessionId(res.session_id);
      setMessages([]);
    } catch {
      setError('Could not start chat. Please try again.');
    } finally {
      setSessionLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !sessionId || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const res = await api.sendChatMessage(sessionId, userMsg.content);
      setMessages((p) => [...p, {
        role: 'model', content: res.reply,
        timestamp: new Date().toISOString(), tool_results: res.tool_results,
      }]);
    } catch {
      setError('Failed to send. Please try again.');
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
          {sessionId && (
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
      ) : error && !sessionId ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={startSession} className="text-sm font-semibold text-indigo-600 hover:underline">Retry</button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <WelcomeMessage />
            )}
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
      className="fixed bottom-6 right-6 z-[200] w-[92vw] max-w-sm h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
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
