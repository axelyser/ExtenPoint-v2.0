import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(path.resolve(root)+path.sep)){res.writeHead(403);res.end();return;}const data=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('No encontrado');}}).listen(4173,'127.0.0.1',()=>console.log('ExtenPoint: http://127.0.0.1:4173'));
