import { caseNavigation } from '../utils/caseNavigation.js';

export default function CaseQuickLinks({ locale, hasReview }) {
  const navigation = caseNavigation(locale, hasReview);
  return <nav className="case-quick-links" aria-label={navigation.label}>
    {navigation.links.map(link => <a key={link.id} href={link.href}>{link.text}</a>)}
  </nav>;
}
