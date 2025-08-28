const chatContainer = document.getElementById("chat-container");
const input = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

function addMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;

  if (text.includes("<img")) {
    msg.innerHTML = text;
    const img = msg.querySelector("img");
    img.addEventListener("click", () => {
      const win = window.open();
      win.document.write(`<img src="${img.src}" style="width:100%">`);
    });
  } else {
    msg.innerHTML = text;
  }

  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage() {
  const userMessage = input.value.trim();
  if (!userMessage) return;
  addMessage("user", userMessage);
  input.value = "";

  if (userMessage.includes("صورة") || userMessage.includes("ارسم") || userMessage.toLowerCase().includes("image")) {
    addMessage("bot", "⏳ جاري إنشاء الصورة...");
    try {
      const response = await fetch("/.netlify/functions/image", {
        method: "POST",
        body: JSON.stringify({ prompt: userMessage })
      });
      const data = await response.json();
      addMessage("bot", `<img src="${data.url}" class="generated">`);
    } catch (err) {
      addMessage("bot", "❌ خطأ في إنشاء الصورة");
    }
  } else {
    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMessage })
      });
      const data = await response.json();
      addMessage("bot", data.reply);
    } catch (err) {
      addMessage("bot", "❌ تعذر الاتصال بالخادم.");
    }
  }
}
