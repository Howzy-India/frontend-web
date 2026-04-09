/**
 * ClientChatWidget — Floating AI assistant for the client portal.
 *
 * Interaction:
 *   • Tap  → opens text-chat panel
 *   • Hold (≥500 ms) → enters voice mode
 *
 * Voice-login wizard (when not signed in):
 *   ask_phone → listen_phone → sending_otp → ask_otp → listen_otp →
 *   verifying → (new user?) ask_name → listen_name → ask_prefs →
 *   listen_prefs → saving → done
 *
 * Voice-chat panel (when signed in):
 *   Hold mic → STT → send to Gemini backend → TTS response
 *   Language auto-detected from AI reply (Telugu / Hindi / English)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Bot, Loader2, Mic, MicOff, Send, RefreshCw,
  MapPin, Tag, Volume2, VolumeX, MessageSquare,
  Phone, Shield, ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getClientProfile, saveClientProfile } from '../hooks/useClientProfile';
import type { LookingFor } from '../hooks/useClientProfile';

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

/** Convert spoken words/digits into a digit-only string. */
function extractDigits(text: string): string {
  const words: Record<string, string> = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    oh: '0', o: '0',
  };
  let r = text.toLowerCase();
  for (const [w, d] of Object.entries(words)) {
    r = r.replace(new RegExp(`\\b${w}\\b`, 'g'), d);
  }
  return r.replace(/\D/g, '');
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PanelMode = 'closed' | 'text' | 'voice_login' | 'voice_chat';

