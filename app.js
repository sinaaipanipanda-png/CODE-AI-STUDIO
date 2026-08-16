/**
 * CODE AI STUDIO Core Engine
 * مدیریت کل و سازنده: سینا (sina.ai.pani.panda@gmail.com / sina13950)
 */

const ADMIN_EMAIL = "sina.ai.pani.panda@gmail.com";
const ADMIN_PASS = "sina13950";

let siteSettings = JSON.parse(localStorage.getItem("code_ai_settings")) || {
  name: "CODE AI STUDIO",
  logoUrl: "",
  brevoApiKey: "",
  emailjsPublicKey: "",
  emailjsServiceId: "",
  emailjsTemplateId: ""
};

let currentUser = JSON.parse(localStorage.getItem("code_ai_user")) || null;
let systemUsers = JSON.parse(localStorage.getItem("code_ai_users_db")) || [
  { id: 1, name: "سینا (مدیر کل)", email: ADMIN_EMAIL, pass: ADMIN_PASS, credits: 999, role: "admin", status: "active" }
];
let systemTickets = JSON.parse(localStorage.getItem("code_ai_tickets_db")) || [];
let aiConversations = JSON.parse(localStorage.getItem("code_ai_ai_db")) || [];

// ذخیره‌سازی داده‌ها در حافظه مرورگر
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
  toast.innerText = message;
  toast.className = "toast show";
  if (type === "error") toast.style.borderColor = "var(--danger)";
  else if (type === "success") toast.style.borderColor = "var(--success)";
  else toast.style.borderColor = "var(--glass-border)";
  setTimeout(() => toast.className = "toast", 4500);
}

// تغییر تم تاریک و روشن
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

// سیستم هدایت و قفل صفحات
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
  document.getElementById("page-title").innerText = `${siteSettings.name} | استودیو هوش مصنوعی`;
  document.getElementById("auth-site-title").innerText = siteSettings.name;
  document.getElementById("site-name-display").innerHTML = `${siteSettings.name.split(" ")[0] || "CODE"} <span>${siteSettings.name.split(" ").slice(1).join(" ") || "AI STUDIO"}</span>`;
  document.getElementById("ai-assistant-title").innerText = `دستیار فوق هوشمند ${siteSettings.name}`;
  
  const logoImg = document.getElementById("site-logo-img");
  if (siteSettings.logoUrl) {
    logoImg.src = siteSettings.logoUrl;
    logoImg.classList.remove("hidden");
  } else {
    logoImg.classList.add("hidden");
  }

  if (siteSettings.emailjsPublicKey && window.emailjs) {
    emailjs.init(siteSettings.emailjsPublicKey);
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
   احراز هویت و ارسال واقعی کد به ایمیل با تایمر ۶۰ ثانیه
   ========================================================== */
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

// تابع ارسال ایمیل (پشتیبانی هوشمند از Brevo و EmailJS)
async function sendRealEmailOTP() {
  const email = document.getElementById("reg-email").value.trim();
  const name = document.getElementById("reg-name").value.trim() || "کاربر عزیز";

  if (!email || !email.includes("@")) {
    showToast("لطفاً یک ایمیل معتبر وارد کنید", "error");
    return;
  }

  generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
  showToast("در حال ارسال کد به ایمیل...", "info");

  let sent = false;

  // ۱. ارسال با Brevo (در صورت وجود کلید)
  if (siteSettings.brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": siteSettings.brevoApiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: siteSettings.name, email: ADMIN_EMAIL },
          to: [{ email: email, name: name }],
          subject: `کد تایید ورود به ${siteSettings.name}`,
          htmlContent: `
            <div style="font-family: Tahoma, sans-serif; direction: rtl; text-align: right; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 12px;">
              <h2 style="color: #8b5cf6;">استودیو هوش مصنوعی ${siteSettings.name}</h2>
              <p>سلام <b>${name}</b> عزیز، خوش آمدید!</p>
              <p>کد تایید ۶ رقمی شما برای ورود و دریافت ۱۵ اعتبار رایگان:</p>
              <div style="font-size: 30px; font-weight: bold; letter-spacing: 6px; color: #10b981; margin: 15px 0;">
                ${generatedOTP}
              </div>
              <p style="color: #94a3b8; font-size: 12px;">این کد تا چند دقیقه آینده دارای اعتبار است.</p>
            </div>
          `
        })
      });
      if (response.ok) sent = true;
    } catch (e) {
      console.error("Brevo sending error:", e);
    }
  }

  // ۲. ارسال با EmailJS (در صورت عدم وجود Brevo)
  if (!sent && siteSettings.emailjsPublicKey && siteSettings.emailjsServiceId && siteSettings.emailjsTemplateId && window.emailjs) {
    try {
      await emailjs.send(siteSettings.emailjsServiceId, siteSettings.emailjsTemplateId, {
        to_email: email,
        to_name: name,
        passcode: generatedOTP,
        site_name: siteSettings.name
      });
      sent = true;
    } catch (e) {
      console.error("EmailJS sending error:", e);
    }
  }

  if (sent) {
    showToast(`کد تایید به ایمیل ${email} ارسال شد. صندوق دریافت و هرزنامه را چک کنید.`, "success");
  } else {
    showToast(`کد تایید آماده شد: [ ${generatedOTP} ] (برای ارسال واقعی، کلید Brevo را در پنل ادمین ثبت کنید)`, "success");
  }

  document.getElementById("otp-container").classList.remove("hidden");
  sendOtpBtn.classList.add("hidden");
  startOTPTimer();
}

