const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = user.id;

const avatar = document.getElementById("avatar");
const profileAvatar = document.getElementById("profileAvatar");
const username = document.getElementById("username");
const balance = document.getElementById("balance");
const balanceProfile = document.getElementById("balanceProfile");

const btnHome = document.getElementById("btnHome");
const btnProfile = document.getElementById("btnProfile");

const connectWallet = document.getElementById("connectWallet");
const disconnectWallet = document.getElementById("disconnectWallet");
const deposit = document.getElementById("deposit");

const modal = document.getElementById("modal");
const amountInput = document.getElementById("amount");
const pay = document.getElementById("pay");
const closeModal = document.getElementById("closeModal");

const openInventory = document.getElementById("openInventory");
const inventoryModal = document.getElementById("inventoryModal");
const closeInventory = document.getElementById("closeInventory");
const inventoryList = document.querySelector(".inventoryList");

// Daily Case
const openDailyCase = document.getElementById("openDailyCase");
const subscribeModal = document.getElementById("subscribeModal");
const subscribeBtn = document.getElementById("subscribeBtn");
const caseModal = document.getElementById("caseModal");
const strip = document.getElementById("strip");
const openCaseBtn = document.getElementById("openCaseBtn");
const resultText = document.getElementById("resultText");

avatar.src = user.photo_url || "";
profileAvatar.src = user.photo_url || "";
username.innerText = user.username || "Telegram User";

function loadBalance() {
  const saved = parseFloat(localStorage.getItem("balance") || "0");
  balance.innerText = saved.toFixed(2) + " TON";
  balanceProfile.innerText = saved.toFixed(2) + " TON";
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

connectWallet.onclick = async () => {
  await tonConnectUI.connectWallet();
};

disconnectWallet.onclick = async () => {
  await tonConnectUI.disconnect();
};

tonConnectUI.onStatusChange(wallet => {
  if (wallet) {
    connectWallet.style.display = "none";
    disconnectWallet.style.display = "block";
  } else {
    connectWallet.style.display = "block";
    disconnectWallet.style.display = "none";
  }
});

deposit.onclick = async () => {
  modal.style.display = "flex";
};

closeModal.onclick = () => modal.style.display = "none";

pay.onclick = async () => {
  const amount = parseFloat(amountInput.value);
  if (amount < 0.1) return alert("Минимум 0.1 TON");

  // Тут твой API
  const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

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
  } catch (e) {
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
      localStorage.setItem("balance", checkData.balance.toFixed(2));
      loadBalance();
      modal.style.display = "none";
      break;
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  if (!paid) {
    alert("Платёж не подтверждён. Попробуйте позже.");
  }
};

openInventory.onclick = () => {
  inventoryModal.style.display = "flex";
  loadInventory();
};

closeInventory.onclick = () => inventoryModal.style.display = "none";

function loadInventory() {
  inventoryList.innerHTML = "";
  const inv = JSON.parse(localStorage.getItem("inventory") || "[]");
  inv.forEach(item => {
    const card = document.createElement("div");
    card.className = "itemCard";
    card.innerHTML = `<div class="itemName">${item.name}</div>`;
    inventoryList.appendChild(card);
  });
}

// =====================
// DAILY CASE
// =====================

openDailyCase.onclick = () => {
  if (!localStorage.getItem("subscribed")) {
    subscribeModal.style.display = "flex";
    return;
  }
  caseModal.style.display = "flex";
};

subscribeModal.onclick = (e) => {
  if (e.target === subscribeModal) subscribeModal.style.display = "none";
};

caseModal.onclick = (e) => {
  if (e.target === caseModal) caseModal.style.display = "none";
};

subscribeBtn.onclick = () => {
  window.open("https://t.me/KosmoGiftOfficial", "_blank");
  localStorage.setItem("subscribed", "true");
  subscribeModal.style.display = "none";
  caseModal.style.display = "flex";
};

const prizes = [
  { name: "0.01 TON", chance: 90, value: 0.01 },
  { name: "0.02 TON", chance: 5, value: 0.02 },
  { name: "0.03 TON", chance: 2.5, value: 0.03 },
  { name: "0.04 TON", chance: 1, value: 0.04 },
  { name: "0.05 TON", chance: 0.75, value: 0.05 },
  { name: "0.06 TON", chance: 0.5, value: 0.06 },
  { name: "0.07 TON", chance: 0.24, value: 0.07 },
  { name: "NFT lol pop", chance: 0.01, value: 0, nft: true }
];

function choosePrize() {
  const rnd = Math.random() * 100;
  let sum = 0;
  for (let p of prizes) {
    sum += p.chance;
    if (rnd <= sum) return p;
  }
  return prizes[0];
}

function buildStrip() {
  strip.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    for (let p of prizes) {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = p.name;
      strip.appendChild(div);
    }
  }
}
buildStrip();

openCaseBtn.onclick = () => {
  openCaseBtn.disabled = true;

  const prize = choosePrize();
  const targetIndex = prizes.findIndex(p => p.name === prize.name);

  // вычитаем как далеко до середины полосы
  const itemWidth = 160 + 20;
  const targetOffset = targetIndex * itemWidth;

  // стартовая позиция
  const start = 0;
  const spins = 5;
  const end = -(spins * strip.scrollWidth + targetOffset);

  strip.style.transition = "transform 6s cubic-bezier(0.2, 0.8, 0.2, 1)";
  strip.style.transform = `translateX(${end}px)`;

  setTimeout(() => {
    resultText.innerText = "Выпало: " + prize.name;

    if (prize.nft) {
      addToInventory(prize.name);
    } else {
      addBalance(prize.value);
    }

    openCaseBtn.disabled = false;
  }, 6000);
};

function addBalance(value) {
  let current = parseFloat(localStorage.getItem("balance") || "0");
  current += value;
  localStorage.setItem("balance", current.toFixed(2));
  loadBalance();
}

function addToInventory(itemName) {
  let inv = JSON.parse(localStorage.getItem("inventory") || "[]");
  inv.push({ name: itemName, date: Date.now() });
  localStorage.setItem("inventory", JSON.stringify(inv));
    }
