/**
 * CODE AI STUDIO Core Engine
 * متصل به پلتفرم ابری Puter.js با پشتیبانی از Claude 3.5, GPT-4o, DeepSeek (بدون فیلتر و رایگان)
 * دارای قابلیت تعیین مدل همگانی و مدل اختصاصی برای هر کاربر
 * سازنده و مدیر کل: سینا (sina.ai.pani.panda@gmail.com / sina13950)
 */

const ADMIN_EMAIL = "sina.ai.pani.panda@gmail.com";
const ADMIN_PASS = "sina13950";

// شناسه رسمی Google Client ID شما
const GOOGLE_CLIENT_ID = "305751111429-6ribodttr55u4p6gbchnqlea1b75o8cs.apps.googleusercontent.com";

// نام‌های فارسی و مدل‌ها
const AI_MODEL_NAMES = {
  "claude-3-5-sonnet": "Claude 3.5 Sonnet",
  "gpt-4o": "GPT-4o",
  "deepseek-chat": "DeepSeek Chat V3",
  "deepseek-reasoner": "DeepSeek R1",
  "gpt-4o-mini": "GPT-4o Mini",
  "mistral-large-latest": "Mistral Large"
};

// تنظیمات سایت
let siteSettings = JSON.parse(localStorage.getItem("code_ai_settings")) || {
  name: "CODE AI STUDIO",
  logoUrl: "",
  googleClientId: GOOGLE_CLIENT_ID,
  defaultAiModel: "claude-3-5-sonnet" // مدل پیش‌فرض همگانی
};

let currentUser = JSON.parse(localStorage.getItem("code_ai_user")) || null;
let systemUsers = JSON.parse(localStorage.getItem("code_ai_users_db")) || [
  { id: 1, name: "سینا (مدیر کل)", email: ADMIN_EMAIL, pass: ADMIN_PASS, credits: 999, role: "admin", status: "active", assignedModel: "claude-3-5-sonnet" }
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
  setTimeout(() => toast.className = "toast", 5000);
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

// تشخیص مدل اختصاصی کاربر یا مدل همگانی
function getActiveAiModelForUser(user) {
  if (user && user.assignedModel && user.assignedModel !== "default") {
    return user.assignedModel;
  }
  return siteSettings.defaultAiModel || "claude-3-5-sonnet";
}

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
  
  const logoImg = document.getElementById("site-logo-img");
  if (logoImg) {
    if (siteSettings.logoUrl) {
      logoImg.src = siteSettings.logoUrl;
      logoImg.classList.remove("hidden");
    } else {
      logoImg.classList.add("hidden");
    }
  }

  updateActiveModelDisplay();
}

function updateActiveModelDisplay() {
  const activeModel = getActiveAiModelForUser(currentUser);
  const modelNameFa = AI_MODEL_NAMES[activeModel] || activeModel;
  
  const badge = document.getElementById("ai-active-model-badge");
  if (badge) badge.innerText = `مدل فعال شما: ${modelNameFa} | هر پیام = ۳ اعتبار`;

  const profModel = document.getElementById("prof-model");
  if (profModel) profModel.innerText = modelNameFa;
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
   موتور رسمی ثبت‌نام و ورود گوگل (Google Identity Services)
   ========================================================== */
function initOfficialGoogleButton() {
  const container = document.getElementById("google-btn-container");
  if (!container) return;

  const clientId = siteSettings.googleClientId || GOOGLE_CLIENT_ID;

  if (window.google && window.google.accounts && window.google.accounts.id) {
    try {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleAuthResponse,
        auto_select: false
      });

      container.innerHTML = "";
      google.accounts.id.renderButton(
        container,
        {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 320
        }
      );
    } catch (err) {
      console.error("Google Render Error:", err);
      renderFallbackGoogleButton(container);
    }
  } else {
    renderFallbackGoogleButton(container);
  }
}

function renderFallbackGoogleButton(container) {
  container.innerHTML = `
    <button type="button" class="btn-primary" style="background:#ffffff; color:#1f2937; border:1px solid #e5e7eb; font-weight:bold;" onclick="triggerQuickGooglePrompt()">
      <i class="fa-brands fa-google" style="color:#ea4335; margin-left:8px;"></i> ورود امن با حساب گوگل
    </button>
  `;
}