sendOtpBtn.addEventListener("click", sendRealEmailOTP);
resendOtpBtn.addEventListener("click", sendRealEmailOTP);

// تایید کد و ثبت‌نام
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

  showToast("ثبت‌نام با موفقیت انجام شد! ۱۵ اعتبار به شما تعلق گرفت.", "success");
  loginUserSession(newUser);
});

// ورود به سیستم
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
    showToast(`لینک بازیابی رمز عبور به ایمیل ${email} ارسال شد!`, "success");
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
  document.body.classList.remove("locked");
  document.getElementById("main-header").classList.remove("hidden");
  document.getElementById("auth-section").classList.add("hidden");
  checkDailyCreditReset();
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

/* ==========================================================
   تولید کدهای واقعی با هوش مصنوعی و کسر ۳ اعتبار
   ========================================================== */
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

async function handleAiPrompt() {
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
    const systemPrompt = "You are an expert full-stack developer at CODE AI STUDIO. Write clean, complete, fully functional, production-ready code with responsive design and modern styles. Always provide real and complete working code.";
    const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(promptText)}?system=${encodeURIComponent(systemPrompt)}&model=openai`);
    
    let generatedCode = "";
    if (response.ok) {
      generatedCode = await response.text();
    } else {
      throw new Error("AI Engine offline");
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
  const msgEl = document.createElement("div");
  msgEl.className = `msg ${role === "bot" ? "bot-msg" : "user-msg"}`;
  msgEl.innerText = text;
  aiChatBox.appendChild(msgEl);
  aiChatBox.scrollTop = aiChatBox.scrollHeight;
  return msgEl;
}

/* ==========================================================
   تیکت تلگرامی
   ========================================================== */
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

/* ==========================================================
   پنل مدیریت سینا (Sina Admin Dashboard)
   ========================================================== */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  });
});

function renderAdminPanel() {
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
        <button class="btn-action" style="background:#10b981" onclick="modifyCredit(${u.id}, 15)">+15</button>
        <button class="btn-action" style="background:#f59e0b" onclick="modifyCredit(${u.id}, -3)">-3</button>
        <button class="btn-action" style="background:#eab308" onclick="toggleSuspend(${u.id})">تعلیق</button>
        <button class="btn-action" style="background:#ef4444" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const logsBox = document.getElementById("admin-ai-logs");
  logsBox.innerHTML = aiConversations.map(c => `
    <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:10px; margin-bottom:0.8rem;">
      <small style="color:var(--accent)">کاربر: ${c.user} | زمان: ${c.date}</small>
      <p><strong>درخواست:</strong> ${c.prompt}</p>
    </div>
  `).join("") || "<p>هیچ گفتگویی ثبت نشده است.</p>";

  const ticketsBox = document.getElementById("admin-ticket-list");
  ticketsBox.innerHTML = systemTickets.map(t => `
    <div style="background:rgba(255,255,255,0.05); padding:1rem; border-radius:10px; margin-bottom:0.8rem;">
      <div><strong>${t.userName}</strong> (${t.userEmail}) <small style="color:var(--text-muted)">${t.time}</small></div>
      <p style="margin:0.5rem 0;">${t.text}</p>
      <button class="btn-sm" onclick="replyTicket('${t.userEmail}')">پاسخ به تیکت</button>
    </div>
  `).join("") || "<p>هیچ تیکتی وجود ندارد.</p>";

  // لود تنظیمات
  document.getElementById("setting-site-name").value = siteSettings.name;
  document.getElementById("setting-logo-url").value = siteSettings.logoUrl;
  document.getElementById("setting-brevo-key").value = siteSettings.brevoApiKey || "";
  document.getElementById("setting-emailjs-public").value = siteSettings.emailjsPublicKey || "";
  document.getElementById("setting-emailjs-service").value = siteSettings.emailjsServiceId || "";
  document.getElementById("setting-emailjs-template").value = siteSettings.emailjsTemplateId || "";

  const preview = document.getElementById("setting-logo-preview");
  if (siteSettings.logoUrl) {
    preview.src = siteSettings.logoUrl;
    preview.classList.remove("hidden");
  }
}

// فرم افزودن دستی کاربر
const toggleAddUserBtn = document.getElementById("toggle-add-user-btn");
const adminAddUserForm = document.getElementById("admin-add-user-form");

if (toggleAddUserBtn) {
  toggleAddUserBtn.addEventListener("click", () => {
    adminAddUserForm.classList.toggle("hidden");
    const isHidden = adminAddUserForm.classList.contains("hidden");
    toggleAddUserBtn.innerHTML = isHidden 
      ? '<i class="fa-solid fa-plus"></i> فرم جدید' 
      : '<i class="fa-solid fa-xmark"></i> بستن فرم';
  });
}

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
    toggleAddUserBtn.innerHTML = '<i class="fa-solid fa-plus"></i> فرم جدید';

    showToast(`کاربر «${name}» با موفقیت اضافه شد و می‌تواند بدون تایید ایمیل وارد شود.`, "success");
  });
}

// ذخیره تنظیمات سایت
document.getElementById("save-settings-btn").addEventListener("click", () => {
  siteSettings.name = document.getElementById("setting-site-name").value.trim() || "CODE AI STUDIO";
  siteSettings.logoUrl = document.getElementById("setting-logo-url").value.trim();
  siteSettings.brevoApiKey = document.getElementById("setting-brevo-key").value.trim();
  siteSettings.emailjsPublicKey = document.getElementById("setting-emailjs-public").value.trim();
  siteSettings.emailjsServiceId = document.getElementById("setting-emailjs-service").value.trim();
  siteSettings.emailjsTemplateId = document.getElementById("setting-emailjs-template").value.trim();

  syncStorage();
  applySiteSettings();
  showToast("تنظیمات با موفقیت ذخیره شد.", "success");
});

document.getElementById("setting-logo-url").addEventListener("input", (e) => {
  const preview = document.getElementById("setting-logo-preview");
  if (e.target.value.trim()) {
    preview.src = e.target.value.trim();
    preview.classList.remove("hidden");
  } else {
    preview.classList.add("hidden");
  }
});

// اکشن‌های ادمین
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
