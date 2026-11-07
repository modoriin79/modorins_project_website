// Visitor counter: records the visit with GoatCounter and shows TODAY / TOTAL in the footer.
// Turned on by setting analytics.goatcounter in content.js. GoatCounter caches counts for up to
// a few hours, so the numbers update with a delay.
(() => {
  const code = ((window.siteContent || {}).analytics || {}).goatcounter;
  const box = document.querySelector('.visitor-counter');
  if (!box || !code || !/^[a-z0-9-]+$/i.test(code)) return;

  const base = `https://${code}.goatcounter.com`;

  // Record this page view (count.js skips localhost on its own).
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = `${base}/count`;
  document.head.append(s);

  // "Today" in Korean time, as YYYY-MM-DD.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  const fetchCount = query =>
    fetch(`${base}/counter/TOTAL.json${query}`)
      .then(r => (r.status === 404 ? { count: '0' } : r.ok ? r.json() : Promise.reject(r.status)))
      .then(d => String(d.count).replace(/\s/g, ','));

  const todayEl = box.querySelector('[data-count="today"]');
  const totalEl = box.querySelector('[data-count="total"]');
  const note = box.querySelector('small');

  Promise.all([fetchCount(`?start=${today}`), fetchCount('')])
    .then(([t, all]) => {
      todayEl.textContent = t;
      totalEl.textContent = all;
      note.textContent = 'visitors';
      box.setAttribute('aria-label', `오늘 방문 ${t}, 전체 방문 ${all}`);
      box.classList.add('is-live');
    })
    .catch(() => { note.textContent = '집계 불러오기 실패'; });
})();
