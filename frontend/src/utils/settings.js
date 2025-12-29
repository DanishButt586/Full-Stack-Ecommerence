import { useEffect, useState } from 'react';

export const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY'
};

export const readSettingsFromStorage = () => {
  try {
    const raw = localStorage.getItem('userSettings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to read user settings from storage:', error);
  }
  return { ...DEFAULT_SETTINGS };
};

export const persistSettings = (settings) => {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  try {
    localStorage.setItem('userSettings', JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: merged }));
  } catch (error) {
    console.warn('Failed to persist user settings:', error);
  }
  return merged;
};

export const useUserSettings = () => {
  const [settings, setSettings] = useState(readSettingsFromStorage());

  useEffect(() => {
    const handleUpdate = (event) => {
      setSettings(event.detail || readSettingsFromStorage());
    };

    const handleStorage = (event) => {
      if (event.key === 'userSettings') {
        setSettings(readSettingsFromStorage());
      }
    };

    window.addEventListener('settingsUpdated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('settingsUpdated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return settings;
};

const dateFormatMap = {
  'MM/DD/YYYY': { month: '2-digit', day: '2-digit', year: 'numeric' },
  'DD/MM/YYYY': { day: '2-digit', month: '2-digit', year: 'numeric' },
  'YYYY-MM-DD': { year: 'numeric', month: '2-digit', day: '2-digit' }
};

export const formatDateWithSettings = (date, options = {}, settingsOverride) => {
  const effectiveSettings = settingsOverride || readSettingsFromStorage();
  try {
    const formatter = new Intl.DateTimeFormat(
      effectiveSettings.language || DEFAULT_SETTINGS.language,
      {
        timeZone: effectiveSettings.timezone || DEFAULT_SETTINGS.timezone,
        ...(dateFormatMap[effectiveSettings.dateFormat] || dateFormatMap[DEFAULT_SETTINGS.dateFormat]),
        ...options
      }
    );
    return formatter.format(new Date(date));
  } catch (error) {
    console.warn('formatDateWithSettings fallback due to error:', error);
    return new Date(date).toLocaleDateString();
  }
};

export const formatDateTimeWithSettings = (date, options = {}, settingsOverride) => {
  return formatDateWithSettings(
    date,
    {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    },
    settingsOverride
  );
};
