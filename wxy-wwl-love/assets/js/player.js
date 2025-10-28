
(async function(){
  const audio = document.getElementById('audio');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const nowPlaying = document.getElementById('nowPlaying');
  const playlistEl = document.getElementById('playlist');
  const seekBar = document.getElementById('seekBar');
  const curEl = document.getElementById('currentTime');
  const durEl = document.getElementById('duration');

  let list = [];
  try{
    const data = await fetchJSON('/music/playlist.json');
    list = data.tracks || [];
  }catch(e){
    console.warn('No playlist.json, using empty list');
  }

  let i = 0;
  function fmt(t){ const m=Math.floor(t/60), s=Math.floor(t%60); return `${m}:${(s<10?'0':'')+s}`; }
  function renderList(){
    playlistEl.innerHTML = '';
    list.forEach((t, idx) => {
      const li = document.createElement('li');
      li.textContent = t.title || t.file;
      li.className = idx===i ? 'active' : '';
      li.onclick = () => { i = idx; load(); play(); };
      playlistEl.appendChild(li);
    });
  }
  function load(){
    if(list.length===0){
      nowPlaying.textContent = '未播放';
      audio.removeAttribute('src');
      return;
    }
    const t = list[i];
    audio.src = t.file;
    nowPlaying.textContent = '正在播放：' + (t.title || t.file);
    renderList();
  }
  function play(){ audio.play(); }
  function pause(){ audio.pause(); }

  audio.addEventListener('timeupdate', ()=>{
    if(audio.duration){
      seekBar.value = (audio.currentTime / audio.duration) * 100;
      curEl.textContent = fmt(audio.currentTime);
      durEl.textContent = fmt(audio.duration);
    }
  });
  seekBar.addEventListener('input', ()=>{
    if(audio.duration){
      audio.currentTime = (seekBar.value/100) * audio.duration;
    }
  });
  playPauseBtn.addEventListener('click', ()=> audio.paused ? play() : pause());
  prevBtn.addEventListener('click', ()=>{ if(list.length){ i = (i-1+list.length)%list.length; load(); play(); } });
  nextBtn.addEventListener('click', ()=>{ if(list.length){ i = (i+1)%list.length; load(); play(); } });
  audio.addEventListener('ended', ()=> nextBtn.click());

  load();
})();
