import { dateKey, slotKey, addDays } from './dateUtils';

export function getTasksForDate(tasks, date) {
  const dow = date.getDay();
  const key = dateKey(date);
  if (tasks[key]) return tasks[key];
  if (dow >= 1 && dow <= 5) return tasks[String(dow)] || {};
  return {};
}

export function getCompletionForSlot(completions, date, hour) {
  return !!completions[slotKey(date, hour)];
}

export function calcDayProgress(tasks, completions, date) {
  const dayTasks = getTasksForDate(tasks, date);
  const hours = Object.keys(dayTasks).map(Number);
  if (!hours.length) return { done: 0, total: 0, pct: 0 };
  const done = hours.filter((h) => getCompletionForSlot(completions, date, h)).length;
  return { done, total: hours.length, pct: Math.round((done / hours.length) * 100) };
}

export function calcWeekProgress(tasks, completions, weekStart) {
  let totalDone = 0;
  let totalTasks = 0;
  for (let i = 0; i < 5; i++) {
    const day = addDays(weekStart, i);
    const { done, total } = calcDayProgress(tasks, completions, day);
    totalDone += done;
    totalTasks += total;
  }
  if (!totalTasks) return 0;
  return Math.round((totalDone / totalTasks) * 100);
}
