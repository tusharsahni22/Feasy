import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Send,
  Save,
  Sparkles,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Dumbbell,
  FileText,
  Copy,
} from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import { DietAPI } from '../../api/endpoints.js';

// Pre-built popular templates for non-technical users
export const DIET_TEMPLATES = [
  {
    id: 'fat_loss',
    name: 'Fat Loss & Shred',
    title: 'Fat Loss & Lean Definition Plan',
    calories: 1600,
    target: 'Fat Loss',
    meals: {
      breakfast: '3 Boiled eggs (2 whites, 1 whole) + Oats with water and fruits + Black coffee / Green tea',
      midMorning: '1 Apple or 10 soaked almonds + Green tea',
      lunch: '150g Grilled chicken breast / Paneer tikka + 1 cup Brown rice / 2 Multigrain rotis + Green salad + Dal',
      evening: '1 Scoop Whey protein with water OR Roasted chana (handful)',
      dinner: 'Sauteed vegetables (broccoli, bell peppers, beans) + Grilled fish / Tofu / Paneer soup',
    },
    tips: 'Drink 3.5 to 4 Liters of water daily. Avoid sugar, soft drinks, and refined white flour. Dinner before 8:30 PM.',
  },
  {
    id: 'muscle_gain',
    name: 'Muscle Gain & Bulk',
    title: 'Muscle Hypertrophy & Strength Bulk Plan',
    calories: 2600,
    target: 'Muscle Building',
    meals: {
      breakfast: '4 Whole eggs omelette + 2 slices Peanut butter toast + 1 Banana + Warm milk / shake',
      midMorning: 'Handful of mixed nuts (walnuts, almonds) + 1 seasonal fruit',
      lunch: '200g Chicken breast / Paneer + 1.5 cups Rice + 2 Rotis + Thick dal + Curd / Cucumber salad',
      evening: 'Pre-workout: 1 Black coffee + 1 Banana. Post-workout: 1 Scoop Whey + 2 Boiled eggs',
      dinner: '200g Fish / Paneer bhurji / Soya chunks + 2 Rotis + Mixed salad + 1 cup warm milk with turmeric before bed',
    },
    tips: 'Prioritize 8 hours of sleep for muscle recovery. Drink 4 Liters of water daily. Eat every 3 hours.',
  },
  {
    id: 'general_wellness',
    name: 'General Fitness & Energy',
    title: 'Balanced Nutrition & Daily Vitality Plan',
    calories: 2000,
    target: 'Maintenance & Energy',
    meals: {
      breakfast: 'Vegetable poha / Upma / Idli sambar OR 2 boiled eggs with toast + Fresh fruit',
      midMorning: 'Coconut water OR Buttermilk (Chaas) with roasted jeera',
      lunch: '2 Multigrain rotis + Seasonal sabzi + Dal tadka + Curd + Fresh salad',
      evening: 'Sprouted moong salad OR Roasted makhana + Green tea',
      dinner: 'Light vegetable khichdi / Mixed vegetable soup + Grilled paneer / boiled egg whites',
    },
    tips: 'Stay hydrated throughout the day. Keep a consistent meal schedule. Limit deep-fried snacks.',
  },
  {
    id: 'pure_veg',
    name: 'Pure Vegetarian High-Protein',
    title: 'Vegetarian High-Protein Fitness Plan',
    calories: 2100,
    target: 'Vegetarian Strength',
    meals: {
      breakfast: 'Besan / Moong dal chilla with paneer stuffing + Green chutney + Buttermilk',
      midMorning: '1 Fruit (Papaya / Apple) + 10 Almonds and 2 Walnuts',
      lunch: '150g Low-fat Paneer / Tofu curry + 1 cup Quinoa / Brown rice + Yellow dal + Salad',
      evening: 'Roasted soyabean / Sattu drink (30g sattu in water with lemon) + Green tea',
      dinner: 'Soya chunks stir-fry with broccoli and capsicum + 1 multigrain roti + Lentil soup',
    },
    tips: 'Sattu and Soya chunks are excellent plant-protein sources. Drink 3.5 Liters of water. Avoid heavy deep-fried snacks.',
  },
];

