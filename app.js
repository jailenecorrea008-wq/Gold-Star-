
const STORAGE_KEY = "goldStarDay.realV1";

const categoryColors = {
  hygiene: "#D7B15A",
  hydration: "#7899B0",
  nourishment: "#87956E",
  home: "#A65349",
  selfcare: "#A08AAE",
  movement: "#C78B88"
};

const categoryNames = {
  hygiene: "Hygiene",
  hydration: "Hydration",
  nourishment: "Nourishment",
  home: "Home",
  selfcare: "Self-care",
  movement: "Movement"
};

const defaultHabits = [
  {id:"teeth",name:"Brush teeth",tiny:"Brush for 30 seconds",category:"hygiene",schedule:"daily"},
  {id:"freshen",name:"Shower or freshen up",tiny:"Wash face or use wipes",category:"hygiene",schedule:"daily"},
  {id:"water",name:"Drink water",tiny:"A few sips",category:"hydration",schedule:"daily"},
  {id:"food",name:"Eat something",tiny:"A snack counts",category:"nourishment",schedule:"daily"},
  {id:"meds",name:"Take care of meds",tiny:"Put them beside your water",category:"selfcare",schedule:"daily"},
  {id:"laundry",name:"Laundry reset",tiny:"Gather clothes or start one load",category:"home",schedule:"0"},
  {id:"sheets",name:"Fresh sheets",tiny:"Set clean sheets beside the bed",category:"home",schedule:"3"},
  {id:"room",name:"Tiny room reset",tiny:"Put away five things",category:"home",schedule:"6"},
  {id:"outside",name:"Go outside",tiny:"Stand outside for one minute",category:"movement",schedule:"6"}
];

const cupboardItems = [
  {id:"none",name:"No accessory",icon:"",need:0},
  {id:"bow",name:"Tiny bow",icon:"🎀",need:10},
  {id:"glasses",name:"Sunglasses",icon:"🕶️",need:25},
  {id:"crown",name:"Little crown",icon:"👑",need:50},
  {id:"flower",name:"Flower moment",icon:"🌼",need:75},
  {id:"witch",name:"Witch hat",icon:"🧙‍♀️",need:100},
  {id:"holiday",name:"Holiday bow",icon:"🎄",need:150}
];

const baseStickers = [
  {id:"first-star",name:"First Star",icon:"⭐",description:"Earn your first star.",test:s=>lifetimeStars(s)>=1},
  {id:"ten-stars",name:"Tiny Win Collector",icon:"✨",description:"Earn 10 lifetime stars.",test:s=>lifetimeStars(s)>=10},
  {id:"twenty-growth",name:"1% Club",icon:"🌱",description:"Show up on 20 different days.",test:s=>growthDays(s)>=20},
  {id:"hygiene-25",name:"Sparkle Era",icon:"🪥",description:"Earn 25 hygiene stars.",test:s=>categoryTotal(s,"hygiene")>=25},
  {id:"home-15",name:"Homebody Hero",icon:"🧺",description:"Earn 15 home-care stars.",test:s=>categoryTotal(s,"home")>=15}
];

function initialState(){
  return {
    habits: defaultHabits,
    days: {},
    bareMinimum: false,
    jarName: "Gertrude",
    equippedAccessory: "bow",
    challenges: [
      {id:"books",name:"Read 10 books this month",goal:10,progress:0,sticker:"📚",complete:false}
    ],
    customStickers: [],
    settings: {tone:"gentle",morning:"09:00",evening:"19:00"}
  };
}

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(saved && Array.isArray(saved.habits) && saved.days){
      return {...initialState(), ...saved, settings:{...initialState().settings,...saved.settings}};
    }
  }catch(e){}
  return initialState();
}

let state = loadState();
let viewDate = new Date();
viewDate.setDate(1);
let filter = "all";

