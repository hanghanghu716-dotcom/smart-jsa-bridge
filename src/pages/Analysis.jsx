import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdBanner from '../AdBanner'; // [추가] 광고 컴포넌트 불러오기

const RISK_DATABASE = [
[
  // 1. 작업 단계 및 유형
  {
    "keywords": ["작업준비", "공통안전", "작업전", "TBM", "보호구", "작업 전", "안전 교육", "안전교육", "작업 준비"],
    "risks": [
      { "factor": "작업자 건강 상태 및 심리적 불안정 미확인", "measure": "TBM 시간 활용 혈압 측정 및 음주 여부 확인" },
      { "factor": "개인 보호구(PPE) 미착용", "measure": "작업별 적정 보호구 지급 및 착용 상태 상호 점검" },
      { "factor": "비상 대피로 미확보", "measure": "작업 전 비상 대피 경로 및 비상연락망 확인" },
      { "factor": "작업장 조도 부족", "measure": "작업 구간 적정 조도(75럭스 이상) 확보" },
      { "factor": "유해위험물질 사전 인지 부족", "measure": "물질안전보건자료(MSDS) 교육 및 현장 비치 확인" }
    ]
  },
  {
    "keywords": ["보수", "점검", "정비", "수리", "오버홀"],
    "risks": [
      { "factor": "정비 작업 중 제3자의 불시 전원 투입으로 인한 끼임 및 협착", "measure": "전원 차단 후 기동 스위치에 LOTO(잠금장치 및 표지판) 설치 및 키 개인 보관" },
      { "factor": "기계 분해/조립 과정에서 날카로운 부품 단면에 의한 베임", "measure": "베임 방지용 코팅 장갑 또는 방검 장갑 착용 및 전용 공구 사용" },
      { "factor": "배관/탱크 내부 잔류 압력 또는 유해물질 분출에 의한 상해", "measure": "작업 전 퍼지(Purge) 및 드레인(Drain)을 통한 압력/잔류물 완전 제거 확인" },
      { "factor": "정비 공간 내 가연성 가스 체류에 의한 폭발", "measure": "화기 작업 전 가스 농도 측정 및 방폭형 정비 공구 사용" },
      { "factor": "중량 부품 탈거 시 지지 불량으로 인한 깔림", "measure": "고정용 지그(Jig) 또는 받침대 설치 후 해체 작업 실시" }
    ]
  },
  {
    "keywords": ["누출", "유출", "리크", "Leak", "Leaking"], 
    "risks": [
      { "factor": "리크 지점 확인을 위해 고압 배관에 얼굴을 밀착하다 분출물에 안구/안면 타격", "measure": "직접 육안 확인 지양, 검사 거울(Inspection Mirror) 사용 및 보안면 필수 착용" },
      { "factor": "검사용 비눗물(Snoop) 또는 발포제 바닥 흘림으로 인한 미끄러짐(전도)", "measure": "검사 중 바닥 오염 즉시 제거 및 미끄럼 방지 안전화 착용" },
      { "factor": "미세 핀홀(Pin-hole) 누출을 맨손으로 훑으며 찾다가 고압 분사에 베임/피하 주입", "measure": "맨손 확인 절대 금지, 종이/헝겊 등을 대어 흔들림으로 간접 확인" },
      { "factor": "리크 테스트를 위해 무리하게 압력을 높이다 계기/배관 파열", "measure": "설계 압력(Design Pressure) 이내 승압 및 감압 밸브(Regulator) 전단 설치" },
      { "factor": "밀폐된 피트(Pit)나 하부 배관 리크 검사 중 누출 가스 체류로 인한 질식", "measure": "검사 전 산소/유해가스 농도 측정, 휴대용 감지기 패용 및 2인 1조 작업" }
    ]
  },
  {
    "keywords": ["교체"],
    "risks": [
      { "factor": "중량 부품 교체 시 불안정한 자세로 인한 요통 및 근골격계 질환", "measure": "중량물 취급 시 체인블록 등 양중기구 활용 및 2인 1조 작업 준수" },
      { "factor": "부품 탈거 순간 무게중심 상실로 인한 전도 및 낙하", "measure": "탈거 전 지지대(Support) 설치 및 체결 볼트 대각선 순서 해체" },
      { "factor": "규격이 맞지 않는 부품의 강제 체결 시도 중 공구 이탈/타격", "measure": "제조사 권장 정품 규격 부품 사용 및 규정 토크 준수" },
      { "factor": "교체 완료 후 방호장치 미복구 상태에서 시운전 중 사고", "measure": "안전 덮개 및 인터록 등 방호장치 원상 복구 확인 후 시운전 실시" },
      { "factor": "기존 부품 적재 중량 초과로 인한 보관대 붕괴", "measure": "탈거 부품 지정 장소 적치 및 적재 한도 준수" }
    ]
  },
  {
    "keywords": ["인양", "양중", "줄걸이"],
    "risks": [
      { "factor": "줄걸이 용구(슬링벨트, 와이어) 손상 및 파단으로 인한 자재 낙하", "measure": "작업 전 줄걸이 용구의 마모, 킹크, 소선 단선 상태 점검 및 불량품 즉시 폐기" },
      { "factor": "편하중 또는 체결 불량으로 인한 인양물 이탈 및 낙하", "measure": "2줄 걸이 이상 원칙 준수, 샤클 핀 체결 확인 및 무게중심 사전 파악" },
      { "factor": "인양물 회전 및 흔들림으로 인한 작업자 충돌/협착", "measure": "유도 로프(Tag Line)를 사용하여 인양물과 안전거리(2m 이상) 유지" },
      { "factor": "인양 작업 반경 내 비인가자 출입으로 인한 충돌", "measure": "작업 반경 하부 통제구역 설정 및 전담 신호수 배치" },
      { "factor": "강풍 등 악천후 시 인양 시도로 인한 장비 전도", "measure": "순간풍속 10m/s 초과 시 인양 작업 중단 지침 준수" }
    ]
  },
  {
    "keywords": ["용접", "절단", "화기", "그라인딩"],
    "risks": [
      { "factor": "용접 불티 비산으로 인한 주변 가연물 화재 및 폭발", "measure": "작업 반경 11m 이내 가연물 제거, 불티 비산 방지포 설치 및 소화기 비치" },
      { "factor": "밀폐공간 내 용접 흄(Fume) 및 유해가스 흡입으로 인한 중독", "measure": "국소배기장치(이동식 송풍기) 가동 및 특급 방진/방독마스크 착용" },
      { "factor": "가스 용기(산소/아세틸렌) 전도 및 가스 누출로 인한 폭발", "measure": "용기 전도 방지 체인 체결, 역화 방지기 설치 및 호스 연결부 비눗물 점검" },
      { "factor": "그라인더 날 파손 및 튀어 오름(Kick-back)에 의한 안면 부상", "measure": "회전부 안전 덮개 확인 및 보안면/방염복 필수 착용" },
      { "factor": "용접기 외함 누전 및 홀더 충전부 접촉에 의한 감전", "measure": "자동전격방지기 작동 확인 및 절연 장갑 착용" }
    ]
  },
  {
    "keywords": ["고소", "비계", "지붕", "천장", "발판"],
    "risks": [
      { "factor": "작업 발판 단부 및 개구부에서의 작업자 추락", "measure": "안전난간 설치, 그네식 안전대 착용 및 생명줄(Life-line) 체결 철저" },
      { "factor": "고소 작업 중 자재 및 수공구 낙하로 인한 하부 타격", "measure": "공구 낙하방지끈 사용, 발판 틈새 막음 조치 및 하부 통제구역 설정" },
      { "factor": "비계 조립 불량에 의한 구조물 붕괴", "measure": "벽이음재 설치 규격 준수 및 수평/수직도 사전 점검" },
      { "factor": "슬레이트나 지붕 자재 파손으로 인한 하부 추락", "measure": "폭 30cm 이상의 발판 설치 및 안전망 선행 설치" },
      { "factor": "사다리 위에서 무리한 연장 작업 중 균형 상실", "measure": "사다리 2인 1조 작업 및 A형 사다리 최상부 작업 금지" }
    ]
  },
  {
    "keywords": ["BT", "이동식", "롤링타워"], 
    "risks": [
      { "factor": "바퀴 구동으로 인한 전도 및 추락", "measure": "이동 시 하차 원칙 및 바퀴 잠금장치(Stopper) 체결" },
      { "factor": "전용 승강 사다리 미사용(가새 등반) 실족", "measure": "내부 승강 사다리 설치 및 이용 준수" },
      { "factor": "상부 안전난간 미설치 추락", "measure": "상부 4면 난간대 견고히 설치" },
      { "factor": "아웃트리거 미설치 전도", "measure": "작업 전 아웃트리거 확장 및 쐐기 고정" },
      { "factor": "작업발판 고정 불량 빠짐", "measure": "발판 빈틈없이 설치 및 탈락 방지 조치" }
    ]
  },
  {
    "keywords": ["굴착", "터파기", "토공", "법면"],
    "risks": [
      { "factor": "굴착 법면의 토사 붕괴로 인한 작업자 매몰", "measure": "지반 종류에 따른 안식각(기울기) 준수 및 흙막이 지보공 설치" },
      { "factor": "사전 조사 미비로 인한 지하 매설물(가스관, 전력구) 파손", "measure": "작업 전 지하매설물 도면 확인 및 인력 시굴착(줄파기) 선행" },
      { "factor": "굴착 장비와 주변 보행 작업자 충돌", "measure": "굴착 작업 반경 내 출입 통제 및 전담 신호수 상주" },
      { "factor": "굴착 단부 작업자 및 장비 추락", "measure": "단부 안전난간 설치 및 장비 접근 한계선 설정" },
      { "factor": "굴착 저면 배수 불량에 의한 지반 약화/붕괴", "measure": "집수정 및 배수 펌프 가동으로 상시 건조 상태 유지" }
    ]
  },
  {
    "keywords": ["철거", "해체", "파쇄", "브레이커"],
    "risks": [
      { "factor": "구조물 해체 순서 미준수로 인한 붕괴 및 전도", "measure": "해체 계획서에 따른 작업 순서(상부→하부) 준수 및 잭서포트 보강" },
      { "factor": "콘크리트 파쇄 시 발생하는 고농도 비산 먼지 흡입", "measure": "작업 중 지속적인 살수 실시 및 방진마스크 필수 착용" },
      { "factor": "파쇄 파편 비래로 인한 안구 및 안면 부상", "measure": "보안경 및 안면 보호구(Face Shield) 착용, 방호막 설치" },
      { "factor": "브레이커 진동에 의한 근골격계 질환(진동 장애)", "measure": "방진 장갑 착용 및 적정 휴식 시간 준수" },
      { "factor": "해체물 낙하 반경 내 작업자 출입", "measure": "낙하 반경 하부 통제 및 유도원 배치" }
    ]
  },
  {
    "keywords": ["탈착", "분리", "개방", "오픈"],
    "risks": [
      { "factor": "배관/설비 내부 잔류 고압·고열 유체 분출로 인한 화상", "measure": "작업 전 압력 게이지 '0' 확인, 잔류물 드레인 및 내열 장갑 착용" },
      { "factor": "중량물 부재 탈착 시 급격한 하중 이동으로 인한 낙하", "measure": "탈착 직전 로프 고정 또는 2인 1조 지지 후 볼트 해체" },
      { "factor": "강제로 분리 시도 중 공구 튕김에 의한 타격", "measure": "윤활제 살포 및 전용 풀러(Puller) 등 정밀 공구 사용" },
      { "factor": "개방된 입구로 신체 일부 추락 및 탈락", "measure": "개방 즉시 임시 덮개 또는 안전난간 설치" },
      { "factor": "내부 독성 가스 잔류에 의한 흡입", "measure": "개방 전 가스 감지 및 전면형 방독마스크 착용" }
    ]
  },
  {
    "keywords": ["청소", "세척"],
    "risks": [
      { "factor": "고압 세척기 분사수의 직접 타격에 의한 신체 손상", "measure": "고압 세척 전용 보호복/장화 착용 및 건(Gun)의 안전 잠금장치 활용" },
      { "factor": "바닥 물기 및 세척제 잔류로 인한 미끄러짐(전도)", "measure": "미끄럼 방지 안전장화 착용 및 작업 구간 배수 상태 유지" },
      { "factor": "화학 세척제(산성/알칼리성)에 의한 화학적 화상", "measure": "불침투성 보호의 및 화학용 고무장갑 필수 착용" },
      { "factor": "세척 중 발생하는 증기 및 미스트 흡입", "measure": "작업장 환기 가동 및 방독/방진 마스크 혼용 착용" },
      { "factor": "세척용 노즐 이탈에 의한 타격", "measure": "호스 연결부 결합 상태 정기 점검" }
    ]
  },

  // 2. 자재 및 대상물
  {
    "keywords": ["판넬", "데크"], 
    "risks": [
      { "factor": "고소 구간 판넬/데크 설치 중 단부 추락", "measure": "안전대 부착설비(안전로프) 선설치 및 작업자 안전대 체결" },
      { "factor": "강풍 발생 시 판넬의 수풍 면적 증가로 인한 날림 및 낙하", "measure": "순간풍속 10m/s 이상 시 작업 중지 및 자재 결속 보강" },
      { "factor": "판넬 절단면의 날카로운 부위에 의한 베임(창상)", "measure": "베임 방지용 방검 장갑 및 긴소매 작업복 착용" },
      { "factor": "판넬 가공 중 불티 비산에 의한 심재 화재", "measure": "우레탄/스티로폼 판넬 절단 시 소화기 배치 및 비산방지포 사용" },
      { "factor": "설치되지 않은 데크 플레이트 밟음으로 인한 추락", "measure": "설치 후 즉시 가접 실시 및 보행 통제" }
    ]
  },
  {
    "keywords": ["유리", "창호", "샤시"], 
    "risks": [
      { "factor": "유리 파손 시 비산된 파편에 의한 심각한 베임", "measure": "방검 장갑, 보안경 및 토시 착용, 파손 유리 즉시 제거" },
      { "factor": "대형 유리/창호 운반 중 중량물 전도", "measure": "전용 진공 흡착기(압착기) 점검 후 사용 및 유도원 배치" },
      { "factor": "창호 고정 전 외풍에 의한 낙하", "measure": "가고정 단계에서 고정 쐐기 및 수평 확인 철저" },
      { "factor": "유리 운반 중 자재 사이 손가락 협착", "measure": "자재 사이 간격 확보용 스페이서 사용" },
      { "factor": "운반 대차의 과속으로 인한 주변 보행자 충돌", "measure": "운반 경로 사전 확보 및 시야 확보" }
    ]
  },
  {
    "keywords": ["석재", "타일", "대리석"], 
    "risks": [
      { "factor": "대형 석재 인력 운반 중 허리 부상 및 협착", "measure": "진공 흡착기 또는 이동 대차 사용, 2인 이상 협동 작업" },
      { "factor": "석재/타일 절단 가공 시 발생하는 분진 흡입", "measure": "습식 절단기 사용 원칙 및 방진마스크 착용" },
      { "factor": "타일 접착제(유기화합물) 취급에 의한 중독", "measure": "작업장 환기 팬 가동 및 불침투성 보호 장갑 착용" },
      { "factor": "벽면 석재 시공 중 하중 불균형에 의한 탈락", "measure": "하부 지지대 설치 및 연결 철물(Anchor) 체결 깊이 준수" },
      { "factor": "파손된 석재 조각에 의한 발등 타격", "measure": "안전화 필수 착용 및 자재 정리정돈" }
    ]
  },
  {
    "keywords": ["철근"],
    "risks": [
      { "factor": "철근 운반 시 요철 및 장애물에 걸려 넘어짐", "measure": "작업 통로 확보 및 자재 정리정돈, 2인 1조 어깨 메기 운반" },
      { "factor": "노출된 철근 끝단 및 결속선에 찔림", "measure": "철근 선단부 보호캡(Cap) 설치 및 보안경 착용" },
      { "factor": "양중 중인 철근 다발의 결속 해체 및 낙하", "measure": "와이어로프 2줄 걸이 및 결속 상태 재확인" },
      { "factor": "철근 가공(절곡) 시 기계 말림 및 튕김", "measure": "가공기 안전 덮개 설치 및 가동 중 신체 접근 금지" },
      { "factor": "고소 철근 배근 중 균형 상실로 인한 추락", "measure": "전용 생명줄 사용 및 비계 위 작업 준수" }
    ]
  },
  {
    "keywords": ["거푸집", "유로폼", "알폼"],
    "risks": [
      { "factor": "상하 동시 작업 중 상부 자재 낙하에 의한 타격", "measure": "상하 동시 작업 금지 원칙 및 하부 감시인 배치" },
      { "factor": "해체된 거푸집의 잔류 못에 의한 찔림", "measure": "해체 즉시 못 제거 또는 구부림 조치, 내답판 안전화 착용" },
      { "factor": "거푸집 동바리(Support) 강도 부족으로 인한 붕괴", "measure": "구조 검토에 따른 동바리 간격 준수 및 수평 연결재 설치" },
      { "factor": "해체 시 거푸집이 한꺼번에 쏟아짐", "measure": "해체 전 작업자 퇴로 확보 및 지게차/크레인 지지 후 해체" },
      { "factor": "박리제 도포면에서 미끄러짐", "measure": "박리제 도포 시 과다 살수 금지 및 즉시 청소" }
    ]
  },
  {
    "keywords": ["콘크리트", "레미콘"],
    "risks": [
      { "factor": "타설 압력에 의한 펌프카 호스 요동 및 타격", "measure": "호스 끝단 2인 이상 파지 및 고정 로프 체결" },
      { "factor": "알칼리성 콘크리트 접촉에 의한 화학적 피부 화상/염증", "measure": "방수형 보호 장갑, 장화 및 보안경 필수 착용" },
      { "factor": "타설 중 거푸집 측압에 의한 터짐 및 매몰", "measure": "타설 속도 준수 및 거푸집 변형 여부 실시간 모니터링" },
      { "factor": "펌프카 아웃트리거 지반 침하에 의한 전도", "measure": "철판 또는 침목 설치 및 지반 상태 수시 점검" },
      { "factor": "레미콘 차량 후진 중 신호수/작업자 충돌", "measure": "차량 전용 유도원 배치 및 후방 경보기 작동 확인" }
    ]
  },
  {
    "keywords": ["벽돌", "블록", "조적"],
    "risks": [
      { "factor": "과도한 높이 쌓기로 인한 미경화 벽체 무너짐", "measure": "일일 쌓기 높이(표준 1.2m, 최대 1.5m) 준수" },
      { "factor": "고소 조적 작업 중 벽돌 낙하", "measure": "비계 외측 낙하물 방지망 설치 및 하부 통행 금지" },
      { "factor": "벽돌 운반 대차의 하중 분산 실패로 인한 전도", "measure": "대차 적재 높이 제한 및 경사로 운반 주의" },
      { "factor": "벽체 모서리 보강 미비로 인한 전도", "measure": "긴결 철물 설치 및 벽체 교차부 맞물림 시공 확인" },
      { "factor": "조적용 모르타르 비빔 중 시멘트 독성 노출", "measure": "방진 마스크 및 고무장갑 착용" }
    ]
  },
  {
    "keywords": ["페인트", "도장", "시너"],
    "risks": [
      { "factor": "밀폐공간 내 유기용제 증기 체류에 의한 질식/중독", "measure": "송기마스크 착용 원칙, 지속적인 강제 환기 실시" },
      { "factor": "유증기 발생 구역 내 정전기/스파크에 의한 폭발", "measure": "방폭형 전기 기구 사용 및 제전복 착용, 화기 엄금" },
      { "factor": "고압 스프레이 건(Gun)의 오작동 및 신체 분사", "measure": "사용 전 안전 잠금장치 점검 및 보호의 착용" },
      { "factor": "시너 등 인화성 물질 보관 부주의로 인한 화재", "measure": "전용 보관함 사용 및 소화기 근접 비치" },
      { "factor": "도장 작업 중 눈에 잔여물 침투", "measure": "밀착형 보안경 착용 및 세안 시설 확보" }
    ]
  },
  {
    "keywords": ["석면", "텍스", "밤라이트"],
    "risks": [
      { "factor": "석면 분진 비산 및 흡입으로 인한 폐질환(발암)", "measure": "전면형 특급 방진마스크 및 전신 보호복(Tyvek) 착용, 음압기 가동" },
      { "factor": "해체된 석면 자재 보관/운반 중 파손 및 유출", "measure": "습윤 상태 유지, 이중 비닐 밀봉 포장 및 경고 스티커 부착" },
      { "factor": "작업 후 신체/의복에 묻은 석면 분진의 외부 유출", "measure": "탈의실/샤워실 거쳐 세척 후 퇴근 조치" },
      { "factor": "고소 천장재 해체 중 작업자 추락", "measure": "고소작업대 또는 비계 설치 및 안전대 체결" },
      { "factor": "비인가자의 작업 구역 진입에 의한 노출", "measure": "구역 격리 및 '석면 작업 중' 표지판 게시" }
    ]
  },
  {
    "keywords": ["보온재", "그라스울"],
    "risks": [
      { "factor": "유리섬유의 피부 접촉 및 흡입에 의한 자극/피부염", "measure": "보호복 착용, 소매/바지단 테이핑 밀봉 및 방진마스크 착용" },
      { "factor": "노후 보온재 제거 시 다량의 미세 분진 발생", "measure": "작업 전 습윤제(물) 살포 후 제거 및 집진기 사용" },
      { "factor": "보온재 부착용 접착제 유해 가스 흡입", "measure": "국소 환기 실시 및 유기용제 마스크 착용" },
      { "factor": "절단 칼날 사용 중 손 부상", "measure": "안전 칼집 사용 및 방검 장갑 착용" },
      { "factor": "보온재 잔재물 방치로 인한 화재 위험", "measure": "작업 후 즉시 수거 및 지정 폐기물 보관함 이동" }
    ]
  },

  // 3. 장비 및 기계
  {
    "keywords": ["지게차"],
    "risks": [
      { "factor": "지게차 운행 중 사각지대 보행자 충돌", "measure": "전담 신호수 배치, 후진경보기/경광등 작동 확인 및 제한속도 준수" },
      { "factor": "화물 과적 및 급선회로 인한 장비 전도", "measure": "허용 하중 준수, 화물 무게중심 확인 및 저속 주행" },
      { "factor": "지게차 포크 위 작업자 탑승 중 추락", "measure": "포크 탑승 절대 금지 및 고소작업대 등 전용 장비 사용" },
      { "factor": "마스트 사이 손가락 협착", "measure": "운전석 이외의 위치에서 마스트 조작 절대 금지" },
      { "factor": "경사로 주행 중 화물 이탈", "measure": "경사로에서는 화물을 위쪽으로 향하게 하여 주행" }
    ]
  },
  {
    "keywords": ["크레인", "카고", "하이드로"],
    "risks": [
      { "factor": "연약 지반 침하로 인한 크레인 전도", "measure": "아웃트리거 받침판(침목) 견고히 설치 및 지반 상태 사전 점검" },
      { "factor": "붐대 인양 능력 초과(과부하)로 인한 파손 및 낙하", "measure": "정격 하중 준수 및 과부하 방지장치 정상 작동 확인" },
      { "factor": "인양물과 붐대 사이 작업자 끼임", "measure": "선회 반경 내 출입 금지 및 신호수 수신호 준수" },
      { "factor": "상부 특고압 전선과 붐대 접촉 및 감전", "measure": "이격 거리 확보 또는 절연 방호관 설치 확인" },
      { "factor": "와이어로프 꼬임(킹크)에 의한 파단", "measure": "작업 전 와이어로프 권상/권하 상태 정밀 점검" }
    ]
  },
  {
    "keywords": ["굴착기", "포크레인", "백호"],
    "risks": [
      { "factor": "퀵 커플러 체결 불량으로 인한 버킷 이탈 및 타격", "measure": "작업 전 퀵 커플러 안전핀 체결 여부 육안 확인 필수" },
      { "factor": "장비 선회 반경 내 작업자 끼임/충돌", "measure": "후방 카메라/센서 확인, 신호수 배치 및 접근 금지 표지 설치" },
      { "factor": "굴착기 붐대에 줄걸이 인양 중 낙하", "measure": "버킷 인양 금지 원칙(전용 훅 장착 장비만 허용)" },
      { "factor": "경사면 작업 중 장비 미끄러짐 및 전도", "measure": "궤도 하부 고임목 설치 및 경사도 준수" },
      { "factor": "운전석 이탈 시 버킷 낙하에 의한 타격", "measure": "이탈 시 버킷 지면 안착 및 엔진 정지" }
    ]
  },
  {
    "keywords": ["고소작업대", "렌탈", "스카이"],
    "risks": [
      { "factor": "작업대 난간을 딛고 올라서 작업 중 추락", "measure": "난간 위 탑승 금지, 작업대 바닥에서 안전대 체결 후 작업" },
      { "factor": "상승 중 상부 구조물과 작업자 협착", "measure": "상부 주시 철저 및 과상승 방지봉 정상 작동 확인" },
      { "factor": "이동 경로상의 바닥 개구부 함몰에 의한 전도", "measure": "이동 경로 평탄성 및 개구부 덮개 보강 확인" },
      { "factor": "작업대 하부 인입 방지 조치 미비 충돌", "measure": "작업대 하부 출입 통제 라인 설치" },
      { "factor": "리모컨 조작 실수로 인한 급제동 균형 상실", "measure": "조작 숙달자 운행 및 저속 모드 사용" }
    ]
  },
  {
    "keywords": ["승강기", "엘리베이터"],
    "risks": [
      { "factor": "승강로 피트(Pit) 개구부로 작업자 추락", "measure": "출입문 개구부 안전난간 설치 및 충분한 조도 확보" },
      { "factor": "카 상부 점검 중 오작동으로 인한 천장 협착", "measure": "수동 운전 모드 전환 및 비상정지 스위치 즉시 작동 가능 상태 유지" },
      { "factor": "와이어로프 교체 중 카 낙하", "measure": "카 상부 안전 고리 체결 및 비상 정지 장치 작동 확인" },
      { "factor": "권상기 회전부에 장갑 말림", "measure": "회전부 방호 덮개 설치 및 밀착형 장갑 착용" },
      { "factor": "제어반 점검 중 충전부 노출에 의한 감전", "measure": "절연 매트 설치 및 절연 공구 사용" }
    ]
  },
  {
    "keywords": ["컨베이어", "벨트"],
    "risks": [
      { "factor": "가동 중인 컨베이어 롤러/벨트 신체 말림", "measure": "가동 중 청소/점검 절대 금지 및 회전부 방호 덮개 설치" },
      { "factor": "비상 상황 시 정지 조치 지연", "measure": "작업 구간 내 풀코드 스위치(비상정지) 설치 및 작동 테스트" },
      { "factor": "컨베이어 하부 통과 중 낙하물 타격", "measure": "통로 구간 하부 낙하물 방지망 또는 덮개 설치" },
      { "factor": "벨트 장력 조정 중 손가락 협착", "measure": "LOTO 실시 후 무부하 상태에서 작업" },
      { "factor": "적재물 과다로 인한 벨트 파손 및 튕김", "measure": "정격 용량 준수 및 과부하 감지기 설치" }
    ]
  },
  {
    "keywords": ["펌프", "모터"],
    "risks": [
      { "factor": "고속 회전체(커플링, 축)에 옷자락/신체 말림", "measure": "회전부 방호 덮개 견고히 설치 및 헐거운 작업복 착용 금지" },
      { "factor": "절연 불량으로 인한 모터 외함 누전 및 감전", "measure": "외함 접지 실시 및 누전차단기 연결 전원 사용" },
      { "factor": "운전 중 이상 과열에 의한 화상", "measure": "표면 온도 측정 및 고온 부위 단열 조치" },
      { "factor": "흡입구 진공 압력에 의한 신체 빨림", "measure": "흡입측 여과망 설치 및 가동 중 접근 제한" },
      { "factor": "모터 베이스 고정 볼트 풀림에 의한 부품 튕김", "measure": "정기적인 토크 렌치 점검 실시" }
    ]
  },
  {
    "keywords": ["콤프레샤", "압축기"],
    "risks": [
      { "factor": "압축 공기 호스 이탈 시 타격(Whipping)", "measure": "호스 연결부 안전핀 및 휩체크(이탈방지 와이어) 체결" },
      { "factor": "V-벨트 구동부에 손가락 협착", "measure": "구동부 전체를 덮는 방호망 설치" },
      { "factor": "압축 탱크 부식에 의한 파열/폭발", "measure": "안전 밸브 작동 시험 및 탱크 내부 응축수 상시 드레인" },
      { "factor": "고압 공기의 피부 분사로 인한 공기 색전증", "measure": "인체 직사 절대 금지 및 보안경 착용" },
      { "factor": "소음 및 진동에 의한 청력 손실", "measure": "방음 덮개 설치 및 귀마개 필수 착용" }
    ]
  },
  {
    "keywords": ["항타기", "천공기"],
    "risks": [
      { "factor": "장비 이동/작업 중 지반 침하로 인한 전도", "measure": "이동 경로에 철판(복공판) 포설 및 지반 다짐 상태 확인" },
      { "factor": "와이어로프 절단으로 인한 파일/오거 낙하", "measure": "와이어로프 및 달기구 손상 여부 작업 전 점검" },
      { "factor": "리더(Leader) 조립/해체 중 전도", "measure": "전용 지지대 사용 및 크레인 보조 인양 준수" },
      { "factor": "오거 회전축에 작업자 권동 상해", "measure": "회전 반경 내 접근 통제 및 신호수 배치" },
      { "factor": "파일 타격 시 비산되는 파편 타격", "measure": "비산 방지망 설치 및 작업자 안전 거리 유지" }
    ]
  },
  {
    "keywords": ["금형", "사출", "프레스"],
    "risks": [
      { "factor": "금형 인양 중 아이볼트 파손으로 인한 낙하", "measure": "금형 중량에 적합한 규격 아이볼트 사용 및 체결 상태 점검" },
      { "factor": "금형 수정 중 슬라이드 불시 하강으로 인한 협착", "measure": "안전 블록(Safety Block) 설치 및 광전자식 안전장치 작동 확인" },
      { "factor": "사출 시 고온의 수지에 의한 화상", "measure": "퍼지(Purge) 시 전용 덮개 사용 및 내열 장갑 착용" },
      { "factor": "금형 체결 볼트 파손에 의한 금형 이탈", "measure": "체결 토크 준수 및 정기적인 볼트 검사" },
      { "factor": "프레스 내부 수작업 중 풋스위치 오작동", "measure": "양손 조작식 스위치 적용 및 센서 연동 확인" }
    ]
  },

  // 4. 설비/전기/유해위험
  {
    "keywords": ["전원", "수배전반", "차단기", "정전"],
    "risks": [
      { "factor": "특고압 차단기(VCB/ACB) 조작 시 아크(Arc) 폭발", "measure": "방염복, 보안면 등 절연 보호구 착용 및 차단기 측면에서 조작" },
      { "factor": "전원 차단 후 잔류 전하에 의한 감전", "measure": "디스차징 로드를 이용한 잔류 전하 제거 및 검전기로 확인" },
      { "factor": "비상발전기 가동으로 인한 역가압 감전", "measure": "작업 전 ATS 동작 확인 및 비상발전기 라인 차단 점검" },
      { "factor": "차단기 단자부 조임 불량에 의한 과열 및 화재", "measure": "열화상 카메라 측정 및 규정 토크 체결" },
      { "factor": "정전 작업 중 제3자의 임의 투입", "measure": "잠금장치(LOTO) 및 표지판 설치" }
    ]
  },
  {
    "keywords": ["활선", "특고압", "변압기"],
    "risks": [
      { "factor": "충전부 근접 작업 중 신체 접촉에 의한 감전", "measure": "절연용 보호구 착용 및 충전부 절연 방호구 설치" },
      { "factor": "단락(Short) 발생 시 아크 열에 의한 화상", "measure": "방염 작업복 착용 및 절연 처리된 공구 사용" },
      { "factor": "변압기 절연유 누출에 의한 오염 및 화재", "measure": "유류 확산 방지턱 설치 및 누유 수시 점검" },
      { "factor": "특고압 근접 시 유도 전압에 의한 감전", "measure": "안전 거리 준수 및 접지봉 설치" },
      { "factor": "변압기 중량물 인양 중 기울어짐 전도", "measure": "무게중심 확인 및 전용 리프팅 훅 사용" }
    ]
  },
  {
    "keywords": ["케이블트레이", "전선관", "포설", "입선"],
    "risks": [
      { "factor": "고소 트레이 위 이동/작업 중 추락", "measure": "트레이 위 보행 금지, 고소작업대 사용 및 안전대 체결" },
      { "factor": "케이블 트레이 절단면 날카로운 부위에 베임", "measure": "절단면 마감 처리 및 방검 장갑 착용" },
      { "factor": "대형 케이블 입선 시 윈치 로프 파단 타격", "measure": "윈치 하중 모니터링 및 로프 경로 주변 접근 통제" },
      { "factor": "트레이 내 케이블 포설 중 손가락 협착", "measure": "케이블 롤러 사용 및 무리한 인력 인장 금지" },
      { "factor": "수직 트레이 작업 중 공구 낙하", "measure": "하부 출입 통제 및 공구집 활용" }
    ]
  },
  {
    "keywords": ["질소", "퍼지", "치환"],
    "risks": [
      { "factor": "질소 가스 누출로 인한 산소 농도 저하 및 질식", "measure": "휴대용 산소농도측정기 필수 패용 및 지속적 환기" },
      { "factor": "퍼지 가스 방출구 위치 부적절로 인한 질식", "measure": "방출 호스를 안전한 장소로 유도 및 구역 통제" },
      { "factor": "고압 질소 호스 연결부 이탈에 의한 타격", "measure": "호스 연결부 안전핀 체결 및 휩체크 설치" },
      { "factor": "치환 완료 전 내부 진입으로 인한 사고", "measure": "분석기로 농도 확인 후 진입 허가" },
      { "factor": "배관 내 가압 질소의 급격한 팽창 파열", "measure": "단계적 압력 해소 절차 준수" }
    ]
  },
  {
    "keywords": ["액체질소", "초저온", "탱크로리"],
    "risks": [
      { "factor": "초저온 액체 비산에 의한 동상(Cold Burn)", "measure": "초저온 전용 장갑, 앞치마, 안면 보호구 착용" },
      { "factor": "배관 내 액체 질소 갇힘에 의한 기화 폭발", "measure": "두 밸브 사이 안전 밸브 설치 상태 확인" },
      { "factor": "탱크로리 하역 중 차량 밀림 사고", "measure": "바퀴 고임목 설치 및 하역 중 엔진 정지" },
      { "factor": "초저온 밸브 고착 시 강제 조작 중 파손", "measure": "열교환을 통한 자연 해동 후 조작" },
      { "factor": "액체 질소 기화 시 산소 결핍", "measure": "환기 시설 가동 및 산소 감지기 설치" }
    ]
  },
  {
    "keywords": ["밀폐공간", "맨홀", "탱크내부"],
    "risks": [
      { "factor": "내부 산소 결핍 및 유해가스 중독", "measure": "작업 전/중 농도 측정, 송풍기 상시 가동" },
      { "factor": "사고 발생 시 무리한 구조로 인한 동반 재해", "measure": "비상연락체계 유지, 구조자 공기호흡기 착용 필수" },
      { "factor": "내부 조명 기구 파손에 의한 감전 및 화재", "measure": "방폭형 임시 조명(24V 이하) 사용" },
      { "factor": "개구부 자재 낙하에 의한 작업자 타격", "measure": "입구 주변 정리 및 자재 낙하 방지턱 설치" },
      { "factor": "내부 협소 공간에서의 탈출 지연", "measure": "구조용 삼각대 및 윈치 선설치, 감시인 배치" }
    ]
  },
  {
    "keywords": ["가스배관", "도시가스", "기밀시험"],
    "risks": [
      { "factor": "가스 누출에 의한 폭발 및 화재", "measure": "휴대용 가스 검지기 소지, 방폭형 공구 사용" },
      { "factor": "기밀 시험 중 고압에 의한 배관 파열", "measure": "단계별 승압 준수 및 비인가자 접근 통제" },
      { "factor": "지하 가스 배관 굴착 중 손상", "measure": "가스안전공사 입회 하에 인력 굴착 실시" },
      { "factor": "가스 치환 작업 중 불완전 연소", "measure": "불꽃 상태 감시 및 가스 압력 상시 체크" },
      { "factor": "퍼지 가스 정전기에 의한 인화", "measure": "배관 접지 확인 및 정전기 방지용 호스 사용" }
    ]
  },
  {
    "keywords": ["배관", "파이프", "플랜지"],
    "risks": [
      { "factor": "중량 배관 인력 운반 중 근골격계 질환", "measure": "이동식 대차 사용 및 2인 1조 운반" },
      { "factor": "플랜지 체결 시 틈새에 손가락 협착", "measure": "플랜지 정렬 핀 공구 사용 및 직접 투입 금지" },
      { "factor": "수직 배관 용접 시 내부 화재 전파", "measure": "내부 불티 방지 커버 삽입 및 감시자 배치" },
      { "factor": "가스켓 손상으로 인한 유체 누출", "measure": "신규 가스켓 사용 및 균등 토크 체결" },
      { "factor": "고소 배관 위 보행 중 추락", "measure": "배관 위 보행 절대 금지 및 전용 발판 사용" }
    ]
  },
  {
    "keywords": ["덕트", "함석"],
    "risks": [
      { "factor": "함석 절단면 날카로운 모서리에 베임", "measure": "방검 장갑 및 팔 보호대 착용" },
      { "factor": "고소 덕트 설치 작업 중 추락", "measure": "고소작업대 사용 및 안전대 체결" },
      { "factor": "덕트 내부 청소 중 돌출 피스에 찔림", "measure": "보호복 착용 및 내부 돌출물 사전 제거" },
      { "factor": "대형 덕트 인양 중 풍압에 의한 충돌", "measure": "유도 로프 사용 및 인양 속도 저속 유지" },
      { "factor": "덕트 지지대 강도 부족으로 인한 낙하", "measure": "지지 간격 및 앵커 하중 기준 준수" }
    ]
  },
  {
    "keywords": ["신호수", "유도원", "차량유도"],
    "risks": [
      { "factor": "장비 사각지대 위치 선정으로 인한 충돌", "measure": "운전자와 시야 확보가 되는 안전한 위치 선정" },
      { "factor": "차량 유도 중 일반 차량과 충돌", "measure": "라바콘 등으로 신호수 안전 구역 확보" },
      { "factor": "수신호 불일치로 인한 오작동 유발", "measure": "작업 전 운전원과 수신호 방법 사전 협의" },
      { "factor": "야간 작업 시 시인성 부족 사고", "measure": "LED 신호봉 및 반사띠 전신 보호구 사용" },
      { "factor": "장시간 유도 업무 중 집중력 저하", "measure": "교대 근무 실시 및 휴게 시간 확보" }
    ]
  }
]
];
// ----------------------------------------------------------------------
// [로직] 텍스트에서 키워드를 찾아 DB에서 꺼내오는 함수
// ----------------------------------------------------------------------
const getRisksFromLocalDB = (text = "") => {
  if (!text) return [];
  
  let foundRisks = [];
  // 입력 문장에서 모든 공백 및 줄바꿈 제거
  const normalizedInput = text.toString().replace(/\s+/g, "").toLowerCase();

  RISK_DATABASE.forEach(category => {
    const hasKeyword = category.keywords.some(keyword => {
      // DB 키워드에서도 모든 공백 제거 후 비교
      const normalizedKeyword = keyword.toString().replace(/\s+/g, "").toLowerCase();
      return normalizedInput.includes(normalizedKeyword);
    });

    if (hasKeyword) {
      foundRisks = [...foundRisks, ...category.risks];
    }
  });

  return foundRisks;
};


