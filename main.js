document.addEventListener("DOMContentLoaded", () => {

const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = String(user.id);

const API = "https://kosmogift-worker.v-bot-2010.workers.dev";

/* ELEMENTS */
const avatar = document.getElementById("avatar");
const profileAvatar = document.getElementById("profileAvatar");
const username = document.getElementById("username");
const balanceEl = document.getElementById("balance");
const balanceProfile = document.getElementById("balanceProfile");

avatar.src = user.photo_url || "";
profileAvatar.src = user.photo_url || "";
username.innerText = user.username || "Telegram User";

/* NAV */
btnHome.onclick = () => switchPage("home");
btnProfile.onclick = () => switchPage("profile");

function switchPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* BALANCE */
async function updateBalance(){
  const r = await fetch(`${API}/balance?user=${userId}`);
  const d = await r.json();
  balanceEl.innerText = d.balance.toFixed(2)+" TON";
  balanceProfile.innerText = d.balance.toFixed(2)+" TON";
}
updateBalance();

/* SUBSCRIBE */
openDaily.onclick = () => {
  subscribeModal.classList.add("show");
};

subscribeBtn.onclick = () => {
  tg.openTelegramLink("https://t.me/KosmoGiftOfficial");
  subscribeModal.classList.remove("show");
  caseModal.style.display = "flex";
};

/* CASE */
closeCase.onclick = () => caseModal.style.display = "none";

const prizes = [
  {type:"ton", value:0.01, chance:90},
  {type:"ton", value:0.02, chance:5},
  {type:"ton", value:0.03, chance:3},
  {type:"nft", name:"Kosmo NFT", price:0.2, chance:2}
];

function randomPrize(){
  let r=Math.random()*100,s=0;
  for(const p of prizes){s+=p.chance;if(r<=s)return p;}
}

openCaseBtn.onclick = async () => {
  strip.innerHTML="";
  const prize = randomPrize();

  for(let i=0;i<30;i++){
    const d=document.createElement("div");
    d.className="drop";
    d.innerText=prize.type==="ton"?`${prize.value} TON`:prize.name;
    strip.appendChild(d);
  }

  strip.style.transition="transform 6s cubic-bezier(.1,.6,.2,1)";
  strip.style.transform="translateX(-1600px)";

  setTimeout(()=>{
    rewardModal.style.display="flex";
    rewardText.innerText =
      prize.type==="ton"
      ?`Вы выиграли ${prize.value} TON`
      :`NFT: ${prize.name}`;

    rewardBtnTon.style.display = prize.type==="ton"?"block":"none";
    rewardBtnInv.style.display = prize.type==="nft"?"block":"none";

    rewardBtnTon.onclick = async ()=>{
      await fetch(`${API}/add-balance`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({user:userId,amount:prize.value})
      });
      rewardModal.style.display="none";
      caseModal.style.display="none";
      updateBalance();
    };

    rewardBtnInv.onclick = async ()=>{
      await fetch(`${API}/add-nft`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({user:userId,nft:prize})
      });
      rewardModal.style.display="none";
      caseModal.style.display="none";
    };

  },6000);
};

});
