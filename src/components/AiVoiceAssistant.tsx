import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Loader2, Bot } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import {
  buildSystemInstruction,
  assistantTitle,
  type AssistantRole,
  type AssistantContext,
} from './aiVoicePrompts';

// Audio utility functions for PCM encoding/decoding
function encodePCM(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodePCM(base64: string): Float32Array {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new DataView(buffer);
  for (let i = 0; i < binary.length; i++) {
    view.setUint8(i, binary.charCodeAt(i));
  }
  const float32Array = new Float32Array(binary.length / 2);
  for (let i = 0; i < float32Array.length; i++) {
    float32Array[i] = view.getInt16(i * 2, true) / 32768;
  }
  return float32Array;
}

interface AiVoiceAssistantProps {
  role?: AssistantRole;
  /** Optional runtime context — passed into the system prompt so replies feel personal. */
  context?: AssistantContext;
}

export default function AiVoiceAssistant({ role = 'partner', context = {} }: AiVoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const initAudio = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        if (!isConnected || !sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const base64Data = encodePCM(inputData);
        sessionRef.current.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };
    } catch (err) {
      console.error("Error initializing audio:", err);
      setError("Microphone access denied or not available.");
      throw err;
    }
  };

  const playAudioQueue = () => {
    if (!audioContextRef.current || playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const audioData = playbackQueueRef.current.shift()!;
    const audioBuffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
    audioBuffer.getChannelData(0).set(audioData);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    const currentTime = audioContextRef.current.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime;
    }

    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;

    source.onended = () => {
      playAudioQueue();
    };
  };

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    setTranscript('');

    try {
      await initAudio();

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  const float32Array = decodePCM(part.inlineData.data);
                  playbackQueueRef.current.push(float32Array);
                  if (!isPlayingRef.current) {
                    playAudioQueue();
                  }
                }
                if (part.text) {
                  setTranscript(prev => prev + part.text);
                }
              }
            }
            if (message.serverContent?.interrupted) {
              playbackQueueRef.current = [];
              nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
            }
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred.");
            disconnect();
          },
          onclose: () => {
            disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            // Zephyr = warm, expressive female voice — matches our enthusiastic sales persona.
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: buildSystemInstruction(role, context),
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Connection failed:", err);
      setIsConnecting(false);
      setError("Failed to connect to AI assistant.");
      disconnect();
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    playbackQueueRef.current = [];
  };

  const toggleAssistant = () => {
    if (isOpen) {
      disconnect();
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <>
      {/* AI Button - Works as navigation item and floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleAssistant}
        className={`fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 -translate-x-1/2 sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 transition-colors ${
          isOpen ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-1/2 -translate-x-1/2 w-[calc(100vw-1.5rem)] max-w-sm sm:bottom-24 sm:right-6 sm:left-auto sm:translate-x-0 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm">
                  {assistantTitle(role)}
                </h3>
                <p className="text-xs text-slate-400">
                  {isConnected ? 'Listening...' : isConnecting ? 'Connecting...' : 'Ready'}
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
              {error ? (
                <div className="text-center text-red-500 text-sm p-4 bg-red-50 rounded-xl">
                  {error}
                </div>
              ) : (
                <>
                  <div className="relative mb-6">
                    <motion.div
                      animate={isSpeaking ? {
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      } : {}}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className={`absolute inset-0 rounded-full blur-xl ${
                        isConnected ? 'bg-indigo-500/30' : 'bg-slate-200'
                      }`}
                    />
                    <button
                      onClick={isConnected ? disconnect : connect}
                      disabled={isConnecting}
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                        isConnected 
                          ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isConnecting ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : isConnected ? (
                        <Mic className="w-8 h-8" />
                      ) : (
                        <MicOff className="w-8 h-8" />
                      )}
                    </button>
                  </div>
                  
                  <p className="text-sm text-slate-500 text-center">
                    {isConnected 
                      ? "I'm listening. How can I help you today?" 
                      : "Tap the microphone to start talking to your AI assistant."}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
