import { TEAMS } from '../game/types';

export function buildStandaloneSingleHtml(): string {
  const teamsJson = JSON.stringify(TEAMS);
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="screen-orientation" content="landscape" />
<title>热血足球 · 单文件手机横屏版</title>
<style>
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;}
  html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#0d141d;color:#f8fafc;font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;touch-action:none;overscroll-behavior:none;}
  #shell{position:fixed;inset:0;overflow:hidden;background:#0d141d;}
  #shell.rot90{top:50%;left:50%;width:100vh;width:100dvh;height:100vw;transform:translate(-50%,-50%) rotate(90deg);transform-origin:center center;}
  canvas{display:block;width:100%;height:100%;}
  .hud{position:absolute;top:8px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;pointer-events:none;z-index:10;}
  .board{display:flex;align-items:center;background:rgba(13,20,29,.94);border:2px solid #020617;box-shadow:0 3px 0 rgba(0,0,0,.6);margin:0 auto;}
  .tbox{display:flex;align-items:center;gap:6px;padding:4px 10px;font-weight:800;font-size:13px;}
  .sc{font-size:18px;font-family:monospace;color:#fde047;}
  .clk{padding:3px 10px;background:#1e293b;border-left:2px solid #0f172a;border-right:2px solid #0f172a;font-family:monospace;font-weight:800;font-size:14px;text-align:center;}
  .util{display:flex;gap:6px;pointer-events:auto;}
  .ubtn{width:36px;height:36px;border:2px solid #020617;background:#16202e;color:#fff;font-weight:800;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
  .pad-wrap{position:absolute;inset:0;pointer-events:none;z-index:15;display:flex;justify-content:space-between;align-items:flex-end;padding:16px 20px;}
  .joy{pointer-events:auto;position:relative;width:116px;height:116px;border-radius:50%;border:2px solid rgba(255,255,255,.28);background:rgba(13,20,29,.55);display:flex;align-items:center;justify-content:center;touch-action:none;}
  .knob{width:46px;height:46px;border-radius:50%;background:#facc15;border:2px solid #fef08a;pointer-events:none;}
  .btns{pointer-events:auto;display:flex;align-items:flex-end;gap:10px;}
  .abtn{width:56px;height:56px;border-radius:50%;border:2px solid rgba(255,255,255,.7);color:#fff;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 0 rgba(0,0,0,.6);touch-action:none;}
  .abtn.big{width:68px;height:68px;font-size:14px;background:rgba(220,38,38,.95);border-color:#fca5a5;}
  .abtn.pass{background:rgba(5,150,105,.92);border-color:#6ee7b7;}
  .abtn.sup{background:rgba(217,119,6,.92);border-color:#fde047;}
  .abtn.dash{background:rgba(2,132,199,.88);border-color:#7dd3fc;}
  .overlay{position:absolute;inset:0;z-index:25;background:rgba(9,16,26,.86);display:flex;flex-direction:column;justify-content:center;align-items:center;padding:16px;overflow-y:auto;}
  .card{width:100%;max-width:520px;background:#0e1724;border:2px solid #facc15;padding:18px;box-shadow:0 6px 0 rgba(0,0,0,.6);}
  .tgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0;}
  .tbtn{border:2px solid #334155;background:#162233;color:#fff;padding:8px 10px;text-align:left;cursor:pointer;}
  .tbtn.sel{border-color:#facc15;background:#1e2d44;}
  .cta{width:100%;height:46px;border:2px solid #fde047;background:#dc2626;color:#fff;font-size:16px;font-weight:900;cursor:pointer;margin-top:10px;}
  .row{display:flex;gap:8px;margin-top:8px;}
  .sbtn{flex:1;height:38px;border:2px solid #334155;background:#16202e;color:#e2e8f0;font-weight:700;cursor:pointer;}
  .hidden{display:none!important;}
</style>
</head>
<body>
<div id="shell">
  <canvas id="cv"></canvas>
  <div id="hud" class="hud hidden">
    <div style="font-size:12px;font-weight:800;color:#fde047;background:rgba(13,20,29,.9);padding:4px 8px;border:2px solid #020617;">怒气 <span id="gauge">35%</span></div>
    <div class="board">
      <div class="tbox"><span id="hn">热血</span> <span id="hs" class="sc">0</span></div>
      <div id="clk" class="clk">01:30</div>
      <div class="tbox"><span id="as" class="sc" style="color:#7dd3fc">0</span> <span id="an">桑巴</span></div>
    </div>
    <div class="util">
      <button class="ubtn" id="btnRot" type="button">横屏</button>
      <button class="ubtn" id="btnMute" type="button">音</button>
      <button class="ubtn" id="btnPause" type="button">停</button>
    </div>
  </div>
  <div id="pad" class="pad-wrap hidden">
    <div id="joy" class="joy"><div id="knob" class="knob"></div></div>
    <div class="btns">
      <button id="bDash" class="abtn dash" type="button">冲刺</button>
      <button id="bPass" class="abtn pass" type="button">传球</button>
      <button id="bSup" class="abtn sup" type="button">必杀</button>
      <button id="bShoot" class="abtn big" type="button">射门</button>
    </div>
  </div>
  <div id="title" class="overlay">
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:24px;font-weight:900;color:#fff;">热血足球 · 单文件版</div>
          <div style="font-size:12px;color:#fde047;font-weight:700;">4V4 必杀技街机杯 · 支持横屏双摇杆</div>
        </div>
        <button id="tRot" class="sbtn" style="flex:0 0 auto;padding:0 12px;" type="button">横屏旋转</button>
      </div>
      <div id="tgrid" class="tgrid"></div>
      <button id="bStart" class="cta" type="button">开始比赛</button>
    </div>
  </div>
  <div id="over" class="overlay hidden">
    <div class="card" style="text-align:center;">
      <div id="overTitle" style="font-size:26px;font-weight:900;color:#fde047;">FULL TIME</div>
      <div id="overScore" style="font-size:32px;font-weight:900;margin:10px 0;font-family:monospace;">0 : 0</div>
      <div class="row">
        <button id="bAgain" class="cta" style="margin-top:0;" type="button">再来一局</button>
        <button id="bMenu" class="sbtn" style="height:46px;" type="button">选队</button>
      </div>
    </div>
  </div>
</div>
<script>
(function(){
  const TEAMS = ${teamsJson};
  const PW=1040, PH=600, GT=215, GB=385, GD=48, PR=16, BR=10, G=680;
  const shell=document.getElementById('shell'), cv=document.getElementById('cv'), ctx=cv.getContext('2d');
  const hud=document.getElementById('hud'), pad=document.getElementById('pad'), title=document.getElementById('title'), over=document.getElementById('over');
  let homeId=TEAMS[0].id, awayId=TEAMS[1].id, rot90=false, muted=false, mode='title';
  let st=null, keys={}, joyVec={x:0,y:0}, dashHeld=false, shootHeld=false, actx=null;

  function beep(f1,f2,d,tp,v){
    if(muted) return;
    try{
      if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)();
      if(actx.state==='suspended') actx.resume();
      const o=actx.createOscillator(), g=actx.createGain(), t=actx.currentTime;
      o.type=tp||'triangle'; o.frequency.setValueAtTime(f1,t); o.frequency.exponentialRampToValueAtTime(Math.max(25,f2),t+d);
      g.gain.setValueAtTime(v||0.18,t); g.gain.exponentialRampToValueAtTime(0.001,t+d);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+d+0.01);
    }catch(e){}
  }

  function renderTeams(){
    const tg=document.getElementById('tgrid'); tg.innerHTML='';
    TEAMS.forEach(t=>{
      const b=document.createElement('button');
      b.className='tbtn'+(t.id===homeId?' sel':'');
      b.innerHTML='<div style="font-weight:900;font-size:14px;">'+t.name+'</div><div style="font-size:11px;color:#fde047;margin-top:2px;">必杀: '+t.superName+'</div>';
      b.onclick=()=>{homeId=t.id; if(awayId===homeId) awayId=TEAMS.find(x=>x.id!==homeId).id; renderTeams();};
      tg.appendChild(b);
    });
  }
  renderTeams();

  function getT(id){return TEAMS.find(t=>t.id===id)||TEAMS[0];}

  function newMatch(attract){
    const ht=getT(homeId), at=getT(awayId);
    const roles=[['GK',1,40,PH/2],['DF',4,235,PH/2],['MF',8,390,PH*0.28],['FW',10,470,PH*0.65]];
    const players=[];
    [0,1].forEach(tm=>{
      roles.forEach((r,i)=>{
        const x=tm===0?r[2]:PW-r[2], y=tm===0?r[3]:PH-r[3];
        players.push({id:tm*4+i,team:tm,role:r[0],num:r[1],x,y,z:0,vx:0,vy:0,vz:0,hx:x,hy:y,fx:tm===0?1:-1,fy:0,wp:0,stun:0,tk:0,tkCd:0,cd:0,stam:100,spd:(tm===0?ht:at).speedRating/88});
      });
    });
    st={attract,phase:'kickoff',pt:0.8,time:90,sh:0,sa:0,gh:35,ga:30,activeId:3,charge:0,charging:false,shake:0,players,ball:{x:PW/2,y:PH/2,z:0,vx:0,vy:0,vz:0,own:null,last:null,cd:0,sup:null,st:0,dir:1,spin:0}};
    document.getElementById('hn').textContent=ht.shortName;
    document.getElementById('an').textContent=at.shortName;
  }

  function kickoff(tm){
    st.players.forEach(p=>{p.x=p.hx;p.y=p.hy;p.vx=p.vy=p.z=p.vz=p.stun=p.tk=0;p.fx=p.team===0?1:-1;p.fy=0;});
    const k=st.players.find(p=>p.team===tm&&p.role==='FW');
    if(k){k.x=tm===0?PW/2-24:PW/2+24;k.y=PH/2;if(tm===0)st.activeId=k.id;}
    Object.assign(st.ball,{x:PW/2,y:PH/2,z:0,vx:0,vy:0,vz:0,own:null,cd:0,sup:null,st:0});
    st.phase='kickoff'; st.pt=0.8;
  }

  function pass(p,ax,ay){
    const mates=st.players.filter(m=>m.team===p.team&&m.id!==p.id&&m.stun<=0);
    let best=null,bs=-999, dx=Math.hypot(ax,ay)>0.2?ax:p.fx, dy=Math.hypot(ax,ay)>0.2?ay:p.fy, dl=Math.hypot(dx,dy)||1;
    mates.forEach(m=>{
      const mx=m.x-p.x, my=m.y-p.y, d=Math.hypot(mx,my)||1;
      const sc=(mx/d)*(dx/dl)+(my/d)*(dy/dl)-d/900-(m.role==='GK'?0.8:0);
      if(sc>bs){bs=sc;best=m;}
    });
    const b=st.ball; b.own=null; b.cd=0.16; b.sup=null;
    if(best){
      const rx=best.x-b.x, ry=best.y-b.y, d=Math.hypot(rx,ry)||1, sp=Math.min(520,Math.max(360,d*1.4));
      b.vx=rx/d*sp; b.vy=ry/d*sp; b.vz=65;
      if(p.team===0&&best.role!=='GK') st.activeId=best.id;
    }else{b.vx=dx/dl*420;b.vy=dy/dl*420;b.vz=60;}
    if(p.team===0)st.gh=Math.min(100,st.gh+8); else st.ga=Math.min(100,st.ga+8);
    beep(210,90,0.07,'sine',0.15);
  }

  function shoot(p,chg,ay,forceSup){
    const b=st.ball, t=getT(p.team===0?homeId:awayId), g=p.team===0?st.gh:st.ga;
    const isSup=forceSup||(g>=100&&chg>=0.6);
    const gx=p.team===0?PW+10:-10, gy=PH/2+Math.max(-1,Math.min(1,ay))*70;
    const dx=gx-b.x, dy=gy-b.y, d=Math.hypot(dx,dy)||1;
    b.own=null; b.cd=0.2; b.last=p.team;
    if(isSup){
      b.sup=t.superType; b.st=1.3; b.dir=b.y<PH/2?1:-1;
      const sp=b.sup==='thunder'?880:760;
      b.vx=dx/d*sp; b.vy=dy/d*sp; b.vz=110;
      if(p.team===0)st.gh=0; else st.ga=0;
      st.shake=0.7; beep(320,80,0.26,'sawtooth',0.22);
    }else{
      const sp=480+chg*260; b.sup=null; b.vx=dx/d*sp; b.vy=dy/d*sp; b.vz=90+chg*110;
      if(p.team===0)st.gh=Math.min(100,st.gh+12); else st.ga=Math.min(100,st.ga+12);
      st.shake=0.2; beep(150,55,0.09,'triangle',0.2);
    }
    st.charge=0; st.charging=false;
  }

  function tackle(p){
    if(p.tkCd>0||p.stun>0)return;
    const l=Math.hypot(p.fx,p.fy)||1;
    p.tk=0.32; p.tkCd=0.78; p.vx=p.fx/l*420; p.vy=p.fy/l*420;
    beep(110,45,0.1,'sawtooth',0.14);
  }

  function step(dt){
    dt=Math.min(dt,0.05);
    st.shake=Math.max(0,st.shake-dt*2);
    if(st.phase==='fulltime')return;
    if(st.phase==='kickoff'){st.pt-=dt;if(st.pt<=0){st.phase='live';beep(2600,2800,0.16,'sine',0.1);}return;}
    if(st.phase==='goal'){st.pt-=dt;if(st.pt<=0)kickoff(st.last===0?1:0);return;}
    if(!st.attract){
      st.time=Math.max(0,st.time-dt);
      if(st.time<=0){
        st.phase='fulltime';
        if(mode==='playing'){
          mode='gameover';
          over.classList.remove('hidden');
          document.getElementById('overTitle').textContent=st.sh>st.sa?'热血制胜!!':st.sh===st.sa?'平局收场':'惜败收场';
          document.getElementById('overScore').textContent=st.sh+' : '+st.sa;
        }
        return;
      }
    }
    st.gh=Math.min(100,st.gh+dt*3.8); st.ga=Math.min(100,st.ga+dt*3.2);
    if(st.ball.own!==null&&st.players[st.ball.own].team===0&&st.players[st.ball.own].role!=='GK') st.activeId=st.ball.own;

    const mx=(keys['ArrowRight']||keys['KeyD']?1:0)-(keys['ArrowLeft']||keys['KeyA']?1:0)+joyVec.x;
    const my=(keys['ArrowDown']||keys['KeyS']?1:0)-(keys['ArrowUp']||keys['KeyW']?1:0)+joyVec.y;
    const mag=Math.hypot(mx,my), nx=mag>0.1?mx/Math.max(1,mag):0, ny=mag>0.1?my/Math.max(1,mag):0;

    st.players.forEach(p=>{
      if(p.tkCd>0)p.tkCd-=dt; if(p.cd>0)p.cd-=dt;
      if(p.z>0||p.vz!==0){p.z+=p.vz*dt;p.vz-=G*dt;if(p.z<=0){p.z=0;p.vz=0;}}
      if(p.stun>0){p.stun-=dt;p.vx*=Math.pow(0.1,dt);p.vy*=Math.pow(0.1,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;return;}
      if(p.tk>0){
        p.tk-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
        st.players.forEach(o=>{
          if(o.team!==p.team&&o.stun<=0&&Math.hypot(o.x-p.x,o.y-p.y)<30){
            o.stun=1.1;o.vx=p.fx*220;o.vy=p.fy*220;
            if(st.ball.own===o.id){st.ball.own=p.id;if(p.team===0&&p.role!=='GK')st.activeId=p.id;}
            beep(460,140,0.14,'square',0.16);
          }
        });
        return;
      }
      if(!st.attract&&p.id===st.activeId){
        const has=st.ball.own===p.id, dsh=(dashHeld||keys['ShiftLeft'])&&p.stam>4&&mag>0.15;
        p.stam=dsh?Math.max(0,p.stam-dt*40):Math.min(100,p.stam+dt*25);
        const sp=205*p.spd*(dsh?1.4:1);
        if(mag>0.1){p.vx=nx*sp;p.vy=ny*sp;p.fx=nx;p.fy=ny;}else{p.vx*=0.8;p.vy*=0.8;}
        if(has&&st.charging)st.charge=Math.min(1,st.charge+dt*1.7);
      }else{
        const b=st.ball, has=b.own===p.id, ds=p.team===0?1:-1;
        if(p.role==='GK'){
          if(has){if(p.cd<=0)pass(p,ds,0);p.vx=p.vy=0;}
          else{
            const gx=p.team===0?36:PW-36, gy=Math.max(GT+18,Math.min(GB-18,b.y));
            const dx=gx-p.x, dy=gy-p.y, d=Math.hypot(dx,dy)||1;
            p.vx=dx/d*Math.min(170,d*6); p.vy=dy/d*Math.min(170,d*6); p.fx=ds;
          }
        }else if(has){
          const eg=p.team===0?PW:0;
          if(Math.hypot(eg-p.x,PH/2-p.y)<320&&p.cd<=0){shoot(p,0.7,(Math.random()-0.5)*1.2,(p.team===0?st.gh:st.ga)>=100);p.cd=0.5;}
          else{
            const dx=eg-ds*120-p.x, dy=PH/2-p.y, d=Math.hypot(dx,dy)||1;
            p.vx=dx/d*185*p.spd; p.vy=dy/d*185*p.spd; p.fx=dx/d; p.fy=dy/d;
          }
        }else{
          const dx=b.x-p.x, dy=b.y-p.y, d=Math.hypot(dx,dy)||1;
          const mateNearest=st.players.filter(m=>m.team===p.team&&m.role!=='GK').sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];
          if(mateNearest&&mateNearest.id===p.id){
            p.vx=dx/d*185*p.spd; p.vy=dy/d*185*p.spd; p.fx=dx/d; p.fy=dy/d;
            if(b.own!==null&&st.players[b.own].team!==p.team&&d<48&&p.tkCd<=0&&Math.random()<dt*2)tackle(p);
          }else{
            const tx=p.hx+(b.x-PW/2)*0.4, ty=p.hy+(b.y-PH/2)*0.35, mx2=tx-p.x, my2=ty-p.y, md=Math.hypot(mx2,my2)||1;
            if(md>8){p.vx=mx2/md*160;p.vy=my2/md*160;p.fx=mx2/md;p.fy=my2/md;}else{p.vx*=0.8;p.vy*=0.8;}
          }
        }
      }
      p.x=Math.max(20,Math.min(PW-20,p.x+p.vx*dt));
      p.y=Math.max(20,Math.min(PH-20,p.y+p.vy*dt));
      p.wp+=Math.hypot(p.vx,p.vy)*dt*0.08;
    });

    const b=st.ball; if(b.cd>0)b.cd-=dt;
    if(b.own!==null){
      const o=st.players[b.own];
      if(o.stun>0)b.own=null;
      else{b.x=o.x+o.fx*20;b.y=o.y+o.fy*20;b.z=o.z;b.vx=o.vx;b.vy=o.vy;return;}
    }
    if(b.sup&&b.st>0){
      b.st-=dt;
      if(b.sup==='banana'){const s=Math.hypot(b.vx,b.vy)||1;b.vx+=(-b.vy/s)*b.dir*420*dt;b.vy+=(b.vx/s)*b.dir*420*dt;}
      if(b.sup==='phantom'){const s=Math.hypot(b.vx,b.vy)||1,w=Math.sin(b.st*24)*500;b.vx+=(-b.vy/s)*w*dt;b.vy+=(b.vx/s)*w*dt;}
    }else b.sup=null;
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.z+=b.vz*dt; b.spin+=Math.hypot(b.vx,b.vy)*dt*0.05;
    if(b.z>0){b.vz-=G*dt;if(b.z<=0){b.z=0;b.vz=Math.abs(b.vz)>40?-b.vz*0.55:0;}}
    else{b.vx*=Math.pow(b.sup?0.55:0.15,dt);b.vy*=Math.pow(b.sup?0.55:0.15,dt);}
    if(b.y<BR){b.y=BR;b.vy=Math.abs(b.vy)*0.8;}else if(b.y>PH-BR){b.y=PH-BR;b.vy=-Math.abs(b.vy)*0.8;}
    const inM=b.y>GT+BR&&b.y<GB-BR;
    if(!inM){if(b.x<BR){b.x=BR;b.vx=Math.abs(b.vx)*0.8;}else if(b.x>PW-BR){b.x=PW-BR;b.vx=-Math.abs(b.vx)*0.8;}}
    else{
      if(b.x>PW+5){st.sh++;st.last=0;st.phase='goal';st.pt=1.5;st.shake=0.8;beep(523,1046,0.35,'square',0.2);}
      else if(b.x<-5){st.sa++;st.last=1;st.phase='goal';st.pt=1.5;st.shake=0.8;beep(523,1046,0.35,'square',0.2);}
    }
    if(b.cd<=0){
      for(const p of st.players){
        if(p.stun>0)continue;
        if(Math.hypot(b.x-p.x,b.y-p.y)<(p.role==='GK'?40:28)&&b.z<35){
          b.own=p.id;b.sup=null;if(p.role==='GK')p.cd=0.4;if(p.team===0&&p.role!=='GK')st.activeId=p.id;break;
        }
      }
    }
  }

  function draw(){
    const w=shell.clientWidth, h=shell.clientHeight;
    if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
    ctx.fillStyle='#0f1722';ctx.fillRect(0,0,w,h);
    const sc=Math.min(w/(PW+120),h/(PH+80));
    const sx=(Math.random()-0.5)*st.shake*st.shake*18, sy=(Math.random()-0.5)*st.shake*st.shake*18;
    ctx.save();
    ctx.translate(w/2-PW*sc/2+sx*sc, h/2-PH*sc/2+sy*sc);
    ctx.scale(sc,sc);
    for(let i=0;i<10;i++){ctx.fillStyle=i%2===0?'#1f7440':'#258449';ctx.fillRect(i*(PW/10),0,PW/10+1,PH);}
    ctx.strokeStyle='#f8fafc';ctx.lineWidth=3;ctx.strokeRect(0,0,PW,PH);
    ctx.beginPath();ctx.moveTo(PW/2,0);ctx.lineTo(PW/2,PH);ctx.stroke();
    ctx.beginPath();ctx.arc(PW/2,PH/2,72,0,Math.PI*2);ctx.stroke();
    ctx.strokeRect(0,PH/2-140,140,280);ctx.strokeRect(PW-140,PH/2-140,140,280);
    ctx.fillStyle='rgba(15,23,42,.45)';ctx.fillRect(-GD,GT,GD,GB-GT);ctx.fillRect(PW,GT,GD,GB-GT);
    ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.strokeRect(-GD,GT,GD,GB-GT);ctx.strokeRect(PW,GT,GD,GB-GT);

    const ht=getT(homeId), at=getT(awayId);
    st.players.forEach(p=>{
      const t=p.team===0?ht:at, py=p.y-p.z*0.7;
      ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(p.x,p.y+8,12,5,0,0,Math.PI*2);ctx.fill();
      if(!st.attract&&p.id===st.activeId){ctx.strokeStyle='#fde047';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(p.x,p.y+8,17,8,0,0,Math.PI*2);ctx.stroke();}
      ctx.fillStyle=p.role==='GK'?(p.team===0?'#10b981':'#f97316'):t.primaryColor;
      ctx.fillRect(p.x-10,py-12,20,16);
      ctx.fillStyle=t.skinColor;ctx.fillRect(p.x-9,py-28,18,16);
      ctx.fillStyle=t.hairColor;ctx.fillRect(p.x-10,py-31,20,5);
      ctx.fillStyle='#000';ctx.fillRect(p.x+(p.fx>=0?1:-4),py-22,3,4);
    });
    const b=st.ball;
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(b.x,b.y+4,BR,5,0,0,Math.PI*2);ctx.fill();
    if(b.sup){ctx.fillStyle='rgba(250,204,21,.5)';ctx.beginPath();ctx.arc(b.x,b.y-b.z*0.7,BR+6,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y-b.z*0.7,BR,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#0f172a';ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
    if(mode==='playing'){
      document.getElementById('hs').textContent=st.sh;
      document.getElementById('as').textContent=st.sa;
      document.getElementById('gauge').textContent=Math.floor(st.gh)+'%';
      const s=Math.ceil(st.time), m=Math.floor(s/60), r=s%60;
      document.getElementById('clk').textContent=String(m).padStart(2,'0')+':'+String(r).padStart(2,'0');
    }
  }

  function startPlay(){
    newMatch(false); mode='playing';
    title.classList.add('hidden'); over.classList.add('hidden');
    hud.classList.remove('hidden'); pad.classList.remove('hidden');
    beep(2600,2800,0.16,'sine',0.12);
  }
  document.getElementById('bStart').onclick=startPlay;
  document.getElementById('bAgain').onclick=startPlay;
  document.getElementById('bMenu').onclick=()=>{mode='title';newMatch(true);over.classList.add('hidden');hud.classList.add('hidden');pad.classList.add('hidden');title.classList.remove('hidden');};
  document.getElementById('btnPause').onclick=()=>{if(mode==='playing'){mode='paused';over.classList.remove('hidden');document.getElementById('overTitle').textContent='比赛暂停';document.getElementById('overScore').textContent=st.sh+' : '+st.sa;}else if(mode==='paused'){mode='playing';over.classList.add('hidden');}};
  document.getElementById('btnMute').onclick=()=>{muted=!muted;};

  function toggleRot(){
    rot90=!rot90;
    shell.classList.toggle('rot90',rot90);
    if(document.documentElement.requestFullscreen&&rot90){document.documentElement.requestFullscreen().catch(()=>{});}
    if(screen.orientation&&screen.orientation.lock&&rot90){screen.orientation.lock('landscape').catch(()=>{});}
  }
  document.getElementById('btnRot').onclick=toggleRot;
  document.getElementById('tRot').onclick=toggleRot;

  const joy=document.getElementById('joy'), knob=document.getElementById('knob');
  let jid=null;
  function updJoy(cx,cy){
    const r=joy.getBoundingClientRect(); let dx=cx-(r.left+r.width/2), dy=cy-(r.top+r.height/2);
    if(rot90){const lx=dy, ly=-dx; dx=lx; dy=ly;}
    const d=Math.min(40,Math.hypot(dx,dy)), a=Math.atan2(dy,dx);
    const kx=Math.cos(a)*d, ky=Math.sin(a)*d;
    knob.style.transform='translate('+kx+'px,'+ky+'px)';
    joyVec.x=d>5?kx/40:0; joyVec.y=d>5?ky/40:0;
  }
  joy.onpointerdown=e=>{e.preventDefault();jid=e.pointerId;joy.setPointerCapture(jid);updJoy(e.clientX,e.clientY);};
  joy.onpointermove=e=>{if(e.pointerId===jid)updJoy(e.clientX,e.clientY);};
  joy.onpointerup=joy.onpointercancel=e=>{if(e.pointerId===jid){jid=null;knob.style.transform='translate(0,0)';joyVec.x=joyVec.y=0;}};

  document.getElementById('bDash').onpointerdown=e=>{e.preventDefault();dashHeld=true;};
  document.getElementById('bDash').onpointerup=document.getElementById('bDash').onpointercancel=()=>{dashHeld=false;};
  document.getElementById('bPass').onpointerdown=e=>{
    e.preventDefault(); if(!st||mode!=='playing')return;
    const p=st.players[st.activeId];
    if(st.ball.own===p.id)pass(p,joyVec.x,joyVec.y);
    else{const nx=st.players.filter(m=>m.team===0&&m.role!=='GK'&&m.id!==p.id).sort((a,b)=>Math.hypot(a.x-st.ball.x,a.y-st.ball.y)-Math.hypot(b.x-st.ball.x,b.y-st.ball.y))[0];if(nx)st.activeId=nx.id;}
  };
  document.getElementById('bSup').onpointerdown=e=>{
    e.preventDefault(); if(!st||mode!=='playing')return;
    const p=st.players[st.activeId];
    if(st.ball.own===p.id&&st.gh>=100)shoot(p,1,joyVec.y,true);
    else if(p.z===0)p.vz=250;
  };
  document.getElementById('bShoot').onpointerdown=e=>{
    e.preventDefault(); if(!st||mode!=='playing')return;
    const p=st.players[st.activeId];
    if(st.ball.own===p.id){st.charging=true;st.charge=0.2;shootHeld=true;}
    else tackle(p);
  };
  document.getElementById('bShoot').onpointerup=document.getElementById('bShoot').onpointercancel=()=>{
    if(!st||mode!=='playing'||!shootHeld)return; shootHeld=false;
    const p=st.players[st.activeId]; if(st.ball.own===p.id&&st.charging)shoot(p,st.charge,joyVec.y,false);
  };

  window.onkeydown=e=>{
    keys[e.code]=true;
    if(mode==='title'&&(e.code==='Enter'||e.code==='Space'))startPlay();
    if(mode==='playing'){
      const p=st.players[st.activeId];
      if(e.code==='KeyJ'||e.code==='KeyZ')document.getElementById('bPass').onpointerdown(new Event('pointerdown'));
      if((e.code==='KeyK'||e.code==='KeyX')&&!e.repeat){if(st.ball.own===p.id){st.charging=true;st.charge=0.2;}else tackle(p);}
      if((e.code==='Space'||e.code==='KeyL')&&!e.repeat)document.getElementById('bSup').onpointerdown(new Event('pointerdown'));
    }
  };
  window.onkeyup=e=>{
    keys[e.code]=false;
    if(mode==='playing'&&(e.code==='KeyK'||e.code==='KeyX')){
      const p=st.players[st.activeId];
      if(st.ball.own===p.id&&st.charging)shoot(p,st.charge,0,false);
    }
  };

  newMatch(true);
  let last=performance.now();
  function loop(now){
    const dt=(now-last)/1000; last=now;
    if(mode==='playing'||mode==='title')step(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>`;
}

export function downloadStandaloneSingleHtml(): void {
  const html = buildStandaloneSingleHtml();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nekketsu-soccer-mobile.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
