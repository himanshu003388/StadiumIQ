import React, { memo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../utils/styles';

// Check browser support for Speech Recognition
const SpeechRecognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const LANG_BCP47 = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  ar: 'ar-SA',
  pt: 'pt-BR',
  ja: 'ja-JP',
  hi: 'hi-IN',
};

const ChatInput = memo(function ChatInput({
  input,
  setInput,
  handleSend,
  isLoading,
  language,
  inputRef,
}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Toggle voice input using Web Speech API
   * Allows fans in noisy stadium environments to speak their question
   */
  const toggleVoiceInput = useCallback(() => {
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANG_BCP47[language] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript).slice(0, 2000));
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, language, setInput]);

  return (
    <div
      className="shrink-0 p-4 border-t"
      style={{ backgroundColor: COLORS.surfaceContainerLowest, borderColor: COLORS.outlineVariant }}
    >
      <label htmlFor="ai-chat-input" className="sr-only">
        {language === 'en' ? 'Message Stadium IQ' : 'Mensaje'}
      </label>
      <div className="relative flex items-end gap-2">
        <textarea
          id="ai-chat-input"
          ref={inputRef}
          aria-describedby="chat-input-help"
          value={input}
          onChange={(e) => {
            if (e.target.value.length <= 2000) setInput(e.target.value);
          }}
          onKeyDown={handleKey}
          placeholder={language === 'en' ? 'Ask Stadium IQ...' : 'Escriba su mensaje...'}
          aria-label={language === 'en' ? 'Type your message to Stadium IQ' : 'Escriba su mensaje'}
          className="w-full rounded-2xl px-4 py-3 pr-24 text-sm resize-none focus:ring-2 focus:ring-blue-500 custom-scrollbar shadow-sm transition-all"
          style={{
            backgroundColor: COLORS.surfaceContainer,
            color: COLORS.onSurface,
            border: `1.5px solid ${COLORS.primaryContainer}`,
            boxShadow: `0 4px 16px ${COLORS.primaryContainer}15`,
            minHeight: '52px',
            maxHeight: '120px',
          }}
          rows={1}
          maxLength={2000}
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          {/* Voice Input Button — for stadium noise conditions */}
          {SpeechRecognition && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              aria-pressed={isListening}
              title={isListening ? 'Listening... click to stop' : 'Speak your question'}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
              style={{
                background: isListening ? COLORS.error : COLORS.surfaceContainerHigh,
                color: isListening ? 'white' : COLORS.outline,
                animation: isListening ? 'pulse 1s infinite' : 'none',
              }}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-sm icon-fill">
                {isListening ? 'mic' : 'mic_none'}
              </span>
            </button>
          )}
          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-105"
            style={{
              background: input.trim() ? COLORS.primary : COLORS.surfaceContainerHigh,
              color: input.trim() ? COLORS.onPrimary : COLORS.outline,
            }}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-sm icon-fill">
              send
            </span>
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2">
        <p id="chat-input-help" className="text-xs" style={{ color: COLORS.outline }}>
          {SpeechRecognition
            ? 'Press Enter to send · Shift+Enter for new line · 🎤 voice input available'
            : 'Press Enter to send · Shift+Enter for new line'}
        </p>
        <span
          className="text-xs"
          style={{
            color: input.length > 1800 ? COLORS.warning : COLORS.outline,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {input.length}/2000
        </span>
      </div>
    </div>
  );
});

ChatInput.propTypes = {
  input: PropTypes.string.isRequired,
  setInput: PropTypes.func.isRequired,
  handleSend: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  language: PropTypes.string.isRequired,
  inputRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
};

export default ChatInput;
