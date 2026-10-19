import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, Building2, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Field from '../components/ui/Field.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 54,
              height: 54,
              borderRadius: 16,
              background: 'linear-gradient(135deg, var(--saffron), var(--coral))',
              color: '#0E1220',
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 14,
            }}
          >
            FE
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Welcome to Feasy</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            Sign in to access your business workspace
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="stack" style={{ gap: 16 }}>
            <Field label="Email address">
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input"
                  style={{ paddingLeft: 38 }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@feasy.io"
                  required
                />
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-faint)',
                  }}
                />
              </div>
            </Field>

            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input"
                  style={{ paddingLeft: 38 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-faint)',
                  }}
                />
              </div>
            </Field>

            <Button
              type="submit"
              variant="primary"
              icon={LogIn}
              block
              disabled={submitting}
              style={{ marginTop: 6 }}
            >
              {submitting ? 'Authenticating…' : 'Sign in to workspace'}
            </Button>
          </form>
        </Card>

        <div
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 13.5,
            color: 'var(--text-dim)',
          }}
        >
          Want to start a new institute or gym workspace?{' '}
          <Link
            to="/register"
            style={{
              color: 'var(--saffron)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
