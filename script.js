const list = document.querySelector('#project-list');
function render(filter = 'all') {
  list.replaceChildren();
  window.projectData.filter(p => filter === 'all' || p.category === filter).forEach(p => {
    const card = document.createElement('article'); card.className = 'project';
    const visual = document.createElement('div'); visual.className = `project-visual ${p.visual}`;
    visual.setAttribute('aria-hidden','true');
    visual.innerHTML = p.visual === 'habit' ? '<div class="mock habit-mock"><div class="mock-top">Daily rhythm <span>✳</span></div><small>A LITTLE BETTER, EVERY DAY.</small><div class="habit-grid">'+Array.from({length:28},(_,i)=>`<i class="${[2,6,10,17,23,27].includes(i)?'':'done'}"></i>`).join('')+'</div><div class="mock-bottom">작은 습관, 큰 변화 <b>↗</b></div></div>' : '<div class="mock planner-mock"><div class="mock-top">My weekly plan <span>↗</span></div><small>MAKE ROOM FOR WHAT MATTERS.</small><div class="week"><div>MON<i></i><i></i></div><div>TUE<i></i></div><div>WED<i></i><i></i></div><div>THU<i></i></div><div>FRI<i></i><i></i></div></div></div>';
    const info = document.createElement('div'); info.className = 'project-info';
    const tag = document.createElement('span'); tag.className='project-tag'; tag.textContent=p.tag;
    const title = document.createElement('h3'); title.textContent=p.title;
    const desc = document.createElement('p'); desc.textContent=p.description;
    const link = document.createElement(p.url ? 'a' : 'span'); link.className='project-link';
    if(p.url && /^https?:\/\//.test(p.url)){link.href=p.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='웹사이트 방문 ↗';}else{link.textContent='배포 링크 준비 중';}
    info.append(tag,title,desc,link);card.append(visual,info);list.append(card);
  });
}
render();
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});render(button.dataset.filter);
}));
document.querySelector('#year').textContent=new Date().getFullYear();
try{let visits=Number(localStorage.getItem('modorin-visits'))||0;if(!sessionStorage.getItem('modorin-visited')){visits++;localStorage.setItem('modorin-visits',String(visits));sessionStorage.setItem('modorin-visited','1');}document.querySelector('#visits').textContent=`이 브라우저 방문 ${visits.toLocaleString()}`;}catch{document.querySelector('#visits').textContent='방문 집계 사용 불가';}
