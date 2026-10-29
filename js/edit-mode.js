(() => {
  const key='site-overrides', S=window.SITE, pageId=window.COLLECTION_PAGE_ID;
  const parse=value=>{try{return JSON.parse(value||'{}')}catch{return {}}};
  const local=parse(localStorage.getItem(key));
  const merge=(a,b)=>{for(const [k,v] of Object.entries(b||{})){a[k]=v&&typeof v==='object'&&!Array.isArray(v)?merge(a[k]&&typeof a[k]==='object'?a[k]:{},v):v}return a};
  const overrides=merge({},local);
  function apply(data, refresh=true) {
    if(!S) {
      const page=data.pages&&data.pages[pageId];
      if(page&&window.COLLECTION_PAGE_COPY){
        Object.assign(window.COLLECTION_PAGE_COPY,page);
        if(page.title&&document.querySelector('#page-title'))document.querySelector('#page-title').textContent=page.title;
        if(page.sub&&document.querySelector('#page-sub'))document.querySelector('#page-sub').textContent=page.sub;
        if(page.what&&document.querySelector('#what-copy'))document.querySelector('#what-copy').textContent=page.what;
        if(page.meditation&&document.querySelector('#clay-meditation p'))document.querySelector('#clay-meditation p').textContent=page.meditation;
        if(page.meditation2&&document.querySelector('#clay-meditation p:nth-of-type(2)'))document.querySelector('#clay-meditation p:nth-of-type(2)').textContent=page.meditation2;
      }
      if(data.accent)document.documentElement.style.setProperty('--ox',data.accent);
      if(refresh)window.dispatchEvent(new CustomEvent('site-overrides-applied',{detail:data}));
      return;
    }
    for(const p of S.points){const o=data.points&&data.points[p.id];if(o)Object.assign(p,o)}
    if(data.person)Object.assign(S.person,data.person);
    if(data.profile&&S.profile)merge(S.profile,data.profile);
    const tagline=document.querySelector('#tagline');
    if(tagline&&data.person?.line)tagline.textContent=data.person.line;
    const mail=document.querySelector('#mailLink');
    if(mail&&data.person?.email)mail.href='mailto:'+data.person.email;
    if(data.about){if(Array.isArray(data.about))S.about=data.about;else{S.about[0]=data.about.line??S.about[0];S.about[1]=data.about.small??S.about[1];if(data.about.name)S.person.name=data.about.name}}
    if(data.person?.quads)for(const [q,value]of Object.entries(data.person.quads))if(S.quads[q])S.quads[q].name=value;
    if(data.cases&&window.PORTFOLIO_DATA?.short)for(const [id,fields]of Object.entries(data.cases)){const target=window.PORTFOLIO_DATA.short[id];if(!target)continue;for(const [path,value]of Object.entries(fields)){const parts=path.split('.');let node=target;for(const part of parts.slice(0,-1))node=node[part]??=(/^\d+$/.test(parts[parts.length-1])?[]:{});node[parts.at(-1)]=value}}
    if(data.accent)document.documentElement.style.setProperty('--ox',data.accent);
    if(refresh)window.refreshPortfolio?.();
  }
  apply(overrides,false);
  fetch('data/overrides.json').then(r=>r.ok?r.json():{}).catch(()=>({})).then(remote=>{
    merge(overrides,remote);merge(overrides,local);apply(overrides,true);
  });
  const save=()=>localStorage.setItem(key,JSON.stringify(overrides,null,2));
  let editing=false,toolbar=null,drag=null;
  // No corner chip for local edits: reset lives in the design panel and the edit toolbar.
  const chip=()=>{document.querySelector('.local-edits')?.remove();return;if(!localStorage.getItem(key))return;const n=document.createElement('button');n.className='local-edits';n.textContent='local edits · reset';n.onclick=()=>{localStorage.removeItem(key);location.reload()};document.body.append(n)};
  function ensureStyles(){if(document.querySelector('#edit-mode-css'))return;const s=document.createElement('style');s.id='edit-mode-css';s.textContent=`
  .edit-toolbar{position:fixed;z-index:1000;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:11px;padding:9px 13px;border:1px solid rgba(25,25,21,.14);border-radius:9px;background:#f2efe7;color:#191915;box-shadow:0 8px 26px #19191520;font:12px 'Instrument Sans',sans-serif;white-space:nowrap}
  .edit-toolbar button{border:0;background:none;color:inherit;font:inherit;cursor:pointer}.edit-toolbar button:hover{text-decoration:underline}.edit-toolbar input{width:24px;height:24px;border:0;background:transparent;padding:0;cursor:pointer}
  .edit-outline{outline:1px dashed var(--ox)!important;outline-offset:3px;cursor:text!important}
  .local-edits{position:fixed;z-index:999;right:14px;bottom:14px;border:0;border-radius:99px;padding:7px 10px;background:#f2efe7;color:#6b2a2f;box-shadow:0 3px 15px #19191518;font:11px 'Geist Mono',monospace;cursor:pointer}
  body.editing .pt{cursor:move}
  @media(max-width:760px){.edit-toolbar{bottom:8px;max-width:96vw;gap:6px;padding:8px;font-size:10px}}
  `;document.head.append(s)}
  function addToolbar(){if(toolbar)return;ensureStyles();toolbar=document.createElement('div');toolbar.className='edit-toolbar';toolbar.innerHTML='<span>editing · drag dots, click text to rewrite</span><input type="color" aria-label="Accent colour"><button data-action="save">save</button><button data-action="download">download</button><button data-action="reset">reset</button><button data-action="done">done</button>';toolbar.querySelector('input').value=overrides.accent||getComputedStyle(document.documentElement).getPropertyValue('--ox').trim()||'#6b2a2f';toolbar.addEventListener('click',e=>{const action=e.target.dataset.action;if(action==='save'){save();chip()}if(action==='reset'){localStorage.removeItem(key);location.reload()}if(action==='download'){save();const blob=new Blob([JSON.stringify(overrides,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='overrides.json';a.click();URL.revokeObjectURL(a.href)}if(action==='done')exit()});toolbar.querySelector('input').addEventListener('input',e=>{overrides.accent=e.target.value;document.documentElement.style.setProperty('--ox',e.target.value)});document.body.append(toolbar)}
  function enter(){if(editing)return;editing=true;document.body.classList.add('editing');addToolbar()}
  function exit(){editing=false;document.body.classList.remove('editing');toolbar?.remove();toolbar=null;history.replaceState(null,'',location.pathname+location.search.replace(/([?&])edit(?:=[^&]*)?(&|$)/,(_,a,b)=>a==='?'&&b?'?':b?'&':'' ).replace(/[?&]$/,''));chip()}
  function store(path,value){let node=overrides;for(const part of path.slice(0,-1))node=node[part]??={};node[path.at(-1)]=value}
  function editable(target){
    if(S&&target.closest('[data-edit]')){const el=target.closest('[data-edit]');return {el,path:el.dataset.edit.split('.')};}
    if(target.closest('#tagline'))return {el:target.closest('#tagline'),path:['person','line']};
    if(S&&target.closest('.pt .point-title')){const p=target.closest('.pt')._p;return p&&{el:target.closest('.point-title'),path:['points',p.id,'title']};}
    if(S&&target.closest('.pt-row .rt')){const row=target.closest('.pt-row');return row._p&&{el:target.closest('.rt'),path:['points',row._p.id,'title']};}
    if(S&&target.closest('[data-point-id][data-point-field]')){const el=target.closest('[data-point-id][data-point-field]');return {el,path:['points',el.dataset.pointId,el.dataset.pointField]};}
    if(S&&target.closest('.case-head .s-title'))return {el:target.closest('.s-title'),path:['points',document.querySelector('#sheet')?._p?.id,'title']};
    if(S&&target.closest('.case-head .case-line'))return {el:target.closest('.case-line'),path:['points',document.querySelector('#sheet')?._p?.id,'line']};
    if(S&&target.closest('[data-about-field]')){const el=target.closest('[data-about-field]');return {el,path:['about',el.dataset.aboutField]};}
    if(S&&target.closest('.quad-name')){const q=target.closest('.qlabel').className.match(/q-(tl|tr|bl|br)/)?.[1];return q&&{el:target.closest('.quad-name'),path:['person','quads',q]};}
    if(S&&target.closest('[data-case-id][data-case-path]')){const el=target.closest('[data-case-id][data-case-path]');return {el,path:['cases',el.dataset.caseId,el.dataset.casePath]};}
    if(!S&&target.closest('#what-copy'))return {el:target.closest('#what-copy'),path:['pages',pageId,'what']};
    if(!S&&target.closest('#page-title'))return {el:target.closest('#page-title'),path:['pages',pageId,'title']};
    if(!S&&target.closest('#page-sub'))return {el:target.closest('#page-sub'),path:['pages',pageId,'sub']};
    if(!S&&target.closest('#clay-meditation p')){const el=target.closest('#clay-meditation p');return {el,path:['pages',pageId,el===document.querySelector('#clay-meditation p')?'meditation':'meditation2']};}
    return null;
  }
  document.addEventListener('click',e=>{
    if(!editing)return;
    const pt=e.target.closest('#plane .pt');if(pt){e.preventDefault();e.stopImmediatePropagation();return}
    if(toolbar?.contains(e.target))return;
    const field=editable(e.target);if(!field||!field.path.slice(1).every(Boolean))return;
    e.preventDefault();const el=field.el;el.contentEditable='true';el.classList.add('edit-outline');el.focus();
    const end=()=>{el.contentEditable='false';el.classList.remove('edit-outline');const value=el.textContent.trim();store(field.path,value);if(field.path[0]==='points'&&S){const p=S.points.find(x=>x.id===field.path[1]);if(p)p[field.path[2]]=value}if(field.path[0]==='person'&&S){if(field.path[1]==='line')S.person.line=value;if(field.path[1]==='quads')S.quads[field.path[2]].name=value}if(field.path[0]==='about'&&S){if(field.path[1]==='line')S.about[0]=value;else if(field.path[1]==='small')S.about[1]=value;else if(field.path[1]==='name')S.person.name=value}if(field.path[0]==='profile'&&S){let n=S;for(const k of field.path.slice(0,-1))n=n?.[k];if(n)n[field.path.at(-1)]=value}if(field.path[0]==='pages'&&window.COLLECTION_PAGE_COPY)window.COLLECTION_PAGE_COPY[field.path[2]]=value;if(field.path[0]==='cases'&&window.PORTFOLIO_DATA?.short){const parts=field.path[2].split('.');let node=window.PORTFOLIO_DATA.short[field.path[1]];for(const part of parts.slice(0,-1))node=node?.[part];if(node)node[parts.at(-1)]=value}save();};
    el.addEventListener('blur',end,{once:true});el.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();el.blur()}if(ev.key==='Escape'){ev.preventDefault();el.blur()}},{once:true});
  },true);
  document.addEventListener('pointerdown',e=>{if(!editing||!S)return;const el=e.target.closest('#plane .pt');if(!el)return;e.preventDefault();e.stopImmediatePropagation();drag={el,startX:e.clientX,startY:e.clientY,left:parseFloat(el.style.left)||e.clientX,top:parseFloat(el.style.top)||e.clientY,moved:false};el.setPointerCapture?.(e.pointerId)},true);
  document.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>3)drag.moved=true;if(!drag.moved)return;drag.el.style.left=drag.left+e.clientX-drag.startX+'px';drag.el.style.top=drag.top+e.clientY-drag.startY+'px'},true);
  document.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;if(!d.moved)return;const p=d.el._p,sx=innerWidth/2-Math.max(150,innerWidth*.14)-60,sy=innerHeight/2-Math.max(84,innerHeight*.12);p.x=(e.clientX-innerWidth/2)/sx;p.y=-(e.clientY-innerHeight/2)/sy;store(['points',p.id,'x'],p.x);store(['points',p.id,'y'],p.y);save();window.refreshPortfolio?.()},true);
  document.addEventListener('keydown',e=>{if(e.shiftKey&&e.key.toLowerCase()==='e'){e.preventDefault();editing?exit():enter()}else if(e.key==='Escape'&&editing&&!e.target?.isContentEditable)exit()});
  window.PORTFOLIO_READY?.then(()=>apply(overrides,false));
  window.enterPortfolioEdit=enter;
  if(new URLSearchParams(location.search).has('edit')){localStorage.setItem('site-editor','1');window.dispatchEvent(new Event('site-editor-enabled'));enter()}else chip();
  window.addEventListener('site-overrides-applied',e=>apply(e.detail,false));
})();
