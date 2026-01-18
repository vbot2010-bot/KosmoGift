const tg = window.Telegram.WebApp;
tg.expand();

const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

// Получаем элементы
const avatar = document.getElementById("avatar");
const profileAvatar = document.getElementById("profileAvatar");
const username = document.getElementById("username");

const btnHome = document.getElementById("btnHome");
const btnProfile = document.getElementById("btnProfile");

const balance = document.getElementById("balance");

const connectWallet = document.getElementById("connectWallet");
const disconnectWallet = document.getElementById("disconnectWallet");
const deposit = document.getElementById("deposit");

const modal = document.getElementById("modal");
const amountInput = document.getElementById("amount");
const pay = document.getElementById("pay");
const closeModal = document.getElementById("closeModal");

const user = tg.initDataUnsafe.user || {};

avatar.src = user.photo_url || "";
profileAvatar.src = user.photo_url || "";
username.innerText = user.username || "Telegram User";

/* Навигация */
btnHome.onclick = () => switchPage("home");
btnProfile.onclick = () => switchPage("profile");

function switchPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* Получаем баланс */
async function loadBalance() {
  try {
    const res = await fetch(API_URL + "/balance");
    const data = await res.json();
    balance.innerText = (data.balance || 0).toFixed(2) + " TON";
  } catch (e) {
    balance.innerText = "0.00 TON";
  }
}
loadBalance();

/* TON CONNECT */
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://kosmogift.pages.dev/tonconnect-manifest.json"
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

/* Пополнение */
deposit.onclick = () => modal.style.display = "block";
closeModal.onclick = () => modal.style.display = "none";

pay.onclick = async () => {
  const amount = parseFloat(amountInput.value);

  if (amount < 0.1) return alert("Минимум 0.1 TON");

  try {
    const res = await fetch(API_URL + "/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });

    const data = await res.json();

    if (data.error) return alert("Ошибка API: " + data.error);

    balance.innerText = data.balance.toFixed(2) + " TON";
    modal.style.display = "none";

  } catch (e) {
    alert("Ошибка запроса: " + e.message);
  }
};
