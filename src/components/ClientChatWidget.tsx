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

/** Escape a string for inclusion inside SSML (&, <, >, ", '). */
function escapeSsml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build SSML with an Indian-English conversational cadence:
 *  • longer pauses after full stops / question marks (550ms)
 *  • medium pauses after commas / semicolons (280ms)
 *  • slight pitch lift + slightly slower rate for a warm, friendly tone
 *  • currency / sqft expansion so the voice says them naturally
 */
function buildIndianSsml(text: string): string {
  let t = escapeSsml(text.trim());
  // Natural Indian phrasing for common real-estate shorthand.
  t = t
    .replace(/\bBHK\b/g, '<sub alias="B H K">BHK</sub>')
    .replace(/\bsq\s*ft\b/gi, 'square feet')
    .replace(/\bsqft\b/gi, 'square feet')
    .replace(/\u20B9\s*/g, 'rupees ')
    .replace(/\bRs\.?\s*/g, 'rupees ')
    .replace(/\bCr\b/g, 'crore')
    .replace(/\bLakh?s?\b/gi, 'lakhs');
  // Insert breaks after punctuation for conversational pacing.
  t = t
    .replace(/([.!?])\s+/g, '$1<break time="550ms"/> ')
    .replace(/([,;:])\s+/g, '$1<break time="280ms"/> ');
  // Warm, friendly Indian advisor tone: slight pitch lift, medium rate.
  return `<speak><prosody rate="96%" pitch="+1st">${t}</prosody></speak>`;
}

/**
 * Speak text using Google Cloud TTS Neural2 voice.
 * Uses the user-selected voice; falls back to browser TTS if backend fails.
 */
