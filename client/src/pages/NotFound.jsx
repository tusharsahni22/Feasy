import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="empty" style={{ paddingTop: 72 }}>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 68,
          fontWeight: 700,
          color: 'var(--saffron)',
          lineHeight: 1,
        }}
      >
        404
      </div>
      <h4>Page not found</h4>
      <p>The page you were looking for doesn’t exist or has moved.</p>
      <Link to="/">
        <Button variant="primary" icon={Home}>
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
