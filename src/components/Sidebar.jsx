/**
 * Sidebar Component - Navigation sidebar and venue info panel
 * @component
 */
import React, { useMemo, memo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useStadiumContext } from '../context/StadiumContext';
import { useAppContext } from '../context/AppContext';
import { COLORS, NAV_ITEMS } from '../utils/styles';
import { parseDocumentOffline, validateDataset } from '../utils/helpers';

/**
 * Returns a badge count for a nav item based on active alerts
 * @param {string} id - Navigation item ID
 * @param {number} activeIncidents - Active incident count
 * @param {number} criticalGates - Critical gate count
 * @param {number} openTasks - Open task count
 * @returns {number|null} Badge count or null
 */
const getBadge = (id, activeIncidents, criticalGates, openTasks) => {
  if (id === 'command' && activeIncidents > 0) return activeIncidents;
  if (id === 'crowd' && criticalGates > 0) return criticalGates;
  if (id === 'volunteers' && openTasks > 0) return openTasks;
  return null;
};

/**
 * Skip link style setter utility
 * @param {HTMLElement} el - Target element
 * @param {object} styles - Inline styles to apply
 */
const setSkipStyles = (el, styles) => {
  Object.assign(el.style, styles);
};

/**
 * Sidebar component with venue info, navigation links, and system status
 * @param {object} props - Component props
 * @param {string} props.activeView - Currently active view ID
 * @param {function} props.setActiveView - View setter callback
 * @returns {React.ReactElement}
 */
