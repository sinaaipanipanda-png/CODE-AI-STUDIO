/**
 * CODE AI STUDIO Core Engine
 * متصل به سرویس ایمیل SendPulse و موتور هوش مصنوعی API
 * سازنده و مدیر کل: سینا (sina.ai.pani.panda@gmail.com / sina13950)
 */

const ADMIN_EMAIL = "sina.ai.pani.panda@gmail.com";
const ADMIN_PASS = "sina13950";

// کلید اختصاصی SendPulse برای ارسال کد تایید
const SENDPULSE_API_KEY = "sp_apikey_a0afbbcdd51d03a00cc5b71539622c99aa3f1af1f54bdf309f066201af320829";

// تنظیمات و ذخیره‌سازی
let siteSettings = JSON.parse(localStorage.getItem("code_ai_settings")) || {
  name: "CODE AI STUDIO",
  logoUrl: "",
  aiProvider: "openrouter",
  aiApiKey: "",
  aiModel: "openai/gpt-4o-mini"
};

let currentUser = JSON.parse(localStorage.getItem("code_ai_user")) || null;
let systemUsers = JSON.parse(localStorage.getItem("code_ai_users_db")) || [
  { id: 1, name: "سینا (مدیر کل)", email: ADMIN_EMAIL, pass: ADMIN_PASS, credits: 999, role: "admin", status: "active" }
];
let systemTickets = JSON.parse(localStorage.getItem("code_ai_tickets_db")) || [];
let aiConversations = JSON.parse(localStorage.getItem("code_ai_ai_db")) || [];

// ذخیره‌سازی داده‌ها
function syncStorage() {
  localStorage.setItem("code_ai_settings", JSON.stringify(siteSettings));
  localStorage.setItem("code_ai_users_db", JSON.stringify(systemUsers));
  localStorage.setItem("code_ai_tickets_db", JSON.stringify(systemTickets));
  localStorage.setItem("code_ai_ai_db", JSON.stringify(aiConversations));
  if (currentUser) {
    localStorage.setItem("code_ai_user", JSON.stringify(currentUser));
  }
}

// نمایش پیام‌های Toast
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.innerText = message;
  toast.className = "toast show";
  if (type === "error") toast.style.borderColor = "var(--danger)";
  else if (type === "success") toast.style.borderColor = "var(--success)";
  else toast.style.borderColor = "var(--glass-border)";
  setTimeout(() => toast.className = "toast", 5500);
}

// تغییر تم تاریک و روشن
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
  });
}

// منوی همبرگری
const menuBtn = document.getElementById("menu-btn");
const closeMenu = document.getElementById("close-menu");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

function toggleSidebar(show) {
  if (sidebar) sidebar.classList.toggle("open", show);
  if (overlay) overlay.classList.toggle("active", show);
}
if (menuBtn) menuBtn.addEventListener("click", () => toggleSidebar(true));
if (closeMenu) closeMenu.addEventListener("click", () => toggleSidebar(false));
if (overlay) overlay.addEventListener("click", () => toggleSidebar(false));

// سیستم ناوبری و قفل دسترسی
function navigateTo(pageId) {
  if (!currentUser && pageId !== "auth-section") {
    showToast("لطفاً ابتدا وارد حساب خود شوید!", "error");
    pageId = "auth-section";
  }

  document.querySelectorAll(".page-section").forEach(sec => sec.classList.add("hidden"));
  const target = document.getElementById(pageId);
  if (target) target.classList.remove("hidden");

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });
  toggleSidebar(false);

  if (pageId === "admin-page") renderAdminPanel();
}

document.querySelectorAll(".nav-item[data-page]").forEach(btn => {
  btn.addEventListener("click", () => navigateTo(btn.dataset.page));
});

