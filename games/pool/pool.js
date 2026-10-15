import {MAX_PULL,MIN_PULL,pullDistance,tablePoint} from './cue-input.js';
const canvas=document.getElementById('table'),ctx=canvas.getContext('2d'),W=1100,H=550,R=12,P=28;
const pockets=[[22,22],[W/2,14],[W-22,22],[22,H-22],[W/2,H-14],[W-22,H-22]];
const colors=['#fff','#f6cc3d','#2766d1','#ed493f','#8e4ac9','#ed8b36','#32915c','#8c3434','#151b22','#f6cc3d','#2766d1','#ed493f','#8e4ac9','#ed8b36','#32915c','#8c3434'];
let balls=[],turn=0,groups=[null,null],angle=0,moving=false,ballInHand=false,winner=null,shot=null,last=0,accumulator=0,drag=null,striking=null;
const $=id=>document.getElementById(id),groupOf=n=>n<8?'solids':'stripes',remaining=g=>balls.filter(b=>b.n!==0&&b.n!==8&&groupOf(b.n)===g&&!b.potted).length;
function message(text){$('status').textContent=text}
function reset(){cancelPull();striking=null;setPullDisplay(0);canvas.style.cursor="crosshair";balls=[{n:0,x:W*.25,y:H*.5,vx:0,vy:0,potted:false}];const order=[1,9,2,10,8,3,11,4,12,5,13,6,14,7,15];let i=0;for(let row=0;row<5;row++)for(let j=0;j<=row;j++)balls.push({n:order[i++],x:W*.7+row*R*1.76,y:H/2+(j-row/2)*R*2.04,vx:0,vy:0,potted:false});turn=0;groups=[null,null];angle=0;moving=false;winner=null;ballInHand=false;shot=null;update();message('Player 1 to break. Aim, hold and pull backwards, then release to shoot.')}
function update(){for(let p=0;p<2;p++){$('player'+p).textContent='Player '+(p+1)+' · '+(groups[p]?groups[p]+' · '+remaining(groups[p])+' left':'open table');$('player'+p).classList.toggle('active',p===turn)}const locked=moving||ballInHand||winner!==null||!!striking||!!drag;$('shoot').disabled=locked;$('left').disabled=locked;$('right').disabled=locked}
function finish(){moving=false;const scratch=shot.pots.includes(0),own=groups[turn];const first=balls.find(b=>b.n===shot.first);const wrong=own&&first&&(first.n===8?shot.ownAtStart>0:groupOf(first.n)!==own);const foul=scratch||shot.first===null||wrong;
if(shot.pots.includes(8)){winner=own&&shot.ownAtStart===0&&!foul?turn:1-turn;message('Player '+(winner+1)+' wins! '+(winner===turn?'The 8 ball is down.':'The 8 ball was potted early or on a foul.')+' Start a new game for another round.');update();return}
if(!groups[turn]&&!foul){const object=shot.pots.find(n=>n!==0&&n!==8);if(object){groups[turn]=groupOf(object);groups[1-turn]=groups[turn]==='solids'?'stripes':'solids'}}
const kept=!foul&&groups[turn]&&shot.pots.some(n=>n!==0&&n!==8&&groupOf(n)===groups[turn]);if(!kept)turn=1-turn;
if(foul){ballInHand=true;balls[0].potted=true;message('Foul. Player '+(turn+1)+' has ball in hand. Tap an empty space to place the white ball.')}else message('Player '+(turn+1)+(kept?' keeps the turn.':' to play.')+' '+(groups[turn]?'You are '+groups[turn]+'.':'The table is open.'));update()}
function step(dt){let active=false;for(const b of balls){if(b.potted)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;const pocket=pockets.find(p=>Math.hypot(b.x-p[0],b.y-p[1])<P);if(pocket){b.potted=true;b.vx=b.vy=0;shot?.pots.push(b.n);continue}if(b.x<R+15){b.x=R+15;b.vx=Math.abs(b.vx)*.86}if(b.x>W-R-15){b.x=W-R-15;b.vx=-Math.abs(b.vx)*.86}if(b.y<R+15){b.y=R+15;b.vy=Math.abs(b.vy)*.86}if(b.y>H-R-15){b.y=H-R-15;b.vy=-Math.abs(b.vy)*.86}const speed=Math.hypot(b.vx,b.vy);if(speed>0){const after=Math.max(0,speed-110*dt),ratio=after/speed;b.vx*=ratio;b.vy*=ratio;if(after<3)b.vx=b.vy=0}}
for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j];if(a.potted||b.potted)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=2*R)continue;if(d<.001){dx=.001;dy=0;d=.001}const nx=dx/d,ny=dy/d,overlap=(2*R-d)/2;a.x-=overlap*nx;a.y-=overlap*ny;b.x+=overlap*nx;b.y+=overlap*ny;const impact=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(impact<=0)continue;if(shot&&shot.first===null&&(a.n===0||b.n===0))shot.first=a.n===0?b.n:a.n;const impulse=impact*.98;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny}
active=balls.some(b=>!b.potted&&(b.vx!==0||b.vy!==0));if(moving&&!active)finish()}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#155e4d';ctx.fillRect(0,0,W,H);const grd=ctx.createRadialGradient(W/2,H/2,50,W/2,H/2,W*.65);grd.addColorStop(0,'#ffffff0b');grd.addColorStop(1,'#00000033');ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);ctx.strokeStyle='#0a3e32';ctx.lineWidth=20;ctx.strokeRect(10,10,W-20,H-20);for(const[x,y]of pockets){ctx.beginPath();ctx.arc(x,y,P,0,Math.PI*2);ctx.fillStyle='#050d0a';ctx.fill();ctx.strokeStyle='#9a8061';ctx.lineWidth=3;ctx.stroke()}for(let x=137.5;x<W;x+=137.5){ctx.fillStyle='#b8cbb077';ctx.fillRect(x-2,5,4,4);ctx.fillRect(x-2,H-9,4,4)}
const cue=balls[0];if(!moving&&!ballInHand&&winner===null){ctx.save();ctx.setLineDash([6,8]);ctx.strokeStyle='#d9f8d491';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cue.x,cue.y);ctx.lineTo(cue.x+Math.cos(angle)*230,cue.y+Math.sin(angle)*230);ctx.stroke();ctx.restore();const pull=drag?.pull||(striking?striking.pull*Math.pow(Math.max(0,1-(performance.now()-striking.start)/150),2):0);ctx.save();ctx.translate(cue.x,cue.y);ctx.rotate(angle);const wood=ctx.createLinearGradient(-250-pull,0,-24-pull,0);wood.addColorStop(0,'#643922');wood.addColorStop(.3,'#a76838');wood.addColorStop(.32,'#eed9a7');wood.addColorStop(1,'#fff1c5');ctx.strokeStyle=wood;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-27-pull,0);ctx.lineTo(-250-pull,0);ctx.stroke();ctx.fillStyle='#63d5dd';ctx.fillRect(-28-pull,-4,6,8);ctx.restore()}
for(const b of balls){if(b.potted)continue;ctx.save();ctx.shadowColor='#0008';ctx.shadowBlur=5;ctx.shadowOffsetY=3;ctx.fillStyle=b.n>8?'#f1f1e9':colors[b.n];ctx.beginPath();ctx.arc(b.x,b.y,R,0,Math.PI*2);ctx.fill();ctx.shadowColor='transparent';if(b.n>8){ctx.save();ctx.beginPath();ctx.arc(b.x,b.y,R,0,Math.PI*2);ctx.clip();ctx.fillStyle=colors[b.n];ctx.fillRect(b.x-R,b.y-6,R*2,12);ctx.restore()}if(b.n){ctx.fillStyle='#f6f5eb';ctx.beginPath();ctx.arc(b.x,b.y,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#172021';ctx.font='bold 8px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(b.n),b.x,b.y+.5)}ctx.beginPath();ctx.arc(b.x-3,b.y-4,3,0,Math.PI*2);ctx.fillStyle='#ffffff55';ctx.fill();ctx.restore()}}

function setPullDisplay(distance){const percent=Math.round(distance/MAX_PULL*100);$('pullMeter').value=percent;$('pullValue').textContent=percent+'%'}
function cancelPull(){if(!drag)return;const old=drag;drag=null;canvas.style.cursor="crosshair";if(canvas.hasPointerCapture(old.id))canvas.releasePointerCapture(old.id);$('power').value=old.previousPower;$('powerValue').textContent=old.previousPower+'%';setPullDisplay(0);update()}
function performShot(power,pull){if(moving||ballInHand||winner!==null||striking||power<=0)return;striking={power:Math.max(.03,Math.min(1,power)),pull,start:performance.now()};message('Taking the shot…');update()}
function startBallMotion(){const power=striking.power;striking=null;shot={pots:[],first:null,ownAtStart:groups[turn]?remaining(groups[turn]):7};balls[0].vx=Math.cos(angle)*power*1000;balls[0].vy=Math.sin(angle)*power*1000;moving=true;setPullDisplay(0);message('Balls in motion…');update()}
function point(e){return tablePoint(e.clientX,e.clientY,canvas.getBoundingClientRect(),W,H)}
function onCue(p){const dx=p.x-balls[0].x,dy=p.y-balls[0].y;return dx*Math.cos(angle)+dy*Math.sin(angle)<-R&&Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle))<38&&Math.hypot(dx,dy)<320}
canvas.addEventListener('pointerdown',e=>{
 if(moving||striking||winner!==null||drag||e.button!==0)return;
 e.preventDefault();const p=point(e),x=p.x,y=p.y;
 if(ballInHand){if(x<R+22||x>W-R-22||y<R+22||y>H-R-22||balls.some(b=>b.n&&!b.potted&&Math.hypot(b.x-x,b.y-y)<R*2+2)||pockets.some(p=>Math.hypot(p[0]-x,p[1]-y)<P+R)){message('Choose a clear spot inside the cushions.');return}Object.assign(balls[0],{x,y,vx:0,vy:0,potted:false});ballInHand=false;message('White ball placed. Aim, pull back and release.');update();return}
 if(!onCue(p))angle=Math.atan2(y-balls[0].y,x-balls[0].x);
 drag={id:e.pointerId,start:p,pull:0,previousPower:$('power').value};canvas.setPointerCapture(e.pointerId);setPullDisplay(0);canvas.style.cursor='grabbing';message('Pull backwards along the cue to add power. Release to shoot.');update();
});
canvas.addEventListener('pointermove',e=>{
 if(moving||striking||winner!==null||ballInHand)return;
 const p=point(e);
 if(drag){if(e.pointerId!==drag.id)return;drag.pull=pullDistance(drag.start,p,angle);setPullDisplay(drag.pull);$('power').value=Math.round(drag.pull/MAX_PULL*100);$('powerValue').textContent=$('power').value+'%';return}
 if(e.pointerType==='mouse'&&!onCue(p))angle=Math.atan2(p.y-balls[0].y,p.x-balls[0].x);
});
canvas.addEventListener('pointerup',e=>{
 if(!drag||e.pointerId!==drag.id)return;
 drag.pull=pullDistance(drag.start,point(e),angle);const completed=drag;drag=null;canvas.style.cursor='crosshair';if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
 if(completed.pull>=MIN_PULL)performShot(completed.pull/MAX_PULL,completed.pull);
 else{$('power').value=completed.previousPower;$('powerValue').textContent=completed.previousPower+'%';setPullDisplay(0);message('Aim set. Hold, pull backwards and release to shoot.');update()}
});
canvas.addEventListener('pointercancel',cancelPull);canvas.addEventListener('lostpointercapture',cancelPull);window.addEventListener('blur',cancelPull);
$('shoot').addEventListener('click',()=>performShot(Number($('power').value)/100,Number($('power').value)/100*MAX_PULL));
$('left').addEventListener('click',()=>angle-=Math.PI/180);$('right').addEventListener('click',()=>angle+=Math.PI/180);
$('power').addEventListener('input',()=>{$('powerValue').textContent=$('power').value+'%';setPullDisplay(Number($('power').value)/100*MAX_PULL)});
$('reset').addEventListener('click',reset);
function animate(time){const elapsed=last?Math.min((time-last)/1000,.05):0;last=time;if(striking&&time-striking.start>=150)startBallMotion();accumulator+=elapsed;while(accumulator>=1/120){if(moving)step(1/120);accumulator-=1/120}draw();requestAnimationFrame(animate)}reset();requestAnimationFrame(animate);
