/**
 * useGemini — AI chat hook with SSE streaming support
 * Connects to /api/chat/stream for token-by-token rendering,
 * falling back to /api/chat on streaming errors.
 * @module useGemini
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { getDemoResponse } from '../utils/helpers';

/** Maximum number of messages to retain in the chat history */
const MAX_MESSAGES = 100;

/**
 * @typedef {object} ChatMessage
 * @property {string} id - Unique message ID
 * @property {'user'|'ai'} role - Sender role
 * @property {string} text - Message text content
 * @property {Date} timestamp - When the message was created
 * @property {boolean} [isError] - Whether the message represents an error
 * @property {boolean} [isStreaming] - Whether the message is still being streamed
 */

/**
 * Fetch a CSRF token from the server and cache it.
 * @returns {Promise<string>} CSRF token
 */
async function fetchCsrfToken() {
  const res = await fetch('/api/csrf-token', {
    referrerPolicy: 'strict-origin-when-cross-origin',
  });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  return data.csrfToken;
}

/**
 * Consume a Server-Sent Events stream from /api/chat/stream,
 * calling onChunk for each text token and onDone when complete.
 *
 * @param {string} endpoint - SSE endpoint URL
 * @param {object} body - Request body (message, contextData, language)
 * @param {object} headers - Request headers including X-CSRF-Token
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @param {(chunk: string) => void} onChunk - Called with each streamed token
 * @param {() => void} onDone - Called when stream is complete
 * @returns {Promise<void>}
 */