function Sidebar({ activeView, setActiveView }) {
  const { contextData, dataSource, replaceDataset, resetToMock } = useStadiumContext();
  const { role } = useAppContext();
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
  const fileInputRef = useRef(null);
  const criticalGates = useMemo(
    () => contextData.gates.filter((g) => g.status === 'critical').length,
    [contextData.gates],
  );
  const activeIncidents = useMemo(
    () => contextData.incidents.filter((i) => i.status === 'active').length,
    [contextData.incidents],
  );
  const openTasks = useMemo(
    () => contextData.tasks.filter((t) => t.status === 'open').length,
    [contextData.tasks],
  );

  const allowedNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.allowedRoles?.includes(role)),
    [role],
  );

  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
        onFocus={(e) =>
          setSkipStyles(e.target, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: 'auto',
            height: 'auto',
            padding: '8px 16px',
            background: COLORS.primary,
            color: COLORS.onPrimary,
            zIndex: '9999',
            fontSize: '14px',
            fontWeight: 'bold',
            textDecoration: 'none',
          })
        }
        onBlur={(e) =>
          setSkipStyles(e.target, {
            position: 'absolute',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          })
        }
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-20 bottom-0 w-72 z-40 custom-scrollbar overflow-y-auto"
        role="complementary"
        aria-label="Navigation sidebar"
        style={{
          background: COLORS.surface,
          borderRight: `1px solid ${COLORS.surfaceDim}`,
          boxShadow: `2px 0 12px ${COLORS.primary}0f`,
        }}
      >
        {/* Persona Panel */}
        <div
          className="p-4 border-b"
          style={{
            borderColor: COLORS.surfaceDim,
            background: `color-mix(in srgb, ${COLORS.primary} 6%, transparent)`,
          }}
        >
          <div
            className="text-[10px] font-bold tracking-wider mb-2 font-mono"
            style={{ color: COLORS.secondary }}
          >
            🎭 ACTIVE PERSONA
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm shrink-0"
              style={{ background: COLORS.gradientNavy, color: '#ffffff' }}
            >
              AX
            </div>
            <div>
              <div className="font-bold text-xs" style={{ color: COLORS.onSurface }}>
                Alex (Control Room Ops)
              </div>
              <div className="text-[10px]" style={{ color: COLORS.outline }}>
                Stressed Stadium Director
              </div>
            </div>
          </div>
          <p
            className="text-[10px] mt-2 leading-relaxed"
            style={{ color: COLORS.onSurfaceVariant }}
          >
            Managing egress, routing volunteers, and dispatching cleanup crews under pressure.
          </p>
        </div>

        {/* Data Source Banner (Task 2) */}
        <div
          className="mx-3 mt-3 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-medium"
          style={{
            background: dataSource === 'uploaded' ? `${COLORS.tertiary}15` : `${COLORS.warning}12`,
            border: `1px solid ${dataSource === 'uploaded' ? COLORS.tertiary : COLORS.warning}30`,
            color: dataSource === 'uploaded' ? COLORS.tertiary : COLORS.warning,
          }}
          role="status"
        >
          <span className="material-symbols-outlined icon-fill" style={{ fontSize: '12px' }}>
            {dataSource === 'uploaded' ? 'database' : 'dataset'}
          </span>
          <span className="flex-1">
            {dataSource === 'uploaded' ? 'Using uploaded dataset' : 'Using synthetic demo data'}
          </span>
          {dataSource === 'uploaded' && (
            <button
              onClick={resetToMock}
              className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
              style={{ background: `${COLORS.warning}20`, color: COLORS.warning }}
              aria-label="Reset to synthetic demo data"
            >
              Reset
            </button>
          )}
        </div>

        {/* Stadium Info */}
        <div className="p-4 border-b" style={{ borderColor: COLORS.surfaceDim }}>
          <div className="text-xs font-medium mb-1" style={{ color: COLORS.outline }}>
            VENUE
          </div>
          <div className="font-bold text-sm" style={{ color: COLORS.primary }}>
            {contextData.stadium.name}
          </div>
          <div className="text-xs" style={{ color: COLORS.outline }}>
            {contextData.stadium.city}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: COLORS.error }}
            ></span>
            <span className="text-xs font-medium" style={{ color: COLORS.error }}>
              LIVE
            </span>
            <span className="text-xs" style={{ color: COLORS.outline }}>
              — {contextData.stadium.matchPhase}
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 flex flex-col gap-2" aria-label="Main navigation">
          {allowedNavItems.map((item) => {
            const badge = getBadge(item.id, activeIncidents, criticalGates, openTasks);
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                aria-label={item.label}
                aria-current={activeView === item.id ? 'page' : undefined}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-2xl shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0 ml-1">
                  <div className="text-sm font-semibold truncate">{item.label}</div>
                  {activeView !== item.id && (
                    <div className="text-xs opacity-60 truncate">{item.desc}</div>
                  )}
                </div>
                {badge && (
                  <span
                    className="ml-auto shrink-0 min-w-[18px] h-[18px] rounded-full text-center text-xs font-bold flex items-center justify-center px-1"
                    aria-label={`${badge} alerts`}
                    style={{ background: COLORS.error, color: COLORS.onPrimary, fontSize: '10px' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Upload Test Data (Task 2) */}
        <div className="p-4 border-t" style={{ borderColor: COLORS.surfaceDim }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{
              background: `${COLORS.primary}15`,
              color: COLORS.primary,
              border: `1px solid ${COLORS.primary}25`,
            }}
            aria-label="Upload test dataset"
          >
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: '14px' }}>
              upload_file
            </span>
            <span>Upload Test Data</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            aria-label="Upload test dataset JSON or CSV file"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploadStatus(null);
              try {
                const text = await file.text();
                let parsed;
                if (file.name.endsWith('.json')) {
                  parsed = JSON.parse(text);
                } else {
                  parsed = parseDocumentOffline(text);
                }
                const errors = validateDataset(parsed);
                if (errors.length > 0) {
                  setUploadStatus(`error: ${errors[0]}`);
                  return;
                }
                replaceDataset(parsed);
                setUploadStatus('success');
              } catch (err) {
                setUploadStatus(`error: ${err.message}`);
              }
              e.target.value = '';
            }}
          />
          {uploadStatus === 'success' && (
            <p className="text-[10px] mt-1" style={{ color: COLORS.success }}>
              ✓ Dataset loaded
            </p>
          )}
          {uploadStatus?.startsWith('error') && (
            <p className="text-[10px] mt-1" style={{ color: COLORS.error }}>
              ✗ {uploadStatus.slice(6)}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t"
          style={{ borderColor: COLORS.surfaceDim, background: COLORS.surfaceBright }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: COLORS.success }}></span>
            <span className="text-xs font-medium" style={{ color: COLORS.success }}>
              Systems Nominal
            </span>
          </div>
          <div className="text-xs" style={{ color: COLORS.outline }}>
            {Math.round(
              (contextData.stadium.currentOccupancy / contextData.stadium.capacity) * 100,
            )}
            % capacity &bull; {contextData.stadium.sustainability.renewablePercentage}% renewable
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t"
        aria-label="Mobile navigation"
        style={{
          background: COLORS.surface,
          borderColor: COLORS.surfaceDim,
          boxShadow: `0 -4px 20px ${COLORS.primary}1a`,
        }}
      >
        {allowedNavItems.map((item) => {
          const badge = getBadge(item.id, activeIncidents, criticalGates, openTasks);
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              aria-label={item.label}
              aria-current={activeView === item.id ? 'page' : undefined}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 relative transition-all"
              style={{ color: activeView === item.id ? COLORS.primary : COLORS.outline }}
            >
              <span
                className="material-symbols-outlined text-xl"
                aria-hidden="true"
                style={{ fontVariationSettings: activeView === item.id ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span
                className="text-xs"
                style={{ fontSize: '9px', fontWeight: activeView === item.id ? 700 : 400 }}
              >
                {item.label.split(' ')[0]}
              </span>
              {badge && (
                <span
                  className="absolute top-1 right-1/4 w-4 h-4 rounded-full text-center flex items-center justify-center"
                  aria-label={`${badge} alerts`}
                  style={{
                    background: COLORS.error,
                    color: COLORS.onPrimary,
                    fontSize: '9px',
                    fontWeight: 700,
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}

Sidebar.propTypes = {
  activeView: PropTypes.string.isRequired,
  setActiveView: PropTypes.func.isRequired,
};

export default memo(Sidebar);
