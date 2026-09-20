import { SUPPORTED_LANGS } from './locales/config.js';
import { useLocation } from 'react-router-dom';
import { LanguageLink } from './hooks/useLanguage';

export default function MobileGuard({ children }) {
  const { pathname } = useLocation();
  const segments = pathname.split('/');
  const purePath = SUPPORTED_LANGS.includes(segments[1])
    ? '/' + segments.slice(2).join('/') : pathname;
  const allowedPaths = ['/jrajsa', '/about', '/terms', '/privacy', '/regulation',
    '/riskclassification', '/protectiveequipment', '/guideline', '/admin/upload',
    '/case-study', '/explore', '/dictionary', '/info', '/archive'];
  const isAllowedPath = purePath === '/' || purePath === ''
    || allowedPaths.some(path => purePath === path || purePath.startsWith(path + '/'));

  // Never mount a second copy of the same route for another viewport.
  if (isAllowedPath) return children;
  return (
    <>
      <div className="hidden lg:block">{children}</div>
      <div className="flex lg:hidden flex-col items-center justify-center min-h-screen p-6 text-center bg-black text-white">
        <div className="mb-6 text-5xl">🚧</div>
        <h2 className="text-xl font-bold mb-4 text-blue-400">PC 전용 기능 안내</h2>
        <p className="mb-8 text-gray-400 text-sm leading-relaxed">
          정밀한 <strong>위험성평가 서류 제작 및 분석</strong> 기능은<br />
          사무 환경(PC)에 최적화되어 있습니다.<br />
          현재 기기에서는 정보 확인 및 가이드 열람만 가능합니다.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <LanguageLink to="/guideline/construction" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold">
            위험성평가 견본 보기
          </LanguageLink>
          <LanguageLink to="/guideline/common" className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl font-semibold">
            작성 가이드 및 행정 절차
          </LanguageLink>
          <LanguageLink to="/" className="text-gray-500 text-sm underline mt-2">메인 페이지로 돌아가기</LanguageLink>
        </div>
      </div>
    </>
  );
}
