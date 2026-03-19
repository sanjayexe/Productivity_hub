import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const Search = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);

  const performSearch = useCallback(async () => {
    if (!query) return;
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      };
      const { data } = await axios.get(
        `http://localhost:5000/api/search?q=${encodeURIComponent(query)}`,
        config,
      );
      setResults(data);
    } catch (err) {
      console.error("search error", err);
    }
  }, [query]);

  useEffect(() => {
    performSearch();
  }, [query, performSearch]);

  return (
    <div className="search-modal">
      <div className="search-box">
        <input
          autoFocus
          placeholder="Search tasks, notes, events..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={onClose}>×</button>
      </div>
      {results && (
        <div className="search-results">
          <h4>Tasks</h4>
          {results.tasks.map((t) => (
            <div key={t._id}>{t.title}</div>
          ))}
          <h4>Notes</h4>
          {results.notes.map((n) => (
            <div key={n._id}>{n.content}</div>
          ))}
          <h4>Events</h4>
          {results.events.map((e) => (
            <div key={e._id}>{e.title}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
