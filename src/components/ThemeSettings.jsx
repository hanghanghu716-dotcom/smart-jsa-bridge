import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';

export default function ThemeSettings() {
  const { t } = useTranslation('common');
  const { preference, resolvedTheme, setPreference } = useTheme();
  const id = useId();
  return (
    <fieldset className="theme-settings">
      <legend>{t('appearance.title')} <small className="theme-current">{t('appearance.active')}: {t(`appearance.${resolvedTheme}`)}</small></legend>
      <div className="theme-options">
        {['system', 'light', 'dark'].map(mode => (
          <label key={mode} className="theme-option" data-selected={preference === mode}>
            <input type="radio" name={id} value={mode} checked={preference === mode}
              onChange={() => setPreference(mode)} />
            <span>{t(`appearance.${mode}`)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
