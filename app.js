/**
 * CODE AI STUDIO Core Engine
 * متصل به سرور هوش مصنوعی مستقیم (بدون ۴۰۴)، احراز هویت گوگل و سیستم پیشرفته پرو ⭐
 * سازنده و مدیر کل: سینا (sina.ai.pani.panda@gmail.com / sina13950)
 */

const ADMIN_EMAIL = "sina.ai.pani.panda@gmail.com";
const ADMIN_PASS = "sina13950";

// شناسه رسمی Google Client ID شما
const GOOGLE_CLIENT_ID = "305751111429-6ribodttr55u4p6gbchnqlea1b75o8cs.apps.googleusercontent.com";

// تنظیمات سایت، بنر تبلیغاتی و مدل‌ها
let siteSettings = JSON.parse(localStorage.getItem("code_ai_settings")) || {
  name: "CODE AI STUDIO",
  logoUrl: "",
  googleClientId: GOOGLE_CLIENT_ID,
  ad: {
    enabled: false,
    title: "ارتقا به حساب پرو با تخفیف ویژه!",
    desc: "دسترسی نامحدود به قدرتمندترین مدل‌های هوش مصنوعی Claude 3.5 و DeepSeek R1",
    url: "https://google.com",
    img: ""
  }
};

let currentUser = JSON.parse(localStorage.getItem("code_ai_user")) || null;
let systemUsers = JSON.parse(localStorage.getItem("code_ai_users_db")) || [
  { id: 1, name: "سینا (مدیر کل)", email: ADMIN_EMAIL, pass: ADMIN_PASS, credits: 999, isPro: true, role: "admin", status: "active" }
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

// ناوبری بین صفحات
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

// اعمال تنظیمات نام، لوگو و بنر تبلیغاتی بالای سایت
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
  if (aiTitle) aiTitle.innerText = `دستیار هوشمند | ${siteSettings.name}`;
  
  const logoImg = document.getElementById("site-logo-img");
  if (logoImg) {
    if (siteSettings.logoUrl) {
      logoImg.src = siteSettings.logoUrl;
      logoImg.classList.remove("hidden");
    } else {
      logoImg.classList.add("hidden");
    }
  }

  // رندر بنر تبلیغاتی بالای صفحه
  const adBanner = document.getElementById("top-ad-banner");
  if (adBanner && siteSettings.ad) {
    if (siteSettings.ad.enabled && currentUser) {
      document.getElementById("ad-title").innerText = siteSettings.ad.title || "تبلیغات ویژه";
      document.getElementById("ad-desc").innerText = siteSettings.ad.desc || "";
      document.getElementById("ad-link").href = siteSettings.ad.url || "#";
      
      const adImgEl = document.getElementById("ad-img");
      if (siteSettings.ad.img) {
        adImgEl.src = siteSettings.ad.img;
        adImgEl.classList.remove("hidden");
      } else {
        adImgEl.classList.add("hidden");
      }
      adBanner.classList.remove("hidden");
    } else {
      adBanner.classList.add("hidden");
    }
  }
}

// بستن بنر تبلیغاتی توسط کاربر
const closeAdBtn = document.getElementById("close-ad-btn");
if (closeAdBtn) {
  closeAdBtn.addEventListener("click", () => {
    document.getElementById("top-ad-banner").classList.add("hidden");
  });
}

// سیستم افزایش خودکار ۱۵ اعتبار روزانه در ساعت ۰۰:۰۰ بامداد
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
    showToast("در حال لود کتابخانه گوگل... لطفاً چند لحظه بعد بزنید.", "info");
  }
};

// دیکود کردن توکن JWT برگشتی از گوگل
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

// دریافت اطلاعات کاربر از گوگل
function handleGoogleAuthResponse(response) {
  if (!response || !response.credential) return;
  const payload = parseJwt(response.credential);
  
  if (payload && payload.email) {
    const email = payload.email;
    const name = payload.name || payload.given_name || email.split("@")[0];
    handleSuccessfulLogin(name, email);
  }
}

