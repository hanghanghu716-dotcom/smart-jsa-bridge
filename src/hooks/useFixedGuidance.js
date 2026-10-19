import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fixedGuidanceText, usFixedGuidance } from '../utils/usFixedGuidance';

export function useFixedGuidance(namespace) {
  const translation = useTranslation(namespace);
  const { pathname } = useLocation();
  const guidance = usFixedGuidance(pathname, namespace);
  const t = (key, options) => {
    const value = fixedGuidanceText(guidance, key);
    return typeof value === 'string' ? value : translation.t(key, options);
  };
  return { ...translation, t, guidance };
}
