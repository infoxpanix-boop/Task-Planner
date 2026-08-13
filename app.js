/**
 * Study Task Planner — app.js
 * Full logic: calendar, weekly planner, task management, progress tracking
 */

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const STORAGE_KEY = 'study_task_planner_v2';

const DEFAULT_TASKS_BY_DOW = {
  // keyed by day-of-week 1=Mon..5=Fri, then by hour
  1: { 5: 'Wash up', 6: 'Morning running', 7: 'Have breakfast', 8: 'Watch the news', 9: 'Review course', 10: 'Learning to swim', 11: 'Learning computer', 12: 'Have lunch' },
  2: { 5: 'Wash up', 6: 'Morning running', 7: 'Have breakfast', 8: 'Watch the news', 9: 'Review course', 10: 'Learning to swim', 11: 'Learning computer', 12: 'Have lunch' },
  3: { 5: 'Wash up', 6: 'Morning running', 7: 'Have breakfast', 8: 'Watch the news', 9: 'Review course', 10: 'Learning to swim', 11: 'Learning computer', 12: 'Have lunch' },
  4: { 5: 'Wash up', 6: 'Morning running', 7: 'Have breakfast', 8: 'Watch the news', 9: 'Review course', 10: 'Learning to swim', 11: 'Learning computer', 12: 'Have lunch' },
  5: { 5: 'Wash up', 6: 'Morning running', 7: 'Have breakfast', 8: 'Watch the news', 9: 'Review course', 10: 'Learning to swim', 11: 'Learning computer', 12: 'Have lunch' },
};

// Default completions: some pre-checked to match reference image feel
const DEFAULT_COMPLETIONS = {
  // format: "YYYY-MM-DD|HH" : true/false
};

const DEFAULT_IMPORTANT_TASKS = [
  { id: 'imp1', name: 'Review Mathematics', done: false },
  { id: 'imp2', name: 'Computer programming', done: true },
  { id: 'imp3', name: 'Review English', done: false },
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    tasks: state.tasks,
    completions: state.completions,
    importantTasks: state.importantTasks,
  }));
}

// Bootstrap state
const saved = loadState();
const state = {
  today: new Date(),
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(), // 0-indexed
  selectedDate: new Date(),
  weekOffset: 0, // relative to the week containing selectedDate
  tasks: saved?.tasks || JSON.parse(JSON.stringify(DEFAULT_TASKS_BY_DOW)),
  completions: saved?.completions || {},
  importantTasks: saved?.importantTasks || JSON.parse(JSON.stringify(DEFAULT_IMPORTANT_TASKS)),
  modal: { open: false, context: null },
};

// ─────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_ABBR  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HOURS = Array.from({length: 20}, (_, i) => i + 4); // 04:00 – 23:00

function pad2(n) { return String(n).padStart(2, '0'); }

function dateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

function slotKey(d, h) { return `${dateKey(d)}|${pad2(h)}`; }

function getDayOfWeek(d) {
  // 1=Mon … 5=Fri, 0=Sun, 6=Sat
  return d.getDay(); // 0=Sun,1=Mon,...6=Sat
}

