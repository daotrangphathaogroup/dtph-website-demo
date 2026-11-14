import test from 'node:test';
import assert from 'node:assert/strict';
import {findRegistrationMatches} from '../src/lib/registration-matches.ts';

test('Review distinguishes likely duplicates, conflicting birth dates and children sharing a parent phone', () => {
  const pending = {id:'pending',name:'Đặng  Minh An',birthday:'2012-01-03',phone:'',profileData:{relativePhone:'0901234567'}};
  const matches = findRegistrationMatches([pending], [
    pending,
    {id:'same-person',name:'Dang Minh An',birthday:'2012-01-03'},
    {id:'namesake',name:'Đặng Minh An',birthday:'2014-01-03'},
    {id:'sibling',name:'Đặng Minh Bình',birthday:'2014-01-03',profileData:{relativePhone:'0901234567'}},
  ]).get('pending');
  assert.deepEqual(matches.map(({member,likely})=>[member.id,likely]), [['same-person',true],['namesake',false]]);
  assert.match(matches[1].reason,/khác ngày sinh/);
});
