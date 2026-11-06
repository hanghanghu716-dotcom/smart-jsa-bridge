import AdsterraBanner,{AdsterraBottom} from './components/AdsterraBanner';
export default function AdBanner({placement='left',format}){return format==='vertical'?<AdsterraBanner placement={placement} contentReady/>:<AdsterraBottom/>;}
