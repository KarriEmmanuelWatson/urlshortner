const API_BASE = "http://localhost:8080/api";
let token = localStorage.getItem("token");

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements (may not exist on all pages)
  const authSection = document.getElementById("authSection");
  const shortenSection = document.getElementById("shortenSection");
  const urlsSection = document.getElementById("urlsSection");
  const logoutBtn = document.getElementById("logoutBtn");
  const signupBtn = document.getElementById("signupBtn");
  const loginBtn = document.getElementById("loginBtn");
  const shortenBtn = document.getElementById("shortenBtn");

  // Attach event listeners if elements exist
  if (signupBtn) signupBtn.addEventListener("click", signup);
  if (loginBtn) loginBtn.addEventListener("click", login);
  if (shortenBtn) shortenBtn.addEventListener("click", createShortUrl);
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  checkAuth();
});

// ----------------------
// Auth and UI functions
// ----------------------
function checkAuth() {
  const authSection = document.getElementById("authSection");
  const shortenSection = document.getElementById("shortenSection");
  const urlsSection = document.getElementById("urlsSection");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!authSection && !shortenSection && !urlsSection && !logoutBtn) return;

  if (token) {
    if (authSection) authSection.style.display = "none";
    if (shortenSection) shortenSection.style.display = "block";
    if (urlsSection) urlsSection.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "block";
    fetchMyUrls();
  } else {
    if (authSection) authSection.style.display = "block";
    if (shortenSection) shortenSection.style.display = "none";
    if (urlsSection) urlsSection.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

// ----------------------
// Sign Up
// ----------------------
async function signup() {
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!usernameInput || !emailInput || !passwordInput) return;

  const username = usernameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!username || !email || !password) return alert("All fields are required");

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    alert(data.message || data.error);
    if (data.message) window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    alert("Signup failed");
  }
}

// ----------------------
// Login
// ----------------------
async function login() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!emailInput || !passwordInput) return;

  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) return alert("Email and password are required");

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      token = data.token;
      checkAuth();
      if (window.location.pathname.includes("index.html")) {
        window.location.href = "dashboard.html"; // redirect after login
      }
    } else {
      alert(data.message || data.error);
    }
  } catch (err) {
    console.error(err);
    alert("Login failed");
  }
}

// ----------------------
// Logout
// ----------------------
function logout() {
  localStorage.removeItem("token");
  token = null;
  checkAuth();
  if (window.location.pathname.includes("dashboard.html")) {
    window.location.href = "index.html"; // redirect to login
  }
}

// ----------------------
// Create Short URL
// ----------------------
async function createShortUrl() {
  if (!token) return alert("Please login first");

  const originalUrlInput = document.getElementById("originalUrl");
  const prefixInput = document.getElementById("prefix");
  const durationInput = document.getElementById("duration");
  const resultDiv = document.getElementById("result");

  if (!originalUrlInput || !resultDiv) return;

  const originalUrl = originalUrlInput.value;
  const prefix = prefixInput ? prefixInput.value : "";
  const duration = durationInput ? durationInput.value : "";

  if (!originalUrl) return alert("Please enter a URL");

  try {
    const res = await fetch(`${API_BASE}/shorten`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ originalUrl, prefix, duration }),
    });

    const data = await res.json();

    if (data.shortUrl) {
      // Updated link to include /api/
      const shortLink = `${window.location.origin}/api/${data.shortId}`;
      resultDiv.innerHTML = `Short URL: <a href="${shortLink}" target="_blank">${shortLink}</a>`;
      fetchMyUrls();
    } else {
      resultDiv.innerText = data.error || "Error creating URL";
    }
  } catch (err) {
    console.error(err);
    resultDiv.innerText = "Error creating URL";
  }
}

// ----------------------
// Fetch all URLs for logged-in user
// ----------------------
async function fetchMyUrls() {
  if (!token) return;

  const listDiv = document.getElementById("urlsList");
  if (!listDiv) return;

  try {
    const res = await fetch(`${API_BASE}/my-urls`, {
      headers: { Authorization: "Bearer " + token },
    });
    const urls = await res.json();
    listDiv.innerHTML = "";

    if (!Array.isArray(urls)) return;

    urls.forEach((u) => {
      const shortLink = `${window.location.origin}/api/${u.shortId}`;
      const div = document.createElement("div");
      div.className = "url-item";
      div.innerHTML = `
        <a href="${shortLink}" target="_blank">${
        u.shortId
      }</a> - Expires: ${new Date(u.expireAt).toLocaleTimeString()}
        <button onclick="deleteUrl('${u.shortId}')">Delete</button>
      `;
      listDiv.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

// ----------------------
// Delete URL
// ----------------------
async function deleteUrl(shortId) {
  if (!token) return;
  if (!confirm("Delete this URL?")) return;

  try {
    const res = await fetch(`${API_BASE}/${shortId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    alert(data.message || data.error);
    fetchMyUrls();
  } catch (err) {
    console.error(err);
    alert("Error deleting URL");
  }
}
