'use strict';
/* Webflow integration: restore per-element custom properties (stored as data-vars, since Webflow classes cannot hold CSS variables). */
(()=>{if(!document.documentElement.lang)document.documentElement.lang='en';document.querySelectorAll('[data-vars]').forEach(el=>{el.style.cssText+=(el.style.cssText?';':'')+el.dataset.vars;});
 /* Webflow image elements do not carry loading/decoding/draggable attributes: restore the original behaviour from marker classes. */
 document.querySelectorAll('span.range-input').forEach(s=>{const i=document.createElement('input');for(const a of s.attributes)if(a.name.startsWith('data-'))i.setAttribute(a.name.slice(5),a.value);if(!i.hasAttribute('type'))i.type='range';s.replaceWith(i);});document.querySelectorAll('[data-clothes] img,[data-alpha-player] video').forEach(e=>{e.crossOrigin='anonymous'});document.querySelectorAll('img').forEach(img=>{img.decoding='async';if(img.classList.contains('ld-eager'))img.loading='eager';if(img.classList.contains('no-drag'))img.draggable=false;});})();
'use strict';
(() => {
 const phone=matchMedia('(max-width:700px)'),template=document.getElementById('mobile-layout');
 if(phone.matches&&template){
  const content=document.createDocumentFragment();content.append(...template.childNodes);
  [...document.body.children].filter(el=>el.tagName!=='SCRIPT'&&el.tagName!=='NOSCRIPT'&&el.tagName.toLowerCase()!=='svg'&&!el.classList.contains('skip-link')).forEach(el=>el.remove());
  template.remove();document.body.append(content);document.body.classList.add('mobile-design');
  if(document.querySelector('[data-mobile-project="toronto-wolfpack"]')){
   document.body.classList.add('mobile-static-project');
   delete document.documentElement.dataset.projectEntrance;
   delete document.documentElement.dataset.projectImageEntrance;
  }
 } else template?.remove();
 const size=()=>document.documentElement.style.setProperty('--mobile-scale',String(Math.min(700,document.documentElement.clientWidth||innerWidth)/393));
 size();addEventListener('resize',size,{passive:true});
 const path=location.pathname,from=new URLSearchParams(location.search).get('from');
 const variant=path.match(/^\/(option-[bcd])\//)?.[1]||([].includes(from)?from:null);
 const contactParams=new URLSearchParams();
 if(variant)contactParams.set('from',variant);
 contactParams.set('return',path+(variant&&path.startsWith('/work/')?'?from='+variant:''));
 document.querySelectorAll('[data-contact]').forEach(a=>a.href='/contact?'+contactParams);
 const returnPath=new URLSearchParams(location.search).get('return');
 const safeReturn=returnPath&&returnPath.startsWith('/')&&!returnPath.startsWith('//')?returnPath:null;
 document.querySelectorAll('[data-return-home]').forEach(a=>a.href=safeReturn||(variant?'/'+variant+'/':'/'));
 phone.addEventListener('change',()=>location.reload());
})();

/* Show the real text lines wherever the original design displayed its fitted SVG text. */
(()=>{
 const texts=[...document.querySelectorAll('.svg-text')].map(svg=>[svg,svg.parentElement]);
 const classify=()=>{texts.forEach(([svg,el])=>el.classList.toggle('flow-as-svg',getComputedStyle(svg).display!=='none'));};
 classify();
 ['(min-width:701px)','(min-width:1440px)','(max-width:700px)'].forEach(q=>matchMedia(q).addEventListener('change',classify));
})();
'use strict';
(() => {
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const phone = matchMedia('(max-width: 700px)');
 const root = document.documentElement;
 const all = (selector, within = document) => [...within.querySelectorAll(selector)];
 const isHome = document.body.classList.contains('home-page');
 const mobileDesign=document.body.classList.contains('mobile-design');
 const optionB = document.body.classList.contains('option-b');
 const optionC = document.body.classList.contains('option-c');
 const optionD = document.body.classList.contains('option-d');
 const homeVariant=optionD?'option-d':optionC?'option-c':optionB?'option-b':null;
 let streamScroll=scrollY,streamLast=0;
 const streamColumn=isHome?document.querySelector('.work-column'):null;
 const homeStorage=homeVariant?`portfolio-${homeVariant}-order-20261123-offset`:'portfolio-new-home-order-20261123-offset';
 let introStarted=false,introFinish=null,introMoving=false;
 const fromVariant=new URLSearchParams(location.search).get('from');
 let projectPresented=window.self===window.top;
 if([].includes(fromVariant)){
  all('a[href="/"]').forEach(a=>a.href=`/${fromVariant}/`);
  all('a[href^="/work/"]').forEach(a=>a.href+=`?from=${fromVariant}`);
 }
 if (isHome) history.scrollRestoration = 'manual';
 let queued = false;
 const panStates = new WeakMap();
 let lastPanTime = 0;
 let watched = new Set();
 let mediaObserver;
 let cycleHeight = 0;
 let loopBase = 0;
 let loopReady = false;
 let shifting = false;
 let pointerDown = false;
 let scrollStop;

 function reflowProjectText(scale) {
  const canvas=document.querySelector('.project-canvas');
  if(!canvas)return;
  const items=all(':scope>.layout-item,:scope>.project-footer,:scope>.pattern-caption',canvas);
  items.forEach(el=>el.style.removeProperty('--responsive-y'));
  canvas.style.removeProperty('--responsive-page-height');
  if(innerWidth<=700||innerWidth>=1440)return;
  const number=(el,name,fallback)=>parseFloat(el.style.getPropertyValue(name))||parseFloat(el.style[fallback])||0;
  const boxes=items.map(el=>({el,x:number(el,'--x','left'),y:number(el,'--y','top'),w:number(el,'--w','width'),h:number(el,'--h','height')}));
  const bands=[];
  boxes.sort((a,b)=>a.y-b.y||a.x-b.x).forEach(box=>{
   let band=bands[bands.length-1];
   if(!band||box.y>=band.end-1){band={start:box.y,end:box.y+box.h,boxes:[]};bands.push(band);}
   band.boxes.push(box);band.end=Math.max(band.end,box.y+box.h);
  });
  const heroDelta=parseFloat(root.style.getPropertyValue('--hero-delta'))||0;
  let growth=0;
  const extent=el=>{
   const rect=el.getBoundingClientRect();let height=rect.height/scale;
   all('.caption-row,.text',el).forEach(child=>{
    const r=child.getBoundingClientRect();
    if(r.width&&r.height)height=Math.max(height,(r.bottom-rect.top)/scale);
   });
   return height;
  };
  bands.forEach(band=>{
   const placed=[];let bottom=band.start+growth;
   band.boxes.forEach(box=>{
    let y=box.y+growth;
    placed.forEach(previous=>{
     const overlap=Math.min(box.x+box.w,previous.x+previous.w)-Math.max(box.x,previous.x);
     if(overlap<=4||box.y<=previous.y+1)return;
     const gap=Math.max(12/scale,box.y-previous.y-previous.h);
     y=Math.max(y,previous.newBottom+gap);
    });
    box.el.style.setProperty('--responsive-y',`${y+heroDelta}px`);
    const h=extent(box.el);box.newBottom=y+h;
    placed.push(box);bottom=Math.max(bottom,box.newBottom);
   });
   growth+=Math.max(0,bottom-(band.end+growth));
  });
  const page=parseFloat(canvas.style.getPropertyValue('--page-height'))||0;
  canvas.style.setProperty('--responsive-page-height',`${page+heroDelta+growth+200/scale}px`);
 }

 function layoutGalleryCaptions() {
  if(!isHome||mobileDesign||innerWidth<=700||innerWidth>=1440)return;
  all('.work-caption').forEach(caption=>{
   const text=caption.querySelector('.work-title .motion-text');
   if(!text)return;
   const range=document.createRange();range.selectNodeContents(text);
   const lines=[...range.getClientRects()].filter(rect=>rect.width);
   const last=lines[lines.length-1],rect=caption.getBoundingClientRect();
   if(!last||!rect.width)return;
   const scale=rect.width/caption.offsetWidth;
   const arrowX=(last.right-rect.left)/scale+6;
   caption.style.setProperty('--caption-arrow-x',`${arrowX}px`);
  });
 }

 function sizeLayouts() {
  const scale = innerWidth / 1440;
  root.style.setProperty('--scale', String(scale));
  all('video[data-tablet-video]').forEach(video=>{
   const tablet=innerWidth>700&&innerWidth<1440;
   const source=tablet?video.dataset.tabletVideo:video.dataset.defaultVideo;
   if(video.dataset.video===source)return;
   video.dataset.video=source;
   video.poster=tablet?video.dataset.tabletPoster:video.dataset.defaultPoster;
   if(video.hasAttribute('src')){
    video.src=source;
    if(video.dataset.visible==='true')playVideo(video);
   }
  });
  if (!isHome && !phone.matches) {
   const heroHeight = (window.visualViewport?.height || innerHeight) / scale;
   root.style.setProperty('--hero-height', `${heroHeight}px`);
   root.style.setProperty('--hero-delta', `${heroHeight - 900}px`);
   root.style.setProperty('--hero-type-scale', String(Math.min(1, heroHeight / 700)));
   all('.hero-heading').forEach(el => {
    el.style.setProperty('--hero-y', String(parseFloat(el.style.getPropertyValue('--y')) / 900));
   });
  }
  all('[data-comparison]').forEach(el => {
   const size = el.dataset.fit === 'walking' ? Math.min(el.clientWidth/.91,el.clientHeight/.80) : Math.min(el.clientWidth,el.clientHeight);
   el.style.setProperty('--scene-size', `${size}px`);
  });
  all('[data-fit-width]').forEach(el => {
   el.style.setProperty('--fit', String(el.clientWidth / Number(el.dataset.fitWidth)));
  });
  reflowProjectText(scale);
  layoutGalleryCaptions();
 }
 sizeLayouts();
 // Decode every car frame before starting one shared clock. Independent GIF
 // decoders cannot guarantee that the three illustrations remain in phase.
 const carScenes=all('[data-car-frames]');
 if(carScenes.length){
  const sequences=carScenes.map(el=>JSON.parse(el.dataset.carFrames));
  const visibleCars=new Set();
  let carReady=false,carPreparing=false,carRunning=false,carEpoch=0,carLast=-1;
  const renderCars=index=>{
   if(index===carLast)return;
   carLast=index;
   carScenes.forEach((el,i)=>{el.querySelector('img').src=sequences[i][index];el.dataset.carFrame=String(index);});
  };
  const tickCars=time=>{
   carRunning=false;
   if(!carReady||document.hidden||reduced.matches||!visibleCars.size)return;
   renderCars(Math.floor(Math.max(0,time-carEpoch)/600)%sequences[0].length);
   carRunning=true;requestAnimationFrame(tickCars);
  };
  const startCars=()=>{
   if(!carReady){
    if(carPreparing)return;
    carPreparing=true;
    Promise.all(sequences.flat().map(src=>{const img=new Image();img.src=src;return img.decode();})).then(()=>{
     carReady=true;carEpoch=performance.now();renderCars(0);startCars();
    }).catch(()=>{carPreparing=false;});
    return;
   }
   if(!carRunning&&!document.hidden&&!reduced.matches&&visibleCars.size){carRunning=true;requestAnimationFrame(tickCars);}
  };
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(({target,isIntersecting})=>isIntersecting?visibleCars.add(target):visibleCars.delete(target));
   if(visibleCars.size)startCars();
  },{rootMargin:'200px'});
  carScenes.forEach(el=>observer.observe(el));
  document.addEventListener('visibilitychange',startCars);
  reduced.addEventListener('change',()=>{if(reduced.matches)renderCars(0);else startCars();});
 }

 // Re-request any rail thumbnail the browser dropped (e.g. under memory pressure after preloading projects).
 const healRail=rail=>all('img',rail).forEach(img=>{
  if(img.complete&&!img.naturalWidth){const src=img.getAttribute('src');img.removeAttribute('src');img.setAttribute('src',src);}
  else if(img.decode)img.decode().catch(()=>{});
 });
 const railObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)healRail(entry.target);}));
 all('.more-grid').forEach(rail=>railObserver.observe(rail));
 addEventListener('pageshow',()=>all('.more-grid').forEach(healRail));
 addEventListener('portfolio:project-presented',()=>all('.more-grid').forEach(healRail));
 all('.more-grid').forEach(rail=>{
  rail.addEventListener('wheel',event=>{
   if(Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;
   const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?rail.clientWidth:1);
   const next=Math.max(0,Math.min(rail.scrollWidth-rail.clientWidth,rail.scrollLeft+delta));
   if(Math.abs(next-rail.scrollLeft)<.5)return;
   event.preventDefault();rail.scrollLeft=next;
  },{passive:false});
  let origin=null,dragged=false;
  rail.addEventListener('dragstart',event=>event.preventDefault());
  rail.addEventListener('pointerdown',event=>{
   if(event.pointerType!=='mouse'||event.button!==0)return;
   origin={x:event.clientX,left:rail.scrollLeft};dragged=false;
  });
  rail.addEventListener('pointermove',event=>{
   if(!origin||!(event.buttons&1))return;
   if(Math.abs(event.clientX-origin.x)>5){dragged=true;rail.setPointerCapture(event.pointerId);rail.classList.add('is-dragging');}
   if(dragged){event.preventDefault();rail.scrollLeft=origin.left+origin.x-event.clientX;}
  });
  const endDrag=()=>{origin=null;rail.classList.remove('is-dragging');};
  rail.addEventListener('pointerup',endDrag);rail.addEventListener('pointercancel',endDrag);
  rail.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopPropagation();dragged=false;}},true);
 });
 const logoWriters=new WeakMap();
 const setupLogo=logo=>{
  const pens=all('.signature-pen',logo);
  const lengths=pens.map(path=>path.getTotalLength());
  const total=lengths.reduce((sum,length)=>sum+length,0)||1;
  let delay=0;
  pens.forEach((path,index)=>{
   const duration=.28+.94*lengths[index]/total;
   path.style.setProperty('--pen-delay',`${delay}s`);
   path.style.setProperty('--pen-duration',`${duration}s`);
   delay+=duration+(index<pens.length-1?.04:0);
  });
  const write=()=>{
   if(reduced.matches || logo.classList.contains('is-writing'))return;
   logo.classList.add('is-writing');
   setTimeout(()=>logo.classList.remove('is-writing'),delay*1000);
  };
  logo.addEventListener('pointerenter',write);
  logo.addEventListener('focus',write);
  logoWriters.set(logo,write);
 };
 all('.signature').forEach(setupLogo);

 // Prepared SVG frames retain the original artwork and animation timing.
 const restaurants=all('[data-restaurant-frames],[data-artwork-frames]');
 if(restaurants.length){
  const sequences=restaurants.map(el=>JSON.parse(el.dataset.restaurantFrames||el.dataset.artworkFrames));
  let ready=false,running=false,epoch=0,last=-1;
  const visible=new Set();
  const tick=time=>{
   running=false;
   if(!ready||document.hidden||reduced.matches||!visible.size)return;
   const sequence=sequences[0],duration=sequence.reduce((sum,f)=>sum+f.duration,0);
   let elapsed=(time-epoch)%duration,index=0;
   while(index<sequence.length-1&&elapsed>=sequence[index].duration)elapsed-=sequence[index++].duration;
   if(index!==last){restaurants.forEach((el,i)=>{el.querySelector('img').src=sequences[i][index].src;if(el.hasAttribute('data-restaurant-frames'))el.dataset.restaurantFrame=String(index);else el.dataset.artworkFrame=String(index);});last=index;}
   running=true;requestAnimationFrame(tick);
  };
  const start=()=>{if(ready&&!running&&!document.hidden&&!reduced.matches&&visible.size){running=true;requestAnimationFrame(tick);}};
  Promise.all(sequences.flat().map(frame=>{const img=new Image();img.src=frame.src;return img.decode();})).then(()=>{ready=true;epoch=performance.now();start();}).catch(()=>{});
  const observer=new IntersectionObserver(entries=>{entries.forEach(({target,isIntersecting})=>isIntersecting?visible.add(target):visible.delete(target));start();},{rootMargin:'200px'});
  restaurants.forEach(el=>observer.observe(el));
  document.addEventListener('visibilitychange',start);
  reduced.addEventListener('change',start);
 }

 function playVideo(video) {
  if (reduced.matches || document.hidden || introMoving) { video.pause(); return; }
  if (!video.getAttribute('src')) video.src = video.dataset.video;
  video.play().catch(() => {});
 }

 function setupAlphaPlayer(frame) {
  const video = frame.querySelector('video');
  const canvas = frame.querySelector('canvas');
  const gl = canvas.getContext('webgl', {alpha:true, premultipliedAlpha:false, preserveDrawingBuffer:true});
  if (!gl) return;
  canvas.width = 1280; canvas.height = 678;
  function shader(type, source) {
   const item = gl.createShader(type);
   gl.shaderSource(item,source); gl.compileShader(item);
   if (!gl.getShaderParameter(item,gl.COMPILE_STATUS)) throw new Error('Alpha video shader unavailable');
   return item;
  }
  try {
   const program = gl.createProgram();
   gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 position; varying vec2 uv; void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}'));
   gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float; uniform sampler2D frame; varying vec2 uv; void main(){vec3 color=texture2D(frame,vec2(uv.x*0.5,uv.y)).rgb;float opacity=texture2D(frame,vec2(0.5+uv.x*0.5,uv.y)).r;gl_FragColor=vec4(color,opacity);}'));
   gl.linkProgram(program);
   if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return;
   gl.useProgram(program);
   const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
   const position = gl.getAttribLocation(program,'position');
   gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
   const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
   gl.viewport(0,0,canvas.width,canvas.height);
   function draw() {
    if (video.readyState < 2 || reduced.matches || document.hidden) return;
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    frame.classList.add('alpha-ready');
   }
   if (video.requestVideoFrameCallback) {
    const tick = () => { draw(); video.requestVideoFrameCallback(tick); };
    video.requestVideoFrameCallback(tick);
   } else video.addEventListener('timeupdate',draw);
  } catch { /* The transparent still remains available without WebGL support. */ }
 }

 function observeMedia(within = document) {
  all('[data-parallax], video[data-video], img[data-animated]', within).forEach(el => mediaObserver.observe(el));
 }

 mediaObserver = new IntersectionObserver(entries => {
  entries.forEach(({target, isIntersecting}) => {
   if (target.hasAttribute('data-parallax')) {
    if (isIntersecting) watched.add(target); else watched.delete(target);
   }
   if (target.matches('video')) {
    target.dataset.visible = isIntersecting ? 'true' : 'false';
    if (isIntersecting) playVideo(target); else target.pause();
   }
   if (target.matches('[data-animated]')) {
    target.dataset.poster ||= target.src;
    target.src = isIntersecting && !reduced.matches ? target.dataset.animated : target.dataset.poster;
   }
  });
  schedule();
 }, {rootMargin: '160px 0px', threshold: 0});
 all('[data-alpha-player]').forEach(setupAlphaPlayer);
 observeMedia();

 function update() {
  queued = false;
  const now = performance.now();
  let streamSettling=false;
  if(optionB&&!mobileDesign){
   const delta=Math.min(40,now-streamLast||16.7);streamLast=now;
   const lag=scrollY-streamScroll;
   // Ease the entire image ribbon, preserving native wheel, keyboard and touch input.
   streamScroll=reduced.matches||phone.matches?scrollY:streamScroll+lag*(1-Math.exp(-delta/135));
   if(Math.abs(scrollY-streamScroll)<.08)streamScroll=scrollY;
   streamColumn.style.transform=`translate3d(0,${scrollY-streamScroll}px,0)`;
   streamSettling=Math.abs(scrollY-streamScroll)>.08;
   all('.work-card',streamColumn).forEach(card=>{
    // Scaling around the card's centre leaves this measured centre unchanged.
    const rect=card.getBoundingClientRect();
    const distance=Math.min(1,Math.abs(rect.top+rect.height/2-innerHeight/2)/(innerHeight*.62));
    const scale=reduced.matches?1:1-(phone.matches?.10:.22)*Math.pow(distance,1.35);
    card.style.transform=`scale(${scale.toFixed(5)})`;
   });
  }
  // Keep the authored crop fixed while its actual frame flies into position.
  if(introMoving){if(streamSettling)schedule();return;}
  if (reduced.matches) {
   watched.forEach(el => {el.querySelector('.image-surface').style.setProperty('--drift', '0px');panStates.delete(el);});
   return;
  }
  const view = innerHeight;
  const ease = 1 - Math.exp(-Math.min(40, now - lastPanTime || 16.7) / 75);
  lastPanTime = now;
  let settling = streamSettling;
  const measures = [...watched].map(el => ({el, rect:el.getBoundingClientRect()}));
  measures.forEach(({el, rect}) => {
   if (rect.height === 0) return;
   const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - view / 2) / ((view + rect.height) / 2)));
   // Overscan exceeds the largest displacement at every viewport size.
   const strength = Number(el.dataset.panStrength || (isHome ? (phone.matches ? .065 : .245) : (phone.matches ? .06 : .20)));
   const extent = rect.height;
   let distance = extent * (phone.matches && el.dataset.panStrength ? strength * .32 : strength);
   let bias = rect.height * Number(el.dataset.panBias || 0) * (phone.matches ? .32 : 1);
   let movement = isHome
    ? Math.max(-distance, Math.min(distance, -progress*distance*1.25))
    : Math.max(-distance, Math.min(distance, -(rect.top + rect.height / 2 - view / 2) * (phone.matches ? .14 : .42)));
   if(el.hasAttribute('data-pan-safe-heads')){
    // Preserve the faces while the whole frame is visible, then continue the
    // upward travel once the frame's top has left the viewport.
    const gentle=Math.min(extent*(phone.matches ? .012 : .035),Math.max(0,view-rect.bottom)*(phone.matches ? .025 : .06));
    movement=-Math.min(distance,gentle+Math.max(0,-rect.top)*(phone.matches ? .16 : .42));
   }
   const localScale = rect.width / el.offsetWidth || 1;
   let fitLower, fitUpper;
   if(el.dataset.panFit === 'contain'){
    const img=el.querySelector('img');
    if(!img?.naturalWidth)return;
    const ratio=img.naturalWidth/img.naturalHeight;
    const width=Math.min(rect.width,rect.height*ratio)*.94;
    const height=width/ratio;
    el.style.setProperty('--media-width',`${width/localScale}px`);
    el.style.setProperty('--media-height',`${height/localScale}px`);
    // Move the complete artwork through its spare space, keeping its top visible.
    const gap=Math.max(0,rect.height-height);
    bias=gap/2;
    distance=gap*.42;
    movement=Math.max(-distance,Math.min(distance,-progress*distance*1.25));
    fitLower=0;fitUpper=gap;
   }
   if(el.dataset.panFit === 'cover'){
    const img=el.querySelector('img');
    if(!img?.naturalWidth)return;
    const zoom=Number(getComputedStyle(el).getPropertyValue('--fit-zoom'))||1;
    const ratio=img.naturalWidth/img.naturalHeight;
    const width=Math.max(rect.width,rect.height*ratio)*zoom;
    const height=width/ratio;
    el.style.setProperty('--media-width',`${width/localScale}px`);
    el.style.setProperty('--media-height',`${height/localScale}px`);
    const overflow=Math.max(0,height-rect.height);
    fitLower=-overflow;fitUpper=0;
    distance=overflow/2;
    bias=-overflow/2;
    if(el.dataset.panFitAnchor === 'opening'){
     const openingTop=isHome?24*innerWidth/1440:el.offsetTop*localScale;
     const scrolled=Math.max(0,openingTop-rect.top);
     const travel=Math.min(overflow*(phone.matches ? .35 : 1),scrolled*(phone.matches ? .16 : .30));
     movement=-overflow/2+travel;
    }else{
     bias=-overflow*Number(el.dataset.panFitPosition||.5);
     movement=progress*overflow*(phone.matches ? .12 : Number(el.dataset.panFitSpeed||.40));
    }
    if(el.dataset.panContent){
     const [top,bottom]=el.dataset.panContent.split(',').map(Number);
     // Use the extended background for travel. A composition only crosses a
     // frame edge after that edge has already left the visible viewport.
     bias=(rect.height-height*(top+bottom))/2;
     movement=progress*overflow*Number(el.dataset.panFitSpeed||.75);
     const safeLower=-height*top-Math.max(0,-rect.top);
     const safeUpper=rect.height-height*bottom+Math.max(0,rect.bottom-view);
     if(safeLower<=safeUpper){
      fitLower=Math.max(-overflow,safeLower);
      fitUpper=Math.min(0,safeUpper);
     }else{
      fitLower=fitUpper=Math.max(-overflow,Math.min(0,bias));
     }
     if(el.dataset.panDirection==='down'){
      // Let the player settle downward as the frame leaves the screen,
      // keeping his head in view instead of exposing padding beneath him.
      movement=Math.max(0,-progress)*overflow*.75;
      fitLower=Math.max(-overflow,-height*top);
      fitUpper=0;
     }
    }
   }
   if(el.dataset.panAnchor === 'hero'){
    const openingTop=el.offsetTop*localScale;
    const scrolled=Math.max(0,openingTop-rect.top);
    movement=Math.max(-distance,Math.min(distance,distance-scrolled*(phone.matches ? .12 : .30)));
   }
   const lower=fitLower===undefined?bias-distance:fitLower;
   const upper=fitUpper===undefined?bias+distance:fitUpper;
   const target = Math.max(lower,Math.min(upper,bias + movement));
   const previous = panStates.get(el);
   const current = !previous || Math.abs(previous.top - rect.top) > view
    ? target
    : Math.max(lower, Math.min(upper, previous.current + (target-previous.current)*ease));
   const value = Math.abs(target-current) < .05 ? target : current;
   panStates.set(el,{current:value,top:rect.top});
   el.querySelector('.image-surface').style.setProperty('--drift', `${(value / localScale).toFixed(3)}px`);
   if (Math.abs(value-target) >= .05) settling = true;
  });
  if (settling) schedule();
 }
 function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }

 const rollType=(line,duration,delay=0,easing='cubic-bezier(.18,.82,.24,1)')=>line.animate(
  [{transform:'translateY(125%)'},{transform:'translateY(0)'}],
  {duration,delay,easing,fill:'both'}
 );
 async function revealProjectChrome(){
  if(isHome||!projectPresented||root.dataset.projectEntrance!=='pending')return;
  if(reduced.matches){delete root.dataset.projectEntrance;delete root.dataset.projectImageEntrance;return;}
  const hero=document.querySelector('.project-hero>.hero-image');
  await Promise.all((hero?all('img',hero):[]).map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));
  if(hero?.hasAttribute('data-parallax'))watched.add(hero);
  // Establish the final crop before the image is painted or its mask opens.
  update();
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  if(hero&&root.dataset.projectImageEntrance==='reveal'){
   const opening=hero.animate([
    {clipPath:'inset(49.5% 0 49.5% 0)'},
    {clipPath:'inset(0% 0 0% 0)'}
   ],{duration:950,easing:'cubic-bezier(.18,.78,.25,1)',fill:'both'});
   await opening.finished;
  }
  delete root.dataset.projectImageEntrance;
  const logo=document.querySelector('.signature');
  const lines=selector=>all(selector).flatMap(el=>{
   const svg=el.querySelector('.svg-text');
   return all('.motion-text',el);
  });
  all('.hero-heading').forEach(el=>el.classList.add('is-type-revealed'));
  root.dataset.projectEntrance='playing';
  logoWriters.get(logo)?.();
  const animations=[
   logo.animate([{opacity:0},{opacity:1}],{duration:180,fill:'both'}),
   ...lines('.hero-role,.hero-studio,.hero-meta').map((line,i)=>rollType(line,1100,i*45)),
   ...lines('.hero-heading').map((line,i)=>rollType(line,1450,650+i*130))
  ];
  await Promise.all(animations.map(animation=>animation.finished.catch(()=>{})));
  delete root.dataset.projectEntrance;
  animations.forEach(animation=>animation.cancel());
 }
 function setupProjectHeadlines(){
  if(isHome||!projectPresented||reduced.matches||document.body.classList.contains('mobile-static-project'))return;
  const headings=all('.scroll-headline'),active=new Set();
  document.body.classList.add('headline-reveals-ready');
  const observer=new IntersectionObserver(entries=>{
   entries.forEach(({target,isIntersecting})=>{
    if(!isIntersecting||target.classList.contains('is-type-revealed'))return;
    // The hero's existing opening sequence owns its headline animation.
    if(target.classList.contains('hero-heading')&&root.dataset.projectEntrance)return;
    target.classList.add('is-type-revealed');observer.unobserve(target);
    // Desktop preview titles are replayed by hover, rather than scroll entry.
    if(target.classList.contains('more-title')&&matchMedia('(min-width:1440px) and (hover:hover) and (pointer:fine)').matches)return;
    const svg=target.querySelector('.svg-text');
    const lines=all('.motion-text',target);
    lines.forEach((line,index)=>{
     const animation=rollType(line,1450,index*130);active.add(animation);
     animation.finished.then(()=>{active.delete(animation);animation.cancel();}).catch(()=>{});
    });
   });
  },{rootMargin:'0px 0px -6% 0px',threshold:0});
  document.fonts.ready.then(()=>headings.forEach(el=>observer.observe(el)));
  reduced.addEventListener('change',()=>{
   if(!reduced.matches)return;
   headings.forEach(el=>el.classList.add('is-type-revealed'));
   active.forEach(animation=>animation.cancel());active.clear();observer.disconnect();
  });
 }
 const revealedGalleryTitles=new Set();
 function revealGalleryTitles() {
  if(!isHome||document.body.classList.contains('intro-pending'))return;
  const cards=all('.work-card');
  cards.forEach(card=>{
   const title=card.querySelector('.work-title');
   const rect=title.getBoundingClientRect();
   if(mobileDesign&&(rect.right<=0||rect.left>=innerWidth))return;
   if(rect.bottom<=0||rect.top>=innerHeight||revealedGalleryTitles.has(card.dataset.project))return;
   revealedGalleryTitles.add(card.dataset.project);
   // Keep repeated cycles in sync so recentering never hides a revealed title.
   cards.filter(copy=>copy.dataset.project===card.dataset.project).forEach(copy=>{
    copy.classList.add('is-title-revealed');
    const line=copy.querySelector('.work-title .motion-text');
    const bounds=line.getBoundingClientRect();
    if(!reduced.matches&&bounds.bottom>0&&bounds.top<innerHeight){
     const animation=rollType(line,1450);
     animation.finished.then(()=>animation.cancel()).catch(()=>{});
    }
   });
  });
 }

 async function playMobileIntro(){
  const frames=all('.home-image-window');
  const active=frames.filter(frame=>{const r=frame.getBoundingClientRect();return r.right>0&&r.left<innerWidth;});
  const targets=active.length?active:frames.slice(0,1);
  const reveal=()=>{
   document.body.classList.remove('intro-pending');introMoving=false;
   revealGalleryTitles();schedule();
  };
  if(reduced.matches){reveal();document.body.dataset.intro='complete';return;}
  await Promise.all(targets.flatMap(frame=>all('img',frame).map(img=>{img.loading='eager';return img.decode().catch(()=>{});})));
  introMoving=true;document.body.dataset.intro='centre-reveal';
  const masks=targets.map((frame,index)=>{
   frame.classList.add('intro-reveal-frame');
   return frame.animate([{clipPath:'inset(50% 0 50% 0)',opacity:1},{clipPath:'inset(0% 0 0% 0)',opacity:1}],{duration:850,delay:index*65,easing:'cubic-bezier(.18,.82,.24,1)',fill:'both'});
  });
  let cancelled=false;
  const interrupt=()=>{
   cancelled=true;reveal();masks.forEach(a=>a.cancel());document.body.dataset.intro='complete';
  };
  introFinish=interrupt;
  const events=['touchstart','wheel','keydown'];events.forEach(name=>addEventListener(name,interrupt,{once:true,passive:true}));
  await Promise.all(masks.map(a=>a.finished.catch(()=>{})));
  events.forEach(name=>removeEventListener(name,interrupt));introFinish=null;
  if(cancelled)return;
  reveal();document.body.dataset.intro='chrome';
  const logo=document.querySelector('.signature');logoWriters.get(logo)?.();
  const chrome=[logo.animate([{opacity:0},{opacity:1}],{duration:180,fill:'both'}),
   ...all('.mobile-status .motion-text').map(line=>rollType(line,1100)),
   ...all('.home-title .motion-text').map((line,index)=>rollType(line,1450,650+index*130))];
  await Promise.all(chrome.map(a=>a.finished.catch(()=>{})));chrome.forEach(a=>a.cancel());document.body.dataset.intro='complete';
 }

 async function playIntro() {
  if(!isHome||introStarted)return;
  introStarted=true;
  if(mobileDesign){await playMobileIntro();return;}
  const reveal=()=>{
   document.body.classList.remove('intro-pending','intro-landing');
   document.body.dataset.intro='complete';
   revealGalleryTitles();
  };
  const revealChrome=()=>{
   document.body.classList.remove('intro-pending','intro-landing');
   document.body.dataset.intro='chrome';
   revealGalleryTitles();
   const logo=document.querySelector('.signature');
   logoWriters.get(logo)?.();
   const roll=(selector,duration,delay,stagger,easing)=>all(selector).map((line,index)=>rollType(line,duration,delay+index*stagger,easing));
   const chrome=[
    logo.animate([{opacity:0},{opacity:1}],{duration:180,fill:'both'}),
    ...roll('.home-contact .motion-text,.home-identity .motion-text',1100,0,45,'cubic-bezier(.18,.82,.24,1)'),
    ...roll('.home-title .motion-text',1450,optionC?650:1140,130,'cubic-bezier(.18,.82,.24,1)')
   ];
   const optionLink=document.querySelector('.option-a-link');
   if(optionLink)chrome.push(optionLink.animate([{opacity:0},{opacity:1}],{duration:400,delay:1650,fill:'both'}));
   Promise.all(chrome.map(a=>a.finished)).then(()=>{chrome.forEach(a=>a.cancel());document.body.dataset.intro='complete';});
  };
  if(reduced.matches){reveal();return;}
  let animations=[],galleryReveals=[],filmDrops=[],targets=[],cleanupTimer,unfoldTimer,stackTimer,centerStack=null,cancelled=false;
  const cancelEvents=['wheel','touchstart','keydown'];
  const openingViewport={width:innerWidth,height:innerHeight};
  // Reload can change the browser chrome by a few pixels. That is not a
  // user interruption and must not replace the opening with a sudden reveal.
  const cancelResize=()=>{
   if(Math.abs(innerWidth-openingViewport.width)>2||Math.abs(innerHeight-openingViewport.height)>48)finish();
  };
  const finish=(withChrome=false)=>{
   if(cancelled)return;
   cancelled=true;
   [cleanupTimer,unfoldTimer,stackTimer].forEach(clearTimeout);
   cancelEvents.forEach(name=>removeEventListener(name,finish));
   removeEventListener('resize',cancelResize);
   // Reveal the unchanged live frames before releasing their final transforms.
   if(withChrome===true)revealChrome();else reveal();
   const keepGalleryReveal=withChrome===true;
   // Keep the finished reveal masks and compositor layers attached. Clearing them at
   // landing forces a new raster pass just as the rest of the page appears.
   // Finished, filled effects are static; they do not run an animation loop.
   filmDrops.forEach(drop=>drop.remove());
   animations.forEach(animation=>{if(!keepGalleryReveal||!galleryReveals.includes(animation))animation.cancel();});
   targets.forEach(({frame})=>{
    if(!keepGalleryReveal)frame.classList.remove('intro-moving-frame','intro-reveal-frame');
   });
   centerStack?.remove();
   introMoving=false;
   all('video[data-video]').forEach(video=>{if(video.dataset.visible==='true')playVideo(video);});
   introFinish=null;schedule();
  };
  introFinish=finish;
  cancelEvents.forEach(name=>addEventListener(name,finish,{once:true,passive:true}));
  addEventListener('resize',cancelResize,{passive:true});
  try {
   // Measure after the normal layout, loop positioning and centre scaling settle.
   prepareLoop();schedule();
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(cancelled)return;
   const cards=all('.work-card',streamColumn);
   const first=Math.max(0,cards.findIndex(card=>card.querySelector('.home-image-window').getBoundingClientRect().bottom>0));
   const selected=cards.slice(first,first+8);
   targets=selected.map(card=>{
    const frame=card.querySelector('.home-image-window');
    const rect=frame.getBoundingClientRect(),width=frame.offsetWidth;
    return {card,frame,rect,width,height:rect.height/(rect.width/width)};
   });
   const centreX=innerWidth/2,centreY=innerHeight/2;
   const totalHeight=targets.reduce((sum,item)=>sum+item.height,0)+10*(targets.length-1);
   const stackScale=Math.min(.24,innerHeight*.72/totalHeight);
   let stackY=centreY-totalHeight*stackScale/2;
   const decode=[];
   targets.forEach((target,index)=>{
    // Animate the existing frame: no cloned media or source replacement at landing.
    all('img',target.frame).forEach(img=>{
     img.loading='eager';
     // A GIF/source change can reject decode even though the picture is usable.
     // It must not cancel the entire opening sequence.
     decode.push(img.decode().catch(()=>{}));
    });
    const i=index-(targets.length-1)/2;
    const finalScale=target.rect.width/target.width;
    const localTransform=(x,y,scale)=>`translate3d(${(x-target.rect.left)/finalScale}px,${(y-target.rect.top)/finalScale}px,0) scale(${scale/finalScale})`;
    const entryScale=(phone.matches?14:18)/Math.max(target.width,target.height);
    const mix=(a,b,t)=>a+(b-a)*t;
    const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
    const stackOffset=stackY+target.height*stackScale/2-centreY;
    // Overlap spreading, turning, growth and landing on one continuous curve.
    // Dense compositor keyframes preserve velocity through the diagonal turn.
    target.frames=Array.from({length:121},(_,step)=>{
     const t=step/120;
     const spread=smooth(t/.36),turn=smooth(t/.66);
     const growth=Math.sin(Math.min(1,t/.65)*Math.PI/2),land=smooth((t-.10)/.90);
     const angle=turn*Math.PI/2;
     const row=i*19*spread;
     const miniScale=mix(entryScale,stackScale,growth);
     const scale=mix(miniScale,finalScale,land);
     const cx=mix(centreX+row*Math.cos(angle),target.rect.left+target.rect.width/2,land);
     const cy=mix(centreY+mix(row,stackOffset,growth)*Math.sin(angle),target.rect.top+target.rect.height/2,land);
     const x=cx-target.width*scale/2,y=cy-target.height*scale/2;
     return {offset:t,transform:localTransform(x,y,scale),opacity:1};
    });
    // Every thumbnail follows the same vertical path at a constant small size.
    // It lands at the exact start of the unfolding: no lateral arc or scale snap.
    target.dropFrames=Array.from({length:41},(_,step)=>{
     const t=step/40,p=smooth(t);
     const cy=centreY-(phone.matches?60:76)*(1-p);
     return {offset:t,transform:localTransform(centreX-target.width*entryScale/2,cy-target.height*entryScale/2,entryScale),opacity:smooth(t/.10)};
    });
    stackY+=(target.height+10)*stackScale;
   });
   await Promise.all(decode);
   if(cancelled)return;
   if(optionD){
    // Full-size photographs fall vertically in their own layout positions.
    // A gently dimmed landing image remains underneath the centre-out reveal,
    // avoiding a hide/show flash between the two deliberately separate beats.
    filmDrops=targets.map(target=>{
     const clone=target.frame.cloneNode(true);
     clone.classList.add('intro-film-drop');clone.setAttribute('aria-hidden','true');
     clone.querySelectorAll('input,[id]').forEach(el=>el.matches('input')?el.remove():el.removeAttribute('id'));
     all('video',clone).forEach(video=>{
      const poster=document.createElement('img');poster.src=video.poster;poster.alt='';
      poster.className=video.className;poster.style.cssText=video.style.cssText;video.replaceWith(poster);
     });
     Object.assign(clone.style,{position:'absolute',left:'0',top:'0',width:target.width+'px',height:target.height+'px',visibility:'hidden'});
     target.card.append(clone);return clone;
    });
    await Promise.race([
     Promise.all(filmDrops.flatMap(drop=>all('img',drop).map(img=>img.decode().catch(()=>{})))),
     new Promise(resolve=>setTimeout(resolve,1500))
    ]);
    if(cancelled)return;
    introMoving=true;
    targets.forEach(({frame})=>{
     frame.classList.add('intro-reveal-frame','intro-film-window');
     all('video',frame).forEach(video=>video.pause());
    });
    const fallDuration=1050,stagger=80,revealDuration=950;
    const easing='cubic-bezier(.18,.78,.25,1)';
    const distance=Math.min(innerHeight*.72,720);
    document.body.dataset.intro='film-dropping';
    animations=filmDrops.flatMap((drop,index)=>{
     const target=targets[index],localDistance=distance/(target.rect.width/target.width);
     const delay=index*stagger;
     drop.style.visibility='visible';
     return [
      drop.animate([
       {offset:0,transform:`translateY(${-localDistance}px)`,opacity:0},
       {offset:.06,opacity:1},
       {offset:.78,opacity:1},
       {offset:1,transform:'translateY(0px)',opacity:.35}
      ],{duration:fallDuration,delay,easing,fill:'both'}),
      drop.animate([{opacity:.35},{opacity:0}],{duration:revealDuration,delay:delay+fallDuration,easing,fill:'forwards'})
     ];
    });
    galleryReveals=targets.map(({frame},index)=>frame.animate([
     {clipPath:'inset(50% 0 50% 0)',opacity:1},
     {clipPath:'inset(0% 0 0% 0)',opacity:1}
    ],{duration:revealDuration,delay:fallDuration+index*stagger,easing,fill:'both'}));
    animations.push(...galleryReveals);
    unfoldTimer=setTimeout(()=>{document.body.dataset.intro='film-centre-reveal';},fallDuration);
    const total=fallDuration+revealDuration+(targets.length-1)*stagger;
    cleanupTimer=setTimeout(finish,total+800);
    await Promise.all(animations.map(animation=>animation.finished));finish(true);return;
   }
   if(optionC){
    // The centre stack is a separate, temporary miniature. The live gallery
    // stays at its final coordinates and opens through the same centre mask
    // used by project pages, so there is no flying-image handoff.
    const tileSize=phone.matches?14:18;
    centerStack=document.createElement('div');
    centerStack.className='intro-center-stack';
    centerStack.setAttribute('aria-hidden','true');
    centerStack.style.visibility='hidden';
    centerStack.style.width=centerStack.style.height=tileSize+'px';
    const tiles=targets.map(target=>{
     const tile=document.createElement('div');tile.className='intro-stack-tile';
     const clone=target.frame.cloneNode(true);
     clone.querySelectorAll('input,[id]').forEach(el=>el.matches('input')?el.remove():el.removeAttribute('id'));
     all('video',clone).forEach(video=>{
      const poster=document.createElement('img');poster.src=video.poster;poster.alt='';
      poster.className=video.className;poster.style.cssText=video.style.cssText;video.replaceWith(poster);
     });
     const scale=tileSize/Math.max(target.width,target.height);
     Object.assign(clone.style,{position:'absolute',width:target.width+'px',height:target.height+'px',left:'0',top:'0',transformOrigin:'0 0',transform:`translate3d(${(tileSize-target.width*scale)/2}px,${(tileSize-target.height*scale)/2}px,0) scale(${scale})`});
     tile.append(clone);centerStack.append(tile);return tile;
    });
    document.body.append(centerStack);
    await Promise.all(all('img',centerStack).map(img=>img.decode().catch(()=>{})));
    if(cancelled)return;
    introMoving=true;
    targets.forEach(({frame})=>{
     frame.classList.add('intro-reveal-frame');
     all('video',frame).forEach(video=>video.pause());
    });
    const dropDuration=300,dropStagger=100;
    const stackedAt=dropDuration+(tiles.length-1)*dropStagger;
    const revealAt=stackedAt+350,revealDuration=950;
    const easing='cubic-bezier(.18,.78,.25,1)';
    document.body.dataset.intro='dropping';
    centerStack.style.visibility='visible';
    animations=tiles.map((tile,index)=>tile.animate(Array.from({length:41},(_,step)=>{
     const t=step/40,p=t*t*t*(t*(t*6-15)+10);
     const fade=Math.min(1,t/.10);
     return {offset:t,transform:`translateY(${-(phone.matches?60:76)*(1-p)}px)`,opacity:fade*fade*(3-2*fade)};
    }),{duration:dropDuration,delay:index*dropStagger,easing:'linear',fill:'both'}));
    galleryReveals=targets.map(({frame})=>frame.animate([
     {clipPath:'inset(50% 0 50% 0)',opacity:1},
     {clipPath:'inset(0% 0 0% 0)',opacity:1}
    ],{duration:revealDuration,delay:revealAt,easing,fill:'both'}));
    animations.push(...galleryReveals);
    animations.push(centerStack.animate([
     {clipPath:'inset(0% 0 0% 0)'},
     {clipPath:'inset(50% 0 50% 0)'}
    ],{duration:revealDuration,delay:revealAt,easing,fill:'forwards'}));
    stackTimer=setTimeout(()=>{document.body.dataset.intro='stacked';},stackedAt);
    unfoldTimer=setTimeout(()=>{document.body.dataset.intro='centre-reveal';},revealAt);
    cleanupTimer=setTimeout(finish,revealAt+revealDuration+800);
    await Promise.all(animations.map(animation=>animation.finished));finish(true);return;
   }
   const dropDuration=300,dropStagger=100,unfoldDuration=2300;
   const unfoldStart=1000;
   introMoving=true;
   targets.forEach(({frame})=>{
    frame.classList.add('intro-moving-frame');
    all('video',frame).forEach(video=>video.pause());
   });
   document.body.dataset.intro='dropping';
   // Prepare the moving layers before the shared timeline starts; retain
   // their settled compositor state instead of repainting them at landing.
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(cancelled)return;
   const drops=targets.map((target,index)=>target.frame.animate(target.dropFrames,{duration:dropDuration,delay:index*dropStagger,easing:'linear',fill:'both'}));
   galleryReveals=targets.map((target,index)=>target.frame.animate(target.frames,{duration:unfoldDuration,delay:unfoldStart+index*12,easing:'linear',fill:'forwards'}));
   animations=[...drops,...galleryReveals];
   unfoldTimer=setTimeout(()=>{document.body.dataset.intro='playing';},unfoldStart);
   cleanupTimer=setTimeout(finish,unfoldStart+unfoldDuration+800);
   await Promise.all(animations.map(animation=>animation.finished));finish(true);
  } catch {finish();}
 }

 // Three complete cycles retain native document/touch scrolling. Crossing a cycle boundary
 // changes scroll position by one identical cycle, keeping the visible work continuous.
 function prepareLoop() {
  if (!isHome||mobileDesign) return;
  const column = document.querySelector('.work-column');
  const original = column.querySelector('[data-original-cycle]');
  if (!column.querySelector('[data-cycle-copy]')) {
   for (let i = 0; i < 2; i++) {
    const clone = original.cloneNode(true);
    clone.removeAttribute('data-original-cycle'); clone.dataset.cycleCopy = String(i+1);
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    column.append(clone); observeMedia(clone);
   }
  }
  cycleHeight = original.getBoundingClientRect().height;
  loopBase = column.getBoundingClientRect().top + scrollY;
  if (!loopReady) {
   let returning = null;
   try { returning = sessionStorage.getItem(homeStorage); } catch {}
   const offset = returning === null ? -24 * innerWidth / 1440 : Number(returning);
   if (!phone.matches) scrollTo({top:loopBase + cycleHeight + offset, behavior:'instant'});
   if(optionB)streamScroll=scrollY;
   loopReady = true;
  }
 }
 function maintainLoop() {
  if (!loopReady || pointerDown || shifting || cycleHeight <= 0) return;
  let y = scrollY - loopBase;
  if ((!phone.matches && y < cycleHeight * .45) || y > cycleHeight * 2) {
   const offset = ((y % cycleHeight) + cycleHeight) % cycleHeight;
   shifting = true;
   const before=scrollY;
   scrollTo({top:loopBase + cycleHeight + offset, behavior:'instant'});
   if(optionB)streamScroll+=scrollY-before;
   requestAnimationFrame(() => { shifting = false; schedule(); });
  }
 }

 addEventListener('scroll', () => {
  schedule();
  // Recenter after touch momentum settles, preserving the browser's native gesture.
  if (pointerDown) return;
  clearTimeout(scrollStop); scrollStop = setTimeout(maintainLoop, 110);
  if (!phone.matches) maintainLoop();
 }, {passive:true});
 addEventListener('pointerdown', () => { pointerDown = true; }, {passive:true});
 addEventListener('pointerup', () => { pointerDown = false; clearTimeout(scrollStop); scrollStop = setTimeout(maintainLoop, 180); }, {passive:true});
 addEventListener('pointercancel', () => { pointerDown = false; }, {passive:true});
 addEventListener('resize', () => { sizeLayouts(); prepareLoop(); schedule(); }, {passive:true});
 window.visualViewport?.addEventListener('resize', () => { sizeLayouts(); schedule(); }, {passive:true});
 addEventListener('pageshow', () => { prepareLoop(); schedule(); });
 document.fonts.ready.then(() => { sizeLayouts(); prepareLoop(); schedule(); playIntro(); revealProjectChrome(); });
 if(isHome)setTimeout(playIntro,1200);
 document.addEventListener('visibilitychange', () => {
  all('video[data-video]').forEach(video => {
   if (document.hidden) video.pause(); else if (video.dataset.visible === 'true') playVideo(video);
  });
 });
 reduced.addEventListener('change', () => {
  if(reduced.matches)introFinish?.();
  all('video[data-video]').forEach(video => reduced.matches ? video.pause() : (video.dataset.visible === 'true' && playVideo(video)));
  all('[data-animated]').forEach(img => { if (reduced.matches && img.dataset.poster) img.src = img.dataset.poster; });
  schedule();
 });
 // Delegate so the repeated homepage cycles keep their comparison controls.
 let comparisonDrag = null;
 const moveComparison = (slider, clientX) => {
  const bounds = slider.getBoundingClientRect();
  slider.value = String(Math.round(Math.max(0, Math.min(100, (clientX - bounds.left) / bounds.width * 100))));
  slider.closest('[data-comparison]').style.setProperty('--split', slider.value + '%');
 };
 document.addEventListener('pointerdown', event => {
  const slider = event.target.closest('[data-comparison] input[type="range"]');
  if (!slider || event.button !== 0) return;
  event.preventDefault();
  slider.focus({preventScroll:true});
  slider.setPointerCapture(event.pointerId);
  comparisonDrag = {slider, pointerId:event.pointerId};
  moveComparison(slider, event.clientX);
 });
 document.addEventListener('pointermove', event => {
  if (comparisonDrag?.pointerId === event.pointerId) moveComparison(comparisonDrag.slider, event.clientX);
 });
 const endComparisonDrag = event => {
  if (comparisonDrag?.pointerId !== event.pointerId) return;
  const {slider, pointerId} = comparisonDrag;
  if (event.type === 'pointerup') moveComparison(slider, event.clientX);
  comparisonDrag = null;
  if (slider.hasPointerCapture(pointerId)) slider.releasePointerCapture(pointerId);
 };
 document.addEventListener('pointerup', endComparisonDrag);
 document.addEventListener('pointercancel', endComparisonDrag);
 document.addEventListener('input', event => {
  const slider = event.target.closest('[data-comparison] input[type="range"]');
  if (slider) slider.closest('[data-comparison]').style.setProperty('--split', slider.value + '%');
 });
 document.addEventListener('click', event => {
  if (event.target.closest('[data-comparison] input[type="range"]')) {
   event.preventDefault();
   event.stopImmediatePropagation();
  }
 });
 document.addEventListener('click', event => {
  if (isHome && event.target.closest('.work-card')) {
   try { sessionStorage.setItem(homeStorage, String(cycleHeight ? (scrollY-loopBase) % cycleHeight : scrollY)); } catch {}
  }
 });
 if(homeVariant){
  all('.signature').forEach(a=>a.href=`/${homeVariant}/`);
  all('.work-card').forEach(a=>a.href+=`?from=${homeVariant}`);
 }
 prepareLoop(); schedule();
 setupProjectHeadlines();
 addEventListener('portfolio:project-presented',()=>{
  projectPresented=true;
  delete root.dataset.projectImageEntrance;
  setupProjectHeadlines();revealProjectChrome();
 });
 if(isHome){
  document.body.classList.add('gallery-type-ready');
  const titleObserver=new IntersectionObserver(revealGalleryTitles,{threshold:0});
  all('.work-title').forEach(title=>titleObserver.observe(title));
  if(mobileDesign)streamColumn.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
   event.preventDefault();streamColumn.scrollBy({left:(event.key==='ArrowRight'?1:-1)*373,behavior:reduced.matches?'instant':'smooth'});
  });
 }
 all('[data-pan-fit] img').forEach(img=>img.addEventListener('load',schedule));

 // A quiet return header follows an intentional upward scroll. Keep it out
 // of the opening sequence and ignore the homepage ribbon's loop recentering.
 if(!document.body.classList.contains('contact-page')){
  const originalLogo=document.querySelector('.signature');
  if(originalLogo){
   const header=document.createElement('header');
   header.className='scroll-return-header';
   header.setAttribute('aria-label','Home and contact');
   header.setAttribute('aria-hidden','true');header.inert=true;
   const brand=originalLogo.cloneNode(true);
   brand.className='scroll-header-logo';
   all('path',brand).forEach(path=>path.removeAttribute('style'));
   const contact=document.createElement('a');
   contact.className='availability scroll-header-contact';
   contact.setAttribute('aria-label','Open to work — about and contact');
   const params=new URLSearchParams();
   const variant=homeVariant||([].includes(fromVariant)?fromVariant:null);
   if(variant)params.set('from',variant);
   params.set('return',location.pathname+(variant&&!isHome?'?from='+variant:''));
   contact.href='/contact?'+params;
   contact.innerHTML='<i aria-hidden="true"></i><span>OPEN TO WORK</span>';
   header.append(brand,contact);document.body.append(header);
   setupLogo(brand);
   let headerY=Math.max(0,scrollY),direction=0,travel=0,visible=false;
   const showHeader=show=>{
    if(show===visible)return;
    visible=show;header.classList.toggle('is-visible',show);
    document.body.classList.toggle('scroll-header-visible',show);
    header.inert=!show;header.setAttribute('aria-hidden',String(!show));
   };
   addEventListener('scroll',()=>{
    const y=Math.max(0,scrollY),delta=y-headerY;headerY=y;
    if(introMoving||!projectPresented||shifting||Math.abs(delta)>innerHeight*.9){direction=0;travel=0;return;}
    if(y<160){showHeader(false);direction=0;travel=0;return;}
    if(Math.abs(delta)<.5)return;
    const next=delta>0?1:-1;
    if(next!==direction){travel=0;direction=next;}
    travel+=Math.abs(delta);
    if(travel>=16)showHeader(direction<0);
   },{passive:true});
   addEventListener('pageshow',()=>{headerY=Math.max(0,scrollY);direction=0;travel=0;showHeader(false);});
  }
 }
})();

