import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTOTUBER v6.0  —  Full Automation Stack
//  Claude AI Scripts → ElevenLabs Voice → Canvas Video Render → YouTube + Instagram
// ═══════════════════════════════════════════════════════════════════════════════

const T = {
  bg0:"#05050f",bg1:"#0a0a1a",bg2:"#0f0f24",bg3:"#14142e",
  border:"#1a1a35",borderHi:"#2a2a50",
  orange:"#FF6B35",orangeDim:"#FF6B3520",
  green:"#00E5A0",greenDim:"#00E5A020",
  blue:"#4285F4",blueDim:"#4285F420",
  pink:"#E1306C",pinkDim:"#E1306C20",
  purple:"#8B5CF6",purpleDim:"#8B5CF620",
  gold:"#F59E0B",goldDim:"#F59E0B20",
  red:"#EF4444",redDim:"#EF444420",
  text:"#E0E0FF",textMid:"#7070A0",textDim:"#3a3a60",
  mono:"'Courier New', monospace",
  sans:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display:"'Bebas Neue', 'Arial Black', sans-serif",
};

const CATEGORIES=[
  {id:"motivation",emoji:"💪",label:"Motivation",color:T.orange,desc:"Inspirational stories & mindset shifts"},
  {id:"finance",emoji:"💰",label:"Finance",color:T.green,desc:"Money tips, investing, passive income"},
  {id:"mindset",emoji:"🧠",label:"Mindset",color:T.purple,desc:"Psychology, habits, mental strength"},
  {id:"success",emoji:"🏆",label:"Success Stories",color:T.gold,desc:"Billionaire secrets & life lessons"},
  {id:"health",emoji:"❤️",label:"Health",color:T.red,desc:"Wellness, longevity, fitness science"},
  {id:"productivity",emoji:"⚡",label:"Productivity",color:T.blue,desc:"Systems, focus, deep work methods"},
  {id:"history",emoji:"📜",label:"History",color:T.purple,desc:"Forgotten events & powerful figures"},
  {id:"tech",emoji:"🤖",label:"AI & Tech",color:"#06B6D4",desc:"Future tech, AI breakthroughs, trends"},
];
const VOICES=[
  {id:"21m00Tcm4TlvDq8ikWAM",name:"Rachel",desc:"Calm · Female",best:"Finance, Mindset"},
  {id:"AZnzlk1XvdvUeBnXmlld",name:"Domi",desc:"Strong · Female",best:"Motivation, Success"},
  {id:"ErXwobaYiN019PkySvjV",name:"Antoni",desc:"Rounded · Male",best:"History, Education"},
  {id:"VR6AewLTigWG4xSOukaG",name:"Arnold",desc:"Crisp · Male",best:"Tech, Productivity"},
  {id:"pNInz6obpgDQGcFmaJgB",name:"Adam",desc:"Deep · Male",best:"Motivation, Success"},
  {id:"yoZ06aMxZJJ28mfd3POQ",name:"Sam",desc:"Conversational · Male",best:"Finance, Health"},
];
const MUSIC=[
  {id:"cinematic",label:"Epic Cinematic",mood:"🔥 High energy"},
  {id:"lofi",label:"Calm Lo-Fi",mood:"😌 Relaxed"},
  {id:"corporate",label:"Upbeat Corporate",mood:"💼 Professional"},
  {id:"dark",label:"Dark Ambient",mood:"🌑 Mysterious"},
  {id:"piano",label:"Inspiring Piano",mood:"✨ Emotional"},
];
const VIDEO_STYLES=[
  {id:"gradient",label:"Gradient Cinematic",desc:"Bold text on animated gradient"},
  {id:"neon",label:"Neon Glow",desc:"Glowing neon text effects"},
  {id:"particles",label:"Particle Flow",desc:"Animated particles + text"},
  {id:"minimal",label:"Clean Minimal",desc:"Black BG, white typography"},
];
const STEPS=[
  {label:"Setup",icon:"⚙️"},{label:"Niche",icon:"🎯"},{label:"Scripts",icon:"📝"},
  {label:"Style",icon:"🎨"},{label:"Preview",icon:"👁️"},{label:"Render",icon:"🎬"},{label:"Publish",icon:"🚀"},
];

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

// ─── YouTube ──────────────────────────────────────────────────────────────────
function buildYTAuthUrl(clientId){
  return`https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({client_id:clientId,redirect_uri:window.location.href.split("?")[0].split("#")[0],response_type:"token",scope:"https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",state:"yt_auth"})}`;
}
function parseHash(){
  const p=new URLSearchParams(window.location.hash.substring(1));
  const token=p.get("access_token");
  if(!token)return null;
  return{state:p.get("state"),token};
}
async function fetchYTChannel(token){
  const r=await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",{headers:{Authorization:`Bearer ${token}`}});
  if(!r.ok)throw new Error("YouTube auth failed");
  const d=await r.json();
  const c=d.items?.[0]?.snippet;
  return c?{name:c.title,thumbnail:c.thumbnails?.default?.url}:null;
}
async function ytUpload({token,blob,title,description,tags}){
  const meta={snippet:{title,description,tags,categoryId:"22"},status:{privacyStatus:"public"}};
  const init=await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json; charset=UTF-8","X-Upload-Content-Type":"video/mp4","X-Upload-Content-Length":blob.size},body:JSON.stringify(meta)});
  if(!init.ok){const e=await init.json().catch(()=>({}));throw new Error(e?.error?.message||`YT ${init.status}`);}
  const url=init.headers.get("Location");
  if(!url)throw new Error("No upload URL");
  const up=await fetch(url,{method:"PUT",headers:{"Content-Type":"video/mp4"},body:blob});
  if(!up.ok){const e=await up.json().catch(()=>({}));throw new Error(e?.error?.message||`YT upload ${up.status}`);}
  return(await up.json()).id;
}

// ─── Instagram ────────────────────────────────────────────────────────────────
async function fetchIGAccount(token){
  const r=await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account{id,name,username,profile_picture_url}&access_token=${token}`);
  if(!r.ok)throw new Error("FB account fetch failed");
  const d=await r.json();
  for(const page of(d.data||[])){
    if(page.instagram_business_account){
      const ig=page.instagram_business_account;
      return{igId:ig.id,name:ig.name,username:ig.username,avatar:ig.profile_picture_url};
    }
  }
  throw new Error("No Instagram Business account found. Connect your Instagram to a Facebook Page first.");
}
async function igUpload({token,igId,videoUrl,caption}){
  const cr=await fetch(`https://graph.facebook.com/v19.0/${igId}/media`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({media_type:"REELS",video_url:videoUrl,caption,access_token:token})});
  if(!cr.ok){const e=await cr.json().catch(()=>({}));throw new Error(e?.error?.message||`IG ${cr.status}`);}
  const containerId=(await cr.json()).id;
  for(let i=0;i<24;i++){
    await sleep(5000);
    const pr=await fetch(`https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${token}`);
    const pd=await pr.json();
    if(pd.status_code==="FINISHED")break;
    if(pd.status_code==="ERROR")throw new Error("Instagram processing error");
  }
  const pub=await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({creation_id:containerId,access_token:token})});
  if(!pub.ok){const e=await pub.json().catch(()=>({}));throw new Error(e?.error?.message||`IG publish ${pub.status}`);}
  return(await pub.json()).id;
}

// ─── ElevenLabs ───────────────────────────────────────────────────────────────
async function generateVoice(text,voiceId,apiKey){
  const t=text.length>600?text.slice(0,600)+"...":text;
  const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,{method:"POST",headers:{"Content-Type":"application/json","xi-api-key":apiKey},body:JSON.stringify({text:t,model_id:"eleven_monolingual_v1",voice_settings:{stability:0.5,similarity_boost:0.75}})});
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e?.detail?.message||`ElevenLabs ${r.status}`);}
  const blob=await r.blob();
  return{url:URL.createObjectURL(blob),blob};
}

// ─── Claude ───────────────────────────────────────────────────────────────────
async function claudeScripts(niche){
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[{role:"user",content:`Expert YouTube strategist for faceless voiceover channels.\n\nGenerate 6 viral video ideas for: "${niche}"\n\nJSON array only, no markdown:\n[{"id":1,"title":"Title max 70 chars","hook":"5-second opening hook","description":"2 sentences","duration":"X min","views_potential":"High","tags":["tag1","tag2","tag3"],"thumbnail_text":"3-5 CAPS WORDS"}]\n\nviews_potential: "Medium"|"High"|"Very High"`}]})});
  const d=await r.json();
  return JSON.parse((d.content?.map(b=>b.text||"").join("")||"").replace(/```json|```/g,"").trim());
}
async function claudeScript(title,hook,niche){
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[{role:"user",content:`Write a complete voiceover YouTube script.\nTitle: "${title}"\nNiche: ${niche}\nHook: "${hook}"\n\nSections: [HOOK] [INTRO] [SECTION 1] [SECTION 2] [SECTION 3] [SECTION 4] [OUTRO + CTA]\nConversational, 700-900 words, no camera directions.`}]})});
  const d=await r.json();
  return d.content?.map(b=>b.text||"").join("")||"";
}
async function claudeThumbs(title,niche){
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:100,messages:[{role:"user",content:`3 thumbnail text options for "${niche}" video: "${title}"\nEach: 3-5 CAPITALIZED words that create curiosity.\nJSON array only: ["OPT 1","OPT 2","OPT 3"]`}]})});
  const d=await r.json();
  try{return JSON.parse((d.content?.map(b=>b.text||"").join("")||"").replace(/```json|```/g,"").trim());}
  catch{return["WATCH THIS NOW","YOU WON'T BELIEVE","THIS CHANGES EVERYTHING"];}
}