async function speak(text: string, lang = 'en-IN'): Promise<void> {
  const voice = getSelectedVoice();
  const effectiveLang = lang !== 'en-IN' ? lang : voice.lang;
  const voiceName = lang !== 'en-IN' ? undefined : voice.voiceName;
  const ssml = buildIndianSsml(text);
  try {
    const { audioContent } = await api.textToSpeech(text, effectiveLang, voiceName, {
      ssml,
      speakingRate: 0.96,
      pitch: 1.5,
    });
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

/** Localised assistant messages — each entry carries a display variant (shown
 *  in the chat bubble) and a TTS variant (pronounceable for Neural2). Adding
 *  a new phrase only requires adding a row here. */
type SpokenMessage = { display: string; speakText: string; lang: string };
type MessageKey = 'greeting' | 'unrecognizable';
type LangKey = 'te' | 'hi' | 'ta' | 'en';

const ASSISTANT_MESSAGES: Record<LangKey, Record<MessageKey, SpokenMessage>> = {
  te: {
    greeting: {
      display: 'హలో, శుభదినం! Howzy AI ఏజెంట్‌కు స్వాగతం. మీకు సరైన ఆస్తిని కనుగొనడంలో నేను సహాయం చేస్తాను. ఎలాంటి ఆస్తి కావాలో చెప్పండి!',
      speakText: 'హలో, శుభదినం! హౌజీ ఏఐ ఏజెంట్‌కు స్వాగతం. మీకు సరైన ఆస్తిని కనుగొనడంలో నేను సహాయం చేస్తాను. ఎలాంటి ఆస్తి కావాలో చెప్పండి!',
      lang: 'te-IN',
      },
    unrecognizable: {
      display: 'క్షమించండి, నేను సరిగ్గా వినలేకపోయాను. దయచేసి చాట్‌ను ఉపయోగించండి లేదా అప్లికేషన్‌ను ఎక్స్‌ప్లోర్ చేయండి.',
      speakText: 'ಕ್ಷಮಿಂಚಂಡಿ, ಮீ ಘ್ವರ் ಮ௃ಗ் ನಾಕு ಅರ்థಮಗಲேದு. ದಯವ்ಚேಸಿ ಚಾಟ் ನೆ್ ಉಪಯோಗಿಂಚಂಡಿ ಲேದಾ ಅಪ்ಲಿಕேಶನ்ನு ಎಕ್ಸ್ಪ்ಲோರ் ಚேಯಂಡಿ.',
      lang: 'te-IN',
      },
  },
  hi: {
    greeting: {
      display: 'नमस्ते, आपका दिन शुभ हो! Howzy AI एजेंट में आपका स्वागत है। मैं आपके लिए सही प्रॉपर्टी ढूँढने में मदद करूँगी। बताइए, कैसी प्रॉपर्टी चाहिए?',
      speakText: 'नमस्ते, आपका दिन शुभ हो! Howzy ए आई एजेंट में आपका स्वागत है। मैं आपके लिए सही प्रॉपर्टी ढूँढने में मदद करूँगी। बताइए, कैसी प्रॉपर्टी चाहिए?',
      lang: 'hi-IN',
      },
    unrecognizable: {
      display: 'माफ कीजिए, मैं आपको समझ नहीं सकी। कृपया चैट का उपयोग करें या आवेदन को एक्सप्लोर करें।',
      speakText: 'माफ कीजिए, मैं आपको समझ नहीं सकी। कृपया चैट का उपयोग करें या आवेदन को एक्सप्लोर करें।',
      lang: 'hi-IN',
      },
  },
  ta: {
    greeting: {
      display: 'வணக்கம், இனிய நாள்! Howzy AI முகவருக்கு வரவேற்கிறோம். உங்களுக்கு சரியான சொத்தை கண்டுபிடிக்க நான் உதவுகிறேன். எப்படிப்பட்ட சொத்து வேண்டும் சொல்லுங்கள்!',
      speakText: 'வணக்கம், இனிய நாள்! ஹௌஸி ஏஐ முகவருக்கு வரவேற்கிறோம். உங்களுக்கு சரியான சொத்தை கண்டுபிடிக்க நான் உதவுகிறேன். எப்படிப்பட்ட சொத்து வேண்டும் சொல்லுங்கள்!',
      lang: 'ta-IN',
      },
    unrecognizable: {
      display: 'மன்னிக்கவும், நான் தெளிவாக கேடக்கவில்லை. தயவுசெய்து சாட்டை பயன்படுத்துங்கள் அல்லது பயன்பாட்டை ஆராயுங்கள்.',
      speakText: 'மன்னிக்கவும், நான் தெளிவாக கேடக்கவில்லை. தயவுசெய்து சாட்டை பயன்படுத்துங்கள் அல்லது பயன்பாட்டை ஆராயுங்கள்.',
      lang: 'ta-IN',
      },
  },
  en: {
    greeting: {
      display: 'Hello, good day! Welcome to the Howzy AI agent — I\u2019m here to help you find the right property. So, tell me what you\u2019re looking for!',
      speakText: 'Hello, good day! Welcome to the Howzy AI agent. I\u2019m here to help you find the right property. So, tell me what you\u2019re looking for!',
      lang: 'en-IN',
      },
    unrecognizable: {
      display: 'Sorry, I couldn’t catch that. Please use the chat or explore the application.',
      speakText: 'Sorry, I couldn’t catch that. Please use the chat, or explore the application.',
      lang: 'en-IN',
      },
  },
};

function detectLocaleKey(): LangKey {
  const locale = (typeof navigator !== 'undefined' && navigator.language) || 'en';
  if (locale.startsWith('te')) return 'te';
  if (locale.startsWith('hi')) return 'hi';
  if (locale.startsWith('ta')) return 'ta';
  return 'en';
}

/** Look up a localised assistant message (greeting, apology, …). */
function getAssistantMessage(key: MessageKey): SpokenMessage {
  return ASSISTANT_MESSAGES[detectLocaleKey()][key];
}

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
  // True once the greeting has played in this mount; we only greet on the
  // very first hold so the conversation feels natural afterwards.
  const hasGreetedRef = useRef(initialMessages.length > 0);
  // Visible recording state drives the floating voice-recorder indicator.
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recTimerRef = useRef<number | null>(null);

  function startRecordingUI() {
    setIsRecording(true);
    setRecSeconds(0);
    if (recTimerRef.current) window.clearInterval(recTimerRef.current);
    recTimerRef.current = window.setInterval(() => {
      setRecSeconds((s) => s + 1);
    }, 1000);
  }

  function stopRecordingUI() {
    setIsRecording(false);
    if (recTimerRef.current) {
      window.clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
  }

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
      if (recTimerRef.current) window.clearInterval(recTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push-to-talk: start recording when the parent signals a hold start.
  useEffect(() => {
    if (holdStartSignal && holdStartSignal > 0) void beginPTT();
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

  /** Start a push-to-talk recording session. Runs until endPTT() is called.
   *  On the very first hold we play an enthusiastic greeting before opening
   *  the mic — so the user hears Howzy welcome them, then speaks. */
  const beginPTT = useCallback(async () => {
    if (!SpeechRec || !mountedRef.current) return;
    // Interrupt any ongoing TTS so the user is heard immediately.
    stopSpeaking();
    // If a previous recognizer is still alive, abort it without sending.
    recRef.current?.abort();

    // Mark the hold active up-front, so endPTT() during the greeting will
    // cancel the mic-start and stop speech.
    pttActiveRef.current = true;

    const session = sessionRef.current;
    if (!session) {
      // Session not ready yet — create one and re-enter once ready.
      pttActiveRef.current = false;
      await initSession();
      if (mountedRef.current && sessionRef.current) void beginPTT();
      return;
    }

    // First hold of this mount → greet before listening.
    if (!hasGreetedRef.current) {
      hasGreetedRef.current = true;
      const greeting = getAssistantMessage('greeting');
      addMessage({ role: 'model', content: greeting.display, timestamp: new Date().toISOString() });
      try {
        await speak(greeting.speakText, greeting.lang);
      } catch {
        // TTS failed — fall through silently.
      }
      if (!mountedRef.current) return;
      // After the greeting we ALWAYS open the mic so the user can reply
      // conversationally — even if they let go of the button while we were
      // speaking. The recognizer will idle until they speak.
      pttActiveRef.current = true;
    }

    const rec = new SpeechRec();
    rec.lang = 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    recRef.current = rec;
    transcriptRef.current = '';

    rec.onresult = (e: any) => {
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('');
      transcriptRef.current = t;
    };
    rec.onerror = (e: any) => {
      if (!mountedRef.current) return;
      pttActiveRef.current = false;
      stopRecordingUI();
      // Benign interruptions — ignore so the user can try again.
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      // Real recognition failure — apologise in the user’s language, then
      // escalate to text chat so they aren’t stuck.
      void apologiseAndFallback();
    };
    rec.onend = () => {
      if (!mountedRef.current) return;
      const wasActive = pttActiveRef.current;
      pttActiveRef.current = false;
      stopRecordingUI();
      const text = transcriptRef.current.trim();
      if (!wasActive) return;
      if (text) {
        void sendVoice(text, session);
      } else {
        // User held + released but nothing intelligible was captured —
        // tell them we couldn’t understand and open the chat panel.
        void apologiseAndFallback();
      }
    };
    try {
      rec.start();
      startRecordingUI();
    } catch {
      // Already started — ignore.
    }
  }, []);

  /** Stop the push-to-talk recorder; onend will send the captured transcript.
   *  Also cancels any in-flight greeting so the mic never opens for a hold
   *  that the user already released. */
  const endPTT = useCallback(() => {
    if (!pttActiveRef.current) return;
    pttActiveRef.current = false;
    // Interrupt greeting / response playback the moment the user lets go.
    stopSpeaking();
    try {
      recRef.current?.stop();
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

  /** Speak a polite \u201cI couldn\u2019t catch that\u201d message in the user\u2019s language,
   *  then open the text chat panel so they can continue in writing or explore
   *  the application manually. Used when speech recognition fails. */
  async function apologiseAndFallback() {
    if (!mountedRef.current) return;
    const msg = getAssistantMessage('unrecognizable');
    addMessage({ role: 'model', content: msg.display, timestamp: new Date().toISOString() });
    try {
      await speak(msg.speakText, msg.lang);
    } catch {
      // TTS failed — still fall back so user isn\u2019t stuck.
    }
    if (!mountedRef.current) return;
    onTextFallback();
  }

  // While the mic is actively listening we show a floating voice-recorder
  // indicator (red pulse + mm:ss + animated waveform bars). Otherwise this
  // widget stays headless — the AI button in the header/footer is the only
  // visible control.
  return (
    <AnimatePresence>
      {isRecording && <RecordingIndicator seconds={recSeconds} />}
    </AnimatePresence>
  );
}

// ─── Recording Indicator ─────────────────────────────────────────────────────

function RecordingIndicator({ seconds }: Readonly<{ seconds: number }>) {
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  // Fixed per-bar animation delays — visually mimics a voice recorder waveform.
  const barDelays = [0, 120, 60, 180, 90, 150, 30];
  return (
    <motion.div
      key="rec-indicator"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-10 z-[250] pointer-events-none"
      role="status"
      aria-live="polite"
      aria-label={`Recording, ${seconds} seconds`}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md text-white rounded-full shadow-2xl border border-white/10">
        {/* Pulsing red dot */}
        <span className="relative flex w-2.5 h-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        {/* Label */}
        <span className="text-xs font-semibold tracking-wide uppercase text-red-300">Rec</span>
        {/* Timer */}
        <span className="text-sm font-mono tabular-nums text-white/90">{mm}:{ss}</span>
        {/* Waveform bars */}
        <div className="flex items-center gap-[3px] h-5">
          {barDelays.map((delay, i) => (
            <span
              key={i}
              className="w-[3px] bg-gradient-to-t from-red-400 to-red-200 rounded-full animate-howzy-wave"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        {/* Mic icon */}
        <Mic className="w-4 h-4 text-red-300" />
      </div>
      {/* Scoped keyframes for the waveform bars. */}
      <style>{`
        @keyframes howzy-wave {
          0%, 100% { height: 25%; }
          20%      { height: 85%; }
          40%      { height: 45%; }
          60%      { height: 100%; }
          80%      { height: 60%; }
        }
        .animate-howzy-wave {
          animation: howzy-wave 0.9s ease-in-out infinite;
          height: 25%;
        }
      `}</style>
    </motion.div>
  );
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
