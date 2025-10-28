
(async function(){
  const cal = $('#calendar');
  const monthLabel = $('#monthLabel');
  const prevBtn = $('#prevMonth');
  const nextBtn = $('#nextMonth');
  const modal = $('#memoryModal');
  const closeModal = $('#closeModal');
  const memContainer = $('#memoryContainer');
  const editInAdmin = $('#editInAdmin');

  const index = await loadMemIndex();
  const memMap = new Map(index.entries.map(e => [e.date, e]));

  let view = new Date();
  view.setDate(1);

  function daysInMonth(y, m){ return new Date(y, m+1, 0).getDate(); }

  function render(){
    const y = view.getFullYear();
    const m = view.getMonth();
    monthLabel.textContent = `${y} 年 ${m+1} 月`;
    cal.innerHTML = '';

    const firstWeekday = new Date(y, m, 1).getDay();
    const totalDays = daysInMonth(y,m);

    for(let i=0;i<firstWeekday;i++){
      const blank = document.createElement('div');
      cal.appendChild(blank);
    }
    for(let d=1; d<=totalDays; d++){
      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      cell.dataset.date = ymdFromParts(y,m+1,d);
      const label = document.createElement('div');
      label.className = 'date'; label.textContent = d;
      cell.appendChild(label);
      const key = cell.dataset.date;
      if(memMap.has(key)){
        const heart = document.createElement('div');
        heart.className = 'heart'; heart.textContent = '❤';
        cell.appendChild(heart);
      }
      cell.addEventListener('click', () => openMemory(key));
      cal.appendChild(cell);
    }
  }

  async function openMemory(dateStr){
    editInAdmin.href = `/admin.html#date=${dateStr}`;
    memContainer.innerHTML = `<div class="memory"><h3>${dateStr}</h3><p class="muted">加载中...</p></div>`;
    modal.classList.remove('hidden');
    try{
      const entry = memMap.get(dateStr);
      if(!entry){ memContainer.innerHTML = `<div class="memory"><h3>${dateStr}</h3><p>这一天没有记录。</p></div>`; return; }
      const mem = await fetchJSON(entry.path);
      const htmlParts = [];
      htmlParts.push(`<div class="memory"><h3>${mem.title || '这一天的回忆'}</h3>`);
      if(mem.text){ htmlParts.push(`<p>${mem.text.replace(/</g,'&lt;')}</p>`); }
      const media = [];
      (mem.photos || []).forEach(p => media.push(`<img src="${p}" alt="photo">`));
      (mem.videos || []).forEach(v => media.push(`<video src="${v}" controls></video>`));
      if(media.length){ htmlParts.push(`<div class="media">${media.join('')}</div>`); }
      htmlParts.push(`</div>`);
      memContainer.innerHTML = htmlParts.join('');
    }catch(e){
      memContainer.innerHTML = `<div class="memory"><h3>${dateStr}</h3><p>加载失败：${e.message}</p></div>`;
    }
  }

  prevBtn.addEventListener('click', ()=>{ view.setMonth(view.getMonth()-1); render(); });
  nextBtn.addEventListener('click', ()=>{ view.setMonth(view.getMonth()+1); render(); });
  closeModal.addEventListener('click', ()=> modal.classList.add('hidden'));
  render();
})();
