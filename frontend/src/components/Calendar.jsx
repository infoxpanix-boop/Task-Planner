import { MONTH_NAMES, addDays, isSameDay } from '../dateUtils';

export default function Calendar({
  calYear,
  calMonth,
  selectedDate,
  today,
  weekStart,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}) {
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const weekEnd = addDays(weekStart, 4);

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="cal-day cal-day--empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calYear, calMonth, d);
    const dow = date.getDay();
    const classes = ['cal-day'];
    if (dow === 0) classes.push('cal-day--sunday');
    if (dow === 6) classes.push('cal-day--saturday');
    if (isSameDay(date, today)) classes.push('cal-day--today');
    if (isSameDay(date, selectedDate)) classes.push('cal-day--selected');
    if (date >= weekStart && date <= weekEnd && dow >= 1 && dow <= 5) {
      classes.push('cal-day--in-week');
    }
    cells.push(
      <button key={d} type="button" className={classes.join(' ')} onClick={() => onDayClick(date)}>
        {d}
      </button>
    );
  }

  return (
    <div className="calendar-section">
      <div className="calendar-nav">
        <button type="button" className="cal-nav-btn" aria-label="Previous month" onClick={onPrevMonth}>
          &#8249;
        </button>
        <div className="cal-month-year">
          <span>{MONTH_NAMES[calMonth]}</span>
          <span>{calYear}</span>
        </div>
        <button type="button" className="cal-nav-btn" aria-label="Next month" onClick={onNextMonth}>
          &#8250;
        </button>
      </div>
      <div className="calendar-grid">
        <div className="cal-header-row">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div className="cal-days">{cells}</div>
      </div>
      <div className="today-highlight-label">
        <span className="highlight-dot" /> TODAY HIGHLIGHT
      </div>
    </div>
  );
}
