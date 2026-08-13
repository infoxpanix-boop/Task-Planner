import { useAuth } from '../AuthContext';

export default function Header({ todayPct, weekPct }) {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-icon">📚</div>
        <h1 className="app-title">Task Planner</h1>
      </div>
      <div className="header-stats">
        <div className="stat-card">
          <div className="stat-value">{todayPct}%</div>
          <div className="stat-label">Today completion rate</div>
          <div className="stat-arrow">▶</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{weekPct}%</div>
          <div className="stat-label">Week completion rate</div>
          <div className="stat-arrow">▶</div>
        </div>
        {user && (
          <div className="user-menu">
            <span className="user-email">{user.name || user.email}</span>
            <button type="button" className="logout-btn" onClick={logout}>Log Out</button>
          </div>
        )}
      </div>
    </header>
  );
}