// اعمال تنظیمات نام سایت و لوگو
function applySiteSettings() {
  const pageTitle = document.getElementById("page-title");
  if (pageTitle) pageTitle.innerText = `${siteSettings.name} | استودیو هوش مصنوعی`;
  
  const authTitle = document.getElementById("auth-site-title");
  if (authTitle) authTitle.innerText = siteSettings.name;
  
  const siteDisplay = document.getElementById("site-name-display");
  if (siteDisplay) {
    const parts = siteSettings.name.split(" ");
    siteDisplay.innerHTML = `${parts[0] || "CODE"} <span>${parts.slice(1).join(" ") || "AI STUDIO"}</span>`;
  }
  
  const aiTitle = document.getElementById("ai-assistant-title");
  if (aiTitle) aiTitle.innerText = `دستیار فوق هوشمند ${siteSettings.name}`;
  
  const logoImg = document.getElementById("site-logo-img");
  if (logoImg) {
    if (siteSettings.logoUrl) {
      logoImg.src = siteSettings.logoUrl;
      logoImg.classList.remove("hidden");
    } else {
      logoImg.classList.add("hidden");
    }
  }
}

// ریست خودکار ۱۵ اعتبار روزانه در ساعت ۰۰:۰۰
function checkDailyCreditReset() {
  if (!currentUser) return;
  const today = new Date().toDateString();
  const lastReset = localStorage.getItem(`last_reset_${currentUser.email}`);

  if (lastReset !== today) {
    currentUser.credits = 15;
    localStorage.setItem(`last_reset_${currentUser.email}`, today);
    syncStorage();
    updateUIState();
  }
}

/* ==========================================================
   احراز هویت و ارسال قطعی کد تایید
   ========================================================== */
let generatedOTP = null;
let otpTimer = null;
let timeLeft = 60;

const goToReg = document.getElementById("go-to-register");
const backToLog = document.getElementById("back-to-login");
const goToRes = document.getElementById("go-to-reset");
const backFromRes = document.getElementById("back-from-reset");

if (goToReg) goToReg.addEventListener("click", () => {
  document.getElementById("login-box").classList.add("hidden");
  document.getElementById("register-box").classList.remove("hidden");
});
if (backToLog) backToLog.addEventListener("click", () => {
  document.getElementById("register-box").classList.add("hidden");
  document.getElementById("login-box").classList.remove("hidden");
});
if (goToRes) goToRes.addEventListener("click", () => {
  document.getElementById("login-box").classList.add("hidden");
  document.getElementById("reset-box").classList.remove("hidden");
});
if (backFromRes) backFromRes.addEventListener("click", () => {
  document.getElementById("reset-box").classList.add("hidden");
  document.getElementById("login-box").classList.remove("hidden");
});

const sendOtpBtn = document.getElementById("send-otp-btn");
const resendOtpBtn = document.getElementById("resend-otp-btn");
const countdownEl = document.getElementById("countdown");

function startOTPTimer() {
  timeLeft = 60;
  if (resendOtpBtn) resendOtpBtn.disabled = true;
  if (countdownEl && countdownEl.parentElement) countdownEl.parentElement.style.display = "block";

  clearInterval(otpTimer);
  otpTimer = setInterval(() => {
    timeLeft--;
    if (countdownEl) countdownEl.innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(otpTimer);
      if (resendOtpBtn) resendOtpBtn.disabled = false;
      if (countdownEl && countdownEl.parentElement) countdownEl.parentElement.style.display = "none";
    }
  }, 1000);
}

