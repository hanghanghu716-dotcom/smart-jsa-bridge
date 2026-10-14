import test from 'node:test';
import assert from 'node:assert/strict';
import { pageWindow } from '../src/utils/pagination.js';
import { renderExplorePagination } from '../api/explore.js';
import { exploreSearch } from '../src/utils/discovery.js';
import { getPaginationUi } from '../src/locales/paginationUi.js';
import { SUPPORTED_LANGS } from '../src/locales/config.js';

test('numbered pagination handles group boundaries, partial last groups and mobile groups', () => {
  assert.deepEqual(pageWindow(16, 35).pages, Array.from({length:15}, (_,i)=>i+16));
  assert.deepEqual(pageWindow(35, 35).pages, [31,32,33,34,35]);
  assert.deepEqual(pageWindow(16, 35, 5).pages, [16,17,18,19,20]);
  assert.deepEqual(pageWindow(1, 0).pages, []);
  assert.equal(pageWindow(99, 2).page, 2);
});
test('Explore initial HTML exposes numbered links preserving every filter and escaping search text', () => {
  const query={search:'paint & <test>',sort:'views',tags:['가스'],country:'KR',author:'operator'};
  const html=renderExplorePagination(35,16,'ko',page=>'/ko/explore'+exploreSearch({...query,page}));
  assert.equal((html.match(/list-pagination-number"/g)||[]).length,15);
  assert.match(html,/aria-current="page"[^>]*>16<\/a>/);
  assert.ok(html.includes(exploreSearch({...query,page:29}).replace(/&/g,'&amp;')));
  assert.match(html,/author=operator/);
  assert.doesNotMatch(html,/<test>/);
  assert.equal(renderExplorePagination(1,1,'ko',()=>'/'), '');
});
test('pagination labels are available for every supported locale', () => {
  for(const locale of SUPPORTED_LANGS)for(const value of Object.values(getPaginationUi(locale)))assert.ok(value.trim(),locale);
});
