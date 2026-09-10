import {releaseDecision} from '../lib/scoring.js';

// Code-complete baseline. External production gates are deliberately represented as low scores
// until real freight data and calibrated Fort Madison outcomes exist.
const licensedFreight=process.env.FREIGHT_PRODUCTION_VALIDATED==='true';
const towCalibrated=process.env.TOW_MODEL_CALIBRATED==='true';
const shadowValidated=process.env.FREIGHT_SHADOW_100_PASS==='true';

const input={
  valueInputs:{decisionUtility:94,dataTruth:98,predictionAccuracy:towCalibrated&&shadowValidated?93:58,actualObjectIdentity:licensedFreight?92:55,emergentInsight:96,repeatVisitValue:78,searchCapture:95,performance:90,monetizableAttention:88},
  lossInputs:{falseObjectIdentity:0,falsePrecision:towCalibrated?5:22,staleData:4,predictionError:towCalibrated&&shadowValidated?7:30,routeMisclassification:licensedFreight?4:15,confidenceMiscalibration:10,userConfusion:6,performancePenalty:8,dependencyFailure:10},
  releaseInputs:{actualTrainIdentification:licensedFreight&&shadowValidated?92:55,towIdentification:90,trainEta:shadowValidated?90:55,bridgeEta:towCalibrated?90:58,crossSystemPrediction:towCalibrated&&shadowValidated?92:82,dataTruth:98,searchOpportunity:95,repeatVisitValue:78,performance:90,accessibility:92}
};
const result=releaseDecision(input);
console.log(JSON.stringify({mode:result.pass?'PRODUCTION_READY':'SHADOW/BETA',...result},null,2));
if(process.argv.includes('--check')&&!result.pass) process.exitCode=1;