window.triggerQuickGooglePrompt = function() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    google.accounts.id.prompt();
  } else {
    showToast("در حال لود کتابخانه گوگل... لطفاً چند لحظه بعد مجدداً تلاش کنید.", "info");
  }
};

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function handleGoogleAuthResponse(response) {
  if (!response || !response.credential) return;
  const payload = parseJwt(response.credential);
  
  if (payload && payload.email) {
    const email = payload.email;
    const name = payload.name || payload.given_name || email.split("@")[0];
    handleSuccessfulLogin(name, email);
  }
}

function handleSuccessfulLogin(name, email) {
  let user = systemUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: Date.now(),
      name: name,
      email: email,
      pass: "google_oauth_verified",
      credits: 15,
      role: (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? "admin" : "user",
      status: "active",
      assignedModel: "default"
    };
    systemUsers.push(user);
  }

  if (user.status === "suspended") {
    showToast("حساب کاربری شما تعلیق شده است. به پشتیبانی تیکت دهید.", "error");
    return;
  }

  currentUser = user;
  syncStorage();
  showToast(`ورود موفقیت‌آمیز بود! خوش آمدید ${user.name}`, "success");
  loginUserSession(user);
}

// فرم ورود عمومی (ایمیل و رمز عبور برای همه کاربران و مدیریت)
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

