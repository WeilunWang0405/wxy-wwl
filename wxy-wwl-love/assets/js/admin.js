
const gh = {
  get cfg(){
    return {
      owner: localStorage.getItem('ghOwner') || '',
      repo: localStorage.getItem('ghRepo') || '',
      token: localStorage.getItem('ghToken') || '',
    };
  },
  save({owner, repo, token}){
    if(owner) localStorage.setItem('ghOwner', owner);
    if(repo) localStorage.setItem('ghRepo', repo);
    if(token) localStorage.setItem('ghToken', token);
  },
  base(){
    const {owner, repo} = gh.cfg;
    if(!owner || !repo) throw new Error('未设置 Owner/Repo');
    return `https://api.github.com/repos/${owner}/${repo}/contents`;
  },
  async get(path){
    const url = gh.base() + '/' + encodeURIComponent(path);
    const res = await fetch(url + '?_=' + Date.now(), {
      headers: { Authorization: 'token ' + gh.cfg.token, Accept: 'application/vnd.github+json' }
    });
    if(res.status===404) return null;
    if(!res.ok) throw new Error(`GET ${path} 失败：` + res.status);
    return await res.json();
  },
  async put(path, contentBytes, message){
    const url = gh.base() + '/' + encodeURIComponent(path);
    let sha = undefined;
    const exists = await gh.get(path);
    if(exists && exists.sha) sha = exists.sha;
    const body = {
      message: message || `Update ${path}`,
      content: btoa(String.fromCharCode(...contentBytes)),
      committer: { name: "web-admin", email: "web-admin@local" }
    };
    if(sha) body.sha = sha;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: 'token ' + gh.cfg.token, Accept: 'application/vnd.github+json' },
      body: JSON.stringify(body)
    });
    if(!res.ok) throw new Error(`PUT ${path} 失败：` + res.status + ' ' + await res.text());
    return await res.json();
  }
};
function toBytes(str){ return new TextEncoder().encode(str); }
const el = (id)=> document.getElementById(id);
const log = (id,msg)=>{ const box = el(id); box.textContent += (box.textContent? "\n":"") + msg; box.scrollTop = box.scrollHeight; };

el('saveGh').onclick = ()=>{
  gh.save({ owner: el('ghOwner').value, repo: el('ghRepo').value, token: el('ghToken').value });
  alert('已保存。刷新页面后仍然有效。');
};
el('ghOwner').value = gh.cfg.owner;
el('ghRepo').value = gh.cfg.repo;
el('ghToken').value = gh.cfg.token;
(function(){
  const m = location.hash.match(/date=(\d{4}-\d{2}-\d{2})/);
  if(m) el('memDate').value = m[1];
})();
el('submitMemory').onclick = async ()=>{
  try{
    const date = el('memDate').value;
    if(!date) return alert('请选择日期');
    const title = el('memTitle').value.trim();
    const text = el('memText').value;
    const photos = Array.from(el('memPhotos').files);
    const videos = Array.from(el('memVideos').files);
    const dayDir = `content/${date}`;
    const memPath = `${dayDir}/memory.json`;
    log('memLog', `开始提交 ${date} ...`);
    const photoPaths = [];
    for(const f of photos){
      const arr = new Uint8Array(await f.arrayBuffer());
      const path = `${dayDir}/${f.name}`;
      await gh.put(path, arr, `upload photo ${f.name}`);
      photoPaths.push('/' + path);
      log('memLog', `已上传图片：${f.name}`);
    }
    const videoPaths = [];
    for(const f of videos){
      const arr = new Uint8Array(await f.arrayBuffer());
      const path = `${dayDir}/${f.name}`;
      await gh.put(path, arr, `upload video ${f.name}`);
      videoPaths.push('/' + path);
      log('memLog', `已上传视频：${f.name}`);
    }
    const memObj = {
      date, title, text,
      photos: photoPaths,
      videos: videoPaths,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await gh.put(memPath, toBytes(JSON.stringify(memObj, null, 2)), `update ${memPath}`);
    log('memLog', `已写入 ${memPath}`);
    const idxPath = `content/memories.json`;
    let idx = await gh.get(idxPath);
    let idxObj = { version: 1, entries: [] };
    if(idx && idx.content){
      const decoded = atob(idx.content);
      try{ idxObj = JSON.parse(decoded); }catch(e){}
    }
    const existing = idxObj.entries.find(e => e.date === date);
    const entry = { date, path: '/' + memPath, photos: photoPaths };
    if(existing){
      existing.path = entry.path;
      existing.photos = entry.photos;
    }else{
      idxObj.entries.push(entry);
      idxObj.entries.sort((a,b)=> a.date.localeCompare(b.date));
    }
    await gh.put(idxPath, toBytes(JSON.stringify(idxObj, null, 2)), `update ${idxPath}`);
    log('memLog', `已更新 ${idxPath}`);
    alert('提交完成！刷新日历/照片墙即可看到。');
  }catch(e){
    console.error(e);
    log('memLog', '错误：' + e.message);
    alert('出错了，请查看日志区域（回忆管理）。');
  }
};
el('submitMusic').onclick = async ()=>{
  try{
    const file = el('musicFile').files[0];
    if(!file) return alert('请选择音频文件');
    const title = el('musicTitle').value.trim() || file.name;
    const arr = new Uint8Array(await file.arrayBuffer());
    const path = `music/${file.name}`;
    await gh.put(path, arr, `upload audio ${file.name}`);
    log('musicLog', `已上传音频：${file.name}`);
    const plistPath = `music/playlist.json`;
    let obj = { tracks: [] };
    const existed = await gh.get(plistPath);
    if(existed && existed.content){
      const decoded = atob(existed.content);
      try{ obj = JSON.parse(decoded); }catch(e){}
    }
    obj.tracks = obj.tracks || [];
    const url = '/' + path;
    const found = obj.tracks.find(t => t.file === url);
    if(found){ found.title = title; } else { obj.tracks.push({ title, file: url }); }
    await gh.put(plistPath, toBytes(JSON.stringify(obj, null, 2)), `update ${plistPath}`);
    log('musicLog', `已更新播放列表：playlist.json`);
    alert('已添加到播放列表！');
  }catch(e){
    console.error(e);
    log('musicLog', '错误：' + e.message);
    alert('出错了，请查看日志区域（音乐管理）。');
  }
};
