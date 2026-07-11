/**
 * Layout Component - Main application shell with view routing and simulation lifecycle
 * @component
 */
import React, { useState, useCallback, Suspense, memo, useEffect, useMemo } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { StadiumProvider } from '../context/StadiumContext';
import { useAppContext } from '../context/AppContext';
import { COLORS, NAV_ITEMS } from '../utils/styles';
import { ErrorBoundary } from './ErrorBoundary';

const CommandCenter = React.lazy(() => import('./CommandCenter'));
const AIAssistant = React.lazy(() => import('./AIAssistant'));
const CrowdMap = React.lazy(() => import('./CrowdMap'));
const VolunteerDispatch = React.lazy(() => import('./VolunteerDispatch'));
const TransportHub = React.lazy(() => import('./TransportHub'));
const Sustainability = React.lazy(() => import('./Sustainability'));
const AccessibilityHub = React.lazy(() => import('./AccessibilityHub'));
const UploadCenter = React.lazy(() => import('./UploadCenter'));

const VIEWS = {
  command: CommandCenter,
  ai: AIAssistant,
  crowd: CrowdMap,
  volunteers: VolunteerDispatch,
  upload: UploadCenter,
  transport: TransportHub,
  sustain: Sustainability,
  accessibility: AccessibilityHub,
};

/**
 * Inner layout component with active view routing
 * Syncs active view with context for simulation awareness
 * @returns {React.ReactElement}
 */
function LayoutInner() {
  const [activeView, setLocalActiveView] = useState('command');
  const { role, setActiveView: setContextActiveView } = useAppContext();

  const allowedNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => item.allowedRoles?.includes(role)),
    [role],
  );

  const setActiveView = useCallback(
    (view) => {
      setLocalActiveView(view);
      setContextActiveView(view);
    },
    [setContextActiveView],
  );

  useEffect(() => {
    // If the active view is not in allowed items, fallback to the first allowed item
    const isAllowed = allowedNavItems.some((item) => item.id === activeView);
    if (!isAllowed && allowedNavItems.length > 0) {
      setActiveView(allowedNavItems[0].id);
    }
  }, [activeView, allowedNavItems, setActiveView]);

  const ActivePanel = VIEWS[activeView] || CommandCenter;

  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: COLORS.background, color: COLORS.onBackground }}
      >
        <Header activeView={activeView} setActiveView={setActiveView} />
        <div className="flex flex-1 pt-20">
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 md:ml-72 overflow-y-auto min-h-[calc(100vh-5rem)] pb-16 md:pb-0 custom-scrollbar"
            role="main"
            aria-label="Main content area"
          >
            <ErrorBoundary>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                }
              >
                <ActivePanel />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </>
  );
}

/**
 * Main Layout component wrapped with StadiumProvider
 * @returns {React.ReactElement}
 */
function Layout() {
  return (
    <StadiumProvider>
      <LayoutInner />
    </StadiumProvider>
  );
}

export default memo(Layout);
