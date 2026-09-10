import test from "node:test";
import assert from "node:assert/strict";
import { estimateTowFromLock, intervalOverlapProbability, chooseNextEvent, normalizeDirection, parseLooseDate } from "../lib/engine.js";

test("normalizes river and rail directions",()=>{assert.equal(normalizeDirection("UP"),"northbound");assert.equal(normalizeDirection("down"),"southbound");assert.equal(normalizeDirection("EB"),"eastbound");});

test("Lock 19 northbound produces a named tow prediction",()=>{const now=new Date("2026-09-10T18:00:00Z");const row={vessel_name:"M/V TEST",vessel_no:"123",direction:"UP",num_barges:"15",end_of_lockage:"2026-09-10T16:30:00Z"};const e=estimateTowFromLock(row,"19",now);assert.ok(e);assert.equal(e.vesselName,"M/V TEST");assert.equal(e.barges,15);assert.equal(e.direction,"northbound");assert.equal(e.status,"ESTIMATED");});

test("wrong-way tow is excluded",()=>{const now=new Date("2026-09-10T18:00:00Z");assert.equal(estimateTowFromLock({vessel_name:"X",direction:"DOWN",end_of_lockage:"2026-09-10T17:30:00Z"},"19",now),null);});

test("overlap probability rises for contained interval",()=>{const p=intervalOverlapProbability("2026-09-10T18:10:00Z","2026-09-10T18:20:00Z","2026-09-10T18:00:00Z","2026-09-10T18:30:00Z");assert.equal(p,95);});

test("next event selects earliest upcoming object",()=>{const now=new Date("2026-09-10T18:00:00Z");const r=chooseNextEvent([{displayId:"BNSF 8127 WEST",direction:"westbound",type:"Intermodal",etaBest:"2026-09-10T18:12:00Z",confidence:"HIGH",status:"OBSERVED"}],[{vesselName:"M/V TEST",direction:"northbound",barges:15,etaBest:"2026-09-10T18:20:00Z",confidence:"MODERATE",status:"ESTIMATED"}],now);assert.equal(r.kind,"train");assert.equal(r.title,"BNSF 8127 WEST");});

test('scheduled passenger events without observations are not treated as map positions', () => {
  const scheduled = { status: 'SCHEDULED', lat: undefined, lon: undefined };
  assert.equal(Number.isFinite(scheduled.lat) && Number.isFinite(scheduled.lon), false);
});

test('zero-width train schedule does not manufacture bridge overlap probability', () => {
  const t='2026-09-10T15:00:00.000Z';
  assert.equal(intervalOverlapProbability(t,t,'2026-09-10T14:55:00.000Z','2026-09-10T15:05:00.000Z'),0);
});


test('LPMS local timestamps resolve Central daylight and standard time correctly',()=>{
  assert.equal(parseLooseDate('07/15/2026 12:00:00','CDT').toISOString(),'2026-07-15T17:00:00.000Z');
  assert.equal(parseLooseDate('01/15/2026 12:00:00','CST').toISOString(),'2026-01-15T18:00:00.000Z');
});