async function consumeSSEStream(endpoint, body, headers, signal, onChunk, onDone) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
    referrerPolicy: 'strict-origin-when-cross-origin',
  });

  if (!res.ok) {
    throw new Error(`Stream endpoint error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // keep the incomplete last line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.done) {
          onDone();
          return;
        }
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.chunk) onChunk(parsed.chunk);
      } catch (e) {
        if (e instanceof SyntaxError) continue; // incomplete JSON — ignore
        throw e;
      }
    }
  }
  onDone();
}

/**
 * Custom hook for Gemini AI chat with SSE streaming.
 *
 * @param {object} stadiumContext - Current stadium context data
 * @returns {{ messages: ChatMessage[], isLoading: boolean, error: string|null, language: string, setLanguage: Function, sendMessage: Function }}
 */
export function useGemini(stadiumContext) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ai',
      text: "👋 Hello! I'm **Stadium IQ**, your AI guide for today's match. I can help with:\n• Navigation & gate directions\n• Transport & parking\n• Accessibility assistance\n• Stadium services & amenities\n• Sustainability info\n\nAsk me anything in your language!",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const abortRef = useRef(null);
  const csrfTokenRef = useRef(null);
  const contextRef = useRef(stadiumContext);
  const languageRef = useRef(language);
  const isLoadingRef = useRef(false);

  // Keep refs in sync without triggering re-renders
  contextRef.current = stadiumContext;
  languageRef.current = language;
  isLoadingRef.current = isLoading;

  // Fetch CSRF token on mount
  useEffect(() => {
    fetchCsrfToken()
      .then((t) => {
        csrfTokenRef.current = t;
      })
      .catch(() => {
        // Silently handle initial CSRF failure — token will be fetched on first send
      });
  }, []);

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  /**
   * Appends a new message or updates an existing streaming message.
   * @param {ChatMessage} msg
   */
  const appendMessage = useCallback((msg) => {
    setMessages((prev) => {
      const next = [...prev, msg];
      return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
    });
  }, []);

  /**
   * Updates the text of a streaming message in-place by its ID.
   * @param {string} id - The streaming message ID
   * @param {string} text - New accumulated text
   * @param {boolean} done - Whether streaming is complete
   */
  const updateStreamingMessage = useCallback((id, text, done) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text, isStreaming: !done } : m)));
  }, []);

  const sendMessage = useCallback(
    async (text, userProfile = null) => {
      if (!text.trim() || isLoadingRef.current) return;
      const sanitized = text.trim().slice(0, 2000);
      if (!sanitized) return;

      const userMsg = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: sanitized,
        timestamp: new Date(),
      };
      appendMessage(userMsg);
      setIsLoading(true);
      setError(null);

      try {
        abortRef.current = new AbortController();

        const body = {
          message: sanitized,
          contextData: contextRef.current,
          language: languageRef.current,
          userProfile,
        };

        // Ensure we have a CSRF token
        if (!csrfTokenRef.current) {
          csrfTokenRef.current = await fetchCsrfToken();
        }

        const headers = {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfTokenRef.current,
        };

        // -------------------------------------------------------
        // Primary path: SSE Streaming via /api/chat/stream
        // -------------------------------------------------------
        const streamingMsgId = `ai-stream-${Date.now()}`;
        let streamedText = '';
        let streamingStarted = false;

        try {
          await consumeSSEStream(
            '/api/chat/stream',
            body,
            headers,
            abortRef.current.signal,
            (chunk) => {
              streamedText += chunk;
              if (!streamingStarted) {
                // Add placeholder message on first chunk
                appendMessage({
                  id: streamingMsgId,
                  role: 'ai',
                  text: chunk,
                  timestamp: new Date(),
                  isStreaming: true,
                });
                streamingStarted = true;
              } else {
                updateStreamingMessage(streamingMsgId, streamedText, false);
              }
            },
            () => {
              if (streamingStarted) {
                updateStreamingMessage(streamingMsgId, streamedText, true);
              }
            },
          );

          // Stream completed successfully — if nothing streamed, treat as empty
          if (!streamingStarted) {
            appendMessage({
              id: streamingMsgId,
              role: 'ai',
              text: 'Sorry, I could not generate a response.',
              timestamp: new Date(),
            });
          }

          setIsLoading(false);
          return;
        } catch (streamErr) {
          if (streamErr.name === 'AbortError') throw streamErr;

          // -------------------------------------------------------
          // Fallback: Non-streaming /api/chat endpoint
          // -------------------------------------------------------
          let res = await fetch('/api/chat', {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: abortRef.current.signal,
            referrerPolicy: 'strict-origin-when-cross-origin',
          });

          // Auto-refresh CSRF token on 403 and retry once
          if (!res.ok && res.status === 403) {
            csrfTokenRef.current = null;
            const newToken = await fetchCsrfToken();
            csrfTokenRef.current = newToken;
            headers['X-CSRF-Token'] = newToken;
            res = await fetch('/api/chat', {
              method: 'POST',
              headers,
              body: JSON.stringify(body),
              signal: abortRef.current.signal,
              referrerPolicy: 'strict-origin-when-cross-origin',
            });
          }

          if (!res.ok) {
            let errorData = {};
            try {
              errorData = await res.json();
            } catch {}

            if (
              res.status === 400 &&
              errorData.error &&
              errorData.error.includes('API Key is missing')
            ) {
              // Backend missing API key — activate demo mode
              await new Promise((r) => setTimeout(r, 1200));
              const demoResponse = getDemoResponse(
                sanitized.toLowerCase(),
                contextRef.current,
                languageRef.current,
              );
              appendMessage({
                id: `ai-demo-${Date.now()}`,
                role: 'ai',
                text: demoResponse,
                timestamp: new Date(),
              });
              setIsLoading(false);
              return;
            }
            throw new Error(errorData.error || `API error ${res.status}`);
          }

          const data = await res.json();
          appendMessage({
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: data.reply || 'Sorry, I could not generate a response.',
            timestamp: new Date(),
          });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Could not reach AI service. Please try again.');
          appendMessage({
            id: `ai-err-${Date.now()}`,
            role: 'ai',
            text: '⚠️ Unable to connect right now. Please try again.',
            timestamp: new Date(),
            isError: true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [appendMessage, updateStreamingMessage],
  );

  return { messages, isLoading, error, language, setLanguage, sendMessage };
}
