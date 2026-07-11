import React, { useState, useRef, useEffect, memo } from 'react';
import { useStadiumContext } from '../context/StadiumContext';
import { useAppContext } from '../context/AppContext';
import { useGemini } from '../hooks/useGemini';
import { COLORS, QUICK_PROMPTS } from '../utils/styles';
import LanguageSelector from './LanguageSelector';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

function AIAssistant() {
  const { contextData } = useStadiumContext();
  const { setUiLanguage } = useAppContext();
  const { messages, isLoading, language, setLanguage, sendMessage } = useGemini(contextData);
  const [origin, setOrigin] = useState('Morocco');
  const [tone, setTone] = useState('Culturally Adapted');
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync AI language selection to global html lang attribute
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setUiLanguage(lang);
  };

  useEffect(() => {
    const el = messagesEndRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input, { origin, tone });
      setInput('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] p-4 md:p-6 flex flex-col">
      <div
        className="flex-1 flex flex-col rounded-2xl md:rounded-3xl overflow-hidden shadow-lg"
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.outlineVariant}`,
        }}
      >
        {/* Panel Header */}
        <div
          className="shrink-0 px-5 py-4 border-b flex items-center gap-3"
          style={{
            background: COLORS.surfaceContainerLowest,
            borderColor: COLORS.outlineVariant,
            boxShadow: '0 2px 8px rgba(11,30,61,0.04)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: COLORS.gradientNavy }}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-white icon-fill">
              smart_toy
            </span>
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ color: COLORS.onSurface }}>
              FIFA World Cup 2026 GenAI Assistant
            </h2>
            <p className="text-xs" style={{ color: COLORS.outline }}>
              Powered by Gemini AI · Multilingual support for all fans & staff
            </p>
          </div>
          <LanguageSelector language={language} setLanguage={handleLanguageChange} />
        </div>

        {/* User Context Settings Toggle */}
        <div
          className="shrink-0 px-5 py-2 border-b flex items-center justify-between text-xs"
          style={{ background: COLORS.surfaceContainerLowest, borderColor: COLORS.outlineVariant }}
        >
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 hover:text-[#3b82f6] font-medium transition-colors"
            style={{ color: COLORS.onSurfaceVariant }}
          >
            <span className="material-symbols-outlined text-sm">settings_accessibility</span>
            <span>
              AI Dialect & Tone Profile: {origin} ({tone})
            </span>
            <span className="material-symbols-outlined text-xs">
              {showSettings ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
        {showSettings && (
          <div
            className="shrink-0 px-5 py-3 border-b flex gap-4 flex-wrap"
            style={{ background: COLORS.surfaceContainerLow, borderColor: COLORS.outlineVariant }}
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor="ai-origin-select"
                className="text-[10px] uppercase font-semibold"
                style={{ color: COLORS.outline }}
              >
                Origin/Dialect Context
              </label>
              <select
                id="ai-origin-select"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="bg-black/10 dark:bg-white/10 rounded-lg p-1 text-xs border border-transparent outline-none focus:border-blue-500"
                style={{ color: COLORS.onSurface }}
              >
                <option value="Morocco">Moroccan (Moroccan Arabic Dialect)</option>
                <option value="Mexico">Mexican (Mexican Spanish Dialect)</option>
                <option value="France">French (Standard French)</option>
                <option value="Saudi Arabia">Arabic (Standard Gulf Dialect)</option>
                <option value="Japan">Japanese (Keigo Formal Register)</option>
                <option value="India">Indian (Hindi/Hinglish Common Dialect)</option>
                <option value="Brazil">Brazilian (Brazilian Portuguese)</option>
                <option value="USA">American (Standard US English)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="ai-tone-select"
                className="text-[10px] uppercase font-semibold"
                style={{ color: COLORS.outline }}
              >
                Tone Register
              </label>
              <select
                id="ai-tone-select"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="bg-black/10 dark:bg-white/10 rounded-lg p-1 text-xs border border-transparent outline-none focus:border-blue-500"
                style={{ color: COLORS.onSurface }}
              >
                <option value="Culturally Adapted">Culturally Adapted (Warm/Polite)</option>
                <option value="Direct & Urgent">Direct & Urgent (Action-oriented)</option>
                <option value="Empathetic">Empathetic (Reassuring/Calm)</option>
                <option value="Formal">Formal (Standard/Professional)</option>
              </select>
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar"
          style={{ background: COLORS.background }}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          aria-relevant="additions"
        >
          {messages.map((msg, i) => (
            <ChatMessage key={msg.id} msg={msg} index={i} contextData={contextData} />
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 animate-fade-in-up">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))',
                }}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-white icon-fill"
                  style={{ fontSize: '14px' }}
                >
                  smart_toy
                </span>
              </div>
              <div className="chat-bubble-ai">
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div
          className="shrink-0 px-4 py-2 overflow-x-auto flex gap-2"
          style={{ background: COLORS.background, borderTop: `1px solid ${COLORS.outlineVariant}` }}
        >
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q.text}
              onClick={() => sendMessage(q.text, { origin, tone })}
              disabled={isLoading}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: COLORS.surfaceContainerLowest,
                border: `1.5px solid ${COLORS.outlineVariant}`,
                color: COLORS.onSurfaceVariant,
                whiteSpace: 'nowrap',
              }}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined"
                style={{ fontSize: '14px', color: COLORS.primaryContainer }}
              >
                {q.icon}
              </span>
              {q.text}
            </button>
          ))}
        </div>

        <ChatInput
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          isLoading={isLoading}
          language={language}
          inputRef={inputRef}
        />
      </div>
    </div>
  );
}

export default memo(AIAssistant);