'use strict';
(() => {
const $=(selector,root=document)=>root.querySelector(selector);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const still=false;
// Preserve the previously approved clothing mesh, spring response, fixed rail and timing.
document.querySelectorAll('[data-clothes]').forEach(initClothes);
function initClothes(box){
 const image=$('img',box),canvas=$('canvas',box);if(reduced.matches||still)return;const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true});if(!gl)return;
 const vs=`attribute vec2 a;varying vec2 uv;uniform float force[6];void main(){uv=a;float y=a.y;float bend=pow(clamp((y-.24)/.73,0.,1.),1.6);float dx=0.;for(int i=0;i<6;i++){float center=.13+float(i)*.148;float d=a.x-center;float influence=exp(-d*d*110.);dx+=force[i]*influence*bend;}gl_Position=vec4((a.x+dx)*2.-1.,1.-a.y*2.,0.,1.);}`;
 const fs=`precision mediump float;varying vec2 uv;uniform sampler2D tex;void main(){gl_FragColor=texture2D(tex,uv);}`;
 function shader(type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))return null;return s}
 let v=shader(gl.VERTEX_SHADER,vs),f=shader(gl.FRAGMENT_SHADER,fs);if(!v||!f)return;const program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;gl.useProgram(program);
 const verts=[],nx=64,ny=48;for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const l=x/nx,r=(x+1)/nx,t=y/ny,b=(y+1)/ny;verts.push(l,t,r,t,l,b,l,b,r,t,r,b)}gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);const force=gl.getUniformLocation(program,'force[0]');const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 let ready=false,frame=0,last=0,active=false,intro=0,demoDone=false;const amp=new Float32Array(6),velocity=new Float32Array(6);
 function size(){const r=box.getBoundingClientRect();canvas.width=Math.round(Math.min(1800,r.width*devicePixelRatio));canvas.height=Math.round(canvas.width*image.naturalHeight/image.naturalWidth);gl.viewport(0,0,canvas.width,canvas.height)}
 function draw(){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1fv(force,amp);gl.drawArrays(gl.TRIANGLES,0,verts.length/2)}
 function tick(now){if(!active||!ready)return;const dt=Math.min(.025,(now-last)/1000||.016);last=now;let energy=0;for(let i=0;i<6;i++){velocity[i]+=(-70*amp[i]-10*velocity[i])*dt;amp[i]+=velocity[i]*dt;amp[i]=Math.max(-.035,Math.min(.035,amp[i]));energy+=Math.abs(amp[i])+Math.abs(velocity[i]);}if(intro&&now-intro<2600){for(let i=0;i<6;i++)amp[i]+=.00105*Math.sin((now-intro)/250-i*.7)*Math.sin(Math.PI*(now-intro)/2600);energy+=1}else intro=0;draw();if(energy>.00006)frame=requestAnimationFrame(tick);else{amp.fill(0);draw();active=false}}
 function wake(){if(!active){active=true;last=performance.now();frame=requestAnimationFrame(tick)}}
 function setup(){if(ready)return;size();gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);ready=true;box.classList.add('is-ready');draw()}
 if(image.complete)setup();else image.addEventListener('load',setup,{once:true});new ResizeObserver(()=>{if(ready){size();draw()}}).observe(box);
 let pointer=null;box.addEventListener('pointermove',e=>{if(!ready)return;const r=box.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(y<.22)return;intro=0;const delta=pointer?Math.max(-.06,Math.min(.06,(e.clientX-pointer)/r.width)):.01;pointer=e.clientX;for(let i=0;i<6;i++){const d=x-(.13+i*.148);velocity[i]+=delta*Math.exp(-d*d*90)*2.6;}wake()});box.addEventListener('pointerleave',()=>pointer=null);box.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Enter',' '].includes(e.key)){e.preventDefault();intro=0;for(let i=0;i<6;i++)velocity[i]+=(e.key==='ArrowLeft'?-.06:.06)*Math.sin(i+1);wake()}});
 const obs=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting&&!demoDone){demoDone=true;const run=()=>{intro=performance.now();wake()};if(ready)run();else image.addEventListener('load',run,{once:true});obs.disconnect()}}),{threshold:.4});obs.observe(box);
}

