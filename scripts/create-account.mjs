// Herramienta administrativa de terminal. No se importa desde el navegador.
// EXTENPOINT_PAT se lee del entorno; nunca se guarda ni se imprime.
import {randomBytes} from 'node:crypto';
import {supabaseConfig} from '../js/supabaseConfig.js';
const [role,email,studentId='',nombre='Cuenta de demostración']=process.argv.slice(2);
if(!['estudiante','organizador','directivo'].includes(role)||!email||!process.env.EXTENPOINT_PAT)throw Error('Uso: EXTENPOINT_PAT en entorno y node scripts/create-account.mjs rol correo estudianteId nombre');
if(role==='estudiante'&&!studentId)throw Error('El estudiante necesita un ID existente');
const ref=new URL(supabaseConfig.url).hostname.split('.')[0];
const headers={Authorization:'Bearer '+process.env.EXTENPOINT_PAT,'Content-Type':'application/json'};
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
async function manage(endpoint,body){const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/${endpoint}`,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw Error('Supabase: '+(d.message||r.status));return d;}
if(studentId){const rows=await manage('database/query',{query:'select id from public.epx_students where id='+quote(studentId)});if(!rows.length)throw Error('Registra primero ese estudiante desde el panel organizador');}
const keys=await manage('api-keys');const service=keys.find(k=>k.name==='service_role')?.api_key;if(!service)throw Error('El token no puede obtener credenciales administrativas');
const password=process.env.EXTENPOINT_ACCOUNT_PASSWORD||randomBytes(18).toString('base64url')+'!a7';
const r=await fetch(supabaseConfig.url+'/auth/v1/admin/users',{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify({email,password,email_confirm:true,user_metadata:{nombre}})});const user=await r.json();if(!r.ok)throw Error(user.msg||user.message||'No se pudo crear la cuenta');
try{await manage('database/query',{query:`insert into public.epx_profiles(user_id,role,nombre,student_id) values(${quote(user.id)}::uuid,${quote(role)},${quote(nombre)},${studentId?quote(studentId):'null'});`});}
catch(error){await fetch(supabaseConfig.url+'/auth/v1/admin/users/'+user.id,{method:'DELETE',headers:{apikey:service,Authorization:'Bearer '+service}});throw error;}
console.log(JSON.stringify({email,role,studentId:studentId||null,password},null,2));
