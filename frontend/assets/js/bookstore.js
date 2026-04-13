const state = {
  books: [],
  cart: [],
};

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const bookMeta = document.getElementById("bookMeta");
const bookGrid = document.getElementById("bookGrid");
const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const checkoutMsg = document.getElementById("checkoutMsg");
const tokenInput = document.getElementById("tokenInput");
const saveTokenBtn = document.getElementById("saveTokenBtn");
const clearTokenBtn = document.getElementById("clearTokenBtn");
const COPY = window.getCopy("bookstore");

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

function formatMoney(value) {
  return `RM ${Number(value).toFixed(2)}`;
}

function setCheckoutMessage(text, type = "") {
  checkoutMsg.textContent = text;
  checkoutMsg.className = `message${type ? ` ${type}` : ""}`;
}

function renderCategories() {
  const categories = [...new Set(state.books.map((book) => book.category))].filter(Boolean);
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.append(option);
  });
}

function getFilteredBooks() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;
  return state.books.filter((book) => {
    const matchKeyword =
      !keyword ||
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword);
    const matchCategory = !category || book.category === category;
    return matchKeyword && matchCategory;
  });
}

function addToCart(book) {
  const existing = state.cart.find((item) => item.book_id === book._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      book_id: book._id,
      title: book.title,
      price: book.price,
      quantity: 1,
    });
  }
  renderCart();
}

function removeFromCart(bookId) {
  state.cart = state.cart.filter((item) => item.book_id !== bookId);
  renderCart();
}

function changeQty(bookId, delta) {
  const item = state.cart.find((entry) => entry.book_id === bookId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(bookId);
    return;
  }
  renderCart();
}

function renderBooks() {
  const filtered = getFilteredBooks();
  bookGrid.innerHTML = "";
  bookMeta.textContent =
    filtered.length === 1
      ? `${filtered.length} ${COPY.resultsSingular}`
      : `${filtered.length} ${COPY.resultsPlural}`;

  if (!filtered.length) {
    bookGrid.innerHTML = `
      <div class="empty-state fade-in">
        <strong>${COPY.noBooksTitle}</strong>
        ${COPY.noBooksHint}
      </div>
    `;
    return;
  }

  filtered.forEach((book) => {
    const stock = Number(book.stock_quantity) || 0;
    const stockClass = stock === 0 ? "stock-out" : stock <= 3 ? "stock-low" : "";
    const stockLabel =
      stock === 0
        ? COPY.stockOut
        : stock <= 3
          ? `${COPY.stockLowPrefix}: ${stock}`
          : `${COPY.stockPrefix}: ${stock}`;
    const card = document.createElement("article");
    card.className = "panel book-card stack fade-in";
    card.innerHTML = `
      <div class="row">
        <span class="pill">${escapeHtml(book.category || COPY.categoryGeneral)}</span>
        <strong>${formatMoney(book.price)}</strong>
      </div>
      <h3 class="book-title">${escapeHtml(book.title)}</h3>
      <p class="muted book-author">${COPY.byPrefix || "By:"} ${escapeHtml(book.author)}</p>
      <p class="book-stock ${stockClass}">${stockLabel}</p>
      <button class="btn btn-primary" ${stock === 0 ? "disabled" : ""}>
        ${stock === 0 ? COPY.unavailable : COPY.addToCart}
      </button>
    `;
    const addBtn = card.querySelector("button");
    if (stock > 0) {
      addBtn.addEventListener("click", () => addToCart(book));
    }
    bookGrid.append(card);
  });
}

function renderCart() {
  cartList.innerHTML = "";
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = formatMoney(total);

  if (!state.cart.length) {
    cartList.innerHTML = `
      <div class="empty-state">
        <strong>${COPY.cartEmptyTitle}</strong>
        ${COPY.cartEmptyHint}
      </div>
    `;
    return;
  }

  state.cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "mini-item stack fade-in";
    row.innerHTML = `
      <div class="row">
        <strong>${item.title}</strong>
        <button class="btn btn-outline btn-remove">${COPY.remove}</button>
      </div>
      <div class="row">
        <span>${formatMoney(item.price)} ${COPY.eachPriceSuffix}</span>
        <div class="row qty-controls">
          <button class="btn btn-outline btn-minus">-</button>
          <span>${item.quantity}</span>
          <button class="btn btn-outline btn-plus">+</button>
        </div>
      </div>
    `;
    row.querySelector(".btn-remove").addEventListener("click", () => removeFromCart(item.book_id));
    row.querySelector(".btn-minus").addEventListener("click", () => changeQty(item.book_id, -1));
    row.querySelector(".btn-plus").addEventListener("click", () => changeQty(item.book_id, +1));
    cartList.append(row);
  });
}

async function loadBooks() {
  setCheckoutMessage(COPY.loadingBooks, "");
  try {
    const response = await fetch(`${window.API_BASE_URL}/books`);
    const payload = await parseApiResponse(response);
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Failed to load books");
    }
    state.books = payload.data || [];
    categorySelect.innerHTML = `<option value="">${COPY.allCategoriesLabel}</option>`;
    renderCategories();
    renderBooks();
    setCheckoutMessage(COPY.bookListLoaded, "ok");
  } catch (error) {
    bookGrid.innerHTML = `<p class="muted">${COPY.loadBooksFailedPrefix} ${error.message}</p>`;
    setCheckoutMessage(COPY.unableLoadBooks, "error");
  }
}

async function checkout() {
  if (!state.cart.length) {
    setCheckoutMessage(COPY.cartEmptyError, "error");
    return;
  }

  const token = tokenInput.value.trim() || window.getAuthToken();
  if (!token) {
    setCheckoutMessage(COPY.tokenRequired, "error");
    return;
  }

  checkoutBtn.disabled = true;
  try {
    const response = await fetch(`${window.API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: state.cart.map((item) => ({
          book_id: item.book_id,
          quantity: item.quantity,
        })),
      }),
    });
    const payload = await parseApiResponse(response);
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Checkout failed");
    }
    setCheckoutMessage(`${COPY.checkoutSuccessPrefix} ${payload.data._id}`, "ok");
    state.cart = [];
    renderCart();
    await loadBooks();
  } catch (error) {
    setCheckoutMessage(`${COPY.checkoutFailedPrefix} ${error.message}`, "error");
  } finally {
    checkoutBtn.disabled = false;
  }
}

searchInput.addEventListener("input", renderBooks);
categorySelect.addEventListener("change", renderBooks);
checkoutBtn.addEventListener("click", checkout);

saveTokenBtn.addEventListener("click", () => {
  const token = tokenInput.value.trim();
  if (!token) return;
  window.setAuthToken(token);
  setCheckoutMessage(COPY.tokenSaved, "ok");
});

clearTokenBtn.addEventListener("click", () => {
  localStorage.removeItem("edu_token");
  tokenInput.value = "";
  setCheckoutMessage(COPY.tokenCleared, "ok");
});

tokenInput.value = window.getAuthToken();
saveTokenBtn.textContent = COPY.saveTokenLabel;
clearTokenBtn.textContent = COPY.clearTokenLabel;
checkoutBtn.textContent = COPY.checkoutLabel;
loadBooks();
renderCart();
