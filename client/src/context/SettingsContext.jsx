import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { SettingsAPI } from '../api/endpoints.js';
import { money as moneyFmt, moneyShort as moneyShortFmt } from '../lib/format.js';
import { getPreset, DEFAULT_BUSINESS_TYPE } from '../lib/presets.js';
import { useAuth } from './AuthContext.jsx';

const SettingsContext = createContext(null);

const DEFAULTS = {
  instituteName: 'Feasy Workspace',
  businessType: DEFAULT_BUSINESS_TYPE,
  currency: 'INR',
  reminderLeadDays: 7,
  reminderTemplate: '',
  messaging: {
    whatsapp: { configured: false, templateName: null },
    sms: { configured: false, provider: null },
    defaultCountryCode: '91',
  },
};

export function SettingsProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('feasy_token')) {
      setSettings(DEFAULTS);
      setLoading(false);
      return;
    }
    try {
      const s = await SettingsAPI.get();
      setSettings({ ...DEFAULTS, ...s });
    } catch {
      /* keep defaults if the API isn't reachable yet */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, token, isAuthenticated]);

  const currency = settings.currency || 'INR';
  const businessPreset = useMemo(
    () => getPreset(settings.businessType || DEFAULT_BUSINESS_TYPE),
    [settings.businessType]
  );
  const labels = useMemo(() => {
    return {
      ...businessPreset.labels,
      ...(settings.customLabels || {}),
    };
  }, [businessPreset, settings.customLabels]);

  const value = {
    settings,
    setSettings,
    loading,
    refresh,
    currency,
    businessPreset,
    labels,
    money: (a) => moneyFmt(a, currency),
    moneyShort: (a) => moneyShortFmt(a, currency),
  };

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