// Repeat the approved reveal demonstration once, then leave the slider under visitor control.
document.querySelectorAll('[data-comparison]').forEach(box=>{
 const range=$('input',box);if(!range)return;let used=false,frame=0,timer=0;
 range.addEventListener('click',event=>event.preventDefault());
 const set=value=>{range.value=String(value);box.style.setProperty('--split',value+'%')};
 const cancel=()=>{used=true;clearTimeout(timer);cancelAnimationFrame(frame)};
 ['input','pointerdown','keydown'].forEach(event=>range.addEventListener(event,cancel));
 const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;obs.disconnect();
  if(reduced.matches)return;
  Promise.all([...box.querySelectorAll('img')].map(image=>image.decode().catch(()=>{}))).then(()=>{
   if(used)return;
   timer=setTimeout(()=>{if(used)return;const start=performance.now();
    const tick=now=>{if(used)return;const p=Math.min(1,(now-start)/3300);set(50+39*Math.sin(p*Math.PI*2)*Math.sin(p*Math.PI));if(p<1)frame=requestAnimationFrame(tick);else set(50)};
    frame=requestAnimationFrame(tick);
   },350);
  });
 }),{threshold:.4});obs.observe(box);
});
})();

'use strict';
(() => {
 // Prepare the destination so its actual hero can open from the centre
 // before normal navigation, without stretching a thumbnail or swapping images.
 if(window.self!==window.top)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const sourceURL=location.href,sourceTitle=document.title;
 const sourceContent=[...document.body.children];
 let prepared=null,opening=false,presented=null;
 const active=[];
 const reset=()=>{
  active.splice(0).forEach(el=>el.remove());
  prepared?.frame.remove();prepared=null;opening=false;
  presented?.remove();presented=null;
  sourceContent.forEach(el=>{el.inert=false;});
  document.body.classList.remove('is-project-opening','is-project-presented');
  delete document.body.dataset.projectTransition;
 };
 addEventListener('pageshow',event=>{
  if(event.persisted&&location.pathname!==new URL(sourceURL).pathname){location.reload();return;}
  reset();
 });
 addEventListener('popstate',()=>{
  if(location.pathname===new URL(sourceURL).pathname){reset();document.title=sourceTitle;}
  else location.reload();
 });
 const prepare=href=>{
  if(prepared?.href===href)return prepared.promise;
  prepared?.frame.remove();
  const frame=document.createElement('iframe');
  frame.className='project-preload';frame.tabIndex=-1;
  frame.setAttribute('aria-hidden','true');frame.title='Project transition preview';
  const url=new URL(href);url.searchParams.set('transition-preview','1');
  const promise=new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('Project preview timed out')),5000);
   frame.addEventListener('load',async()=>{
    try{
     const doc=frame.contentDocument;
     await doc.fonts.ready;
     const hero=doc.querySelector('.project-hero>.hero-image');
     if(!hero)throw new Error('Missing project image');
     await Promise.all([...hero.querySelectorAll('img')].map(img=>img.decode().catch(()=>{})));
     await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
     // Project links use the same prepared page, including links in its footer.
     doc.addEventListener('pointerover',preloadLink);
     doc.addEventListener('pointerout',leaveLink);
     doc.addEventListener('focusin',preloadLink);
     doc.addEventListener('click',openLink);
     clearTimeout(timeout);resolve({frame,hero});
    }catch(error){clearTimeout(timeout);reject(error);}
   },{once:true});
  });
  // Hover preloading is optional; a failed preview falls back to a regular link.
  promise.catch(()=>{});
  prepared={href,frame,promise};frame.src=url.href;document.body.append(frame);
  return promise;
 };
 const linkFor=target=>target.closest('.work-card,.more-card');
 // Preload only after a short hover, so sweeping across the rail does not load every project at once.
 let hoverTimer=null,hoverHref=null;
 function preloadLink(event){
  const link=linkFor(event.target);
  if(!link||opening||reduced.matches||event.target.closest('input'))return;
  if(event.type==='focusin'){clearTimeout(hoverTimer);hoverTimer=null;hoverHref=null;prepare(link.href);return;}
  if(hoverHref===link.href)return;
  clearTimeout(hoverTimer);hoverHref=link.href;
  hoverTimer=setTimeout(()=>{hoverTimer=null;prepare(link.href);},140);
 }
 function leaveLink(event){
  const link=linkFor(event.target);
  if(!link||(event.relatedTarget&&link.contains(event.relatedTarget)))return;
  if(hoverHref===link.href){clearTimeout(hoverTimer);hoverTimer=null;hoverHref=null;}
 }
 document.addEventListener('pointerover',preloadLink);
 document.addEventListener('pointerout',leaveLink);
 document.addEventListener('focusin',preloadLink);
 async function openLink(event){
  const link=linkFor(event.target);
  if(!link&&event.target.ownerDocument!==document){
   const anchor=event.target.closest('a');
   if(anchor&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){
    const url=new URL(anchor.href);
    if(url.origin===location.origin&&!url.hash){event.preventDefault();location.assign(url.href);}
   }
   return;
  }
  if(!link||event.defaultPrevented||event.target.closest('input')||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(reduced.matches){
   if(event.target.ownerDocument!==document){event.preventDefault();location.assign(link.href);}
   return;
  }
  const source=link.querySelector('.home-image-window,.more-image');
  if(!source)return;
  event.preventDefault();
  if(opening)return;
  opening=true;
  const href=link.href;
  document.body.classList.add('is-project-opening');
  const backdrop=document.createElement('div');backdrop.className='project-transition-backdrop';
  document.body.append(backdrop);active.push(backdrop);
  backdrop.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out',fill:'forwards'});
  try{
   const {frame,hero}=await prepare(href);
   document.body.dataset.projectTransition='centre-opening';
   // Reveal the final image through a centre-out mask. Its dimensions, crop
   // and position stay fixed throughout, including the final navigation handoff.
   const reveal=hero.animate([
    {clipPath:'inset(49.5% 0 49.5% 0)'},
    {clipPath:'inset(0% 0 0% 0)'}
   ],{duration:950,easing:'cubic-bezier(.18,.78,.25,1)',fill:'both'});
   frame.classList.add('is-presented');backdrop.style.visibility='hidden';
   await reveal.finished;
   document.body.dataset.projectTransition='landed';
   // Keep the already decoded, revealed document. A second document navigation
   // discards its painted image and can expose a blank frame in WebKit.
   const previous=presented;
   presented=frame;prepared=null;
   document.body.classList.remove('is-project-opening');
   document.body.classList.add('is-project-presented');
   sourceContent.forEach(el=>{el.inert=true;});
   active.splice(0).forEach(el=>el.remove());
   history.pushState({project:href},'',href);
   document.title=frame.contentDocument.title;
   frame.removeAttribute('aria-hidden');frame.tabIndex=0;
   frame.title=frame.contentDocument.title;
   frame.contentWindow.dispatchEvent(new Event('portfolio:project-presented'));
   previous?.remove();opening=false;frame.focus({preventScroll:true});
  }catch{
   reset();location.assign(href);
  }
 }
 document.addEventListener('click',openLink);
})();

