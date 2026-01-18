const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user || {};
const userId = user.id;

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

deposit.onclick = async () => {
  modal.style.display = "block";
};

closeModal.onclick = () => modal.style.display = "none";

pay.onclick = async () => {
  try {
    const amount = parseFloat(amountInput.value);
    if (amount < 0.1) return alert("Минимум 0.1 TON");

    // 1) Создаём платёж
    const createRes = await fetch(API_URL + "/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, amount })
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return alert("Ошибка create-payment:\n" + err);
    }

    const createData = await createRes.json();
    if (createData.error) return alert("Ошибка create-payment:\n" + createData.error);

    const paymentId = createData.paymentId;

    // 2) Отправляем транзакцию
    const tx = await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: "UQAFXBXzBzau6ZCWzruiVrlTg3HAc8MF6gKIntqTLDifuWOi",
        amount: (amount * 1e9).toString()
      }]
    });

    // 3) Проверяем что tx существует
    if (!tx || !tx.id) {
      return alert("Ошибка: tx.id не получен. \nТранзакция отправлена, но ID не вернулся.");
    }

    const txId = tx.id;

    // 4) Проверяем платёж
    const checkRes = await fetch(API_URL + "/check-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: paymentId, tx_id: txId })
    });

    if (!checkRes.ok) {
      const err = await checkRes.text();
      return alert("Ошибка check-payment:\n" + err);
    }

    const checkData = await checkRes.json();
    if (checkData.error) return alert("Ошибка check-payment:\n" + checkData.error);

    balance.innerText = checkData.balance.toFixed(2) + " TON";
    modal.style.display = "none";

  } catch (e) {
    alert("Ошибка в оплате:\n" + e.message);
  }
};
