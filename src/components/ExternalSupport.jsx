import FeedbackForm from './FeedbackForm';
import FeedbackInbox from './FeedbackInbox';
import '../styles/feedback.css';
export default function ExternalSupport({admin=false}) {
 return admin ? <FeedbackInbox/> : <section className="jsa-card"><FeedbackForm includePolicyCategories/></section>;
}
