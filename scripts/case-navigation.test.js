import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';
import { renderCaseArticle } from '../api/case-study.js';
import { caseNavigation } from '../src/utils/caseNavigation.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';
const nodes = node => [node, ...(node.childNodes || []).flatMap(nodes)];
const attr = (node, name) => node.attrs?.find(value => value.name === name)?.value;

test('every guide shortcut resolves once, including original numbered resource links', () => {
  for (const content_md of [
    '<p>Scope</p><h2>1. Basis</h2><p>Source evidence</p><h2>3. Master</h2><p>Controls</p><h2>11. Review</h2><p>Not professionally reviewed</p>',
    '# Guide\nIntroduction\n## 1. Basis\nSource evidence\n## 3. Master\nControls\n## 11. Review\nNot professionally reviewed',
    '## 6. Legacy guide\nKeep the full original text',
  ]) {
    const html = renderCaseArticle({content_md, pdf_download_url:'https://example.com/original.pdf'}, 'ko');
    const all = nodes(parseFragment(html));
    const nav = all.find(node => node.tagName === 'nav' && attr(node,'class') === 'case-quick-links');
    const links = nodes(nav).filter(node => node.tagName === 'a');
    for (const link of links) assert.equal(all.filter(node => attr(node,'id') === attr(link,'href').slice(1)).length, 1);
    assert.ok(html.includes('https://example.com/original.pdf'));
    assert.ok(all.some(node => ['section-11','section-12'].includes(attr(node,'id'))));
    assert.equal(links.length, content_md.includes('11. Review') ? 3 : 2);
    if(content_md.includes('Not professionally reviewed')) assert.ok(html.includes('Not professionally reviewed'));
  }
});

test('navigation is localized and feed links refer to the real article', () => {
  for (const locale of SUPPORTED_LANGS) {
    const base='https://smartjsabridge.com/'+locale+'/case-study/example';
    const navigation=caseNavigation(locale,true,base);
    assert.equal(navigation.links.length,3);
    for(const link of navigation.links) {
      assert.ok(link.text.trim());
      assert.equal(link.href,base+'#'+link.id);
    }
    if(!locale.startsWith('en')) assert.notEqual(navigation.label,caseNavigation('en-US').label);
  }
});

test('navigation does not fabricate review status or turn unsafe PDF URLs into links', () => {
  const html=renderCaseArticle({content_md:'<p>Legacy text</p>',pdf_list:[{name:'Unsafe',url:'javascript:alert(1)'}]},'ko');
  assert.ok(html.includes('Legacy text'));
  assert.ok(!html.includes('href="#case-review"'));
  assert.ok(!html.includes('javascript:'));
});
