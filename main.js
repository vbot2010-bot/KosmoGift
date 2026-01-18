const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = user.id;

const avatar = document.getElementById("avatar");
const profileAvatar = document.getElementById("profileAvatar");
const username = document.getElementById("username");
const balance = document.getElementById("balance");

const btnHome = document.getElementById("btnHome");
const btnProfile = document.getElementById("btnProfile");

const connectWallet = document.getElementById("connectWallet");
const disconnectWallet = document.getElementById("disconnectWallet");
const deposit = document.getElementById("deposit");

const modal = document.getElementById("modal");
const amountInput = document.getElementById("amount");
const pay = document.getElementById("pay");
const closeModal = document.getElementById("closeModal");

const openDaily = document.getElementById("openDaily");

const subscribeModal = document.getElementById("subscribeModal");
const closeSubscribe = document.getElementById("closeSubscribe");
const subscribeBtn = document.getElementById("subscribeBtn");

const caseModal = document.getElementById("caseModal");
const closeCase = document.getElementById("closeCase");
const startCase = document.getElementById("startCase");
const rouletteTrack = document.getElementById("rouletteTrack");

const inventoryModal = document.getElementById("inventoryModal");
const openInventory = document.getElementById("openInventory");
const closeInventory = document.getElementById("closeInventory");
const inventoryList = document.getElementById("inventoryList");

avatar.src = user.photo_url || "";
profileAvatar.src = user.photo_url || "";
username.innerText = user.username || "Telegram User";

const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

async function loadBalance() {
  const res = await fetch(API_URL + "/balance?user_id=" + userId);
  const data = await res.json();
  balance.innerText = (data.balance || 0).toFixed(2) + " TON";
}
loadBalance();

btnHome.onclick = () => switchPage("home");
btnProfile.onclick = () => switchPage("profile");

function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://kosmogift.pages.dev//tonconnect-manifest.json"
});

connectWallet.onclick = async () => await tonConnectUI.connectWallet();
disconnectWallet.onclick = async () => await tonConnectUI.disconnect();

tonConnectUI.onStatusChange(wallet => {
  if (wallet) {
    connectWallet.style.display = "none";
    disconnectWallet.style.display = "block";
  } else {
    connectWallet.style.display = "block";
    disconnectWallet.style.display = "none";
  }
});

deposit.onclick = () => modal.style.display = "flex";
closeModal.onclick = () => modal.style.display = "none";

pay.onclick = async () => {
  const amount = parseFloat(amountInput.value);
  if (amount < 0.1) return alert("Минимум 0.1 TON");

  const createRes = await fetch(API_URL + "/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, amount })
  });

  const createData = await createRes.json();
  if (createData.error) return alert(createData.error);

  const paymentId = createData.paymentId;

  let tx;
  try {
    tx = await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi",
        amount: (amount * 1e9).toString()
      }]
    });
  } catch {
    return alert("Оплата отменена или не прошла.");
  }

  const txId = tx.id;
  if (!txId) return alert("Не удалось получить txId");

  let attempts = 0;
  let paid = false;

  while (attempts < 20 && !paid) {
    attempts++;
    const checkRes = await fetch(API_URL + "/check-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: paymentId, tx_id: txId })
    });
    const checkData = await checkRes.json();

    if (!checkData.error) {
      paid = true;
      balance.innerText = checkData.balance.toFixed(2) + " TON";
      modal.style.display = "none";
      break;
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  if (!paid) alert("Платёж не подтверждён. Попробуйте позже.");
};

// ========== DAILY CASE ==========
let subscribed = false; // первый раз - подписка

openDaily.onclick = () => {
  if (!subscribed) {
    subscribeModal.style.display = "flex";
  } else {
    caseModal.style.display = "flex";
  }
};

closeSubscribe.onclick = () => subscribeModal.style.display = "none";

subscribeBtn.onclick = () => {
  tg.openLink("https://t.me/KosmoGiftOfficial");
  subscribed = true;
  subscribeModal.style.display = "none";
};

// ========== CASE ==========
const drops = [
  { name: "0.01 TON", chance: 90 },
  { name: "0.02 TON", chance: 5 },
  { name: "0.03 TON", chance: 2.5 },
  { name: "0.04 TON", chance: 1 },
  { name: "0.05 TON", chance: 0.75 },
  { name: "0.06 TON", chance: 0.5 },
  { name: "0.07 TON", chance: 0.24 },
  { name: "NFT lol pop", chance: 0.01 }
];

function randomDrop() {
  const rand = Math.random() * 100;
  let sum = 0;
  for (let d of drops) {
    sum += d.chance;
    if (rand <= sum) return d;
  }
  return drops[0];
}

startCase.onclick = () => startRoulette();

function startRoulette() {
  rouletteTrack.innerHTML = "";

  for (let i = 0; i < 50; i++) {
    const drop = drops[Math.floor(Math.random() * drops.length)];
    const div = document.createElement("div");
    div.className = "rouletteItem";
    div.innerText = drop.name;
    rouletteTrack.appendChild(div);
  }

  const finalDrop = randomDrop();
  const finalDiv = document.createElement("div");
  finalDiv.className = "rouletteItem";
  finalDiv.innerText = finalDrop.name;
  rouletteTrack.appendChild(finalDiv);

  const totalWidth = rouletteTrack.scrollWidth;
  rouletteTrack.style.transition = "transform 5s cubic-bezier(.17,.67,.83,.67)";
  rouletteTrack.style.transform = `translateX(-${totalWidth - 150}px)`;

  setTimeout(() => {
    if (finalDrop.name.includes("TON")) {
      const ton = parseFloat(finalDrop.name.replace(" TON", ""));
      balance.innerText = (parseFloat(balance.innerText) + ton).toFixed(2) + " TON";
      alert("Вы выиграли: " + finalDrop.name);
    } else {
      addToInventory(finalDrop.name);
      alert("Вы выиграли NFT: " + finalDrop.name);
    }
  }, 5200);
}

// ========== INVENTORY ==========
openInventory.onclick = () => inventoryModal.style.display = "flex";
closeInventory.onclick = () => inventoryModal.style.display = "none";

function addToInventory(name) {
  const item = document.createElement("div");
  item.className = "inventoryItem";
  item.innerText = name;
  inventoryList.appendChild(item);
}
