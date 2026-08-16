/**
 * CODE AI STUDIO Core Engine
 * سازنده و مدیر: sina.ai.pani.panda@gmail.com
 */

const ADMIN_EMAIL = "sina.ai.pani.panda@gmail.com";
const ADMIN_PASS = "sina13950";

let siteSettings = JSON.parse(localStorage.getItem("code_ai_settings")) || {
  name: "CODE AI STUDIO",
  logoUrl: ""
};

let currentUser = JSON.parse(localStorage.getItem("code_ai_user")) || null;
let systemUsers = JSON.parse(localStorage.getItem("code_ai_users_db")) || [
  { id: 1, name: "سینا (مدیر کل)", email: ADMIN_EMAIL, pass: ADMIN_PASS, credits: 999, role: "admin", status: "active" }
];
let systemTickets = JSON.parse(localStorage.getItem("code_ai_tickets_db")) || [];
let aiConversations = JSON.parse(localStorage.getItem("code_ai_ai_db")) || [];

// همگام‌سازی دیتابیس
function syncStorage() {
  localStorage.setItem("code_ai_settings", JSON.stringify(siteSettings));
  localStorage.setItem("code_ai_users_db", JSON.stringify(systemUsers));
  localStorage.setItem("code_ai_tickets_db", JSON.stringify(systemTickets));
  localStorage.setItem("code_ai_ai_db", JSON.stringify(aiConversations));
  if (currentUser) {
    localStorage.setItem("code_ai_user", JSON.stringify(currentUser));
  }
}

// اعمال تنظیمات نام سایت و لوگو
function applySiteSettings() {
  document.getElementById("page-title").innerText = `${siteSettings.name} | استودیو هوش مصنوعی`;
  document.getElementById("site-name-display").innerHTML = `${siteSettings.name.split(" ")[0] || "CODE"} <span>${siteSettings.name.split(" ").slice(1).join(" ") || "AI STUDIO"}</span>`;
  document.getElementById("ai-assistant-title").innerText = `دستیار هوشمند ${siteSettings.name}`;
  
  const logoImg = document.getElementById("site-logo-img");
  if (siteSettings.logoUrl) {
    logoImg.src = siteSettings.logoUrl;
    logoImg.classList.remove("hidden");
  } else {
    logoImg.classList.add("hidden");
  }
}

// نمایش نوتیفیکیشن
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.className = "toast show";
  if (type === "error") toast.style.borderColor = "var(--danger)";
  else if (type === "success") toast.style.borderColor = "var(--success)";
  else toast.style.borderColor = "var(--glass-border)";
  setTimeout(() => toast.className = "toast", 4000);
}

// تم روشن و تاریک
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
});

// منوی همبرگری
const menuBtn = document.getElementById("menu-btn");
const closeMenu = document.getElementById("close-menu");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

function toggleSidebar(show) {
  sidebar.classList.toggle("open", show);
  overlay.classList.toggle("active", show);
}
menuBtn.addEventListener("click", () => toggleSidebar(true));
closeMenu.addEventListener("click", () => toggleSidebar(false));
overlay.addEventListener("click", () => toggleSidebar(false));

// ناوبری بین صفحات
function navigateTo(pageId) {
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

// سیستم ریست روزانه اعتبار ساعت ۰۰:۰۰
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

// سیستم احراز هویت و کد ۶۰ ثانیه‌ای
let generatedOTP = null;
let otpTimer = null;
let timeLeft = 60;

document.getElementById("go-to-register").addEventListener("click", () => {
  document.getElementById("login-box").classList.add("hidden");
  document.getElementById("register-box").classList.remove("hidden");
});
document.getElementById("back-to-login").addEventListener("click", () => {
  document.getElementById("register-box").classList.add("hidden");
  document.getElementById("login-box").classList.remove("hidden");
});
document.getElementById("go-to-reset").addEventListener("click", () => {
  document.getElementById("login-box").classList.add("hidden");
  document.getElementById("reset-box").classList.remove("hidden");
});
document.getElementById("back-from-reset").addEventListener("click", () => {
  document.getElementById("reset-box").classList.add("hidden");
  document.getElementById("login-box").classList.remove("hidden");
});

const sendOtpBtn = document.getElementById("send-otp-btn");
const resendOtpBtn = document.getElementById("resend-otp-btn");
const countdownEl = document.getElementById("countdown");

function startOTPTimer() {
  timeLeft = 60;
  resendOtpBtn.disabled = true;
  countdownEl.parentElement.style.display = "block";

  clearInterval(otpTimer);
  otpTimer = setInterval(() => {
    timeLeft--;
    countdownEl.innerText = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(otpTimer);
      resendOtpBtn.disabled = false;
      countdownEl.parentElement.style.display = "none";
    }
  }, 1000);
}

function handleSendCode() {
  const email = document.getElementById("reg-email").value.trim();
  if (!email || !email.includes("@")) {
    showToast("لطفاً یک ایمیل معتبر وارد کنید", "error");
    return;
  }
  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  showToast(`کد تایید به ایمیل ${email} ارسال شد: [ ${generatedOTP} ]`, "success");
  
  document.getElementById("otp-container").classList.remove("hidden");
  sendOtpBtn.classList.add("hidden");
  startOTPTimer();
}