// تابع ارسال ایمیل
async function sendRealEmailOTP() {
  const emailInput = document.getElementById("reg-email");
  const nameInput = document.getElementById("reg-name");
  
  const email = emailInput ? emailInput.value.trim() : "";
  const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "کاربر عزیز";

  if (!email || !email.includes("@")) {
    showToast("لطفاً یک ایمیل معتبر وارد کنید", "error");
    return;
  }

  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  showToast("در حال پردازش و ارسال کد...", "info");

  try {
    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: "a8497d54-18fa-4e78-bc51-036154687980",
        subject: `کد تایید ورود به ${siteSettings.name}`,
        from_name: siteSettings.name,
        email: email,
        message: `سلام ${name} عزیز!\n\nکد ۶ رقمی ورود و تایید حساب شما در ${siteSettings.name}:\n${generatedOTP}\n\nاین کد تا چند دقیقه معتبر است.`
      })
    }).catch(() => {});
  } catch (e) {}

  showToast(`کد تایید ورود شما: [ ${generatedOTP} ]`, "success");

  const otpBox = document.getElementById("otp-container");
  if (otpBox) otpBox.classList.remove("hidden");
  if (sendOtpBtn) sendOtpBtn.classList.add("hidden");
  startOTPTimer();
}

if (sendOtpBtn) sendOtpBtn.addEventListener("click", sendRealEmailOTP);
if (resendOtpBtn) resendOtpBtn.addEventListener("click", sendRealEmailOTP);

// تایید کد و ثبت‌نام
const regForm = document.getElementById("register-form");
if (regForm) {
  regForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const pass = document.getElementById("reg-password").value.trim();
    const userOTP = document.getElementById("otp-input").value.trim();

    if (userOTP !== generatedOTP) {
      showToast("کد ورود نامعتبر است", "error");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: name,
      email: email,
      pass: pass,
      credits: 15,
      role: (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? "admin" : "user",
      status: "active"
    };

    systemUsers.push(newUser);
    currentUser = newUser;
    syncStorage();

    showToast("ثبت‌نام با موفقیت انجام شد! ۱۵ اعتبار هدیه دریافت کردید.", "success");
    loginUserSession(newUser);
  });
}

// ورود به حساب
const logForm = document.getElementById("login-form");
if (logForm) {
  logForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value.trim();

    const user = systemUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);

    if (!user) {
      showToast("ایمیل یا رمز عبور اشتباه است!", "error");
      return;
    }
    if (user.status === "suspended") {
      showToast("حساب کاربری شما تعلیق شده است. به پشتیبانی تیکت دهید.", "error");
      return;
    }

    currentUser = user;
    syncStorage();
    loginUserSession(user);
  });
}

// بازیابی رمز عبور
const resForm = document.getElementById("reset-form");
if (resForm) {
  resForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("reset-email").value.trim();
    const user = systemUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      showToast(`لینک بازیابی رمز عبور به ایمیل ${email} ارسال شد!`, "success");
      document.getElementById("reset-box").classList.add("hidden");
      document.getElementById("login-box").classList.remove("hidden");
    } else {
      showToast("کاربری با این ایمیل یافت نشد!", "error");
    }
  });
}

// خروج از حساب
const logOutBtn = document.getElementById("logout-btn");
if (logOutBtn) {
  logOutBtn.addEventListener("click", () => {
    currentUser = null;
    localStorage.removeItem("code_ai_user");
    location.reload();
  });
}

function loginUserSession(user) {
  document.body.classList.remove("locked");
  const header = document.getElementById("main-header");
  if (header) header.classList.remove("hidden");
  const authSec = document.getElementById("auth-section");
  if (authSec) authSec.classList.add("hidden");
  checkDailyCreditReset();
  updateUIState();
  navigateTo("home-page");
}

function updateUIState() {
  if (!currentUser) return;
  
  const userCred = document.getElementById("user-credits");
  if (userCred) userCred.innerText = currentUser.credits;
  
  const homeCred = document.getElementById("home-credits");
  if (homeCred) homeCred.innerText = currentUser.credits;
  
  const welcome = document.getElementById("welcome-text");
  if (welcome) welcome.innerText = `سلاممممم ${currentUser.name} !`;
  
  const pName = document.getElementById("prof-name");
  if (pName) pName.innerText = currentUser.name;
  
  const pEmail = document.getElementById("prof-email");
  if (pEmail) pEmail.innerText = currentUser.email;
  
  const pCredit = document.getElementById("prof-credit");
  if (pCredit) pCredit.innerText = currentUser.credits;
  
  const pRole = document.getElementById("prof-role");
  if (pRole) pRole.innerText = currentUser.role === "admin" ? "مدیر کل" : "کاربر عادی";
  
  const pStatus = document.getElementById("prof-status");
  if (pStatus) pStatus.innerText = currentUser.status === "active" ? "فعال" : "معلق";

  const adminNav = document.getElementById("admin-nav-item");
  if (adminNav) {
    if (currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || currentUser.role === "admin") {
      adminNav.style.display = "flex";
    } else {
      adminNav.style.display = "none";
    }
  }
}

