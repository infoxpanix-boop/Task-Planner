import { useEffect, useMemo, useState, useCallback } from 'react';
import Header from './Header';
import Calendar from './Calendar';
import ImportantTasks from './ImportantTasks';
import PlannerTable from './PlannerTable';
import Modal from './Modal';
import {
  addDays, dateKey, getWeekStart, formatShortDate,
} from '../dateUtils';
import { calcDayProgress, calcWeekProgress } from '../plannerLogic';
import * as api from '../api';
import { useAuth } from '../AuthContext';

export default function Planner() {
  const { logout } = useAuth();
  const today = useMemo(() => new Date(), []);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekOffset, setWeekOffset] = useState(0);

  const [tasks, setTasks] = useState({});
  const [completions, setCompletions] = useState({});
  const [importantTasks, setImportantTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalContext, setModalContext] = useState(null);

  const handleError = useCallback((err) => {
    if (err instanceof api.AuthError) {
      logout();
      return;
    }
    setError(err.message || 'Something went wrong talking to the server.');
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [t, c, it] = await Promise.all([
          api.fetchTasks(),
          api.fetchCompletions(),
          api.fetchImportantTasks(),
        ]);
        if (cancelled) return;
        setTasks(t);
        setCompletions(c);
        setImportantTasks(it);
      } catch (err) {
        if (!cancelled) handleError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [handleError]);

  const syncCalendarTo = (date) => {
    setCalYear(date.getFullYear());
    setCalMonth(date.getMonth());
  };

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setWeekOffset(0);
    syncCalendarTo(date);
  };

  const handlePrevMonth = () => {
    setCalMonth((m) => {
      if (m === 0) { setCalYear((y) => y - 1); return 11; }
      return m - 1;
    });
  };

  const handleNextMonth = () => {
    setCalMonth((m) => {
      if (m === 11) { setCalYear((y) => y + 1); return 0; }
      return m + 1;
    });
  };

  const handlePrevWeek = () => {
    setWeekOffset((o) => o - 1);
    setSelectedDate((d) => {
      const next = addDays(d, -7);
      syncCalendarTo(next);
      return next;
    });
  };

  const handleNextWeek = () => {
    setWeekOffset((o) => o + 1);
    setSelectedDate((d) => {
      const next = addDays(d, 7);
      syncCalendarTo(next);
      return next;
    });
  };

  /** Ensure a per-date task override exists (cloning the weekday template on first edit). */
  const ensureOverride = useCallback(async (date) => {
    const key = dateKey(date);
    if (tasks[key]) return key;
    const dow = date.getDay();
    if (dow < 1 || dow > 5) {
      setTasks((prev) => ({ ...prev, [key]: {} }));
      return key;
    }
    const cloned = await api.ensureDateOverride(key, dow);
    setTasks((prev) => ({ ...prev, [key]: cloned }));
    return key;
  }, [tasks]);

  const saveTask = useCallback(async (day, hour, name) => {
    try {
      const key = await ensureOverride(day);
      await api.upsertTask(key, hour, name);
      setTasks((prev) => ({ ...prev, [key]: { ...prev[key], [hour]: name } }));
    } catch (err) {
      handleError(err);
    }
  }, [ensureOverride, handleError]);

  const deleteTaskSlot = useCallback(async (day, hour) => {
    try {
      const key = await ensureOverride(day);
      await Promise.all([
        api.deleteTask(key, hour),
        api.setCompletion(dateKey(day), hour, false),
      ]);
      setTasks((prev) => {
        const dayTasks = { ...prev[key] };
        delete dayTasks[hour];
        return { ...prev, [key]: dayTasks };
      });
      setCompletions((prev) => {
        const copy = { ...prev };
        delete copy[`${dateKey(day)}|${String(hour).padStart(2, '0')}`];
        return copy;
      });
    } catch (err) {
      handleError(err);
    }
  }, [ensureOverride, handleError]);

  const toggleCompletion = useCallback(async (day, hour, checked) => {
    const dKey = dateKey(day);
    const slot = `${dKey}|${String(hour).padStart(2, '0')}`;
    setCompletions((prev) => {
      const copy = { ...prev };
      if (checked) copy[slot] = true; else delete copy[slot];
      return copy;
    });
    try {
      await api.setCompletion(dKey, hour, checked);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  const openAddModal = (day, hour) => setModalContext({ type: 'slot', day, hour });
  const openAddImportantModal = () => setModalContext({ type: 'important' });
  const closeModal = () => setModalContext(null);

  const confirmModal = async (name) => {
    try {
      if (modalContext.type === 'slot') {
        await saveTask(modalContext.day, modalContext.hour, name);
      } else if (modalContext.type === 'important') {
        const created = await api.createImportantTask(name);
        setImportantTasks((prev) => [...prev, created]);
      }
    } catch (err) {
      handleError(err);
    }
    closeModal();
  };

  const toggleImportant = async (id, done) => {
    setImportantTasks((prev) => prev.map((t) => (t._id === id ? { ...t, done } : t)));
    try {
      await api.updateImportantTask(id, { done });
    } catch (err) {
      handleError(err);
    }
  };

  const renameImportant = async (id, name) => {
    setImportantTasks((prev) => prev.map((t) => (t._id === id ? { ...t, name } : t)));
    try {
      await api.updateImportantTask(id, { name });
    } catch (err) {
      handleError(err);
    }
  };

  const deleteImportant = async (id) => {
    setImportantTasks((prev) => prev.filter((t) => t._id !== id));
    try {
      await api.deleteImportantTask(id);
    } catch (err) {
      handleError(err);
    }
  };

  const weekStart = getWeekStart(selectedDate, weekOffset);
  const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const weekEnd = days[4];

  const todayPct = calcDayProgress(tasks, completions, today).pct;
  const weekPct = calcWeekProgress(tasks, completions, getWeekStart(today, 0));

  return (
    <div className="app-wrapper">
      {error && <div className="app-status-bar error">{error}</div>}
      {loading && <div className="app-status-bar loading">Loading your planner…</div>}

      <Header todayPct={todayPct} weekPct={weekPct} />

      <div className="main-layout">
        <aside className="sidebar">
          <Calendar
            calYear={calYear}
            calMonth={calMonth}
            selectedDate={selectedDate}
            today={today}
            weekStart={weekStart}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onDayClick={handleDayClick}
          />
          <ImportantTasks
            tasks={importantTasks}
            onToggle={toggleImportant}
            onRename={renameImportant}
            onDelete={deleteImportant}
            onAdd={openAddImportantModal}
          />
        </aside>

        <main className="planner-main">
          <div className="spiral-bar">
            <div className="spiral-rings">
              {Array.from({ length: 20 }, (_, i) => <span key={i} className="ring" />)}
            </div>
          </div>

          <div className="week-nav-bar">
            <button type="button" className="week-nav-btn" onClick={handlePrevWeek}>&#8249; Prev Week</button>
            <span className="week-label">
              {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}, {weekEnd.getFullYear()}
            </span>
            <button type="button" className="week-nav-btn" onClick={handleNextWeek}>Next Week &#8250;</button>
          </div>

          <PlannerTable
            days={days}
            today={today}
            tasks={tasks}
            completions={completions}
            onToggleCompletion={toggleCompletion}
            onSaveTask={saveTask}
            onDeleteTask={deleteTaskSlot}
            onOpenAdd={openAddModal}
          />
        </main>
      </div>

      {modalContext && (
        <Modal context={modalContext} onConfirm={confirmModal} onCancel={closeModal} />
      )}
    </div>
  );
}
