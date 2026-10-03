'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let spatial = [], results = [], paused = reducedMotion.matches, heroVisible = true, heroFrame = 0;
const hero = $('#hero-canvas'), atlasCanvas = $('#atlas-canvas');
let atlasPoints = [], selectedPoint = null;
function fitCanvas(canvas) {
  const {width, height} = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return {ctx, width, height};
}
function extent(rows, col) {const a = rows.map(r => r[col]); return [Math.min(...a), Math.max(...a)];}
function color(t, alpha = 1) {
  t = Math.max(0, Math.min(1, t));
  const stops = [[39,58,89],[75,154,140],[208,251,129]], i = t < .5 ? 0 : 1, f = t < .5 ? t * 2 : (t-.5)*2;
  const c = stops[i].map((v,k) => Math.round(v + (stops[i+1][k]-v)*f));
  return `rgba(${c.join(',')},${alpha})`;
}
let heroRows = [];
function drawHero(time = 0) {
  const {ctx,width:w,height:h} = fitCanvas(hero); if(!w || !h) return;
  ctx.clearRect(0,0,w,h);
  const glow=ctx.createRadialGradient(w*.52,h*.5,0,w*.52,h*.5,w*.5);
  glow.addColorStop(0,'#6a9b231a');glow.addColorStop(1,'#6a9b2300');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  const phase = paused ? 0 : time * .00013;
  const angle = -.24 + Math.sin(phase)*.10, scale = Math.min(w/78,h/90);
  const depth = .8 + Math.cos(phase)*.05;
  const points = heroRows.map(r=>{
    const x=(r[1]-34)*scale, y=(r[2]-63)*scale*.57;
    const z=Math.sin(r[1]*.11+r[2]*.05)*scale*5 + (r[3]+1)*scale*3;
    return {x:w*.52+x*Math.cos(angle)-y*Math.sin(angle), y:h*.53+(x*Math.sin(angle)+y*Math.cos(angle))*depth-z*.68,v:r[3],z};
  }).sort((a,b)=>a.z-b.z);
  for(const p of points){
    const t=Math.max(0,Math.min(1,(p.v+2)/4));
    ctx.beginPath();ctx.arc(p.x,p.y,Math.max(.7,scale*.17),0,Math.PI*2);ctx.fillStyle=color(.32+t*.68,.42+t*.55);ctx.fill();
  }
  ctx.strokeStyle='#84936a30';ctx.lineWidth=1;
  for(const [x,y,dx,dy] of [[18,38,1,1],[w-18,38,-1,1],[18,h-24,1,-1],[w-18,h-24,-1,-1]]){
    ctx.beginPath();ctx.moveTo(x+dx*13,y);ctx.lineTo(x,y);ctx.lineTo(x,y+dy*13);ctx.stroke();
  }
}
function heroLoop(time){heroFrame=0;if(!paused && heroVisible && !document.hidden){drawHero(time);heroFrame=requestAnimationFrame(heroLoop);}}
function resumeHero(){if(!heroFrame&&!paused&&heroVisible&&!document.hidden)heroFrame=requestAnimationFrame(heroLoop);else if(paused)drawHero();}
function updateMotionButton(){const b=$('#motion-toggle');b.textContent=paused?'▶':'Ⅱ';b.setAttribute('aria-label',paused?'Play animation':'Pause animation');}
$('#motion-toggle').addEventListener('click',()=>{paused=!paused;updateMotionButton();resumeHero();});
reducedMotion.addEventListener('change',e=>{paused=e.matches;updateMotionButton();resumeHero();});
new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;resumeHero();}).observe(hero);
document.addEventListener('visibilitychange',resumeHero);updateMotionButton();
function drawAtlas(){
  const {ctx,width:w,height:h}=fitCanvas(atlasCanvas);if(!w||!h||!spatial.length)return;
  ctx.clearRect(0,0,w,h);
  const specimen=$('#specimen').value, protein=$('#atlas-protein').value, col=protein==='CDK4'?3:4;
  const rows=spatial.filter(r=>r[0]===specimen);
  const [x0,x1]=extent(rows,1),[y0,y1]=extent(rows,2),[v0,v1]=extent(rows,col);
  const scale=Math.min((w-70)/(x1-x0),(h-45)/((y1-y0)*.58));
  const left=(w-(x1-x0)*scale)/2,top=(h-(y1-y0)*scale*.58)/2;
  ctx.strokeStyle='#ffffff04';ctx.lineWidth=1;
  for(let x=25;x<w;x+=35){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=10;y<h;y+=35){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  const radius=Math.max(1.1,Math.min(3.6,scale*.37));
  atlasPoints=rows.map(r=>({x:left+(r[1]-x0)*scale,y:top+(r[2]-y0)*scale*.58,r,value:r[col]}));
  for(const p of atlasPoints){ctx.fillStyle=color((p.value-v0)/(v1-v0||1));ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();}
  if(selectedPoint){ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(selectedPoint.x,selectedPoint.y,radius+4,0,Math.PI*2);ctx.stroke();}
  $('#legend-min').textContent=v0.toFixed(2);$('#legend-max').textContent=v1.toFixed(2);
  $('#specimen-info').textContent=`${specimen} · ${rows.length.toLocaleString()} spots · ${specimen==='D1'?'Held-out test specimen':'Training specimen'}`;
}
for(const id of ['#specimen','#atlas-protein'])$(id).addEventListener('change',()=>{selectedPoint=null;$('#spot-tooltip').hidden=true;drawAtlas();});
function inspectPoint(e){
  const rect=atlasCanvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
  let nearest=null,distance=Infinity;for(const p of atlasPoints){const d=Math.hypot(p.x-x,p.y-y);if(d<distance){distance=d;nearest=p;}}
  const tip=$('#spot-tooltip');if(distance>18){tip.hidden=true;selectedPoint=null;drawAtlas();return;}
  selectedPoint=nearest;drawAtlas();tip.textContent=`${nearest.r[0]}_${nearest.r[1]}x${nearest.r[2]} · ${$('#atlas-protein').value}: ${nearest.value.toFixed(3)}`;
  tip.hidden=false;tip.style.left=`${Math.max(6,Math.min(x+24,rect.width-tip.offsetWidth))}px`;tip.style.top=`${Math.max(6,y-30)}px`;
}
let keyboardSpot = 0;
atlasCanvas.addEventListener('keydown', e => {
  if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key) || !atlasPoints.length) return;
  e.preventDefault();
  if(e.key === 'Home') keyboardSpot = 0;
  else if(e.key === 'End') keyboardSpot = atlasPoints.length - 1;
  else keyboardSpot = (keyboardSpot + (['ArrowLeft','ArrowUp'].includes(e.key) ? -1 : 1) + atlasPoints.length) % atlasPoints.length;
  const rect = atlasCanvas.getBoundingClientRect(), point = atlasPoints[keyboardSpot % atlasPoints.length];
  inspectPoint({clientX:rect.left+point.x, clientY:rect.top+point.y});
});
atlasCanvas.addEventListener('blur',()=>{$('#spot-tooltip').hidden=true;selectedPoint=null;drawAtlas();});
atlasCanvas.addEventListener('pointermove',inspectPoint);atlasCanvas.addEventListener('click',inspectPoint);
atlasCanvas.addEventListener('pointerleave',()=>{$('#spot-tooltip').hidden=true;selectedPoint=null;drawAtlas();});
new ResizeObserver(()=>{drawHero();drawAtlas();}).observe(hero.parentElement);
new ResizeObserver(drawAtlas).observe(atlasCanvas.parentElement);
const dialog=$('#detail-dialog'),dialogContent=$('#dialog-content'),atlas=$('.atlas');let atlasPlaceholder=null,previousFocus=null;
let dialogClosing = false;
function openDialog(title){
  previousFocus=document.activeElement;
  $('#dialog-title').textContent=title;
  dialogClosing=false;dialog.classList.remove('is-closing');
  dialog.showModal();document.body.style.overflow='hidden';
  $('#close-dialog').focus({preventScroll:true});
}
function closeDialog(){
  if(dialogClosing || !dialog.open)return;
  if(reducedMotion.matches){dialog.close();return;}
  dialogClosing=true;dialog.classList.add('is-closing');
  const exit=dialog.animate([
    {opacity:1,transform:'translateY(0) scale(1)'},
    {opacity:0,transform:'translateY(18px) scale(.97)'}
  ],{duration:420,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
  exit.finished.then(()=>{dialog.close();exit.cancel();}).catch(()=>{});
}

function restoreDialog(){if(atlasPlaceholder){atlasPlaceholder.replaceWith(atlas);atlasPlaceholder=null;dialog.classList.remove('expanded-atlas');drawAtlas();}document.body.style.overflow='';dialogContent.replaceChildren();dialogClosing=false;dialog.classList.remove('is-closing');previousFocus?.focus({preventScroll:true});}
$('#close-dialog').addEventListener('click',closeDialog);dialog.addEventListener('close',restoreDialog);
dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();});
$('#expand-atlas').addEventListener('click',()=>{
  if(dialog.open){closeDialog();return;}
  atlasPlaceholder=document.createElement('div');atlasPlaceholder.style.height=`${atlas.offsetHeight}px`;atlas.before(atlasPlaceholder);
  dialogContent.replaceChildren(atlas);dialog.classList.add('expanded-atlas');openDialog('Spatial expression atlas · expanded view');drawAtlas();
});
$$('.figure-open').forEach(button=>button.addEventListener('click',async ()=>{
 const img=document.createElement('img');img.src=button.dataset.image;img.alt=button.dataset.title;
 try{await img.decode();}catch{}
 if(dialog.open)return;
 dialogContent.replaceChildren(img);openDialog(button.dataset.title);
}));
$('#metrics-explain').addEventListener('click',()=>{
 dialogContent.innerHTML='<div class="metric-explainer"><article><h3>Spearman ρ</h3><p>Measures agreement in ranking, from −1 to +1. A positive value means higher measurements tend to receive higher predictions, even when their exact values are wrong.</p></article><article><h3>Pearson r</h3><p>Measures linear association, from −1 to +1. Correlation can stay positive despite systematic prediction bias.</p></article><article><h3>RMSE</h3><p>Root mean squared error measures prediction error in the target’s units. Lower is better, but values for different proteins are not directly comparable without considering their scales.</p></article><article><h3>R²</h3><p>Compares squared prediction error against a baseline that always predicts the evaluation set’s mean. A negative score means the model has higher squared error than that baseline. It does not mean “negative variance explained.”</p></article></div>';
 openDialog('Four metrics. Four different questions.');
});
const tabs=$$('.results-tabs [role=tab]');function activateTab(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;$('#'+t.getAttribute('aria-controls')).hidden=!active;});}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>activateTab(t));t.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=tabs[(i+1)%tabs.length];if(e.key==='ArrowLeft')next=tabs[(i-1+tabs.length)%tabs.length];if(e.key==='Home')next=tabs[0];if(e.key==='End')next=tabs.at(-1);if(next){e.preventDefault();activateTab(next);next.focus();}});});
const metricLabels={rmse:'RMSE',pearson:'Pearson r',spearman:'Spearman ρ',r2:'R²'};
const fmt=pair=>`${pair[0].toFixed(3)} ± ${pair[1].toFixed(3)}`;
function renderProtein(){const r=results.find(r=>r.protein===$('#result-protein').value);if(!r)return;$('#protein-result').innerHTML=`<div class="protein-metrics">${Object.entries(metricLabels).map(([key,label])=>`<div><span>${label}</span><strong>${r[key][0].toFixed(3)}</strong><small> ± ${r[key][1].toFixed(3)}</small></div>`).join('')}</div>`;}
function renderTable(){
 const query=$('#protein-search').value.trim().toLowerCase(),sort=$('#metric-sort').value;
 const rows=results.filter(r=>r.protein.toLowerCase().includes(query)).sort((a,b)=>sort==='protein'?a.protein.localeCompare(b.protein):sort==='rmse'?a[sort][0]-b[sort][0]:b[sort][0]-a[sort][0]);
 const tbody=$('#protein-table');tbody.replaceChildren();
 for(const r of rows){const tr=document.createElement('tr');for(const val of [r.protein,...Object.keys(metricLabels).map(k=>fmt(r[k]))]){const td=document.createElement('td');td.textContent=val;tr.append(td);}tbody.append(tr);}
 if(!rows.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='No proteins match your search.';tr.append(td);tbody.append(tr);}
 $('#table-count').textContent=`${rows.length} of ${results.length} proteins · values are mean ± standard deviation`;
}
$('#protein-search').addEventListener('input',renderTable);$('#metric-sort').addEventListener('change',renderTable);$('#result-protein').addEventListener('change',renderProtein);
$('#download-results').addEventListener('click',()=>{
 const keys=Object.keys(metricLabels),csv=['Protein,'+keys.flatMap(k=>[k+'_mean',k+'_std']).join(','),...results.map(r=>[r.protein,...keys.flatMap(k=>r[k])].join(','))].join('\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='spatial-protein-cnn-cross-validation.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
let scrollQueued=false;function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;$('.read-progress').style.width=`${max>0?scrollY/max*100:0}%`;scrollQueued=false;}
addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateProgress);}},{passive:true});
const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');revealObserver.unobserve(e.target);}}),{threshold:.08});
$$('.section-heading,.overview-cards,.method-layout,.model-grid,.evidence-grid,.impact-grid,.about-content').forEach(el=>{el.classList.add('reveal-ready');revealObserver.observe(el);});
async function loadData(){
 const outcomes=await Promise.allSettled([fetch('assets/spatial.json').then(r=>{if(!r.ok)throw Error('Spatial data unavailable');return r.json();}),fetch('assets/results.json').then(r=>{if(!r.ok)throw Error('Results unavailable');return r.json();})]);
 if(outcomes[0].status==='fulfilled'){spatial=outcomes[0].value;heroRows=spatial.filter(r=>r[0]==='A1');drawAtlas();drawHero();resumeHero();}
 else{$('#specimen-info').textContent='Measurements could not load. Refresh this page to retry.';$('.visual-caption').textContent='Spatial data unavailable — refresh to retry';}
 if(outcomes[1].status==='fulfilled'){results=outcomes[1].value;for(const r of [...results].sort((a,b)=>a.protein.localeCompare(b.protein))){const o=document.createElement('option');o.value=o.textContent=r.protein;$('#result-protein').append(o);}$('#result-protein').value='CDK4';renderProtein();renderTable();}
 else{$('#protein-result').textContent='Results could not load. Refresh this page to retry.';$('#download-results').disabled=true;}
}
loadData();
