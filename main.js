let balance = 0;
let reward = 0;
let inventory = [];

const updateBalance = () => {
  document.getElementById("balanceValue").innerText = balance.toFixed(2);
  document.getElementById("balanceValue2").innerText = balance.toFixed(2);
};

document.getElementById("btnHome").onclick = () => {
  document.getElementById("home").classList.add("active");
  document.getElementById("profile").classList.remove("active");
  document.getElementById("btnHome").classList.add("active");
  document.getElementById("btnProfile").classList.remove("active");
};

document.getElementById("btnProfile").onclick = () => {
  document.getElementById("profile").classList.add("active");
  document.getElementById("home").classList.remove("active");
  document.getElementById("btnProfile").classList.add("active");
  document.getElementById("btnHome").classList.remove("active");
};

document.getElementById("openDaily").onclick = () => {
  document.getElementById("caseModal").style.display = "flex";
};

document.getElementById("closeCase").onclick = () => {
  document.getElementById("caseModal").style.display = "none";
};

document.getElementById("openCaseBtn").onclick = () => {
  // Рулетка крутится дольше
  const strip = document.getElementById("strip");
  strip.style.transition = "transform 4s ease-out";
  strip.style.transform = "translateX(-200px)";

  setTimeout(() => {
    const win = Math.random() < 0.5 ? "TON" : "NFT";
    reward = win === "TON" ? (Math.random() * (0.15 - 0.01) + 0.01).toFixed(2) : 0;
    document.getElementById("rewardText").innerText = win === "TON" ? `Вы выиграли ${reward} TON` : "Вы выиграли NFT";

    document.getElementById("caseModal").style.display = "none";
    document.getElementById("rewardModal").style.display = "flex";

    if (win === "NFT") {
      inventory.push({ name: "NFT", price: 0.1 });
    }
  }, 4000);
};

document.getElementById("rewardBtnTon").onclick = () => {
  balance += Number(reward);
  updateBalance();
  document.getElementById("rewardModal").style.display = "none";
};

document.getElementById("rewardBtnInv").onclick = () => {
  document.getElementById("rewardModal").style.display = "none";
};

document.getElementById("openInventory").onclick = () => {
  document.getElementById("inventoryModal").style.display = "flex";
  document.getElementById("inventoryList").innerText = JSON.stringify(inventory);
};

document.getElementById("closeInventory").onclick = () => {
  document.getElementById("inventoryModal").style.display = "none";
};

document.getElementById("deposit").onclick = () => {
  document.getElementById("modal").style.display = "flex";
};

document.getElementById("closeModal").onclick = () => {
  document.getElementById("modal").style.display = "none";
};

document.getElementById("pay").onclick = () => {
  const amount = Number(document.getElementById("amount").value);
  if (amount < 0.1) return alert("Минимум 0.1 TON");
  balance += amount;
  updateBalance();
  document.getElementById("modal").style.display = "none";
};

document.getElementById("showSubscribe").onclick = () => {
  document.getElementById("subscribeModal").style.display = "flex";
};

document.getElementById("subscribeBtn").onclick = () => {
  window.open("https://t.me/KosmoGiftOfficial", "_blank");
  document.getElementById("subscribeModal").style.display = "none";
};

updateBalance();
