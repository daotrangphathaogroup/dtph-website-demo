import {readFile} from 'node:fs/promises';
const trace=JSON.parse(await readFile('.next/server/app/api/[[...path]]/route.js.nft.json','utf8'));
const forbidden=trace.files.filter(file=>/(^|\/)\.local\/|(^|\/)\.env(?:\.|$)|\/tests\/|\/docs\/previews\//.test(file));
if(forbidden.length)throw new Error(`Deployment trace includes ${forbidden.length} private/test files.`);
console.log('Deployment trace checked: no local database, environment files or test data.');
