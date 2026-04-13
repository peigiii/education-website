function normalizeApiBase(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function guessDefaultApiBase() {
  const { protocol, hostname, origin } = window.location;
  const isLocal =
    hostname === "localhost" || hostname === "127.0.0.1" || protocol === "file:";

  if (isLocal) return "http://localhost:5001/api";
  return `${origin}/api`;
}

const runtimeApiBase = window.__API_BASE_URL__;
const storedApiBase = localStorage.getItem("edu_api_base_url");
window.API_BASE_URL = normalizeApiBase(storedApiBase || runtimeApiBase || guessDefaultApiBase());

window.setApiBaseUrl = function setApiBaseUrl(url) {
  const normalized = normalizeApiBase(url);
  if (!normalized) return;
  localStorage.setItem("edu_api_base_url", normalized);
  window.API_BASE_URL = normalized;
};

window.resetApiBaseUrl = function resetApiBaseUrl() {
  localStorage.removeItem("edu_api_base_url");
  window.API_BASE_URL = normalizeApiBase(runtimeApiBase || guessDefaultApiBase());
};

window.getAuthToken = function getAuthToken() {
  return localStorage.getItem("edu_token") || "";
};

window.setAuthToken = function setAuthToken(token) {
  localStorage.setItem("edu_token", token);
};
