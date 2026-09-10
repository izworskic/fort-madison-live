import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLpmsXml } from '../lib/lpms.js';
import { normalizeFreightRow, normalizeRailDirection } from '../lib/rail.js';

test('LPMS XML extracts actual tow identity, direction, barges and lockage time',()=>{
  const xml=`<root><row><vessel_name>M/V TEST &amp; CO</vessel_name><vessel_no>1234567</vessel_no><direction>Upbound</direction><num_barges>15</num_barges><arrival_date>09/10/2026 12:00:00</arrival_date><end_of_lockage>09/10/2026 12:42:00</end_of_lockage><timezone>CDT</timezone></row></root>`;
  const [r]=parseLpmsXml(xml);
  assert.deepEqual(r,{vessel_name:'M/V TEST & CO',vessel_no:'1234567',direction:'Upbound',num_barges:'15',arrival_date:'09/10/2026 12:00:00',end_of_lockage:'09/10/2026 12:42:00',timezone:'CDT'});
});

test('freight normalizer preserves unknown direction instead of inventing WEST',()=>{
  const r=normalizeFreightRow({operator:'BNSF',leadLocomotive:'8127',direction:'',trainType:'Intermodal',detectedAt:'2026-09-10T18:00:00Z'},0);
  assert.equal(r.direction,'unknown');
  assert.equal(r.displayId,'BNSF 8127');
});

test('freight normalizer identifies physical train when lead locomotive is supplied',()=>{
  const r=normalizeFreightRow({carrier:'BNSF',leadLocomotive:8127,direction:'westbound',trainType:'Intermodal',tripId:'abc',lat:40.6,lon:-91.5},0);
  assert.equal(r.displayId,'BNSF 8127 WEST');
  assert.equal(r.id,'abc');
  assert.equal(r.type,'Intermodal');
  assert.equal(r.lat,40.6);
});

test('rail directions accept compact tripwire forms',()=>{
  assert.equal(normalizeRailDirection('EB'),'eastbound');
  assert.equal(normalizeRailDirection('W'),'westbound');
  assert.equal(normalizeRailDirection('north'),'unknown');
});
