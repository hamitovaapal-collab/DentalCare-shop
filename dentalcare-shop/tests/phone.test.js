import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validPhone} from '../src/lib/phone.js';
test('phone validation accepts real digit counts with ordinary formatting',()=>{
 for(const phone of ['+996502820642','+996502474860','+996 (502) 820-642',' 0502 820 642 ','1234567','+123456789012345']) assert.equal(validPhone(phone),true,phone);
});
test('punctuation, whitespace and too few or too many digits are not phone numbers',()=>{
 for(const phone of ['-------','()()()()','       ','+------','+12 (34)-56','+1234567890123456','1234567+890','hello1234567','1234567\n890','1234567\t890','1234567'+'-'.repeat(33),'']) assert.equal(validPhone(phone),false,JSON.stringify(phone));
 for(const phone of [null,undefined,1234567,{}]) assert.equal(validPhone(phone),false);
});