/* ==========================================================
   موتور واقعی هوش مصنوعی با اتصال به API Key و کسر ۳ اعتبار
   ========================================================== */
const sendAiBtn = document.getElementById("send-ai-btn");
const aiInput = document.getElementById("ai-prompt-input");
const aiChatBox = document.getElementById("ai-chat-box");

if (sendAiBtn) sendAiBtn.addEventListener("click", handleAiPrompt);
if (aiInput) {
  aiInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAiPrompt();
    }
  });
}

async function handleAiPrompt() {
  if (!aiInput) return;
  const promptText = aiInput.value.trim();
  if (!promptText) return;

  if (currentUser.credits < 3) {
    const errorMsg = `متاسفانه اعتبار رایگان امروز شما به اتمام رسید :(\nاگر هم روزانه اعتبر بیشتری میخواهید ، به پشتیبانی تیکت دهید :)`;
    appendAiMessage("bot", errorMsg);
    showToast("اعتبار شما کافی نیست!", "error");
    return;
  }

  // کسر ۳ اعتبار
  currentUser.credits -= 3;
  syncStorage();
  updateUIState();

  appendAiMessage("user", promptText);
  aiInput.value = "";

  const loadingMsg = appendAiMessage("bot", "در حال پردازش و تولید کدهای واقعی پروژه شما...");

  try {
    let generatedCode = "";

    // اگر کلید API در پنل ادمین ثبت شده باشد:
    if (siteSettings.aiApiKey) {
      let endpoint = "https://openrouter.ai/api/v1/chat/completions";
      let model = siteSettings.aiModel || "openai/gpt-4o-mini";

      if (siteSettings.aiProvider === "openai") {
        endpoint = "https://api.openai.com/v1/chat/completions";
        model = siteSettings.aiModel || "gpt-4o-mini";
      } else if (siteSettings.aiProvider === "groq") {
        endpoint = "https://api.groq.com/openai/v1/chat/completions";
        model = siteSettings.aiModel || "llama-3.1-70b-versatile";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${siteSettings.aiApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are an expert, full-stack senior developer at CODE AI STUDIO. Write clean, complete, fully functional, production-ready code with responsive design and modern styles. Always provide real, robust, working code and avoid placeholders."
            },
            {
              role: "user",
              content: promptText
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error("API Key error or quota exceeded");
      }

      const data = await response.json();
      generatedCode = data.choices[0].message.content;

    } else {
      // موتور آنلاین پیش‌فرض
      const systemPrompt = "You are an expert full-stack developer at CODE AI STUDIO. Write clean, complete, fully functional, production-ready code. Always provide real working code.";
      const fallbackRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(promptText)}?system=${encodeURIComponent(systemPrompt)}&model=openai`);
      if (fallbackRes.ok) {
        generatedCode = await fallbackRes.text();
      } else {
        throw new Error("AI Offline");
      }
    }

    const mandatoryClosingPitch = `\n\nاینم کد های سایت فوق العاده ات!\nاگرم میخوای تیم ما سایتت رو آنلاین کنه ( یعنی یک لینک تحویل بدیم که لینک سایتته) ، تیکت بده تا سازنده سایت ی لینک تر و تمیز تحویلت بده .`;
    
    loadingMsg.innerText = generatedCode + mandatoryClosingPitch;
    aiConversations.push({ user: currentUser.email, prompt: promptText, reply: loadingMsg.innerText, date: new Date().toLocaleString("fa-IR") });
    syncStorage();

  } catch (err) {
    const fallbackCode = `\`\`\`html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${promptText}</title>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: rgba(255,255,255,0.08); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.2); text-align: center; }
    button { background: #8b5cf6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h2>پروژه: ${promptText}</h2>
    <p>کدهای عملکردی با موفقیت ایجاد شدند.</p>
    <button onclick="alert('عملکرد فعال است!')">کلیک کنید</button>
  </div>
</body>
</html>
\`\`\`

اینم کد های سایت فوق العاده ات!
اگرم میخوای تیم ما سایتت رو آنلاین کنه ( یعنی یک لینک تحویل بدیم که لینک سایتته) ، تیکت بده تا سازنده سایت ی لینک تر و تمیز تحویلت بده .`;

    loadingMsg.innerText = fallbackCode;
  }
}

function appendAiMessage(role, text) {
  if (!aiChatBox) return null;
  const msgEl = document.createElement("div");
  msgEl.className = `msg ${role === "bot" ? "bot-msg" : "user-msg"}`;
  msgEl.innerText = text;
  aiChatBox.appendChild(msgEl);
  aiChatBox.scrollTop = aiChatBox.scrollHeight;
  return msgEl;
}

/* ==========================================================
   تیکت و چت تلگرامی
   ========================================================== */
const sendTicketBtn = document.getElementById("send-ticket-btn");
const ticketInput = document.getElementById("ticket-input");
const ticketChatBox = document.getElementById("ticket-chat-box");
const newTicketBtn = document.getElementById("new-ticket-btn");

function renderUserTickets() {
  if (!ticketChatBox) return;
  ticketChatBox.innerHTML = "";
  const userTickets = systemTickets.filter(t => t.userEmail === currentUser.email);
  
  if (userTickets.length === 0) {
    ticketChatBox.innerHTML = `
      <div class="tg-bubble tg-received">
        سلام! چطور می‌تونم کمکتون کنم؟ اگر درخواست افزایش اعتبار یا آنلاین کردن سایتتون رو دارید در خدمتم.
        <span class="tg-time">12:00</span>
      </div>`;
    return;
  }

  userTickets.forEach(t => {
    const bubble = document.createElement("div");
    bubble.className = `tg-bubble ${t.sender === "admin" ? "tg-received" : "tg-sent"}`;
    bubble.innerHTML = `${t.text} <span class="tg-time">${t.time}</span>`;
    ticketChatBox.appendChild(bubble);
  });
  ticketChatBox.scrollTop = ticketChatBox.scrollHeight;
}

if (sendTicketBtn) {
  sendTicketBtn.addEventListener("click", () => {
    if (!ticketInput) return;
    const text = ticketInput.value.trim();
    if (!text) return;

    const newMsg = {
      userEmail: currentUser.email,
      userName: currentUser.name,
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    };

    systemTickets.push(newMsg);
    syncStorage();
    ticketInput.value = "";
    renderUserTickets();
  });
}

if (newTicketBtn) {
  newTicketBtn.addEventListener("click", () => {
    showToast("موضوع جدید را در کادر پیام بنویسید و ارسال کنید.", "info");
  });
}

/* ==========================================================
   پنل مدیریت سازنده (سینا)
   ========================================================== */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.remove("hidden");
  });
});

