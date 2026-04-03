import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allDay, setAllDay] = useState(false);

  const fetchEvents = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      const { data } = await axios.get(`${API_BASE_URL}/api/events`, config);
      setEvents(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Calendar Logic
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleDateClick = (day) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    setSelectedDate(date);

    // Pre-fill form start date (adjust for timezone offset to match input type="datetime-local")
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date - tzOffset).toISOString().slice(0, 16);
    setStart(localISOTime);

    // Set end time 1 hour later
    const endDate = new Date(date - tzOffset);
    endDate.setHours(endDate.getHours() + 1);
    setEnd(endDate.toISOString().slice(0, 16));
  };

  const addEvent = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      await axios.post(
        `${API_BASE_URL}/api/events`,
        { title, description, start, end, allDay },
        config,
      );
      setTitle("");
      setDescription("");
      setAllDay(false);
      fetchEvents();
    } catch (error) {
      console.error(error);
    }
  };

  const getEventsForDay = (day) => {
    return events.filter((e) => {
      const eventDate = new Date(e.start);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>Calendar</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button
            onClick={prevMonth}
            className="btn-primary"
            style={{ padding: "0.5rem 1rem" }}
          >
            &lt;
          </button>
          <h2 style={{ margin: 0, minWidth: "200px", textAlign: "center" }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={nextMonth}
            className="btn-primary"
            style={{ padding: "0.5rem 1rem" }}
          >
            &gt;
          </button>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "2rem" }}
      >
        {/* Visual Calendar */}
        <div className="card" style={{ padding: "1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              marginBottom: "1rem",
              textAlign: "center",
              fontWeight: "bold",
              color: "var(--text-secondary)",
            }}
          >
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "0.5rem",
            }}
          >
            {/* Empty slots for previous month */}
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} style={{ height: "100px" }}></div>
            ))}

            {/* Days of Month */}
            {[...Array(days)].map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isSelected =
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentDate.getMonth() &&
                selectedDate.getFullYear() === currentDate.getFullYear();
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={day}
                  onClick={() => handleDateClick(day)}
                  style={{
                    height: "100px",
                    border: isSelected
                      ? "2px solid var(--primary-color)"
                      : "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "0.5rem",
                    cursor: "pointer",
                    background: isToday
                      ? "rgba(99, 102, 241, 0.1)"
                      : "transparent",
                    transition: "all 0.2s",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-color)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isToday
                      ? "rgba(99, 102, 241, 0.1)"
                      : "transparent")
                  }
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "0.25rem",
                      color: isToday ? "var(--primary-color)" : "inherit",
                    }}
                  >
                    {day}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    {dayEvents.map((ev) => (
                      <div
                        key={ev._id}
                        style={{
                          fontSize: "0.7rem",
                          background: "var(--primary-color)",
                          color: "white",
                          padding: "2px 4px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel: Selected Date & Add Event */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>{selectedDate.toDateString()}</h3>
            <div
              style={{
                marginBottom: "1.5rem",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {getEventsForDay(selectedDate.getDate()).length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>
                  No events for this day.
                </p>
              ) : (
                getEventsForDay(selectedDate.getDate()).map((ev) => (
                  <div
                    key={ev._id}
                    style={{
                      marginBottom: "0.5rem",
                      padding: "0.5rem",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{ev.title}</div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {new Date(ev.start).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <hr
              style={{ borderColor: "var(--border-color)", margin: "1rem 0" }}
            />

            <h4>Add Event</h4>
            <form onSubmit={addEvent}>
              <div style={{ marginBottom: "0.5rem" }}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event Title"
                  required
                />
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid var(--border-color)",
                    background: "var(--input-bg)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
              <div
                style={{
                  marginBottom: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <input
                  type="checkbox"
                  id="allDay"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                />
                <label htmlFor="allDay">All Day Event</label>
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <input
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%" }}
              >
                Create
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