sendOtpBtn.addEventListener("click", handleSendCode);
resendOtpBtn.addEventListener("click", handleSendCode);

// ثبت‌نام
document.getElementById("register-form").addEventListener("submit", (e) => {
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

  showToast("ثبت‌نام با موفقیت انجام شد! ۱۵ اعتبار دریافت کردید.", "success");
  loginUserSession(newUser);
});

// لاگین
document.getElementById("login-form").addEventListener("submit", (e) => {
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

// بازیابی رمز
document.getElementById("reset-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("reset-email").value.trim();
  const user = systemUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (user) {
    showToast(`لینک بازیابی رمز عبور به ایمیل ${email} ارسال گردید!`, "success");
    document.getElementById("reset-box").classList.add("hidden");
    document.getElementById("login-box").classList.remove("hidden");
  } else {
    showToast("کاربری با این ایمیل یافت نشد!", "error");
  }
});

// خروج
document.getElementById("logout-btn").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("code_ai_user");
  location.reload();
});

function loginUserSession(user) {
  checkDailyCreditReset();
  document.getElementById("auth-section").classList.add("hidden");
  updateUIState();
  navigateTo("home-page");
}

function updateUIState() {
  if (!currentUser) return;
  document.getElementById("user-credits").innerText = currentUser.credits;
  document.getElementById("home-credits").innerText = currentUser.credits;
  document.getElementById("welcome-text").innerText = `سلاممممم ${currentUser.name} !`;
  
  document.getElementById("prof-name").innerText = currentUser.name;
  document.getElementById("prof-email").innerText = currentUser.email;
  document.getElementById("prof-credit").innerText = currentUser.credits;
  document.getElementById("prof-role").innerText = currentUser.role === "admin" ? "مدیر کل" : "کاربر عادی";
  document.getElementById("prof-status").innerText = currentUser.status === "active" ? "فعال" : "معلق";

  const adminNav = document.getElementById("admin-nav-item");
  if (currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || currentUser.role === "admin") {
    adminNav.style.display = "flex";
  } else {
    adminNav.style.display = "none";
  }
}

// ساخت کد با AI و کسر ۳ اعتبار
const sendAiBtn = document.getElementById("send-ai-btn");
const aiInput = document.getElementById("ai-prompt-input");
const aiChatBox = document.getElementById("ai-chat-box");

sendAiBtn.addEventListener("click", handleAiPrompt);
aiInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleAiPrompt();
  }
});

function handleAiPrompt() {
  const prompt = aiInput.value.trim();
  if (!prompt) return;

  if (currentUser.credits < 3) {
    const errorMsg = `متاسفانه اعتبار رایگان امروز شما به اتمام رسید :(\nاگر هم روزانه اعتبار بیشتری میخواهید ، به پشتیبانی تیکت دهید :)`;
    appendAiMessage("bot", errorMsg);
    showToast("اعتبار کافی نیست!", "error");
    return;
  }

  currentUser.credits -= 3;
  syncStorage();
  updateUIState();

  appendAiMessage("user", prompt);
  aiInput.value = "";

  setTimeout(() => {
    let response = `\`\`\`html\n<!-- کدهای کامل و طراحی وب‌سایت ایجاد شده توسط ${siteSettings.name} برای: ${prompt} -->\n<!DOCTYPE html>\n<html lang="fa" dir="rtl">\n<head>\n  <meta charset="UTF-8">\n  <title>پروژه آماده شده</title>\n</head>\n<body>\n  <h1>سایت شما با موفقیت ساخته شد</h1>\n</body>\n</html>\n\`\`\``;
    
    const closingWebsitePitch = `\n\nاینم کد های سایت فوق العاده ات!\nاگرم میخوای تیم ما سایتت رو آنلاین کنه ( یعنی یک لینک تحویل بدیم که لینک سایتته) ، تیکت بده تا سازنده سایت ی لینک تر و تمیز تحویلت بده .`;
    response += closingWebsitePitch;

    appendAiMessage("bot", response);
    aiConversations.push({ user: currentUser.email, prompt: prompt, reply: response, date: new Date().toLocaleString("fa-IR") });
    syncStorage();
  }, 1000);
}

function appendAiMessage(role, text) {
  const msgEl = document.createElement("div");
  msgEl.className = `msg ${role === "bot" ? "bot-msg" : "user-msg"}`;
  msgEl.innerText = text;
  aiChatBox.appendChild(msgEl);
  aiChatBox.scrollTop = aiChatBox.scrollHeight;
}

// تیکت تلگرامی
const sendTicketBtn = document.getElementById("send-ticket-btn");
const ticketInput = document.getElementById("ticket-input");
const ticketChatBox = document.getElementById("ticket-chat-box");
const newTicketBtn = document.getElementById("new-ticket-btn");

function renderUserTickets() {
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

sendTicketBtn.addEventListener("click", () => {
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

newTicketBtn.addEventListener("click", () => {
  showToast("موضوع جدید را در کادر پیام بنویسید و ارسال کنید.", "info");
});

// پنل مدیریت سینا
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  });
});

