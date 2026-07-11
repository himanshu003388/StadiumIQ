import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';

const AppContext = createContext(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
};

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [highContrast, setHighContrast] = useState(
    () => localStorage.getItem('high_contrast') === 'true',
  );
  const [role, setRole] = useState('Organizer');
  const [uiLanguage, setUiLanguage] = useState('en');
  const activeViewRef = useRef(null);

  const setActiveView = useCallback((view) => {
    activeViewRef.current = view;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ACCESSIBILITY: Sync high contrast mode state with html class list
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    localStorage.setItem('high_contrast', highContrast ? 'true' : 'false');
  }, [highContrast]);

  // ACCESSIBILITY: Update <html lang> so screen readers adjust pronunciation
  useEffect(() => {
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      highContrast,
      toggleHighContrast,
      activeViewRef,
      setActiveView,
      role,
      setRole,
      uiLanguage,
      setUiLanguage,
    }),
    [theme, toggleTheme, highContrast, toggleHighContrast, setActiveView, role, uiLanguage],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
