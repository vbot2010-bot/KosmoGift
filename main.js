const tg = window.Telegram.WebApp;
tg.expand();

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

/* API URL (вставь сюда свой) */
const API_URL = "https://kosmogift-worker.v-bot-2010.workers.dev";

/* Получаем баланс */
async function loadBalance() {
  const res = await fetch(API_URL + "/balance");
  const data = await res.json();

  balance.innerText = (data.balance || 0).toFixed(2) + " TON";
}
loadBalance();

/* TON CONNECT */
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

/* Пополнение */
deposit.onclick = () => modal.style.display = "block";
closeModal.onclick = () => modal.style.display = "none";

pay.onclick = async () => {
  const amount = parseFloat(document.getElementById("amount").value);

  if (amount < 0.1) return alert("Минимум 0.1 TON");

  try {
    const res = await fetch(API_URL + "/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });

    const text = await res.text();

    // Показываем результат в alert
    alert("STATUS: " + res.status + "\nRESPONSE:\n" + text);

    const data = JSON.parse(text);

    if (data.error) return alert("Ошибка API: " + data.error);

    balance.innerText = data.balance.toFixed(2) + " TON";
    modal.style.display = "none";

  } catch (e) {
    alert("Ошибка запроса: " + e.message);
  }
};

  // Отправляем запрос на API (пополнение)
  const res = await fetch(API_URL + "/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount })
  });

  const data = await res.json();

  if (data.error) return alert(data.error);

  // Обновляем баланс
  balance.innerText = data.balance.toFixed(2) + " TON";

  // Закрываем окно
  modal.style.display = "none";
};
