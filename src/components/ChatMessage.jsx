import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { renderMarkdown } from '../utils/helpers';
import { COLORS } from '../utils/styles';

const ChatMessage = memo(function ChatMessage({ msg, index, contextData }) {
  const [showGrounding, setShowGrounding] = useState(false);

  const groundedFields = contextData
    ? [
        ...(contextData.gates?.length
          ? [
              `${contextData.gates.length} gates (ids: ${contextData.gates.map((g) => g.id).join(', ')})`,
            ]
          : []),
        ...(contextData.incidents?.length
          ? [
              `${contextData.incidents.filter((i) => i.status === 'active').length} active incidents (types: ${[...new Set(contextData.incidents.filter((i) => i.status === 'active').map((i) => i.type))].join(', ')})`,
            ]
          : []),
        ...(contextData.volunteers?.length ? [`${contextData.volunteers.length} volunteers`] : []),
      ]
    : [];

  return (
    <div
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 items-end animate-fade-in-up`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {msg.role === 'ai' && (
        <div
          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mb-0.5"
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
      )}
      <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
        {msg.role === 'ai' ? (
          <div
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(msg.text)) }}
          />
        ) : (
          <p className="text-sm">{msg.text}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="text-xs opacity-50">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          {msg.role === 'ai' && groundedFields.length > 0 && (
            <button
              onClick={() => setShowGrounding((p) => !p)}
              className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-all"
              style={{
                background: showGrounding ? `${COLORS.primaryContainer}30` : 'transparent',
                color: showGrounding ? COLORS.primaryContainer : COLORS.outline,
                border: `1px solid ${showGrounding ? COLORS.primaryContainer : 'transparent'}`,
              }}
              aria-label={
                showGrounding
                  ? 'Hide context grounding'
                  : 'Show what context data grounded this response'
              }
              aria-expanded={showGrounding}
            >
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: '10px' }}>
                help
              </span>
              <span>Why?</span>
            </button>
          )}
        </div>
        {msg.role === 'ai' && showGrounding && groundedFields.length > 0 && (
          <div
            className="mt-1.5 p-2 rounded-lg text-[10px] animate-fade-in-up"
            style={{
              background: COLORS.surfaceContainerLow,
              border: `1px solid ${COLORS.outlineVariant}`,
            }}
            role="region"
            aria-label="Context fields grounding this response"
          >
            <p className="font-semibold mb-0.5" style={{ color: COLORS.primaryContainer }}>
              Grounded in:
            </p>
            <ul className="list-disc list-inside" style={{ color: COLORS.onSurfaceVariant }}>
              {groundedFields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {msg.role === 'user' && (
        <div
          className="w-7 h-7 rounded-full shrink-0 mb-0.5 flex items-center justify-center"
          style={{ background: COLORS.surfaceContainerHigh }}
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-sm"
            style={{ color: COLORS.onSurfaceVariant }}
          >
            person
          </span>
        </div>
      )}
    </div>
  );
});

ChatMessage.propTypes = {
  msg: PropTypes.shape({
    role: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    timestamp: PropTypes.instanceOf(Date).isRequired,
    id: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  contextData: PropTypes.object,
};

export default ChatMessage;
