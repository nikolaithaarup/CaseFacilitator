
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../firebase/firebase";
export type FacilitatorBridgeSession={descriptor:unknown;facilitatorSessionId:string;firebaseUid:string;leaseExpiresAt:string;revocationVersion:number;status:"ACTIVE"};
async function request(path:string,init:RequestInit){const r=await fetch(path,{...init,credentials:"include",cache:"no-store",headers:{"Content-Type":"application/json",...init.headers}});if(!r.ok)throw new Error("Portaladgang blev afvist.");return r.json();}
export async function redeemPortalLaunch(code:string,state:string){const result=await request("/api/launch/redeem",{method:"POST",body:JSON.stringify({code,state})});await signInWithCustomToken(auth,result.firebaseCustomToken);return result.session as FacilitatorBridgeSession;}
export async function restorePortalSession(){try{const result=await request("/api/module-session",{method:"GET"});await signInWithCustomToken(auth,result.firebaseCustomToken);return result.session as FacilitatorBridgeSession;}catch{return null;}}
export async function endPortalSession(){await fetch("/api/module-session",{method:"DELETE",credentials:"include"});}
