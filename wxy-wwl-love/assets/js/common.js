
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

async function fetchJSON(path){
  const res = await fetch(path + (path.includes('?') ? '&' : '?') + '_ts=' + Date.now());
  if(!res.ok) throw new Error(`Fetch ${path} failed: ${res.status}`);
  return await res.json();
}
function ymd(d){ return d.toISOString().slice(0,10); }
function pad(n){ return n<10 ? '0'+n : ''+n; }
function ymdFromParts(y,m,d){ return `${y}-${pad(m)}-${pad(d)}`; }
async function loadMemIndex(){
  try{
    const idx = await fetchJSON('/content/memories.json');
    if(!idx.entries) idx.entries = [];
    return idx;
  }catch(e){
    console.warn('memories.json not found, using empty index');
    return { version: 1, entries: [] };
  }
}
