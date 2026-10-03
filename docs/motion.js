'use strict';
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(.22,1,.36,1)';
  const all = selector => [...document.querySelectorAll(selector)];
  let scrollFrame = 0;

  function stopScroll() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
  }

  function scrollToSection(target) {
    stopScroll();
    const start = window.scrollY;
    const offset = target.id === 'home' ? 0 : Math.min(65, innerHeight * .08);
    const end = target.id === 'home' ? 0 : Math.max(0, Math.min(
      start + target.getBoundingClientRect().top - offset,
      document.documentElement.scrollHeight - innerHeight
    ));
    const distance = end - start;
    const duration = reduce.matches ? 0 : Math.min(2800, 1250 + Math.abs(distance) * .14);
    const started = performance.now();
    function step(now) {
      const t = duration ? Math.min(1, (now - started) / duration) : 1;
      const eased = (1 - Math.cos(Math.PI * t)) / 2;
      window.scrollTo({top:start + distance * eased, behavior:'instant'});
      if(t < 1) scrollFrame = requestAnimationFrame(step);
      else {
        scrollFrame = 0;
        if(!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({preventScroll:true});
      }
    }
    scrollFrame = requestAnimationFrame(step);
  }
  for(const event of ['wheel','touchstart','pointerdown']) addEventListener(event, stopScroll, {passive:true});
  addEventListener('keydown', event => {
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) stopScroll();
  });
  reduce.addEventListener('change', stopScroll);
  all('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    if(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.hash.slice(1));
    if(!target) return;
    event.preventDefault();
    history.pushState(null, '', link.hash);
    closeMobileNav();
    setDisclosure(document.querySelector('.nav-more'), false);
    scrollToSection(target);
  }));
  const disclosureStates = new WeakMap();
  function setDisclosure(details, opening) {
    if(!details) return;
    let state = disclosureStates.get(details);
    if(!state) return;
    if(state.opening === opening && !state.animation) return;
    const from = details.getBoundingClientRect().height;
    state.animation?.cancel();
    state.opening = opening;
    const summary = details.querySelector('summary');
    summary.setAttribute('aria-expanded', String(opening));
    if(reduce.matches) {state.animation=null;details.open=opening;details.style.height='';details.style.overflow='';return;}
    const menu = details.classList.contains('nav-more');
    if(menu) {
      details.open=true;
      const content=details.querySelector('div');
      state.animation=content.animate(opening ? [
        {opacity:0,transform:'translateY(-10px) scale(.97)'},
        {opacity:1,transform:'translateY(0) scale(1)'}
      ] : [
        {opacity:1,transform:'translateY(0) scale(1)'},
        {opacity:0,transform:'translateY(-6px) scale(.98)'}
      ],{duration:opening?480:300,easing:ease});
    } else {
      details.style.height='';details.open=true;
      const to=opening ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + parseFloat(getComputedStyle(details).paddingTop) + parseFloat(getComputedStyle(details).paddingBottom) + parseFloat(getComputedStyle(details).borderTopWidth) + parseFloat(getComputedStyle(details).borderBottomWidth);
      details.style.overflow='hidden';
      state.animation=details.animate([{height:`${from}px`},{height:`${to}px`}],{duration:560,easing:ease});
    }
    const animation=state.animation;
    animation.finished.then(()=>{
      if(state.animation!==animation)return;
      details.open=opening;details.style.height='';details.style.overflow='';state.animation=null;
    }).catch(()=>{});
  }
  all('details').forEach(details=>{
    const summary=details.querySelector('summary');
    disclosureStates.set(details,{animation:null,opening:details.open});
    summary.setAttribute('aria-expanded',String(details.open));
    summary.addEventListener('click',event=>{
      event.preventDefault();
      setDisclosure(details,!disclosureStates.get(details).opening);
    });
  });
  document.addEventListener('click',e=>{if(!e.target.closest('.nav-more'))setDisclosure(document.querySelector('.nav-more'),false);});

  const header=document.querySelector('.header'), mobileButton=document.querySelector('.mobile-toggle');
  function closeMobileNav(){
    header.classList.remove('nav-open');mobileButton.setAttribute('aria-expanded','false');mobileButton.setAttribute('aria-label','Open navigation');
  }
  mobileButton.addEventListener('click',()=>{
    const open=header.classList.toggle('nav-open');
    mobileButton.setAttribute('aria-expanded',String(open));mobileButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');
    if(open && !reduce.matches) header.querySelector('nav').animate([{opacity:0,transform:'translateY(-12px)'},{opacity:1,transform:'translateY(0)'}],{duration:480,easing:ease});
  });
  const pickers=[];
  all('select').forEach(select=>{
    const label=select.closest('label');
    const labelText=[...label.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim();
    const wrapper=document.createElement('div');wrapper.className='fluid-select';
    const button=document.createElement('button');button.type='button';button.className='select-trigger';
    button.setAttribute('role','combobox');button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label',labelText);
    const list=document.createElement('div');list.className='select-options';list.id=select.id+'-options';list.setAttribute('role','listbox');list.setAttribute('aria-label',labelText);list.hidden=true;
    button.setAttribute('aria-controls',list.id);
    label.after(wrapper);wrapper.append(button,list);
    label.classList.add('enhanced-label');
    wrapper.prepend(label);
    select.hidden=true;select.tabIndex=-1;
    let active=0,animation=null,closing=false;
    const picker={close};pickers.push(picker);
    function sync(){
      button.textContent=select.selectedOptions[0]?.textContent || 'Loading…';
      button.disabled=select.disabled || !select.options.length;
      list.replaceChildren();
      [...select.options].forEach((option,index)=>{
        const item=document.createElement('div');item.id=`${list.id}-${index}`;item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.selected));item.textContent=option.textContent;item.dataset.index=index;
        item.addEventListener('click',()=>choose(index));list.append(item);
      });
      active=Math.max(0,select.selectedIndex);
    }
    function highlight(index){
      const options=[...list.children];if(!options.length)return;
      active=(index+options.length)%options.length;
      options.forEach((el,i)=>el.classList.toggle('active-option',i===active));
      button.setAttribute('aria-activedescendant',options[active].id);
      const item=options[active];
      if(item.offsetTop<list.scrollTop)list.scrollTop=item.offsetTop;
      else if(item.offsetTop+item.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=item.offsetTop+item.offsetHeight-list.clientHeight;
    }
    function open(){
      pickers.forEach(p=>{if(p!==picker)p.close();});
      animation?.cancel();closing=false;list.hidden=false;wrapper.classList.add('select-open');button.setAttribute('aria-expanded','true');highlight(select.selectedIndex);
      if(!reduce.matches)animation=list.animate([{opacity:0,transform:'translateY(-9px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:460,easing:ease});
    }
    function close(){
      if(list.hidden || closing)return;
      animation?.cancel();closing=true;button.setAttribute('aria-expanded','false');button.removeAttribute('aria-activedescendant');
      const finish=()=>{list.hidden=true;wrapper.classList.remove('select-open');closing=false;};
      if(reduce.matches){finish();return;}
      animation=list.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-6px)'}],{duration:260,easing:ease});
      animation.finished.then(finish).catch(()=>{});
    }
    function choose(index){
      select.selectedIndex=index;select.dispatchEvent(new Event('change',{bubbles:true}));sync();close();button.focus({preventScroll:true});
    }
    button.addEventListener('click',()=>button.getAttribute('aria-expanded')==='true'?close():open());
    let typed='',typingTimer;
    button.addEventListener('keydown',event=>{
      const expanded=button.getAttribute('aria-expanded')==='true';
      if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(event.key)){
        event.preventDefault();
        if(!expanded){open();return;}
        if(event.key==='Enter'||event.key===' '){choose(active);return;}
        highlight(event.key==='Home'?0:event.key==='End'?list.children.length-1:active+(event.key==='ArrowUp'?-1:1));
      } else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();}
      else if(event.key==='Tab')close();
      else if(event.key.length===1 && !event.metaKey && !event.ctrlKey){
        clearTimeout(typingTimer);typed+=event.key.toLowerCase();typingTimer=setTimeout(()=>typed='',700);
        if(!expanded)open();const index=[...select.options].findIndex(o=>o.textContent.toLowerCase().startsWith(typed));if(index>=0)highlight(index);
      }
    });
    document.addEventListener('click',e=>{if(!wrapper.contains(e.target))close();});
    select.addEventListener('change',sync);
    new MutationObserver(sync).observe(select,{childList:true,attributes:true,subtree:true});sync();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){setDisclosure(document.querySelector('.nav-more'),false);closeMobileNav();pickers.forEach(p=>p.close());}});

  const codeTabs=all('.code-tabs [role="tab"]');
  function activateCode(tab){
    codeTabs.forEach(button=>{
      const selected=button===tab,panel=document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;panel.hidden=!selected;
      if(selected&&!reduce.matches)panel.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:520,easing:ease});
    });
  }
  codeTabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activateCode(tab));
    tab.addEventListener('keydown',e=>{
      let next;
      if(e.key==='ArrowRight')next=codeTabs[(index+1)%codeTabs.length];
      if(e.key==='ArrowLeft')next=codeTabs[(index+codeTabs.length-1)%codeTabs.length];
      if(e.key==='Home')next=codeTabs[0];if(e.key==='End')next=codeTabs.at(-1);
      if(next){e.preventDefault();activateCode(next);next.focus({preventScroll:true});}
    });
  });
  all('.copy-code').forEach(button=>button.addEventListener('click',async()=>{
    const window=button.closest('.code-window');
    try {
      await navigator.clipboard.writeText(window.querySelector('code').textContent);
      button.textContent='Copied';window.querySelector('.copy-status').textContent='Code copied to clipboard.';
    } catch {
      button.textContent='Select to copy';window.querySelector('.copy-status').textContent='Clipboard unavailable. Select the code and copy it manually.';
      const range=document.createRange();range.selectNodeContents(window.querySelector('code'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);
    }
    setTimeout(()=>button.textContent='Copy code',2200);
  }));
})();
