/**
 * Header Component - Stadium IQ Top Bar
 * Shows match score, AI status, incident alerts, and live clock
 * @component
 */
import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useStadiumData } from '../context/StadiumContext';
import { useAppContext } from '../context/AppContext';
import { COLORS } from '../utils/styles';

/**
 * Match clock simulation
 */
function useMatchClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [matchTime, setMatchTime] = useState("67'");

  useEffect(() => {
    const tick = setInterval(() => {
      setCurrentTime(new Date());
      setMatchTime((prev) => {
        const mins = parseInt(prev, 10);
        if (mins < 90) return `${mins + 1}'`;
        if (mins < 120) return `${mins + 1}' +`;
        return "90'";
      });
    }, 60000);
    return () => clearInterval(tick);
  }, []);

  return { currentTime, matchTime };
}

/**
 * Custom Styled Role Selector Dropdown with full keyboard focus management.
 * Supports: Escape to close, focus trap within list, focus return to trigger.
 */
function RoleSelector({ role, setRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus first list item when dropdown opens
  useEffect(() => {
    if (isOpen && listRef.current) {
      const firstBtn = listRef.current.querySelector('button');
      firstBtn?.focus();
    }
  }, [isOpen]);

  /**
   * Handle keyboard events on the dropdown listbox.
   * Escape → close & return focus to trigger
   * Tab / Shift+Tab → cycle within listbox (focus trap)
   * @param {React.KeyboardEvent} e
   */
  const handleListKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = Array.from(listRef.current?.querySelectorAll('button') ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    }
  };

  const roles = [
    { value: 'Organizer', icon: 'shield_person' },
    { value: 'Staff', icon: 'badge' },
    { value: 'Volunteer', icon: 'volunteer_activism' },
    { value: 'Fan', icon: 'sports_soccer' },
  ];

  return (
    <div className="relative hidden sm:block" ref={dropdownRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
        className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 outline-none font-medium cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#3b82f6]"
        style={{
          background: isOpen
            ? 'color-mix(in srgb, var(--color-header-text) 15%, transparent)'
            : 'color-mix(in srgb, var(--color-header-text) 8%, transparent)',
          color: 'var(--color-header-text)',
          border: '1px solid color-mix(in srgb, var(--color-header-text) 20%, transparent)',
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select User Role, currently ${role}`}
      >
        <span className="material-symbols-outlined text-base icon-fill">
          {roles.find((r) => r.value === role)?.icon || 'person'}
        </span>
        {role}
        <span
          className="material-symbols-outlined text-base transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50 animate-fade-in-up"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: '0 8px 32px var(--shadow-base)',
          }}
          role="listbox"
          aria-label="Select user role"
          onKeyDown={handleListKeyDown}
        >
          {roles.map((r) => (
            <li key={r.value}>
              <button
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  color: role === r.value ? 'var(--color-primary)' : 'var(--color-on-surface)',
                  background:
                    role === r.value
                      ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                      : 'transparent',
                  fontWeight: role === r.value ? '600' : '500',
                }}
                onClick={() => {
                  setRole(r.value);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                role="option"
                aria-selected={role === r.value}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: role === r.value ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {r.icon}
                </span>
                {r.value}
                {role === r.value && (
                  <span className="material-symbols-outlined text-lg ml-auto">check</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Header component
 * @param {object} props - Component props
 * @param {function} props.setActiveView - View navigation callback
 * @returns {React.ReactElement}
 */
function Header({ setActiveView }) {
  const { contextData } = useStadiumData();
  const { theme, toggleTheme, highContrast, toggleHighContrast, role, setRole } = useAppContext();
  const { stadium } = contextData;
  const { currentTime, matchTime } = useMatchClock();

  const activeIncidents = useMemo(
    () => contextData.incidents.filter((i) => i.status === 'active').length,
    [contextData.incidents],
  );

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-[color-mix(in_srgb,var(--color-header-text)_10%,transparent)]"
      role="banner"
      style={{ background: 'var(--color-header-bg)', boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}
    >
      <div className="flex items-center justify-between h-full px-4 gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="#"
            className="flex items-center gap-3 no-underline"
            aria-label="Stadium IQ - Go to Command Center"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('command');
            }}
          >
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Stadium IQ Logo"
                className="h-14 w-auto rounded-lg shadow-sm"
              />
            </div>
            <div className="hidden md:block">
              <div
                className="font-bold text-base tracking-tight leading-none"
                style={{ color: 'var(--color-header-text)' }}
              >
                Stadium IQ
              </div>
              <div
                className="text-sm leading-none mt-1"
                style={{ color: 'var(--color-header-text)', opacity: 0.8 }}
              >
                FIFA World Cup 2026
              </div>
            </div>
          </a>
        </div>

        {/* Match Score - center */}
        <div
          className="hidden lg:flex items-center gap-4 rounded-xl px-5 py-2"
          style={{ background: 'color-mix(in srgb, var(--color-header-text) 10%, transparent)' }}
          aria-label={`Match score: ${stadium.homeTeam} ${stadium.score} ${stadium.awayTeam}`}
        >
          <span className="font-bold text-base" style={{ color: 'var(--color-header-text)' }}>
            {stadium.homeTeam}
          </span>
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-xl font-bold tracking-wider"
              style={{ color: 'var(--color-header-text)' }}
              aria-live="polite"
              aria-atomic="true"
            >
              {stadium.score}
            </span>
            <span
              className="text-sm px-2 py-0.5 rounded-md font-mono animate-pulse"
              style={{ background: 'rgba(197,50,50,0.8)', color: 'white' }}
              aria-label={`Match time: ${matchTime}`}
            >
              {matchTime}
            </span>
          </div>
          <span className="font-bold text-base" style={{ color: 'var(--color-header-text)' }}>
            {stadium.awayTeam}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Role Toggle */}
          <RoleSelector role={role} setRole={setRole} />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[#00f0ff]"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-xl icon-fill"
              style={{ color: 'var(--color-header-text)' }}
            >
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* High Contrast Toggle */}
          <button
            onClick={toggleHighContrast}
            className="flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-[#00f0ff]"
            aria-label="Toggle high contrast accessibility mode"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-xl icon-fill"
              style={{ color: 'var(--color-header-text)' }}
            >
              {highContrast ? 'contrast' : 'contrast_rtl_off'}
            </span>
          </button>

          {/* AI Status */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--color-status-nominal) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-status-nominal) 35%, transparent)',
            }}
            aria-label="AI Assistant is active"
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: COLORS.success }}
            />
            <span className="text-sm font-medium" style={{ color: COLORS.success }}>
              AI Active
            </span>
          </div>

          {/* Incident Alert Badge */}
          {activeIncidents > 0 && (
            <button
              aria-label={`View ${activeIncidents} active incidents`}
              onClick={() => setActiveView('command')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#c8962e]"
              style={{
                background: 'rgba(198,40,40,0.25)',
                border: '1px solid rgba(198,40,40,0.5)',
              }}
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-base icon-fill"
                style={{ color: COLORS.error }}
              >
                emergency
              </span>
              <span className="text-sm font-bold" style={{ color: COLORS.error }}>
                {activeIncidents}
              </span>
            </button>
          )}

          {/* Time */}
          <div
            className="text-sm font-mono"
            style={{ color: 'var(--color-header-text)', opacity: 0.8 }}
          >
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </header>
  );
}

Header.propTypes = {
  setActiveView: PropTypes.func.isRequired,
};

export default memo(Header);