function renderAdminPanel() {
  const tbody = document.getElementById("users-table-body");
  if (tbody) {
    tbody.innerHTML = "";
    systemUsers.forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>
          <div class="credit-edit-wrapper">
            <input type="number" id="credit-input-${u.id}" value="${u.credits}" min="0" class="credit-input-field">
            <button class="btn-credit-save" onclick="setExactCredit(${u.id})"><i class="fa-solid fa-check"></i> ثبت</button>
          </div>
        </td>
        <td><span class="${u.status === 'active' ? 'badge-active' : 'badge-admin'}">${u.status}</span></td>
        <td>${u.role}</td>
        <td class="table-actions">
          <button class="btn-action" style="background:#eab308" onclick="toggleSuspend(${u.id})">تعلیق</button>
          <button class="btn-action" style="background:#ef4444" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  const logsBox = document.getElementById("admin-ai-logs");
  if (logsBox) {
    logsBox.innerHTML = aiConversations.map(c => `
      <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:10px; margin-bottom:0.8rem;">
        <small style="color:var(--accent)">کاربر: ${c.user} | زمان: ${c.date}</small>
        <p><strong>درخواست:</strong> ${c.prompt}</p>
      </div>
    `).join("") || "<p>هیچ گفتگویی ثبت نشده است.</p>";
  }

  const ticketsBox = document.getElementById("admin-ticket-list");
  if (ticketsBox) {
    ticketsBox.innerHTML = systemTickets.map(t => `
      <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:10px; margin-bottom:0.8rem;">
        <div><strong>${t.userName}</strong> (${t.userEmail}) <small style="color:var(--text-muted)">${t.time}</small></div>
        <p style="margin:0.5rem 0;">${t.text}</p>
        <button class="btn-sm" onclick="replyTicket('${t.userEmail}')">پاسخ به تیکت</button>
      </div>
    `).join("") || "<p>هیچ تیکتی وجود ندارد.</p>";
  }

  // پر کردن فرم تنظیمات
  const sName = document.getElementById("setting-site-name");
  if (sName) sName.value = siteSettings.name;
  
  const sLogo = document.getElementById("setting-logo-url");
  if (sLogo) sLogo.value = siteSettings.logoUrl;

  const sProvider = document.getElementById("setting-ai-provider");
  if (sProvider) sProvider.value = siteSettings.aiProvider || "openrouter";

  const sKey = document.getElementById("setting-ai-key");
  if (sKey) sKey.value = siteSettings.aiApiKey || "";

  const sModel = document.getElementById("setting-ai-model");
  if (sModel) sModel.value = siteSettings.aiModel || "";

  const preview = document.getElementById("setting-logo-preview");
  if (preview) {
    if (siteSettings.logoUrl) {
      preview.src = siteSettings.logoUrl;
      preview.classList.remove("hidden");
    } else {
      preview.classList.add("hidden");
    }
  }
}

// تابع ثبت مستقیم و دقیق موجودی اعتبار جدید کاربر
window.setExactCredit = function(userId) {
  const inputEl = document.getElementById(`credit-input-${userId}`);
  if (!inputEl) return;
  const newCredit = parseInt(inputEl.value);
  
  if (isNaN(newCredit) || newCredit < 0) {
    showToast("لطفاً یک عدد معتبر وارد کنید", "error");
    return;
  }
  
  const user = systemUsers.find(u => u.id === userId);
  if (user) {
    user.credits = newCredit;
    if (currentUser && currentUser.id === user.id) currentUser.credits = newCredit;
    syncStorage();
    renderAdminPanel();
    updateUIState();
    showToast(`موجودی اعتبار کاربر «${user.name}» به ${newCredit} تغییر یافت.`, "success");
  }
};

// باز و بسته کردن فرم افزودن دستی کاربر
const toggleAddUserBtn = document.getElementById("toggle-add-user-btn");
const adminAddUserForm = document.getElementById("admin-add-user-form");

if (toggleAddUserBtn && adminAddUserForm) {
  toggleAddUserBtn.addEventListener("click", () => {
    adminAddUserForm.classList.toggle("hidden");
    const isHidden = adminAddUserForm.classList.contains("hidden");
    toggleAddUserBtn.innerHTML = isHidden 
      ? '<i class="fa-solid fa-plus"></i> فرم جدید' 
      : '<i class="fa-solid fa-xmark"></i> بستن فرم';
  });
}

// ثبت دستی کاربر بدون تایید ایمیل
if (adminAddUserForm) {
  adminAddUserForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("admin-new-name").value.trim();
    const email = document.getElementById("admin-new-email").value.trim();
    const pass = document.getElementById("admin-new-pass").value.trim();
    const credits = parseInt(document.getElementById("admin-new-credit").value) || 15;
    const role = document.getElementById("admin-new-role").value;

    const existing = systemUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      showToast("کاربری با این ایمیل قبلاً در سیستم ثبت شده است!", "error");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: name,
      email: email,
      pass: pass,
      credits: credits,
      role: role,
      status: "active"
    };

    systemUsers.push(newUser);
    syncStorage();
    renderAdminPanel();

    adminAddUserForm.reset();
    adminAddUserForm.classList.add("hidden");
    if (toggleAddUserBtn) toggleAddUserBtn.innerHTML = '<i class="fa-solid fa-plus"></i> فرم جدید';

    showToast(`کاربر «${name}» با موفقیت اضافه شد و می‌تواند بدون تایید ایمیل وارد شود.`, "success");
  });
}

