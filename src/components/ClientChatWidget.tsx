import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Bot, Loader2, LogIn, RefreshCw, Home, MapPin, Tag } from 'lucide-react';
import { api } from '../services/api';

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
  details?: {
    location?: string;
    city?: string;
    price?: string;
    budget?: string;
    description?: string;
  };
}

interface ClientChatWidgetProps {
  uid?: string;
  userEmail?: string;
  onLoginClick?: () => void;
}

export default function ClientChatWidget({ uid, userEmail, onLoginClick }: Readonly<ClientChatWidgetProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!uid;

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && isLoggedIn && sessionId) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isLoggedIn, sessionId]);

  // Start a new session when the panel opens and user is logged in
  useEffect(() => {
    if (isOpen && isLoggedIn && !sessionId) {
      startSession();
    }
  }, [isOpen, isLoggedIn]);

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

    const userMsg: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await api.sendChatMessage(sessionId, userMsg.content);
      const aiMsg: ChatMessage = {
        role: 'model',
        content: res.reply,
        timestamp: new Date().toISOString(),
        tool_results: res.tool_results,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    setSessionId(null);
    setMessages([]);
    setError(null);
    startSession();
  }

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-2xl transition-colors ${isOpen ? 'hidden' : 'flex'}`}
        aria-label="Open AI Chat Assistant"
      >
        <Bot className="w-5 h-5" />
        <span className="text-sm font-bold hidden sm:inline">AI Assistant</span>
        {/* Pulse ring */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
        </span>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-[200] w-[92vw] max-w-sm h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white shrink-0">
              <div className="flex items-center justify-center w-9 h-9 bg-white/20 rounded-full">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">Howzy AI Assistant</p>
                <p className="text-indigo-200 text-xs">Property search · Multilingual</p>
              </div>
              <div className="flex items-center gap-1">
                {isLoggedIn && sessionId && (
                  <button
                    onClick={resetChat}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="New conversation"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            {!isLoggedIn ? (
              <LoginPrompt onLoginClick={() => { setIsOpen(false); onLoginClick?.(); }} />
            ) : sessionLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm">Starting your session…</p>
              </div>
            ) : error && !sessionId ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-sm text-red-500">{error}</p>
                <button
                  onClick={startSession}
                  className="text-sm font-semibold text-indigo-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {messages.length === 0 && (
                    <WelcomeMessage userName={userEmail?.split('@')[0] ?? 'there'} />
                  )}
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} msg={msg} />
                  ))}
                  {loading && <TypingIndicator />}
                  {error && (
                    <p className="text-xs text-red-500 text-center">{error}</p>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
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
                      className="flex items-center justify-center w-8 h-8 bg-indigo-600 disabled:bg-slate-300 text-white rounded-lg transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LoginPrompt({ onLoginClick }: { onLoginClick: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
        <Bot className="w-8 h-8 text-indigo-500" />
      </div>
      <div>
        <p className="font-bold text-slate-800 mb-1">Sign in to chat</p>
        <p className="text-sm text-slate-500 leading-relaxed">
          Login to search properties, get personalized recommendations, and speak to our AI assistant in your language.
        </p>
      </div>
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Login / Sign Up
      </button>
    </div>
  );
}

function WelcomeMessage({ userName }: { userName: string }) {
  return (
    <div className="flex gap-2">
      <div className="flex items-center justify-center w-7 h-7 bg-indigo-100 rounded-full shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="bg-indigo-50 rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[85%]">
        <p className="text-sm text-slate-800 leading-relaxed">
          Hi <span className="font-semibold capitalize">{userName}</span>! 👋 I'm your Howzy AI assistant.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed mt-1">
          I can help you find properties, answer questions, and I understand Telugu, Hindi &amp; English. What are you looking for?
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
        <div
          className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-slate-100 text-slate-800 rounded-tl-sm'
          }`}
        >
          {msg.content}
        </div>
        {msg.tool_results && msg.tool_results.length > 0 && (
          <div className="w-full space-y-2">
            {msg.tool_results.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: PropertyResult }) {
  const location = property.details?.location || property.details?.city || '';
  const price = property.details?.price || property.details?.budget || 'Price on Request';
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
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
