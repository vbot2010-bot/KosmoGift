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

const openDailyCase = document.getElementById("openDailyCase");
const dailyModal = document.getElementById("dailyModal");
const closeDaily = document.getElementById("closeDaily");
const subscribeBtn = document.getElementById("subscribeBtn");

const caseModal = document.getElementById("caseModal");
const closeCase = document.getElementById("closeCase");
const spinBtn = document.getElementById("spinBtn");
const roulette = document.getElementById("roulette");
const dropInfo = document.getElementById("dropInfo");

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

// POPUP пополнения
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
      balance.innerText = checkData.balance.toFixed(2) + " TON";
      modal.style.display = "none";
      break;
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  if (!paid) {
    alert("Платёж не подтверждён. Попробуйте позже.");
  }
};

// DAILY CASE
openDailyCase.onclick = () => dailyModal.style.display = "flex";
closeDaily.onclick = () => dailyModal.style.display = "none";

// ссылка на канал
subscribeBtn.onclick = () => {
  window.open("https://t.me/KosmoGiftOfficial", "_blank");
};

// Открытие кейса
closeCase.onclick = () => caseModal.style.display = "none";

openDailyCase.onclick = () => {
  if (!localStorage.getItem("dailyAccepted")) {
    dailyModal.style.display = "flex";
  } else {
    caseModal.style.display = "flex";
  }
};

subscribeBtn.onclick = () => {
  window.open("https://t.me/KosmoGiftOfficial", "_blank");
  localStorage.setItem("dailyAccepted", "true");
  dailyModal.style.display = "none";
  caseModal.style.display = "flex";
};

// Рулетка + шансы
const drops = [
  { name: "0.01 TON", chance: 90, icon: "💎" },
  { name: "0.02 TON", chance: 5, icon: "💠" },
  { name: "0.03 TON", chance: 2.5, icon: "🔹" },
  { name: "0.04 TON", chance: 1, icon: "🔷" },
  { name: "0.05 TON", chance: 0.75, icon: "🔶" },
  { name: "0.06 TON", chance: 0.5, icon: "🟣" },
  { name: "0.07 TON", chance: 0.24, icon: "🟦" },
  { name: "NFT lol pop", chance: 0.01, icon: "🧩" },
];

function createRoulette() {
  roulette.innerHTML = "";
  const track = document.createElement("div");
  track.className = "rouletteTrack";

  for (let i = 0; i < 40; i++) {
    const item = drops[i % drops.length];
    const div = document.createElement("div");
    div.className = "rouletteItem";
    div.innerHTML = `<div>${item.icon}</div><div>${item.name}</div>`;
    track.appendChild(div);
  }

  roulette.appendChild(track);
}
createRoulette();

function getDrop() {
  const rand = Math.random() * 100;
  let sum = 0;
  for (let d of drops) {
    sum += d.chance;
    if (rand <= sum) return d;
  }
  return drops[0];
}

spinBtn.onclick = async () => {
  spinBtn.disabled = true;

  const selected = getDrop();

  // Находим индекс выбранного предмета в треке
  const track = document.querySelector(".rouletteTrack");
  const items = track.querySelectorAll(".rouletteItem");

  let targetIndex = 0;
  for (let i = 0; i < items.length; i++) {
    if (items[i].innerText.includes(selected.name)) {
      targetIndex = i;
      break;
    }
  }

  // анимация движения вправо->влево
  const offset = targetIndex * 150; // ширина item
  track.style.transition = "transform 3.5s cubic-bezier(0.25, 0.1, 0.25, 1)";
  track.style.transform = `translateX(-${offset}px)`;

  await new Promise(r => setTimeout(r, 3600));

  dropInfo.innerText = "Выпало: " + selected.name;

  // если TON — добавляем баланс
  if (selected.name.includes("TON")) {
    const amount = parseFloat(selected.name.replace(" TON", ""));
    const newBalance = parseFloat(balance.innerText) + amount;
    balance.innerText = newBalance.toFixed(2) + " TON";
  } else {
    // NFT в инвентарь
    const item = document.createElement("div");
    item.className = "inventoryItem";
    item.innerHTML = `
      <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="nft">
      <div>
        <div>${selected.name}</div>
        <div style="font-size:12px; opacity:0.7;">NFT предмет</div>
      </div>
    `;
    inventoryList.appendChild(item);
  }

  spinBtn.disabled = false;
};

// Inventory
openInventory.onclick = () => {
  inventoryModal.style.display = "flex";
};

closeInventory.onclick = () => {
  inventoryModal.style.display = "none";
};
