import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runtimeDatabaseUrl} from '../server/postgres.mjs';
import {serviceFailure} from '../server/service-failure.mjs';
test('Serverless Supabase runtime uses transaction pooling without changing identity or TLS parameters',()=>{
 const input='postgresql://postgres.project:escaped%40password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?application_name=portal';
 const actual=new URL(runtimeDatabaseUrl(input)),expected=new URL(input);expected.port='6543';
 assert.equal(actual.toString(),expected.toString());
 for(const url of ['postgresql://user:pass@db.project.supabase.co:5432/postgres','postgresql://user:pass@localhost:5432/postgres','postgresql://user:pass@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'])assert.equal(runtimeDatabaseUrl(url),url);
});
test('Production diagnostics reveal only bounded categories, never credentials or SQL',()=>{
 for(const e of [new Error('postgres://user:secret@private-host/database'),{code:'untrusted-private-value',message:'secret'}])assert.equal(serviceFailure(e),'initialization');
 assert.equal(serviceFailure({code:'53300'}),'database-capacity');
 assert.equal(serviceFailure({code:'ECONNRESET'}),'database-connection');
 assert.equal(serviceFailure({code:'SELF_SIGNED_CERT_IN_CHAIN'}),'database-tls');
});