function mealsToText(meals, tips) {
  const parts = [];
  if (meals.breakfast) parts.push('Breakfast: ' + meals.breakfast);
  if (meals.midMorning) parts.push('Mid-Morning Snack: ' + meals.midMorning);
  if (meals.lunch) parts.push('Lunch: ' + meals.lunch);
  if (meals.evening) parts.push('Evening / Pre-Workout: ' + meals.evening);
  if (meals.dinner) parts.push('Dinner: ' + meals.dinner);
  if (tips) parts.push('Guidelines & Hydration: ' + tips);
  return parts.join('\n\n');
}

export default function DietPlanModal({ student, onClose, onUpdated }) {
  const [activeTab, setActiveTab] = useState('builder');
  const [title, setTitle] = useState(student?.dietPlan?.title || 'Personalized Fitness & Diet Plan');
  const [caloriesTarget, setCaloriesTarget] = useState(student?.dietPlan?.caloriesTarget || 2000);
  const [pdfUrl, setPdfUrl] = useState(student?.dietPlan?.pdfUrl || '');

  const [meals, setMeals] = useState({
    breakfast: '',
    midMorning: '',
    lunch: '',
    evening: '',
    dinner: '',
  });
  const [guidelines, setGuidelines] = useState(
    'Drink 3.5 - 4 Liters of clean water daily. Avoid processed sugar and carbonated drinks. Maintain 7-8 hours of quality sleep.'
  );

  const [rawDetails, setRawDetails] = useState(student?.dietPlan?.details || '');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  function applyTemplate(tpl) {
    setTitle(tpl.title);
    setCaloriesTarget(tpl.calories);
    setMeals({ ...tpl.meals });
    setGuidelines(tpl.tips);
    setRawDetails(mealsToText(tpl.meals, tpl.tips));
    toast.success('Applied ' + tpl.name + ' template!');
    setActiveTab('builder');
  }

  function getFinalDetails() {
    if (activeTab === 'builder') {
      const combined = mealsToText(meals, guidelines);
      return combined.trim() || rawDetails;
    }
    return rawDetails;
  }

  async function handleSave() {
    setSaving(true);
    const finalDetails = getFinalDetails();
    try {
      await DietAPI.updateStudent(student._id, {
        title,
        caloriesTarget: Number(caloriesTarget),
        details: finalDetails,
        pdfUrl,
      });
      toast.success('Diet plan saved for ' + student.name);
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not save diet plan');
    } finally {
      setSaving(false);
    }
  }

  async function handleSend(channel = 'whatsapp') {
    setSending(true);
    const finalDetails = getFinalDetails();
    try {
      await DietAPI.updateStudent(student._id, {
        title,
        caloriesTarget: Number(caloriesTarget),
        details: finalDetails,
        pdfUrl,
      });
      await DietAPI.send(student._id, { channel });
      toast.success('Diet plan dispatched via ' + channel + ' to ' + student.name + '!');
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not send diet plan');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      title={'Diet & Nutrition Plan - ' + student.name}
      onClose={onClose}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={saving || sending}>
            Cancel
          </Button>
          <Button variant="ghost" icon={Save} onClick={handleSave} disabled={saving || sending}>
            {saving ? 'Saving...' : 'Save Plan'}
          </Button>
          <Button
            variant="primary"
            icon={Send}
            onClick={() => handleSend('whatsapp')}
            disabled={saving || sending}
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
          >
            {sending ? 'Sending...' : 'Save & Send to WhatsApp'}
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 16 }}>
        <div
          className="hstack wrap"
          style={{
            gap: 8,
            background: 'var(--surface-2)',
            padding: 6,
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={'btn btn-sm ' + (activeTab === 'builder' ? 'btn-primary' : 'btn-subtle')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Utensils size={14} /> Visual Meal Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={'btn btn-sm ' + (activeTab === 'templates' ? 'btn-primary' : 'btn-subtle')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={14} /> 1-Click Templates
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'builder') setRawDetails(getFinalDetails());
              setActiveTab('custom');
            }}
            className={'btn btn-sm ' + (activeTab === 'custom' ? 'btn-primary' : 'btn-subtle')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FileText size={14} /> Text / Notes View
          </button>
        </div>

        {activeTab === 'templates' && (
          <div className="stack" style={{ gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Choose a proven fitness meal plan to load instantly without manual typing:
            </div>
            <div className="grid grid-2" style={{ gap: 12 }}>
              {DIET_TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => applyTemplate(t)}
                >
                  <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                    <strong style={{ fontSize: 15, color: 'var(--text-high)' }}>{t.name}</strong>
                    <span
                      style={{
                        fontSize: 11,
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: 'var(--saffron)',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontWeight: 700,
                      }}
                    >
                      {t.calories} kcal
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
                    Goal: {t.target}
                  </div>
                  <Button
                    variant="subtle"
                    size="sm"
                    icon={Copy}
                    onClick={(e) => {
                      e.stopPropagation();
                      applyTemplate(t);
                    }}
                  >
                    Load Template
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-grid">
          <Field label="Plan Title" className="full">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Muscle Gain 2400 Kcal Plan"
            />
          </Field>

          <Field label="Target Calories (kcal/day)">
            <input
              type="number"
              className="input"
              value={caloriesTarget}
              min={0}
              onChange={(e) => setCaloriesTarget(e.target.value)}
            />
          </Field>

          <Field label="PDF / Document Link (Optional)">
            <input
              className="input"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://example.com/diet-sheet.pdf"
            />
          </Field>
        </div>

        {activeTab === 'builder' && (
          <div className="stack" style={{ gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-high)' }}>
              Meal by Meal Schedule
            </div>

            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div className="hstack" style={{ gap: 6, marginBottom: 6, color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>
                <Coffee size={15} /> 1. Breakfast (Morning)
              </div>
              <input
                className="input"
                placeholder="e.g. 3 Boiled eggs + Oats with fruits + Almonds"
                value={meals.breakfast}
                onChange={(e) => setMeals({ ...meals, breakfast: e.target.value })}
              />
            </div>

            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div className="hstack" style={{ gap: 6, marginBottom: 6, color: '#38bdf8', fontSize: 13, fontWeight: 600 }}>
                <Sun size={15} /> 2. Mid-Morning Snack
              </div>
              <input
                className="input"
                placeholder="e.g. 1 Apple / Coconut water / Buttermilk"
                value={meals.midMorning}
                onChange={(e) => setMeals({ ...meals, midMorning: e.target.value })}
              />
            </div>

            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div className="hstack" style={{ gap: 6, marginBottom: 6, color: '#10b981', fontSize: 13, fontWeight: 600 }}>
                <Utensils size={15} /> 3. Lunch (Afternoon)
              </div>
              <input
                className="input"
                placeholder="e.g. 150g Chicken or Paneer + 1 cup Brown Rice / 2 Rotis + Dal and Salad"
                value={meals.lunch}
                onChange={(e) => setMeals({ ...meals, lunch: e.target.value })}
              />
            </div>

            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div className="hstack" style={{ gap: 6, marginBottom: 6, color: '#a855f7', fontSize: 13, fontWeight: 600 }}>
                <Dumbbell size={15} /> 4. Evening / Pre and Post Workout
              </div>
              <input
                className="input"
                placeholder="e.g. 1 Scoop Whey / Sattu drink / Roasted Chana + Banana"
                value={meals.evening}
                onChange={(e) => setMeals({ ...meals, evening: e.target.value })}
              />
            </div>

            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div className="hstack" style={{ gap: 6, marginBottom: 6, color: '#ec4899', fontSize: 13, fontWeight: 600 }}>
                <Moon size={15} /> 5. Dinner (Night)
              </div>
              <input
                className="input"
                placeholder="e.g. Grilled fish / Paneer bhurji / Vegetable soup + Light salad"
                value={meals.dinner}
                onChange={(e) => setMeals({ ...meals, dinner: e.target.value })}
              />
            </div>

            <Field label="Hydration and Habits">
              <input
                className="input"
                placeholder="e.g. 4 Liters water daily, avoid fried items, 8 hrs sleep"
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
              />
            </Field>
          </div>
        )}

        {activeTab === 'custom' && (
          <Field label="Diet and Nutrition Meal Schedule (Raw Text)" className="full">
            <textarea
              className="input"
              rows={8}
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
              value={rawDetails}
              onChange={(e) => setRawDetails(e.target.value)}
              placeholder="Breakfast, Lunch, Pre-workout, Dinner details..."
            />
          </Field>
        )}

        <div style={{ fontSize: 12, color: 'var(--text-dim)', background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: 8 }}>
          <strong>1-Click WhatsApp Dispatch:</strong> Clicking &quot;Save &amp; Send to WhatsApp&quot; will format the diet breakdown and deliver it directly to <strong>{student.name} ({student.parentPhone})</strong>.
        </div>
      </div>
    </Modal>
  );
}