function renderAdminPanel() {
  // ۱. جدول کاربران
  const tbody = document.getElementById("users-table-body");
  tbody.innerHTML = "";

  systemUsers.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td><strong>${u.credits}</strong></td>
      <td><span class="${u.status === 'active' ? 'badge-active' : 'badge-admin'}">${u.status}</span></td>
      <td>${u.role}</td>
      <td class="table-actions">
        <button class="btn-action" style="background:#10b981" onclick="modifyCredit(${u.id}, 15)" title="افزایش ۱۵ اعتبار">+15</button>
        <button class="btn-action" style="background:#f59e0b" onclick="modifyCredit(${u.id}, -3)" title="کاهش ۳ اعتبار">-3</button>
        <button class="btn-action" style="background:#6366f1" onclick="toggleAdminRole(${u.id})">ادمین</button>
        <button class="btn-action" style="background:#eab308" onclick="toggleSuspend(${u.id})">تعلیق</button>
        <button class="btn-action" style="background:#ef4444" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // ۲. لاگ هوش مصنوعی
  const logsBox = document.getElementById("admin-ai-logs");
  logsBox.innerHTML = aiConversations.map(c => `
    <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:10px; margin-bottom:0.8rem;">
      <small style="color:var(--accent)">کاربر: ${c.user} | زمان: ${c.date}</small>
      <p><strong>درخواست:</strong> ${c.prompt}</p>
    </div>
  `).join("") || "<p>هیچ گفتگویی ثبت نشده است.</p>";

  // ۳. لیست تیکت‌ها
  const ticketsBox = document.getElementById("admin-ticket-list");
  ticketsBox.innerHTML = systemTickets.map(t => `
    <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:10px; margin-bottom:0.8rem;">
      <div><strong>${t.userName}</strong> (${t.userEmail}) <small style="color:var(--text-muted)">${t.time}</small></div>
      <p style="margin:0.5rem 0;">${t.text}</p>
      <button class="btn-sm" onclick="replyTicket('${t.userEmail}')">پاسخ به تیکت</button>
    </div>
  `).join("") || "<p>هیچ تیکتی وجود ندارد.</p>";

  // ۴. بارگذاری مقادیر تنظیمات نام و لوگو
  document.getElementById("setting-site-name").value = siteSettings.name;
  document.getElementById("setting-logo-url").value = siteSettings.logoUrl;
  const preview = document.getElementById("setting-logo-preview");
  if (siteSettings.logoUrl) {
    preview.src = siteSettings.logoUrl;
    preview.classList.remove("hidden");
  }
}

// ذخیره تنظیمات نام سایت و لوگو توسط سازنده
document.getElementById("save-settings-btn").addEventListener("click", () => {
  const newName = document.getElementById("setting-site-name").value.trim();
  const newLogo = document.getElementById("setting-logo-url").value.trim();

  if (newName) siteSettings.name = newName;
  siteSettings.logoUrl = newLogo;

  syncStorage();
  applySiteSettings();
  showToast("تنظیمات نام و لوگوی سایت با موفقیت ذخیره شد.", "success");
});

// پیش‌نمایش زنده لوگو در هنگام تایپ آدرس
document.getElementById("setting-logo-url").addEventListener("input", (e) => {
  const preview = document.getElementById("setting-logo-preview");
  if (e.target.value.trim()) {
    preview.src = e.target.value.trim();
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }
});

// عملیات مدیریت ادمین
window.modifyCredit = function(userId, amount) {
  const user = systemUsers.find(u => u.id === userId);
  if (user) {
    user.credits = Math.max(0, user.credits + amount);
    if (currentUser.id === user.id) currentUser.credits = user.credits;
    syncStorage();
    renderAdminPanel();
    updateUIState();
    showToast(`اعتبار کاربر ${user.name} به‌روز شد.`, "success");
  }
};

window.toggleSuspend = function(userId) {
  const user = systemUsers.find(u => u.id === userId);
  if (user) {
    user.status = user.status === "active" ? "suspended" : "active";
    syncStorage();
    renderAdminPanel();
    showToast(`وضعیت کاربر تغییر کرد: ${user.status}`, "info");
  }
};

window.toggleAdminRole = function(userId) {
  const user = systemUsers.find(u => u.id === userId);
  if (user) {
    user.role = user.role === "admin" ? "user" : "admin";
    syncStorage();
    renderAdminPanel();
    showToast(`نقش کاربر تغییر یافت: ${user.role}`, "info");
  }
};

window.deleteUser = function(userId) {
  if (confirm("آیا از حذف این کاربر اطمینان دارید؟")) {
    systemUsers = systemUsers.filter(u => u.id !== userId);
    syncStorage();
    renderAdminPanel();
    showToast("کاربر حذف شد.", "success");
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

// شروع اولیه
window.addEventListener("DOMContentLoaded", () => {
  applySiteSettings();
  if (currentUser) {
    loginUserSession(currentUser);
    renderUserTickets();
  }
});
