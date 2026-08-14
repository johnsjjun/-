(function () {
  const data = generateDailyFortune(new Date());

  document.getElementById('dateLine').textContent = data.todayStr + ' (' + weekdayKo(new Date()) + ')';
  document.getElementById('iljuBranch').textContent = data.todayBranch;

  const tabbar = document.getElementById('tabbar');
  const cardsEl = document.getElementById('cards');
  const jumpSelect = document.getElementById('jumpSelect');

  function weekdayKo(d) {
    const w = ['일', '월', '화', '수', '목', '금', '토'];
    return w[d.getDay()] + '요일';
  }

  // 현재 연도 기준 만 나이 대략 추정 → 사용자가 선택하면 그 띠 카드로 스크롤
  data.results.forEach((item, idx) => {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'tabbtn' + (idx === 0 ? ' active' : '');
    tabBtn.textContent = item.ttiName.split(' ')[0] + ' ' + item.ttiName.split(' ')[1];
    tabBtn.dataset.idx = idx;
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.tabbtn').forEach(b => b.classList.remove('active'));
      tabBtn.classList.add('active');
      document.getElementById('card-' + idx).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    tabbar.appendChild(tabBtn);

    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = item.ttiName;
    jumpSelect.appendChild(opt);
  });

  jumpSelect.addEventListener('change', (e) => {
    const idx = e.target.value;
    document.getElementById('card-' + idx).scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.tabbtn').forEach(b => b.classList.toggle('active', b.dataset.idx === idx));
  });

  data.results.forEach((item, idx) => {
    const card = document.createElement('section');
    card.className = 'card';
    card.id = 'card-' + idx;

    let html = '';
    html += `<div class="card-head"><span class="tti">${item.ttiName}</span><span class="starname">${item.info.name}</span></div>`;
    html += `<p class="power">${item.info.power}</p>`;
    html += `<p class="summary">${item.info.summary}</p>`;

    html += `<div class="row"><span class="ico">💰</span><span class="lbl">재물운</span><span class="val">${item.info.money}</span></div>`;
    html += `<div class="row"><span class="ico">💖</span><span class="lbl">애정운</span><span class="val">${item.info.love}</span></div>`;
    html += `<div class="row"><span class="ico">💼</span><span class="lbl">직장운</span><span class="val">${item.info.work}</span></div>`;

    if (item.specialNote) {
      html += `<div class="special">⚡ 일진특보: ${item.specialNote}</div>`;
    }

    html += `<div class="meta">
      <span class="chip">🍀 방위 <b>${item.info.dir}</b></span>
      <span class="chip">🔢 숫자 <b>${item.info.num}</b></span>
      <span class="chip">🎁 행운템 <b>${item.info.item}</b></span>
    </div>`;
    html += `<div class="caution">⚠️ ${item.info.caution}</div>`;

    if (item.yearLines && item.yearLines.length) {
      html += `<details class="years"><summary>🎂 생년별 총운 보기 (${item.yearLines.length}개 연도)</summary><div class="yearlist">`;
      item.yearLines.forEach(yl => {
        html += `<div class="yearline"><span class="yy">${yl.shortYear}년생</span><span>${yl.line}</span></div>`;
      });
      html += `</div></details>`;
    }

    card.innerHTML = html;
    cardsEl.appendChild(card);
  });

  // 스크롤에 따라 탭 하이라이트 동기화
  const cardEls = data.results.map((_, idx) => document.getElementById('card-' + idx));
  const tabBtns = Array.from(document.querySelectorAll('.tabbtn'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = entry.target.id.split('-')[1];
        tabBtns.forEach(b => b.classList.toggle('active', b.dataset.idx === idx));
        const btn = tabBtns.find(b => b.dataset.idx === idx);
        if (btn) btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
  cardEls.forEach(el => io.observe(el));

  document.getElementById('scrollTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // PWA: 서비스워커 등록(있으면)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
