import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {translationAvailability,translationPayload,translatePublicRows} from '../services/browserTranslation';

export function usePublicTranslation(rows,locale,detail=false){
  const key=JSON.stringify([locale,detail,translationPayload(rows,detail)]);
  const input=useMemo(()=>JSON.parse(key),[key]);
  const [state,setState]=useState({key:'',status:'original'});
  const abort=useRef(null);
  const start=useCallback(()=>{
    const [target,full,source]=input,controller=new AbortController();abort.current?.abort();abort.current=controller;
    setState({key,status:'translating'});
    void translatePublicRows(source,target,{detail:full,signal:controller.signal,
      onProgress:progress=>{if(!controller.signal.aborted)setState({key,status:'translating',progress});}
    }).then(result=>{if(!controller.signal.aborted)setState({key,status:'translated',rows:result,original:false});})
      .catch(error=>{if(!controller.signal.aborted)setState({key,status:error.name==='NotAllowedError'?'download':'error'});});
  },[input,key]);
  useEffect(()=>{
    let active=true;const [target,,source]=input;
    translationAvailability(source,target).then(status=>{
      if(!active)return;
      if(status==='available')start();else setState({key,status});
    }).catch(()=>{if(active)setState({key,status:'unsupported'});});
    return()=>{active=false;abort.current?.abort();};
  },[input,key,start]);
  const current=state.key===key?state:{status:'checking'};
  const translated=current.status==='translated'&&!current.original;
  // Live metrics, country and publication state are always taken from the fresh source.
  const visible=translated?rows.map(row=>{const match=current.rows.find(item=>item.id===row.id);return match?{...row,title:match.title,...(detail?{form_data:match.form_data,analysis_data:match.analysis_data,custom_layout:match.custom_layout,publication_context:match.publication_context}:{})}:row;}):rows;
  return {rows:visible,status:current.status,progress:current.progress,translated,original:current.original,start,
    toggle:()=>setState(previous=>({...previous,original:!previous.original}))};
}
