import type { NoticeItem } from "../types";
export async function getNavigationNotices():Promise<{items:NoticeItem[],health:{ok:boolean,detail:string}}> {
  const url="https://ndc.ops.usace.army.mil/ords/ntni/json_data/notices_by_district/MVR";
  try{const res=await fetch(url,{headers:{"User-Agent":"FortMadisonLive/0.1"},next:{revalidate:1800}}); if(!res.ok)throw new Error(`NTNI ${res.status}`); const j:any=await res.json(); const rows=Array.isArray(j)?j:(j?.items??j?.notices??[]); const items:NoticeItem[]=rows.slice(0,8).map((x:any,i:number)=>({id:String(x.id??x.notice_id??i),title:String(x.title??x.subject??x.notice_title??"Rock Island District navigation notice"),url:x.url??x.notice_url,date:x.date??x.issue_date})); return {items,health:{ok:true,detail:`Rock Island District notices queried (${items.length}).`}};}catch(err:any){return {items:[],health:{ok:false,detail:String(err?.message??err)}};}
}
