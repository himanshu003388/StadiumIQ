/**
 * Stadium Data Context Provider
 * Manages real-time stadium state with live simulation
 * Separated from AppContext (theme, activeView) to prevent
 * unnecessary re-renders of UI-only consumers on simulation ticks
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import initialMockContext from '../data/mockContext.json';
import { useAppContext, AppProvider } from './AppContext';

const StadiumDataContext = createContext(null);

export { AppProvider };

/**
 * Hook to access stadium simulation data (gates, incidents, etc.)
 * @returns {object} Stadium data and actions
 */
export const useStadiumData = () => {
  const ctx = useContext(StadiumDataContext);
  if (!ctx) throw new Error('useStadiumData must be used within a StadiumProvider');
  return ctx;
};

/**
 * Combined hook for backward compat — merges data + app context
 * Prefer useStadiumData() / useAppContext() for targeted subscriptions
 * @returns {object} Full context
 */
export const useStadiumContext = () => {
  const data = useStadiumData();
  const app = useAppContext();
  return useMemo(() => ({ ...data, ...app }), [data, app]);
};

function InnerProvider({ children }) {
  const [contextData, setContextData] = useState(() => {
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (!isTest) {
      const cached = localStorage.getItem('stadium_iq_context');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.stadium && parsed.gates) {
            return parsed;
          }
        } catch {
          // Fallback on parse failure
        }
      }
    }
    const data = JSON.parse(JSON.stringify(initialMockContext));
    if (!data.stadium.sustainability.trashBins) {
      data.stadium.sustainability.trashBins = [
        { zone: 'North Stand', fullness: 45 },
        { zone: 'South Stand', fullness: 78 },
        { zone: 'East Wing', fullness: 88 },
        { zone: 'West Wing', fullness: 20 },
      ];
    }
    return data;
  });
  const [isSimulating, setIsSimulating] = useState(true);
  const [dataSource, setDataSource] = useState('synthetic'); // 'synthetic' | 'uploaded'

  useEffect(() => {
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (!isTest) {
      localStorage.setItem('stadium_iq_context', JSON.stringify(contextData));
    }
  }, [contextData]);

  useEffect(() => {
    if (!isSimulating) return;

    let interval = null;

    function startInterval() {
      interval = setInterval(() => {
        setContextData((prev) => ({
          ...prev,
          gates: prev.gates.map((gate) => {
            const delta = (Math.random() - 0.48) * 0.04;
            const newDensity = Math.max(0.05, Math.min(0.99, gate.density + delta));
            const newWait = Math.max(1, Math.round(newDensity * 30));
            const newStatus =
              newDensity > 0.85 ? 'critical' : newDensity > 0.65 ? 'watch' : 'normal';
            const newCctv = parseFloat(
              Math.max(0.05, Math.min(0.99, newDensity + (Math.random() - 0.5) * 0.05)).toFixed(2),
            );
            const newFlow = Math.max(5, Math.round(newDensity * 70 + (Math.random() - 0.5) * 10));
            return {
              ...gate,
              density: parseFloat(newDensity.toFixed(2)),
              waitTimeMinutes: newWait,
              status: newStatus,
              cctvCongestionIndex: newCctv,
              flowRatePerMin: newFlow,
            };
          }),
          stadium: {
            ...prev.stadium,
            currentOccupancy: Math.max(
              80000,
              Math.min(
                prev.stadium.capacity,
                prev.stadium.currentOccupancy + Math.round((Math.random() - 0.5) * 200),
              ),
            ),
            sustainability: {
              ...prev.stadium.sustainability,
              trashBins: (
                prev.stadium.sustainability.trashBins || [
                  { zone: 'North Stand', fullness: 45 },
                  { zone: 'South Stand', fullness: 78 },
                  { zone: 'East Wing', fullness: 88 },
                  { zone: 'West Wing', fullness: 20 },
                ]
              ).map((bin) => {
                const delta = Math.round(Math.random() * 2);
                return {
                  ...bin,
                  fullness: Math.min(100, bin.fullness + delta),
                };
              }),
            },
          },
        }));
      }, 8000);
    }

    // Pause simulation when tab is hidden to save CPU
    function stopInterval() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    // Pause simulation when tab is hidden to save CPU
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stopInterval();
      } else {
        stopInterval(); // clear any stale interval first
        startInterval();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startInterval(); // start immediately

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopInterval();
    };
  }, [isSimulating]);

  const assignVolunteer = useCallback((taskId, volunteerId) => {
    setContextData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, assignedTo: volunteerId, status: 'in-progress' } : t,
      ),
      volunteers: prev.volunteers.map((v) =>
        v.id === volunteerId ? { ...v, currentLoad: Math.min(v.maxLoad, v.currentLoad + 1) } : v,
      ),
    }));
  }, []);

  const resolveTask = useCallback((taskId) => {
    setContextData((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: 'resolved' } : t)),
        volunteers: prev.volunteers.map((v) =>
          v.id === task?.assignedTo ? { ...v, currentLoad: Math.max(0, v.currentLoad - 1) } : v,
        ),
      };
    });
  }, []);

  const toggleEcoMode = useCallback(() => {
    setContextData((prev) => ({
      ...prev,
      stadium: {
        ...prev.stadium,
        sustainability: {
          ...prev.stadium.sustainability,
          ecoModeActive: !prev.stadium.sustainability.ecoModeActive,
          energyDrawMW: !prev.stadium.sustainability.ecoModeActive
            ? parseFloat((prev.stadium.sustainability.energyDrawMW * 0.78).toFixed(1))
            : parseFloat((prev.stadium.sustainability.energyDrawMW / 0.78).toFixed(1)),
        },
      },
    }));
  }, []);

  const resolveIncident = useCallback((incidentId) => {
    setContextData((prev) => ({
      ...prev,
      incidents: prev.incidents.map((i) =>
        i.id === incidentId ? { ...i, status: 'resolved' } : i,
      ),
    }));
  }, []);

  const importDataset = useCallback((newData) => {
    setContextData((prev) => {
      const updated = { ...prev };
      if (newData.gates && newData.gates.length > 0) {
        const gateMap = new Map(updated.gates.map((g) => [g.id, g]));
        for (const g of newData.gates) {
          gateMap.set(g.id, { ...gateMap.get(g.id), ...g });
        }
        updated.gates = Array.from(gateMap.values());
      }
      if (newData.incidents && newData.incidents.length > 0) {
        const incidentMap = new Map(updated.incidents.map((i) => [i.id, i]));
        for (const inc of newData.incidents) {
          incidentMap.set(inc.id, { ...incidentMap.get(inc.id), ...inc });
        }
        updated.incidents = Array.from(incidentMap.values());
      }
      if (newData.volunteers && newData.volunteers.length > 0) {
        const volunteerMap = new Map(updated.volunteers.map((v) => [v.id, v]));
        for (const v of newData.volunteers) {
          volunteerMap.set(v.id, { ...volunteerMap.get(v.id), ...v });
        }
        updated.volunteers = Array.from(volunteerMap.values());
      }
      return updated;
    });
    setDataSource('uploaded');
  }, []);

  const replaceDataset = useCallback((newData) => {
    setContextData((prev) => {
      const updated = { ...prev };
      if (newData.gates) updated.gates = newData.gates;
      if (newData.incidents) updated.incidents = newData.incidents;
      if (newData.volunteers) updated.volunteers = newData.volunteers;
      if (newData.stadium) updated.stadium = { ...prev.stadium, ...newData.stadium };
      if (newData.transportOptions) updated.transportOptions = newData.transportOptions;
      if (newData.tasks) updated.tasks = newData.tasks;
      if (newData.accessibilityServices)
        updated.accessibilityServices = newData.accessibilityServices;
      return updated;
    });
    setDataSource('uploaded');
  }, []);

  const resetToMock = useCallback(() => {
    const data = JSON.parse(JSON.stringify(initialMockContext));
    if (!data.stadium.sustainability.trashBins) {
      data.stadium.sustainability.trashBins = [
        { zone: 'North Stand', fullness: 45 },
        { zone: 'South Stand', fullness: 78 },
        { zone: 'East Wing', fullness: 88 },
        { zone: 'West Wing', fullness: 20 },
      ];
    }
    setContextData(data);
    setDataSource('synthetic');
  }, []);

  const emptyTrashBin = useCallback((zone) => {
    setContextData((prev) => ({
      ...prev,
      stadium: {
        ...prev.stadium,
        sustainability: {
          ...prev.stadium.sustainability,
          trashBins: (prev.stadium.sustainability.trashBins || []).map((bin) =>
            bin.zone === zone ? { ...bin, fullness: 0 } : bin,
          ),
        },
      },
    }));
  }, []);

  const dispatchCleaningTask = useCallback((zone, volunteerId) => {
    setContextData((prev) => {
      const taskId = `T-BIN-${Date.now()}`;
      const newTasks = [
        {
          id: taskId,
          description: `Empty trash bin at ${zone}`,
          zone: zone.split(' ')[0],
          requiredLanguage: 'en',
          requiredSkill: 'guest-services',
          priority: 'high',
          assignedTo: volunteerId,
          status: 'in-progress',
        },
        ...prev.tasks,
      ];
      const newVolunteers = prev.volunteers.map((v) =>
        v.id === volunteerId ? { ...v, currentLoad: Math.min(v.maxLoad, v.currentLoad + 1) } : v,
      );
      return {
        ...prev,
        tasks: newTasks,
        volunteers: newVolunteers,
      };
    });
  }, []);

  const deployShuttle = useCallback(() => {
    setContextData((prev) => ({
      ...prev,
      transportOptions: prev.transportOptions.map((t) =>
        t.id === 'TR2'
          ? {
              ...t,
              etaMinutes: Math.max(2, t.etaMinutes - 3),
              capacityLeft: t.capacityLeft + 15,
              deployedCount: (t.deployedCount || 0) + 1,
            }
          : t,
      ),
    }));
  }, []);

  const divertSurgeRideshare = useCallback(() => {
    setContextData((prev) => ({
      ...prev,
      transportOptions: prev.transportOptions.map((t) =>
        t.id === 'TR3'
          ? {
              ...t,
              etaMinutes: Math.max(2, t.etaMinutes - 2),
              capacityLeft: t.capacityLeft + 10,
              surgeActivated: true,
            }
          : t,
      ),
    }));
  }, []);

  const increaseTrainFrequency = useCallback(() => {
    setContextData((prev) => ({
      ...prev,
      transportOptions: prev.transportOptions.map((t) =>
        t.id === 'TR4'
          ? {
              ...t,
              etaMinutes: Math.max(2, t.etaMinutes - 4),
              capacityLeft: t.capacityLeft + 80,
              frequencyBoosted: true,
            }
          : t,
      ),
    }));
  }, []);

  const value = useMemo(
    () => ({
      contextData,
      isSimulating,
      setIsSimulating,
      assignVolunteer,
      resolveTask,
      toggleEcoMode,
      resolveIncident,
      importDataset,
      emptyTrashBin,
      dispatchCleaningTask,
      deployShuttle,
      divertSurgeRideshare,
      increaseTrainFrequency,
      dataSource,
      replaceDataset,
      resetToMock,
    }),
    [
      contextData,
      isSimulating,
      assignVolunteer,
      resolveTask,
      toggleEcoMode,
      resolveIncident,
      importDataset,
      emptyTrashBin,
      dispatchCleaningTask,
      deployShuttle,
      divertSurgeRideshare,
      increaseTrainFrequency,
      dataSource,
      replaceDataset,
      resetToMock,
    ],
  );

  return <StadiumDataContext.Provider value={value}>{children}</StadiumDataContext.Provider>;
}

export function StadiumProvider({ children }) {
  return (
    <AppProvider>
      <InnerProvider>{children}</InnerProvider>
    </AppProvider>
  );
}