// ----------------------------------------------------------------------
// [메인 컴포넌트]
// ----------------------------------------------------------------------
export default function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

  const {
    procedures = [],
    formData = {},
    participants = [],
    analysisData: incomingAnalysisData,
  } = location.state || {};

  // 1. 초기값: 이전 단계(Procedure)에서 넘겨준 분석 데이터가 있다면 그것을 우선 사용
  const [analysisData, setAnalysisData] = useState(incomingAnalysisData || []);

  // 2. 동기화 로직 보강
  useEffect(() => {
    if (procedures && procedures.length > 0) {
      setInsideAnalysisData();
    }
  }, [procedures]);

  const setInsideAnalysisData = () => {
    setAnalysisData(prevData => {
      // 1순위: 현재 상태값, 2순위: 전달받은 초기값
      const baseData = prevData.length > 0 ? prevData : (incomingAnalysisData || []);

      return procedures.map((newProc, idx) => {
        const existingData = baseData.find(d => d.id === idx);
        if (existingData) {
          return { ...existingData, proc: newProc }; // 절차 내용만 최신으로 갱신
        }
        return { id: idx, proc: newProc, risks: [], frequency: 1, severity: 1, riskLevel: 1 };
      });
    });
  };

  const [activeIdx, setActiveIdx] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 데이터가 없을 경우를 대비한 방어 코드
  const currentStep = analysisData && analysisData[activeIdx] ? analysisData[activeIdx] : { proc: {}, risks: [] };

