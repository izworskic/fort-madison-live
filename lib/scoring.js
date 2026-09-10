const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,Number(n)||0));

export const VALUE_WEIGHTS={
  decisionUtility:.18,dataTruth:.15,predictionAccuracy:.14,actualObjectIdentity:.13,emergentInsight:.12,repeatVisitValue:.10,searchCapture:.08,performance:.05,monetizableAttention:.05
};
export const LOSS_WEIGHTS={
  falseObjectIdentity:.20,falsePrecision:.18,staleData:.16,predictionError:.14,routeMisclassification:.10,confidenceMiscalibration:.08,userConfusion:.06,performancePenalty:.04,dependencyFailure:.04
};
export const RELEASE_WEIGHTS={
  actualTrainIdentification:.15,towIdentification:.10,trainEta:.10,bridgeEta:.10,crossSystemPrediction:.15,dataTruth:.15,searchOpportunity:.10,repeatVisitValue:.08,performance:.04,accessibility:.03
};

export function weightedScore(values,weights){return Math.round(Object.entries(weights).reduce((sum,[k,w])=>sum+clamp(values[k])*w,0)*10)/10;}
export function valueScore(values){return weightedScore(values,VALUE_WEIGHTS);}
export function lossScore(values){return Math.round(Object.entries(LOSS_WEIGHTS).reduce((sum,[k,w])=>sum+(clamp(values[k])/100)*w,0)*1000)/1000;}
export function releaseScore(values){return weightedScore(values,RELEASE_WEIGHTS);}

export function releaseDecision({valueInputs,lossInputs,releaseInputs}){
  const value=valueScore(valueInputs), loss=lossScore(lossInputs), release=releaseScore(releaseInputs);
  const vetoes=[];
  if(clamp(releaseInputs.actualTrainIdentification)<80) vetoes.push('ActualTrainIdentification < 80');
  if(clamp(releaseInputs.dataTruth)<95) vetoes.push('DataTruth < 95');
  if(clamp(releaseInputs.crossSystemPrediction)<80) vetoes.push('CrossSystemPrediction < 80');
  if(value<93) vetoes.push('North-star value < 93');
  if(loss>.12) vetoes.push('Loss > 0.12');
  if(release<93) vetoes.push('Release score < 93');
  return {value,loss,release,vetoes,pass:vetoes.length===0};
}
