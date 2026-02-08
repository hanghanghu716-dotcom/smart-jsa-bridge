import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const MobileGuard = ({ children }) => {
  const location = useLocation();

  // 1. 모바일에서 허용할 상세 경로 목록 (사용자 요청 반영)
  const allowedPaths = [
    '/jrajsa',
    '/about',
    '/terms',
    '/jsasamplepreview',
    '/privacy',
    '/regulation',
    '/riskclassification',
    '/protectiveequipment',
    '/guideline', // 모든 하위 가이드 경로 포함
  ];

  // 2. 경로 일치 여부 판별 로직
  // - 메인 페이지('/')이거나, 허용 목록에 포함된 경로로 시작하는지 확인
  const isAllowedPath = 
    location.pathname === '/' || 
    allowedPaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      {/* 데스크톱 레이아웃 (1024px 이상): 모든 서비스 이용 가능 */}
      <div className="hidden lg:block">
        {children}
      </div>

      {/* 모바일 레이아웃 (1024px 미만) */}
      <div className="block lg:hidden">
        {isAllowedPath ? (
          // 허용된 정보 공유 및 가이드 페이지는 정상 렌더링 (애드센스 가치 확보)
          <div className="w-full min-h-screen bg-black text-white">
            {children}
          </div>
        ) : (
          // 작성 도구 및 행정 서류 생성 등 복잡한 기능 페이지는 차단 및 안내
          <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-black text-white">
            <div className="mb-6 text-5xl">🚧</div>
            <h2 className="text-xl font-bold mb-4 text-blue-400">PC 전용 기능 안내</h2>
            <p className="mb-8 text-gray-400 text-sm leading-relaxed">
              정밀한 <strong>위험성평가 서류 제작 및 분석</strong> 기능은<br/>
              사무 환경(PC)에 최적화되어 있습니다.<br/>
              현재 기기에서는 정보 확인 및 가이드 열람만 가능합니다.
            </p>
            
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Link to="/jsasamplepreview" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold transition-all active:scale-95">
                위험성평가 견본 보기
              </Link>
              <Link to="/guideline/common" className="bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-xl font-semibold transition-all active:scale-95">
                작성 가이드 및 행정 절차
              </Link>
              <Link to="/" className="text-gray-500 text-sm underline mt-2">
                메인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileGuard;