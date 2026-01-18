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

const subscribeModal = document.getElementById("subscribeModal");
const subscribeBtn = document.getElementById("subscribeBtn");

const caseModal = document.getElementById("caseModal");
const openDaily = document.getElementById("openDaily");
const openCaseBtn = document.getElementById("openCaseBtn");
const strip = document.getElementById("strip");
const resultText = document.getElementById("resultText");

const inventoryModal = document.getElementById("inventoryModal");
const openInventory = document.getElementById("openInventory");
const closeInventory = document.getElementById("closeInventory");
const inventoryList = document.getElementById("inventoryList");

avatar.src = user.photo_url || "";
profileAvatar.src = user.photo_url || "";
username.innerText = user.username || "Telegram User";

let balanceValue = 0;
let inventory = [];
let subscribed = localStorage.getItem("subscribed") === "true";

function loadLocal() {
  balanceValue = parseFloat(localStorage.getItem(`balance:${userId}`)) || 0;
  inventory = JSON.parse(localStorage.getItem(`inventory:${userId}`)) || [];
  balance.innerText = balanceValue.toFixed(2) + " TON";
  balanceProfile.innerText = balanceValue.toFixed(2) + " TON";
}
loadLocal();

btnHome.onclick = () => switchPage("home");
btnProfile.onclick = () => switchPage("profile");
function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

const prizes = [
  { name: "0.01 TON", value: 0.01 },
  { name: "0.02 TON", value: 0.02 },
  { name: "0.03 TON", value: 0.03 },
  { name: "0.04 TON", value: 0.04 },
  { name: "0.05 TON", value: 0.05 },
  { name: "0.06 TON", value: 0.06 },
  { name: "0.07 TON", value: 0.07 },
  { name: "NFT lol pop", nft: true }
];

function buildStrip() {
  strip.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    for (let p of prizes) {
      const div = document.createElement("div");
      div.className = "drop";
      div.innerText = p.name;
      strip.appendChild(div);
    }
  }
}
buildStrip();

function choosePrize() {
  const rnd = Math.random() * 100;
  if (rnd < 90) return prizes[0];
  if (rnd < 95) return prizes[1];
  if (rnd < 97.5) return prizes[2];
  if (rnd < 98.5) return prizes[3];
  if (rnd < 99.25) return prizes[4];
  if (rnd < 99.75) return prizes[5];
  if (rnd < 99.99) return prizes[6];
  return prizes[7];
}

openDaily.onclick = () => {
  if (!subscribed) {
    subscribeModal.style.display = "flex";
  } else {
    caseModal.style.display = "flex";
  }
};

subscribeBtn.onclick = () => {
  tg.openLink("https://t.me/KosmoGiftOfficial");
  subscribed = true;
  localStorage.setItem("subscribed", "true");
  subscribeModal.style.display = "none";
  caseModal.style.display = "flex";
};

subscribeModal.onclick = (e) => {
  if (e.target === subscribeModal) subscribeModal.style.display = "none";
};

openCaseBtn.onclick = () => {
  openCaseBtn.disabled = true;

  const prize = choosePrize();
  const targetIndex = prizes.findIndex(p => p.name === prize.name);

  const itemWidth = 200 + 18;
  const totalItems = prizes.length * 6;
  const targetPos = (totalItems / 2 + targetIndex) * itemWidth;
  const end = -targetPos;

  strip.style.transition = "transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)";
  strip.style.transform = `translateX(${end}px)`;

  strip.addEventListener("transitionend", () => {
    strip.style.transition = "none";
  }, { once: true });

  setTimeout(() => {
    resultText.innerText = "Выпало: " + prize.name;

    if (prize.nft) {
      inventory.push({ name: prize.name });
      saveAll();
    } else {
      balanceValue += prize.value;
      saveAll();
    }

    openCaseBtn.disabled = false;
  }, 5000);
};

caseModal.onclick = (e) => {
  if (e.target === caseModal) caseModal.style.display = "none";
};

openInventory.onclick = () => {
  inventoryModal.style.display = "flex";
  loadInventory();
};
closeInventory.onclick = () => inventoryModal.style.display = "none";

function loadInventory() {
  inventoryList.innerHTML = "";
  if (inventory.length === 0) {
    inventoryList.innerHTML = "<div>Инвентарь пуст</div>";
    return;
  }
  inventory.forEach(i => {
    const div = document.createElement("div");
    div.className = "itemCard";
    div.innerHTML = `<div>${i.name}</div>`;
    inventoryList.appendChild(div);
  });
}

deposit.onclick = () => modal.style.display = "flex";
closeModal.onclick = () => modal.style.display = "none";

// ====== TON CONNECT ======
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
deposit.onclick = async () => {
  modal.style.display = "flex";
};

closeModal.onclick = () => {
  modal.style.display = "none";
};

// ====== Оплата ======
pay.onclick = async () => {
  const amount = parseFloat(amountInput.value);

  if (!amount || amount < 0.1) {
    return alert("Минимум 0.1 TON");
  }

  // 1) Создаём платёж на сервере
  const createRes = await fetch(API_URL + "/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, amount })
  });

  const createData = await createRes.json();

  if (createData.error) {
    return alert(createData.error);
  }

  const paymentId = createData.paymentId;

  // 2) Оплата через TON Connect
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

  // 3) Проверяем оплату каждые 3 сек
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

      // Обновляем баланс на экране
      balance.innerText = checkData.balance.toFixed(2) + " TON";

      modal.style.display = "none";
      amountInput.value = "";
      break;
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  if (!paid) {
    alert("Платёж не подтверждён. Попробуйте позже.");
  }
};
