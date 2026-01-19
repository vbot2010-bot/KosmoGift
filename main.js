const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = user.id;

const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const balance = document.getElementById("balance");

const openDaily = document.getElementById("openDaily");

const subscribeModal = document.getElementById("subscribeModal");
const subscribeBtn = document.getElementById("subscribeBtn");

const caseModal = document.getElementById("caseModal");
const openCaseBtn = document.getElementById("openCaseBtn");
const strip = document.getElementById("strip");

const resultBlock = document.getElementById("resultBlock");
const resultIcon = document.getElementById("resultIcon");
const resultText = document.getElementById("resultText");
const sellBtn = document.getElementById("sellBtn");
const toInvBtn = document.getElementById("toInvBtn");

avatar.src = user.photo_url || "";
username.innerText = user.username || "Telegram User";

let balanceValue = 0;
let subscribed = false;
let currentPrize = null;

async function loadBalance() {
  const res = await fetch(`${API_URL}/balance?user_id=${userId}`);
  const data = await res.json();
  balanceValue = parseFloat(data.balance || 0);
  balance.innerText = balanceValue.toFixed(2) + " TON";
}
loadBalance();

openDaily.onclick = async () => {
  // check daily
  const res = await fetch(`${API_URL}/daily?user_id=${userId}`);
  const data = await res.json();

  if (data.last && Date.now() - parseInt(data.last) < 24 * 60 * 60 * 1000) {
    alert("Вы уже открывали кейс сегодня");
    return;
  }

  if (!subscribed) {
    subscribeModal.style.display = "flex";
    return;
  }

  caseModal.style.display = "flex";
  buildStrip();
};

subscribeBtn.onclick = () => {
  tg.openLink("https://t.me/KosmoGiftOfficial");
  subscribed = true;
  subscribeModal.style.display = "none";
  caseModal.style.display = "flex";
  buildStrip();
};

function buildStrip() {
  strip.innerHTML = "";
  const prizes = [
    "0.01 TON",
    "0.02 TON",
    "0.03 TON",
    "0.04 TON",
    "0.05 TON",
    "0.06 TON",
    "0.07 TON",
    "NFT lol pop"
  ];
  for (let i = 0; i < 20; i++) {
    for (let p of prizes) {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = p;
      strip.appendChild(div);
    }
  }
}

openCaseBtn.onclick = async () => {
  openCaseBtn.disabled = true;
  resultBlock.classList.add("hidden");

  // get prize from API
  const res = await fetch(`${API_URL}/open-daily`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId })
  });
  const data = await res.json();

  if (data.error) {
    alert(data.error);
    openCaseBtn.disabled = false;
    return;
  }

  currentPrize = data.prize;

  const prizeIndex = currentPrize.type === "nft" ? 7 : 
    currentPrize.value === 0.01 ? 0 :
    currentPrize.value === 0.02 ? 1 :
    currentPrize.value === 0.03 ? 2 :
    currentPrize.value === 0.04 ? 3 :
    currentPrize.value === 0.05 ? 4 :
    currentPrize.value === 0.06 ? 5 :
    6;

  const itemWidth = 168;
  const total = strip.children.length;
  const target = (total / 2 + prizeIndex) * itemWidth;

  strip.style.transition = "transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)";
  strip.style.transform = `translateX(-${target}px)`;

  strip.addEventListener("transitionend", () => {
    openCaseBtn.disabled = false;
    showResult();
  }, { once: true });
};

function showResult() {
  resultBlock.classList.remove("hidden");

  if (currentPrize.type === "ton") {
    resultIcon.innerText = currentPrize.value + " TON";
    resultText.innerText = "Вы выиграли TON";
    toInvBtn.classList.add("hidden");
  } else {
    resultIcon.innerText = currentPrize.name;
    resultText.innerText = "Вы выиграли NFT";
    toInvBtn.classList.remove("hidden");
  }
}

sellBtn.onclick = async () => {
  if (!currentPrize) return;

  if (currentPrize.type === "ton") {
    await fetch(`${API_URL}/add-ton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, amount: currentPrize.value })
    });
    await loadBalance();
    alert("TON зачислен на баланс!");
  } else {
    await fetch(`${API_URL}/add-ton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, amount: currentPrize.price })
    });
    await loadBalance();
    alert("NFT продан за TON!");
  }

  caseModal.style.display = "none";
}

toInvBtn.onclick = async () => {
  if (!currentPrize || currentPrize.type !== "nft") return;

  await fetch(`${API_URL}/add-nft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, nft: currentPrize })
  });

  alert("NFT добавлен в инвентарь");
  caseModal.style.display = "none";
}

caseModal.onclick = (e) => {
  if (e.target === caseModal) {
    caseModal.style.display = "none";
  }
}
