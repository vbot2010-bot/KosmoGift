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

    // ----------------------
// Модалки
// ----------------------
const subscribeModal = document.getElementById("subscribeModal");
const caseModal = document.getElementById("caseModal");

const subscribeBtn = document.getElementById("subscribeBtn");
const openCaseBtn = document.getElementById("openCaseBtn");

const wheel = document.getElementById("wheel");

// ----------------------
// Кнопка "Открыть кейс" на главной
// ----------------------
const openDailyCase = document.getElementById("openDailyCase"); // должна быть у тебя кнопка

openDailyCase.onclick = () => {
  // 1-й раз: показать подписку
  if (!localStorage.getItem("subscribed")) {
    subscribeModal.style.display = "flex";
    return;
  }

  // если подписан — открыть кейс
  caseModal.style.display = "flex";
};

// ----------------------
// Закрытие модалок кликом по фону
// ----------------------
subscribeModal.onclick = (e) => {
  if (e.target === subscribeModal) subscribeModal.style.display = "none";
};

caseModal.onclick = (e) => {
  if (e.target === caseModal) caseModal.style.display = "none";
};

// ----------------------
// Подписка (переход в канал)
// ----------------------
subscribeBtn.onclick = () => {
  window.open("https://t.me/KosmoGiftOfficial", "_blank");
  localStorage.setItem("subscribed", "true");
  subscribeModal.style.display = "none";
  caseModal.style.display = "flex";
};

// ----------------------
// Дропы и шансы
// ----------------------
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

// ----------------------
// Анимация рулетки
// ----------------------
openCaseBtn.onclick = async () => {
  openCaseBtn.disabled = true;

  const prize = choosePrize();
  const index = prizes.indexOf(prize);

  // каждый сектор = 360 / 8 = 45 градусов
  const sectorAngle = 360 / prizes.length;

  // случайное число оборотов + позиция
  const spins = 6; // сколько оборотов
  const finalAngle = 360 * spins + (index * sectorAngle + sectorAngle / 2);

  wheel.style.transition = "transform 6s cubic-bezier(0.2, 0.8, 0.2, 1)";
  wheel.style.transform = `rotate(-${finalAngle}deg)`; // справа налево

  setTimeout(() => {
    // выпало
    alert("Выпало: " + prize.name);

    if (prize.nft) {
      // добавляем в инвентарь
      addToInventory(prize.name);
    } else {
      // добавляем баланс
      addBalance(prize.value);
    }

    openCaseBtn.disabled = false;
  }, 6000);
};

// ----------------------
// Баланс
// ----------------------
function addBalance(value) {
  let current = parseFloat(localStorage.getItem("balance") || "0");
  current += value;
  localStorage.setItem("balance", current.toFixed(2));
  balance.innerText = current.toFixed(2) + " TON";
}

// ----------------------
// Инвентарь
// ----------------------
function addToInventory(itemName) {
  let inv = JSON.parse(localStorage.getItem("inventory") || "[]");
  inv.push({ name: itemName, date: Date.now() });
  localStorage.setItem("inventory", JSON.stringify(inv));
}
