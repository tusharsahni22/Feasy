import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Tag, Plus, Check, X, Percent, IndianRupee } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Field from '../components/ui/Field.jsx';
import Badge from '../components/ui/Badge.jsx';
import { DiscountsAPI } from '../api/endpoints.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { formatDate } from '../lib/format.js';

export default function Discounts() {
  const { money } = useSettings();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    value: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    try {
      const data = await DiscountsAPI.list();
      setCoupons(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error('Enter coupon code');
      return;
    }
    setSaving(true);
    try {
      await DiscountsAPI.create(form);
      toast.success('Discount coupon created!');
      setShowAdd(false);
      setForm({
        code: '',
        description: '',
        discountType: 'percentage',
        value: 10,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
      });
      loadCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not create coupon');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id) {
    try {
      await DiscountsAPI.toggle(id);
      loadCoupons();
    } catch (err) {
      toast.error(err.message || 'Could not update status');
    }
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">Promotions &amp; Growth</div>
          <h2>Discount Codes &amp; Coupons</h2>
          <p>Create percentage or flat discount vouchers applicable during member fee collection.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowAdd(true)}>
          New coupon
        </Button>
      </div>

      <Card title="Active &amp; Past Coupons">
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div className="spinner" />
          </div>
        ) : coupons.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)' }}>
            No discount codes created yet. Click &quot;New coupon&quot; to offer promotions!
          </div>
        ) : (
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Max Cap</th>
                  <th>Times Used</th>
                  <th>Status</th>
                  <th className="right">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c._id}>
                    <td className="cell-main">
                      <div className="hstack" style={{ gap: 8 }}>
                        <Tag size={16} color="var(--saffron)" />
                        <strong style={{ fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.5px' }}>
                          {c.code}
                        </strong>
                      </div>
                      {c.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge tone={c.discountType === 'percentage' ? 'sky' : 'emerald'}>
                        {c.discountType === 'percentage' ? `${c.value}% OFF` : `${money(c.value)} OFF`}
                      </Badge>
                    </td>
                    <td>{c.minOrderAmount > 0 ? money(c.minOrderAmount) : 'None'}</td>
                    <td>{c.maxDiscountAmount > 0 ? money(c.maxDiscountAmount) : 'No cap'}</td>
                    <td>
                      {c.usageCount}
                      {c.usageLimit > 0 ? ` / ${c.usageLimit}` : ' (Unlimited)'}
                    </td>
                    <td>
                      <Badge tone={c.isActive ? 'emerald' : 'neutral'}>
                        {c.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="right">
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => handleToggle(c._id)}
                      >
                        {c.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showAdd && (
        <Modal
          title="Create Discount Code"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <Button variant="subtle" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating…' : 'Create Coupon'}
              </Button>
            </>
          }
        >
          <div className="form-grid">
            <Field label="Coupon Code" className="full">
              <input
                className="input"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                placeholder="e.g. SUMMER50 or DIWALI"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </Field>

            <Field label="Discount Type">
              <select
                className="select"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
              >
                <option value="percentage">Percentage (% off)</option>
                <option value="flat">Flat Amount (₹ off)</option>
              </select>
            </Field>

            <Field label="Discount Value">
              <input
                type="number"
                className="input"
                value={form.value}
                min={1}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              />
            </Field>

            <Field label="Minimum Bill Amount (₹)">
              <input
                type="number"
                className="input"
                value={form.minOrderAmount}
                min={0}
                onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
              />
            </Field>

            <Field label="Max Discount Cap (₹)" hint="0 for unlimited">
              <input
                type="number"
                className="input"
                value={form.maxDiscountAmount}
                min={0}
                onChange={(e) => setForm({ ...form, maxDiscountAmount: Number(e.target.value) })}
              />
            </Field>

            <Field label="Description (optional)" className="full">
              <input
                className="input"
                placeholder="e.g. Summer fitness camp discount"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
