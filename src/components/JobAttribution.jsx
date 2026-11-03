import {jobAttribution} from '../data/jobAttribution';
export default function JobAttribution({sourceId}) {
 const info=jobAttribution(sourceId);
 return info?<small className="job-attribution" dir="auto">{info.credit}<br/>{info.note} <a href={info.url} target="_blank" rel="noopener noreferrer">{info.license}</a></small>:null;
}
