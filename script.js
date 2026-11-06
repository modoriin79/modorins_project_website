// Renders the page from content.js. Edit content there, not here.
const content = window.siteContent || { categories: {}, projects: [], awards: [], studies: [] };
const isUrl = v => typeof v === 'string' && /^(https?:\/\/|mailto:)/.test(v);
const pad = n => String(n).padStart(2, '0');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}
function externalLink(href, text, className) {
  const a = el('a', className, text);
  a.href = href;
  if (!href.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  return a;
}

/* ---------- Projects ---------- */
const list = document.querySelector('#project-list');
const projects = content.projects || [];

function projectVisual(p) {
  const visual = el('div', 'project-visual');
  visual.setAttribute('aria-hidden', 'true');
  if (p.image) {
    const img = document.createElement('img');
    img.src = p.image; img.alt = ''; img.loading = 'lazy';
    visual.append(img);
  } else {
    visual.classList.add('is-empty');
    visual.append(el('span', 'visual-placeholder', p.subtitle || p.title));
  }
  return visual;
}

function renderProjects(filter = 'all') {
  list.replaceChildren();
  const shown = projects.filter(p => filter === 'all' || p.category === filter);
  if (!shown.length) { list.append(el('p', 'empty-state', '이 분류에는 아직 프로젝트가 없습니다.')); return; }
  shown.forEach(p => {
    const card = el('article', 'project');
    const visual = projectVisual(p);
    const hasUrl = isUrl(p.url);

    const windowFrame = el('div', 'notepad-window');
    windowFrame.addEventListener('click', () => openProject(p, visual));
    const bar = el('div', 'notepad-title'); bar.setAttribute('aria-hidden', 'true');
    const controls = el('span', 'window-controls'); controls.innerHTML = '<i></i><i></i><i></i>';
    bar.append(el('span', '', p.subtitle || p.title), controls);
    const address = el('div', 'notepad-menu', hasUrl ? p.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '배포 준비 중');
    address.setAttribute('aria-hidden', 'true');
    windowFrame.append(bar, address, visual);

    const info = el('div', 'project-info');
    const actions = el('div', 'project-actions');
    if (hasUrl) actions.append(externalLink(p.url, '웹사이트 방문 ↗', 'project-link'));
    else actions.append(el('span', 'project-link is-disabled', '배포 링크 준비 중'));
    const detail = el('button', 'detail-button', '상세 보기'); detail.type = 'button';
    detail.addEventListener('click', () => openProject(p, visual));
    actions.append(detail);
    info.append(el('span', 'project-tag', p.tag), el('h3', '', p.title), el('p', '', p.description), actions);

    card.append(windowFrame, info);
    list.append(card);
  });
}

function renderFilters() {
  const group = document.querySelector('.filters');
  group.replaceChildren();
  const used = Object.entries(content.categories || {}).filter(([key]) => projects.some(p => p.category === key));
  const make = (key, label, count) => {
    const b = el('button', key === 'all' ? 'active' : '', label);
    b.dataset.filter = key; b.type = 'button';
    b.setAttribute('aria-pressed', String(key === 'all'));
    if (count !== undefined) b.append(' ', el('span', '', count));
    b.addEventListener('click', () => {
      group.querySelectorAll('button').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      renderProjects(key);
    });
    group.append(b);
  };
  make('all', '전체', projects.length);
  used.forEach(([key, label]) => make(key, label));
  document.querySelector('#projects .count').textContent = `PROJECTS — ${pad(projects.length)}`;
}

/* ---------- Project detail dialog ---------- */
const dialog = document.querySelector('#project-detail');
function openProject(p, visual) {
  const box = document.querySelector('#detail-content'); box.replaceChildren();
  const heading = el('h2', '', p.title); heading.id = 'detail-title';
  const figure = document.createElement('figure');
  figure.append(visual.cloneNode(true), el('figcaption', '', p.image ? `${p.title} · 실제 서비스 화면` : '스크린샷 준비 중'));

  const columns = el('div', 'detail-columns');
  const overview = el('section');
  overview.append(el('h3', '', 'Overview'), el('p', '', p.description));
  if (p.notes) overview.append(el('p', '', p.notes));

  const tech = el('section');
  tech.append(el('h3', '', 'Technical notes'));
  if (p.stack || p.role) {
    const dl = el('dl', 'detail-meta');
    if (p.stack) dl.append(el('dt', '', '기술 스택'), el('dd', '', p.stack));
    if (p.role) dl.append(el('dt', '', '역할'), el('dd', '', p.role));
    tech.append(dl);
  } else {
    tech.append(el('p', '', '기술 스택과 담당 역할은 추후 추가할 예정입니다.'));
  }
  const links = el('div', 'detail-links');
  if (isUrl(p.url)) links.append(externalLink(p.url, '배포된 웹사이트 열기 ↗'));
  if (isUrl(p.github)) links.append(externalLink(p.github, '소스 코드 (GitHub) ↗'));
  tech.append(links);

  columns.append(overview, tech);
  box.append(el('p', 'index', p.subtitle), heading, figure, columns);
  dialog.showModal();
}
document.querySelector('#close-detail').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => {
  if (e.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
});

/* ---------- Awards ---------- */
function renderAwards() {
  const wrap = document.querySelector('#award-list');
  const awards = content.awards || [];
  wrap.replaceChildren();
  if (!awards.length) { wrap.append(el('p', 'empty-state', '수상 기록이 준비 중입니다.')); return; }
  awards.forEach(a => {
    const row = el('details', 'award-row');
    const summary = el('summary');
    const head = el('div');
    if (a.prize) head.append(el('span', 'sample-label', a.prize));
    head.append(el('h3', '', a.title));
    const plus = el('span', 'expand', '+'); plus.setAttribute('aria-hidden', 'true');
    summary.append(el('time', '', a.date), head, plus);

    const detail = el('div', 'award-detail');
    const dl = document.createElement('dl');
    [['참여 프로젝트', a.project], ['역할', a.role], ['기록', a.note]].forEach(([k, v]) => { if (v) dl.append(el('dt', '', k), el('dd', '', v)); });
    if (dl.children.length) detail.append(dl);
    if (isUrl(a.link)) detail.append(externalLink(a.link, '관련 링크 ↗', 'award-link'));
    if (!detail.children.length) detail.append(el('p', '', '세부 내용은 추후 추가할 예정입니다.'));

    row.append(summary, detail);
    wrap.append(row);
  });
}

/* ---------- Studies ---------- */
function renderStudies() {
  const grid = document.querySelector('.study-grid');
  grid.replaceChildren();
  (content.studies || []).forEach((s, i) => {
    const notes = s.notes || [];
    const item = el('details', 'study');
    const summary = el('summary');
    const folder = el('span', 'folder-icon'); folder.setAttribute('aria-hidden', 'true'); folder.append(el('span'));
    summary.append(el('span', '', pad(i + 1)), el('h3', '', s.title), folder,
      el('span', 'study-count', notes.length ? `기록 ${notes.length}개 +` : '기록 준비 중 +'));
    item.append(summary);

    if (!notes.length) {
      item.append(el('p', '', `${s.description || s.title}가 이곳에 쌓입니다. 아직 게시된 기록이 없습니다.`));
    } else {
      const ul = el('ul', 'study-notes');
      notes.forEach(n => {
        const li = el('li');
        if (n.date) li.append(el('time', '', n.date));
        li.append(isUrl(n.link) ? externalLink(n.link, `${n.title} ↗`, 'study-note-title') : el('span', 'study-note-title', n.title));
        if (n.summary) li.append(el('p', '', n.summary));
        ul.append(li);
      });
      item.append(ul);
    }
    grid.append(item);
  });
}

renderFilters();
renderProjects();
renderAwards();
renderStudies();
document.querySelector('#year').textContent = new Date().getFullYear();
