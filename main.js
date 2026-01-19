document.addEventListener("DOMContentLoaded", async () => {
  const tg = window.Telegram.WebApp
  tg.expand()

  const userId = String(tg.initDataUnsafe.user.id)
  const API = "https://kosmogift-worker.v-bot-2010.workers.dev"

  const openDaily = document.getElementById("openDaily")
  const caseModal = document.getElementById("caseModal")
  const openCaseBtn = document.getElementById("openCaseBtn")
  const strip = document.getElementById("strip")

  const rewardModal = document.getElementById("rewardModal")
  const rewardText = document.getElementById("rewardText")
  const rewardBtnTon = document.getElementById("rewardBtnTon")
  const rewardBtnSell = document.getElementById("rewardBtnSell")
  const rewardBtnInv = document.getElementById("rewardBtnInv")

  const prizes = [
    { type: "ton", value: 0.01, chance: 90 },
    { type: "ton", value: 0.02, chance: 5 },
    { type: "ton", value: 0.03, chance: 2.5 },
    { type: "ton", value: 0.04, chance: 1 },
    { type: "ton", value: 0.05, chance: 0.75 },
    { type: "ton", value: 0.06, chance: 0.5 },
    { type: "ton", value: 0.07, chance: 0.24 },
    { type: "nft", value: "lol pop", chance: 0.01 }
  ]

  function randomPrize() {
    const r = Math.random() * 100
    let sum = 0
    for (const p of prizes) {
      sum += p.chance
      if (r <= sum) return p
    }
    return prizes[0]
  }

  openDaily.onclick = async () => {
    const r = await fetch(`${API}/daily?user=${userId}`)
    const d = await r.json()
    if (d.error) return alert("Кейс доступен раз в 24 часа")
    caseModal.style.display = "flex"
  }

  openCaseBtn.onclick = async () => {
    const prize = randomPrize()

    strip.innerHTML = ""
    for (let i = 0; i < 20; i++) {
      const div = document.createElement("div")
      div.className = "drop"
      div.innerText =
        prize.type === "ton" ? `${prize.value} TON` : prize.value
      strip.appendChild(div)
    }

    strip.style.transition = "transform 3s cubic-bezier(.17,.67,.3,1)"
    strip.style.transform = "translateX(-600px)"

    setTimeout(async () => {
      rewardModal.style.display = "flex"
      rewardText.innerText =
        prize.type === "ton"
          ? `Вы выиграли ${prize.value} TON`
          : `Вы выиграли NFT "${prize.value}"`

      if (prize.type === "ton") {
        rewardBtnTon.style.display = "block"
        rewardBtnSell.style.display = "none"
        rewardBtnInv.style.display = "none"

        rewardBtnTon.onclick = async () => {
          await fetch(`${API}/add-balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, amount: prize.value })
          })
          rewardModal.style.display = "none"
          caseModal.style.display = "none"
        }
      } else {
        rewardBtnTon.style.display = "none"
        rewardBtnSell.style.display = "block"
        rewardBtnInv.style.display = "block"

        const nft = { name: prize.value, price: 3.27 }

        rewardBtnInv.onclick = async () => {
          await fetch(`${API}/add-nft`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, nft })
          })
          rewardModal.style.display = "none"
          caseModal.style.display = "none"
        }

        rewardBtnSell.onclick = async () => {
          await fetch(`${API}/add-balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: userId, amount: 3.27 })
          })
          rewardModal.style.display = "none"
          caseModal.style.display = "none"
        }
      }
    }, 3200)
  }
})