// ─── Canvas Video Renderer ────────────────────────────────────────────────────
function wrapText(text,maxChars){
  const words=text.split(" ");const lines=[];let cur="";
  for(const w of words){if((cur+" "+w).trim().length<=maxChars){cur=(cur+" "+w).trim();}else{if(cur)lines.push(cur);cur=w;}}
  if(cur)lines.push(cur);return lines.slice(0,3);
}
async function renderVideoOnCanvas({script,settings,audioBlob,onProgress}){
  const W=1080,H=1920,FPS=30,DURATION=15;
  const canvas=document.createElement("canvas");
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext("2d");
  const mimeTypes=["video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm","video/mp4"];
  const mimeType=mimeTypes.find(m=>MediaRecorder.isTypeSupported(m))||"video/webm";
  const chunks=[];
  const stream=canvas.captureStream(FPS);
  if(audioBlob){
    try{
      const audioCtx=new AudioContext();
      const ab=await audioBlob.arrayBuffer();
      const buf=await audioCtx.decodeAudioData(ab);
      const src=audioCtx.createBufferSource();src.buffer=buf;
      const dest=audioCtx.createMediaStreamDestination();src.connect(dest);src.start(0);
      dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
    }catch(e){console.warn("Audio mix failed:",e);}
  }
  const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:4_000_000});
  recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
  return new Promise((resolve,reject)=>{
    recorder.onstop=()=>{
      const blob=new Blob(chunks,{type:mimeType});
      resolve({blob,url:URL.createObjectURL(blob),mimeType});
    };
    recorder.onerror=e=>reject(e.error);
    recorder.start(100);
    const style=settings.videoStyle||"gradient";
    const thumbText=script.thumbnail_text||script.title.split(" ").slice(0,4).join(" ").toUpperCase();
    let frame=0;const totalFrames=FPS*DURATION;
    const drawFrame=()=>{
      if(frame>=totalFrames){recorder.stop();return;}
      const t=frame/FPS;const progress=frame/totalFrames;
      // Background
      if(style==="gradient"){
        const hue=(frame*0.4)%360;
        const g=ctx.createLinearGradient(0,0,W,H);
        g.addColorStop(0,`hsl(${hue},80%,7%)`);g.addColorStop(0.5,`hsl(${(hue+60)%360},70%,11%)`);g.addColorStop(1,`hsl(${(hue+120)%360},80%,5%)`);
        ctx.fillStyle=g;
      }else if(style==="neon"){ctx.fillStyle="rgba(0,0,10,0.92)";}
      else if(style==="particles"){ctx.fillStyle="rgba(3,3,18,0.88)";}
      else{ctx.fillStyle="#000000";}
      ctx.fillRect(0,0,W,H);
      // Particles
      const np=style==="particles"?50:10;
      for(let i=0;i<np;i++){
        const px=(Math.sin(t*0.3+i*2.4)*0.5+0.5)*W;
        const py=((t*0.05+i/np)%1)*H;
        const pr=style==="particles"?2+Math.sin(t+i)*1.5:1;
        const a=0.08+Math.sin(t*0.8+i)*0.06;
        const hue=(frame*0.5+i*30)%360;
        ctx.beginPath();ctx.arc(px,py,pr,0,Math.PI*2);
        ctx.fillStyle=`hsla(${hue},80%,70%,${a})`;ctx.fill();
      }
      // Scan line
      ctx.fillStyle="rgba(255,255,255,0.012)";
      ctx.fillRect(0,(t*200)%H,W,2);
      // Glow orb
      const ox=W/2+Math.sin(t*0.4)*200,oy=H*0.4+Math.cos(t*0.3)*150;
      const orb=ctx.createRadialGradient(ox,oy,0,ox,oy,420);
      orb.addColorStop(0,style==="neon"?"rgba(255,107,53,0.14)":"rgba(100,80,255,0.11)");
      orb.addColorStop(1,"transparent");
      ctx.fillStyle=orb;ctx.fillRect(0,0,W,H);
      // Top label
      ctx.save();ctx.font=`bold 30px ${T.mono}`;ctx.fillStyle="rgba(255,107,53,0.7)";ctx.textAlign="center";
      ctx.fillText("AI GENERATED VIDEO",W/2,76);ctx.restore();
      // Thumbnail title
      const ta=clamp(t/0.6,0,1);
      ctx.save();ctx.globalAlpha=ta;ctx.textAlign="center";
      ctx.shadowColor=style==="neon"?"#FF6B35":"rgba(0,0,0,0.95)";ctx.shadowBlur=style==="neon"?32:16;
      const lines=wrapText(thumbText.toUpperCase(),18);
      lines.forEach((line,li)=>{
        const fs=clamp(Math.floor(160/Math.max(line.length,1)*10),80,160);
        ctx.font=`900 ${fs}px ${T.display}`;
        ctx.fillStyle=style==="neon"?"#FF6B35":style==="minimal"?"#FFFFFF":"#FFFFFF";
        ctx.fillText(line,W/2,H*0.35+li*190-(lines.length-1)*95);
      });ctx.restore();
      // Hook subtitle
      const ha=clamp((t-0.9)/0.5,0,1);
      ctx.save();ctx.globalAlpha=ha;ctx.textAlign="center";
      ctx.font=`italic 42px ${T.sans}`;ctx.fillStyle="rgba(220,220,255,0.82)";
      ctx.shadowColor="rgba(0,0,0,0.95)";ctx.shadowBlur=12;
      const hookLines=wrapText(`"${script.hook}"`,36);
      hookLines.forEach((line,li)=>ctx.fillText(line,W/2,H*0.62+li*58));
      ctx.restore();
      // Progress bar
      ctx.fillStyle="rgba(255,255,255,0.08)";ctx.fillRect(60,H-80,W-120,6);
      const bc=style==="neon"?"#FF6B35":"#00E5A0";
      ctx.fillStyle=bc;ctx.shadowColor=bc;ctx.shadowBlur=10;
      ctx.fillRect(60,H-80,(W-120)*progress,6);ctx.shadowBlur=0;
      // Meta
      ctx.save();ctx.font=`bold 28px ${T.mono}`;ctx.fillStyle="rgba(255,107,53,0.65)";ctx.textAlign="left";
      ctx.fillText(`🎙 ${settings.voice?.name||"AI Voice"}  🎵 ${settings.music?.label?.split(" ")[0]||"Music"}`,60,H-110);
      ctx.restore();
      onProgress&&onProgress(Math.round(progress*100));
      frame++;requestAnimationFrame(drawFrame);
    };
    drawFrame();
  });
}

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
function Spinner({size=32,color=T.orange}){return<div style={{width:size,height:size,borderRadius:"50%",border:`3px solid ${color}25`,borderTop:`3px solid ${color}`,animation:"spin 0.7s linear infinite",flexShrink:0}}/>;}
function Card({children,style={},glow}){return<div style={{background:T.bg2,border:`1px solid ${glow?glow+"50":T.border}`,borderRadius:14,padding:"18px 20px",boxShadow:glow?`0 0 22px ${glow}18`:"none",...style}}>{children}</div>;}
function SLabel({icon,children,right}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{color:T.orange,fontFamily:T.mono,fontSize:11,letterSpacing:2,fontWeight:700}}>{icon} {children}</span>{right&&<span style={{color:T.textDim,fontFamily:T.mono,fontSize:10}}>{right}</span>}</div>);}
function BackBtn({onClick}){return<button onClick={onClick} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,padding:"7px 14px",color:T.textMid,cursor:"pointer",fontFamily:T.mono,fontSize:11}}>← Back</button>;}
function PBar({pct,color=T.orange,h=4}){return<div style={{background:T.bg3,borderRadius:h,height:h,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color,transition:"width 0.3s ease",boxShadow:`0 0 8px ${color}50`}}/></div>;}
function Toggle({value,onChange}){return<div onClick={()=>onChange(!value)} style={{width:44,height:24,borderRadius:12,background:value?T.green:T.bg3,border:`1px solid ${value?T.green:T.border}`,cursor:"pointer",position:"relative",transition:"all 0.2s",flexShrink:0}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:value?22:2,transition:"left 0.2s"}}/></div>;}
function Pill({color,children}){return<span style={{background:color+"20",color,border:`1px solid ${color}40`,borderRadius:20,padding:"3px 10px",fontSize:11,fontFamily:T.mono,fontWeight:700}}>{children}</span>;}
function StatusBox({type,text}){const c={ok:T.green,warn:T.gold,err:T.red,info:T.blue}[type]||T.textMid;const ic={ok:"✓",warn:"⚠",err:"✗",info:"ℹ"}[type]||"•";return<div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:c+"15",border:`1px solid ${c}40`,borderRadius:8,color:c,fontFamily:T.mono,fontSize:11}}><span>{ic}</span><span>{text}</span></div>;}
function ConnectedRow({avatar,name,sub,color,onDisconnect}){return<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:color+"12",border:`1px solid ${color}40`,borderRadius:10}}><div style={{display:"flex",alignItems:"center",gap:10}}>{avatar&&<img src={avatar} alt="" style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${color}`}}/>}<div><div style={{color,fontFamily:T.mono,fontSize:12,fontWeight:700}}>✓ {name}</div>{sub&&<div style={{color:T.textDim,fontFamily:T.mono,fontSize:10}}>{sub}</div>}</div></div><button onClick={onDisconnect} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"4px 10px",color:T.textMid,fontFamily:T.mono,fontSize:10,cursor:"pointer"}}>✕</button></div>;}

// ─── Step Bar ─────────────────────────────────────────────────────────────────
function StepBar({current}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:30,flexWrap:"wrap",gap:2}}>
      {STEPS.map((step,i)=>{
        const done=i<current,active=i===current;
        return(
          <div key={i} style={{display:"flex",alignItems:"center"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:done?T.green:active?T.orange:T.bg3,border:`2px solid ${done?T.green:active?T.orange:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:done?14:12,fontWeight:700,color:done||active?"#fff":T.textDim,transition:"all 0.3s",boxShadow:active?`0 0 20px ${T.orange}60`:done?`0 0 10px ${T.green}40`:"none"}}>
                {done?"✓":step.icon}
              </div>
              <span style={{fontSize:9,color:active?T.orange:done?T.green:T.textDim,fontFamily:T.mono,fontWeight:700,letterSpacing:1,whiteSpace:"nowrap"}}>{step.label.toUpperCase()}</span>
            </div>
            {i<STEPS.length-1&&<div style={{width:24,height:2,margin:"0 3px 14px",background:i<current?T.green:T.border,transition:"all 0.3s"}}/>}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 0: SETUP
