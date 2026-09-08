const Q = window.CIVICS_QUESTION_SETS.uscis2008;

// Single source of truth for Utah district -> representative. The modal's
// <select> is built from this so markup and logic cannot drift apart.
const REPS={1:"Blake Moore",2:"Celeste Maloy",3:"Mike Kennedy",4:"Burgess Owens"};
const REP_QUESTION_ID=23;
const TEST_LENGTH=10,PASS_MARK=6,MAX_MISSES=5;

// Private-mode and storage-disabled browsers throw on plain localStorage access,
// so a failed read or write must never take the whole app down.
const store={
 get(k,fallback){try{const v=localStorage.getItem(k);return v===null?fallback:v}catch(e){return fallback}},
 set(k,v){try{localStorage.setItem(k,v)}catch(e){/* storage unavailable */}}
};

const $=id=>document.getElementById(id);
// Elements outside #testCard only. The test card's children are replaced whenever
// the results screen is rendered, so those are looked up on demand instead.
const el={
 sectionPill:$("sectionPill"),countPill:$("countPill"),qnum:$("qnum"),question:$("question"),
 answerLabel:$("answerLabel"),easy:$("easy"),others:$("others"),otherBox:$("otherBox"),
 info:$("info"),hook:$("hook"),prevBtn:$("prevBtn"),nextBtn:$("nextBtn"),
 masteryBar:$("masteryBar"),masteryText:$("masteryText"),search:$("search"),list:$("list"),
 testCard:$("testCard"),testStatus:$("testStatus"),
 modal:$("modal"),district:$("district"),regionBtn:$("regionBtn")
};

function clampIdx(n){return Number.isFinite(n)?Math.max(0,Math.min(Q.length-1,Math.trunc(n))):0}
function indexOfId(id){const i=Q.findIndex(q=>q.id===id);return i<0?0:i}
function readRatings(){try{const r=JSON.parse(store.get("civics_ratings","{}"));return r&&typeof r==="object"?r:{}}catch(e){return {}}}
function readDistrict(){const d=store.get("civics_district","1");return REPS[d]?d:"1"}

let idx=clampIdx(Number(store.get("civics_idx","0")));
let ratings=readRatings();
let district=readDistrict();
let testOrder=[],testPos=0,testCorrect=0,testWrong=0;

// Q23 is the one card whose answer depends on the selected district. Everything
// else is returned as-is; nothing mutates a question object.
function withRegion(q){
 if(q.id!==REP_QUESTION_ID)return q;
 const rep=REPS[district];
 return {...q,a:[rep],easy:[rep],
  info:`For Utah Congressional District ${district}, the current representative is ${rep}. Tap UT to change districts.`,
  hook:`Utah District ${district} = ${rep}.`};
}
function currentQuestion(){return withRegion(Q[idx])}
function getTestQ(){return withRegion(Q[indexOfId(testOrder[testPos])])}

function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function countWord(n){return n===1?"ONE":n===2?"TWO":n===3?"THREE":String(n)}
function required(q){return q.required||1}
// NOTE: must not be called `answerLabel` — a top-level function declaration would
// shadow the `#answerLabel` element global and silently swallow the label text.
function formatAnswerLabel(q){const n=required(q);return `${countWord(n)} EASY USCIS-ACCEPTED ${n===1?"ANSWER":"ANSWERS"}`}
function normalized(s){return String(s).toLowerCase().replace(/[“”"'().,]/g,"").replace(/\s+/g," ").trim()}
function isEasy(a,q){return q.easy.some(e=>normalized(e)===normalized(a)||normalized(e).includes(normalized(a))||normalized(a).includes(normalized(e)))}
function otherAnswers(q){return q.a.filter(a=>!isEasy(a,q))}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

/* ---------------------------------------------------------------- learn */

function displayQuestion(){
 const q=currentQuestion();
 el.sectionPill.textContent=q.section;
 el.countPill.textContent=`Question ${q.id}/${Q.length}`;
 el.qnum.textContent=`QUESTION ${q.id}`;
 el.question.textContent=q.q;
 el.answerLabel.textContent=formatAnswerLabel(q);
 el.easy.innerHTML=q.easy.map(x=>`<div>${escapeHtml(x)}</div>`).join("");
 const other=otherAnswers(q);
 el.others.innerHTML=other.map(x=>`<li>${escapeHtml(x)}</li>`).join("");
 el.otherBox.style.display=other.length?"block":"none";
 el.info.textContent=q.info||"";
 el.hook.textContent=q.hook||"";
 el.prevBtn.disabled=idx===0;
 el.nextBtn.textContent=idx===Q.length-1?"Finish":"Skip →";
 store.set("civics_idx",idx);
 window.scrollTo({top:0,behavior:"instant"});
}
function go(d){idx=clampIdx(idx+d);displayQuestion()}
function openQuestion(id){idx=indexOfId(id);switchPanel("learn");displayQuestion()}
function rate(v){
 ratings[Q[idx].id]=v;
 store.set("civics_ratings",JSON.stringify(ratings));
 if(idx<Q.length-1){idx++;displayQuestion()}
 updateHome();
}
function nextStudy(){const q=Q.find(q=>!ratings[q.id]||ratings[q.id]<3);return q?q.id:Q[0].id}
function updateHome(){
 const n=Object.keys(ratings).length;
 el.masteryBar.style.width=`${n/Q.length*100}%`;
 el.masteryText.textContent=`${n} of ${Q.length} rated`;
}

/* ------------------------------------------------------------ browse all */

function renderList(){
 const term=(el.search.value||"").toLowerCase();
 const listQ=Q.filter(q=>(q.q+" "+q.section+" "+q.easy.join(" ")).toLowerCase().includes(term));
 el.list.innerHTML=listQ.map(q=>`<button class="listitem" data-id="${q.id}"><small>${q.id} · ${escapeHtml(q.section)}</small><b>${escapeHtml(q.q)}</b></button>`).join("");
}
el.list.addEventListener("click",e=>{
 const btn=e.target.closest(".listitem");
 if(btn)openQuestion(Number(btn.dataset.id));
});
el.search.addEventListener("input",renderList);

/* ---------------------------------------------------------------- panels */

function switchPanel(id){
 document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===id));
 document.querySelectorAll(".tab").forEach(t=>{
  const on=t.dataset.panel===id;
  t.classList.toggle("active",on);
  t.setAttribute("aria-selected",String(on));
 });
 if(id==="learn")displayQuestion();
 if(id==="all")renderList();
 if(id==="home")updateHome();
 if(id==="test"&&!testOrder.length)startTest();
}
document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>switchPanel(t.dataset.panel)));

