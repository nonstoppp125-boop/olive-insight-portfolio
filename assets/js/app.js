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
  function createLoaderStars(){
    const canvas=$("#loaderStars");if(!canvas)return;
    const ctx=canvas.getContext("2d",{alpha:true,desynchronized:true});if(!ctx)return;
    const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dots=[],width=0,height=0,dpr=1,raf=0,last=0;
    const seed=()=>{
      const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);dpr=Math.min(window.devicePixelRatio||1,1);
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      dots=[];const spacing=2.3;
      for(let y=1.5;y<height;y+=spacing)for(let x=1.5;x<width;x+=spacing){
        const alpha=.025+Math.random()*.16;
        dots.push({x:x+(Math.random()-.5)*1.5,y:y+(Math.random()-.5)*1.5,a:alpha,target:alpha,next:performance.now()+Math.random()*1800,size:.48+Math.random()*.28});
      }
    };
    const draw=now=>{
      if(!canvas.isConnected||!pageLoader||pageLoader.classList.contains("is-hidden")){cancelAnimationFrame(raf);return;}
      if(now-last<50){raf=requestAnimationFrame(draw);return;}
      const dt=Math.min(100,now-last||50);last=now;
      ctx.clearRect(0,0,width,height);ctx.fillStyle="#fff";
      for(const dot of dots){
        if(!reduce&&now>=dot.next){dot.target=.018+Math.random()*.48;dot.next=now+450+Math.random()*2400;}
        dot.a+=(dot.target-dot.a)*(1-Math.pow(.925,dt/16.67));
        ctx.globalAlpha=dot.a;ctx.fillRect(dot.x,dot.y,dot.size,dot.size);
      }
      ctx.globalAlpha=1;
      raf=requestAnimationFrame(draw);
    };
    seed();raf=requestAnimationFrame(draw);
    window.addEventListener("resize",()=>{if(!canvas.isConnected)return;seed();},{passive:true});
  }
  createLoaderStars();
    function createLoaderOrb(){
    const canvas=$("#loaderOrbCanvas");
    if(!canvas)return;
    const fallback=()=>{canvas.classList.add("orb-unavailable");canvas.closest(".loader-vessel")?.classList.add("orb-fallback");};
    let gl=null;
    try{gl=canvas.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:"low-power"});}catch(error){canvas.dataset.orbError=String(error.message||error);fallback();return;}
    if(!gl){fallback();return;}
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
        vec3 reflectionEnv=u_root*.10+vec3(.30,.68,.43)*envA+vec3(.18,.48,.31)*envB+vec3(.76,.94,.82)*envC;
        float transA=softLight(refracted.xy,vec2(-.4,.34),.34,.16),transB=softLight(refracted.xy,vec2(.46,-.18),.24,.3),transC=softLight(refracted.xy,vec2(.05,-.62),.4,.1);
        vec3 transmissionEnv=u_root*.10+vec3(.30,.72,.43)*transA+vec3(.14,.42,.25)*transB+vec3(.72,.91,.78)*transC;
        float dispersion=length(refractedR-refractedB)*2.8;
        vec3 environment=mix(transmissionEnv,reflectionEnv,fresnel);
        float spec1=pow(max(dot(reflect(normalize(vec3(-.45,.72,.85)),n),viewDir),0.0),42.0);
        float spec2=pow(max(dot(reflect(normalize(vec3(.72,-.5,.8)),n),viewDir),0.0),72.0);
        float broadSpec=pow(max(dot(reflect(normalize(vec3(-.72,.42,.9)),n),viewDir),0.0),18.0);
        float sheen=softLight(p,vec2(-.36,.53),.22,.075)+.48*softLight(p,vec2(.47,-.42),.12,.22);
        vec3 glass=mix(u_root*.12,environment,.72+fresnel*.28);
        glass+=u_accent*rim*.18+vec3(1.0)*spec1*.58+vec3(.9,1.0,.92)*spec2*.32+vec3(1.0)*sheen*.12+vec3(1.0)*broadSpec*.18;
        float progress=clamp(u_progress,0.0,1.0);
        float wave=.026*sin(p.x*7.2+u_time*1.45)+.012*sin(p.x*15.0-u_time*1.1)+.006*sin(p.x*24.0+u_time*.72);
        float liquidLine=mix(-radius-.04,radius+.025,progress)+wave;
        float inLiquid=step(p.y,liquidLine)*step(r,radius),depth=clamp((liquidLine-p.y)/(radius*2.0),0.0,1.0);
        vec3 liquidTop=vec3(.78,.94,.82),liquidMid=vec3(.20,.58,.36),liquidDeep=vec3(.035,.22,.12);
        float caustic=sin(p.x*17.0+u_time*1.2+sin(p.y*9.0))*sin(p.y*13.0-u_time*.8);
        vec3 liquid=mix(liquidTop,liquidMid,smoothstep(0.0,.42,depth));
        liquid=mix(liquid,liquidDeep,smoothstep(.48,1.0,depth));
        liquid+=vec3(.28,.66,.42)*(.025+caustic*.018)*softLight(p,vec2(-.25,.12),.6,.55);
        float waveDistance=(p.y-liquidLine)/.014;float boundaryGlow=exp(-waveDistance*waveDistance)*step(.005,progress)*step(progress,.995);
        float interfaceGlint=pow(max(0.0,1.0-abs(p.x)/radius),2.0);
        liquid+=vec3(.86,1.0,.88)*boundaryGlow*(.32+.62*interfaceGlint);
        float bubbleA=exp(-pow(length(p-vec2(.22,-.28+mod(u_time*.075,.46))),2.0)/.0040)*step(p.y,liquidLine);
        float bubbleB=exp(-pow(length(p-vec2(-.31,-.46+mod(u_time*.052,.5))),2.0)/.0032)*step(p.y,liquidLine);
        liquid+=vec3(.82,1.0,.88)*(bubbleA+bubbleB)*.52;
        float prismHue=fract(.58+p.x*.19+p.y*.12+rim*.22+u_time*.012);
        vec3 prism=mix(vec3(.10,.48,.28),vec3(.66,.88,.72),smoothstep(.08,.92,prismHue));
        float iridescence=clamp(fresnel*.72+dispersion*.7+boundaryGlow*.22,0.0,.72);
        vec3 color=mix(glass,liquid,inLiquid*.94);
        color=mix(color,prism,iridescence*(.08+rim*.12));
        color+=vec3(.94,1.0,.96)*pow(1.0-z/radius,5.5)*.48;
        float rimDistance=(r-radius+.012)/.012;float outerRim=exp(-rimDistance*rimDistance);
        color+=mix(vec3(.94,1.0,.96),prism,.24)*outerRim*.78;
        float alpha=edge*clamp(.48+fresnel*.48+rim*.2,0.0,1.0);
        alpha=max(alpha,edge*inLiquid*.72);
        gl_FragColor=vec4(color,alpha);
      }
    `;

    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error(gl.getShaderInfoLog(shader)||"Orb shader compile failed");}return shader;};
    let program;
    try{program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||"Orb shader link failed");}
    catch(error){fallback();canvas.dataset.orbError=String(error.message||error);console.warn("Liquid orb shader unavailable; CSS glass fallback enabled.",error);return;}
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,"a_position");gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const resolution=gl.getUniformLocation(program,"u_resolution"),time=gl.getUniformLocation(program,"u_time"),progress=gl.getUniformLocation(program,"u_progress"),accentColor=gl.getUniformLocation(program,"u_accent"),rootColorUniform=gl.getUniformLocation(program,"u_root");
    let raf=0,start=performance.now(),lastWidth=0,lastHeight=0,lastFrame=0,cachedColors=null;
    const toRgb=value=>{const n=parseInt(value.replace("#",""),16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];};
    const draw=now=>{
      if(!canvas.isConnected||!pageLoader||pageLoader.classList.contains("is-hidden")){cancelAnimationFrame(raf);gl.deleteBuffer(buffer);gl.deleteProgram(program);return;}
      if(now-lastFrame<33){raf=requestAnimationFrame(draw);return;}lastFrame=now;
      if(!cachedColors){const style=getComputedStyle(root);cachedColors={accent:toRgb(style.getPropertyValue("--accent").trim()||"#87945b"),root:toRgb(style.getPropertyValue("--bg").trim()||"#10130e")};}
      const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.25),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
      if(w!==lastWidth||h!==lastHeight){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);lastWidth=w;lastHeight=h;}
      const raw=pageLoader.style.getPropertyValue("--loader-progress")||"0%";
      const amount=Math.max(0,Math.min(1,(parseFloat(raw)||0)/100));
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(resolution,w,h);gl.uniform1f(time,(now-start)/1000);gl.uniform1f(progress,amount);gl.uniform3f(accentColor,...cachedColors.accent);gl.uniform3f(rootColorUniform,...cachedColors.root);gl.drawArrays(gl.TRIANGLES,0,6);
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    canvas.addEventListener("webglcontextlost",event=>{event.preventDefault();cancelAnimationFrame(raf);fallback();},{once:true});
  }
  createLoaderOrb();
  if(pageLoader){
    const percentNode=$("#loaderPercent");
    const statusNode=$("#loaderStatus");
    const trackNode=$("#loaderTrackFill");
    let progress=0,targetProgress=7,frame=0,completed=false,dismissed=false;
    const paint=()=>{
      frame=0;
      progress+=(targetProgress-progress)*.22;
      if(Math.abs(targetProgress-progress)<.2)progress=targetProgress;
      const shown=Math.min(100,Math.floor(progress));
      pageLoader.style.setProperty("--loader-progress",shown+"%");
      if(percentNode)percentNode.textContent=shown+"%";
      if(trackNode)trackNode.style.width=shown+"%";
      if(progress<targetProgress-.2)frame=requestAnimationFrame(paint);
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
    const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const prepareExperience=async()=>{
      setProgress(42,"BUILDING THE PAGE");
      await nextFrame();
      setProgress(78,"FINISHING THE DETAILS");
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
  function createAmbientParticles(){
    const field=$("#ambientParticles")||document.createElement("div");
    if(field.children.length)return;field.id="ambientParticles";field.className="ambient-particles";field.setAttribute("aria-hidden","true");
    const fragment=document.createDocumentFragment();
    const particleCount=Math.max(22,Math.min(220,Math.round(window.innerWidth*window.innerHeight/10000)));
    for(let i=0;i<particleCount;i++){
      const dot=document.createElement("i");dot.className="ambient-particle";
      dot.style.left=(Math.random()*100).toFixed(3)+"%";dot.style.top=(Math.random()*100).toFixed(3)+"%";dot.style.width="1px";dot.style.height="1px";
      dot.style.setProperty("--twinkle-duration",(1.8+Math.random()*6.2).toFixed(2)+"s");
      dot.style.setProperty("--twinkle-delay",(-Math.random()*8).toFixed(2)+"s");
      dot.style.setProperty("--twinkle-min",(0.08+Math.random()*.12).toFixed(2));
      dot.style.setProperty("--twinkle-max",(0.48+Math.random()*.5).toFixed(2));
      fragment.appendChild(dot);
    }
    field.appendChild(fragment);body.prepend(field);
  }
  createAmbientParticles();
  const defaults = {theme:"olive",rootColor:"#10130e",accent:"#87945b",autoAccent:true,blur:18,opacity:58,radius:24,font:"system",typographyV2:true,density:"balanced",contrast:"standard",capsuleSpeed:36,borderSpeed:24,capsule:true,borders:true,mascot:true,float:true,reveal:true,particles:true};
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
    const palette=palettes[settings.theme]||palettes.olive;
    const rootColor=settings.rootColor||palette.bg;
    const derived=deriveRootPalette(rootColor);
    const accent=settings.autoAccent?derived.accent:(settings.accent||palette.accent);
    const accentBright=settings.autoAccent?derived.bright:palette.bright;
    settings.accent=accent;
    root.style.setProperty("--bg",rootColor);root.style.colorScheme=derived.dark?"dark":"light";
    root.style.setProperty("--root-rgb",hexToRgb(rootColor));
    root.style.setProperty("--bg-soft",derived.dark?"#"+rgbChannels(rootColor).map(v=>Math.max(0,Math.round(v*.78)).toString(16).padStart(2,"0")).join(""):"#"+rgbChannels(rootColor).map(v=>Math.min(255,Math.round(v+(255-v)*.13)).toString(16).padStart(2,"0")).join(""));
    root.style.setProperty("--text",derived.text);root.style.setProperty("--muted",settings.contrast==="high"?(derived.dark?"#e4e9e3":relativeLuminance(rootColor)>.72?"#303a33":"#171b18"):derived.muted);
    root.style.setProperty("--brand-hue",derived.brandHue+"deg");root.style.setProperty("--surface-rgb",derived.surface);root.style.setProperty("--line",derived.line);root.style.setProperty("--panel",derived.panel);
    root.style.setProperty("--accent",accent);root.style.setProperty("--accent-bright",accentBright);root.style.setProperty("--accent-deep",derived.accentDeep);root.style.setProperty("--accent-contrast",derived.accentText);
    root.style.setProperty("--accent-rgb",hexToRgb(accent));
    root.style.setProperty("--blur",settings.blur+"px");root.style.setProperty("--ambient-softness",Math.round(55+settings.blur*1.1)+"%");
    root.style.setProperty("--glass-alpha",String(settings.opacity/100));root.style.setProperty("--radius",settings.radius+"px");
    root.style.setProperty("--capsule-speed",settings.capsuleSpeed+"s");root.style.setProperty("--border-speed",settings.borderSpeed+"s");
    const fontStacks={system:'"Trebuchet MS",Arial,Helvetica,sans-serif',editorial:'Georgia,"Times New Roman",serif',technical:'ui-monospace,SFMono-Regular,Consolas,monospace'};
    const displayStacks={system:'"Bodoni MT","Didot","Bodoni 72","Palatino Linotype",Georgia,serif',editorial:fontStacks.editorial,technical:fontStacks.technical};
    root.style.setProperty("--font",fontStacks[settings.font]||fontStacks.system);root.style.setProperty("--display-font",displayStacks[settings.font]||displayStacks.system);
    const density={compact:[40,56,22,11],balanced:[55,75,30,15],spacious:[68,90,38,20]}[settings.density]||[55,75,30,15];
    root.style.setProperty("--section-space",density[0]+"px");root.style.setProperty("--section-bottom",density[1]+"px");root.style.setProperty("--card-padding",density[2]+"px");root.style.setProperty("--grid-gap",density[3]+"px");
    body.classList.toggle("no-border",!settings.borders);body.classList.toggle("no-capsule",!settings.capsule);body.classList.toggle("no-mascot",!settings.mascot);body.classList.toggle("no-float",!settings.float);body.classList.toggle("no-reveal",!settings.reveal);body.classList.toggle("no-particles",!settings.particles);
    syncControls();
  }
  function rgbToHex(red,green,blue){return "#"+[red,green,blue].map(value=>Number(value).toString(16).padStart(2,"0")).join("");}
  function rgbChannels(hex){const value=hex.replace("#","");const full=value.length===3?value.split("").map(x=>x+x).join(""):value;const n=parseInt(full,16);return [(n>>16)&255,(n>>8)&255,n&255];}
  function toHsl([r,g,b]){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0,s=0,l=(max+min)/2;if(d){s=d/(1-Math.abs(2*l-1));switch(max){case r:h=((g-b)/d)%6;break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}h*=60;if(h<0)h+=360;}return [h,s,l];}
  function fromHsl(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let v=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return rgbToHex(...v.map(n=>Math.round((n+m)*255)));}
  function relativeLuminance(hex){return rgbChannels(hex).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
  function deriveRootPalette(hex){
    const channels=rgbChannels(hex),[h,s,l]=toHsl(channels),rootLuminance=relativeLuminance(hex),dark=rootLuminance<.179;
    const hue=s>.16?h:92;
    const accent=fromHsl(hue,dark?Math.max(.34,Math.min(.68,s+.12)):.54,dark?.62:.32);
    const bright=fromHsl(hue,dark?Math.max(.48,Math.min(.78,.78-s*.08)):.27);
    const deep=fromHsl(hue,dark?Math.max(.42,Math.min(.58,.54-s*.05)):.29);
    const panelChannels=dark?channels.map(v=>Math.round(v*.86)):channels.map(v=>Math.round(v+(255-v)*.48));
    const panel="rgba("+panelChannels.join(",")+",.84)";
    const accentLuminance=relativeLuminance(accent);
    return {dark,accent,bright,deep,text:dark?"#f4f6f2":"#171b18",muted:dark?"#b8c1b8":rootLuminance>.72?"#4b554e":"#171b18",brandHue:(((h-145+540)%360)-180),surface:dark?"255,255,255":"0,0,0",line:dark?"rgba(255,255,255,.17)":"rgba(0,0,0,.16)",panel,accentText:accentLuminance>.179?"#101510":"#ffffff",accentDeep:deep};
  }
  function hexToRgb(hex){
    const value=hex.replace("#","");
    const full=value.length===3?value.split("").map(x=>x+x).join(""):value;
    const number=parseInt(full,16);
    return [(number>>16)&255,(number>>8)&255,number&255].join(",");
  }
  function syncControls(){
    $("#themeSelect").value=settings.theme; $("#accentPicker").value=settings.accent||palettes[settings.theme].accent; $("#autoAccentToggle").checked=settings.autoAccent!==false; $("#accentPicker").disabled=settings.autoAccent!==false; $("#accentHex").disabled=settings.autoAccent!==false; ["accentRed","accentGreen","accentBlue"].forEach(id=>$("#"+id).disabled=settings.autoAccent!==false);
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
    settings.theme=event.target.value;settings.rootColor=palettes[settings.theme].bg;settings.autoAccent=true;apply();save();notify("Color direction updated");
  });
  $("#rootColorPicker").addEventListener("input",event=>{settings.rootColor=event.target.value;apply();save();});
  $("#rootColorHex").addEventListener("change",event=>{const value=event.target.value.trim();if(!/^#[0-9a-f]{6}$/i.test(value)){notify("Enter a valid root HEX color");syncControls();return;}settings.rootColor=value.toLowerCase();apply();save();});
  function updateRootRgb(){const values=["rootRed","rootGreen","rootBlue"].map(id=>Number($("#"+id).value));settings.rootColor=rgbToHex(...values);apply();save();}
  ["rootRed","rootGreen","rootBlue"].forEach(id=>$("#"+id).addEventListener("input",updateRootRgb));
  $("#autoAccentToggle").addEventListener("change",event=>{settings.autoAccent=event.target.checked;apply();save();notify(settings.autoAccent?"Accent now follows the root colour":"Manual accent editing enabled");});
  $("#accentPicker").addEventListener("input",event=>{settings.autoAccent=false;settings.accent=event.target.value;apply();save();});
  $("#accentHex").addEventListener("change",event=>{
    const value=event.target.value.trim();
    if(!/^#[0-9a-f]{6}$/i.test(value)){notify("Enter a valid HEX color, e.g. #87945B");syncControls();return;}
    settings.autoAccent=false;settings.accent=value.toLowerCase();apply();save();
  });
  function updateRgbAccent(){
    const values=["accentRed","accentGreen","accentBlue"].map(id=>Number($("#"+id).value));
    settings.autoAccent=false;settings.accent=rgbToHex(...values);apply();save();
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
      valid.autoAccent=typeof incoming.autoAccent==="boolean"?incoming.autoAccent:true;
      valid.rootColor=typeof incoming.rootColor==="string"&&/^#[0-9a-f]{6}$/i.test(incoming.rootColor)?incoming.rootColor:palettes[valid.theme].bg;
      for(const key of ["blur","opacity","radius","capsuleSpeed","borderSpeed"])if(Number.isFinite(Number(incoming[key])))valid[key]=Math.max(({blur:4,opacity:20,radius:8,capsuleSpeed:12,borderSpeed:12})[key],Math.min(({blur:32,opacity:85,radius:40,capsuleSpeed:90,borderSpeed:60})[key],Number(incoming[key])));
      if(Number.isFinite(Number(incoming.speed))&&!Number.isFinite(Number(incoming.capsuleSpeed)))valid.capsuleSpeed=Math.max(12,Math.min(90,Number(incoming.speed)));
      if(["system","editorial","technical"].includes(incoming.font))valid.font=incoming.font;
      if(["compact","balanced","spacious"].includes(incoming.density))valid.density=incoming.density;
      if(["standard","high"].includes(incoming.contrast))valid.contrast=incoming.contrast;
      for(const key of ["capsule","borders","mascot","float","reveal","particles"])if(typeof incoming[key]==="boolean")valid[key]=incoming[key];
      settings=valid;apply();save();notify("Design settings imported");
    }catch(_){notify("Invalid design settings file");}
    event.target.value="";
  });
  $("#applyPrompt").addEventListener("click",()=>{
    const prompt=$("#designPrompt").value.trim().toLowerCase();
    if(!prompt){notify("Describe the visual direction first");return;}
    const rootHex=prompt.match(/(?:root|background|base)(?:\s+(?:colour|color))?\s*(?:to|=|:)?\s*(#[0-9a-f]{6})/i);
    const accentHex=prompt.match(/accent(?:\s+color)?\s*(?:to|=|:)?\s*(#[0-9a-f]{6})/i);
    const namedRoot=prompt.match(/(?:background|root|base)(?:\s+(?:colour|color))?\s*(?:to|=|:)?\s+(black|white|red|blue|green|purple|orange|navy)/i);
    const namedColors={black:"#101010",white:"#f5f5f2",red:"#7f1020",blue:"#102f72",green:"#123f2a",purple:"#38204f",orange:"#6b3210",navy:"#101b35"};
    let changed=false;
    if(rootHex){settings.rootColor=rootHex[1].toLowerCase();settings.autoAccent=true;changed=true;}
    else if(namedRoot){settings.rootColor=namedColors[namedRoot[1].toLowerCase()];settings.autoAccent=true;changed=true;}
    if(accentHex){settings.accent=accentHex[1].toLowerCase();settings.autoAccent=false;changed=true;}
    if(!rootHex&&!namedRoot&&/brown|earth|warm|copper|tan/.test(prompt)){settings.theme="earth";settings.rootColor=palettes.earth.bg;settings.autoAccent=true;changed=true;}
    else if(!rootHex&&!namedRoot&&/forest|green|sage/.test(prompt)){settings.theme="forest";settings.rootColor=palettes.forest.bg;settings.autoAccent=true;changed=true;}
    else if(!rootHex&&!namedRoot&&/olive/.test(prompt)){settings.theme="olive";settings.rootColor=palettes.olive.bg;settings.autoAccent=true;changed=true;}
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
    if(/hide particles|hide stars|disable particles/.test(prompt)){settings.particles=false;changed=true;}
    if(/show particles|show stars|enable particles/.test(prompt)){settings.particles=true;changed=true;}
    if(/hide borders|disable borders|remove animated borders/.test(prompt)){settings.borders=false;changed=true;}
    if(/show borders|enable borders|animated borders/.test(prompt)){settings.borders=true;changed=true;}
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
      document.body.classList.add("rail-scrubbing");
      document.documentElement.classList.add("rail-scrubbing");
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
      document.body.classList.remove("rail-scrubbing");
      document.documentElement.classList.remove("rail-scrubbing");
      const targets=Array.from(document.querySelectorAll("main > .hero,main > .intro,main > .section,main > .contact"));
      if(targets.length){
        const snapOffset=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0;
        let nearest=targets[0],nearestDistance=Infinity;
        targets.forEach(target=>{
          const distance=Math.abs(target.getBoundingClientRect().top-snapOffset);
          if(distance<nearestDistance){nearest=target;nearestDistance=distance;}
        });
        const top=Math.max(0,nearest.getBoundingClientRect().top+window.scrollY-snapOffset);
        window.scrollTo({top,left:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
      }
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
  }
  function dragMascot(event){
    if(!mascotDragging||event.pointerId!==mascotPointerId)return;
    mascotMoved=true;
    mascotNextX=event.clientX-mascotOffsetX;mascotNextY=event.clientY-mascotOffsetY;
    if(!mascotFrame)mascotFrame=requestAnimationFrame(()=>{
      applyMascotPosition(mascotNextX,mascotNextY);mascotFrame=0;
    });
    // The mascot itself has touch-action:none; no global event cancellation is needed.
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
    if(mascotMoved){suppressMascotClick=true;snapMascotToNearestEdge();}
    else{
      const rect=bgCompanion.getBoundingClientRect();
      applyMascotPosition(rect.left,rect.top,true);
      bgCompanion.classList.remove("is-reacting");
      requestAnimationFrame(()=>bgCompanion.classList.add("is-reacting"));
      setTimeout(()=>bgCompanion.classList.remove("is-reacting"),850);
    }
    bgCompanion.classList.remove("is-dragging");
  }
  const assistantButton=$("#bgCompanion"),assistantMenu=$("#assistantShortcuts");
  let suppressMascotClick=false;
  if(assistantButton&&assistantMenu){
    const closeAssistant=()=>{assistantMenu.hidden=true;assistantButton.setAttribute("aria-expanded","false");};
    assistantButton.addEventListener("click",event=>{if(suppressMascotClick){suppressMascotClick=false;event.preventDefault();return;}const open=assistantMenu.hidden;assistantMenu.hidden=!open;assistantButton.setAttribute("aria-expanded",String(open));if(open){const rect=assistantButton.getBoundingClientRect(),menuWidth=Math.min(210,window.innerWidth-24),menuHeight=assistantMenu.scrollHeight;assistantMenu.style.left=Math.max(12,Math.min(window.innerWidth-menuWidth,rect.right+12))+"px";assistantMenu.style.top=Math.max(12,Math.min(window.innerHeight-menuHeight-12,rect.top))+"px";assistantMenu.style.bottom="auto";}});
    assistantButton.addEventListener("keydown",event=>{if(event.key==="Escape")closeAssistant();});
    assistantMenu.addEventListener("click",event=>{
      const action=event.target.closest("[data-shortcut]")?.dataset.shortcut;if(!action)return;
      closeAssistant();
      if(action==="studio")$("#openStudio").click();
      else{const target={home:"#home",about:"#about",projects:"#projects",contact:"#contact"}[action];if(target)$(target)?.scrollIntoView({behavior:"smooth",block:"start"});}
    });
    document.addEventListener("pointerdown",event=>{if(!assistantButton.contains(event.target)&&!assistantMenu.contains(event.target))closeAssistant();},{passive:true});
    document.addEventListener("keydown",event=>{if(event.key==="Escape")closeAssistant();});
  }
  bgCompanion.addEventListener("transitionend",event=>{
    if(event.propertyName==="transform")bgCompanion.classList.remove("is-snapping");
  });
  bgCompanion.addEventListener("pointerdown",startMascotDrag);
  // Passive global pointer tracking avoids blocking native touch scrolling on the main thread.
  window.addEventListener("pointermove",dragMascot,{passive:true});
  window.addEventListener("pointerup",finishMascotDrag);
  window.addEventListener("pointercancel",finishMascotDrag);
  window.addEventListener("resize",()=>{
    if(!mascotPosition)return;
    applyMascotPosition(mascotPosition.x*Math.max(0,window.innerWidth-bgCompanion.offsetWidth),mascotPosition.y*Math.max(0,window.innerHeight-bgCompanion.offsetHeight));
  });
  restoreMascotPosition();

  // Finger-locked liquid cursor. Touch Events keep tracking the finger during native page scrolling.
  const liquidCursor=$("#liquidLensCursor"),liquidLensContent=$("#liquidLensContent");
  if(liquidCursor&&liquidLensContent){
    root.classList.add("has-liquid-cursor");
    const coarse=window.matchMedia("(pointer: coarse)").matches;
    const lensTargets=".card,.timeline-card,.feature-card,.research-grid article,.future-item,.empty-state,.progress-panel,.contact-card,.button,.main-nav a,.tag-list span,.profile-orb";
    let cursorX=-100,cursorY=-100,currentTarget=null,cloneNode=null,hideTimer=0,activeTouchId=null,lastX=0,lastY=0,lastTime=0,raf=0;
    function cleanClone(node){node.querySelectorAll("[id]").forEach(el=>el.removeAttribute("id"));node.removeAttribute("id");node.classList.add("liquid-lens-clone");node.querySelectorAll("button,input,select,textarea").forEach(el=>{el.setAttribute("tabindex","-1");el.setAttribute("aria-hidden","true");});return node;}
    function setLensTarget(target){
      if(target===currentTarget)return;
      if(currentTarget){currentTarget.classList.remove("liquid-hover-target");currentTarget.style.removeProperty("--liquid-shift-x");currentTarget.style.removeProperty("--liquid-shift-y");}
      currentTarget=target;liquidLensContent.replaceChildren();cloneNode=null;
      if(!target){liquidCursor.classList.remove("is-lens");return;}
      target.classList.add("liquid-hover-target");cloneNode=cleanClone(target.cloneNode(true));
      const rect=target.getBoundingClientRect();cloneNode.style.width=rect.width+"px";cloneNode.style.height=rect.height+"px";liquidLensContent.appendChild(cloneNode);liquidCursor.classList.add("is-lens");
    }
    function syncLens(){
      if(!currentTarget||!cloneNode||!currentTarget.isConnected)return;
      const rect=currentTarget.getBoundingClientRect(),x=Math.max(0,Math.min(rect.width,cursorX-rect.left)),y=Math.max(0,Math.min(rect.height,cursorY-rect.top));
      cloneNode.style.left=(36-x)+"px";cloneNode.style.top=(36-y)+"px";
      const nx=(x/Math.max(1,rect.width)-.5)*2,ny=(y/Math.max(1,rect.height)-.5)*2;
      currentTarget.style.setProperty("--liquid-shift-x",(nx*1.25).toFixed(2)+"px");currentTarget.style.setProperty("--liquid-shift-y",(ny*1.25).toFixed(2)+"px");
    }
    function positionAt(x,y,now){
      const dt=Math.max(8,Math.min(48,now-lastTime||16)),vx=(x-lastX)/dt,vy=(y-lastY)/dt,speed=Math.min(1,Math.hypot(vx,vy)/1.2),angle=Math.atan2(vy,vx)*180/Math.PI;
      liquidCursor.style.setProperty("--cursor-stretch-x",(1+speed*.3).toFixed(3));liquidCursor.style.setProperty("--cursor-stretch-y",(1-speed*.22).toFixed(3));liquidCursor.style.setProperty("--cursor-angle",angle.toFixed(2)+"deg");
      lastX=x;lastY=y;lastTime=now;cursorX=x;cursorY=y;
      const under=document.elementFromPoint(x,y),target=under&&under.closest?under.closest(lensTargets):null;
      setLensTarget(target&&!target.closest(".liquid-cursor,.bg-companion")?target:null);syncLens();
      liquidCursor.style.transform="translate3d("+(x-36).toFixed(2)+"px,"+(y-36).toFixed(2)+"px,0)";
    }
    function revealAt(x,y,now,id=null){
      if(hideTimer){clearTimeout(hideTimer);hideTimer=0;}
      activeTouchId=id;lastX=x;lastY=y;lastTime=now;
      liquidCursor.style.setProperty("--cursor-stretch-x","1");liquidCursor.style.setProperty("--cursor-stretch-y","1");liquidCursor.style.setProperty("--cursor-angle","0deg");
      liquidCursor.style.opacity="1";liquidCursor.style.visibility="visible";liquidCursor.classList.add("is-pressing");positionAt(x,y,now);
    }
    function releaseAt(x,y,now){
      if(Number.isFinite(x)&&Number.isFinite(y))positionAt(x,y,now);
      activeTouchId=null;liquidCursor.classList.remove("is-pressing");
      liquidCursor.style.setProperty("--cursor-stretch-x","1");liquidCursor.style.setProperty("--cursor-stretch-y","1");liquidCursor.style.setProperty("--cursor-angle","0deg");
      if(hideTimer)clearTimeout(hideTimer);
      hideTimer=window.setTimeout(()=>{liquidCursor.style.opacity="0";setLensTarget(null);hideTimer=0;},1000);
    }
    if(coarse){
      const findTouch=list=>Array.from(list||[]).find(t=>activeTouchId===null||t.identifier===activeTouchId);
      window.addEventListener("touchstart",event=>{const t=event.changedTouches[0];if(t)revealAt(t.clientX,t.clientY,performance.now(),t.identifier);},{passive:true});
      window.addEventListener("touchmove",event=>{const t=findTouch(event.touches);if(t)positionAt(t.clientX,t.clientY,performance.now());},{passive:true});
      window.addEventListener("touchend",event=>{const t=Array.from(event.changedTouches).find(v=>v.identifier===activeTouchId);if(t)releaseAt(t.clientX,t.clientY,performance.now());},{passive:true});
      window.addEventListener("touchcancel",event=>{const t=Array.from(event.changedTouches).find(v=>v.identifier===activeTouchId);if(t)releaseAt(t.clientX,t.clientY,performance.now());},{passive:true});
    }else{
      let pointerId=null;
      window.addEventListener("pointerdown",event=>{if(event.pointerType==="touch")return;pointerId=event.pointerId;revealAt(event.clientX,event.clientY,performance.now());},{passive:true});
      window.addEventListener("pointermove",event=>{if(pointerId===event.pointerId)positionAt(event.clientX,event.clientY,performance.now());else if(event.pointerType==="mouse"){cursorX=event.clientX;cursorY=event.clientY;positionAt(cursorX,cursorY,performance.now());liquidCursor.style.opacity="1";}},{passive:true});
      window.addEventListener("pointerup",event=>{if(pointerId===event.pointerId){pointerId=null;liquidCursor.classList.remove("is-pressing");}},{passive:true});
      document.addEventListener("pointerleave",()=>{if(pointerId===null)liquidCursor.style.opacity="0";},{passive:true});
    }
    window.addEventListener("scroll",()=>{if(currentTarget&&!currentTarget.isConnected)setLensTarget(null);else syncLens();},{passive:true});
  }

  // Scroll-responsive horizontal navigation: evenly paced at rest, then fans outward and fades; scrolling up reverses it.
  function setupScrollNav(){
    const nav=$("#mainNav");
    if(!nav)return;
    const links=Array.from(nav.querySelectorAll("a"));
    let raf=0;
    const paint=()=>{
      raf=0;
      const y=Math.max(0,window.scrollY);
      const progress=Math.max(0,Math.min(1,y/760));
      const viewport=window.innerWidth||360;
      const spread=Math.min(viewport*.145,progress*viewport*.145);
      const gap=window.innerWidth<=680?12+progress*22:22+progress*42;
      nav.style.gap=gap.toFixed(1)+"px";
      nav.style.setProperty("--nav-spread",spread.toFixed(2)+"px");
      links.forEach((link,index)=>{
        const center=index-(links.length-1)/2;
        const offset=center*spread*1.45;
        link.style.setProperty("--nav-x",offset.toFixed(2)+"px");
        link.style.opacity=String(Math.max(0,1-progress*1.18));
        link.style.pointerEvents=progress>.82?"none":"auto";
        link.style.setProperty("--nav-scale",(1-progress*.16).toFixed(3));
      });
      nav.dataset.scrollProgress=progress.toFixed(3);
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
  function setupSectionFlow(sections){
    if(!sections.length||(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)||body.classList.contains("no-motion"))return;
    let frame=0;
    const clamp=value=>Math.max(0,Math.min(1,value));
    const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
    const paint=()=>{
      frame=0;
      const vh=window.innerHeight||1;
      const enterRange=vh*.58,exitRange=vh*.62;
      sections.forEach(section=>{
        const rect=section.getBoundingClientRect();
        // Incoming sections rise from below; outgoing sections fade and recede in depth.
        const entering=smooth((vh*.92-rect.top)/enterRange);
        const leaving=smooth((rect.bottom+vh*.30)/exitRange);
        const visibility=Math.min(entering,leaving);
        const entryProgress=1-entering;
        const exitProgress=1-leaving;
        const translateY=entryProgress*44-exitProgress*34;
        const translateZ=-exitProgress*46;
        const tilt=-exitProgress*1.35;
        const scale=.955+visibility*.045;
        section.style.setProperty("--section-opacity",visibility.toFixed(3));
        section.style.setProperty("--section-y",translateY.toFixed(2)+"px");
        section.style.setProperty("--section-z",translateZ.toFixed(2)+"px");
        section.style.setProperty("--section-tilt",tilt.toFixed(3)+"deg");
        section.style.setProperty("--section-scale",scale.toFixed(4));
      });
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(paint);};
    window.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule,{passive:true});
    window.addEventListener("orientationchange",schedule,{passive:true});
    paint();
  }
  function setupReveal(){
    const sections=$(".hero,.intro,.section,.contact,.footer");
    sections.forEach(element=>element.classList.add("section-flow"));
    setupSectionFlow(sections);
    const details=$(".contact-card,.hero-copy,.hero-art");
    details.forEach(element=>element.classList.add("reveal"));
    if(!("IntersectionObserver" in window)){details.forEach(element=>element.classList.add("visible"));return;}
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}});
    },{threshold:.08,rootMargin:"0px 0px -35px 0px"});
    details.forEach(element=>observer.observe(element));
  }
  try{
    const stored=localStorage.getItem("oliveInsightDesign");
    if(stored){const parsed=JSON.parse(stored);settings={...defaults,...parsed};if(Number.isFinite(Number(parsed.speed))&&!Number.isFinite(Number(parsed.capsuleSpeed)))settings.capsuleSpeed=Math.max(12,Math.min(90,Number(parsed.speed))); if(typeof parsed.borders!=="boolean")settings.borders=true; if(Number.isFinite(Number(parsed.borderSpeed)))settings.borderSpeed=Math.max(12,Math.min(60,Number(parsed.borderSpeed)));if(!parsed.typographyV2){settings.font="system";settings.typographyV2=true;}if(!["system","editorial","technical"].includes(settings.font))settings.font="system";}
  }catch(_){}
  apply();setupReveal();setupBorderMotion();
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)body.classList.add("no-motion");

})();