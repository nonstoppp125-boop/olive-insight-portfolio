(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const root = document.documentElement;
  const body = document.body;
  const studio = $("#studio");
  const backdrop = $("#studioBackdrop");
  const toast = $("#toast");
  const pageLoader=$("#pageLoader");
  function createLoaderOrb(){
    const canvas=$("#loaderOrbCanvas");
    if(!canvas)return;
    const gl=canvas.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:"low-power"});
    if(!gl){canvas.classList.add("orb-unavailable");return;}
    const vertex=`
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.0,1.0);}
    `;
    const fragment=`
      precision mediump float;
      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_progress;
      uniform vec3 u_accent;
      uniform vec3 u_root;
      float softLight(vec2 p,vec2 c,float sx,float sy){vec2 d=(p-c)/vec2(sx,sy);return exp(-dot(d,d));}
      vec3 spectrum(float h){vec3 p=abs(fract(h+vec3(0.0,.6666667,.3333333))*6.0-3.0);return clamp(p-1.0,0.0,1.0);}
      void main(){
        vec2 p=(v_uv-.5)*2.0;p.x*=u_resolution.x/u_resolution.y;
        float r=length(p),radius=.84,edge=1.0-smoothstep(radius-.009,radius+.009,r);
        if(edge<=.001){gl_FragColor=vec4(0.0);return;}
        float z=sqrt(max(0.0,radius*radius-dot(p,p)));
        vec3 n=normalize(vec3(p,z)),viewDir=vec3(0.0,0.0,1.0);
        float facing=max(dot(n,viewDir),0.0),fresnel=pow(1.0-facing,5.0),rim=pow(1.0-z/radius,2.15);
        vec3 reflected=reflect(-viewDir,n),refracted=refract(-viewDir,n,1.0/1.46);
        vec3 refractedR=refract(-viewDir,n,1.0/1.455),refractedB=refract(-viewDir,n,1.0/1.475);
        float envA=softLight(reflected.xy,vec2(-.52,.48),.27,.12),envB=softLight(reflected.xy,vec2(.58,.25),.18,.32),envC=softLight(reflected.xy,vec2(-.18,-.68),.45,.09);
        vec3 reflectionEnv=u_root*.24+vec3(.62,.72,.48)*envA+vec3(.48,.62,.74)*envB+vec3(.75,.82,.59)*envC;
        float transA=softLight(refracted.xy,vec2(-.4,.34),.34,.16),transB=softLight(refracted.xy,vec2(.46,-.18),.24,.3),transC=softLight(refracted.xy,vec2(.05,-.62),.4,.1);
        vec3 transmissionEnv=u_root*.42+u_accent*.62*transA+vec3(.25,.38,.46)*transB+vec3(.48,.57,.34)*transC;
        float dispersion=length(refractedR-refractedB)*2.8;
        vec3 environment=mix(transmissionEnv,reflectionEnv,fresnel);
        float spec1=pow(max(dot(reflect(normalize(vec3(-.45,.72,.85)),n),viewDir),0.0),42.0);
        float spec2=pow(max(dot(reflect(normalize(vec3(.72,-.5,.8)),n),viewDir),0.0),72.0);
        float broadSpec=pow(max(dot(reflect(normalize(vec3(-.72,.42,.9)),n),viewDir),0.0),18.0);
        float sheen=softLight(p,vec2(-.36,.53),.22,.075)+.48*softLight(p,vec2(.47,-.42),.12,.22);
        vec3 glass=mix(u_root*.7,environment,.28+fresnel*.78);
        glass+=u_accent*rim*.34+vec3(1.0)*spec1*.82+vec3(.76,.88,1.0)*spec2*.5+vec3(1.0)*sheen*.16+vec3(1.0)*broadSpec*.22;
        float progress=clamp(u_progress,0.0,1.0);
        float wave=.026*sin(p.x*7.2+u_time*1.45)+.012*sin(p.x*15.0-u_time*1.1)+.006*sin(p.x*24.0+u_time*.72);
        float liquidLine=mix(-radius-.04,radius+.025,progress)+wave;
        float inLiquid=step(p.y,liquidLine)*step(r,radius),depth=clamp((liquidLine-p.y)/(radius*2.0),0.0,1.0);
        vec3 liquidTop=mix(vec3(.94,.97,.91),u_accent,.26),liquidMid=mix(u_accent,vec3(.42,.58,.75),.2),liquidDeep=mix(u_accent*.36,u_root*.18,.32);
        float caustic=sin(p.x*17.0+u_time*1.2+sin(p.y*9.0))*sin(p.y*13.0-u_time*.8);
        vec3 liquid=mix(liquidTop,liquidMid,smoothstep(0.0,.42,depth));
        liquid=mix(liquid,liquidDeep,smoothstep(.48,1.0,depth));
        liquid+=u_accent*(.055+caustic*.035)*softLight(p,vec2(-.25,.12),.6,.55);
        float boundaryGlow=exp(-pow((p.y-liquidLine)/.014,2.0))*step(.005,progress)*step(progress,.995);
        float interfaceGlint=pow(max(0.0,1.0-abs(p.x)/radius),2.0);
        liquid+=vec3(.9,.97,1.0)*boundaryGlow*(.48+.8*interfaceGlint);
        float bubbleA=exp(-pow(length(p-vec2(.22,-.28+mod(u_time*.075,.46))),2.0)/.0014)*step(p.y,liquidLine);
        float bubbleB=exp(-pow(length(p-vec2(-.31,-.46+mod(u_time*.052,.5))),2.0)/.0011)*step(p.y,liquidLine);
        liquid+=vec3(.85,.96,1.0)*(bubbleA+bubbleB)*.72;
        float prismHue=fract(.58+p.x*.19+p.y*.12+rim*.22+u_time*.012);
        vec3 prism=spectrum(prismHue);
        float iridescence=clamp(fresnel*.72+dispersion*.7+boundaryGlow*.22,0.0,.72);
        vec3 color=mix(glass,liquid,inLiquid*.94);
        color=mix(color,prism,iridescence*(.17+rim*.23));
        color+=vec3(.82,.93,.99)*pow(1.0-z/radius,5.5)*.7;
        float outerRim=exp(-pow((r-radius+.012)/.012,2.0));
        color+=mix(vec3(.92,.98,1.0),prism,.42)*outerRim*.92;
        float alpha=edge*clamp(.48+fresnel*.48+rim*.2,0.0,1.0);
        alpha=max(alpha,edge*inLiquid*.93);
        gl_FragColor=vec4(color,alpha);
      }
    `;

    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error(gl.getShaderInfoLog(shader)||"Orb shader compile failed");}return shader;};
    let program;
    try{program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||"Orb shader link failed");}
    catch(error){canvas.classList.add("orb-unavailable");canvas.dataset.orbError=String(error.message||error);console.warn("Liquid orb shader unavailable; CSS glass fallback enabled.",error);return;}
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,"a_position");gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const resolution=gl.getUniformLocation(program,"u_resolution"),time=gl.getUniformLocation(program,"u_time"),progress=gl.getUniformLocation(program,"u_progress"),accentColor=gl.getUniformLocation(program,"u_accent"),rootColorUniform=gl.getUniformLocation(program,"u_root");
    let raf=0,start=performance.now(),lastWidth=0,lastHeight=0;
    const draw=now=>{
      if(!canvas.isConnected){cancelAnimationFrame(raf);gl.deleteBuffer(buffer);gl.deleteProgram(program);return;}
      const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.65),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
      if(w!==lastWidth||h!==lastHeight){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);lastWidth=w;lastHeight=h;}
      const raw=getComputedStyle(pageLoader).getPropertyValue("--loader-progress").trim();
      const amount=Math.max(0,Math.min(1,(parseFloat(raw)||0)/100));
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      const toRgb=value=>{const n=parseInt(value.replace("#",""),16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];};const ac=toRgb(getComputedStyle(root).getPropertyValue("--accent").trim()||"#87945b"),rc=toRgb(getComputedStyle(root).getPropertyValue("--bg").trim()||"#10130e");gl.uniform2f(resolution,w,h);gl.uniform1f(time,(now-start)/1000);gl.uniform1f(progress,amount);gl.uniform3f(accentColor,ac[0],ac[1],ac[2]);gl.uniform3f(rootColorUniform,rc[0],rc[1],rc[2]);gl.drawArrays(gl.TRIANGLES,0,6);
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.addEventListener("webglcontextlost",event=>{event.preventDefault();cancelAnimationFrame(raf);},{once:true});
  }
  createLoaderOrb();
  if(pageLoader){
    const percentNode=$("#loaderPercent");
    const statusNode=$("#loaderStatus");
    const trackNode=$("#loaderTrackFill");
    let progress=0,targetProgress=7,frame=0,completed=false,dismissed=false;
    const paint=()=>{
      frame=0;
      progress+=(targetProgress-progress)*.085;
      if(Math.abs(targetProgress-progress)<.12)progress=targetProgress;
      const shown=Math.min(100,Math.floor(progress));
      pageLoader.style.setProperty("--loader-progress",shown+"%");
      if(percentNode)percentNode.textContent=shown+"%";
      if(trackNode)trackNode.style.width=shown+"%";
      if(progress<targetProgress-.12)frame=requestAnimationFrame(paint);
      else if(completed)dismissLoader();
    };
    const setProgress=(value,label)=>{
      targetProgress=Math.max(targetProgress,Math.min(100,value));
      if(label&&statusNode)statusNode.textContent=label;
      if(!frame)frame=requestAnimationFrame(paint);
    };
    const dismissLoader=()=>{
      if(dismissed||!completed||progress<99.8)return;
      dismissed=true;
      if(percentNode)percentNode.textContent="100%";
      pageLoader.style.setProperty("--loader-progress","100%");
      if(trackNode)trackNode.style.width="100%";
      pageLoader.classList.add("is-hidden");
      window.setTimeout(()=>pageLoader.remove(),520);
    };
    const waitForLoad=()=>document.readyState==="complete"?Promise.resolve():new Promise(resolve=>window.addEventListener("load",resolve,{once:true}));
    const waitForImages=async()=>{
      const images=[...document.images].filter(image=>image.loading!=="lazy"||image.getBoundingClientRect().top<window.innerHeight);
      await Promise.all(images.map(image=>{
        if(image.complete&&image.naturalWidth>0)return Promise.resolve();
        if(typeof image.decode==="function")return image.decode().catch(()=>{});
        return new Promise(resolve=>{image.addEventListener("load",resolve,{once:true});image.addEventListener("error",resolve,{once:true});});
      }));
    };
    const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const prepareExperience=async()=>{
      setProgress(22,"BUILDING THE PAGE");
      await waitForLoad();
      setProgress(58,"LOADING VISUAL RESOURCES");
      await waitForImages();
      const stylesheets=[...document.querySelectorAll('link[rel="stylesheet"]')];
      await Promise.all(stylesheets.map(link=>link.sheet?Promise.resolve():new Promise(resolve=>{link.addEventListener("load",resolve,{once:true});link.addEventListener("error",resolve,{once:true});})));
      setProgress(78,"PREPARING TYPOGRAPHY");
      if(document.fonts&&document.fonts.ready)await document.fonts.ready;
      setProgress(93,"FINISHING THE DETAILS");
      await nextFrame();
      setProgress(100,"YOUR EXPERIENCE IS READY");
      completed=true;
      if(!frame)frame=requestAnimationFrame(paint);
      const waitUntilFull=()=>{if(progress>=99.8){dismissLoader();return;}requestAnimationFrame(waitUntilFull);};
      requestAnimationFrame(waitUntilFull);
    };
    frame=requestAnimationFrame(paint);
    prepareExperience().catch(()=>{
      setProgress(100,"YOUR EXPERIENCE IS READY");
      completed=true;
      const revealWhenPainted=()=>{if(progress>=99.8){dismissLoader();return;}requestAnimationFrame(revealWhenPainted);};
      requestAnimationFrame(revealWhenPainted);
    });
  }
  const defaults = {theme:"olive",rootColor:"#10130e",accent:"#87945b",blur:18,opacity:58,radius:24,font:"system",density:"balanced",contrast:"standard",capsuleSpeed:36,borderSpeed:24,capsule:true,borders:true,mascot:true,float:true,reveal:true};
  const palettes = {
    olive:{accent:"#87945b",bright:"#c3ce8d",rgb:"135,148,91",bg:"#10130e"},
    earth:{accent:"#987252",bright:"#d2ad8b",rgb:"152,114,82",bg:"#15110e"},
    forest:{accent:"#527b62",bright:"#a6d0ae",rgb:"82,123,98",bg:"#0d1511"}
  };
  let settings = {...defaults};
  let toastTimer;
  studio.inert=true;
  function notify(message){
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(()=>toast.classList.remove("show"),2300);
  }
  function save(){try{localStorage.setItem("oliveInsightDesign",JSON.stringify(settings));}catch(_){}}
  function apply(){
    const palette = palettes[settings.theme] || palettes.olive;
    const accent = settings.accent || palette.accent;
    root.style.setProperty("--accent",accent);
    root.style.setProperty("--bg",palette.bg);
    const rootColor=settings.rootColor||palette.bg;
    root.style.setProperty("--bg",rootColor);
    root.style.setProperty("--root-rgb",hexToRgb(rootColor));
    root.style.setProperty("--accent-bright",palette.bright);
    root.style.setProperty("--accent-rgb",hexToRgb(accent));
    root.style.setProperty("--blur",settings.blur+"px");root.style.setProperty("--ambient-softness",Math.round(55+settings.blur*1.1)+"%");
    root.style.setProperty("--glass-alpha",String(settings.opacity/100));
    root.style.setProperty("--radius",settings.radius+"px");
    root.style.setProperty("--capsule-speed",settings.capsuleSpeed+"s");root.style.setProperty("--border-speed",settings.borderSpeed+"s");
    const fontStacks={system:'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',editorial:'ui-serif,Georgia,Cambria,"Times New Roman",serif',technical:'ui-monospace,SFMono-Regular,Consolas,monospace'};
    root.style.setProperty("--font",fontStacks[settings.font]||fontStacks.system);
    const density={compact:[40,56,22,11],balanced:[55,75,30,15],spacious:[68,90,38,20]}[settings.density]||[55,75,30,15];
    root.style.setProperty("--section-space",density[0]+"px");root.style.setProperty("--section-bottom",density[1]+"px");root.style.setProperty("--card-padding",density[2]+"px");root.style.setProperty("--grid-gap",density[3]+"px");
    root.style.setProperty("--muted",settings.contrast==="high"?"#d0d4c5":"#a6aa99");
    body.classList.toggle("no-border",!settings.borders);
    body.classList.toggle("no-capsule",!settings.capsule);
    body.classList.toggle("no-mascot",!settings.mascot);
    body.classList.toggle("no-float",!settings.float);
    body.classList.toggle("no-reveal",!settings.reveal);
    syncControls();
  }
  function rgbToHex(red,green,blue){return "#"+[red,green,blue].map(value=>Number(value).toString(16).padStart(2,"0")).join("");}
  function hexToRgb(hex){
    const value=hex.replace("#","");
    const full=value.length===3?value.split("").map(x=>x+x).join(""):value;
    const number=parseInt(full,16);
    return [(number>>16)&255,(number>>8)&255,number&255].join(",");
  }
  function syncControls(){
    $("#themeSelect").value=settings.theme; $("#accentPicker").value=settings.accent||palettes[settings.theme].accent;
    const rootColor=settings.rootColor||palettes[settings.theme].bg;$("#rootColorPicker").value=rootColor;$("#rootColorHex").value=rootColor.toUpperCase();$("#rootColorValue").textContent=rootColor.toUpperCase();const rootChannels=hexToRgb(rootColor).split(",").map(Number);["rootRed","rootGreen","rootBlue"].forEach((id,index)=>{$("#"+id).value=rootChannels[index];$("#"+id+"Value").textContent=String(rootChannels[index]);});$("#rootRgbSummary").textContent=rootChannels.join(" · ");
    $("#blurControl").value=settings.blur; $("#opacityControl").value=settings.opacity; $("#radiusControl").value=settings.radius;
    $("#fontSelect").value=settings.font; $("#densitySelect").value=settings.density; $("#contrastSelect").value=settings.contrast; $("#speedControl").value=settings.capsuleSpeed; $("#borderSpeedControl").value=settings.borderSpeed;
    $("#mascotToggle").checked=settings.mascot; $("#capsuleToggle").checked=settings.capsule; $("#borderToggle").checked=settings.borders;
    $("#motionToggle").checked=settings.float; $("#revealToggle").checked=settings.reveal;
    $("#accentValue").value=$("#accentValue").textContent=settings.accent.toUpperCase();
    const channels=hexToRgb(settings.accent).split(",").map(Number);
    ["accentRed","accentGreen","accentBlue"].forEach((id,index)=>{$("#"+id).value=channels[index];$("#"+id+"Value").value=$("#"+id+"Value").textContent=String(channels[index]);});
    $("#accentHex").value=settings.accent.toUpperCase();$("#rgbSummary").value=$("#rgbSummary").textContent=channels.join(" · ");
    $("#blurValue").value=$("#blurValue").textContent=(settings.blur*2)+"px";
    $("#opacityValue").value=$("#opacityValue").textContent=(settings.opacity/100).toFixed(2);
    $("#radiusValue").value=$("#radiusValue").textContent=settings.radius+"px";
    $("#speedValue").value=$("#speedValue").textContent=settings.capsuleSpeed+"s";
    $("#borderSpeedValue").value=$("#borderSpeedValue").textContent=settings.borderSpeed+"s";
  }
  let studioTrigger=null;
  function setPageInert(value){
    ["#siteHeader","#home","#siteFooter","#studioFab"].forEach(selector=>{const node=$(selector);if(node)node.inert=value;});
  }
  function openStudio(event){
    studioTrigger=event?.currentTarget||document.activeElement;
    studio.inert=false;studio.classList.add("open");backdrop.classList.add("show");studio.setAttribute("aria-hidden","false");
    $("#openStudio").setAttribute("aria-expanded","true");document.body.style.overflow="hidden";setPageInert(true);
    $("#closeStudio").focus();
  }
  function closeStudio(){
    studio.classList.remove("open");backdrop.classList.remove("show");studio.setAttribute("aria-hidden","true");studio.inert=true;
    $("#openStudio").setAttribute("aria-expanded","false");document.body.style.overflow="";setPageInert(false);
    if(studioTrigger&&typeof studioTrigger.focus==="function")studioTrigger.focus();
  }
  $("#openStudio").addEventListener("click",openStudio);
  $("#studioFab").addEventListener("click",openStudio);
  $("#closeStudio").addEventListener("click",closeStudio);
  $("#closeStudioBottom").addEventListener("click",closeStudio);
  backdrop.addEventListener("click",closeStudio);
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&studio.classList.contains("open")){closeStudio();return;}
    if(event.key==="Tab"&&studio.classList.contains("open")){
      const items=$("button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[href]",studio).filter(el=>el.offsetParent!==null);
      if(!items.length)return;const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  $$(".studio-tab").forEach(tab=>tab.addEventListener("click",()=>{
    $$(".studio-tab").forEach(item=>item.classList.toggle("active",item===tab));
    $$(".studio-panel").forEach(panel=>panel.hidden=panel.dataset.panel!==tab.dataset.tab);
  }));
  $("#themeSelect").addEventListener("change",event=>{
    settings.theme=event.target.value;settings.accent=palettes[settings.theme].accent;settings.rootColor=palettes[settings.theme].bg;apply();save();notify("Color direction updated");
  });
  $("#rootColorPicker").addEventListener("input",event=>{settings.rootColor=event.target.value;apply();save();});
  $("#rootColorHex").addEventListener("change",event=>{const value=event.target.value.trim();if(!/^#[0-9a-f]{6}$/i.test(value)){notify("Enter a valid root HEX color");syncControls();return;}settings.rootColor=value.toLowerCase();apply();save();});
  function updateRootRgb(){const values=["rootRed","rootGreen","rootBlue"].map(id=>Number($("#"+id).value));settings.rootColor=rgbToHex(...values);apply();save();}
  ["rootRed","rootGreen","rootBlue"].forEach(id=>$("#"+id).addEventListener("input",updateRootRgb));
  $("#accentPicker").addEventListener("input",event=>{settings.accent=event.target.value;apply();save();});
  $("#accentHex").addEventListener("change",event=>{
    const value=event.target.value.trim();
    if(!/^#[0-9a-f]{6}$/i.test(value)){notify("Enter a valid HEX color, e.g. #87945B");syncControls();return;}
    settings.accent=value.toLowerCase();apply();save();
  });
  function updateRgbAccent(){
    const values=["accentRed","accentGreen","accentBlue"].map(id=>Number($("#"+id).value));
    settings.accent=rgbToHex(...values);apply();save();
  }
  ["accentRed","accentGreen","accentBlue"].forEach(id=>$("#"+id).addEventListener("input",updateRgbAccent));
  [["blurControl","blur"],["opacityControl","opacity"],["radiusControl","radius"],["speedControl","capsuleSpeed"],["borderSpeedControl","borderSpeed"]].forEach(([id,key])=>{
    $("#"+id).addEventListener("input",event=>{settings[key]=Number(event.target.value);apply();save();});
  });
  $("#fontSelect").addEventListener("change",event=>{settings.font=event.target.value;apply();save();});
  $("#densitySelect").addEventListener("change",event=>{settings.density=event.target.value;apply();save();});
  $("#contrastSelect").addEventListener("change",event=>{settings.contrast=event.target.value;apply();save();});
  [["mascotToggle","mascot"],["capsuleToggle","capsule"],["borderToggle","borders"],["motionToggle","float"],["revealToggle","reveal"]].forEach(([id,key])=>{
    $("#"+id).addEventListener("change",event=>{settings[key]=event.target.checked;apply();save();});
  });
  $("#resetDesign").addEventListener("click",()=>{settings={...defaults};apply();save();notify("Design settings reset");});
  $("#exportDesign").addEventListener("click",()=>{
    const blob=new Blob([JSON.stringify({schema:"olive-insight-design-v1",settings},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="olive-insight-design.json";link.click();URL.revokeObjectURL(url);notify("Design settings exported");
  });
  $("#importDesign").addEventListener("click",()=>$("#importDesignFile").click());
  $("#importDesignFile").addEventListener("change",async event=>{
    const file=event.target.files?.[0];if(!file)return;
    try{
      const data=JSON.parse(await file.text());const incoming=data.settings||data;
      const valid={...defaults};
      if(!incoming||typeof incoming!=="object"||Array.isArray(incoming))throw new Error("Invalid settings");
      valid.theme=Object.hasOwn(palettes,incoming.theme)?incoming.theme:defaults.theme;
      valid.accent=typeof incoming.accent==="string"&&/^#[0-9a-f]{6}$/i.test(incoming.accent)?incoming.accent:palettes[valid.theme].accent;
      valid.rootColor=typeof incoming.rootColor==="string"&&/^#[0-9a-f]{6}$/i.test(incoming.rootColor)?incoming.rootColor:palettes[valid.theme].bg;
      for(const key of ["blur","opacity","radius","capsuleSpeed","borderSpeed"])if(Number.isFinite(Number(incoming[key])))valid[key]=Math.max(({blur:4,opacity:20,radius:8,capsuleSpeed:12,borderSpeed:12})[key],Math.min(({blur:32,opacity:85,radius:40,capsuleSpeed:90,borderSpeed:60})[key],Number(incoming[key])));
      if(Number.isFinite(Number(incoming.speed))&&!Number.isFinite(Number(incoming.capsuleSpeed)))valid.capsuleSpeed=Math.max(12,Math.min(90,Number(incoming.speed)));
      if(["system","editorial","technical"].includes(incoming.font))valid.font=incoming.font;
      if(["compact","balanced","spacious"].includes(incoming.density))valid.density=incoming.density;
      if(["standard","high"].includes(incoming.contrast))valid.contrast=incoming.contrast;
      for(const key of ["capsule","borders","mascot","float","reveal"])if(typeof incoming[key]==="boolean")valid[key]=incoming[key];
      settings=valid;apply();save();notify("Design settings imported");
    }catch(_){notify("Invalid design settings file");}
    event.target.value="";
  });
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
    if(/faster capsule|faster orbit|faster rotation/.test(prompt)){settings.capsuleSpeed=16;changed=true;}
    if(/slower capsule|slower orbit|slower rotation/.test(prompt)){settings.capsuleSpeed=72;changed=true;}
    if(/more transparent|lighter glass|less opaque/.test(prompt)){settings.opacity=34;changed=true;}
    if(/less transparent|darker glass|more opaque/.test(prompt)){settings.opacity=76;changed=true;}
    if(/compact|tighter spacing|less spacing/.test(prompt)){settings.density="compact";settings.radius=14;settings.blur=12;changed=true;}
    if(/spacious|more spacing|airy layout/.test(prompt)){settings.density="spacious";settings.radius=30;settings.blur=22;changed=true;}
    if(/balanced spacing|normal density/.test(prompt)){settings.density="balanced";changed=true;}
    if(/high contrast|stronger text/.test(prompt)){settings.contrast="high";changed=true;}
    if(/standard contrast|softer text/.test(prompt)){settings.contrast="standard";changed=true;}
    if(/system font|system typography|clean typography/.test(prompt)){settings.font="system";changed=true;}
    if(/editorial font|serif font|elegant typography/.test(prompt)){settings.font="editorial";changed=true;}
    if(/technical font|mono font|monospace/.test(prompt)){settings.font="technical";changed=true;}
    if(/disable floating|stop floating|still mascot/.test(prompt)){settings.float=false;changed=true;}
    if(/enable floating|floating mascot/.test(prompt)){settings.float=true;changed=true;}
    if(/hide capsule|remove capsule|disable capsule|stop capsule/.test(prompt)){settings.capsule=false;changed=true;}
    if(/enable capsule|show capsule|animated capsule/.test(prompt)){settings.capsule=true;changed=true;}
    if(/hide mascot|remove mascot/.test(prompt)){settings.mascot=false;changed=true;}
    if(/show mascot/.test(prompt)){settings.mascot=true;changed=true;}
    if(/enable capsule|animated capsule/.test(prompt)){settings.capsule=true;changed=true;}
    if(!changed){notify("No supported visual instruction found yet");return;}
    apply();save();notify("Supported design directions applied");
  });
  // Direct-manipulation scroll rail: pointer position maps to page progress without easing.
  const scrollRail=$("#scrollRail");
  const scrollRailBall=$("#scrollRailBall");
  const scrollRailProgress=$("#scrollRailProgress");
  if(scrollRail&&scrollRailBall&&scrollRailProgress){
    let railFrame=0;
    let railDragging=false;
    let railPointerOffset=0;
    let previousScrollBehavior={html:"",body:""};
    function pageScrollLimit(){return Math.max(0,document.documentElement.scrollHeight-window.innerHeight);}
    function paintScrollRail(){
      railFrame=0;
      const limit=pageScrollLimit();
      const progress=limit?Math.max(0,Math.min(1,window.scrollY/limit)):0;
      const ballSize=scrollRailBall.offsetHeight||21;
      const ballY=progress*Math.max(0,scrollRail.clientHeight-ballSize);
      scrollRail.style.setProperty("--rail-progress",(ballY+ballSize/2).toFixed(2)+"px");
      scrollRail.style.setProperty("--rail-ball-y",ballY.toFixed(2)+"px");
      scrollRailBall.setAttribute("aria-valuenow",String(Math.round(progress*100)));
    }
    function scheduleRailPaint(){if(!railFrame)railFrame=requestAnimationFrame(paintScrollRail);}
    function scrubRail(event){
      const rect=scrollRail.getBoundingClientRect();
      const ballSize=scrollRailBall.offsetHeight||21;
      const travel=Math.max(1,rect.height-ballSize);
      const progress=Math.max(0,Math.min(1,(event.clientY-rect.top-railPointerOffset)/travel));
      const target=progress*pageScrollLimit();
      window.scrollTo({top:target,left:0,behavior:"instant"});
      paintScrollRail();
    }
    scrollRailBall.addEventListener("pointerdown",event=>{
      railDragging=true;
      const ballRect=scrollRailBall.getBoundingClientRect();
      railPointerOffset=Math.max(0,Math.min(ballRect.height,event.clientY-ballRect.top));
      previousScrollBehavior={html:document.documentElement.style.scrollBehavior,body:document.body.style.scrollBehavior};
      document.documentElement.style.scrollBehavior="auto";
      document.body.style.scrollBehavior="auto";
      scrollRail.classList.add("is-dragging");
      try{scrollRailBall.setPointerCapture(event.pointerId);}catch(_){}
      scrubRail(event);
      event.preventDefault();
    });
    scrollRailBall.addEventListener("pointermove",event=>{if(railDragging)scrubRail(event);});
    function stopRailDrag(){
      if(!railDragging)return;
      railDragging=false;
      document.documentElement.style.scrollBehavior=previousScrollBehavior.html;
      document.body.style.scrollBehavior=previousScrollBehavior.body;
      scrollRail.classList.remove("is-dragging");
    }
    scrollRailBall.addEventListener("pointerup",stopRailDrag);
    scrollRailBall.addEventListener("pointercancel",stopRailDrag);
    scrollRailBall.addEventListener("lostpointercapture",stopRailDrag);
    scrollRailBall.addEventListener("keydown",event=>{
      if(event.key==="ArrowDown"||event.key==="ArrowUp"){
        event.preventDefault();
        const delta=window.innerHeight*.18*(event.key==="ArrowDown"?1:-1);
        window.scrollTo({top:Math.max(0,Math.min(pageScrollLimit(),window.scrollY+delta)),behavior:"instant"});
      }else if(event.key==="Home"){event.preventDefault();window.scrollTo({top:0,behavior:"instant"});}
      else if(event.key==="End"){event.preventDefault();window.scrollTo({top:pageScrollLimit(),behavior:"instant"});}
    });
    window.addEventListener("scroll",scheduleRailPaint,{passive:true});
    window.addEventListener("resize",scheduleRailPaint,{passive:true});
    scheduleRailPaint();
  }
  const bgCompanion=$("#bgCompanion");
  let mascotDragging=false,mascotMoved=false,mascotPointerId=null,mascotOffsetX=0,mascotOffsetY=0,mascotFrame=0;
  let mascotNextX=0,mascotNextY=0,mascotPosition=null;
  function applyMascotPosition(x,y,persist=false){
    const maxX=Math.max(0,window.innerWidth-bgCompanion.offsetWidth);
    const maxY=Math.max(0,window.innerHeight-bgCompanion.offsetHeight);
    const left=Math.max(0,Math.min(maxX,x)),top=Math.max(0,Math.min(maxY,y));
    bgCompanion.style.setProperty("--mascot-x",left+"px");
    bgCompanion.style.setProperty("--mascot-y",top+"px");
    if(persist){
      mascotPosition={x:maxX?left/maxX:0,y:maxY?top/maxY:0};
      try{localStorage.setItem("oliveInsightMascotPosition",JSON.stringify(mascotPosition));}catch(_){}
    }
  }
  function restoreMascotPosition(){
    try{mascotPosition=JSON.parse(localStorage.getItem("oliveInsightMascotPosition")||"null");}catch(_){mascotPosition=null;}
    if(mascotPosition&&Number.isFinite(mascotPosition.x)&&Number.isFinite(mascotPosition.y)){
      applyMascotPosition(mascotPosition.x*Math.max(0,window.innerWidth-bgCompanion.offsetWidth),mascotPosition.y*Math.max(0,window.innerHeight-bgCompanion.offsetHeight));
    }else{
      applyMascotPosition(24,Math.max(12,window.innerHeight-bgCompanion.offsetHeight-24));
    }
  }
  function startMascotDrag(event){
    if(body.classList.contains("no-mascot")||!event.target.closest(".mascot"))return;
    mascotDragging=true;mascotMoved=false;mascotPointerId=event.pointerId;
    const rect=bgCompanion.getBoundingClientRect();
    mascotOffsetX=event.clientX-rect.left;mascotOffsetY=event.clientY-rect.top;
    mascotNextX=rect.left;mascotNextY=rect.top;
    bgCompanion.classList.add("is-dragging");
    try{bgCompanion.setPointerCapture(event.pointerId);}catch(_){}
    event.preventDefault();
  }
  function dragMascot(event){
    if(!mascotDragging||event.pointerId!==mascotPointerId)return;
    mascotMoved=true;
    mascotNextX=event.clientX-mascotOffsetX;mascotNextY=event.clientY-mascotOffsetY;
    if(!mascotFrame)mascotFrame=requestAnimationFrame(()=>{
      applyMascotPosition(mascotNextX,mascotNextY);mascotFrame=0;
    });
    event.preventDefault();
  }
  function snapMascotToNearestEdge(){
    const maxX=Math.max(0,window.innerWidth-bgCompanion.offsetWidth);
    const maxY=Math.max(0,window.innerHeight-bgCompanion.offsetHeight);
    const x=Math.max(0,Math.min(maxX,mascotNextX));
    const y=Math.max(0,Math.min(maxY,mascotNextY));
    const edges=[{edge:"left",distance:x},{edge:"right",distance:maxX-x},{edge:"top",distance:y},{edge:"bottom",distance:maxY-y}];
    edges.sort((a,b)=>a.distance-b.distance);
    const edgeInset=8;
    if(edges[0].edge==="left")mascotNextX=edgeInset;
    else if(edges[0].edge==="right")mascotNextX=Math.max(edgeInset,maxX-edgeInset);
    else if(edges[0].edge==="top")mascotNextY=edgeInset;
    else mascotNextY=Math.max(edgeInset,maxY-edgeInset);
    bgCompanion.classList.add("is-snapping");
    applyMascotPosition(mascotNextX,mascotNextY,true);
  }
  function finishMascotDrag(event){
    if(!mascotDragging||event.pointerId!==mascotPointerId)return;
    mascotDragging=false;mascotPointerId=null;
    if(mascotFrame){cancelAnimationFrame(mascotFrame);mascotFrame=0;}
    if(mascotMoved)snapMascotToNearestEdge();
    else{
      const rect=bgCompanion.getBoundingClientRect();
      applyMascotPosition(rect.left,rect.top,true);
      bgCompanion.classList.remove("is-reacting");
      requestAnimationFrame(()=>bgCompanion.classList.add("is-reacting"));
      setTimeout(()=>bgCompanion.classList.remove("is-reacting"),850);
    }
    bgCompanion.classList.remove("is-dragging");
  }
  bgCompanion.addEventListener("transitionend",event=>{
    if(event.propertyName==="transform")bgCompanion.classList.remove("is-snapping");
  });
  bgCompanion.addEventListener("pointerdown",startMascotDrag);
  window.addEventListener("pointermove",dragMascot,{passive:false});
  window.addEventListener("pointerup",finishMascotDrag);
  window.addEventListener("pointercancel",finishMascotDrag);
  window.addEventListener("resize",()=>{
    if(!mascotPosition)return;
    applyMascotPosition(mascotPosition.x*Math.max(0,window.innerWidth-bgCompanion.offsetWidth),mascotPosition.y*Math.max(0,window.innerHeight-bgCompanion.offsetHeight));
  });
  restoreMascotPosition();

  // Persistent touch orb + desktop liquid magnifier.
  const liquidCursor=$("#liquidLensCursor");
  const liquidLensContent=$("#liquidLensContent");
  if(liquidCursor&&liquidLensContent&&(window.matchMedia("(hover: hover) and (pointer: fine)").matches||window.matchMedia("(pointer: coarse)").matches)){
    root.classList.add("has-liquid-cursor");
    const isCoarse=window.matchMedia("(pointer: coarse)").matches;
    const lensTargets=".glass,.card,.timeline-card,.feature-card,.research-grid article,.future-item,.empty-state,.progress-panel,.contact-card,.button,.main-nav a,.tag-list span,.profile-orb";
    let cursorX=-100,cursorY=-100,renderX=-100,renderY=-100,pointerX=0,pointerY=0,cursorRaf=0,currentTarget=null,cloneNode=null,hideTimer=0;
    const cursorEase=.22;
    function cleanClone(node){
      node.querySelectorAll("[id]").forEach(el=>el.removeAttribute("id"));node.removeAttribute("id");node.classList.add("liquid-lens-clone");
      node.querySelectorAll("button,input,select,textarea").forEach(el=>{el.setAttribute("tabindex","-1");el.setAttribute("aria-hidden","true");});return node;
    }
    function setLensTarget(target){
      if(target===currentTarget)return;
      if(currentTarget){currentTarget.classList.remove("liquid-hover-target");currentTarget.style.removeProperty("--liquid-shift-x");currentTarget.style.removeProperty("--liquid-shift-y");}
      currentTarget=target;liquidLensContent.replaceChildren();cloneNode=null;
      if(!target){liquidCursor.classList.remove("is-lens");return;}
      target.classList.add("liquid-hover-target");cloneNode=cleanClone(target.cloneNode(true));
      const rect=target.getBoundingClientRect();cloneNode.style.width=rect.width+"px";cloneNode.style.height=rect.height+"px";
      liquidLensContent.appendChild(cloneNode);liquidCursor.classList.add("is-lens");
    }
    function paintLiquidCursor(){
      cursorRaf=0;renderX+=(cursorX-renderX)*cursorEase;renderY+=(cursorY-renderY)*cursorEase;
      liquidCursor.style.transform="translate3d("+(renderX-36).toFixed(2)+"px,"+(renderY-36).toFixed(2)+"px,0)";
      if(currentTarget&&cloneNode){
        const rect=currentTarget.getBoundingClientRect(),localX=Math.max(0,Math.min(rect.width,pointerX-rect.left)),localY=Math.max(0,Math.min(rect.height,pointerY-rect.top));
        cloneNode.style.left=(36-localX)+"px";cloneNode.style.top=(36-localY)+"px";
        cloneNode.style.setProperty("--lens-origin-x",localX+"px");cloneNode.style.setProperty("--lens-origin-y",localY+"px");
        const nx=(localX/Math.max(1,rect.width)-.5)*2,ny=(localY/Math.max(1,rect.height)-.5)*2;
        currentTarget.style.setProperty("--liquid-shift-x",(nx*1.8).toFixed(2)+"px");currentTarget.style.setProperty("--liquid-shift-y",(ny*1.8).toFixed(2)+"px");
      }
      if(Math.abs(cursorX-renderX)>.12||Math.abs(cursorY-renderY)>.12)cursorRaf=requestAnimationFrame(paintLiquidCursor);
    }
    function updateCursor(event){
      pointerX=event.clientX;pointerY=event.clientY;cursorX=pointerX;cursorY=pointerY;
      const under=document.elementFromPoint(pointerX,pointerY);
      const target=under&&under.closest?(under.closest(lensTargets)||under.closest("p,h1,h2,h3,h4,span,a,button,label,section,article,header,footer,main")||under):null;
      setLensTarget(target&&target!==document.body&&target!==document.documentElement&&!target.closest(".liquid-cursor,.bg-companion")?target:null);
      if(!cursorRaf)cursorRaf=requestAnimationFrame(paintLiquidCursor);
    }
    function showCursor(event){
      if(hideTimer){clearTimeout(hideTimer);hideTimer=0;}
      liquidCursor.style.opacity="1";liquidCursor.style.visibility="visible";liquidCursor.classList.add("is-pressing");updateCursor(event);
    }
    function releaseCursor(event){
      liquidCursor.classList.remove("is-pressing");
      if(isCoarse||event.pointerType==="touch"){
        if(hideTimer)clearTimeout(hideTimer);
        hideTimer=window.setTimeout(()=>{liquidCursor.style.opacity="0";setLensTarget(null);hideTimer=0;},1000);
      }
    }
    window.addEventListener("pointerdown",showCursor,{passive:true});
    window.addEventListener("pointermove",event=>{
      if(event.pointerType==="touch"||!isCoarse){if(hideTimer){clearTimeout(hideTimer);hideTimer=0;}liquidCursor.style.opacity="1";updateCursor(event);}
    },{passive:true});
    window.addEventListener("pointerup",releaseCursor,{passive:true});
    window.addEventListener("pointercancel",releaseCursor,{passive:true});
    document.addEventListener("pointerleave",event=>{if(!isCoarse&&event.pointerType!=="touch"){setLensTarget(null);liquidCursor.style.opacity="0";}},{passive:true});
    window.addEventListener("scroll",()=>{if(currentTarget&&!currentTarget.isConnected)setLensTarget(null);},{passive:true});
  }

  // Scroll-reactive navigation: horizontal fan/cluster motion reverses with scroll direction.
  function setupScrollNav(){
    const nav=$("#mainNav");
    if(!nav)return;
    const links=$("a",nav);
    links.forEach((link,index)=>link.style.setProperty("--nav-index",String(index)));
    let previousY=window.scrollY,lastDirection=1,raf=0;
    const paint=()=>{
      raf=0;
      const y=Math.max(0,window.scrollY);
      const delta=y-previousY;
      if(Math.abs(delta)>0.25)lastDirection=delta>0?1:-1;
      previousY=y;
      const travel=Math.min(1,y/900);
      const spread=3+Math.sin(y/190)*6+travel*2;
      const drift=lastDirection*(1.4+Math.min(3,Math.abs(delta)*.12));
      nav.style.setProperty("--nav-drift",(lastDirection*3.5)+"px");
      nav.style.gap=(20+((Math.sin(y/230)+1)*4))+"px";
      links.forEach((link,index)=>{
        const center=index-(links.length-1)/2;
        const offset=center*spread+index*drift;
        link.style.setProperty("--nav-x",offset.toFixed(2)+"px");
      });
      nav.dataset.scrollDirection=lastDirection>0?"down":"up";
    };
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(paint);};
    window.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule,{passive:true});
    paint();
  }
  setupScrollNav();

  $("#menuToggle").addEventListener("click",()=>{
    const nav=$("#mainNav");const isOpen=nav.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded",String(isOpen));
  });
  $("#mainNav a").forEach(link=>link.addEventListener("click",()=>{
    $("#mainNav").classList.remove("open");
    $("#menuToggle").setAttribute("aria-expanded","false");
  }));
  function setupBorderMotion(){
    if(!("IntersectionObserver" in window))return;
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>entry.target.style.setProperty("--border-play",entry.isIntersecting?"running":"paused"));
    },{rootMargin:"80px"});
    $(".glass").forEach(element=>{element.style.setProperty("--border-play","paused");observer.observe(element);});
  }
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
    if(stored){const parsed=JSON.parse(stored);settings={...defaults,...parsed};if(Number.isFinite(Number(parsed.speed))&&!Number.isFinite(Number(parsed.capsuleSpeed)))settings.capsuleSpeed=Math.max(12,Math.min(90,Number(parsed.speed))); if(typeof parsed.borders!=="boolean")settings.borders=true; if(Number.isFinite(Number(parsed.borderSpeed)))settings.borderSpeed=Math.max(12,Math.min(60,Number(parsed.borderSpeed)));if(!["system","editorial","technical"].includes(settings.font))settings.font="system";}
  }catch(_){}
  apply();setupReveal();setupBorderMotion();
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)body.classList.add("no-motion");

})();