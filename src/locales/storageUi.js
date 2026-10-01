import {getPlansUi} from './plansUi.js';
import {getCommunityUi} from './communityUi.js';
import { getPhase6Ui, phase6Language } from './phase6Ui.js';
const en={title:'Private document storage',used:'{used} / {limit} saved',trial:'{used} saved · free trial active',full:'Free storage is full (3 documents). Delete an unneeded document or view the free trial options to save another. Existing documents can still be edited and exported.',expired:'Your trial has ended. Existing documents are kept; additional saves use the Free limit.',hint:'Free includes 3 saved private documents. Steps and risks within a document, editing and PDF export are not limited. Drafts and public bookmarks do not use these slots.',cta:'View free trial',error:'Storage usage could not be loaded. The server will still check the limit when you save.',retry:'Refresh',limitError:'Free allows 3 saved private documents. Your current draft is kept. Delete an unneeded saved document or view the free trial options.',};
const ko={title:'비공개 작업물 저장 공간',used:'{used} / {limit}개 사용 중',trial:'{used}개 저장됨 · 무료 체험 중',full:'Free 저장 공간 3개를 모두 사용했습니다. 불필요한 작업물을 삭제하거나 무료 체험을 확인하면 새 작업물을 저장할 수 있습니다. 기존 문서의 수정·출력은 가능합니다.',expired:'무료 체험이 종료되었습니다. 기존 문서는 보존되며 추가 저장에는 Free 한도가 적용됩니다.',hint:'Free는 비공개 작업물 3개를 저장할 수 있습니다. 문서 안의 단계·위험요인, 기존 문서 수정·PDF 출력은 제한하지 않습니다. 임시저장과 공개 자료 스크랩은 이 한도에 포함하지 않습니다.',cta:'무료 체험 확인',error:'저장 사용량을 불러오지 못했습니다. 저장 시 서버에서 한도를 확인합니다.',retry:'새로고침',limitError:'Free는 비공개 작업물을 3개까지 저장할 수 있습니다. 작성 중인 내용은 유지됩니다. 불필요한 저장 작업물을 삭제하거나 무료 체험을 확인해 주세요.',};
const storageCache=new Map();
export function getStorageUi(locale='en-US') {
 const base=getPhase6Ui('storage',locale)||(phase6Language(locale)==='ko'?ko:en),plans=getPlansUi(locale),community=getCommunityUi(locale);
 if(!storageCache.has(base))storageCache.set(base,{...base,used:plans.saved,trial:plans.saved,full:plans.storageError,expired:community.freeCore,hint:community.freeCore,cta:plans.start,error:plans.storageError,limitError:plans.storageError});
 return storageCache.get(base);
}
