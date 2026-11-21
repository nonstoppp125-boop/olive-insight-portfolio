(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const root = document.documentElement;
  const body = document.body;
  const studio = $("#studio");
  const backdrop = $("#studioBackdrop");
  const toast = $("#toast");
  const defaults = {theme:"olive",accent:"#87945b",blur:18,opacity:58,radius:24,font:"Manrope",speed:12,borders:true,mascot:true,float:true,reveal:true};
  const palettes = {
    olive:{accent:"#87945b",bright:"#c3ce8d",rgb:"135,148,91",bg:"#10130e"},
    earth:{accent:"#987252",bright:"#d2ad8b",rgb:"152,114,82",bg:"#15110e"},
    forest:{accent:"#527b62",bright:"#a6d0ae",rgb:"82,123,98",bg:"#0d1511"}
  };
  let settings = {...defaults};
  let toastTimer;
  function notify(message){
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(()=>toast.classList.remove("show"),2300);
  }
  function save(){try{localStorage.setItem("oliveInsightDesign",JSON.stringify(settings));}catch(_){}}
  function apply(){
    const palette = palettes[settings.theme] || palettes.olive;
    const accent = settings.accent || palette.accent;
    root.style.setProperty("--accent",accent);
    root.style.setProperty("--accent-bright",palette.bright);
    root.style.setProperty("--accent-rgb",hexToRgb(accent));
    root.style.setProperty("--blur",settings.blur+"px");
    root.style.setProperty("--glass-alpha",String(settings.opacity/100));
    root.style.setProperty("--radius",settings.radius+"px");
    root.style.setProperty("--border-speed",settings.speed+"s");
    root.style.setProperty("--font",settings.font==="system"?"system-ui, sans-serif":"'"+settings.font+"', sans-serif");
    body.classList.toggle("no-border",!settings.borders);
    body.classList.toggle("no-mascot",!settings.mascot);
    body.classList.toggle("no-float",!settings.float);
    body.classList.toggle("no-reveal",!settings.reveal);
    syncControls();
  }
  function hexToRgb(hex){
    const value=hex.replace("#","");
    const full=value.length===3?value.split("").map(x=>x+x).join(""):value;
    const number=parseInt(full,16);
    return [(number>>16)&255,(number>>8)&255,number&255].join(",");
  }
  function syncControls(){
    $("#themeSelect").value=settings.theme; $("#accentPicker").value=settings.accent||palettes[settings.theme].accent;
    $("#blurControl").value=settings.blur; $("#opacityControl").value=settings.opacity; $("#radiusControl").value=settings.radius;
    $("#fontSelect").value=settings.font; $("#speedControl").value=settings.speed;
    $("#mascotToggle").checked=settings.mascot; $("#borderToggle").checked=settings.borders;
    $("#motionToggle").checked=settings.float; $("#revealToggle").checked=settings.reveal;
    $("#accentValue").value=$("#accentValue").textContent=settings.accent.toUpperCase();
    $("#blurValue").value=$("#blurValue").textContent=settings.blur+"px";
    $("#opacityValue").value=$("#opacityValue").textContent=(settings.opacity/100).toFixed(2);
    $("#radiusValue").value=$("#radiusValue").textContent=settings.radius+"px";
    $("#speedValue").value=$("#speedValue").textContent=settings.speed+"s";
  }
  function openStudio(){
    studio.classList.add("open");backdrop.classList.add("show");studio.setAttribute("aria-hidden","false");
    $("#openStudio").setAttribute("aria-expanded","true");
  }
  function closeStudio(){
    studio.classList.remove("open");backdrop.classList.remove("show");studio.setAttribute("aria-hidden","true");
    $("#openStudio").setAttribute("aria-expanded","false");
  }
  $("#openStudio").addEventListener("click",openStudio);
  $("#studioFab").addEventListener("click",openStudio);
  $("#closeStudio").addEventListener("click",closeStudio);
  $("#closeStudioBottom").addEventListener("click",closeStudio);
  backdrop.addEventListener("click",closeStudio);
  document.addEventListener("keydown",event=>{if(event.key==="Escape")closeStudio();});
  $$(".studio-tab").forEach(tab=>tab.addEventListener("click",()=>{
    $$(".studio-tab").forEach(item=>item.classList.toggle("active",item===tab));
    $$(".studio-panel").forEach(panel=>panel.hidden=panel.dataset.panel!==tab.dataset.tab);
  }));
  $("#themeSelect").addEventListener("change",event=>{
    settings.theme=event.target.value;settings.accent=palettes[settings.theme].accent;apply();save();notify("Color direction updated");
  });
  $("#accentPicker").addEventListener("input",event=>{settings.accent=event.target.value;apply();save();});
  [["blurControl","blur"],["opacityControl","opacity"],["radiusControl","radius"],["speedControl","speed"]].forEach(([id,key])=>{
    $("#"+id).addEventListener("input",event=>{settings[key]=Number(event.target.value);apply();save();});
  });
  $("#fontSelect").addEventListener("change",event=>{settings.font=event.target.value;apply();save();});
  [["mascotToggle","mascot"],["borderToggle","borders"],["motionToggle","float"],["revealToggle","reveal"]].forEach(([id,key])=>{
    $("#"+id).addEventListener("change",event=>{settings[key]=event.target.checked;apply();save();});
  });
  $("#resetDesign").addEventListener("click",()=>{settings={...defaults};apply();save();notify("Design settings reset");});
  $("#applyPrompt").addEventListener("click",()=>{
    const prompt=$("#designPrompt").value.trim().toLowerCase();
    if(!prompt){notify("Describe the visual direction first");return;}
    let changed=false;
    if(/brown|earth|warm|copper|tan/.test(prompt)){settings.theme="earth";settings.accent=palettes.earth.accent;changed=true;}
    else if(/forest|green|sage/.test(prompt)){settings.theme="forest";settings.accent=palettes.forest.accent;changed=true;}
    else if(/olive/.test(prompt)){settings.theme="olive";settings.accent=palettes.olive.accent;changed=true;}
    if(/more blur|blurrier|frosted/.test(prompt)){settings.blur=26;changed=true;}
    if(/less blur|sharper|crisp/.test(prompt)){settings.blur=8;changed=true;}
    if(/rounder|rounded|softer corners/.test(prompt)){settings.radius=32;changed=true;}
    if(/square|less rounded|sharper corners/.test(prompt)){settings.radius=12;changed=true;}
    if(/faster border|faster animation/.test(prompt)){settings.speed=7;changed=true;}
    if(/slower border|slower animation/.test(prompt)){settings.speed=22;changed=true;}
    if(/hide mascot|remove mascot/.test(prompt)){settings.mascot=false;changed=true;}
    if(/show mascot/.test(prompt)){settings.mascot=true;changed=true;}
    if(/disable border|stop border/.test(prompt)){settings.borders=false;changed=true;}
    if(/enable border|animated border/.test(prompt)){settings.borders=true;changed=true;}
    if(!changed){notify("No supported visual instruction found yet");return;}
    apply();save();notify("Supported design directions applied");
  });
  $("#menuToggle").addEventListener("click",()=>{
    const nav=$("#mainNav");const isOpen=nav.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded",String(isOpen));
  });
  $$("#mainNav a").forEach(link=>link.addEventListener("click",()=>$("#mainNav").classList.remove("open")));
  function setupReveal(){
    const targets=$$(".section,.intro,.contact-card,.hero-copy,.hero-art");
    targets.forEach(element=>element.classList.add("reveal"));
    if(!("IntersectionObserver" in window)){targets.forEach(element=>element.classList.add("visible"));return;}
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}});
    },{threshold:.08,rootMargin:"0px 0px -35px 0px"});
    targets.forEach(element=>observer.observe(element));
  }
  try{
    const stored=localStorage.getItem("oliveInsightDesign");
    if(stored){const parsed=JSON.parse(stored);settings={...defaults,...parsed};}
  }catch(_){}
  apply();setupReveal();
  window.addEventListener("load",()=>{if(window.lucide)window.lucide.createIcons();});
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)body.classList.add("no-motion");
})();