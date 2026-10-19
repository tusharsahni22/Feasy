import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Building2, Lock, Mail, User, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Field from '../components/ui/Field.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    orgName: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    businessType: 'gym',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.orgName.trim() || !form.name.trim() || !form.email.trim() || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      toast.success('Workspace created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
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
        padding: '30px 20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
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
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            Create your SaaS workspace
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            Get started with an isolated management environment in seconds
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="stack" style={{ gap: 14 }}>
            <Field label="Business / Institute Name">
              <input
                className="input"
                value={form.orgName}
                onChange={set('orgName')}
                placeholder="e.g. Iron Gym, Apex Coaching, Central Library"
                required
              />
            </Field>

            <Field label="Primary Business Niche">
              <select className="select" value={form.businessType} onChange={set('businessType')}>
                <option value="gym">Fitness Centre / Gym / Yoga Studio</option>
                <option value="education">Education / Coaching / Tuition</option>
                <option value="library">Library / Co-working Space</option>
                <option value="general">Subscription / Membership Club</option>
              </select>
            </Field>

            <div className="form-grid">
              <Field label="Your Name">
                <input
                  className="input"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Alex Morgan"
                  required
                />
              </Field>

              <Field label="Mobile Phone">
                <input
                  className="input"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="10-digit number"
                />
              </Field>
            </div>

            <Field label="Work Email">
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={set('email')}
                placeholder="alex@yourdomain.com"
                required
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={set('password')}
                placeholder="Minimum 6 characters"
                required
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              icon={UserPlus}
              block
              disabled={submitting}
              style={{ marginTop: 8 }}
            >
              {submitting ? 'Creating workspace…' : 'Start Workspace'}
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
          Already have an existing workspace?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--saffron)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
