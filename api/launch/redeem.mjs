
import { admin, json, readJson, redeemWithPortal, setSessionCookie, stableUid, Timestamp } from "../_lib/bridge.mjs";
export default async function handler(req,res){
 if(req.method!=="POST") return json(res,405,{error:"METHOD_NOT_ALLOWED"});
 try{const {code,state}=await readJson(req); const audience=process.env.FACILITATOR_LAUNCH_AUDIENCE||"synapse-facilitator-v1"; const redirectUri=process.env.FACILITATOR_LAUNCH_REDIRECT_URI||"https://facilitator.synapsestudio.dk/launch/callback";
 const descriptor=await redeemWithPortal({code,state,audience,redirectUri,modulePath:"/api/modules/facilitator/redeem",secretName:"FACILITATOR_MODULE_SERVICE_SECRET"}); const e=descriptor.entitlement; const {auth,db}=admin(); const uid=stableUid("fac",e); const sessionId=e.trainingSessionId;
 const role=e.subjectType==="STAFF"?"INSTRUCTOR_LEAD":"UNIT"; await db.doc(`simulationSessions/${sessionId}/members/${uid}`).set({schemaVersion:1,uid,role,active:true,unitId:e.unitId||null,portalSubjectType:e.subjectType,portalSubjectId:e.subjectId,updatedAt:Timestamp.now()},{merge:true});
 await db.doc(`users/${uid}`).set({uid,displayName:"SynapsePortal-bruger",email:`${uid}@portal.invalid`,orgId:e.organisationId,role:e.subjectType==="STAFF"?"admin":"student",updatedAt:Timestamp.now()},{merge:true});
 const leaseExpiresAt=e.expiresAt; const token=await auth.createCustomToken(uid,{facilitatorConnected:true,facilitatorSessionId:sessionId,facilitatorRole:role,facilitatorRevocationVersion:e.revocationVersion}); const session={descriptor,facilitatorSessionId:sessionId,firebaseUid:uid,leaseExpiresAt,revocationVersion:e.revocationVersion,status:"ACTIVE"}; setSessionCookie(res,{product:"FACILITATOR",session}); return json(res,200,{session,firebaseCustomToken:token});
 }catch(err){return json(res,err.status||500,{error:err.status?"DENIED":"BRIDGE_ERROR"});}
}
