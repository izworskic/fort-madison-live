import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const lpmsSource=fs.readFileSync(new URL('../lib/providers/lpms.ts',import.meta.url),'utf8');
const aisSource=fs.readFileSync(new URL('../lib/providers/ais.ts',import.meta.url),'utf8');

function harness(fakeFetch){
  const js=ts.transpileModule(lpmsSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  vm.runInNewContext(js,{
    exports,
    require(name){
      if(name==='../engine.js')return {estimateTowFromLock:()=>null};
      if(name==='../lpms.js')return {parseLpmsXml:()=>[]};
      throw Error('Unexpected import '+name);
    },
    fetch:fakeFetch,
    Date, AbortSignal, process:{env:{}}
  },{timeout:1500});
  return exports.getTowEvents;
}

test('two failed lock feeds do not reveal provider exceptions or fabricate a tow',async()=>{
  const obtain=harness(async()=>{throw Error('TypeError: fetch failed API_KEY_SENSITIVE_STRING')});
  const result=await obtain();
  assert.equal(result.events.length,0);
  assert.equal(result.health.ok,false);
  assert.match(result.health.detail,/Lock 18 and Lock 19 reports are currently unavailable/);
  assert.doesNotMatch(result.health.detail,/TypeError|fetch failed|API_KEY_SENSITIVE_STRING/);
});
test('partial lock availability is explicitly reported without hiding the working source',async()=>{
  const calls=[];
  const obtain=harness(async(url,options)=>{
    calls.push({url,options});
    if(String(url).includes('in_lock=19'))throw Error('internal upstream failure with provider metadata');
    return{ok:true,text:async()=>'<no-lock-records />'};
  });
  const result=await obtain();
  assert.equal(result.health.ok,true);
  assert.match(result.health.detail,/Partial official lock data/);
  assert.match(result.health.detail,/Lock 19 not reachable/);
  assert.doesNotMatch(result.health.detail,/internal upstream failure/);
  assert.ok(calls.every(call=>call.options.signal),'requests have bounded timeouts');
});
test('live AIS health messages never publish connection internals or credentials',()=>{
  assert.doesNotMatch(aisSource,/Configured AIS feed failed:.*error instanceof Error/);
  assert.doesNotMatch(aisSource,/AISStream connection error:.*error.message/);
  assert.doesNotMatch(aisSource,/add AISSTREAM_API_KEY on the server/);
  assert.match(aisSource,/No vessel positions are inferred/);
});

test('degraded source status gives an official Corps Locks reporting route, never guessed tow arrival',()=>{
  const ui=fs.readFileSync(new URL('../components/LiveRefresh.tsx',import.meta.url),'utf8');
  assert.match(ui,/k===\"lpms\"&&!v\.ok/);
  assert.match(ui,/ndc\.ops\.usace\.army\.mil\/ords\/r\/lpms\/corps-locks\/home/);
});
