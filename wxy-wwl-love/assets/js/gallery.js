
(async function(){
  const grid = document.getElementById('photoGrid');
  const index = await loadMemIndex();
  const photos = [];
  index.entries.forEach(e => (e.photos || []).forEach(src => photos.push({ src, date: e.date, memPath: e.path })));

  // Build initial grid cells
  const CELL_COUNT = Math.min(photos.length, 12) || 8; // up to 12 visible
  for(let i=0;i<CELL_COUNT;i++){
    const cell = document.createElement('div');
    cell.className = 'cell';
    const img = document.createElement('img');
    cell.appendChild(img);
    grid.appendChild(cell);
  }

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
  let pool = shuffle(photos.slice());
  const shown = new Set();

  async function swapOne(cell){
    if(pool.length===0){
      pool = shuffle(photos.filter(p => !shown.has(p.src)));
      if(pool.length===0){ shown.clear(); pool = shuffle(photos.slice()); }
    }
    const item = pool.pop();
    shown.add(item.src);

    const img = cell.querySelector('img');
    img.classList.remove('show');
    await new Promise(r => setTimeout(r, 1000));
    img.src = item.src;
    img.onclick = () => { window.location.href = `/calendar.html#date=${item.date}`; };
    img.onload = () => img.classList.add('show');
  }

  const cells = Array.from(grid.querySelectorAll('.cell'));
  for(const cell of cells){ await swapOne(cell); }

  setInterval(async ()=>{
    if(cells.length===0) return;
    const count = Math.max(1, Math.floor(cells.length/3));
    const picks = shuffle(cells.slice()).slice(0, count);
    for(const c of picks){ swapOne(c); }
  }, 5000);
})();
