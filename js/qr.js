import qrcode from './vendor/qrcode.js';

export function activityLink(base,activityId){
 const url=new URL(base);
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw Error('Usa una URL HTTPS pública para compartir el QR.');
 url.search='';url.hash='actividad/'+encodeURIComponent(activityId);
 return url.href;
}
export function qrSvg(link){const code=qrcode(0,'M');code.addData(link,'Byte');code.make();return code.createSvgTag({cellSize:5,margin:20,scalable:true});}
export function qrImage(link){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(qrSvg(link));}
export function downloadQr(link,id){const blob=new Blob([qrSvg(link)],{type:'image/svg+xml'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='ExtenPoint-QR-'+id.replace(/[^a-z0-9_-]/gi,'')+'.svg';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function activityRoute(hash){const prefix='#actividad/';if(!hash.startsWith(prefix))return null;try{return decodeURIComponent(hash.slice(prefix.length))||null;}catch{return null;}}
