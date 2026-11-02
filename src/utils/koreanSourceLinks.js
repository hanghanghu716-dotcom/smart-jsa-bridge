// Official navigation only; these links do not import or republish source content.
export function koreanSourceLinks(kind) {
 return kind==='jobs' ? {
  label:'한국 공식 채용정보 바로가기',
  description:'고용24에서 ‘안전관리자’, ‘보건관리자’, ‘산업위생’ 등의 직무를 검색할 수 있습니다. 지원은 해당 공식 사이트에서 진행해 주세요.',
  links:[['고용24에서 채용정보 찾기','https://www.work24.go.kr/']],
 } : {
  label:'한국 공식 안전정보 바로가기',
  description:'새 소식은 고용노동부에서, 현행 법령은 국가법령정보센터에서 확인할 수 있습니다.',
  links:[['고용노동부 보도자료','https://www.moel.go.kr/news/enews/report/enewsList.do'],['국가법령정보센터','https://www.law.go.kr/']],
 };
}
