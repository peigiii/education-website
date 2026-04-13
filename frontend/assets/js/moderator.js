const tokenInput = document.getElementById("modToken");
const loadBtn = document.getElementById("loadBtn");
const saveModTokenBtn = document.getElementById("saveModTokenBtn");
const clearModTokenBtn = document.getElementById("clearModTokenBtn");
const approveAllBtn = document.getElementById("approveAllBtn");
const rejectAllBtn = document.getElementById("rejectAllBtn");
const modMsg = document.getElementById("modMsg");
const postList = document.getElementById("postList");
let currentPendingPostIds = [];
const COPY = window.getCopy("moderator");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function parseApiResponse(response) {
  const raw = await response.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { message: raw || COPY.unexpectedResponse };
  }
  return payload;
}

function setModeratorMessage(text, type = "") {
  modMsg.textContent = text;
  modMsg.className = `message${type ? ` ${type}` : ""}`;
}

function getToken() {
  return tokenInput.value.trim() || window.getAuthToken();
}

function buildHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function renderPosts(posts) {
  postList.innerHTML = "";
  currentPendingPostIds = posts.map((post) => post._id);
  if (!posts.length) {
    postList.innerHTML = `
      <div class="panel card empty-state">
        <strong>${COPY.noPendingTitle}</strong>
        ${COPY.noPendingHint}
      </div>
    `;
    return;
  }

  posts.forEach((post) => {
    const item = document.createElement("article");
    item.className = "panel card stack fade-in moderation-post";
    item.innerHTML = `
      <div class="row">
        <strong class="post-title">${escapeHtml(post.title)}</strong>
        <span class="pill ${post.status}">${post.status}</span>
      </div>
      <p class="muted post-meta">${COPY.byPrefix} ${escapeHtml(post.user_id?.username || COPY.unknownUser)}</p>
      <p class="post-content">${escapeHtml(post.content)}</p>
      <div class="row post-actions">
        <button class="btn btn-success" data-action="approved">${COPY.approve}</button>
        <button class="btn btn-outline" data-action="rejected">${COPY.reject}</button>
        <button class="btn btn-danger" data-action="delete">${COPY.delete}</button>
      </div>
    `;

    item.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        if (action === "delete") {
          handleDelete(post._id);
          return;
        }
        handleModerate(post._id, action);
      });
    });

    postList.append(item);
  });
}

async function loadPendingPosts() {
  if (!getToken()) {
    setModeratorMessage(COPY.tokenRequired, "error");
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/forum-posts?status=pending`, {
      headers: buildHeaders(),
    });
    const payload = await parseApiResponse(response);
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Failed to load posts");
    }
    renderPosts(payload.data || []);
    setModeratorMessage(COPY.pendingLoaded, "ok");
  } catch (error) {
    setModeratorMessage(`${COPY.loadPostsFailedPrefix} ${error.message}`, "error");
  }
}

async function handleModerate(postId, status) {
  try {
    const response = await fetch(`${window.API_BASE_URL}/forum-posts/${postId}/moderate`, {
      method: "PATCH",
      headers: buildHeaders(),
      body: JSON.stringify({ status }),
    });
    const payload = await parseApiResponse(response);
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Moderation failed");
    }
    setModeratorMessage(`${COPY.postUpdatedPrefix} ${status} ${COPY.postUpdatedSuffix}`, "ok");
    await loadPendingPosts();
  } catch (error) {
    setModeratorMessage(`${COPY.actionFailedPrefix} ${error.message}`, "error");
  }
}

async function handleBulkModerate(status) {
  if (!currentPendingPostIds.length) {
    setModeratorMessage(COPY.noVisiblePending, "error");
    return;
  }
  setModeratorMessage(
    `${COPY.applyingBulkPrefix} "${status}" ${COPY.applyingBulkMid} ${currentPendingPostIds.length} ${COPY.applyingBulkSuffix}`,
  );
  try {
    for (const postId of currentPendingPostIds) {
      const response = await fetch(`${window.API_BASE_URL}/forum-posts/${postId}/moderate`, {
        method: "PATCH",
        headers: buildHeaders(),
        body: JSON.stringify({ status }),
      });
      const payload = await parseApiResponse(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || `Failed on post ${postId}`);
      }
    }
    setModeratorMessage(`${COPY.bulkDonePrefix} ${status}${COPY.bulkDoneSuffix}`, "ok");
    await loadPendingPosts();
  } catch (error) {
    setModeratorMessage(`${COPY.bulkFailedPrefix} ${error.message}`, "error");
  }
}

async function handleDelete(postId) {
  try {
    const response = await fetch(`${window.API_BASE_URL}/forum-posts/${postId}`, {
      method: "DELETE",
      headers: buildHeaders(),
    });
    const payload = await parseApiResponse(response);
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Delete failed");
    }
    setModeratorMessage(COPY.postDeleted, "ok");
    await loadPendingPosts();
  } catch (error) {
    setModeratorMessage(`${COPY.deleteFailedPrefix} ${error.message}`, "error");
  }
}

loadBtn.addEventListener("click", loadPendingPosts);
approveAllBtn.addEventListener("click", () => handleBulkModerate("approved"));
rejectAllBtn.addEventListener("click", () => handleBulkModerate("rejected"));

saveModTokenBtn.addEventListener("click", () => {
  const token = tokenInput.value.trim();
  if (!token) return;
  window.setAuthToken(token);
  setModeratorMessage(COPY.tokenSaved, "ok");
});

clearModTokenBtn.addEventListener("click", () => {
  localStorage.removeItem("edu_token");
  tokenInput.value = "";
  setModeratorMessage(COPY.tokenCleared, "ok");
});

tokenInput.value = window.getAuthToken();
loadBtn.textContent = COPY.loadPendingLabel;
saveModTokenBtn.textContent = COPY.saveTokenLabel;
clearModTokenBtn.textContent = COPY.clearTokenLabel;
approveAllBtn.textContent = COPY.approveVisibleLabel;
rejectAllBtn.textContent = COPY.rejectVisibleLabel;
setModeratorMessage(COPY.loadPendingPrompt);
