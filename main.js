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
const wheel = document.getElementById("wheel");
const openCaseBtn = document.getElementById("openCaseBtn");

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
  // ЗДЕСЬ МОЖНО ДОБАВИТЬ ТВОЙ ПЛАТЕЖ
  alert("Платёж временно отключен (для теста).");
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

openCaseBtn.onclick = () => {
  openCaseBtn.disabled = true;

  const prize = choosePrize();
  const index = prizes.indexOf(prize);
  const sectorAngle = 360 / prizes.length;
  const spins = 6;
  const finalAngle = 360 * spins + (index * sectorAngle + sectorAngle / 2);

  wheel.style.transition = "transform 6s cubic-bezier(0.2, 0.8, 0.2, 1)";
  wheel.style.transform = `rotate(-${finalAngle}deg)`;

  setTimeout(() => {
    alert("Выпало: " + prize.name);

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
  balance.innerText = current.toFixed(2) + " TON";
  balanceProfile.innerText = current.toFixed(2) + " TON";
}

function addToInventory(itemName) {
  let inv = JSON.parse(localStorage.getItem("inventory") || "[]");
  inv.push({ name: itemName, date: Date.now() });
  localStorage.setItem("inventory", JSON.stringify(inv));
  }
