// Talks to the Gym Wari backend API.
// Change this if you deploy the backend somewhere other than localhost:3000.
const API_BASE = "http://localhost:3000";

// ============================================================
// ENTRY CHECK (gate scanner box)
// ============================================================
function checkEntry(userName) {
  return fetch(`${API_BASE}/api/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: userName }),
  }).then(async (response) => {
    const data = await response.json();
    if (response.ok && data.allowed) {
      return data.message;
    }
    throw data.message || "Entry check failed. Please try again.";
  });
}

document.getElementById("checkBtn").addEventListener("click", function () {
  let name = document.getElementById("nameInput").value.trim();
  let result = document.getElementById("result");

  if (!name) {
    result.textContent = "Pehle apna naam likhein.";
    result.style.color = "white";
    result.style.backgroundColor = "rgba(68, 0, 0, 0.47)";
    result.style.borderRadius = "12px";
    result.style.padding = "10px";
    result.style.display = "block";
    return;
  }

  checkEntry(name)
    .then(function (message) {
      result.textContent = message;
      result.style.color = "white";
      result.style.backgroundColor = "rgba(2, 123, 0, 0.67)";
      result.style.borderRadius = "12px";
      result.style.padding = "10px";
      result.style.display = "block";
    })
    .catch(function (error) {
      result.textContent = error;
      result.style.color = "white";
      result.style.backgroundColor = "rgba(68, 0, 0, 0.47)";
      result.style.borderRadius = "12px";
      result.style.padding = "10px";
      result.style.display = "block";
    });
});

// ============================================================
// SHOP: load products from the backend
// ============================================================
function renderShop() {
  const grid = document.querySelector(".shop-grid");
  if (!grid) return;

  fetch(`${API_BASE}/api/products`)
    .then((res) => res.json())
    .then((products) => {
      grid.innerHTML = "";

      if (!products.length) {
        grid.innerHTML = '<p style="color:var(--chalk-dim);">No products yet.</p>';
        return;
      }

      products.forEach((p) => {
        const imgSrc = p.image ? `${API_BASE}${p.image}` : "";
        const card = document.createElement("div");
        card.className = "shop-card";
        card.innerHTML = `
          <div class="shop-photo">
            ${imgSrc ? `<img src="${imgSrc}" alt="${p.name}" style="object-fit:cover;">` : ""}
          </div>
          <div class="shop-body">
            <h3>${p.name}</h3>
            <div class="shop-price mono">${p.price || ""}</div>
            <p>${p.description || ""}</p>
            <a href="#" class="btn ghost">Add to Cart</a>
          </div>
        `;
        grid.appendChild(card);
      });
    })
    .catch(() => {
      console.log("Could not load products from backend.");
    });
}

renderShop();

// ============================================================
// MEMBER LOGIN / SIGNUP
// ============================================================
const loginOpenBtn = document.getElementById("login-open-btn");
const loginOverlay = document.getElementById("login-overlay");
const loginCloseBtn = document.getElementById("login-close-btn");
const loginForm = document.getElementById("login-form");
const loginTitle = document.getElementById("login-title");
const loginNameLabel = document.getElementById("login-name-label");
const loginNameInput = document.getElementById("login-name");
const loginSubmitBtn = document.getElementById("login-submit-btn");
const loginToggleText = document.getElementById("login-toggle-text");
const loginToggleLink = document.getElementById("login-toggle-link");
const loginError = document.getElementById("login-error");
const loginSuccess = document.getElementById("login-success");
const loginSuccessMessage = document.getElementById("login-success-message");
const logoutBtn = document.getElementById("logout-btn");

let authMode = "login"; // "login" or "signup"

function openModal() {
  loginOverlay.classList.add("is-open");
}
function closeModal() {
  loginOverlay.classList.remove("is-open");
  loginError.style.display = "none";
}

function setAuthMode(mode) {
  authMode = mode;
  loginError.style.display = "none";
  if (mode === "signup") {
    loginTitle.textContent = "Sign up";
    loginNameLabel.style.display = "block";
    loginNameInput.style.display = "block";
    loginNameInput.required = true;
    loginSubmitBtn.textContent = "Sign Up";
    loginToggleText.textContent = "Already have an account?";
    loginToggleLink.textContent = "Log in";
  } else {
    loginTitle.textContent = "Log in";
    loginNameLabel.style.display = "none";
    loginNameInput.style.display = "none";
    loginNameInput.required = false;
    loginSubmitBtn.textContent = "Log In";
    loginToggleText.textContent = "Don't have an account?";
    loginToggleLink.textContent = "Sign up";
  }
}

function showLoggedInState(member) {
  loginForm.hidden = true;
  loginSuccess.hidden = false;
  loginSuccessMessage.textContent = `Welcome back, ${member.name}! (${member.tier} member)`;
  loginOpenBtn.textContent = member.name;
}

function showLoggedOutState() {
  loginForm.hidden = false;
  loginSuccess.hidden = true;
  loginOpenBtn.textContent = "Log In";
}

// check on page load if a member is already logged in
function checkExistingSession() {
  const token = localStorage.getItem("memberToken");
  if (!token) return;

  fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Session expired");
      return res.json();
    })
    .then((data) => {
      showLoggedInState(data.member);
    })
    .catch(() => {
      localStorage.removeItem("memberToken");
      showLoggedOutState();
    });
}

if (loginOpenBtn) {
  loginOpenBtn.addEventListener("click", () => {
    const token = localStorage.getItem("memberToken");
    if (token) {
      // already logged in — clicking the nav button just opens the modal
      // which will show the "logged in" panel with a logout button
      openModal();
    } else {
      openModal();
    }
  });
}

if (loginCloseBtn) {
  loginCloseBtn.addEventListener("click", closeModal);
}
if (loginOverlay) {
  loginOverlay.addEventListener("click", (e) => {
    if (e.target === loginOverlay) closeModal();
  });
}
if (loginToggleLink) {
  loginToggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    setAuthMode(authMode === "login" ? "signup" : "login");
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.style.display = "none";

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const name = loginNameInput.value.trim();

    try {
      const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const body = authMode === "signup" ? { name, email, password } : { email, password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      localStorage.setItem("memberToken", data.token);
      showLoggedInState(data.member);
      loginForm.reset();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = "block";
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("memberToken");
    showLoggedOutState();
    closeModal();
  });
}

checkExistingSession();