/* ----------------------------------------------------------------- test */

// The results screen replaces the card's markup, so keep a pristine copy to restore.
const testCardHTML=el.testCard.innerHTML;

function startTest(){
 el.testCard.innerHTML=testCardHTML;
 testOrder=shuffle(Q).slice(0,TEST_LENGTH).map(q=>q.id);
 testPos=0;testCorrect=0;testWrong=0;
 switchPanel("test");
 showTest();
}
function endTest(title,body,cta){
 el.testCard.innerHTML=`<div class="question">${title}</div><p>${body}</p><button class="bigbtn" id="restartBtn">${cta}</button>`;
 $("restartBtn").addEventListener("click",startTest);
 el.testStatus.textContent=`${testCorrect} correct · ${testWrong} missed`;
}
function showTest(){
 if(testCorrect>=PASS_MARK)
  return endTest("Passed! 🎉",`You reached ${PASS_MARK} correct answers.`,"New test");
 if(testWrong>=MAX_MISSES||testPos>=TEST_LENGTH)
  return endTest("Keep practicing",`Score: ${testCorrect} correct out of ${testPos} answered.`,"Try again");

 const q=getTestQ();
 el.testStatus.textContent=`Practice interview · ${testCorrect} correct · ${testWrong} missed`;
 $("tQnum").textContent=`QUESTION ${q.id}`;
 $("tQuestion").textContent=q.q;
 $("tAnswerLabel").textContent=formatAnswerLabel(q);
 $("tEasy").innerHTML=q.easy.map(x=>`<div>${escapeHtml(x)}</div>`).join("");
 $("tOthers").innerHTML=otherAnswers(q).map(x=>`<li>${escapeHtml(x)}</li>`).join("");
 $("tInfo").textContent=q.info||"";
 el.testCard.querySelectorAll(".reveal").forEach(x=>x.style.display="none");
 $("revealBtn").style.display="block";
 $("resultBtns").classList.remove("show");
}
function revealTest(){
 const q=getTestQ();
 $("revealBtn").style.display="none";
 $("tAnswerLabel").style.display="block";
 $("tEasy").style.display="block";
 if(otherAnswers(q).length)$("tOtherBox").style.display="block";
 $("tInfoBox").style.display="block";
 $("resultBtns").classList.add("show");
}
function testResult(ok){if(ok)testCorrect++;else testWrong++;testPos++;showTest()}

/* ---------------------------------------------------------- region modal */

let lastFocus=null;
function openModal(){
 lastFocus=document.activeElement;
 el.district.value=district;
 el.modal.classList.add("open");
 el.regionBtn.setAttribute("aria-expanded","true");
 el.district.focus();
}
function closeModal(){
 el.modal.classList.remove("open");
 el.regionBtn.setAttribute("aria-expanded","false");
 if(lastFocus&&lastFocus.focus)lastFocus.focus();
}
function saveRegion(){
 district=REPS[el.district.value]?el.district.value:"1";
 store.set("civics_district",district);
 closeModal();
 displayQuestion();
}
el.regionBtn.addEventListener("click",openModal);
el.modal.addEventListener("click",e=>{if(e.target===el.modal)closeModal()});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&el.modal.classList.contains("open"))closeModal();
});
// Small focus trap: the sheet only ever holds a <select> and a <button>.
el.modal.addEventListener("keydown",e=>{
 if(e.key!=="Tab")return;
 const f=el.modal.querySelectorAll("select,button");
 if(!f.length)return;
 const first=f[0],last=f[f.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
});

el.district.innerHTML=Object.keys(REPS).map(d=>`<option value="${d}">District ${d} — ${escapeHtml(REPS[d])}</option>`).join("");
el.district.value=district;
updateHome();
displayQuestion();
