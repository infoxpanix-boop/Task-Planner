import { useAuth } from './AuthContext';
import AuthForm from './components/AuthForm';
import Planner from './components/Planner';

export default function App() {
  const { user, checking } = useAuth();

  if (checking) {
    return <div className="auth-screen">Loading…</div>;
  }

  if (!user) {
    return <AuthForm />;
  }

  return <Planner />;
}
