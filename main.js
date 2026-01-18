const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = user.id;

// ====== ВАЖНО: получаем элементы ======
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

// ====== Заполняем данные пользователя ======
avatar.src = user.photo_url || "";
profileAvatar.src = user.photo_url || "";
username.innerText = user.username || "Telegram User";

const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

// ====== Загрузка баланса ======
async function loadBalance() {
  const res = await fetch(API_URL + "/balance?user_id=" + userId);
  const data = await res.json();
  balance.innerText = (data.balance || 0).toFixed(2) + " TON";
}
loadBalance();

// ====== Навигация ======
btnHome.onclick = () => switchPage("home");
btnProfile.onclick = () => switchPage("profile");

function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

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

closeModal.onclick = () => modal.style.display = "none";

// ====== Оплата ======
pay.onclick = async () => {
  const amount = parseFloat(amountInput.value);
  if (amount < 0.1) return alert("Минимум 0.1 TON");

  // 1) Создаём платёж
  const createRes = await fetch(API_URL + "/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, amount })
  });
  const createData = await createRes.json();
  if (createData.error) return alert(createData.error);

  const paymentId = createData.paymentId;

  // 2) Отправляем транзакцию
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

  // 3) Polling: проверяем оплату каждые 3 сек
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
// Открытие инвентаря
openInventory.onclick = () => {
  inventoryModal.style.display = "flex";
  loadInventory();
};

closeInventory.onclick = () => {
  inventoryModal.style.display = "none";
};

// Загрузка инвентаря (пока тестовый предмет)
function loadInventory() {
  inventoryList.innerHTML = "";

  const item = document.createElement("div");
  item.className = "inventoryItem";

  item.innerHTML = `
    <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="gift">
    <div>
      <div>Подарок lol pop (NFT)</div>
      <div style="font-size:12px; opacity:0.7;">Тестовый предмет</div>
    </div>
  `;

  inventoryList.appendChild(item);
      }
