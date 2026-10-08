import {browserTranslationUi} from '../locales/browserTranslationUi';
export default function PublicTranslationNotice({translation,locale}){
 const ui=browserTranslationUi(locale),{status,progress,start,toggle,original}=translation;
 if(['original','checking'].includes(status))return null;
 return <div className="public-translation-notice" role="status">
  {status==='download'&&<button onClick={start}>{ui.download}</button>}
  {status==='translating'&&<span>{ui.busy}{Number.isFinite(progress)?` · ${progress}%`:''}…</span>}
  {status==='translated'&&<><strong>{original?ui.original:ui.translated}</strong><button onClick={toggle}>{original?ui.showTranslation:ui.original}</button><p>{ui.notice}</p></>}
  {status==='unsupported'&&<p>{ui.unsupported}</p>}
  {status==='error'&&<><p>{ui.error}</p><button onClick={start}>{ui.download}</button></>}
 </div>;
}