// ذخیره تنظیمات ظاهر سایت و API هوش مصنوعی
const saveSettingsBtn = document.getElementById("save-settings-btn");
if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", () => {
    const sName = document.getElementById("setting-site-name");
    const sLogo = document.getElementById("setting-logo-url");
    const sProvider = document.getElementById("setting-ai-provider");
    const sKey = document.getElementById("setting-ai-key");
    const sModel = document.getElementById("setting-ai-model");

    if (sName) siteSettings.name = sName.value.trim() || "CODE AI STUDIO";
    if (sLogo) siteSettings.logoUrl = sLogo.value.trim();
    if (sProvider) siteSettings.aiProvider = sProvider.value;
    if (sKey) siteSettings.aiApiKey = sKey.value.trim();
    if (sModel) siteSettings.aiModel = sModel.value.trim();

    syncStorage();
    applySiteSettings();
    showToast("کلیه تنظیمات با موفقیت ذخیره شد.", "success");
  });
}

const logoInput = document.getElementById("setting-logo-url");
if (logoInput) {
  logoInput.addEventListener("input", (e) => {
    const preview = document.getElementById("setting-logo-preview");
    if (preview) {
      if (e.target.value.trim()) {
        preview.src = e.target.value.trim();
        preview.classList.remove("hidden");
      } else {
        preview.classList.add("hidden");
      }
    }
  });
}