// [수정] 데이터 로딩 및 DB 검색 로직
useEffect(() => {
  // activeIdx에 해당하는 데이터가 있는지 확인
  const step = analysisData[activeIdx];
  const targetText = step?.proc?.stepDetail;

  if (targetText && targetText.trim() !== "") {
    setIsLoading(true);

    const searchTimer = setTimeout(() => {
      const results = getRisksFromLocalDB(targetText);
      setRecommendations(results);
      setIsLoading(false);
    }, 500); // 0.5초 대기로 안정성 확보

    return () => clearTimeout(searchTimer);
  } else {
    // 데이터가 아직 안 들어왔거나 없을 경우
    setRecommendations([]);
    // 페이지 처음 진입 시 데이터 생성 대기를 위해 로딩을 유지할 수도 있음
  }
  // 의존성 배열에 analysisData를 반드시 포함하여 데이터 안착을 감시합니다.
}, [activeIdx, analysisData, currentStep?.proc?.stepDetail]);

  // --------------------------------------------------------------------
  // [핸들러] (기존 동일)
  // --------------------------------------------------------------------
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = 260;
      scrollRef.current.scrollTo({
        left: scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
        behavior: 'smooth'
      });
    }
  };
  const addRisk = (rec) => {
    const newData = [...analysisData];
    const isManual = rec.type === 'manual';
    const newRisk = {
      id: `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      factor: isManual ? '' : rec.factor,
      measure: isManual ? '' : rec.measure
    };
    newData[activeIdx].risks.push(newRisk);
    setAnalysisData(newData);
  };

  const updateRiskContent = (riskId, field, value) => {
    const newData = [...analysisData];
    const targetStep = newData[activeIdx];
    targetStep.risks = targetStep.risks.map(risk =>
      risk.id === riskId ? { ...risk, [field]: value } : risk
    );
    setAnalysisData(newData);
  };

  const deleteRisk = (riskId) => {
    const newData = [...analysisData];
    newData[activeIdx].risks = newData[activeIdx].risks.filter(risk => risk.id !== riskId);
    setAnalysisData(newData);
  };

  const updateStepRisk = (field, value) => {
    const newData = [...analysisData];
    const target = newData[activeIdx];
    if (field === 'frequency' || field === 'severity') {
      target[field] = parseInt(value);
      target.riskLevel = target.frequency * target.severity;
    } else {
      target[field] = value;
    }
    setAnalysisData(newData);
  };

  const handleNext = () => {
    if (activeIdx < analysisData.length - 1) {
      setActiveIdx(activeIdx + 1);
    } else {
      navigate('/export', { state: { analysisData, formData, participants, procedures } });
    }
  };

  const handlePrev = () => {
    if (activeIdx === 0) {
      navigate('/procedure', { state: { procedures, formData, participants, analysisData } });
    } else {
      setActiveIdx(activeIdx - 1);
    }
  };
return (
    <div style={styles.wrapper}>
      {/* [추가] 분석 중 전체 화면 차단 다이얼로그 */}
      {isLoading && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialogBox}>
            <div style={styles.spinner}></div>
            <h3 style={styles.dialogTitle}>위험요인 분석 중</h3>
            <p style={styles.dialogText}>
              작업 내용을 바탕으로<br />
              안전 데이터베이스를 검색하고 있습니다.
            </p>
          </div>
        </div>
      )}

      <div style={styles.bgWrapper}>
        <div style={styles.bgImage} />
        <div style={styles.dimOverlay} />
      </div>

      <header style={styles.header}>
        <h1 style={styles.logo} onClick={() => navigate('/')}>Smart JSA Bridge</h1>
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.sideAd}>
          <AdBanner slot="4000000001" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>

        <main style={styles.centerContent}>
          <div style={styles.formCard}>
            <nav style={styles.stepper}>
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>기본 정보</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemDone}><div style={styles.stepBadgeDone}>✓</div><span style={styles.stepTextDone}>작업 절차</span></div>
              <div style={styles.stepLineActive} />
              <div style={styles.stepItemActive}><div style={styles.stepBadgeActive}>3</div><span style={styles.stepTextActive}>위험 분석</span></div>
              <div style={styles.stepLine} />
              <div style={styles.stepItem}><div style={styles.stepBadge}>4</div><span style={styles.stepText}>최종 출력</span></div>
            </nav>

            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>03. 유해·위험요인 분석 ({activeIdx + 1}/{analysisData.length})</h2>
              <div style={styles.stepContext}>
                <span style={styles.stepTitleBadge}>STEP {activeIdx + 1}. {currentStep?.proc?.stepTitle}</span>
                <p style={styles.stepDetailText}>{currentStep?.proc?.stepDetail || "작업 내용이 없습니다."}</p>
              </div>
            </div>

            <div style={styles.scrollArea}>
              <div style={styles.recHeader}>
                <span style={styles.label}>추천 항목(DB) 및 수동 추가</span>
                <div style={styles.arrowBox}>
                  <button style={styles.arrowBtn} onClick={() => scroll('left')}>←</button>
                  <button style={styles.arrowBtn} onClick={() => scroll('right')}>→</button>
                </div>
              </div>

              <div style={styles.sliderContainer} ref={scrollRef}>
                <div style={styles.manualAddCard} onClick={() => addRisk({ type: 'manual' })}>
                  <div style={styles.plusIcon}>+</div>
                  <p style={styles.manualText}>새 위험요인<br />수동 작성</p>
                </div>

                {/* DB 검색 결과 렌더링 */}
                {recommendations.map((rec, i) => (
                  <div key={i} style={styles.recommendCard} onClick={() => addRisk(rec)}>
                    <div style={styles.recBadge}>추천</div>
                    <p style={styles.recFactor}>{rec.factor}</p>
                    <p style={styles.recMeasure}>{rec.measure}</p>
                  </div>
                ))}

                {!isLoading && recommendations.length === 0 && (
                  <div style={styles.emptyCard}>추천 데이터 없음</div>
                )}
              </div>

              <div style={styles.riskControlRow}>
                <div style={styles.riskInputGroup}>
                  <span style={styles.label}>빈도(가능성)</span>
                  <select style={styles.select} value={currentStep.frequency} onChange={(e) => updateStepRisk('frequency', e.target.value)}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={styles.riskInputGroup}>
                  <span style={styles.label}>강도(중대성)</span>
                  <select style={styles.select} value={currentStep.severity} onChange={(e) => updateStepRisk('severity', e.target.value)}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={styles.riskResultGroup}>
                  <span style={styles.label}>위험도(R) [제안: {currentStep.frequency * currentStep.severity}]</span>
                  <select
                    style={{
                      ...styles.select,
                      fontWeight: 'bold',
                      color: currentStep.riskLevel >= 9 ? '#ff4d4d' : (currentStep.riskLevel >= 4 ? '#ffcc00' : '#007bff'),
                      border: `2px solid ${currentStep.riskLevel >= 9 ? '#ff4d4d' : (currentStep.riskLevel >= 4 ? '#ffcc00' : '#007bff')}`
                    }}
                    value={currentStep.riskLevel}
                    onChange={(e) => updateStepRisk('riskLevel', parseInt(e.target.value))}
                  >
                    {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: '40%' }}>선택된 유해·위험요인 (편집 가능)</th>
                    <th style={{ ...styles.th, width: '45%' }}>해당 작업 감소대책 (편집 가능)</th>
                    <th style={{ ...styles.th, width: '15%', textAlign: 'center' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStep.risks.length === 0 ? (
                    <tr><td colSpan="3" style={styles.emptyTd}>위 카드를 클릭하여 위험요인을 추가하거나 수동으로 입력하세요.</td></tr>
                  ) : (
                    currentStep.risks.map((risk) => (
                      <tr key={risk.id}>
                        <td style={styles.td}>
                          <textarea style={styles.inlineInput} placeholder="유해·위험요인" value={risk.factor} onChange={(e) => updateRiskContent(risk.id, 'factor', e.target.value)} rows={2} />
                        </td>
                        <td style={styles.td}>
                          <textarea style={styles.inlineInput} placeholder="감소대책" value={risk.measure} onChange={(e) => updateRiskContent(risk.id, 'measure', e.target.value)} rows={2} />
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button style={styles.deleteBtn} onClick={() => deleteRisk(risk.id)}>삭제</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={styles.btnArea}>
              <button style={styles.prevBtn} onClick={handlePrev}>이전 단계</button>
              <button style={styles.nextBtn} onClick={handleNext}>
                {activeIdx === analysisData.length - 1 ? '작성 완료 및 출력' : '다음 작업 단계 분석'}
              </button>
            </div>
          </div>
        </main>

        <aside style={styles.sideAd}>
          <AdBanner slot="4000000002" style={{ width: '160px', height: '600px' }} format="vertical" />
        </aside>
      </div>

      <footer style={styles.footerArea}>
        <div style={styles.bottomAdWrapper}>
          <AdBanner slot="4000000003" style={{ width: '728px', height: '90px' }} format="horizontal" />
        </div>
      </footer>
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#000' },
  // [추가] 다이얼로그 관련 스타일
  dialogOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  dialogBox: { backgroundColor: '#1a1a1a', padding: '2.5rem', borderRadius: '16px', border: '1px solid #333', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  dialogTitle: { color: '#fff', fontSize: '1.2rem', margin: 0, fontWeight: '800' },
  dialogText: { color: '#888', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 },
  spinner: { width: '40px', height: '40px', border: '4px solid rgba(0, 123, 255, 0.1)', borderTop: '4px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  
  bgWrapper: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 },
  bgImage: { position: 'absolute', width: '100%', height: '100%', backgroundImage: 'url(/images/image3.jpg)', backgroundSize: 'cover', filter: 'brightness(0.3)' },
  dimOverlay: { position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1 },
  header: { padding: '1.2rem 5rem', zIndex: 10, display: 'flex', alignItems: 'center' },
  logo: { fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', color: '#fff', cursor: 'pointer', margin: 0 },
  mainLayout: { flex: 1, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: '2rem', zIndex: 10, overflow: 'hidden', justifyContent: 'center' },
  sideAd: { flexShrink: 0, width: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  centerContent: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: '1400px', width: '100%' },
  formCard: { width: '100%', backgroundColor: 'rgba(18, 18, 18, 0.95)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', padding: '2rem 2.5rem', boxShadow: '0 40px 80px rgba(0,0,0,0.8)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' },
  stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', gap: '0.8rem' },
  stepItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.3 },
  stepItemActive: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepItemDone: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  stepBadge: { width: '22px', height: '22px', backgroundColor: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#aaa' },
  stepBadgeActive: { width: '22px', height: '22px', backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', boxShadow: '0 0 10px rgba(0,123,255,0.6)' },
  stepBadgeDone: { width: '22px', height: '22px', backgroundColor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' },
  stepText: { fontSize: '0.85rem', color: '#aaa' },
  stepTextActive: { fontSize: '0.85rem', color: '#fff', fontWeight: '700' },
  stepTextDone: { fontSize: '0.85rem', color: '#4caf50', fontWeight: '700' },
  stepLine: { width: '30px', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' },
  stepLineActive: { width: '30px', height: '1.5px', backgroundColor: '#4caf50' },
  formHeader: { marginBottom: '1.5rem', borderLeft: '5px solid #007bff', paddingLeft: '1rem' },
  formTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '0.5rem' },
  stepContext: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  stepTitleBadge: { display: 'inline-block', padding: '4px 10px', backgroundColor: 'rgba(0, 123, 255, 0.2)', color: '#4da3ff', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '4px', alignSelf: 'flex-start', border: '1px solid rgba(0, 123, 255, 0.3)' },
  stepDetailText: { fontSize: '1rem', color: '#ddd', lineHeight: '1.5' },
  scrollArea: { flex: 1, overflowY: 'auto', paddingRight: '10px', marginBottom: '1.5rem' },
  recHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' },
  label: { fontSize: '0.85rem', color: '#888', fontWeight: '700' },
  arrowBox: { display: 'flex', gap: '0.5rem' },
  arrowBtn: { backgroundColor: '#333', border: '1px solid #555', color: '#fff', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s' },
  sliderContainer: { display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.8rem', scrollBehavior: 'smooth', marginBottom: '1.5rem', msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' },
  manualAddCard: { minWidth: '220px', width: '220px', height: '160px', backgroundColor: 'rgba(0, 123, 255, 0.05)', border: '2px dashed #007bff', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 },
  plusIcon: { fontSize: '2.5rem', color: '#007bff', fontWeight: '300', marginBottom: '0.5rem' },
  manualText: { color: '#007bff', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center', lineHeight: '1.4' },
  recommendCard: { minWidth: '240px', width: '240px', height: '160px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', padding: '1.2rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'border-color 0.2s', flexShrink: 0, position: 'relative' },
  recBadge: { position: 'absolute', top: '10px', right: '10px', fontSize: '0.7rem', color: '#4caf50', border: '1px solid #4caf50', padding: '1px 5px', borderRadius: '3px' },
  recFactor: { color: '#fff', fontSize: '0.9rem', fontWeight: '700', lineHeight: '1.4', marginBottom: '0.5rem', paddingRight: '50px', wordBreak: 'keep-all' },
  recMeasure: { color: '#888', fontSize: '0.8rem', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' },
  emptyCard: { minWidth: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.9rem', border: '1px solid #333', borderRadius: '8px' },
  riskControlRow: { display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #222' },
  riskInputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  select: { backgroundColor: '#222', border: '1px solid #444', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', outline: 'none', width: '80px', textAlign: 'center' },
  riskResultGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '2rem', borderLeft: '1px solid #333', minWidth: '100px', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { padding: '1rem', backgroundColor: '#151515', color: '#888', fontSize: '0.75rem', textAlign: 'left', borderBottom: '2px solid #333' },
  td: { padding: '0.8rem 0.5rem', borderBottom: '1px solid #222', color: '#fff', fontSize: '0.95rem', verticalAlign: 'top' },
  emptyTd: { padding: '3rem', textAlign: 'center', color: '#444', fontSize: '0.9rem' },
  inlineInput: { width: '100%', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.8rem', borderRadius: '4px', outline: 'none', fontSize: '0.9rem', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5' },
  deleteBtn: { backgroundColor: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' },
  btnArea: { marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', gap: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.1)' },
  prevBtn: { flex: 1, padding: '1.2rem', backgroundColor: 'transparent', color: '#aaa', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', transition: 'all 0.2s' },
  nextBtn: { flex: 2, padding: '1.2rem', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(255,255,255,0.2)' },
  footerArea: { width: '100%', padding: '0.5rem 0 1.5rem', zIndex: 10 },
  bottomAdWrapper: { width: '100%', display: 'flex', justifyContent: 'center' },
};