"""Read-only checks of complete RSS bodies against the public detail pages."""
import concurrent.futures
from collections import Counter
import html.parser
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

SITE = 'https://smartjsabridge.com'
CANDIDATE = '--candidate' in sys.argv

def read(url):
    if urllib.parse.urlsplit(url).netloc != 'smartjsabridge.com':
        raise ValueError('Unexpected external URL')
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                if response.status != 200:
                    raise ValueError(f'HTTP {response.status}: {url}')
                return response.read()
        except Exception:
            if attempt == 2:
                raise

class VisibleText(html.parser.HTMLParser):
    def __init__(self, article_only=False):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.article_only = article_only
        self.in_article = 0
        self.hidden = 0

    def handle_starttag(self, tag, attrs):
        if tag == 'article':
            self.in_article += 1
        if tag in ('script', 'style'):
            self.hidden += 1

    def handle_endtag(self, tag):
        if tag == 'article':
            self.in_article = max(0, self.in_article - 1)
        if tag in ('script', 'style'):
            self.hidden = max(0, self.hidden - 1)

    def handle_data(self, value):
        if not self.hidden and (not self.article_only or self.in_article):
            self.parts.append(value)

def normalize(value):
    return re.sub(r'\s+', ' ', value).strip()

def visible(value, article_only=False):
    parser = VisibleText(article_only)
    parser.feed(value)
    return normalize(' '.join(parser.parts))

def check(item):
    url = item.findtext('link')
    body = visible(item.findtext('description') or '')
    page = read(url).decode('utf-8')
    if '/public-jsa/' in url:
        match = re.search(r'window\.__PUBLIC_JSA__=(.*?);</script>', page, re.S)
        if not match:
            raise ValueError(f'Missing public body: {url}')
        row = json.loads(match.group(1))
        expected = [row['title'], *row['publication_context'].values()]
        for step in row['analysis_data']:
            expected.extend([step['proc']['stepTitle'], step['proc']['stepDetail']])
            for risk in step['risks']:
                expected.extend([risk['factor'], risk['category'], risk['current_measure'] or risk['measure'], risk['recommend_measure']])
        for value in expected:
            if value and normalize(value) not in body:
                raise ValueError(f'Missing public text in RSS: {url}')
        return 'public-jsa'
    if CANDIDATE:
        # The previous release renders an empty commerce section. The candidate
        # intentionally removes only this exact heading-only placeholder; keep
        # all populated sections and every actual article token mandatory.
        page = re.sub(
            r'<section id="section-\d+"><h2>\d+\. (?:Related products|관련 상품)</h2></section>',
            '', page)
    expected = visible(page, article_only=True)
    # Candidate HTML may intentionally move complete sections relative to the
    # currently deployed page. Keep every text token (including multiplicity)
    # mandatory before release; after deployment also require identical order.
    missing = Counter(expected.split()) - Counter(body.split()) if CANDIDATE else None
    if not expected or (bool(missing) if CANDIDATE else expected not in body):
        raise ValueError(f'Missing full case body in RSS: {url}')
    return 'case-study'

results = []
for locale in ('ko', 'en-US'):
    data = pathlib.Path(f'.cache/rss-{locale}.xml').read_bytes() if CANDIDATE else read(f'{SITE}/{locale}/feed.xml')
    if len(data) >= 4_000_000:
        raise ValueError('RSS exceeds size budget')
    root = ET.fromstring(data)  # Strict XML parser, including entity/control-character checks.
    items = root.findall('./channel/item')
    if not items:
        raise ValueError(f'Empty RSS: {locale}')
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        types = list(pool.map(check, items))
    results.append({'locale': locale, 'bytes': len(data), 'items': len(items),
                    'publicDocuments': types.count('public-jsa'), 'caseStudies': types.count('case-study')})
report = {'mode': 'candidate' if CANDIDATE else 'production', 'feeds': results}
pathlib.Path('.cache').mkdir(exist_ok=True)
pathlib.Path('.cache/rss-body-check.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print('RSS_FULL_BODY_CHECK ' + json.dumps(report))