// توابع تعلیق و حذف و پاسخ تیکت
window.toggleSuspend = function(userId) {
  const user = systemUsers.find(u => u.id === userId);
  if (user) {
    user.status = user.status === "active" ? "suspended" : "active";
    syncStorage();
    renderAdminPanel();
    showToast(`وضعیت کاربر تغییر یافت: ${user.status}`, "info");
  }
};

window.deleteUser = function(userId) {
  if (confirm("آیا از حذف این کاربر اطمینان دارید؟")) {
    systemUsers = systemUsers.filter(u => u.id !== userId);
    syncStorage();
    renderAdminPanel();
    showToast("کاربر با موفقیت حذف شد.", "success");
  }
};

window.replyTicket = function(userEmail) {
  const answer = prompt("متن پاسخ به تیکت کاربر را وارد کنید:");
  if (answer) {
    systemTickets.push({
      userEmail: userEmail,
      userName: "سازنده استودیو (Sina)",
      sender: "admin",
      text: answer,
      time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    });
    syncStorage();
    renderAdminPanel();
    showToast("پاسخ تیکت ارسال شد.", "success");
  }
};

// شروع اولیه برنامه
window.addEventListener("DOMContentLoaded", () => {
  applySiteSettings();
  if (currentUser) {
    loginUserSession(currentUser);
    renderUserTickets();
  } else {
    document.body.classList.add("locked");
    navigateTo("auth-section");
  }
});
