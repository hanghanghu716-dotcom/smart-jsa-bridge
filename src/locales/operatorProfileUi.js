import copy from '../data/operator-profile-copy.json' with { type: 'json' };
import { operations } from '../config/operations.js';

export function getOperatorProfileUi(locale = 'en-US') {
  return copy[locale?.split('-')[0]] || copy.en;
}
export function operatorDisplayName(locale = 'en-US') {
  return locale?.split('-')[0] === 'ko'
    ? operations.operatorName + ' | ' + operations.operatorEnglishName
    : operations.operatorEnglishName + ' (' + operations.operatorName + ')';
}
