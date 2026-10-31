"use strict";
const fs=require("node:fs");
const path=require("node:path");
const DATA_PATH=path.join(__dirname,"data","bullbear_signal_performance.json");
const WEIGHTS={
 legacy:{momentum:.15,volume:.15,shortTerm:.20,mediumTerm:.20,longTerm:.10,volatility:.10,marketDirection:.10},
 current:{momentum:.20,volume:.05,shortTerm:.15,mediumTerm:.20,longTerm:.20,volatility:.10,marketDirection:.10}
};
const KEYS=Object.keys(WEIGHTS.current);
const CUTS={weightsV1End:"2026-10-06T00:00:00.000Z",calibratedVolumeStart:"2026-10-28T00:00:00.000Z"};
function scoreRecord(record,weights){
 const p=record.componentScores;
 if(!p||!KEYS.every(k=>typeof p[k]==="number"&&Number.isFinite(p[k])))return null;
 return Math.round(Math.max(0,Math.min(100,KEYS.reduce((s,k)=>s+p[k]*weights[k],0))));
}
function directionForScore(s){
 if(s>=80)return "Strong Bullish";if(s>=65)return "Bullish";if(s>=55)return "Slightly Bullish";
 if(s>=45)return "Neutral";if(s>=35)return "Slightly Bearish";if(s>=20)return "Bearish";return "Strong Bearish";
}
function outcome(d,c){
 if(d==="Neutral")return Math.abs(c)<=.25?"correct":"incorrect";
 if(d.includes("Bullish"))return c>.1?"correct":c<-.1?"incorrect":"flat";
 if(d.includes("Bearish"))return c<-.1?"correct":c>.1?"incorrect":"flat";
 return "excluded";
}
function rate(n,d){return d?Number((100*n/d).toFixed(2)):null;}
function summarize(records,weights){
 const rows=records.map(r=>{const s=scoreRecord(r,weights);if(s===null)return null;const direction=directionForScore(s);return{direction,result:outcome(direction,r.oneHour.priceChangePercent)};}).filter(Boolean);
 const scored=rows.filter(x=>x.result==="correct"||x.result==="incorrect");
 const neutral=rows.filter(x=>x.direction==="Neutral");
 const directional=rows.filter(x=>x.direction!=="Neutral");
 const ds=directional.filter(x=>x.result==="correct"||x.result==="incorrect");
 const bull=ds.filter(x=>x.direction.includes("Bullish")),bear=ds.filter(x=>x.direction.includes("Bearish"));
 const ba=rate(bull.filter(x=>x.result==="correct").length,bull.length),ra=rate(bear.filter(x=>x.result==="correct").length,bear.length);
 return{recordsWithComponents:rows.length,scoredOutcomes:scored.length,correct:scored.filter(x=>x.result==="correct").length,incorrect:scored.filter(x=>x.result==="incorrect").length,flatExcluded:rows.filter(x=>x.result==="flat").length,accuracy:rate(scored.filter(x=>x.result==="correct").length,scored.length),neutralPredictions:neutral.length,neutralAccuracy:rate(neutral.filter(x=>x.result==="correct").length,neutral.length),directionalPredictions:directional.length,directionalCoverage:rate(directional.length,rows.length),directionalScored:ds.length,bullishScored:bull.length,bullishAccuracy:ba,bearishScored:bear.length,bearishAccuracy:ra,balancedDirectionalAccuracy:ba===null||ra===null?null:Number(((ba+ra)/2).toFixed(2))};
}
function eraFor(t){if(t<CUTS.weightsV1End)return"pre-2026-10-06 (legacy weights)";if(t<CUTS.calibratedVolumeStart)return"2026-10-06 to 2026-10-27 (new weights, pre-volume calibration)";return"2026-10-28 onward (new weights + calibrated volume)";}
function buildReport(input){
 if(!Array.isArray(input))throw Error("Signal history must be a JSON array");
 const eligible=input.filter(r=>r&&r.coin==="BTC"&&r.status==="complete"&&r.oneHour&&typeof r.oneHour.priceChangePercent==="number"&&Number.isFinite(r.oneHour.priceChangePercent)&&r.componentScores&&Number.isFinite(Date.parse(r.timestamp))).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
 const split=Math.floor(eligible.length*.7),early=eligible.slice(0,split),holdout=eligible.slice(split),eras={};
 for(const r of eligible)(eras[eraFor(r.timestamp)]??=[]).push(r);
 const compare=rs=>({legacyWeights:summarize(rs,WEIGHTS.legacy),currentWeights:summarize(rs,WEIGHTS.current)});
 return{generatedAt:new Date().toISOString(),source:"data/bullbear_signal_performance.json",scope:"BTC only; completed one-hour outcomes with saved componentScores",totalHistoryRecords:input.length,eligibleRecords:eligible.length,excludedRecords:input.length-eligible.length,evaluationPolicy:{directionalThresholdPercent:.1,neutralThresholdPercent:.25,scoreDirectionThresholds:"Existing BullBear score-to-direction thresholds",chronologicalSplit:"First 70% earlier period; final 30% forward holdout",note:"Fixed-weight counterfactual comparison only. No weights or thresholds are fitted on this dataset."},allEligible:compare(eligible),earlier70Percent:{records:early.length,comparison:compare(early)},forwardHoldout30Percent:{records:holdout.length,comparison:compare(holdout)},modelEras:Object.fromEntries(Object.entries(eras).map(([k,v])=>[k,{records:v.length,comparison:compare(v)}]))};
}
function main(){const report=buildReport(JSON.parse(fs.readFileSync(DATA_PATH,"utf8")));if(process.argv.includes("--json"))console.log(JSON.stringify(report,null,2));else{console.log("BullBear historical model experiment");console.log("Eligible BTC records:",report.eligibleRecords,"/",report.totalHistoryRecords);for(const [label,block] of [["All records",report.allEligible],["Forward holdout",report.forwardHoldout30Percent.comparison]]){console.log("\n"+label);for(const [model,m] of Object.entries(block))console.log(model,JSON.stringify({n:m.recordsWithComponents,accuracy:m.accuracy,neutralAccuracy:m.neutralAccuracy,directionalCoverage:m.directionalCoverage,balancedDirectionalAccuracy:m.balancedDirectionalAccuracy}));}console.log("\nFull report: node bullbear_historical_experiment.js --json");console.log("Retrospective comparison only; small samples are not proof of predictive edge.");}}
if(require.main===module)main();
module.exports={WEIGHTS,scoreRecord,directionForScore,outcome,summarize,eraFor,buildReport};