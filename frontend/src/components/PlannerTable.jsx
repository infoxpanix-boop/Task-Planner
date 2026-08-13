import { DAY_ABBR, HOURS, isSameDay, pad2 } from '../dateUtils';
import { getTasksForDate, getCompletionForSlot, calcDayProgress } from '../plannerLogic';
import TaskSlot from './TaskSlot';

export default function PlannerTable({
  days,
  today,
  tasks,
  completions,
  onToggleCompletion,
  onSaveTask,
  onDeleteTask,
  onOpenAdd,
}) {
  return (
    <div className="planner-scroll-area">
      <div className="planner-table-wrapper">
        <table className="planner-table">
          <thead>
            <tr className="day-header-row">
              <th className="time-col-header" />
              {days.map((day) => {
                const isToday = isSameDay(day, today);
                const { done, total } = calcDayProgress(tasks, completions, day);
                return (
                  <th key={day.toISOString()}>
                    <div className={'day-header-cell' + (isToday ? ' today-col' : '')}>
                      <span className="day-name">{DAY_ABBR[day.getDay()]}</span>
                      <span className="day-date-fraction">{done}/{total}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
            <tr className="progress-row">
              <th className="time-col-header" />
              {days.map((day) => {
                const { pct } = calcDayProgress(tasks, completions, day);
                return (
                  <th key={day.toISOString()}>
                    <div className="progress-cell">
                      <span className="progress-pct">{pct}%</span>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour} className="planner-body-row">
                <td className="time-cell">{pad2(hour)}:00</td>
                {days.map((day) => {
                  const isToday = isSameDay(day, today);
                  const dayTasks = getTasksForDate(tasks, day);
                  const taskName = dayTasks[hour];
                  const isCompleted = getCompletionForSlot(completions, day, hour);
                  return (
                    <td key={day.toISOString()} className={isToday ? 'today-col-cell' : undefined}>
                      <TaskSlot
                        day={day}
                        hour={hour}
                        taskName={taskName}
                        isCompleted={isCompleted}
                        onToggle={onToggleCompletion}
                        onSave={onSaveTask}
                        onDelete={onDeleteTask}
                        onOpenAdd={onOpenAdd}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
