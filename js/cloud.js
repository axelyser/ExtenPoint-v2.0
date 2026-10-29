import {supabaseConfig as config} from './supabaseConfig.js';
const SESSION_KEY='extenpoint.auth.v1';
let session=null,profile=null;
async function request(path,{method='GET',body,token,anonymous=false}={}){
 const response=await fetch(config.url+path,{method,headers:{apikey:config.anonKey,Authorization:'Bearer '+(anonymous?config.anonKey:token||session?.access_token||config.anonKey),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const data=await response.json().catch(()=>null);
 if(!response.ok){const error=Error(data?.message||data?.msg||data?.error_description||data?.error||'No se pudo completar la solicitud a Supabase.');error.status=response.status;throw error;}return data;
}
function remember(value){session=value;if(value)localStorage.setItem(SESSION_KEY,JSON.stringify(value));else localStorage.removeItem(SESSION_KEY);}
async function getProfile(){const rows=await request('/rest/v1/epx_profiles?user_id=eq.'+encodeURIComponent(session.user.id)+'&select=role,nombre,student_id');profile=rows[0];if(!profile)throw Error('La cuenta no tiene un perfil habilitado en ExtenPoint.');return profile;}
async function refresh(){if(session?.expires_at&&session.expires_at*1000>Date.now()+60000)return;if(!session?.refresh_token)throw Error('Inicia sesión para continuar.');const next=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},anonymous:true});remember(next);}
export const cloud={
 get profile(){return profile;},
 async initialize(){try{const raw=localStorage.getItem(SESSION_KEY);if(!raw)return null;session=JSON.parse(raw);await refresh();return await getProfile();}catch(e){remember(null);profile=null;throw e;}},
 async login(email,password){const next=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},anonymous:true});remember(next);try{return await getProfile();}catch(e){remember(null);throw e;}},
 async logout(){try{if(session)await request('/auth/v1/logout',{method:'POST'});}finally{remember(null);profile=null;}},
 async state(){await refresh();return request('/rest/v1/rpc/epx_state',{method:'POST',body:{}});},
 async apply(before,after){
  await refresh();const operations=[];
  for(const collection of ['estudiantes','actividades','participaciones']){
   const previous=new Map(before[collection].map(record=>[record.id,record]));
   for(const record of after[collection]){const old=previous.get(record.id)||null;if(JSON.stringify(old)!==JSON.stringify(record))operations.push({collection,before:old,after:record});}
   if(before[collection].some(old=>!after[collection].some(record=>record.id===old.id)))throw Error('No se permite eliminar registros desde este flujo.');
  }
  if(!operations.length)return before;
  return request('/rest/v1/rpc/epx_apply',{method:'POST',body:{operations}});
 }
};
