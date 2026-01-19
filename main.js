const tg = Telegram.WebApp;
tg.expand();

const API = "https://kosmogift-worker.v-bot-2010.workers.dev";
const user = tg.initDataUnsafe.user;
const userId = String(user.id);

avatar.src = user.photo_url;
profileAvatar.src = user.photo_url;
username.innerText = user.username;

btnHome.onclick = () => switchPage("home");
btnProfile.onclick = () => switchPage("profile");

function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

async function updateBalance() {
  const r = await fetch(`${API}/balance?user=${userId}`);
  const d = await r.json();
  balance.innerText = d.balance.toFixed(2) + " TON";
  balanceProfile.innerText = d.balance.toFixed(2) + " TON";
}
updateBalance();

const prizes = [
  { type: "ton", value: 0.01, chance: 90 },
  { type: "ton", value: 0.02, chance: 9.99 },
  { type: "nft", value: "Kosmo NFT", price: 0.3, chance: 0.01 }
];

function rollPrize() {
  let r = Math.random() * 100, s = 0;
  for (const p of prizes) {
    s += p.chance;
    if (r <= s) return p;
  }
}

openDaily.onclick = () => subModal.style.display = "block";

subBtn.onclick = () => window.open("https://t.me/KosmoGiftOfficial", "_blank");

subContinue.onclick = () => {
  subModal.style.display = "none";
  startCase();
};

function startCase() {
  caseModal.style.display = "flex";
  strip.innerHTML = "";

  const prize = rollPrize();

  for (let i = 0; i < 30; i++) {
    const d = document.createElement("div");
    d.className = "drop";
    d.innerText = prize.type === "ton" ? `${prize.value} TON` : prize.value;
    strip.appendChild(d);
  }

  strip.style.transition = "transform 7s cubic-bezier(.17,.67,.3,1)";
  strip.style.transform = "translateX(-1800px)";

  setTimeout(async () => {
    caseModal.style.display = "none";
    rewardModal.style.display = "flex";

    if (prize.type === "ton") {
      rewardText.innerText = `Вы выиграли ${prize.value} TON`;
      rewardTon.style.display = "block";
      rewardInv.style.display = "none";

      rewardTon.onclick = async () => {
        await fetch(`${API}/add-balance`, {
          method: "POST",
          body: JSON.stringify({ user: userId, amount: prize.value })
        });
        rewardModal.style.display = "none";
        updateBalance();
      };

    } else {
      rewardText.innerText = `Вы выиграли NFT`;
      rewardTon.style.display = "none";
      rewardInv.style.display = "block";

      rewardInv.onclick = async () => {
        await fetch(`${API}/add-nft`, {
          method: "POST",
          body: JSON.stringify({ user: userId, nft: prize })
        });
        rewardModal.style.display = "none";
      };
    }
  }, 7000);
}