function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function dayKey(date=new Date()){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function dayData(date=new Date()){
  const k=dayKey(date);
  if(!state.days[k]) state.days[k]={completed:{},growthEarned:false};
  if(!state.days[k].completed) state.days[k].completed={};
  return state.days[k];
}
function todaysScheduledHabits(){
  const dow = new Date().getDay();
  return state.habits.filter(h => h.schedule==="daily" || String(h.schedule)===String(dow));
}
function visibleHabits(){
  let habits=todaysScheduledHabits();
  if(filter==="daily") habits=habits.filter(h=>h.schedule==="daily");
  if(filter==="weekly") habits=habits.filter(h=>h.schedule!=="daily");
  if(state.bareMinimum){
    const preferred=["teeth","water","food"];
    const basics=habits.filter(h=>preferred.includes(h.id));
    habits=(basics.length?basics:habits).slice(0,3);
  }
  return habits;
}
function completedRecord(date=new Date()){ return dayData(date).completed; }
function completedCount(date=new Date()){ return Object.keys(completedRecord(date)).length; }
function starsForDate(date){
  const rec=completedRecord(date);
  return Object.values(rec);
}
function lifetimeStars(s=state){
  return Object.values(s.days||{}).reduce((sum,d)=>sum+Object.keys(d.completed||{}).length,0);
}
function growthDays(s=state){
  return Object.values(s.days||{}).filter(d=>d.growthEarned || Object.keys(d.completed||{}).length>0).length;
}
function monthGrowth(date=viewDate){
  const y=date.getFullYear(),m=date.getMonth();
  return Object.entries(state.days).filter(([k,d])=>{
    const dt=new Date(k+"T12:00:00");
    return dt.getFullYear()===y && dt.getMonth()===m && (d.growthEarned || Object.keys(d.completed||{}).length>0);
  }).length;
}
function monthStarsCount(date=viewDate){
  const y=date.getFullYear(),m=date.getMonth();
  return Object.entries(state.days).reduce((sum,[k,d])=>{
    const dt=new Date(k+"T12:00:00");
    return sum + (dt.getFullYear()===y && dt.getMonth()===m ? Object.keys(d.completed||{}).length : 0);
  },0);
}
function categoryTotal(s,cat){
  let total=0;
  for(const d of Object.values(s.days||{})){
    for(const value of Object.values(d.completed||{})){
      if(value.category===cat) total++;
    }
  }
  return total;
}
function unlockStickers(){
  const unlocked=[...baseStickers.filter(x=>x.test(state)).map(x=>x.id)];
  for(const cs of state.customStickers||[]) unlocked.push(cs.id);
  return unlocked;
}

function renderAll(){
  const now=new Date();
  document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat(undefined,{weekday:"long"}).format(now).toUpperCase();
  document.querySelector("#todayDateTitle").textContent = new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(now);
  document.querySelector("#todayStars").textContent=completedCount(now);
  document.querySelector("#monthStars").textContent=monthStarsCount(new Date());
  document.querySelector("#growthValue").textContent="+"+monthGrowth(new Date())+"%";
  document.querySelector("#showingUpDays").textContent=growthDays()+" growth days";
  document.querySelector("#supportCopy").textContent = state.bareMinimum
    ? "That’s the whole assignment today. Eat something. Drink something. Freshen up."
    : completedCount(now)===0
      ? "You do not need to finish everything. One thing is literally the assignment."
      : "See? Counted. Your calendar has proof.";
  document.querySelector("#bareMinimumBtn").textContent=state.bareMinimum?"Exit Bare Minimum Mode":"Bare Minimum Mode";
  document.querySelector("#jarTitle").textContent=state.jarName || "Your Star Jar";
  document.querySelector("#lifetimeStars").textContent=`${lifetimeStars()} little wins`;
  document.querySelector("#statLifetime").textContent=lifetimeStars();
  document.querySelector("#statGrowth").textContent=growthDays();

  const totals=Object.keys(categoryNames).map(c=>[c,categoryTotal(state,c)]).sort((a,b)=>b[1]-a[1]);
  document.querySelector("#statTopCategory").textContent = totals[0][1] ? categoryNames[totals[0][0]] : "—";
  document.querySelector("#statStickers").textContent=unlockStickers().length;

  renderCalendar();
  renderHabits();
  renderJar();
  renderCupboard();
  renderStickerBook();
  renderChallenges();
  saveState();
}

function renderCalendar(){
  const grid=document.querySelector("#calendarGrid");
  grid.innerHTML="";
  const y=viewDate.getFullYear(),m=viewDate.getMonth();
  const title=new Intl.DateTimeFormat(undefined,{month:"long",year:"numeric"}).format(viewDate);
  document.querySelector("#monthTitle").textContent=title;
  document.querySelector("#monthMini").textContent=title;
  const first=new Date(y,m,1);
  const start=new Date(y,m,1-first.getDay());

  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const cell=document.createElement("div");
    const other=d.getMonth()!==m;
    const today=dayKey(d)===dayKey();
    cell.className=`day-cell${other?" other":""}${today?" today":""}`;
    const values=starsForDate(d);
    const routine=state.habits.some(h=>h.schedule!=="daily" && String(h.schedule)===String(d.getDay()));
    cell.innerHTML=`<div class="day-num">${d.getDate()}</div>${routine?'<span class="weekly-mark" title="Weekly routine"></span>':""}<div class="day-stars"></div>`;
    const stars=cell.querySelector(".day-stars");
    values.slice(0,6).forEach(v=>{
      const s=document.createElement("span");
      s.className="mini-star";
      s.textContent="★";
      s.style.color=categoryColors[v.category]||categoryColors.selfcare;
      stars.appendChild(s);
    });
    if(values.length>6){
      const more=document.createElement("span");
      more.className="mini-star";
      more.textContent=`+${values.length-6}`;
      more.style.color="#7F2E35";
      stars.appendChild(more);
    }
    grid.appendChild(cell);
  }
}

