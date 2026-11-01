// End-to-end checks for the three approved final Fragments in a separate test Chrome.
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
const base=process.env.VRTG_BASE_URL||'http://127.0.0.1:8080';
const port=process.env.VRTG_CHROME_PORT||'9225';
const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const tab=tabs.find(t=>t.type==='page');assert(tab,'Test Chrome must have a page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
let serial=0;const pending=new Map(),errors=[],checks=[];
ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
function command(method,params={}){return new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function until(expression){for(let n=0;n<80;n++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timeout: '+expression);}
async function check(label,expression){assert(await evaluate(expression),label);checks.push(label);console.log('PASS',label);}
async function click(selector){await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);}
async function go(path){await command('Page.navigate',{url:base+path});await until(`location.pathname===${JSON.stringify(path)} && document.readyState==='complete'`);}
await command('Page.enable');await command('Runtime.enable');await command('Network.enable');
await mkdir('/tmp/vrtg-final-fragments-qa',{recursive:true});
try{
 for(const width of [1440,390,320]){
  await command('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<600});
  await go('/fragments');
  await check(`${width}px tracklist and no overflow`,'document.querySelectorAll("button[data-fragment]").length===3 && document.documentElement.scrollWidth<=innerWidth');
  await check(`${width}px no autoplay or audio preload`,'document.querySelector("#fragment-audio").paused && !document.querySelector("#fragment-audio").hasAttribute("src") && !performance.getEntriesByType("resource").some(r=>r.name.endsWith(".mp3"))');
  await check(`${width}px final metadata`,'document.title.includes("Fragment_03") && !document.querySelector("main").textContent.includes("À VENIR")');
 }
 await evaluate('window.audioRef=document.querySelector("#fragment-audio");window.analytics=[];addEventListener("vrtg:analytics",e=>analytics.push(e.detail));');
 const durations={ '01':84.888,'02':69.336,'03':98.208 };
 for(const id of ['01','02','03']){
  await click(`[data-fragment="${id}"]`);
  await until(`!audioRef.paused && audioRef.readyState>=3 && audioRef.src.endsWith('fragment-${id}-final.mp3') && audioRef.currentTime>0.1`);
  await check(`Playback of final Fragment_${id}`,`Math.abs(audioRef.duration-${durations[id]})<0.2 && document.querySelector('[data-fragment="${id}"]').getAttribute('aria-pressed')==='true'`);
 }
 await click('#fragment-toggle');await check('Pause','audioRef.paused');
 await evaluate('document.querySelector("#fragment-seek").value=40;document.querySelector("#fragment-seek").dispatchEvent(new Event("input"));');
 await check('Seek','Math.abs(audioRef.currentTime/audioRef.duration-0.4)<0.02');
 await click('#fragment-toggle');await until('!audioRef.paused && audioRef.readyState>=3 && Number.isFinite(audioRef.duration)');
 await click('#fragment-previous');await until('audioRef.src.endsWith("fragment-02-final.mp3") && !audioRef.paused');
 await check('Previous track','document.querySelector("#fragment-title").textContent==="Fragment_02"');
 await click('#fragment-next');await until('audioRef.src.endsWith("fragment-03-final.mp3") && !audioRef.paused && audioRef.readyState>=3 && Number.isFinite(audioRef.duration)');
 await check('Next track','document.querySelector("#fragment-title").textContent==="Fragment_03"');
 await check('Mobile player fits','document.querySelector("#fragment-player").getBoundingClientRect().right<=innerWidth && document.documentElement.scrollWidth<=innerWidth');
 const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
 await writeFile('/tmp/vrtg-final-fragments-qa/mobile.png',Buffer.from(shot.data,'base64'));
 await click('.header a[href="/frequences"]');await until('location.pathname==="/frequences"');
 await check('Audio persists across navigation','audioRef===document.querySelector("#fragment-audio") && !audioRef.paused && document.body.classList.contains("has-player")');
 await evaluate('history.back()');await until('location.pathname==="/fragments" && document.title.includes("Fragment_01")');
 await check('Audio persists with Back','!audioRef.paused && document.querySelectorAll("[data-fragment]")[2].getAttribute("aria-pressed")==="true"');
 await click('.header a[href="/frequences"]');await until('location.pathname==="/frequences"');await click('[data-play="frequence-02"]');
 await check('Spotify pauses Fragments','audioRef.paused && document.querySelector("#fragment-player").hidden && !document.querySelector(".platform-player").hidden');
 await click('.header a[href="/fragments"]');await until('location.pathname==="/fragments"');await click('[data-fragment="01"]');await until('!audioRef.paused && audioRef.readyState>=3 && Number.isFinite(audioRef.duration)');
 await check('Fragments closes Spotify','document.querySelector(".platform-player").hidden && !document.querySelector("#spotify-player").hasAttribute("src")');
 await evaluate('audioRef.currentTime=audioRef.duration-0.1');await until('audioRef.src.endsWith("fragment-02-final.mp3") && !audioRef.paused');
 await check('Continuous playback advances','document.querySelector("#fragment-title").textContent==="Fragment_02"');
 await click('[data-fragment="03"]');await until('audioRef.src.endsWith("fragment-03-final.mp3") && !audioRef.paused && audioRef.readyState>=3 && Number.isFinite(audioRef.duration)');
 await evaluate('audioRef.currentTime=audioRef.duration-0.1');await until('audioRef.ended');
 await check('End of project does not loop','audioRef.paused && audioRef.src.endsWith("fragment-03-final.mp3")');
 await click('#close-fragment-player');await check('Close stops and resets','audioRef.paused && audioRef.currentTime===0 && document.querySelector("#fragment-player").hidden');
 await check('Analytics play and track events','analytics.some(e=>e.event==="play_click" && e.provider==="native") && analytics.some(e=>e.event==="track_started" && e.track_id==="fragment-01")');
 await command('Emulation.setScriptExecutionDisabled',{value:true});await go('/fragments');
 await check('No-JS accessible audio fallbacks','document.querySelectorAll("noscript audio[controls][controlslist=nodownload]").length===3');
 await command('Emulation.setScriptExecutionDisabled',{value:false});
 assert.equal(errors.length,0,'No browser errors');checks.push('No JavaScript exceptions');
 await writeFile('/tmp/vrtg-final-fragments-qa/results.json',JSON.stringify({passed:checks.length,checks,errors},null,2));
 console.log(`${checks.length} browser checks passed.`);
}finally{await command('Emulation.setScriptExecutionDisabled',{value:false});ws.close();}