/** Return the Monday of the week containing date d, adjusted by weekOffset */
function getWeekStart(baseDate, weekOffset = 0) {
  const d = new Date(baseDate);
  const dow = d.getDay(); // 0=Sun
  // go back to Monday
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diffToMon + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function formatShortDate(d) {
  return `${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getDate()}`;
}

// ─────────────────────────────────────────────
// TASK HELPERS
// ─────────────────────────────────────────────
function getTasksForDate(date) {
  const dow = date.getDay(); // 0=Sun..6=Sat
  const key = dateKey(date);
  // Check if we have per-date overrides
  if (state.tasks[key]) return state.tasks[key];
  // Fall back to day-of-week template (Mon=1..Fri=5)
  if (dow >= 1 && dow <= 5) return state.tasks[dow] || {};
  return {};
}

function getCompletionForSlot(date, hour) {
  return !!state.completions[slotKey(date, hour)];
}

function setCompletionForSlot(date, hour, val) {
  if (val) {
    state.completions[slotKey(date, hour)] = true;
  } else {
    delete state.completions[slotKey(date, hour)];
  }
  saveState();
}

function addTaskToDate(date, hour, name) {
  const key = dateKey(date);
  if (!state.tasks[key]) {
    // copy from DOW template
    const dow = date.getDay();
    state.tasks[key] = dow >= 1 && dow <= 5
      ? JSON.parse(JSON.stringify(state.tasks[dow] || {}))
      : {};
  }
  state.tasks[key][hour] = name;
  saveState();
}

function removeTaskFromDate(date, hour) {
  const key = dateKey(date);
  if (!state.tasks[key]) {
    const dow = date.getDay();
    state.tasks[key] = dow >= 1 && dow <= 5
      ? JSON.parse(JSON.stringify(state.tasks[dow] || {}))
      : {};
  }
  delete state.tasks[key][hour];
  delete state.completions[slotKey(date, hour)];
  saveState();
}

function calcDayProgress(date) {
  const tasks = getTasksForDate(date);
  const hours = Object.keys(tasks).map(Number);
  if (!hours.length) return { done: 0, total: 0, pct: 0 };
  const done = hours.filter(h => getCompletionForSlot(date, h)).length;
  return { done, total: hours.length, pct: Math.round((done / hours.length) * 100) };
}

function calcWeekProgress(weekStart) {
  let totalDone = 0, totalTasks = 0;
  for (let i = 0; i < 5; i++) {
    const day = addDays(weekStart, i);
    const { done, total } = calcDayProgress(day);
    totalDone += done; totalTasks += total;
  }
  if (!totalTasks) return 0;
  return Math.round((totalDone / totalTasks) * 100);
}

// ─────────────────────────────────────────────
// CALENDAR RENDER
// ─────────────────────────────────────────────
function renderCalendar() {
  document.getElementById('cal-month-name').textContent = MONTH_NAMES[state.calMonth];
  document.getElementById('cal-year').textContent = state.calYear;

  const container = document.getElementById('cal-days');
  container.innerHTML = '';

  const firstDay = new Date(state.calYear, state.calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate();

  // Get current week range
  const weekStart = getWeekStart(state.selectedDate, state.weekOffset);
  const weekEnd = addDays(weekStart, 4); // Mon-Fri

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day cal-day--empty';
    container.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(state.calYear, state.calMonth, d);
    const el = document.createElement('div');
    el.textContent = d;

    const classes = ['cal-day'];
    const dow = date.getDay();
    if (dow === 0) classes.push('cal-day--sunday');
    if (dow === 6) classes.push('cal-day--saturday');
    if (isSameDay(date, state.today)) classes.push('cal-day--today');
    if (isSameDay(date, state.selectedDate)) classes.push('cal-day--selected');
    // Highlight the Mon-Fri of the current displayed week
    if (date >= weekStart && date <= weekEnd && dow >= 1 && dow <= 5) {
      classes.push('cal-day--in-week');
    }

    el.className = classes.join(' ');
    el.addEventListener('click', () => onCalDayClick(date));
    container.appendChild(el);
  }
}

function onCalDayClick(date) {
  state.selectedDate = new Date(date);
  state.weekOffset = 0;
  // Sync calendar view
  state.calYear = date.getFullYear();
  state.calMonth = date.getMonth();
  renderAll();
}

// ─────────────────────────────────────────────
// PLANNER TABLE RENDER
// ─────────────────────────────────────────────
function getDisplayedWeekDays() {
  const weekStart = getWeekStart(state.selectedDate, state.weekOffset);
  return Array.from({length: 5}, (_, i) => addDays(weekStart, i)); // Mon-Fri
}

function renderPlannerTable() {
  const days = getDisplayedWeekDays();

  // Update week label
  const weekStart = days[0], weekEnd = days[4];
  document.getElementById('week-range-label').textContent =
    `${formatShortDate(weekStart)} – ${formatShortDate(weekEnd)}, ${weekEnd.getFullYear()}`;

  // --- Day Header Row ---
  const headerRow = document.getElementById('day-header-row');
  // Clear all except first th (time col)
  while (headerRow.children.length > 1) headerRow.removeChild(headerRow.lastChild);

  days.forEach(day => {
    const isToday = isSameDay(day, state.today);
    const { done, total } = calcDayProgress(day);
    const th = document.createElement('th');
    const div = document.createElement('div');
    div.className = 'day-header-cell' + (isToday ? ' today-col' : '');
    div.innerHTML = `
      <span class="day-name">${DAY_ABBR[day.getDay()]}</span>
      <span class="day-date-fraction">${done}/${total}</span>
    `;
    th.appendChild(div);
    headerRow.appendChild(th);
  });

  // --- Progress Row ---
  const progressRow = document.getElementById('progress-row');
  while (progressRow.children.length > 1) progressRow.removeChild(progressRow.lastChild);

  days.forEach(day => {
    const { pct } = calcDayProgress(day);
    const th = document.createElement('th');
    th.innerHTML = `
      <div class="progress-cell">
        <span class="progress-pct">${pct}%</span>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
    progressRow.appendChild(th);
  });

  // --- Body Rows ---
  const tbody = document.getElementById('planner-body');
  tbody.innerHTML = '';

  HOURS.forEach(hour => {
    const tr = document.createElement('tr');
    tr.className = 'planner-body-row';

    // Time cell
    const timeTd = document.createElement('td');
    timeTd.className = 'time-cell';
    timeTd.textContent = `${pad2(hour)}:00`;
    tr.appendChild(timeTd);

    days.forEach(day => {
      const td = document.createElement('td');
      const isToday = isSameDay(day, state.today);
      if (isToday) td.classList.add('today-col-cell');

      const tasks = getTasksForDate(day);
      const taskName = tasks[hour];
      const isCompleted = getCompletionForSlot(day, hour);

      const slot = document.createElement('div');
      slot.className = 'task-slot' + (taskName ? ' has-task' : '');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = isCompleted;
      checkbox.setAttribute('aria-label', taskName ? `${taskName} at ${pad2(hour)}:00` : `Add task at ${pad2(hour)}:00`);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'task-slot-name' + (isCompleted ? ' completed' : '');
      nameSpan.textContent = taskName || '';

      const startInlineEdit = () => {
        if (!taskName && !slot.classList.contains('editing')) {
          openAddTaskModal(day, hour);
          return;
        }
        if (slot.classList.contains('editing')) return;
        slot.classList.add('editing');

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-inline-edit-input';
        editInput.value = taskName || '';

        const finishEdit = () => {
          const newName = editInput.value.trim();
          if (newName) {
            addTaskToDate(day, hour, newName);
          } else {
            removeTaskFromDate(day, hour);
          }
          renderPlannerTable();
          updateHeaderStats();
        };

        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') finishEdit();
          if (e.key === 'Escape') {
            renderPlannerTable();
          }
        });
        editInput.addEventListener('blur', finishEdit);

        nameSpan.replaceWith(editInput);
        if (slot.querySelector('.task-slot-actions')) {
          slot.querySelector('.task-slot-actions').style.display = 'none';
        }
        editInput.focus();
        editInput.select();
      };

      nameSpan.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        startInlineEdit();
      });
      nameSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        if (taskName) startInlineEdit();
      });

      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        setCompletionForSlot(day, hour, checkbox.checked);
        nameSpan.classList.toggle('completed', checkbox.checked);
        updateProgressForDay(day, days.indexOf(day));
        updateHeaderStats();
      });

      slot.appendChild(checkbox);
      slot.appendChild(nameSpan);

      if (taskName) {
        // Actions: edit & delete
        const actions = document.createElement('div');
        actions.className = 'task-slot-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'task-action-btn edit';
        editBtn.textContent = '✏️';
        editBtn.title = 'Edit task';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          startInlineEdit();
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'task-action-btn del';
        delBtn.textContent = '✕';
        delBtn.title = 'Remove task';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeTaskFromDate(day, hour);
          renderPlannerTable();
          updateHeaderStats();
        });

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        slot.appendChild(actions);
      } else {
        // Add button
        const addBtn = document.createElement('button');
        addBtn.className = 'add-slot-btn';
        addBtn.textContent = '+ Add';
        addBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openAddTaskModal(day, hour);
        });
        slot.appendChild(addBtn);

        // Click empty slot to add/edit task
        slot.addEventListener('click', () => openAddTaskModal(day, hour));
      }

      td.appendChild(slot);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function updateProgressForDay(day, dayIndex) {
  const { done, total, pct } = calcDayProgress(day);
  // Update header fraction
  const headerRow = document.getElementById('day-header-row');
  const dayTh = headerRow.children[dayIndex + 1];
  if (dayTh) {
    const frac = dayTh.querySelector('.day-date-fraction');
    if (frac) frac.textContent = `${done}/${total}`;
  }
  // Update progress bar
  const progressRow = document.getElementById('progress-row');
  const progressTh = progressRow.children[dayIndex + 1];
  if (progressTh) {
    const pctEl = progressTh.querySelector('.progress-pct');
    const barEl = progressTh.querySelector('.progress-bar-fill');
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (barEl) barEl.style.width = `${pct}%`;
  }
}

// ─────────────────────────────────────────────
// IMPORTANT TASKS RENDER
// ─────────────────────────────────────────────
function renderImportantTasks() {
  const container = document.getElementById('important-tasks');
  container.innerHTML = '';
  state.importantTasks.forEach((task) => {
    const item = document.createElement('div');
    item.className = 'important-task-item';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.done;
    cb.id = `imp-${task.id}`;
    cb.addEventListener('change', () => {
      task.done = cb.checked;
      nameEl.classList.toggle('completed', cb.checked);
      saveState();
    });

    const nameEl = document.createElement('span');
    nameEl.className = 'important-task-name' + (task.done ? ' completed' : '');
    nameEl.textContent = task.name;

    const startEditingImportant = () => {
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'task-inline-edit-input';
      editInput.value = task.name;

      const finishEdit = () => {
        const newName = editInput.value.trim();
        if (newName) {
          task.name = newName;
          saveState();
        } else {
          // delete if empty
          state.importantTasks = state.importantTasks.filter(t => t.id !== task.id);
          saveState();
        }
        renderImportantTasks();
      };

      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finishEdit();
        if (e.key === 'Escape') renderImportantTasks();
      });
      editInput.addEventListener('blur', finishEdit);

      nameEl.replaceWith(editInput);
      if (actions) actions.style.display = 'none';
      editInput.focus();
      editInput.select();
    };

    nameEl.addEventListener('click', (e) => {
      e.stopPropagation();
      startEditingImportant();
    });

    const actions = document.createElement('div');
    actions.className = 'important-task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'task-action-btn edit';
    editBtn.textContent = '✏️';
    editBtn.title = 'Edit item';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startEditingImportant();
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'task-action-btn del';
    delBtn.textContent = '✕';
    delBtn.title = 'Delete item';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      state.importantTasks = state.importantTasks.filter(t => t.id !== task.id);
      saveState();
      renderImportantTasks();
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    item.appendChild(cb);
    item.appendChild(nameEl);
    item.appendChild(actions);
    container.appendChild(item);
  });
}

// ─────────────────────────────────────────────
// HEADER STATS
// ─────────────────────────────────────────────
function updateHeaderStats() {
  // Today
  const { pct: todayPct } = calcDayProgress(state.today);
  document.getElementById('today-rate').textContent = `${todayPct}%`;

  // This week (week containing today)
  const weekStart = getWeekStart(state.today, 0);
  const weekPct = calcWeekProgress(weekStart);
  document.getElementById('week-rate').textContent = `${weekPct}%`;
}

// ─────────────────────────────────────────────
// MODAL LOGIC
// ─────────────────────────────────────────────
function openAddTaskModal(day, hour) {
  state.modal = { open: true, context: { type: 'slot', day, hour } };
  document.getElementById('modal-title').textContent = `Add Task — ${DAY_NAMES[day.getDay()]} ${pad2(hour)}:00`;
  document.getElementById('modal-task-name').value = '';
  document.getElementById('modal-time-label').style.display = 'none';
  document.getElementById('modal-time-slot').style.display = 'none';
  document.getElementById('modal-day-label').style.display = 'none';
  document.getElementById('modal-day-select').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-task-name').focus(), 80);
}

function openAddImportantModal() {
  state.modal = { open: true, context: { type: 'important' } };
  document.getElementById('modal-title').textContent = 'Add Important Task';
  document.getElementById('modal-task-name').value = '';
  document.getElementById('modal-time-label').style.display = 'none';
  document.getElementById('modal-time-slot').style.display = 'none';
  document.getElementById('modal-day-label').style.display = 'none';
  document.getElementById('modal-day-select').style.display = 'none';
  document.getElementById('modal-overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('modal-task-name').focus(), 80);
}

function closeModal() {
  state.modal = { open: false, context: null };
  document.getElementById('modal-overlay').style.display = 'none';
}

function confirmModal() {
  const name = document.getElementById('modal-task-name').value.trim();
  if (!name) {
    document.getElementById('modal-task-name').focus();
    return;
  }

  const ctx = state.modal.context;
  if (ctx.type === 'slot') {
    addTaskToDate(ctx.day, ctx.hour, name);
    renderPlannerTable();
    updateHeaderStats();
  } else if (ctx.type === 'important') {
    state.importantTasks.push({
      id: `imp${Date.now()}`,
      name,
      done: false,
    });
    saveState();
    renderImportantTasks();
  }
  closeModal();
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────
document.getElementById('prev-month').addEventListener('click', () => {
  state.calMonth--;
  if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
  renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
  state.calMonth++;
  if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
  renderCalendar();
});

document.getElementById('prev-week').addEventListener('click', () => {
  state.weekOffset--;
  // Move selectedDate back by 7
  state.selectedDate = addDays(state.selectedDate, -7);
  state.calYear = state.selectedDate.getFullYear();
  state.calMonth = state.selectedDate.getMonth();
  renderAll();
});

document.getElementById('next-week').addEventListener('click', () => {
  state.weekOffset++;
  state.selectedDate = addDays(state.selectedDate, 7);
  state.calYear = state.selectedDate.getFullYear();
  state.calMonth = state.selectedDate.getMonth();
  renderAll();
});

document.getElementById('add-important-btn').addEventListener('click', openAddImportantModal);

document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-confirm').addEventListener('click', confirmModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});
document.getElementById('modal-task-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmModal();
  if (e.key === 'Escape') closeModal();
});

// ─────────────────────────────────────────────
// RENDER ALL
// ─────────────────────────────────────────────
function renderAll() {
  renderCalendar();
  renderPlannerTable();
  renderImportantTasks();
  updateHeaderStats();
}

// ─────────────────────────────────────────────
// INITIAL RENDER
// ─────────────────────────────────────────────
renderAll();