type LoginStep =
  | 'ask_phone' | 'listen_phone' | 'sending_otp'
  | 'ask_otp'   | 'listen_otp'   | 'verifying'
  | 'check_profile'
  | 'ask_name'  | 'listen_name'
  | 'ask_prefs' | 'listen_prefs' | 'saving'
  | 'done';

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
  uid, userEmail, onLoginClick,
}: Readonly<ClientChatWidgetProps>) {
  const [mode, setMode] = useState<PanelMode>('closed');
  const [loginDone, setLoginDone] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHoldRef = useRef(false);
  const [holdPct, setHoldPct] = useState(0);

  // After OTP verified + profile saved → transition to voice_chat
  useEffect(() => {
    if (uid && mode === 'voice_login' && loginDone) {
      setMode('voice_chat');
      setLoginDone(false);
    }
  }, [uid, mode, loginDone]);

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
      setMode(uid ? 'voice_chat' : 'voice_login');
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
      {/* Hidden reCAPTCHA anchor required by Firebase phone auth */}
      <div id="voice-rc" className="hidden" />

      {/* Floating button */}
      <AnimatePresence>
        {mode === 'closed' && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.07 }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={() => {
              clearInterval((holdTimerRef as any)._iv);
              if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
              setHoldPct(0);
              didHoldRef.current = false;
            }}
            title="Tap to chat · Hold for voice"
            className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-2xl select-none cursor-pointer overflow-hidden"
          >
            {/* Hold-progress ring */}
            {holdPct > 0 && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="48"
                  fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="4"
                  strokeDasharray={`${holdPct * 3.016} 301.6`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
            )}
            <Mic className="w-5 h-5 relative z-10" />
            <span className="text-sm font-bold hidden sm:inline relative z-10">AI Assistant</span>
            {/* Pulse dot */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Text chat panel */}
      <AnimatePresence>
        {mode === 'text' && (
          <TextChatPanel
            uid={uid}
            userEmail={userEmail}
            onLoginClick={onLoginClick}
            onVoice={() => setMode(uid ? 'voice_chat' : 'voice_login')}
            onClose={() => setMode('closed')}
          />
        )}
      </AnimatePresence>

      {/* Voice login wizard */}
      <AnimatePresence>
        {mode === 'voice_login' && (
          <VoiceLoginWizard
            onDone={() => setLoginDone(true)}
            onTextMode={() => setMode('text')}
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

// ─── Voice Login Wizard ───────────────────────────────────────────────────────

function VoiceLoginWizard({
  onDone, onTextMode, onClose,
}: {
  onDone: () => void;
  onTextMode: () => void;
  onClose: () => void;
}) {
  const { sendOtp, verifyOtp, otpLoading } = useAuth();
  const [step, setStep] = useState<LoginStep>('ask_phone');
  const [status, setStatus] = useState('Say your 10-digit mobile number');
  const [subtext, setSubtext] = useState('Hold the mic button and speak clearly');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lang] = useState('en-IN');
  const recRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');
  const phoneRef = useRef('');
  const uidRef = useRef('');
  const nameRef = useRef('');

  // Speak the prompt for the current step whenever step changes
  useEffect(() => {
    if (['sending_otp', 'verifying', 'check_profile', 'saving', 'done'].includes(step)) return;
    const prompts: Partial<Record<LoginStep, string>> = {
      ask_phone: 'Hold the mic and say your 10 digit mobile number.',
      ask_otp: 'Hold the mic and say the 6 digit O T P sent to your mobile.',
      ask_name: "You're a new user! Hold the mic and tell me your name.",
      ask_prefs: 'What type of property are you looking for? Say new projects, plots, farm lands, resale, or commercial.',
    };
    const text = prompts[step];
    if (text) {
      setIsSpeaking(true);
      speak(text, lang).then(() => setIsSpeaking(false));
    }
  }, [step]);

  function startListening(onFinal: (text: string) => void) {
    if (!SpeechRec) {
      onFinal('');
      return;
    }
    recRef.current?.abort();
    const rec = new SpeechRec();
    rec.lang = lang;
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
    rec.onerror = () => { setIsListening(false); };
    rec.onend = () => {
      setIsListening(false);
      const final = transcriptRef.current.trim();
      if (final) onFinal(final);
    };
    rec.start();
  }

  function stopListening() {
    recRef.current?.stop();
  }

  async function handlePhone(text: string) {
    const digits = extractDigits(text);
    const phone10 = digits.length >= 10 ? digits.slice(-10) : digits;
    if (phone10.length !== 10) {
      setStatus('Could not catch that — try again');
      setSubtext(`I heard: "${text}"`);
      await speak('I could not get your number. Please try again.', lang);
      setStep('ask_phone');
      return;
    }
    phoneRef.current = phone10;
    setStatus(`Sending OTP to +91 ${phone10}…`);
    setSubtext('Please wait');
    setStep('sending_otp');
    await speak(`Sending OTP to ${phone10.split('').join(' ')}.`, lang);
    try {
      await sendOtp(`+91${phone10}`, 'voice-rc');
      setStatus('OTP sent!');
      setSubtext(`Check messages on +91 ${phone10}`);
      setStep('ask_otp');
    } catch {
      await speak('Failed to send OTP. Please try again.', lang);
      setStep('ask_phone');
    }
  }

  async function handleOtp(text: string) {
    const otp = extractDigits(text).slice(0, 6);
    if (otp.length < 4) {
      await speak('Please say the 6 digit OTP again.', lang);
      setStep('ask_otp');
      return;
    }
    setStatus('Verifying OTP…');
    setSubtext('Please wait');
    setStep('verifying');
    try {
      const authUser = await verifyOtp(otp);
      uidRef.current = authUser.uid;
      setStep('check_profile');
      const profile = await getClientProfile(authUser.uid).catch(() => null);
      if (!profile?.name) {
        setStatus("What's your name?");
        setSubtext('Hold the mic and introduce yourself');
        setStep('ask_name');
      } else {
        setStatus(`Welcome back, ${profile.name}!`);
        setSubtext('Starting your property search…');
        await speak(`Welcome back ${profile.name}! Let me help you find the perfect property.`, lang);
        setStep('done');
        onDone();
      }
    } catch {
      await speak('OTP verification failed. Please say your OTP again.', lang);
      setStep('ask_otp');
    }
  }

  async function handleName(text: string) {
    const name = text.trim().replace(/^(my name is|i am|i'm)\s*/i, '').trim();
    if (!name) {
      await speak("I didn't catch your name. Please try again.", lang);
      setStep('ask_name');
      return;
    }
    nameRef.current = name;
    await speak(`Nice to meet you ${name}!`, lang);
    setStatus('What are you looking for?');
    setSubtext('Say: new projects, plots, farm lands, resale, or commercial');
    setStep('ask_prefs');
  }

  async function handlePrefs(text: string) {
    const lower = text.toLowerCase();
    const prefs: LookingFor[] = [];
    if (lower.includes('farm') || lower.includes('land')) prefs.push('Lands');
    if (lower.includes('villa')) prefs.push('Villas');
    if (lower.includes('plot') || lower.includes('open plot')) prefs.push('Lands');
    if (lower.includes('resale') || lower.includes('re sale')) prefs.push('ReSale Properties');
    if (lower.includes('commercial') || lower.includes('office') || lower.includes('shop')) prefs.push('Commercial Properties');
    if (lower.includes('new') || lower.includes('apartment') || lower.includes('flat') || lower.includes('project')) prefs.push('New Property');
    const finalPrefs = prefs.length > 0 ? prefs : (['New Property'] as LookingFor[]);

    setStatus('Saving your profile…');
    setSubtext('Almost done!');
    setStep('saving');
    try {
      await saveClientProfile(uidRef.current, {
        uid: uidRef.current,
        name: nameRef.current,
        phone: phoneRef.current,
        email: '',
        lookingFor: finalPrefs,
        contactTime: 'Anytime',
      });
    } catch { /* non-critical */ }

    setStatus(`All set, ${nameRef.current}!`);
    setSubtext('Starting your property search…');
    await speak(`You are all set ${nameRef.current}! Let me help you find the perfect property.`, lang);
    setStep('done');
    onDone();
  }

  const isProcessing = ['sending_otp', 'verifying', 'check_profile', 'saving'].includes(step);
  const isListenStep = ['ask_phone', 'ask_otp', 'ask_name', 'ask_prefs'].includes(step);

  const stepIcon: Partial<Record<LoginStep, React.ReactNode>> = {
    ask_phone: <Phone className="w-6 h-6" />,
    sending_otp: <Loader2 className="w-6 h-6 animate-spin" />,
    ask_otp: <Shield className="w-6 h-6" />,
    ask_name: <Bot className="w-6 h-6" />,
    ask_prefs: <Bot className="w-6 h-6" />,
    verifying: <Loader2 className="w-6 h-6 animate-spin" />,
    saving: <Loader2 className="w-6 h-6 animate-spin" />,
    done: <Bot className="w-6 h-6" />,
  };

  return (
    <PanelShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white shrink-0">
        <div className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-full">
          <Mic className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">Voice Assistant</p>
          <p className="text-indigo-200 text-xs">Telugu · Hindi · English</p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
        {/* Step icon ring */}
        <div className={`relative w-20 h-20 flex items-center justify-center rounded-full ${isListening ? 'bg-red-100' : 'bg-indigo-100'} transition-colors`}>
          <div className={`text-${isListening ? 'red' : 'indigo'}-600`}>
            {stepIcon[step] ?? <Bot className="w-6 h-6" />}
          </div>
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping" />
              <span className="absolute -inset-2 rounded-full border-2 border-red-400 opacity-40 animate-ping" style={{ animationDelay: '200ms' }} />
            </>
          )}
          {isSpeaking && (
            <span className="absolute -inset-1 rounded-full border-2 border-indigo-400 opacity-50 animate-ping" />
          )}
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="font-bold text-slate-800 text-base leading-tight">{status}</p>
          <p className="text-slate-500 text-sm mt-1 leading-snug">{subtext}</p>
        </div>

        {/* Live transcript */}
        {isListening && transcript && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full text-center">
            <p className="text-sm text-slate-700 italic">"{transcript}"</p>
          </div>
        )}

        {/* Mic hold button */}
        {isListenStep && !isProcessing && (
          <div className="flex flex-col items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.93 }}
              onPointerDown={() => startListening(
                step === 'ask_phone' ? handlePhone :
                step === 'ask_otp' ? handleOtp :
                step === 'ask_name' ? handleName : handlePrefs
              )}
              onPointerUp={stopListening}
              onPointerLeave={stopListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white`}
            >
              {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </motion.button>
            <p className="text-xs text-slate-400 font-medium">
              {isListening ? 'Listening… release when done' : 'Hold to speak'}
            </p>
          </div>
        )}

        {isProcessing && (
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
        <button
          onClick={onTextMode}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Use text instead
        </button>
        {!SpeechRec && (
          <p className="text-xs text-amber-600 font-medium">⚠ Voice not supported in this browser</p>
        )}
      </div>
    </PanelShell>
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
    if (uid) initSession();
    return () => {
      recRef.current?.abort();
      stopSpeaking();
    };
  }, [uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function initSession() {
    try {
      const res = await api.createChatSession();
      setSessionId(res.session_id);
      if (!isMuted) {
        await speak('Hello! Hold the mic button and tell me what property you are looking for. I understand Telugu, Hindi and English.', 'en-IN');
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
          <p className="text-indigo-200 text-xs truncate">{userEmail ?? 'Property search'}</p>
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
  uid, userEmail, onLoginClick, onVoice, onClose,
}: {
  uid?: string;
  userEmail?: string;
  onLoginClick?: () => void;
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
  const isLoggedIn = !!uid;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isLoggedIn && !sessionId) startSession();
  }, [isLoggedIn]);

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
          {isLoggedIn && sessionId && (
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
      {!isLoggedIn ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
            <Bot className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <p className="font-bold text-slate-800 mb-1">Sign in to chat</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Login to search properties and get AI-powered recommendations in your language.
            </p>
          </div>
          <button
            onClick={() => { onClose(); onLoginClick?.(); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            Login / Sign Up
          </button>
          <button
            onClick={onVoice}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:underline font-medium"
          >
            <Mic className="w-4 h-4" />
            Or use voice sign-in
          </button>
        </div>
      ) : sessionLoading ? (
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
              <WelcomeMessage name={userEmail?.split('@')[0] ?? 'there'} />
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

function WelcomeMessage({ name }: { name: string }) {
  return (
    <div className="flex gap-2">
      <div className="flex items-center justify-center w-7 h-7 bg-indigo-100 rounded-full shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="bg-indigo-50 rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[85%]">
        <p className="text-sm text-slate-800 leading-relaxed">
          Hi <span className="font-semibold capitalize">{name}</span>! 👋 I'm your Howzy assistant.
        </p>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          Tell me what property you're looking for — I understand Telugu, Hindi &amp; English.
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
