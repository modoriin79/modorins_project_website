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
    const detail = document.createElement('button'); detail.type='button'; detail.className='detail-button'; detail.textContent='프로젝트 상세 ↗';
    detail.addEventListener('click',()=>openProject(p,visual));
    info.append(tag,title,desc,detail,link);card.append(visual,info);list.append(card);
  });
}
render();
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});render(button.dataset.filter);
}));
document.querySelector('#year').textContent=new Date().getFullYear();

const dialog = document.querySelector('#project-detail');
function openProject(project, visual) {
 const content=document.querySelector('#detail-content'); content.replaceChildren();
 const label=document.createElement('p');label.className='index';label.textContent=project.subtitle;
 const heading=document.createElement('h2');heading.id='detail-title';heading.textContent=project.title;
 const figure=document.createElement('figure');figure.append(visual.cloneNode(true));
 const caption=document.createElement('figcaption');caption.textContent='인터페이스 콘셉트 · 실제 서비스 스크린샷은 추후 추가 예정';figure.append(caption);
 const layout=document.createElement('div');layout.className='detail-columns';
 const overview=document.createElement('section');const oh=document.createElement('h3');oh.textContent='Overview';const description=document.createElement('p');description.textContent=project.description;overview.append(oh,description);
 const technical=document.createElement('section');const th=document.createElement('h3');th.textContent='Technical notes';const note=document.createElement('p');note.textContent='기술 스택, 구현 과정, 담당 역할은 확인된 정보를 바탕으로 추가할 예정입니다.';technical.append(th,note);
 if(project.url && /^https?:\/\//.test(project.url)){const link=document.createElement('a');link.href=project.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='배포된 웹사이트 열기 ↗';technical.append(link);}
 layout.append(overview,technical);content.append(label,heading,figure,layout);dialog.showModal();
}
document.querySelector('#close-detail').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
