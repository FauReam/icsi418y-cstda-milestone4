import { ChevronLeft, ChevronRight } from "lucide-react";
import { dateKey, longDate, monthCells } from "../date";
export function Calendar({
  month,
  setMonth,
  selected,
  selectDate,
  events,
  today,
}) {
  function move(delta) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1, 12);
    if (next.getFullYear() >= 1900 && next.getFullYear() <= 2100)
      setMonth(next);
  }
  const label = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return (
    <section className="calendar-panel" aria-label="Monthly calendar">
      <header className="calendar-header">
        <h2>{label}</h2>
        <div className="calendar-controls">
          <button className="secondary small" onClick={() => selectDate(today)}>
            Today
          </button>
          <button
            className="icon-button"
            aria-label="Previous month"
            disabled={month.getFullYear() === 1900 && month.getMonth() === 0}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="icon-button"
            aria-label="Next month"
            disabled={month.getFullYear() === 2100 && month.getMonth() === 11}
            onClick={() => move(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>
      <div className="weekdays" aria-hidden="true">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {monthCells(month).map((day) => {
          const key = dateKey(day),
            rows = events.filter((event) => event.date === key),
            current = day.getMonth() === month.getMonth();
          return (
            <button
              key={key}
              disabled={day.getFullYear() < 1900 || day.getFullYear() > 2100}
              className={`day ${current ? "" : "outside"} ${key === selected ? "selected" : ""}`}
              aria-label={`${longDate(key)}; ${rows.length} events`}
              aria-pressed={key === selected}
              onClick={() => selectDate(key)}
            >
              <span className={`day-number ${key === today ? "today" : ""}`}>
                {day.getDate()}
              </span>
              <span className="day-events">
                {rows.slice(0, 2).map((event) => (
                  <span
                    key={event._id}
                    className="calendar-event"
                    style={{ "--event-color": event.effective_color }}
                  >
                    <span className="event-time">{event.start_time}</span>{" "}
                    {event.title}
                  </span>
                ))}
                {rows.length > 2 && (
                  <span className="more-events">+{rows.length - 2} more</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