// خروج از حساب
const logOutBtn = document.getElementById("logout-btn");
if (logOutBtn) {
  logOutBtn.addEventListener("click", () => {
    if (window.google && window.google.accounts) {
      google.accounts.id.disableAutoSelect();
    }
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

  updateActiveModelDisplay();

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
   موتور قدرتمند هوش مصنوعی Puter.js (بدون فیلتر و بدون نیاز به کلید)
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

  // تعیین مدل برای کاربر فعلی (اختصاصی یا همگانی)
  const targetModel = getActiveAiModelForUser(currentUser);
  const targetModelName = AI_MODEL_NAMES[targetModel] || targetModel;

  // کسر ۳ اعتبار
  currentUser.credits -= 3;
  syncStorage();
  updateUIState();

  appendAiMessage("user", promptText);
  aiInput.value = "";

  const loadingMsg = appendAiMessage("bot", `در حال پردازش و تولید کدهای واقعی توسط ${targetModelName}...`);

  try {
    let generatedCode = "";

    const systemPrompt = "You are an expert, senior full-stack developer at CODE AI STUDIO. Write clean, complete, fully functional, production-ready code with responsive design and modern styles. Always provide real and complete working code.";

    // فراخوانی مستقیم و پرسرعت Puter.js
    if (window.puter && window.puter.ai && window.puter.ai.chat) {
      const response = await puter.ai.chat(
        `${systemPrompt}\n\nUser request: ${promptText}`,
        { model: targetModel }
      );
      
      generatedCode = response?.message?.content || response?.text || response?.toString() || "";
    } else {
      // موتور پشتیبان آنلاین در صورت نبود Puter
      const fallbackRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(promptText)}?system=${encodeURIComponent(systemPrompt)}&model=openai`);
      if (fallbackRes.ok) {
        generatedCode = await fallbackRes.text();
      } else {
        throw new Error("سرویس هوش مصنوعی در دسترس نیست.");
      }
    }

    const mandatoryClosingPitch = `\n\nاینم کد های سایت فوق العاده ات!\nاگرم میخوای تیم ما سایتت رو آنلاین کنه ( یعنی یک لینک تحویل بدیم که لینک سایتته) ، تیکت بده تا سازنده سایت ی لینک تر و تمیز تحویلت بده .`;
    
    loadingMsg.innerText = generatedCode + mandatoryClosingPitch;
    aiConversations.push({ user: currentUser.email, prompt: promptText, reply: loadingMsg.innerText, model: targetModelName, date: new Date().toLocaleString("fa-IR") });
    syncStorage();

  } catch (err) {
    console.error("Puter AI Error:", err);
    loadingMsg.innerText = `⚠️ خطا در برقراری ارتباط با هوش مصنوعی:\n${err.message || "لطفاً اینترنت خود را چک کنید."}`;
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
      const assigned = u.assignedModel || "default";
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
        <td>
          <select class="user-model-select" onchange="setUserAiModel(${u.id}, this.value)">
            <option value="default" ${assigned === "default" ? "selected" : ""}>پیش‌فرض همگانی</option>
            <option value="claude-3-5-sonnet" ${assigned === "claude-3-5-sonnet" ? "selected" : ""}>Claude 3.5 Sonnet</option>
            <option value="gpt-4o" ${assigned === "gpt-4o" ? "selected" : ""}>GPT-4o</option>
            <option value="deepseek-chat" ${assigned === "deepseek-chat" ? "selected" : ""}>DeepSeek Chat V3</option>
            <option value="deepseek-reasoner" ${assigned === "deepseek-reasoner" ? "selected" : ""}>DeepSeek R1</option>
            <option value="gpt-4o-mini" ${assigned === "gpt-4o-mini" ? "selected" : ""}>GPT-4o Mini</option>
            <option value="mistral-large-latest" ${assigned === "mistral-large-latest" ? "selected" : ""}>Mistral Large</option>
          </select>
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
        <small style="color:var(--accent)">کاربر: ${c.user} | مدل: ${c.model || "پیش‌فرض"} | زمان: ${c.date}</small>
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

  // پر کردن فرم تنظیمات همگانی
  const sName = document.getElementById("setting-site-name");
  if (sName) sName.value = siteSettings.name;
  
  const sLogo = document.getElementById("setting-logo-url");
  if (sLogo) sLogo.value = siteSettings.logoUrl;

  const sGoogleId = document.getElementById("setting-google-client-id");
  if (sGoogleId) sGoogleId.value = siteSettings.googleClientId || GOOGLE_CLIENT_ID;

  const sDefaultModel = document.getElementById("setting-default-ai-model");
  if (sDefaultModel) sDefaultModel.value = siteSettings.defaultAiModel || "claude-3-5-sonnet";

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

// تغییر مدل اختصاصی برای یک کاربر خاص
window.setUserAiModel = function(userId, modelKey) {
  const user = systemUsers.find(u => u.id === userId);
  if (user) {
    user.assignedModel = modelKey;
    if (currentUser && currentUser.id === user.id) {
      currentUser.assignedModel = modelKey;
      updateActiveModelDisplay();
    }
    syncStorage();
    showToast(`مدل هوش مصنوعی کاربر «${user.name}» به ${AI_MODEL_NAMES[modelKey] || "همگانی"} تغییر یافت.`, "success");
  }
};

// تغییر مستقیم موجودی اعتبار
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

// ساخت دستی کاربر با مدل اختصاصی
if (adminAddUserForm) {
  adminAddUserForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("admin-new-name").value.trim();
    const email = document.getElementById("admin-new-email").value.trim();
    const pass = document.getElementById("admin-new-pass").value.trim();
    const credits = parseInt(document.getElementById("admin-new-credit").value) || 15;
    const role = document.getElementById("admin-new-role").value;
    const assignedModel = document.getElementById("admin-new-model").value || "default";

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
      status: "active",
      assignedModel: assignedModel
    };

    systemUsers.push(newUser);
    syncStorage();
    renderAdminPanel();

    adminAddUserForm.reset();
    adminAddUserForm.classList.add("hidden");
    if (toggleAddUserBtn) toggleAddUserBtn.innerHTML = '<i class="fa-solid fa-plus"></i> فرم جدید';

    showToast(`کاربر «${name}» با موفقیت اضافه شد و می‌تواند وارد شود.`, "success");
  });
}

// ذخیره تنظیمات همگانی ظاهر سایت و هوش مصنوعی
const saveSettingsBtn = document.getElementById("save-settings-btn");
if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", () => {
    const sName = document.getElementById("setting-site-name");
    const sLogo = document.getElementById("setting-logo-url");
    const sGoogleId = document.getElementById("setting-google-client-id");
    const sDefaultModel = document.getElementById("setting-default-ai-model");

    if (sName) siteSettings.name = sName.value.trim() || "CODE AI STUDIO";
    if (sLogo) siteSettings.logoUrl = sLogo.value.trim();
    if (sGoogleId) siteSettings.googleClientId = sGoogleId.value.trim();
    if (sDefaultModel) siteSettings.defaultAiModel = sDefaultModel.value;

    syncStorage();
    applySiteSettings();
    initOfficialGoogleButton();
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

// عملیات پنل مدیریت
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

// راه‌اندازی اولیه برنامه
window.addEventListener("DOMContentLoaded", () => {
  applySiteSettings();
  
  let checkGoogleLoaded = setInterval(() => {
    if (window.google && window.google.accounts) {
      initOfficialGoogleButton();
      clearInterval(checkGoogleLoaded);
    }
  }, 300);

  setTimeout(() => clearInterval(checkGoogleLoaded), 5000);

  if (currentUser) {
    loginUserSession(currentUser);
    renderUserTickets();
  } else {
    document.body.classList.add("locked");
    navigateTo("auth-section");
  }
});
