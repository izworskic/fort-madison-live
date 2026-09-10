import test from 'node:test';
import assert from 'node:assert/strict';
import {valueScore,lossScore,releaseDecision} from '../lib/scoring.js';

test('north-star value reaches 100 when all dimensions are 100',()=>{
  assert.equal(valueScore({decisionUtility:100,dataTruth:100,predictionAccuracy:100,actualObjectIdentity:100,emergentInsight:100,repeatVisitValue:100,searchCapture:100,performance:100,monetizableAttention:100}),100);
});

test('loss reaches zero with no measured failure',()=>{
  assert.equal(lossScore({}),0);
});

test('production veto blocks excellent UI with insufficient actual train identity',()=>{
  const r=releaseDecision({
    valueInputs:{decisionUtility:100,dataTruth:100,predictionAccuracy:100,actualObjectIdentity:100,emergentInsight:100,repeatVisitValue:100,searchCapture:100,performance:100,monetizableAttention:100},
    lossInputs:{},
    releaseInputs:{actualTrainIdentification:79,towIdentification:100,trainEta:100,bridgeEta:100,crossSystemPrediction:100,dataTruth:100,searchOpportunity:100,repeatVisitValue:100,performance:100,accessibility:100}
  });
  assert.equal(r.pass,false);
  assert.ok(r.vetoes.includes('ActualTrainIdentification < 80'));
});

test('fully validated system can pass all release gates',()=>{
  const hundred={decisionUtility:100,dataTruth:100,predictionAccuracy:100,actualObjectIdentity:100,emergentInsight:100,repeatVisitValue:100,searchCapture:100,performance:100,monetizableAttention:100};
  const release={actualTrainIdentification:100,towIdentification:100,trainEta:100,bridgeEta:100,crossSystemPrediction:100,dataTruth:100,searchOpportunity:100,repeatVisitValue:100,performance:100,accessibility:100};
  const r=releaseDecision({valueInputs:hundred,lossInputs:{},releaseInputs:release});
  assert.equal(r.pass,true);
});
