(function () {
  const CART_KEY = "spices-cart";
  const products = window.SPICES_PRODUCTS || [];
  const categories = window.SPICES_CATEGORIES || [];

  const base = document.body.dataset.base || ".";
  const cartDrawer = document.querySelector(".cart-drawer");
  const cartItems = document.querySelector(".cart-drawer__items");
  const cartEmpty = document.querySelector(".cart-drawer__empty");
  const cartCount = document.querySelector(".cart-count");
  const cartSubtotal = document.querySelector(".cart-subtotal");
  const overlay = document.querySelector(".page-overlay");
  const mobileDrawer = document.querySelector(".mobile-drawer");
  const searchPanel = document.querySelector(".search-panel");
  const searchInput = document.querySelector(".search-panel__input");
  const searchResults = document.querySelector(".search-panel__results");
  const quickViewModal = document.querySelector(".quick-view-modal");
  const quickViewBody = document.querySelector(".quick-view-modal__body");

  const store = {
    cart: loadCart(),
  };

  function url(path) {
    if (path.startsWith("http") || path.startsWith("#")) return path;
    return `${base}/${path}`.replace(/\/\.\//g, "/").replace(/^\.\//, "");
  }

  function money(value) {
    return `Rs. ${Number(value).toFixed(2)}`;
  }

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(store.cart));
  }

  function categoryLabel(categoryId) {
    return categories.find((category) => category.id === categoryId)?.label || "Products";
  }

  function productInitials(product) {
    return product.name
      .split(" ")
      .filter((word) => /^[A-Za-z]/.test(word))
      .slice(0, 2)
      .map((word) => word[0])
      .join("");
  }

  function createProductPack(product) {
    return `
      <div class="product-pack" aria-hidden="true">
        <span class="product-pack__brand">SPICES</span>
        <span class="product-pack__name">${product.name.split("/")[0].trim()}</span>
        <span class="product-pack__weight">${product.weight}</span>
      </div>
    `;
  }

  function createProductCard(product) {
    return `
      <article class="product-card" style="--product-color: ${product.color}" data-product-id="${product.id}">
        <a class="product-card__image" href="${url(`pages/product.html?id=${product.id}`)}" aria-label="View ${product.name}">
          <span class="product-card__badge">${product.badge}</span>
          ${createProductPack(product)}
        </a>
        <div class="product-card__content">
          <h3 class="product-card__title">
            <a href="${url(`pages/product.html?id=${product.id}`)}">${product.name}</a>
          </h3>
          <span class="product-card__meta">${product.weight} - ${product.description}</span>
          <div class="product-card__price-row">
            <span class="product-card__price">${money(product.price)}</span>
            <span class="product-card__mrp">${money(product.mrp)}</span>
          </div>
          <div class="product-card__actions">
            <button class="product-card__add" type="button" data-add="${product.id}" ${product.available ? "" : "disabled"}>
              ${product.available ? "Add to cart" : "Sold out"}
            </button>
            <button class="product-card__quick" type="button" data-quick-view="${product.id}" aria-label="Quick view ${product.name}">+</button>
          </div>
        </div>
      </article>
    `;
  }

  function addToCart(productId, quantity = 1, openCart = true) {
    const product = products.find((item) => item.id === productId);
    if (!product || !product.available) return;
    const existingItem = store.cart.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      store.cart.push({ id: productId, quantity });
    }
    saveCart();
    renderCart();
    renderCartPage();
    if (openCart && cartDrawer) openPanel(cartDrawer);
  }

  function updateQuantity(productId, change) {
    const item = store.cart.find((cartItemData) => cartItemData.id === productId);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) {
      store.cart = store.cart.filter((cartItemData) => cartItemData.id !== productId);
    }
    saveCart();
    renderCart();
    renderCartPage();
  }

  function getCartLines() {
    return store.cart
      .map((line) => {
        const product = products.find((item) => item.id === line.id);
        return product ? { ...product, quantity: line.quantity } : null;
      })
      .filter(Boolean);
  }

  function getSubtotal() {
    return getCartLines().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function renderCart() {
    const lines = getCartLines();
    const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalQuantity;
    if (cartSubtotal) cartSubtotal.textContent = money(getSubtotal());
    if (cartEmpty) cartEmpty.classList.toggle("is-visible", lines.length === 0);
    if (!cartItems) return;
    cartItems.innerHTML = lines.map(createCartItem).join("");
  }

  function createCartItem(item) {
    return `
      <article class="cart-item" style="--product-color: ${item.color}">
        <div class="cart-item__thumb">${productInitials(item)}</div>
        <div>
          <h3><a href="${url(`pages/product.html?id=${item.id}`)}">${item.name}</a></h3>
          <span class="product-card__meta">${item.weight} - ${money(item.price)}</span>
          <div class="cart-item__row">
            <div class="quantity-control" aria-label="Quantity for ${item.name}">
              <button type="button" data-qty-minus="${item.id}" aria-label="Decrease quantity">-</button>
              <span>${item.quantity}</span>
              <button type="button" data-qty-plus="${item.id}" aria-label="Increase quantity">+</button>
            </div>
            <strong>${money(item.price * item.quantity)}</strong>
          </div>
        </div>
      </article>
    `;
  }

  function createOrderSummary() {
    const lines = getCartLines();
    const subtotal = getSubtotal();
    const shipping = subtotal >= 249 || subtotal === 0 ? 0 : 49;
    const total = subtotal + shipping;
    if (!lines.length) {
      return `
        <div class="empty-state">
          <h2>Your cart is empty</h2>
          <p>Add fresh masale before checkout.</p>
          <a class="primary-action" href="${url("pages/shop.html")}">Shop products</a>
        </div>
      `;
    }
    return `
      <div class="order-summary__items">${lines.map(createCartItem).join("")}</div>
      <div class="order-summary__totals">
        <div><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
        <div><span>Shipping</span><strong>${shipping ? money(shipping) : "Free"}</strong></div>
        <div><span>Total</span><strong>${money(total)}</strong></div>
      </div>
    `;
  }

  function renderCartPage() {
    const cartPage = document.querySelector(".cart-page__body");
    if (!cartPage) return;
    const lines = getCartLines();
    cartPage.innerHTML = lines.length
      ? `
          <div class="cart-page__items">${lines.map(createCartItem).join("")}</div>
          <aside class="cart-page__summary">
            ${createOrderSummary()}
            <a class="checkout-button" href="${url("pages/checkout.html")}">Proceed to checkout</a>
          </aside>
        `
      : `
          <div class="empty-state">
            <h2>Your cart is empty</h2>
            <p>Add fresh masale to continue.</p>
            <a class="primary-action" href="${url("pages/shop.html")}">Shop products</a>
          </div>
        `;
  }

  function renderSearchResults(query = "") {
    if (!searchResults) return;
    const normalizedQuery = query.trim().toLowerCase();
    const matches = products.filter((product) => {
      if (!normalizedQuery) return true;
      return `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(normalizedQuery);
    });

    searchResults.innerHTML = matches.length
      ? matches
          .map(
            (product) => `
              <div class="search-result" style="--product-color: ${product.color}">
                <a class="search-result__thumb" href="${url(`pages/product.html?id=${product.id}`)}">${productInitials(product)}</a>
                <div>
                  <strong><a href="${url(`pages/product.html?id=${product.id}`)}">${product.name}</a></strong>
                  <p class="product-card__meta">${product.description}</p>
                </div>
                <button class="product-card__add" type="button" data-add="${product.id}" ${product.available ? "" : "disabled"}>
                  ${product.available ? "Add" : "Sold"}
                </button>
              </div>
            `
          )
          .join("")
      : `<p class="product-card__meta">No products found for "${query}".</p>`;
  }

  function openQuickView(productId) {
    const product = products.find((item) => item.id === productId);
    if (!product || !quickViewBody || !quickViewModal) return;
    quickViewBody.innerHTML = `
      <div class="quick-view-modal__media" style="--product-color: ${product.color}">
        ${createProductPack(product)}
      </div>
      <div class="quick-view-modal__details">
        <p class="section-kicker">${categoryLabel(product.category)}</p>
        <h2 id="quick-view-title">${product.name}</h2>
        <p>${product.details}</p>
        <div class="product-card__price-row">
          <span class="product-card__price">${money(product.price)}</span>
          <span class="product-card__mrp">${money(product.mrp)}</span>
        </div>
        <div class="option-row" aria-label="Select weight">
          ${product.weights.map((weight, index) => `<button type="button" class="${index === 0 ? "is-selected" : ""}">${weight}</button>`).join("")}
        </div>
        <div class="quick-view-modal__actions">
          <button class="primary-action" type="button" data-add="${product.id}" ${product.available ? "" : "disabled"}>
            ${product.available ? "Add to cart" : "Sold out"}
          </button>
          <a class="secondary-action" href="${url(`pages/product.html?id=${product.id}`)}">View details</a>
        </div>
      </div>
    `;
    openPanel(quickViewModal);
  }

  function openPanel(panel) {
    if (!panel) return;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    overlay?.classList.add("is-visible");
    document.body.classList.add("is-locked");
  }

  function closePanels() {
    [mobileDrawer, searchPanel, cartDrawer, quickViewModal].forEach((panel) => {
      if (!panel) return;
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
    });
    overlay?.classList.remove("is-visible");
    document.body.classList.remove("is-locked");
  }

  function bindSharedEvents() {
    document.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add]");
      if (addButton) addToCart(addButton.dataset.add);

      const quickViewButton = event.target.closest("[data-quick-view]");
      if (quickViewButton) openQuickView(quickViewButton.dataset.quickView);

      const minusButton = event.target.closest("[data-qty-minus]");
      if (minusButton) updateQuantity(minusButton.dataset.qtyMinus, -1);

      const plusButton = event.target.closest("[data-qty-plus]");
      if (plusButton) updateQuantity(plusButton.dataset.qtyPlus, 1);

      if (event.target.closest(".cart-toggle")) openPanel(cartDrawer);
      if (event.target.closest(".site-header__menu-toggle")) openPanel(mobileDrawer);
      if (event.target.closest(".search-toggle")) {
        renderSearchResults();
        openPanel(searchPanel);
        window.setTimeout(() => searchInput?.focus(), 80);
      }

      if (
        event.target.closest(".mobile-drawer__close") ||
        event.target.closest(".cart-drawer__close") ||
        event.target.closest(".search-panel__close") ||
        event.target.closest(".quick-view-modal__close") ||
        event.target === overlay
      ) {
        closePanels();
      }
    });

    document.querySelectorAll(".mobile-drawer__navigation a").forEach((link) => {
      link.addEventListener("click", closePanels);
    });

    searchInput?.addEventListener("input", (event) => {
      renderSearchResults(event.target.value);
    });

    document.querySelector(".newsletter-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = event.currentTarget.querySelector(".newsletter-form__message");
      if (message) message.textContent = "Subscribed. Fresh offers will reach your inbox.";
      event.currentTarget.reset();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePanels();
    });
  }

  window.SpicesStore = {
    addToCart,
    categoryLabel,
    createOrderSummary,
    createProductCard,
    createProductPack,
    money,
    renderCartPage,
    url,
  };

  bindSharedEvents();
  renderCart();
})();
