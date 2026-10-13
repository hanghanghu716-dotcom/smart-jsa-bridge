import { sendContent } from '../server/public-content.js';

// Chinese routes were retired. Returning the English home page with HTTP 200
// makes unrelated old URLs look like duplicate home pages to search engines.
export default function retiredLocale(req, res) {
  sendContent(req, res, '<!doctype html><html lang="en"><head><title>Page not found | Smart JSA Bridge</title><meta name="robots" content="noindex,follow"></head><body><h1>Page not found</h1><p>This language version is no longer available.</p><a href="/en-US">Smart JSA Bridge</a></body></html>', { status: 404 });
}
