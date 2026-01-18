  const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = user.id;

// ====== Элементы ======
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
const inventoryList = document.querySelector(".inventoryList");
const closeInventory = document.getElementById("closeInventory");

const openDaily = document.getElementById("openDaily");
const subscribeModal = document.getElementById("subscribeModal");
const closeSubscribe = document.getElementById("closeSubscribe");
const subscribeBtn = document.getElementById("subscribeBtn");

const caseModal = document.getElementById("caseModal");
const closeCase = document.getElementById("closeCase");
const startCase = document.getElementById("startCase");
const roulette = document.getElementById("roulette");

// ====== Данные пользователя ======
avatar.src = user.photo_url || "";
profileAvatar.src = user.photo_url || "";
username.innerText = user.username || "Telegram User";

// ====== Баланс и инвентарь сохраняем в localStorage ======
let balanceValue = parseFloat(localStorage.getItem("balance") || "0");
let inventory = JSON.parse(localStorage.getItem("inventory") || "[]");
let subscribed = localStorage.getItem("subscribed") === "true";

function updateUI() {
  balance.innerText = balanceValue.toFixed(2) + " TON";
  balanceProfile.innerText = balanceValue.toFixed(2) + " TON";
}

updateUI();

// ====== Навигация ======
btnHome.onclick = () => switchPage("home");
btnProfile.onclick = () => switchPage("profile");

function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ====== TON CONNECT (без изменений) ======
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

// ====== Пополнение ======
deposit.onclick = () => modal.style.display = "flex";
closeModal.onclick = () => modal.style.display = "none";
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

pay.onclick = () => {
  const amount = parseFloat(amountInput.value);
  if (amount < 0.1) return alert("Минимум 0.1 TON");

  balanceValue += amount;
  localStorage.setItem("balance", balanceValue.toString());
  updateUI();
  modal.style.display = "none";
  amountInput.value = "";
};

// ====== Инвентарь ======
openInventory.onclick = () => {
  inventoryModal.style.display = "flex";
  renderInventory();
};

closeInventory.onclick = () => inventoryModal.style.display = "none";
inventoryModal.addEventListener("click", (e) => {
  if (e.target === inventoryModal) inventoryModal.style.display = "none";
});

function renderInventory() {
  inventoryList.innerHTML = "";
  inventory.forEach(item => {
    const div = document.createElement("div");
    div.className = "inventoryItem";
    div.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div>
        <div>${item.name}</div>
        <div style="font-size:12px; opacity:0.7;">${item.desc}</div>
      </div>
    `;
    inventoryList.appendChild(div);
  });
}

// ====== Daily Case: подписка ======
openDaily.onclick = () => {
  if (!subscribed) {
    subscribeModal.style.display = "flex";
  } else {
    caseModal.style.display = "flex";
  }
};

closeSubscribe.onclick = () => subscribeModal.style.display = "none";
subscribeModal.addEventListener("click", (e) => {
  if (e.target === subscribeModal) subscribeModal.style.display = "none";
});

subscribeBtn.onclick = () => {
  window.open("https://t.me/KosmoGiftOfficial", "_blank");
  subscribed = true;
  localStorage.setItem("subscribed", "true");
  subscribeModal.style.display = "none";
  caseModal.style.display = "flex";
};

// ====== Case Modal ======
closeCase.onclick = () => caseModal.style.display = "none";
caseModal.addEventListener("click", (e) => {
  if (e.target === caseModal) caseModal.style.display = "none";
});

// ====== Рулетка ======
const drops = [
  {name:"0.01 TON", chance:90, value:0.01},
  {name:"0.02 TON", chance:5, value:0.02},
  {name:"0.03 TON", chance:2.5, value:0.03},
  {name:"0.04 TON", chance:1, value:0.04},
  {name:"0.05 TON", chance:0.75, value:0.05},
  {name:"0.06 TON", chance:0.5, value:0.06},
  {name:"0.07 TON", chance:0.24, value:0.07},
  {name:"NFT lol pop", chance:0.01, value:0}
];

function getDrop() {
  const rand = Math.random() * 100;
  let sum = 0;
  for (let d of drops) {
    sum += d.chance;
    if (rand <= sum) return d;
  }
  return drops[0];
}

// генерируем рулетку
function generateRoulette() {
  roulette.innerHTML = "";
  for (let i = 0; i < 30; i++) {
    const d = drops[Math.floor(Math.random() * drops.length)];
    const div = document.createElement("div");
    div.className = "rouletteItem";
    div.innerText = d.name;
    roulette.appendChild(div);
  }
}
generateRoulette();

let isRunning = false;

startCase.onclick = async () => {
  if (isRunning) return;
  isRunning = true;

  const drop = getDrop();

  // добавляем 30 элементов + итоговый
  generateRoulette();

  const final = document.createElement("div");
  final.className = "rouletteItem";
  final.innerText = drop.name;
  roulette.appendChild(final);

  const totalHeight = roulette.scrollHeight;
  const visibleHeight = roulette.clientHeight;
  const move = totalHeight - visibleHeight / 2 - 30;

  roulette.style.transition = "transform 4s cubic-bezier(.17,.67,.83,.67)";
  roulette.style.transform = `translateY(-${move}px)`;

  setTimeout(() => {
    // после остановки
    if (drop.value > 0) {
      balanceValue += drop.value;
      localStorage.setItem("balance", balanceValue.toString());
      updateUI();
    } else {
      inventory.push({
        name: "NFT lol pop",
        desc: "NFT",
        img: "https://cdn-icons-png.flaticon.com/512/190/190411.png"
      });
      localStorage.setItem("inventory", JSON.stringify(inventory));
    }

    isRunning = false;
  }, 4200);
};
