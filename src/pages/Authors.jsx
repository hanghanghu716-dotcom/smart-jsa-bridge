import { useEffect,useRef,useState } from 'react';
import { useParams,useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageLink,useLanguageNavigate } from '../hooks/useLanguage';
import { authorAction } from '../services/authorService';
import { supabase } from '../supabaseClient';
import { getSocialUi } from '../locales/socialUi';
import { getLanguageTag } from '../locales/config';
import { validProjectId } from '../utils/publicJsa';
import ThemeSwitcher from '../components/ThemeSwitcher';
import SEO from '../components/SEO';
import '../styles/community.css';

export default function Authors(){
 const {id}=useParams();
 return <AuthorScreen key={id||'following'} id={id}/>;
}
function AuthorScreen({id}) {
 const {i18n}=useTranslation(),ui=getSocialUi(i18n.language),location=useLocation(),navigate=useLanguageNavigate();
 const [state,setState]=useState(null),[page,setPage]=useState(0),[refresh,setRefresh]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[nickname,setNickname]=useState(''),[bio,setBio]=useState('');
 const lock=useRef(false),following=!id,key=id+':'+page+':'+refresh;
 useEffect(()=>{
  let active=true;
  const run=async()=>{
   const {data:{user}}=await supabase.auth.getUser();
   if(!id&&!user){if(active)setState({key,login:true});return;}
   if(id&&!validProjectId(id)){if(active)setState({key,data:null});return;}
   const data=id?await authorAction('author',id,{offset:page*12}):await authorAction('feed',null,{offset:page*12});
   const authors=id?[]:await authorAction('following');
   if(active){setState({key,data,authors,user});if(data?.own){setNickname(data.nickname||'');setBio(data.bio||'');}}
  };
  run().catch(()=>{if(active)setState({key,error:true});});
  return()=>{active=false;};
 },[id,page,refresh,key]);
 useEffect(()=>{const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{if(event!=='INITIAL_SESSION')setRefresh(n=>n+1);});return()=>subscription.unsubscribe();},[]);
 const mutate=async(action,target=id,payload={})=>{
  if(lock.current)return;
  if(!state?.user){navigate('/login?next='+encodeURIComponent(location.pathname));return;}
  lock.current=true;setBusy(true);setMessage('');
  try{const result=await authorAction(action,target,payload);if(result===null)throw Error('NOT_FOUND');setRefresh(n=>n+1);setMessage(ui.saved);}catch{setMessage(ui.error);}finally{lock.current=false;setBusy(false);}
 };
 const ready=state?.key===key,profile=ready&&!following?state.data:null;
 const items=ready?(following?(state.data||[]).slice(0,12):profile?.items||[]):[];
 const more=following?state?.data?.length>12:profile?.hasMore;
 const name=profile?.nickname||ui.author+' '+(id||'').slice(0,8);
 return <div className="jsa-workspace" dir={i18n.dir()}><SEO pageTitle={(following?ui.following:name)+' | Smart JSA Bridge'} noIndex/><header className="jsa-nav"><LanguageLink to="/explore">Smart JSA Bridge</LanguageLink><ThemeSwitcher compact/></header><main className="jsa-container author-page">
  <nav className="jsa-toolbar"><LanguageLink to="/explore">{ui.all}</LanguageLink><LanguageLink to="/following">{ui.following}</LanguageLink>{state?.user&&<LanguageLink to={'/authors/'+state.user.id}>{ui.author}</LanguageLink>}</nav>
  <h1>{following?ui.feed:name}</h1>{!ready&&<p role="status">…</p>}
  {ready&&state.login&&<LanguageLink to={'/login?next='+encodeURIComponent(location.pathname)}>{ui.login}</LanguageLink>}
  {ready&&state.error&&<p role="alert">{ui.error} <button onClick={()=>setRefresh(n=>n+1)}>{ui.refresh}</button></p>}
  {message&&<p role="status">{message}</p>}
  {profile&&<section className="jsa-card author-profile"><p>{profile.bio}</p><p>{ui.publications} {profile.total} · {ui.followers} {profile.followers}</p>
   {!profile.own&&<button disabled={busy} aria-pressed={profile.following} onClick={()=>mutate(profile.following?'unfollow':'follow')}>{profile.following?ui.unfollow:ui.follow}</button>}
   {profile.own&&<details><summary>{ui.nickname}</summary><p>{ui.profileHelp}</p><form onSubmit={e=>{e.preventDefault();mutate('profile',null,{nickname,bio});}}><label>{ui.nickname}<input required minLength={2} maxLength={40} value={nickname} onChange={e=>setNickname(e.target.value)}/></label><label>{ui.bio}<textarea maxLength={300} value={bio} onChange={e=>setBio(e.target.value)}/></label><button disabled={busy||nickname.trim().length<2}>{ui.save}</button></form></details>}
  </section>}
  {following&&ready&&state.authors?.length>0&&<details className="jsa-card"><summary>{ui.authors} ({state.authors.length})</summary><ul className="author-list">{state.authors.map(a=><li key={a.id}><LanguageLink to={'/authors/'+a.id}>{a.nickname||ui.author+' '+a.id.slice(0,8)}</LanguageLink><button disabled={busy} onClick={()=>mutate('unfollow',a.id)}>{ui.unfollow}</button></li>)}</ul></details>}
  <div className="jsa-card-grid">{items.map(item=><article className="jsa-card" key={item.id}><h2><LanguageLink to={'/public-jsa/'+item.id}>{item.title}</LanguageLink></h2>{following&&<LanguageLink to={'/authors/'+item.author_id}>{item.nickname||ui.author+' '+item.author_id.slice(0,8)}</LanguageLink>}<p><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleDateString(getLanguageTag(i18n.language))}</time> · {item.public_locale}</p></article>)}</div>
  {ready&&!state.error&&!state.login&&!items.length&&<p>{ui.empty}</p>}
  <nav className="jsa-toolbar"><button disabled={!ready||!page||busy} onClick={()=>setPage(n=>n-1)}>{ui.previous}</button><button disabled={!ready||!more||busy} onClick={()=>setPage(n=>n+1)}>{ui.next}</button></nav>
 </main></div>;
}