// ثبت یا ورود با ۱۵ اعتبار اولیه
function handleSuccessfulLogin(name, email) {
  let user = systemUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: Date.now(),
      name: name,
      email: email,
      pass: "google_oauth_verified",
      credits: 15,
      isPro: false,
      role: (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? "admin" : "user",
      status: "active"
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

// فرم ورود عمومی (ایمیل و رمز عبور)
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
  
  applySiteSettings();
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
  
  // بررسی دسترسی کاربر به سیستم پرو ⭐
  const isUserPro = currentUser.isPro || currentUser.role === "admin";
  const proBadgeHeader = document.getElementById("user-pro-badge");
  const homeProStar = document.getElementById("home-pro-star");
  const profProBadge = document.getElementById("prof-pro-badge");
  const profPlanText = document.getElementById("prof-plan-text");
  const profAccessText = document.getElementById("prof-access-text");

  if (isUserPro) {
    if (proBadgeHeader) proBadgeHeader.classList.remove("hidden");
    if (homeProStar) homeProStar.classList.remove("hidden");
    if (profProBadge) profProBadge.classList.remove("hidden");
    if (profPlanText) {
      profPlanText.innerText = "پرو ویژه ⭐";
      profPlanText.className = "badge-plan-normal pro-badge-star";
    }
    if (profAccessText) {
      profAccessText.innerText = "فعال (دسترسی نامحدود به تمام مدل‌های 🟢 و ⭐)";
      profAccessText.style.color = "var(--success)";
    }
  } else {
    if (proBadgeHeader) proBadgeHeader.classList.add("hidden");
    if (homeProStar) homeProStar.classList.add("hidden");
    if (profProBadge) profProBadge.classList.add("hidden");
    if (profPlanText) {
      profPlanText.innerText = "عادی";
      profPlanText.className = "badge-plan-normal";
    }
    if (profAccessText) {
      profAccessText.innerText = "غیرفعال (فقط مدل‌های پایه 🟢)";
      profAccessText.style.color = "var(--text-muted)";
    }
  }

  // قفل کردن واقعی مدل‌های پرو در دراپ‌داون چت برای کاربران عادی
  const proOptions = document.querySelectorAll("#ai-model-select option[data-pro='true']");
  proOptions.forEach(opt => {
    if (!isUserPro) {
      opt.disabled = true;
      if (!opt.innerText.includes("🔒")) opt.innerText += " 🔒";
    } else {
      opt.disabled = false;
      opt.innerText = opt.innerText.replace(" 🔒", "");
    }
  });

  const pName = document.getElementById("prof-name");
  if (pName) pName.innerText = currentUser.name;
  
  const pEmail = document.getElementById("prof-email");
  if (pEmail) pEmail.innerText = currentUser.email;
  
  const pCredit = document.getElementById("prof-credit");
  if (pCredit) pCredit.innerText = currentUser.credits;
  
  const pRole = document.getElementById("prof-role");
  if (pRole) pRole.innerText = currentUser.role === "admin" ? "مدیر کل" : "کاربر";
  
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
   موتور هوش مصنوعی بدون خطای ۴۰۴ و با تفکیک مدل‌های 🟢 و ⭐
   ========================================================== */
const sendAiBtn = document.getElementById("send-ai-btn");
const aiInput = document.getElementById("ai-prompt-input");
const aiChatBox = document.getElementById("ai-chat-box");
const aiModelSelect = document.getElementById("ai-model-select");

// کنترل انتخاب مدل‌ها
if (aiModelSelect) {
  aiModelSelect.addEventListener("change", (e) => {
    const selectedOption = e.target.selectedOptions[0];
    const isProModel = selectedOption && selectedOption.getAttribute("data-pro") === "true";
    const isUserPro = currentUser && (currentUser.isPro || currentUser.role === "admin");

    if (isProModel && !isUserPro) {
      showToast("این مدل با علامت ⭐ مخصوص کاربران پرو است! برای ارتقا به پشتیبانی تیکت دهید :)", "error");
      aiModelSelect.value = "deepseek"; // بازگشت به مدل پایه
    }
  });
}

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

  // بررسی دسترسی به مدل پرو
  const selectedModel = aiModelSelect ? aiModelSelect.value : "deepseek";
  const isProModel = ["claude", "gpt4o-pro", "deepseek-r1"].includes(selectedModel);
  const isUserPro = currentUser && (currentUser.isPro || currentUser.role === "admin");

  if (isProModel && !isUserPro) {
    showToast("این مدل با علامت ⭐ مخصوص کاربران پرو است! برای ارتقا به پشتیبانی تیکت دهید :)", "error");
    if (aiModelSelect) aiModelSelect.value = "deepseek";
    return;
  }

  // کسر ۳ اعتبار
  currentUser.credits -= 3;
  syncStorage();
  updateUIState();

  appendAiMessage("user", promptText);
  aiInput.value = "";

  // مپ کردن مدل استاندارد برای ارسال بدون ارور ۴۰۴
  let apiModelName = "deepseek";
  let displayModelName = "DeepSeek Chat";

  if (selectedModel === "claude") {
    apiModelName = "claude";
    displayModelName = "Claude 3.5 Sonnet ⭐";
  } else if (selectedModel === "gpt4o-pro") {
    apiModelName = "openai";
    displayModelName = "GPT-4o ⭐";
  } else if (selectedModel === "deepseek-r1") {
    apiModelName = "deepseek";
    displayModelName = "DeepSeek-R1 ⭐";
  } else if (selectedModel === "openai") {
    apiModelName = "openai";
    displayModelName = "GPT-4o Mini 🟢";
  } else if (selectedModel === "qwen") {
    apiModelName = "qwen-coder";
    displayModelName = "Qwen 2.5 Coder 🟢";
  } else if (selectedModel === "mistral") {
    apiModelName = "mistral";
    displayModelName = "Llama 3.3 / Mistral 🟢";
  }

  const loadingMsg = appendAiMessage("bot", `در حال تولید کدهای کامل با هوش مصنوعی (${displayModelName})...`);

  try {
    const systemPrompt = "You are an expert full-stack senior developer at CODE AI STUDIO. Write clean, complete, fully functional, production-ready code with responsive design and modern styles. Always provide real and complete working code.";
    
    // ارسال مستقیم از پروتکل استاندارد POST بدون هیچ ارور ۴۰۴
    const response = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptText }
        ],
        model: apiModelName,
        seed: Math.floor(Math.random() * 1000)
      })
    });
    
    let generatedCode = "";
    if (response.ok) {
      generatedCode = await response.text();
    } else {
      // فال‌بک سریع در صورت مشکل موقت سرور
      const fallbackUrl = `https://text.pollinations.ai/${encodeURIComponent(promptText)}?model=openai`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        generatedCode = await fallbackRes.text();
      } else {
        throw new Error(`خطای سرور: ${response.status}`);
      }
    }

    const mandatoryClosingPitch = `\n\nاینم کد های سایت فوق العاده ات!\nاگرم میخوای تیم ما سایتت رو آنلاین کنه ( یعنی یک لینک تحویل بدیم که لینک سایتته) ، تیکت بده تا سازنده سایت ی لینک تر و تمیز تحویلت بده .`;
    
    const finalAnswer = generatedCode + mandatoryClosingPitch;
    loadingMsg.innerText = finalAnswer;

    // ثبت در لاگ کامل گفتگوها برای مدیر
    aiConversations.push({
      user: currentUser.email,
      userName: currentUser.name,
      model: displayModelName,
      prompt: promptText,
      reply: finalAnswer,
      date: new Date().toLocaleString("fa-IR")
    });
    syncStorage();

  } catch (err) {
    console.error("AI Error:", err);
    loadingMsg.innerText = `⚠️ خطا در دریافت پاسخ از هوش مصنوعی:\n${err.message || "لطفاً چند لحظه بعد مجدداً تلاش کنید."}`;
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
        سلام! چطور می‌تونم کمکتون کنم؟ اگر درخواست ارتقا به حساب پرو ⭐، افزایش اعتبار یا آنلاین کردن سایتتون رو دارید در خدمتم.
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
  // ۱. لیست کاربران با دکمه کاملاً مشخص ارتقا به پرو ⭐ و تغییر موجودی
  const tbody = document.getElementById("users-table-body");
  if (tbody) {
    tbody.innerHTML = "";
    systemUsers.forEach(u => {
      const isPro = u.isPro || u.role === "admin";
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
          <button class="btn-action ${isPro ? 'btn-pro-active' : 'btn-pro-inactive'}" onclick="toggleProPlan(${u.id})">
            ${isPro ? '⭐ لغو پرو' : '⭐ ارتقا به پرو'}
          </button>
        </td>
        <td><span class="${u.status === 'active' ? 'badge-active' : 'badge-admin'}">${u.status}</span></td>
        <td class="table-actions">
          <button class="btn-action" style="background:#eab308" onclick="toggleSuspend(${u.id})">تعلیق</button>
          <button class="btn-action" style="background:#ef4444" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ۲. مشاهده کامل لاگ گفتگوهای هوش مصنوعی
  const logsBox = document.getElementById("admin-ai-logs");
  if (logsBox) {
    if (aiConversations.length === 0) {
      logsBox.innerHTML = "<p style='text-align:center; color:var(--text-muted);'>هنوز هیچ گفتگویی ثبت نشده است.</p>";
    } else {
      logsBox.innerHTML = aiConversations.slice().reverse().map(c => `
        <div class="log-card">
          <div class="log-meta">
            <span><strong style="color:var(--accent);">${c.userName || 'کاربر'}</strong> (${c.user})</span>
            <small style="color:var(--text-muted);">${c.date} | مدل: ${c.model || 'نامشخص'}</small>
          </div>
          <div class="log-prompt">
            <strong><i class="fa-solid fa-user"></i> درخواست کاربر:</strong>
            <p style="margin-top:0.3rem;">${c.prompt}</p>
          </div>
          <strong><i class="fa-solid fa-robot"></i> پاسخ و کدهای تولید شده:</strong>
          <pre class="log-reply">${c.reply}</pre>
        </div>
      `).join("");
    }
  }

  // ۳. لیست تیکت‌ها
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

  // ۴. لود مقادیر بخش تبلیغات
  if (siteSettings.ad) {
    document.getElementById("setting-ad-enabled").value = siteSettings.ad.enabled ? "true" : "false";
    document.getElementById("setting-ad-title").value = siteSettings.ad.title || "";
    document.getElementById("setting-ad-desc").value = siteSettings.ad.desc || "";
    document.getElementById("setting-ad-url").value = siteSettings.ad.url || "";
    document.getElementById("setting-ad-img").value = siteSettings.ad.img || "";
  }

  // ۵. لود مقادیر تنظیمات اصلی
  const sName = document.getElementById("setting-site-name");
  if (sName) sName.value = siteSettings.name;
  
  const sLogo = document.getElementById("setting-logo-url");
  if (sLogo) sLogo.value = siteSettings.logoUrl;

  const sGoogleId = document.getElementById("setting-google-client-id");
  if (sGoogleId) sGoogleId.value = siteSettings.googleClientId || GOOGLE_CLIENT_ID;

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

// قابلیت ارتقا به پرو ⭐ یا عادی‌سازی کاربر توسط سینا
window.toggleProPlan = function(userId) {
  const user = systemUsers.find(u => u.id === userId);
  if (user) {
    user.isPro = !user.isPro;
    if (currentUser && currentUser.id === user.id) currentUser.isPro = user.isPro;
    syncStorage();
    renderAdminPanel();
    updateUIState();
    showToast(`وضعیت کاربر «${user.name}» به ${user.isPro ? 'پرو ⭐' : 'عادی'} تغییر یافت.`, "success");
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

// ساخت دستی کاربر
if (adminAddUserForm) {
  adminAddUserForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("admin-new-name").value.trim();
    const email = document.getElementById("admin-new-email").value.trim();
    const pass = document.getElementById("admin-new-pass").value.trim();
    const credits = parseInt(document.getElementById("admin-new-credit").value) || 15;
    const isPro = document.getElementById("admin-new-ispro").value === "true";
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
      isPro: isPro,
      role: role,
      status: "active"
    };

    systemUsers.push(newUser);
    syncStorage();
    renderAdminPanel();

    adminAddUserForm.reset();
    adminAddUserForm.classList.add("hidden");
    if (toggleAddUserBtn) toggleAddUserBtn.innerHTML = '<i class="fa-solid fa-plus"></i> فرم جدید';

    showToast(`کاربر «${name}» (${isPro ? 'پرو ⭐' : 'عادی'}) با موفقیت اضافه شد.`, "success");
  });
}

// ذخیره تنظیمات تبلیغات بالای سایت
const saveAdBtn = document.getElementById("save-ad-btn");
if (saveAdBtn) {
  saveAdBtn.addEventListener("click", () => {
    siteSettings.ad = {
      enabled: document.getElementById("setting-ad-enabled").value === "true",
      title: document.getElementById("setting-ad-title").value.trim(),
      desc: document.getElementById("setting-ad-desc").value.trim(),
      url: document.getElementById("setting-ad-url").value.trim(),
      img: document.getElementById("setting-ad-img").value.trim()
    };
    syncStorage();
    applySiteSettings();
    showToast("تنظیمات بنر تبلیغاتی با موفقیت ذخیره و اعمال شد.", "success");
  });
}

// ذخیره تنظیمات ظاهر سایت
const saveSettingsBtn = document.getElementById("save-settings-btn");
if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", () => {
    const sName = document.getElementById("setting-site-name");
    const sLogo = document.getElementById("setting-logo-url");
    const sGoogleId = document.getElementById("setting-google-client-id");

    if (sName) siteSettings.name = sName.value.trim() || "CODE AI STUDIO";
    if (sLogo) siteSettings.logoUrl = sLogo.value.trim();
    if (sGoogleId) siteSettings.googleClientId = sGoogleId.value.trim();

    syncStorage();
    applySiteSettings();
    initOfficialGoogleButton();
    showToast("تنظیمات کلی با موفقیت ذخیره شد.", "success");
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
