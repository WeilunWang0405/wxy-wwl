
(async function(){
  const cal = $('#calendar');
  const monthLabel = $('#monthLabel');
  const prevBtn = $('#prevMonth');
  const nextBtn = $('#nextMonth');
  const modal = $('#memoryModal');
  const closeModal = $('#closeModal');
  const memContainer = $('#memoryContainer');
  const editInAdmin = $('#editInAdmin');

    // 新增：下拉框
  const yearSelect = $('#yearSelect');
  const monthSelect = $('#monthSelect');

  // 用已有回忆范围决定年份区间，若没有则用「当前年±10」
  function getYearRangeFromIndex(index) {
    const years = index.entries
      .map(e => parseInt((e.date || '').slice(0,4), 10))
      .filter(y => Number.isFinite(y));
    const nowY = new Date().getFullYear();
    const minY = years.length ? Math.min(...years) : (nowY - 10);
    const maxY = years.length ? Math.max(...years) : (nowY + 10);
    return [minY, maxY];
  }

  function fillYearOptions(minY, maxY) {
    if (!yearSelect) return;
    yearSelect.innerHTML = '';
    for (let y = minY; y <= maxY; y++) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect.appendChild(opt);
    }
  }

  function fillMonthOptions() {
    if (!monthSelect) return;
    monthSelect.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement('option');
      opt.value = String(m);
      opt.textContent = `${m} 月`;
      monthSelect.appendChild(opt);
    }
  }

  // 统一跳转到某年某月（m: 0-11）
  function gotoYM(y, m) {
    // 始终定位到当月1号，防止 31→2月 溢出
    const yy = parseInt(y, 10);
    const mm = parseInt(m, 10);
    // 使用 new Date(yy, mm, 1) 更稳妥
    view = new Date(yy, mm, 1);
    render();
  }

  
  const index = await loadMemIndex();
  const memMap = new Map(index.entries.map(e => [e.date, e]));

  let view = new Date();
  view.setDate(1);

    // 新增：初始化下拉与监听
  if (yearSelect && monthSelect) {
    const [minY, maxY] = getYearRangeFromIndex(index);
    fillYearOptions(minY, maxY);
    fillMonthOptions();

    yearSelect.addEventListener('change', () => {
      const y = yearSelect.value;
      const m = (monthSelect.value ? parseInt(monthSelect.value,10)-1 : view.getMonth());
      gotoYM(y, m);
    });
    monthSelect.addEventListener('change', () => {
      const y = (yearSelect.value ? parseInt(yearSelect.value,10) : view.getFullYear());
      const m = parseInt(monthSelect.value, 10) - 1;
      gotoYM(y, m);
    });
  }

  
  function daysInMonth(y, m){ return new Date(y, m+1, 0).getDate(); }

  function render(){
    const y = view.getFullYear();
    const m = view.getMonth();
    monthLabel.textContent = `${y} 年 ${m+1} 月`;
    if (yearSelect)  yearSelect.value  = String(y);
    if (monthSelect) monthSelect.value = String(m + 1);
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
