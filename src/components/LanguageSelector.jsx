import React, { useRef, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { COLORS } from '../utils/styles';
import { LANGUAGES } from '../utils/constants';

const LanguageSelector = memo(function LanguageSelector({ language, setLanguage }) {
  const [langOpen, setLangOpen] = React.useState(false);
  const langRef = useRef(null);
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const toggleOpen = useCallback(() => setLangOpen((p) => !p), []);

  const selectLang = useCallback(
    (code) => {
      setLanguage(code);
      setLangOpen(false);
    },
    [setLanguage],
  );

  const handleLangKeyDown = useCallback((e) => {
    const options = langRef.current?.querySelectorAll('button:not([disabled])');
    if (!options || options.length === 0) return;
    const currentIndex = Array.from(options).indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (currentIndex + 1) % options.length;
      options[next].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (currentIndex - 1 + options.length) % options.length;
      options[prev].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLangOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  return (
    <div className="ml-auto relative" ref={langRef}>
      <button
        onClick={toggleOpen}
        aria-expanded={langOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
        style={{
          background: COLORS.surfaceContainerLow,
          border: `1.5px solid ${COLORS.outlineVariant}`,
          color: COLORS.onSurface,
        }}
      >
        <span>{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.label}</span>
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-sm"
          style={{ color: COLORS.outline }}
        >
          expand_more
        </span>
      </button>
      {langOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-50 card py-1 w-40 animate-fade-in-up"
          style={{ minWidth: '160px' }}
          role="listbox"
          aria-label="Available languages"
          onKeyDown={handleLangKeyDown}
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              aria-pressed={lang.code === language}
              onClick={() => selectLang(lang.code)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left"
              style={{
                background: lang.code === language ? COLORS.surfaceContainerHigh : 'transparent',
                color: lang.code === language ? COLORS.primary : COLORS.onSurfaceVariant,
                fontWeight: lang.code === language ? 700 : 400,
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {lang.code === language && (
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-sm ml-auto"
                  style={{ color: COLORS.tertiaryContainer }}
                >
                  check
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

LanguageSelector.propTypes = {
  language: PropTypes.string.isRequired,
  setLanguage: PropTypes.func.isRequired,
};

export default LanguageSelector;