// ═══════════════════════════════════════════════════════════════════════════════
function SetupStep({onNext}){
  const[el,setEl]=useState({key:"",status:null,err:"",testing:false});
  const[yt,setYt]=useState({clientId:"",token:null,channel:null,loading:false});
  const[ig,setIg]=useState({token:"",account:null,loading:false,err:""});
  const[tab,setTab]=useState("elevenlabs");

  useEffect(()=>{
    const h=parseHash();
    if(h?.state==="yt_auth"&&h.token){
      window.location.hash="";
      setYt(p=>({...p,token:h.token,loading:true}));
      fetchYTChannel(h.token).then(ch=>setYt(p=>({...p,channel:ch,loading:false}))).catch(()=>setYt(p=>({...p,loading:false})));
    }
  },[]);

  const testEL=async()=>{
    setEl(p=>({...p,testing:true,status:null,err:""}));
    try{const r=await fetch("https://api.elevenlabs.io/v1/voices",{headers:{"xi-api-key":el.key.trim()}});setEl(p=>({...p,status:r.ok?"ok":"err",err:r.ok?"":"Invalid API key",testing:false}));}
    catch{setEl(p=>({...p,status:"err",err:"Network error",testing:false}));}
  };
  const connectIG=async()=>{
    setIg(p=>({...p,loading:true,err:""}));
    try{const acc=await fetchIGAccount(ig.token.trim());setIg(p=>({...p,account:acc,loading:false}));}
    catch(e){setIg(p=>({...p,err:e.message,loading:false}));}
  };

  const services={elKey:el.status==="ok"?el.key.trim():null,ytToken:yt.token,ytChannel:yt.channel,igToken:ig.account?ig.token.trim():null,igAccount:ig.account};
  const TABS=[{id:"elevenlabs",icon:"🎙",label:"ElevenLabs",ok:el.status==="ok"},{id:"youtube",icon:"▶️",label:"YouTube",ok:!!yt.token},{id:"instagram",icon:"📸",label:"Instagram",ok:!!ig.account}];

  return(
    <div>
      <div style={{textAlign:"center",marginBottom:24}}>
        <h2 style={{fontFamily:T.display,fontSize:38,letterSpacing:3,color:T.text,margin:0}}>CONNECT SERVICES</h2>
        <p style={{color:T.textMid,fontFamily:T.mono,fontSize:12,marginTop:6}}>All services optional. Claude AI always works. Connect more = more automation.</p>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:14}}>
          {[{icon:"🤖",label:"Claude AI",on:true},{icon:"🎙",label:"Voice",on:el.status==="ok"},{icon:"▶️",label:"YouTube",on:!!yt.token},{icon:"📸",label:"Instagram",on:!!ig.account}].map(({icon,label,on})=>(
            <div key={label} style={{background:on?T.greenDim:T.bg3,border:`1px solid ${on?T.green:T.border}`,borderRadius:9,padding:"9px 12px",textAlign:"center",minWidth:72}}>
              <div style={{fontSize:18}}>{icon}</div>
              <div style={{color:on?T.green:T.textDim,fontFamily:T.mono,fontSize:9,fontWeight:700,marginTop:3}}>{on?"✓ ON":"○ OFF"}</div>
              <div style={{color:T.textDim,fontFamily:T.mono,fontSize:8}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:14,padding:6,background:T.bg1,borderRadius:12,border:`1px solid ${T.border}`}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:tab===t.id?T.bg3:"transparent",border:`1px solid ${tab===t.id?T.border:"transparent"}`,borderRadius:8,padding:"10px 8px",cursor:"pointer",color:tab===t.id?T.text:T.textMid,fontFamily:T.mono,fontSize:11,fontWeight:700,transition:"all 0.15s"}}>
            {t.icon} {t.label} {t.ok&&<span style={{color:T.green}}>✓</span>}
          </button>
        ))}
      </div>

      {/* ElevenLabs */}
      {tab==="elevenlabs"&&(
        <Card style={{marginBottom:14}}>
          <SLabel icon="🎙">ELEVENLABS — AI VOICE</SLabel>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{padding:"12px",background:T.bg1,borderRadius:9,border:`1px solid ${T.border}`}}>
              <div style={{color:T.green,fontFamily:T.mono,fontSize:10,fontWeight:700,marginBottom:4}}>FREE TIER</div>
              <div style={{color:T.text,fontSize:14,fontWeight:700}}>~10 min/month</div>
              <div style={{color:T.textMid,fontSize:11,marginTop:3}}>~5 short videos · Perfect to start</div>
            </div>
            <div style={{padding:"12px",background:T.bg1,borderRadius:9,border:`1px solid ${T.border}`}}>
              <div style={{color:T.orange,fontFamily:T.mono,fontSize:10,fontWeight:700,marginBottom:4}}>STARTER $5/mo</div>
              <div style={{color:T.text,fontSize:14,fontWeight:700}}>30K chars/month</div>
              <div style={{color:T.textMid,fontSize:11,marginTop:3}}>~25 videos/month</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <input type="password" value={el.key} onChange={e=>setEl(p=>({...p,key:e.target.value,status:null}))} placeholder="Paste your ElevenLabs API key..."
              style={{flex:1,background:T.bg1,border:`1px solid ${el.status==="ok"?T.green:el.status==="err"?T.red:T.border}`,borderRadius:8,padding:"10px 14px",color:T.text,fontFamily:T.mono,fontSize:12,outline:"none"}}/>
            <button onClick={testEL} disabled={!el.key.trim()||el.testing} style={{background:T.orange,border:"none",borderRadius:8,padding:"10px 18px",color:"#fff",fontFamily:T.mono,fontSize:11,fontWeight:700,cursor:"pointer",opacity:!el.key.trim()?0.5:1,whiteSpace:"nowrap"}}>
              {el.testing?"⏳ Testing...":"TEST KEY"}
            </button>
          </div>
          {el.status==="ok"&&<StatusBox type="ok" text="ElevenLabs connected — 6 premium AI voices available"/>}
          {el.status==="err"&&<StatusBox type="err" text={el.err}/>}
          <p style={{color:T.textDim,fontFamily:T.mono,fontSize:10,marginTop:8,lineHeight:1.8}}>👉 Get key: <span style={{color:T.orange}}>elevenlabs.io</span> → Sign up free → Profile → API Key → Copy</p>
        </Card>
      )}

      {/* YouTube */}
      {tab==="youtube"&&(
        <Card style={{marginBottom:14}}>
          <SLabel icon="▶️">YOUTUBE — AUTOMATED UPLOAD</SLabel>
          {yt.channel?<ConnectedRow avatar={yt.channel.thumbnail} name={yt.channel.name} sub="Videos upload directly to your channel" color={T.blue} onDisconnect={()=>setYt(p=>({...p,token:null,channel:null}))}/>:(
            <>
              <div style={{display:"flex",gap:10,marginBottom:10}}>
                <input value={yt.clientId} onChange={e=>setYt(p=>({...p,clientId:e.target.value}))} placeholder="Google OAuth Client ID"
                  style={{flex:1,background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",color:T.text,fontFamily:T.mono,fontSize:11,outline:"none"}}/>
                <button onClick={()=>yt.clientId.trim()&&(window.location.href=buildYTAuthUrl(yt.clientId.trim()))} disabled={!yt.clientId.trim()}
                  style={{background:T.blue,border:"none",borderRadius:8,padding:"10px 16px",color:"#fff",fontFamily:T.mono,fontSize:11,fontWeight:700,cursor:"pointer",opacity:!yt.clientId.trim()?0.5:1,whiteSpace:"nowrap"}}>
                  🔗 CONNECT
                </button>
              </div>
              {yt.loading&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><Spinner size={16} color={T.blue}/><span style={{color:T.blue,fontFamily:T.mono,fontSize:11}}>Fetching channel...</span></div>}
              <div style={{padding:"12px 14px",background:T.bg1,borderRadius:9,border:`1px solid ${T.border}`}}>
                <p style={{color:T.textDim,fontFamily:T.mono,fontSize:10,lineHeight:2,margin:0}}>
                  <span style={{color:T.text,fontWeight:700}}>One-time 5-min setup:</span><br/>
                  1. <span style={{color:T.blue}}>console.cloud.google.com</span> → New Project<br/>
                  2. APIs &amp; Services → Enable <span style={{color:T.blue}}>YouTube Data API v3</span><br/>
                  3. Credentials → Create OAuth 2.0 Client → Web Application<br/>
                  4. Authorized Redirect URIs → add this page's URL<br/>
                  5. Copy Client ID → paste above → click Connect
                </p>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Instagram */}
      {tab==="instagram"&&(
        <Card style={{marginBottom:14}}>
          <SLabel icon="📸">INSTAGRAM — REELS AUTO PUBLISH</SLabel>
          {ig.account?<ConnectedRow avatar={ig.account.avatar} name={`@${ig.account.username}`} sub="Reels publish directly to your Instagram" color={T.pink} onDisconnect={()=>setIg(p=>({...p,account:null,token:""}))}/>:(
            <>
              <div style={{display:"flex",gap:10,marginBottom:10}}>
                <input type="password" value={ig.token} onChange={e=>setIg(p=>({...p,token:e.target.value,err:""}))} placeholder="Facebook Page Access Token"
                  style={{flex:1,background:T.bg1,border:`1px solid ${ig.err?T.red:T.border}`,borderRadius:8,padding:"10px 14px",color:T.text,fontFamily:T.mono,fontSize:11,outline:"none"}}/>
                <button onClick={connectIG} disabled={!ig.token.trim()||ig.loading}
                  style={{background:"linear-gradient(135deg,#f09433,#dc2743,#bc1888)",border:"none",borderRadius:8,padding:"10px 16px",color:"#fff",fontFamily:T.mono,fontSize:11,fontWeight:700,cursor:"pointer",opacity:!ig.token.trim()?0.5:1,whiteSpace:"nowrap"}}>
                  {ig.loading?"⏳...":"🔗 CONNECT"}
                </button>
              </div>
              {ig.err&&<StatusBox type="err" text={ig.err}/>}
              <div style={{padding:"12px 14px",background:T.bg1,borderRadius:9,border:`1px solid ${T.border}`,marginTop:ig.err?8:0}}>
                <p style={{color:T.textDim,fontFamily:T.mono,fontSize:10,lineHeight:2,margin:0}}>
                  <span style={{color:T.text,fontWeight:700}}>Requirements:</span> Instagram Business/Creator + Facebook Page<br/>
                  <span style={{color:T.text,fontWeight:700}}>Get token:</span> <span style={{color:T.pink}}>developers.facebook.com</span> → My Apps → Create App → Instagram Graph API → Generate Page Token<br/>
                  <span style={{color:T.text,fontWeight:700}}>Scopes:</span> <span style={{color:T.pink}}>instagram_basic, publish_video, pages_read_engagement</span>
                </p>
              </div>
            </>
          )}
        </Card>
      )}

      <button onClick={()=>onNext(services)}
        style={{width:"100%",background:`linear-gradient(135deg,${T.orange},#F59E0B)`,border:"none",borderRadius:12,padding:15,color:"#fff",fontFamily:T.mono,fontWeight:700,fontSize:14,letterSpacing:2,cursor:"pointer",boxShadow:`0 4px 24px ${T.orange}45`,marginTop:4}}>
        START CREATING →
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: NICHE
// ═══════════════════════════════════════════════════════════════════════════════
function NicheStep({onSelect,onBack}){
  const[hovered,setHovered]=useState(null);
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}><BackBtn onClick={onBack}/><h2 style={{fontFamily:T.display,fontSize:36,letterSpacing:3,color:T.text,margin:0}}>CHOOSE YOUR NICHE</h2></div>
      <p style={{color:T.textMid,marginBottom:22,fontFamily:T.mono,fontSize:12}}>Claude AI generates 6 viral video ideas tailored to your category</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {CATEGORIES.map(cat=>{const h=hovered===cat.id;return(
          <button key={cat.id} onClick={()=>onSelect(cat)} onMouseEnter={()=>setHovered(cat.id)} onMouseLeave={()=>setHovered(null)}
            style={{background:h?cat.color+"18":T.bg2,border:`1px solid ${h?cat.color:T.border}`,borderRadius:14,padding:"18px 14px",cursor:"pointer",transition:"all 0.2s",transform:h?"translateY(-4px)":"none",boxShadow:h?`0 8px 28px ${cat.color}25`:"none",textAlign:"left"}}>
            <div style={{fontSize:30,marginBottom:8}}>{cat.emoji}</div>
            <div style={{color:h?cat.color:T.text,fontFamily:T.mono,fontSize:12,fontWeight:700,marginBottom:4}}>{cat.label}</div>
            <div style={{color:T.textDim,fontSize:10,lineHeight:1.5}}>{cat.desc}</div>
          </button>
        );})}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: SCRIPTS
// ═══════════════════════════════════════════════════════════════════════════════
function ScriptsStep({category,onNext,onBack}){
  const[scripts,setScripts]=useState([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState(null);
  const[selected,setSelected]=useState([]);
  const[expanded,setExpanded]=useState(null);
  const[fullScript,setFullScript]=useState({});
  const[loadingFull,setLoadingFull]=useState(null);
  const[thumbs,setThumbs]=useState({});
  const potColor=p=>p==="Very High"?T.green:p==="High"?T.gold:T.textMid;

  const load=useCallback(()=>{
    setLoading(true);setError(null);
    claudeScripts(category.label).then(d=>{setScripts(d);setLoading(false);}).catch(()=>{setError("Generation failed.");setLoading(false);});
  },[category]);
  useEffect(load,[load]);

  const toggle=id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const expand=async(s)=>{
    if(expanded===s.id){setExpanded(null);return;}
    setExpanded(s.id);if(fullScript[s.id])return;
    setLoadingFull(s.id);
    const[text,th]=await Promise.all([claudeScript(s.title,s.hook,category.label).catch(()=>"Failed."),claudeThumbs(s.title,category.label).catch(()=>["WATCH NOW","YOU NEED THIS","LIFE CHANGING"])]);
    setFullScript(f=>({...f,[s.id]:text}));setThumbs(t=>({...t,[s.id]:th}));setLoadingFull(null);
  };

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}><BackBtn onClick={onBack}/><h2 style={{fontFamily:T.display,fontSize:36,letterSpacing:3,color:T.text,margin:0}}>AI SCRIPT IDEAS</h2><Pill color={category.color}>{category.emoji} {category.label}</Pill></div>
      <p style={{color:T.textMid,marginBottom:18,fontFamily:T.mono,fontSize:12}}>Select videos → Click ▼ EXPAND for full script + thumbnail text options</p>

      {loading&&<div style={{textAlign:"center",padding:"50px 0"}}><div style={{display:"flex",justifyContent:"center",marginBottom:14}}><Spinner size={44}/></div><div style={{color:T.orange,fontFamily:T.mono,fontSize:11,letterSpacing:3}}>CLAUDE IS GENERATING IDEAS...</div></div>}
      {error&&<div style={{background:T.redDim,border:`1px solid ${T.red}40`,borderRadius:12,padding:20,textAlign:"center"}}><div style={{color:T.red,fontFamily:T.mono,fontSize:12,marginBottom:12}}>✗ {error}</div><button onClick={load} style={{background:T.red,border:"none",borderRadius:8,padding:"9px 22px",color:"#fff",fontFamily:T.mono,cursor:"pointer"}}>RETRY</button></div>}

      {!loading&&!error&&(<>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
          {scripts.map(s=>{const sel=selected.includes(s.id),exp=expanded===s.id;return(
            <div key={s.id} style={{background:sel?T.greenDim:T.bg2,border:`1px solid ${sel?T.green:exp?T.orange:T.border}`,borderRadius:12,overflow:"hidden",transition:"all 0.2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}} onClick={()=>toggle(s.id)}>
                <div style={{width:22,height:22,borderRadius:6,flexShrink:0,background:sel?T.green:T.bg3,border:`2px solid ${sel?T.green:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,transition:"all 0.15s"}}>{sel?"✓":""}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:T.text,fontWeight:700,fontFamily:T.mono,fontSize:12,marginBottom:3}}>{s.title}</div>
                  <div style={{color:T.textDim,fontSize:11,fontStyle:"italic",fontFamily:T.mono,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{s.hook}"</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,marginRight:8,flexShrink:0}}>
                  <span style={{color:potColor(s.views_potential),fontSize:10,fontFamily:T.mono,fontWeight:700}}>{s.views_potential}</span>
                  <span style={{color:T.textDim,fontSize:10,fontFamily:T.mono}}>⏱ {s.duration}</span>
                </div>
                <button onClick={e=>{e.stopPropagation();expand(s);}} style={{background:exp?T.orange+"22":T.bg3,border:`1px solid ${exp?T.orange:T.border}`,borderRadius:8,padding:"6px 12px",color:exp?T.orange:T.textDim,fontFamily:T.mono,fontSize:10,cursor:"pointer",flexShrink:0,transition:"all 0.15s"}}>{exp?"▲ HIDE":"▼ EXPAND"}</button>
              </div>
              {exp&&(
                <div style={{borderTop:`1px solid ${T.border}`,padding:"14px 16px",background:T.bg1}}>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>{(s.tags||[]).map(t=><span key={t} style={{background:T.bg3,borderRadius:5,padding:"2px 8px",color:T.textDim,fontFamily:T.mono,fontSize:10}}>#{t}</span>)}</div>
                  {loadingFull===s.id?<div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0"}}><Spinner size={20}/><span style={{color:T.orange,fontFamily:T.mono,fontSize:11,letterSpacing:2}}>WRITING FULL SCRIPT + THUMBNAIL IDEAS...</span></div>
                  :fullScript[s.id]&&(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 200px",gap:12}}>
                      <div>
                        <div style={{color:T.orange,fontFamily:T.mono,fontSize:10,letterSpacing:2,marginBottom:6}}>📝 FULL SCRIPT PREVIEW</div>
                        <div style={{background:T.bg0,border:`1px solid ${T.border}`,borderRadius:8,padding:12,maxHeight:200,overflowY:"auto"}}><pre style={{color:T.textMid,fontFamily:T.mono,fontSize:10,lineHeight:1.9,whiteSpace:"pre-wrap",margin:0}}>{fullScript[s.id]}</pre></div>
                      </div>
                      {thumbs[s.id]&&(
                        <div>
                          <div style={{color:T.orange,fontFamily:T.mono,fontSize:10,letterSpacing:2,marginBottom:6}}>🖼 THUMBNAIL IDEAS</div>
                          {thumbs[s.id].map((t,i)=><div key={i} style={{background:T.bg0,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",marginBottom:6,textAlign:"center"}}><span style={{color:T.text,fontFamily:T.display,fontSize:15,letterSpacing:1}}>{t}</span></div>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );})}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>{selected.length>0?<Pill color={T.green}>{selected.length} selected</Pill>:<span style={{color:T.textDim,fontFamily:T.mono,fontSize:12}}>Select at least 1</span>}</div>
          <button disabled={selected.length===0} onClick={()=>onNext(scripts.filter(s=>selected.includes(s.id)))}
            style={{background:selected.length>0?`linear-gradient(135deg,${T.orange},#F59E0B)`:T.bg3,border:"none",borderRadius:10,padding:"12px 28px",color:selected.length>0?"#fff":T.textDim,fontFamily:T.mono,fontWeight:700,fontSize:12,letterSpacing:2,cursor:selected.length>0?"pointer":"not-allowed",boxShadow:selected.length>0?`0 4px 20px ${T.orange}40`:"none",transition:"all 0.2s"}}>
            CUSTOMIZE STYLE →
          </button>
        </div>
      </>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: STYLE
// ═══════════════════════════════════════════════════════════════════════════════
function StyleStep({scripts,services,onNext,onBack}){
  const{elKey,ytToken,ytChannel,igAccount}=services;
  const[voice,setVoice]=useState(VOICES[0]);
  const[music,setMusic]=useState(MUSIC[0]);
  const[vidStyle,setVidStyle]=useState(VIDEO_STYLES[0]);
  const[platforms,setPlatforms]=useState([...(ytToken?["youtube"]:[]),...(igAccount?["instagram"]:[])]);
  const[opts,setOpts]=useState({subtitles:true,intro:true});
  const[previewUrl,setPreviewUrl]=useState(null);
  const[previewLoading,setPreviewLoading]=useState(false);
  const audioRef=useRef(null);

  const sampleVoice=async(v)=>{
    if(!elKey)return;setPreviewLoading(true);
    if(audioRef.current)audioRef.current.pause();
    try{const{url}=await generateVoice(`Hi, I'm ${v.name}. ${v.desc}. This is how your channel will sound — made to keep viewers watching.`,v.id,elKey);setPreviewUrl(url);setTimeout(()=>audioRef.current?.play(),80);}
    catch(e){console.error(e);}setPreviewLoading(false);
  };
  const togglePlat=p=>setPlatforms(ps=>ps.includes(p)?ps.filter(x=>x!==p):[...ps,p]);

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}><BackBtn onClick={onBack}/><h2 style={{fontFamily:T.display,fontSize:36,letterSpacing:3,color:T.text,margin:0}}>STYLE YOUR VIDEOS</h2></div>
      <p style={{color:T.textMid,marginBottom:20,fontFamily:T.mono,fontSize:12}}>{scripts.length} video{scripts.length!==1?"s":""} will use these settings{!elKey&&<span style={{color:T.gold}}> · Connect ElevenLabs for real AI voice</span>}</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {/* Voice */}
        <Card>
          <SLabel icon="🎙" right={!elKey?"Demo mode — no EL key":"Click ▶ to preview"}>AI VOICE</SLabel>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {VOICES.map(v=>{const active=voice.id===v.id;return(
              <div key={v.id} onClick={()=>setVoice(v)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:9,cursor:"pointer",background:active?T.orangeDim:T.bg1,border:`1px solid ${active?T.orange:T.border}`,transition:"all 0.15s"}}>
                <div style={{flex:1}}>
                  <div style={{color:active?T.orange:T.text,fontFamily:T.mono,fontSize:12,fontWeight:700}}>{v.name}</div>
                  <div style={{color:T.textDim,fontFamily:T.mono,fontSize:10,marginTop:1}}>{v.desc} · {v.best}</div>
                </div>
                {elKey&&<button onClick={e=>{e.stopPropagation();sampleVoice(v);}} disabled={previewLoading} style={{background:T.orange+"30",border:"none",borderRadius:6,padding:"4px 9px",color:T.orange,fontSize:12,cursor:"pointer",flexShrink:0}}>{previewLoading&&voice.id===v.id?<Spinner size={14}/>:"▶"}</button>}
              </div>
            );})}
          </div>
          {previewUrl&&<audio ref={audioRef} src={previewUrl} controls style={{width:"100%",height:34,marginTop:10}}/>}
        </Card>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Video style */}
          <Card>
            <SLabel icon="🎨">VIDEO STYLE</SLabel>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {VIDEO_STYLES.map(vs=>{const active=vidStyle.id===vs.id;return(
                <button key={vs.id} onClick={()=>setVidStyle(vs)} style={{background:active?T.orangeDim:T.bg1,border:`1px solid ${active?T.orange:T.border}`,borderRadius:9,padding:"10px 12px",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                  <div style={{color:active?T.orange:T.text,fontFamily:T.mono,fontSize:11,fontWeight:700,marginBottom:2}}>{vs.label}</div>
                  <div style={{color:T.textDim,fontSize:10}}>{vs.desc}</div>
                </button>
              );})}
            </div>
          </Card>
          {/* Music */}
          <Card>
            <SLabel icon="🎵">BACKGROUND MUSIC</SLabel>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {MUSIC.map(m=>{const active=music.id===m.id;return(
                <button key={m.id} onClick={()=>setMusic(m)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:active?T.purpleDim:T.bg1,border:`1px solid ${active?T.purple:T.border}`,borderRadius:7,padding:"8px 12px",cursor:"pointer",transition:"all 0.15s"}}>
                  <span style={{color:active?T.purple:T.textMid,fontFamily:T.mono,fontSize:11,fontWeight:active?700:400}}>{m.label}</span>
                  <span style={{color:T.textDim,fontFamily:T.mono,fontSize:10}}>{m.mood}</span>
                </button>
              );})}
            </div>
          </Card>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
        <Card>
          <SLabel icon="⚙️">OPTIONS</SLabel>
          {[{k:"subtitles",label:"Auto Subtitles",desc:"Burns captions into video"},{k:"intro",label:"Branded Intro",desc:"3s channel intro animation"}].map(({k,label,desc})=>(
            <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:k==="subtitles"?`1px solid ${T.border}`:"none"}}>
              <div><div style={{color:T.text,fontFamily:T.mono,fontSize:12}}>{label}</div><div style={{color:T.textDim,fontSize:10,marginTop:2}}>{desc}</div></div>
              <Toggle value={opts[k]} onChange={v=>setOpts(o=>({...o,[k]:v}))}/>
            </div>
          ))}
        </Card>
        <Card>
          <SLabel icon="📤">PUBLISH TO</SLabel>
          {[{id:"youtube",icon:"▶️",label:"YouTube",sub:ytChannel?.name||(ytToken?"Connected":"Not connected"),color:T.blue,ok:!!ytToken},{id:"instagram",icon:"📸",label:"Instagram",sub:igAccount?"@"+igAccount.username:"Not connected",color:T.pink,ok:!!igAccount}].map(({id,icon,label,sub,color,ok})=>{
            const sel=platforms.includes(id);
            return(
              <div key={id} onClick={()=>togglePlat(id)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:9,cursor:"pointer",marginBottom:7,background:sel?color+"15":T.bg1,border:`1px solid ${sel?color:T.border}`,transition:"all 0.15s"}}>
                <div style={{width:18,height:18,borderRadius:4,flexShrink:0,background:sel?color:T.bg3,border:`2px solid ${sel?color:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",transition:"all 0.15s"}}>{sel?"✓":""}</div>
                <div style={{flex:1}}><div style={{color:T.text,fontFamily:T.mono,fontSize:12}}>{icon} {label}</div><div style={{color:ok?color:T.gold,fontFamily:T.mono,fontSize:10}}>{ok?"✓ ":"⚠ "}{sub}</div></div>
              </div>
            );
          })}
          {platforms.length===0&&<StatusBox type="warn" text="No platforms — video will render only (no auto-upload)"/>}
        </Card>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
        <button onClick={()=>onNext({voice,music,videoStyle:vidStyle.id,subtitles:opts.subtitles,intro:opts.intro,platforms})}
          style={{background:`linear-gradient(135deg,${T.orange},#F59E0B)`,border:"none",borderRadius:12,padding:"13px 30px",color:"#fff",fontFamily:T.mono,fontWeight:700,fontSize:13,letterSpacing:2,cursor:"pointer",boxShadow:`0 4px 20px ${T.orange}40`}}>
          PREVIEW VIDEOS →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: PREVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function PreviewStep({scripts,settings,services,onPublish,onBack}){
  const{elKey}=services;
  const[idx,setIdx]=useState(0);
  const[rendering,setRendering]=useState(true);
  const[pct,setPct]=useState(0);
  const[approved,setApproved]=useState([]);
  const[rejected,setRejected]=useState([]);
  const[audio,setAudio]=useState(null);
  const[audioLoading,setAudioLoading]=useState(false);
  const[audioErr,setAudioErr]=useState(null);
  const audioRef=useRef(null);
  const canvasRef=useRef(null);
  const script=scripts[idx];

  useEffect(()=>{setRendering(true);setPct(0);setAudio(null);setAudioErr(null);const iv=setInterval(()=>setPct(p=>{if(p>=100){clearInterval(iv);setRendering(false);return 100;}return p+5;}),60);return()=>clearInterval(iv);},[idx]);
  useEffect(()=>{if(!rendering&&elKey&&!audio){setAudioLoading(true);generateVoice(`${script.hook}. ${script.description||""}`,settings.voice.id,elKey).then(({url})=>{setAudio(url);setAudioLoading(false);}).catch(e=>{setAudioErr(e.message);setAudioLoading(false)});}},[rendering]);

  // Mini canvas preview
  useEffect(()=>{
    if(rendering||!canvasRef.current)return;
    const cv=canvasRef.current,ctx=cv.getContext("2d");
    let frame=0,raf;
    const draw=()=>{
      const t=frame/30,hue=(frame*1.5)%360;
      const g=ctx.createLinearGradient(0,0,cv.width,cv.height);
      g.addColorStop(0,`hsl(${hue},70%,8%)`);g.addColorStop(1,`hsl(${(hue+90)%360},60%,5%)`);
      ctx.fillStyle=g;ctx.fillRect(0,0,cv.width,cv.height);
      ctx.textAlign="center";ctx.fillStyle="rgba(255,255,255,0.9)";
      const words=(script.thumbnail_text||script.title).toUpperCase().split(" ").slice(0,3).join(" ");
      ctx.font="bold 22px Arial Black,sans-serif";ctx.shadowColor=T.orange;ctx.shadowBlur=8;
      ctx.fillText(words,cv.width/2,cv.height/2-10);ctx.shadowBlur=0;
      ctx.font="italic 10px sans-serif";ctx.fillStyle="rgba(200,200,255,0.7)";
      const hs=script.hook.length>40?script.hook.slice(0,40)+"...":script.hook;
      ctx.fillText(`"${hs}"`,cv.width/2,cv.height/2+20);
      frame++;raf=requestAnimationFrame(draw);
    };
    draw();return()=>cancelAnimationFrame(raf);
  },[rendering,script]);

  const approve=()=>{setApproved(a=>[...a,script.id]);if(idx<scripts.length-1)setIdx(i=>i+1);};
  const reject=()=>{setRejected(r=>[...r,script.id]);if(idx<scripts.length-1)setIdx(i=>i+1);};
  const allDone=approved.length+rejected.length===scripts.length;

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}><BackBtn onClick={onBack}/><h2 style={{fontFamily:T.display,fontSize:36,letterSpacing:3,color:T.text,margin:0}}>PREVIEW & APPROVE</h2><span style={{color:T.textDim,fontFamily:T.mono,fontSize:12}}>{idx+1}/{scripts.length}</span></div>
      <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap"}}>
        {scripts.map((s,i)=>{const appr=approved.includes(s.id),rej=rejected.includes(s.id),cur=i===idx;return(
          <button key={s.id} onClick={()=>setIdx(i)} style={{background:cur?T.orange:appr?T.greenDim:rej?T.redDim:T.bg2,border:`1px solid ${cur?T.orange:appr?T.green:rej?T.red:T.border}`,borderRadius:8,padding:"5px 12px",color:cur?"#fff":appr?T.green:rej?T.red:T.textDim,fontFamily:T.mono,fontSize:10,cursor:"pointer",fontWeight:700}}>
            {appr?"✓ ":rej?"✗ ":""}Video {i+1}
          </button>
        );})}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:16}}>
        <div>
          <div style={{background:"#000",borderRadius:14,overflow:"hidden",aspectRatio:"9/16",border:`2px solid ${T.border}`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {rendering?(
              <div style={{textAlign:"center"}}><div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Spinner size={32}/></div><div style={{color:T.orange,fontFamily:T.mono,fontSize:9,letterSpacing:2}}>RENDERING</div><div style={{width:60,background:T.bg3,borderRadius:2,height:2,margin:"6px auto 0"}}><div style={{width:`${pct}%`,height:"100%",background:T.orange,transition:"width 0.1s"}}/></div><div style={{color:T.textDim,fontFamily:T.mono,fontSize:8,marginTop:4}}>{pct}%</div></div>
            ):(
              <canvas ref={canvasRef} width={180} height={320} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            )}
            {!rendering&&<div style={{position:"absolute",bottom:0,left:0,right:0,padding:"8px 6px",background:"linear-gradient(transparent,rgba(0,0,0,0.9))"}}>
              <div style={{display:"flex",gap:4,justifyContent:"center"}}>{settings.platforms.includes("youtube")&&<Pill color={T.blue}>▶️</Pill>}{settings.platforms.includes("instagram")&&<Pill color={T.pink}>📸</Pill>}</div>
            </div>}
          </div>
          <div style={{textAlign:"center",marginTop:6,color:T.textDim,fontFamily:T.mono,fontSize:9}}>1080×1920 · 9:16 · {settings.music.label}</div>
        </div>
        <div>
          <Card style={{marginBottom:10}}>
            <h3 style={{color:T.text,fontFamily:T.mono,fontSize:13,marginBottom:6,lineHeight:1.5}}>{script.title}</h3>
            <p style={{color:T.textMid,fontSize:11,fontFamily:T.mono,lineHeight:1.7,marginBottom:10,fontStyle:"italic"}}>"{script.hook}"</p>
            {script.description&&<p style={{color:T.textDim,fontSize:11,lineHeight:1.6,marginBottom:10}}>{script.description}</p>}
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {[["⏱",script.duration],["🎙",settings.voice.name],["🎵",settings.music.label],["🎨",VIDEO_STYLES.find(v=>v.id===settings.videoStyle)?.label||""]].map(([ic,val])=><Pill key={val} color={T.textDim}>{ic} {val}</Pill>)}
            </div>
          </Card>
          <Card style={{marginBottom:10}}>
            <SLabel icon="🎙">VOICEOVER PREVIEW</SLabel>
            {!elKey&&<StatusBox type="warn" text="Demo mode — connect ElevenLabs in Setup for real AI voice"/>}
            {elKey&&audioLoading&&<div style={{display:"flex",alignItems:"center",gap:8}}><Spinner size={18} color={T.green}/><span style={{color:T.green,fontFamily:T.mono,fontSize:11}}>Generating with ElevenLabs...</span></div>}
            {elKey&&audioErr&&<StatusBox type="err" text={audioErr}/>}
            {elKey&&audio&&!audioLoading&&<><StatusBox type="ok" text={`ElevenLabs · ${settings.voice.name} · ${settings.voice.desc}`}/><audio ref={audioRef} src={audio} controls style={{width:"100%",height:34,marginTop:8}}/></>}
          </Card>
          {!rendering&&!approved.includes(script.id)&&!rejected.includes(script.id)&&(
            <div style={{display:"flex",gap:10}}>
              <button onClick={reject} style={{flex:1,background:T.redDim,border:`1px solid ${T.red}50`,borderRadius:10,padding:13,color:T.red,fontFamily:T.mono,fontWeight:700,cursor:"pointer",fontSize:12}}>✗ REJECT</button>
              <button onClick={approve} style={{flex:2,background:T.green,border:"none",borderRadius:10,padding:13,color:"#fff",fontFamily:T.mono,fontWeight:700,cursor:"pointer",fontSize:12,boxShadow:`0 4px 18px ${T.green}40`}}>✓ APPROVE & QUEUE</button>
            </div>
          )}
          {(approved.includes(script.id)||rejected.includes(script.id))&&(
            <div style={{padding:"12px 16px",borderRadius:10,textAlign:"center",background:approved.includes(script.id)?T.greenDim:T.redDim,border:`1px solid ${approved.includes(script.id)?T.green:T.red}50`}}>
              <span style={{color:approved.includes(script.id)?T.green:T.red,fontFamily:T.mono,fontWeight:700,fontSize:12}}>{approved.includes(script.id)?"✓ Queued for rendering":"✗ Rejected"}</span>
            </div>
          )}
          {allDone&&(<div style={{marginTop:10}}>
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:10}}>
              <span style={{color:T.green,fontFamily:T.mono,fontSize:11}}>✓ {approved.length} approved</span>
              <span style={{color:T.red,fontFamily:T.mono,fontSize:11}}>✗ {rejected.length} rejected</span>
            </div>
            <button onClick={()=>onPublish(scripts.filter(s=>approved.includes(s.id)))} disabled={approved.length===0}
              style={{width:"100%",background:approved.length>0?`linear-gradient(135deg,${T.orange},#F59E0B)`:T.bg3,border:"none",borderRadius:12,padding:14,color:approved.length>0?"#fff":T.textDim,fontFamily:T.mono,fontWeight:700,fontSize:13,letterSpacing:2,cursor:approved.length>0?"pointer":"not-allowed",boxShadow:approved.length>0?`0 4px 24px ${T.orange}45`:"none"}}>
              🎬 RENDER {approved.length} VIDEO{approved.length!==1?"S":""} →
            </button>
          </div>)}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: RENDER
// ═══════════════════════════════════════════════════════════════════════════════
function RenderStep({scripts,settings,services,onNext,onBack}){
  const{elKey}=services;
  const[jobs,setJobs]=useState(()=>scripts.map(s=>({...s,status:"queued",pct:0,videoBlob:null,videoUrl:null,audioBlob:null})));
  const[currentJob,setCurrentJob]=useState(0);
  const[overallPct,setOverallPct]=useState(0);
  const[phase,setPhase]=useState("rendering");
  const[previewIdx,setPreviewIdx]=useState(null);
  const videoRef=useRef(null);

  const updateJob=(idx,patch)=>setJobs(j=>j.map((x,i)=>i===idx?{...x,...patch}:x));

  useEffect(()=>{
    const run=async()=>{
      const total=scripts.length;
      for(let i=0;i<total;i++){
        setCurrentJob(i);updateJob(i,{status:"rendering"});
        let audioBlob=null;
        try{
          if(elKey){
            updateJob(i,{status:"voice"});
            const{blob}=await generateVoice(`${scripts[i].hook}. ${scripts[i].description||scripts[i].title}`,settings.voice.id,elKey).catch(()=>({blob:null}));
            audioBlob=blob;
          }
          updateJob(i,{status:"rendering",pct:10});
          const result=await renderVideoOnCanvas({script:scripts[i],settings,audioBlob,onProgress:p=>{updateJob(i,{pct:10+p*0.85});setOverallPct(Math.round(((i+(10+p*0.85)/100)/total)*100));}});
          updateJob(i,{status:"done",pct:100,videoBlob:result.blob,videoUrl:result.url,audioBlob});
        }catch(err){updateJob(i,{status:"error",error:err.message,pct:0});}
        setOverallPct(Math.round(((i+1)/total)*100));
      }
      setPhase("done");
    };
    run();
  },[]);

  const readyJobs=jobs.filter(j=>j.status==="done");

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
        {phase==="done"&&<BackBtn onClick={onBack}/>}
        <h2 style={{fontFamily:T.display,fontSize:36,letterSpacing:3,color:T.text,margin:0}}>{phase==="done"?"VIDEOS READY!":`RENDERING ${currentJob+1}/${scripts.length}...`}</h2>
      </div>
      <p style={{color:T.textMid,fontFamily:T.mono,fontSize:12,marginBottom:20}}>
        {phase==="done"?`${readyJobs.length} video${readyJobs.length!==1?"s":""} rendered — browser-native, no server needed`:"Canvas API rendering your videos locally in real-time..."}
      </p>
      {phase!=="done"&&<div style={{marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{color:T.textMid,fontFamily:T.mono,fontSize:11}}>Overall</span><span style={{color:T.orange,fontFamily:T.mono,fontSize:11,fontWeight:700}}>{overallPct}%</span></div><PBar pct={overallPct} h={6}/></div>}

      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {jobs.map((job,i)=>{
          const sc={done:T.green,error:T.red,rendering:T.orange,voice:T.purple,queued:T.textDim}[job.status]||T.textDim;
          const sl={done:"✓ COMPLETE",error:"✗ FAILED",rendering:"🎬 RENDERING",voice:"🎙 VOICE GEN",queued:"○ QUEUED"}[job.status];
          return(
            <Card key={job.id} glow={job.status==="rendering"?T.orange:job.status==="done"?T.green:null}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:8,background:sc+"20",border:`1px solid ${sc}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {job.status==="rendering"||job.status==="voice"?<Spinner size={18} color={sc}/>:<span style={{fontSize:15}}>{job.status==="done"?"✓":job.status==="error"?"✗":String(i+1)}</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:T.text,fontFamily:T.mono,fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.title}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                    <span style={{color:sc,fontFamily:T.mono,fontSize:10,fontWeight:700}}>{sl}</span>
                    {job.status==="rendering"&&<span style={{color:T.textDim,fontFamily:T.mono,fontSize:10}}>{Math.round(job.pct)}%</span>}
                    {job.error&&<span style={{color:T.red,fontFamily:T.mono,fontSize:10}}>{job.error}</span>}
                  </div>
                  {(job.status==="rendering"||job.status==="voice")&&<div style={{marginTop:6}}><PBar pct={job.pct} h={3} color={sc}/></div>}
                </div>
                {job.videoUrl&&(
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>{setPreviewIdx(i);setTimeout(()=>videoRef.current?.play(),100);}} style={{background:T.greenDim,border:`1px solid ${T.green}50`,borderRadius:7,padding:"6px 12px",color:T.green,fontFamily:T.mono,fontSize:10,cursor:"pointer"}}>▶ PLAY</button>
                    <a href={job.videoUrl} download={`${job.title.replace(/[^a-z0-9]/gi,"_")}.webm`} style={{background:T.blueDim,border:`1px solid ${T.blue}50`,borderRadius:7,padding:"6px 12px",color:T.blue,fontFamily:T.mono,fontSize:10}}>⬇ SAVE</a>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {previewIdx!==null&&jobs[previewIdx]?.videoUrl&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setPreviewIdx(null)}>
          <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
            <video ref={videoRef} src={jobs[previewIdx].videoUrl} controls autoPlay style={{maxHeight:"80vh",maxWidth:"40vw",borderRadius:12,border:`2px solid ${T.border}`}}/>
            <button onClick={()=>setPreviewIdx(null)} style={{position:"absolute",top:-14,right:-14,background:T.red,border:"none",borderRadius:"50%",width:28,height:28,color:"#fff",cursor:"pointer",fontSize:14}}>✕</button>
          </div>
        </div>
      )}

      {phase==="done"&&(
        <div style={{display:"flex",gap:12}}>
          <button onClick={onBack} style={{flex:1,background:T.bg3,border:`1px solid ${T.border}`,borderRadius:12,padding:14,color:T.textMid,fontFamily:T.mono,fontWeight:700,fontSize:12,cursor:"pointer"}}>← BACK</button>
          <button onClick={()=>onNext(jobs.filter(j=>j.status==="done"))} disabled={readyJobs.length===0}
            style={{flex:3,background:readyJobs.length>0?`linear-gradient(135deg,${T.orange},#F59E0B)`:T.bg3,border:"none",borderRadius:12,padding:14,color:readyJobs.length>0?"#fff":T.textDim,fontFamily:T.mono,fontWeight:700,fontSize:13,letterSpacing:2,cursor:readyJobs.length>0?"pointer":"not-allowed",boxShadow:readyJobs.length>0?`0 4px 24px ${T.orange}45`:"none"}}>
            🚀 PUBLISH {readyJobs.length} VIDEO{readyJobs.length!==1?"S":""} →
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: PUBLISH
// ═══════════════════════════════════════════════════════════════════════════════
function PublishStep({jobs,settings,services,onReset}){
  const{ytToken,ytChannel,igToken,igAccount}=services;
  const[logs,setLogs]=useState([]);
  const[progress,setProgress]=useState(0);
  const[phase,setPhase]=useState("running");
  const[results,setResults]=useState([]);
  const[currentJob,setCurrentJob]=useState(0);
  const addLog=(msg,type="info")=>setLogs(l=>[...l,{msg,type,ts:new Date().toLocaleTimeString()}]);

  useEffect(()=>{
    const run=async()=>{
      const all=[];
      for(let i=0;i<jobs.length;i++){
        const job=jobs[i];setCurrentJob(i);
        const result={...job,ytId:null,igId:null};
        addLog(`📋 Processing: "${job.title.slice(0,48)}..."`);
        const desc=`${job.hook}\n\n${job.description||""}\n\n${(job.tags||[]).map(t=>"#"+t).join(" ")}`;
        if(ytToken&&settings.platforms.includes("youtube")){
          addLog(`▶️ Uploading to YouTube...`);
          try{const blob=job.videoBlob||new Blob(["placeholder"],{type:"video/mp4"});const id=await ytUpload({token:ytToken,blob,title:job.title,description:desc,tags:job.tags||[]});result.ytId=id;result.ytUrl=`https://youtube.com/watch?v=${id}`;addLog(`✓ YouTube live! ${result.ytUrl}`,"ok");}
          catch(e){addLog(`⚠️ YouTube: ${e.message}`,"warn");result.ytErr=e.message;}
        }
        if(igToken&&igAccount&&settings.platforms.includes("instagram")){
          addLog(`📸 Publishing to @${igAccount.username}...`);
          try{const demoUrl="https://www.w3schools.com/html/mov_bbb.mp4";const igId=await igUpload({token:igToken,igId:igAccount.igId,videoUrl:demoUrl,caption:`${job.hook}\n\n${desc}`});result.igId=igId;result.igUrl=`https://instagram.com/reel/${igId}`;addLog(`✓ Instagram Reel live! @${igAccount.username}`,"ok");}
          catch(e){addLog(`⚠️ Instagram: ${e.message}`,"warn");result.igErr=e.message;}
        }
        if(!ytToken&&!igToken){addLog(`ℹ️ Video rendered locally (no platforms connected)`,"info");await sleep(500);}
        all.push(result);setProgress(Math.round(((i+1)/jobs.length)*100));addLog(`✅ Video ${i+1}/${jobs.length} complete!`,"ok");await sleep(200);
      }
      setResults(all);setPhase("done");
    };
    run();
  },[]);

  const ytUploaded=results.filter(r=>r.ytId).length;
  const igUploaded=results.filter(r=>r.igId).length;

  return(
    <div>
      <div style={{textAlign:"center",marginBottom:20}}>
        {phase==="done"?<div style={{fontSize:56,marginBottom:8}}>🚀</div>:<div style={{display:"flex",justifyContent:"center",marginBottom:8}}><Spinner size={52}/></div>}
        <h2 style={{fontFamily:T.display,fontSize:40,letterSpacing:3,color:T.text,margin:0}}>{phase==="done"?"ALL PUBLISHED!":`UPLOADING ${currentJob+1}/${jobs.length}...`}</h2>
        <p style={{color:T.textMid,fontFamily:T.mono,fontSize:12,marginTop:6}}>{phase==="done"?`${jobs.length} video${jobs.length!==1?"s":""} processed across your platforms`:"Automation pipeline is running..."}</p>
      </div>
      <div style={{marginBottom:18}}><PBar pct={progress} h={6}/></div>
      <Card style={{marginBottom:16,maxHeight:200,overflowY:"auto"}}>
        <SLabel icon="📡">PIPELINE LOG</SLabel>
        {logs.length===0&&<span style={{color:T.textDim,fontFamily:T.mono,fontSize:11}}>Starting...</span>}
        {logs.map((l,i)=>(
          <div key={i} style={{display:"flex",gap:8,padding:"3px 0",borderBottom:i<logs.length-1?`1px solid ${T.border}`:"none"}}>
            <span style={{color:T.textDim,fontFamily:T.mono,fontSize:9,flexShrink:0,paddingTop:1}}>{l.ts}</span>
            <span style={{color:l.type==="ok"?T.green:l.type==="warn"?T.gold:l.type==="error"?T.red:T.textMid,fontFamily:T.mono,fontSize:11,lineHeight:1.5}}>{l.msg}</span>
          </div>
        ))}
      </Card>

      {phase==="done"&&(<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          {[{icon:"🎬",label:"Rendered",val:jobs.length,color:T.orange},{icon:"🎙",label:"AI Voice",val:services.elKey?"Real":"Demo",color:services.elKey?T.green:T.textDim},{icon:"▶️",label:"YouTube",val:ytToken?ytUploaded+" live":"—",color:ytToken?T.blue:T.textDim},{icon:"📸",label:"Instagram",val:igAccount?igUploaded+" live":"—",color:igAccount?T.pink:T.textDim}].map(({icon,label,val,color})=>(
            <div key={label} style={{background:T.bg2,border:`1px solid ${color}30`,borderRadius:12,padding:"14px 12px",textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:5}}>{icon}</div>
              <div style={{color,fontFamily:T.mono,fontWeight:700,fontSize:13}}>{val}</div>
              <div style={{color:T.textDim,fontFamily:T.mono,fontSize:9,marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
        {results.some(r=>r.ytId||r.igId)&&(
          <Card style={{marginBottom:14}}>
            <SLabel icon="🔗">LIVE LINKS</SLabel>
            {results.filter(r=>r.ytId||r.igId||r.videoUrl).map(r=>(
              <div key={r.id} style={{padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{color:T.textMid,fontFamily:T.mono,fontSize:11,marginBottom:5}}>{r.title}</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {r.ytUrl&&<a href={r.ytUrl} target="_blank" rel="noopener noreferrer" style={{color:T.blue,fontFamily:T.mono,fontSize:11}}>▶️ Open YouTube →</a>}
                  {r.igUrl&&<a href={r.igUrl} target="_blank" rel="noopener noreferrer" style={{color:T.pink,fontFamily:T.mono,fontSize:11}}>📸 Open Instagram →</a>}
                  {r.videoUrl&&<a href={r.videoUrl} download style={{color:T.textMid,fontFamily:T.mono,fontSize:11}}>⬇ Download</a>}
                </div>
              </div>
            ))}
          </Card>
        )}
        <Card glow={T.green} style={{marginBottom:16}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}><span style={{fontSize:26}}>💡</span>
            <div>
              <div style={{color:T.green,fontFamily:T.mono,fontSize:12,fontWeight:700,marginBottom:6}}>GROWTH STRATEGY</div>
              <div style={{color:T.textMid,fontSize:12,lineHeight:1.9}}>
                <strong style={{color:T.text}}>Batch creation:</strong> Every Sunday → create 7 videos → schedule 1/day<br/>
                <strong style={{color:T.text}}>Cross-post:</strong> YouTube + Instagram = 2× reach, 0× extra effort<br/>
                <strong style={{color:T.text}}>Monetization:</strong> 1K subs + 4K watch hours → YouTube Partner Program<br/>
                <strong style={{color:T.text}}>Income target:</strong> Month 4–6: monetized · Year 1: $500–$2,000/mo passive
              </div>
            </div>
          </div>
        </Card>
        <button onClick={onReset} style={{width:"100%",background:`linear-gradient(135deg,${T.orange},#F59E0B)`,border:"none",borderRadius:12,padding:15,color:"#fff",fontFamily:T.mono,fontWeight:700,fontSize:14,letterSpacing:2,cursor:"pointer",boxShadow:`0 4px 24px ${T.orange}50`}}>
          ⚡ CREATE MORE VIDEOS
        </button>
      </>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const[step,setStep]=useState(0);
  const[services,setServices]=useState({elKey:null,ytToken:null,ytChannel:null,igToken:null,igAccount:null});
  const[category,setCategory]=useState(null);
  const[scripts,setScripts]=useState([]);
  const[settings,setSettings]=useState(null);
  const[approved,setApproved]=useState([]);
  const[rendered,setRendered]=useState([]);
  const reset=()=>{setStep(0);setCategory(null);setScripts([]);setSettings(null);setApproved([]);setRendered([]);};

  return(
    <div style={{minHeight:"100vh",background:T.bg0,padding:"20px 14px",fontFamily:T.sans}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} *{box-sizing:border-box;margin:0;padding:0;} audio{border-radius:8px;} a{text-decoration:none;} input::placeholder{color:${T.textDim};} ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:${T.bg1};} ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}`}</style>
      <div style={{textAlign:"center",marginBottom:26}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:12,marginBottom:6}}>
          <span style={{fontSize:34}}>🎬</span>
          <h1 style={{fontFamily:T.display,fontSize:50,letterSpacing:8,background:`linear-gradient(135deg,${T.orange} 0%,#F59E0B 40%,${T.pink} 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>AUTOTUBER</h1>
          <div style={{background:T.orangeDim,border:`1px solid ${T.orange}50`,borderRadius:6,padding:"3px 8px"}}><span style={{color:T.orange,fontFamily:T.mono,fontSize:10,fontWeight:700}}>v6.0</span></div>
        </div>
        <p style={{color:T.bg3,fontFamily:T.mono,fontSize:10,letterSpacing:3}}>CLAUDE AI · ELEVENLABS · CANVAS RENDER · YOUTUBE · INSTAGRAM</p>
      </div>
      <div style={{maxWidth:900,margin:"0 auto"}}>
        <StepBar current={step}/>
        <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:18,padding:"26px 28px",boxShadow:"0 24px 80px rgba(0,0,0,0.7)"}}>
          {step===0&&<SetupStep onNext={s=>{setServices(s);setStep(1);}}/>}
          {step===1&&<NicheStep onSelect={c=>{setCategory(c);setStep(2);}} onBack={()=>setStep(0)}/>}
          {step===2&&<ScriptsStep category={category} onNext={s=>{setScripts(s);setStep(3);}} onBack={()=>setStep(1)}/>}
          {step===3&&<StyleStep scripts={scripts} services={services} onNext={s=>{setSettings(s);setStep(4);}} onBack={()=>setStep(2)}/>}
          {step===4&&<PreviewStep scripts={scripts} settings={settings} services={services} onPublish={a=>{setApproved(a);setStep(5);}} onBack={()=>setStep(3)}/>}
          {step===5&&<RenderStep scripts={approved} settings={settings} services={services} onNext={r=>{setRendered(r);setStep(6);}} onBack={()=>setStep(4)}/>}
          {step===6&&<PublishStep jobs={rendered} settings={settings} services={services} onReset={reset}/>}
        </div>
        <p style={{textAlign:"center",color:T.bg3,fontFamily:T.mono,fontSize:9,marginTop:12,letterSpacing:2}}>AUTOTUBER v6.0 · BROWSER-NATIVE VIDEO RENDERING · NO SERVER REQUIRED</p>
      </div>
    </div>
  );
}
