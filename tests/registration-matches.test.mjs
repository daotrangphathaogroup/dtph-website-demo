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
  assert.deepEqual(matches.map(({member})=>member.id), ['same-person']);
  assert.match(matches[0].reason,/trùng ngày sinh/);
});


test('Matching names require a shared birthday or personal phone; conflicting birthdays remain visible when phone matches', () => {
  const pending = {id:'pending',name:'Nguyễn An',phone:'+84 901 234 567',birthday:'2000-01-02'};
  const matches = findRegistrationMatches([pending],[
    {id:'name-only',name:'Nguyễn An'},
    {id:'phone-match',name:'Nguyễn An',phone:'0901234567',birthday:'2001-01-02'},
    {id:'other-person',name:'Trần Bình',phone:'0901234567'},
  ]).get(pending.id);
  assert.deepEqual(matches.map(({member})=>member.id),['phone-match']);
  assert.match(matches[0].reason,/trùng SĐT cá nhân/);
  assert.match(matches[0].reason,/khác ngày sinh/);
  assert.deepEqual(findRegistrationMatches([{id:'x',name:'Nguyễn An'}],[{id:'y',name:'Nguyễn An'}]).get('x'),[]);
});
