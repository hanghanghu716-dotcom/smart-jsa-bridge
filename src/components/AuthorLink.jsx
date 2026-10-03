import { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageLink } from '../hooks/useLanguage';
import { authorAction } from '../services/authorService';
import { getSocialUi } from '../locales/socialUi';
export default function AuthorLink({id}) {
 const {i18n}=useTranslation(),ui=getSocialUi(i18n.language);
 const [profile,setProfile]=useState(null);
 useEffect(()=>{let active=true;if(id)authorAction('author',id).then(data=>{if(active)setProfile(data);}).catch(()=>{});return()=>{active=false;};},[id]);
 if(!id)return null;
 return <p className="author-byline"><LanguageLink to={'/authors/'+id}>{ui.author}: {profile?.id===id&&profile.nickname?profile.nickname:id.slice(0,8)}</LanguageLink></p>;
}
