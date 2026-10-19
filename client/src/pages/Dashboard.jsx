import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  Clock3,
  CalendarClock,
  BellRing,
  UserPlus,
  ArrowRight,
  Users2,
} from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { DashboardAPI } from '../api/endpoints.js';
import { useSettings } from '../context/SettingsContext.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { Loading } from '../components/ui/Loader.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import SubscriptionBar from '../components/ui/SubscriptionBar.jsx';
import CollectionTrend from '../components/charts/CollectionTrend.jsx';
import StudentsByClass from '../components/charts/StudentsByClass.jsx';
import SubscriptionDonut from '../components/charts/SubscriptionDonut.jsx';
import { initials } from '../lib/format.js';

function ExpiringRow({ s }) {
  return (
    <Link to={`/students/${s._id}`} className="expiry-row" style={{ color: 'inherit' }}>
      <div className="person">
        <div className="avatar">{initials(s.name)}</div>
        <div className="who">
          <span className="nm">{s.name}</span>
          <span className="sub">{s.classPlan?.name || '—'}</span>
        </div>
      </div>
      <div style={{ justifySelf: 'end' }}>
        <SubscriptionBar days={s.remainingDays} />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { money, labels } = useSettings();
  const { data: summary, loading } = useApi(() => DashboardAPI.summary(), []);
  const { data: charts } = useApi(() => DashboardAPI.charts(), []);
  const { data: expiring } = useApi(() => DashboardAPI.expiring({ limit: 7 }), []);

  if (loading || !summary) return <Loading label="Loading your dashboard…" />;

  const m = summary.money;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Overview</div>
          <h2>Good to see you</h2>
          <p>
            Here’s how {summary.institute} is doing — collections, dues and whose subscription is
            about to lapse.
          </p>
        </div>
        <Link to="/students/new">
          <Button variant="primary" icon={UserPlus}>
            {labels.enrollAction}
          </Button>
        </Link>
      </div>

      <div className="grid grid-kpi" style={{ marginBottom: 18 }}>
        <div className="rise rise-1">
          <StatCard
            label="Expected / month"
            value={money(m.expectedMonthly)}
            foot={
              <>
                from <b>{summary.students.active}</b> active {labels.memberPlural.toLowerCase()}
              </>
            }
            icon={Wallet}
            tone="saffron"
          />
        </div>
        <div className="rise rise-2">
          <StatCard
            label="Collected this month"
            value={money(m.collectedThisMonth)}
            foot={
              <>
                <b>{m.paymentsThisMonth}</b> payments recorded
              </>
            }
            icon={TrendingUp}
            tone="emerald"
          />
        </div>
        <div className="rise rise-3">
          <StatCard
            label="Pending this month"
            value={money(m.pendingThisMonth)}
            foot={
              <>
                <b>{summary.collection.studentsDue}</b> {labels.memberPlural.toLowerCase()} yet to pay
              </>
            }
            icon={Clock3}
            tone="coral"
          />
        </div>
        <div className="rise rise-4">
          <StatCard
            label="Pending yearly income"
            value={money(m.pendingYearly)}
            foot={
              <>
                of {money(m.expectedAnnual)} projected
              </>
            }
            icon={CalendarClock}
            tone="violet"
          />
        </div>
      </div>

      <div className="grid dash-cols" style={{ marginBottom: 18 }}>
        <Card title="Collection trend" subtitle={`${labels.feeLabel} collected over the last 6 months`}>
          <CollectionTrend data={charts?.monthlyCollection || []} />
        </Card>
        <Card title="Subscriptions" subtitle={`Where every ${labels.memberSingular.toLowerCase()} stands today`}>
          <SubscriptionDonut data={charts?.subscriptionBreakdown || []} />
        </Card>
      </div>

      <div className="grid grid-2">
        <Card title={`${labels.memberPlural} by ${labels.categorySingular.toLowerCase()}`} subtitle="Active enrolment spread">
          {charts?.studentsByClass?.length ? (
            <StudentsByClass data={charts.studentsByClass} />
          ) : (
            <EmptyState icon={Users2} title={`No ${labels.memberPlural.toLowerCase()} yet`} hint={`Add your first ${labels.memberSingular.toLowerCase()} to see the spread.`} />
          )}
        </Card>

        <Card
          title="Expiring soonest"
          subtitle="Renewals to chase first"
          actions={
            <Link to="/reminders">
              <Button variant="subtle" size="sm" iconRight={ArrowRight}>
                Reminders
              </Button>
            </Link>
          }
          bodyClass="tight"
        >
          {expiring?.length ? (
            <div style={{ padding: '0 12px' }}>
              {expiring.map((s) => (
                <ExpiringRow key={s._id} s={s} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BellRing}
              title="Nothing expiring"
              hint={`Every active ${labels.memberSingular.toLowerCase()} has a healthy runway.`}
            />
          )}
        </Card>
      </div>
    </>
  );
}