function renderHabits(){
  const list=document.querySelector("#habitList");
  list.innerHTML="";
  const completed=completedRecord();

  const habits=visibleHabits();
  if(!habits.length){
    list.innerHTML=`<div class="habit-row"><div></div><div class="habit-copy"><b>Nothing extra is scheduled here today.</b><small>Your basics are enough.</small></div></div>`;
    return;
  }

  habits.forEach(h=>{
    const done=Boolean(completed[h.id]);
    const row=document.createElement("div");
    row.className="habit-row";
    row.innerHTML=`
      <div class="category-strip ${h.category}"></div>
      <div class="habit-copy">
        <b>${escapeHtml(h.name)}</b>
        <small>${escapeHtml(h.tiny||"Any version counts")}${h.schedule!=="daily"?" · weekly routine":""}</small>
      </div>
      <div class="habit-actions">
        <button class="tiny-button" data-tiny="${h.id}">tiny version</button>
        <button class="star-button ${done?"done "+h.category:""}" data-star="${h.id}" aria-pressed="${done}">${done?"★":"☆"}</button>
      </div>`;
    list.appendChild(row);
  });

  list.querySelectorAll("[data-star]").forEach(btn=>btn.onclick=()=>toggleHabit(btn.dataset.star,false));
  list.querySelectorAll("[data-tiny]").forEach(btn=>btn.onclick=()=>toggleHabit(btn.dataset.tiny,true));
}

function toggleHabit(id,tiny){
  const habit=state.habits.find(h=>h.id===id);
  if(!habit) return;
  const d=dayData();
  if(d.completed[id]){
    delete d.completed[id];
  }else{
    d.completed[id]={category:habit.category,tiny:Boolean(tiny),name:habit.name};
    d.growthEarned=true;
  }
  renderAll();
}

function renderJar(){
  const container=document.querySelector("#jarStars");
  container.innerHTML="";
  const total=lifetimeStars();
  const stars=[];
  for(const d of Object.values(state.days)){
    for(const v of Object.values(d.completed||{})) stars.push(v.category);
  }
  stars.slice(-80).forEach(cat=>{
    const el=document.createElement("span");
    el.className="jar-star";
    el.textContent="★";
    el.style.color=categoryColors[cat]||categoryColors.selfcare;
    container.appendChild(el);
  });
  const item=cupboardItems.find(x=>x.id===state.equippedAccessory);
  document.querySelector("#jarAccessory").textContent=item?.icon||"";
}

function renderCupboard(){
  const grid=document.querySelector("#cupboardGrid");
  grid.innerHTML="";
  const total=lifetimeStars();
  cupboardItems.forEach(item=>{
    const unlocked=total>=item.need;
    const card=document.createElement("div");
    card.className="unlock-card"+(unlocked?"":" locked");
    card.innerHTML=`<div class="big">${item.icon||"◌"}</div><b>${item.name}</b><small>${item.need===0?"Always available":`${item.need} lifetime stars`}</small>${unlocked?`<button data-equip="${item.id}">${state.equippedAccessory===item.id?"Equipped":"Wear this"}</button>`:""}`;
    grid.appendChild(card);
  });
  grid.querySelectorAll("[data-equip]").forEach(b=>b.onclick=()=>{state.equippedAccessory=b.dataset.equip;renderAll()});
}

function renderStickerBook(){
  const grid=document.querySelector("#stickerGrid");
  grid.innerHTML="";
  const unlocked=new Set(unlockStickers());
  const all=[
    ...baseStickers.map(s=>({id:s.id,name:s.name,icon:s.icon,description:s.description})),
    ...(state.customStickers||[])
  ];
  all.forEach(st=>{
    const is=unlocked.has(st.id);
    const card=document.createElement("div");
    card.className="unlock-card"+(is?"":" locked");
    card.innerHTML=`<div class="big">${st.icon}</div><b>${st.name}</b><small>${is?st.description:"Locked"}</small>`;
    grid.appendChild(card);
  });
}

function renderChallenges(){
  const list=document.querySelector("#challengeList");
  list.innerHTML="";
  if(!state.challenges.length){
    list.innerHTML=`<p class="sheet-copy">Create something fun to work toward. The reward is a permanent sticker.</p>`;
    return;
  }
  state.challenges.forEach(ch=>{
    const pct=Math.min(100,Math.round((ch.progress/ch.goal)*100));
    const row=document.createElement("div");
    row.className="challenge";
    row.innerHTML=`
      <div class="challenge-top">
        <div><b>${escapeHtml(ch.name)}</b><small>${ch.progress} / ${ch.goal}</small></div>
        <div>${ch.complete?ch.sticker:"🔒"}</div>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="challenge-actions">
        <button data-minus="${ch.id}">−1</button>
        <button data-plus="${ch.id}">+1</button>
      </div>`;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>adjustChallenge(b.dataset.plus,1));
  list.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>adjustChallenge(b.dataset.minus,-1));
}

