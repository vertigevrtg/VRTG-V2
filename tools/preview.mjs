// Local preview of the exported static site, including redirects, 404 and audio ranges.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
const root = resolve(import.meta.dirname, '../dist');
const { redirects } = JSON.parse(await readFile(resolve(root, '../vercel.json')));
const types = {'.mjs':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mp3':'audio/mpeg','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const redirect = redirects.find(r => r.source === url.pathname);
    if (redirect) { const to = new URL(redirect.destination, 'http://localhost'); to.search = url.search; res.writeHead(redirect.statusCode, {Location:to.pathname+to.search+to.hash});res.end();return; }
    let file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (!file.startsWith(root+sep) && file !== root) throw Error('Outside export');
    let code=200;
    try { if ((await stat(file)).isDirectory()) file=resolve(file,'index.html'); await stat(file); }
    catch { file=resolve(root,'404.html');code=404; }
    const info=await stat(file);
    const headers={'Content-Type':types[extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    let start=0,end=info.size-1;
    if(range && code===200){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;if(start>end){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}code=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;}
    headers['Content-Length']=end-start+1;res.writeHead(code,headers);
    if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);
  } catch { res.writeHead(400);res.end('Bad request'); }
}).listen(Number(process.env.PORT)||8080,'127.0.0.1',()=>console.log('VRTG preview: http://127.0.0.1:8080'));
