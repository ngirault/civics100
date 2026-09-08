const Q = window.CIVICS_QUESTION_SETS.uscis2008;
const reps={1:"Blake Moore",2:"Celeste Maloy",3:"Mike Kennedy",4:"Burgess Owens"};
let idx=Number(localStorage.getItem("civics_idx")||0);
let ratings=JSON.parse(localStorage.getItem("civics_ratings")||"{}");
let district=localStorage.getItem("civics_district")||"1";
let testOrder=[],testPos=0,testCorrect=0,testWrong=0;

function currentQuestion(){ let q=JSON.parse(JSON.stringify(Q[idx])); if(q.id===23){q.a=[reps[district]];q.easy=[reps[district]];q.info=`For Utah Congressional District ${district}, the current representative is ${reps[district]}. Tap UT to change districts.`;q.hook=`Utah District ${district} = ${reps[district]}.`} return q;}
function countWord(n){return n===1?"ONE":n===2?"TWO":n===3?"THREE":String(n)}
function required(q){return q.required||1}
// NOTE: must not be called `answerLabel` — a top-level function declaration would
// shadow the `#answerLabel` element global and silently swallow the label text.
function formatAnswerLabel(q){let n=required(q);return `${countWord(n)} EASY USCIS-ACCEPTED ${n===1?"ANSWER":"ANSWERS"}`}
function normalized(s){return s.toLowerCase().replace(/[“”"'().,]/g,"").replace(/\s+/g," ").trim()}
function isEasy(a,q){return q.easy.some(e=>normalized(e)===normalized(a)||normalized(e).includes(normalized(a))||normalized(a).includes(normalized(e)))}
function displayQuestion(){
 const q=currentQuestion();
 sectionPill.textContent=q.section;countPill.textContent=`Question ${q.id}/100`;qnum.textContent=`QUESTION ${q.id}`;question.textContent=q.q;answerLabel.textContent=formatAnswerLabel(q);
 easy.innerHTML=q.easy.map(x=>`<div>${escapeHtml(x)}</div>`).join("");
 const other=q.a.filter(a=>!isEasy(a,q));others.innerHTML=other.map(x=>`<li>${escapeHtml(x)}</li>`).join("");otherBox.style.display=other.length?"block":"none";
 info.textContent=q.info;hook.textContent=q.hook;prevBtn.disabled=idx===0;nextBtn.textContent=idx===99?"Finish":"Skip →";
 localStorage.setItem("civics_idx",idx); window.scrollTo({top:0,behavior:"instant"});
}
function go(d){idx=Math.max(0,Math.min(99,idx+d));displayQuestion()}
function openQuestion(n){idx=n-1;switchPanel("learn");displayQuestion()}
function rate(v){ratings[currentQuestion().id]=v;localStorage.setItem("civics_ratings",JSON.stringify(ratings));if(idx<99){idx++;displayQuestion()}updateHome()}
function nextStudy(){for(let q of Q){if(!ratings[q.id]||ratings[q.id]<3)return q.id}return 1}
function updateHome(){let n=Object.keys(ratings).length;masteryBar.style.width=`${n}%`;masteryText.textContent=`${n} of 100 rated`}
function renderList(){let term=(search.value||"").toLowerCase();let listQ=Q.filter(q=>(q.q+" "+q.section+" "+q.easy.join(" ")).toLowerCase().includes(term));list.innerHTML=listQ.map(q=>`<button class="listitem" onclick="openQuestion(${q.id})"><small>${q.id} · ${escapeHtml(q.section)}</small><b>${escapeHtml(q.q)}</b></button>`).join("")}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function switchPanel(id){document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.panel===id));if(id==="learn")displayQuestion();if(id==="all")renderList();if(id==="home")updateHome();if(id==="test"&&!testOrder.length)startTest()}
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>switchPanel(t.dataset.panel));

// The pass/fail screen replaces the card's markup, so keep a pristine copy to restore.
const testCardHTML=testCard.innerHTML;
function startTest(){testCard.innerHTML=testCardHTML;testOrder=[...Q].sort(()=>Math.random()-.5).slice(0,10).map(q=>q.id);testPos=0;testCorrect=0;testWrong=0;switchPanel("test");showTest()}
function getTestQ(){let q=JSON.parse(JSON.stringify(Q.find(x=>x.id===testOrder[testPos])));if(q.id===23){q.a=[reps[district]];q.easy=[reps[district]]}return q}
function showTest(){
 if(testCorrect>=6){testCard.innerHTML=`<div class="question">Passed! 🎉</div><p>You reached 6 correct answers.</p><button class="bigbtn" onclick="startTest()">New test</button>`;testStatus.textContent=`${testCorrect} correct · ${testWrong} missed`;return}
 if(testWrong>=5||testPos>=10){testCard.innerHTML=`<div class="question">${testCorrect>=6?"Passed! 🎉":"Keep practicing"}</div><p>Score: ${testCorrect} correct out of ${testPos} answered.</p><button class="bigbtn" onclick="startTest()">Try again</button>`;testStatus.textContent=`${testCorrect} correct · ${testWrong} missed`;return}
 const q=getTestQ();testStatus.textContent=`Practice interview · ${testCorrect} correct · ${testWrong} missed`;tQnum.textContent=`QUESTION ${q.id}`;tQuestion.textContent=q.q;
 tAnswerLabel.textContent=formatAnswerLabel(q);tEasy.innerHTML=q.easy.map(x=>`<div>${escapeHtml(x)}</div>`).join("");let other=q.a.filter(a=>!isEasy(a,q));tOthers.innerHTML=other.map(x=>`<li>${escapeHtml(x)}</li>`).join("");tInfo.textContent=q.info;
 testCard.querySelectorAll(".reveal").forEach(x=>x.style.display="none");revealBtn.style.display="block";resultBtns.classList.remove("show")
}
function revealTest(){const q=getTestQ();revealBtn.style.display="none";tAnswerLabel.style.display="block";tEasy.style.display="block";if(q.a.filter(a=>!isEasy(a,q)).length)tOtherBox.style.display="block";tInfoBox.style.display="block";resultBtns.classList.add("show")}
function testResult(ok){if(ok)testCorrect++;else testWrong++;testPos++;showTest()}
regionBtn.onclick=()=>{districtSelect.value=district;modal.classList.add("open")}
function closeModal(){modal.classList.remove("open")}
function saveRegion(){district=districtSelect.value;localStorage.setItem("civics_district",district);closeModal();displayQuestion()}
const districtSelect=document.getElementById("district");districtSelect.value=district;
updateHome();displayQuestion();
