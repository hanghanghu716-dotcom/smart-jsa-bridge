import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORTED_LANGS} from '../src/locales/config.js';
import {getSocialUi} from '../src/locales/socialUi.js';
test('author and moderation labels are complete for all supported locales',()=>{
 for(const locale of SUPPORTED_LANGS)for(const [key,value] of Object.entries(getSocialUi(locale)))assert.ok(typeof value==='string'&&value.trim(),locale+':'+key);
});