function adjustChallenge(id,delta){
  const ch=state.challenges.find(c=>c.id===id);
  if(!ch) return;
  ch.progress=Math.max(0,Math.min(ch.goal,ch.progress+delta));
  if(ch.progress>=ch.goal && !ch.complete){
    ch.complete=true;
    const sid="challenge-"+ch.id;
    if(!(state.customStickers||[]).some(x=>x.id===sid)){
      state.customStickers.push({id:sid,name:ch.name,icon:ch.sticker,description:"Unlocked from a personal challenge."});
    }
  }
  renderAll();
}

function escapeHtml(v){
  return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function openModal(id){document.querySelector("#"+id).classList.add("show")}
function closeModal(id){document.querySelector("#"+id).classList.remove("show")}

document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
document.querySelectorAll(".modal").forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.remove("show")});

document.querySelector("#prevMonth").onclick=()=>{viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()-1,1);renderCalendar()};
document.querySelector("#nextMonth").onclick=()=>{viewDate=new Date(viewDate.getFullYear(),viewDate.getMonth()+1,1);renderCalendar()};

document.querySelectorAll(".segment").forEach(btn=>btn.onclick=()=>{
  filter=btn.dataset.filter;
  document.querySelectorAll(".segment").forEach(x=>x.classList.toggle("active",x===btn));
  renderHabits();
});

document.querySelector("#bareMinimumBtn").onclick=()=>{state.bareMinimum=!state.bareMinimum;renderAll()};
document.querySelector("#addHabitBtn").onclick=()=>openModal("habitModal");
document.querySelector("#renameJarBtn").onclick=()=>{document.querySelector("#jarNameInput").value=state.jarName||"";openModal("jarModal")};
document.querySelector("#cupboardBtn").onclick=()=>openModal("cupboardModal");
document.querySelector("#stickerBookBtn").onclick=()=>openModal("stickerModal");
document.querySelector("#addChallengeBtn").onclick=()=>openModal("challengeModal");

document.querySelector("#saveJarName").onclick=()=>{
  const name=document.querySelector("#jarNameInput").value.trim();
  if(name) state.jarName=name;
  closeModal("jarModal"); renderAll();
};

document.querySelector("#saveHabit").onclick=()=>{
  const name=document.querySelector("#habitName").value.trim();
  if(!name){alert("Give the habit a name first.");return;}
  state.habits.push({
    id:"h_"+Date.now(),
    name,
    tiny:document.querySelector("#habitTiny").value.trim()||"Any version counts",
    category:document.querySelector("#habitCategory").value,
    schedule:document.querySelector("#habitSchedule").value
  });
  document.querySelector("#habitName").value="";
  document.querySelector("#habitTiny").value="";
  closeModal("habitModal"); renderAll();
};

document.querySelector("#saveChallenge").onclick=()=>{
  const name=document.querySelector("#challengeName").value.trim();
  const goal=Math.max(1,Number(document.querySelector("#challengeGoal").value||1));
  if(!name){alert("Give the challenge a name first.");return;}
  state.challenges.push({
    id:"c_"+Date.now(),
    name,goal,progress:0,
    sticker:document.querySelector("#challengeSticker").value,
    complete:false
  });
  document.querySelector("#challengeName").value="";
  closeModal("challengeModal"); renderAll();
};

document.querySelector("#settingsToggle").onclick=()=>document.querySelector("#settingsPanel").classList.toggle("show");
document.querySelector("#toneSelect").value=state.settings.tone;
document.querySelector("#morningTime").value=state.settings.morning;
document.querySelector("#eveningTime").value=state.settings.evening;
document.querySelector("#toneSelect").onchange=e=>{state.settings.tone=e.target.value;saveState()};
document.querySelector("#morningTime").onchange=e=>{state.settings.morning=e.target.value;saveState()};
document.querySelector("#eveningTime").onchange=e=>{state.settings.evening=e.target.value;saveState()};

document.querySelector("#notifyBtn").onclick=async()=>{
  if(!("Notification" in window)){alert("Notifications are not available in this browser.");return;}
  const p=await Notification.requestPermission();
  if(p!=="granted"){alert("Notifications were not enabled.");return;}
  const tone=state.settings.tone;
  const body=tone==="sassy"?"Babe. One tiny thing. I’m literally asking for a star.":tone==="minimal"?"Gold Star Day · one small win":"Your stars aren’t going anywhere. Pick one when you’re ready.";
  new Notification("Gold Star Day 🌟",{body});
};

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}

renderAll();