'use strict';
(() => {
 if(!document.body.classList.contains('contact-page'))return;
 const size=()=>{
  const scale=innerWidth/1440;
  document.documentElement.style.setProperty('--contact-scale',String(scale));
  document.documentElement.style.setProperty('--contact-height',`${Math.max(790,innerHeight/scale)}px`);
  requestAnimationFrame(reflowContact);
 };
 size();addEventListener('resize',size,{passive:true});
 const form=document.querySelector('[data-contact-form]');
 const fields=[...form.querySelectorAll('.contact-field')];
 let hovered=null,focused=null;
 const highlight=()=>fields.forEach(field=>field.classList.toggle('is-active',field===(hovered||focused)));
 fields.forEach(field=>{
  const point=event=>{
   if(event.pointerType==='touch'||hovered===field)return;
   hovered=field;highlight();
  };
  field.addEventListener('pointerenter',point);
  field.addEventListener('pointermove',point);
  field.addEventListener('pointerleave',()=>{if(hovered===field){hovered=null;highlight();}});
 });
 form.addEventListener('focusin',event=>{focused=event.target.closest('.contact-field');hovered=null;highlight();});
 form.addEventListener('focusout',event=>{focused=event.relatedTarget?.closest?.('.contact-field')||null;highlight();});
 const send=form.querySelector('.contact-send'),baseline=send.querySelector('.contact-send-baseline');
 function reflowContact(){
  const canvas=document.querySelector('.contact-desktop');
  if(!canvas)return;
  canvas.style.setProperty('--contact-form-shift','0px');
  if(innerWidth<=700||innerWidth>=1440)return;
  const scale=innerWidth/1440,prompt=canvas.querySelector('.contact-prompt');
  const shift=Math.max(0,prompt.getBoundingClientRect().bottom+24-fields[0].getBoundingClientRect().top);
  canvas.style.setProperty('--contact-form-shift',`${shift/scale}px`);
 }
 const measureSend=()=>{
  const rect=send.getBoundingClientRect(),scale=rect.width/send.offsetWidth;
  send.style.setProperty('--send-baseline',`${(baseline.getBoundingClientRect().top-rect.top)/scale}px`);
 };
 measureSend();document.fonts.ready.then(()=>{reflowContact();measureSend();});addEventListener('resize',measureSend,{passive:true});
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const values=new FormData(form),name=values.get('name').trim(),email=values.get('email').trim(),message=values.get('message').trim();
  const body=`${message}\n\nFrom: ${name}\nEmail: ${email}`;
  const query=`subject=${encodeURIComponent(`Portfolio enquiry from ${name}`)}&body=${encodeURIComponent(body)}`;
  form.querySelector('.contact-form-status').textContent='Opening your email draft…';
  location.href=`mailto:anastasiia.yyz@gmail.com?${query}`;
 });
})();
