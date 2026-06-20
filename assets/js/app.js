(function () {
  const page = document.body.dataset.page || "home";
  const products = window.SPICES_PRODUCTS || [];
  const recipes = window.SPICES_RECIPES || [];
  const blogs = window.SPICES_BLOGS || [];
  const categories = window.SPICES_CATEGORIES || [];

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function renderCategoryQuickLinks() {
    const container = document.querySelector(".category-quick-links");
    if (!container) return;
    const activeCategory = getParam("category") || "all";
    container.innerHTML = categories
      .filter((category) => category.id !== "combo-packs")
      .map((category) => {
        const href = SpicesStore.url(category.href);
        return `
          <a class="category-quick-links__item ${category.id === activeCategory ? "is-active" : ""}" href="${href}">
            <span class="category-quick-links__icon">${category.icon}</span>
            <span>${category.shortLabel}</span>
          </a>
        `;
      })
      .join("");
  }

  function renderProductGrid(selector, items) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = items.map((product) => SpicesStore.createProductCard(product)).join("");
  }

  function renderHome() {
    renderCategoryQuickLinks();
    renderProductGrid(".product-showcase__grid", products);

    const recipeGrid = document.querySelector(".recipe-videos__grid");
    if (recipeGrid) {
      recipeGrid.innerHTML = recipes
        .map((recipe) => {
          const product = products.find((item) => item.id === recipe.productId);
          if (!product) return "";
          return `
            <article class="recipe-card">
              <a class="recipe-card__media" href="${SpicesStore.url(`pages/product.html?id=${product.id}`)}" style="--product-color: ${product.color}" aria-label="${recipe.title}">
                <img class="recipe-card__photo" src="${product.image}" alt="${recipe.title}" loading="lazy" onerror="this.hidden=true" />
                <span class="recipe-card__play">Play</span>
              </a>
              <div class="recipe-card__content">
                <button class="recipe-card__add" type="button" data-add="${product.id}" ${product.available ? "" : "disabled"}>
                  ${product.available ? "Add to cart" : "Sold out"}
                </button>
                <h3>${recipe.title}</h3>
                <p>${product.name} - ${SpicesStore.money(product.price)}</p>
              </div>
            </article>
          `;
        })
        .join("");
    }

    renderBlogs(".expert-blogs__grid");
  }

  function renderShop() {
    renderCategoryQuickLinks();
    renderProductGrid(".listing-products__grid", products);
  }

  function renderCategory() {
    renderCategoryQuickLinks();
    const categoryId = getParam("category") || "powdered";
    const category = categories.find((item) => item.id === categoryId);
    const filtered = products.filter((product) => product.category === categoryId);
    const title = document.querySelector(".listing-hero__title");
    const count = document.querySelector(".listing-hero__count");
    if (title) title.textContent = category ? category.label : "Products";
    if (count) count.textContent = `${filtered.length} products`;
    renderProductGrid(".listing-products__grid", filtered);
  }

  function renderProductDetail() {
    const product = products.find((item) => item.id === getParam("id")) || products[0];
    const container = document.querySelector(".product-detail");
    if (!container || !product) return;
    const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);
    document.title = `${product.name} | Spices`;
    container.innerHTML = `
      <section class="product-detail__main">
        <div class="product-detail__media" style="--product-color: ${product.color}">
          <img class="product-detail__photo" src="${product.image}" alt="${product.name}" onerror="this.hidden=true" />
          <span class="product-card__badge">${product.badge}</span>
        </div>
        <div class="product-detail__content">
          <p class="section-kicker">${SpicesStore.categoryLabel(product.category)}</p>
          <h1>${product.name}</h1>
          <p>${product.details}</p>
          <div class="product-card__price-row">
            <span class="product-card__price">${SpicesStore.money(product.price)}</span>
            <span class="product-card__mrp">${SpicesStore.money(product.mrp)}</span>
          </div>
          <div class="option-row" aria-label="Select weight">
            ${product.weights.map((weight, index) => `<button type="button" class="${index === 0 ? "is-selected" : ""}">${weight}</button>`).join("")}
          </div>
          <div class="product-detail__buy-row">
            <div class="quantity-control product-detail__quantity">
              <button type="button" data-detail-minus>−</button>
              <span data-detail-quantity>1</span>
              <button type="button" data-detail-plus>+</button>
            </div>
            <button class="primary-action" type="button" data-detail-add="${product.id}" ${product.available ? "" : "disabled"}>
              ${product.available ? "Add to cart" : "Sold out"}
            </button>
            <button class="secondary-action" type="button" data-buy-now="${product.id}" ${product.available ? "" : "disabled"}>Buy now</button>
          </div>
          <div class="product-detail__info-grid">
            <article><h2>Ingredients</h2><p>${product.ingredients}</p></article>
            <article><h2>How to use</h2><p>${product.usage}</p></article>
            <article><h2>Delivery</h2><p>Free shipping above Rs. 249. Usually dispatched within 24 hours.</p></article>
            <article><h2>Return</h2><p>Return support available for damaged or incorrect products.</p></article>
          </div>
        </div>
      </section>
      <section class="product-showcase product-detail__related">
        <div class="section-heading">
          <p class="section-kicker">You may also like</p>
          <h2>Related Products</h2>
        </div>
        <div class="product-showcase__grid">
          ${(related.length ? related : products.slice(0, 4)).map((item) => SpicesStore.createProductCard(item)).join("")}
        </div>
      </section>
    `;
  }

  function renderCartPage() {
    SpicesStore.renderCartPage();
  }

  function renderSearchPage() {
    const queryInput = document.querySelector(".search-page__input");
    const results = document.querySelector(".search-page__results");
    if (!queryInput || !results) return;
    const initialQuery = getParam("q") || "";
    queryInput.value = initialQuery;
    const render = () => {
      const q = queryInput.value.trim().toLowerCase();
      const matches = products.filter((product) => !q || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(q));
      results.innerHTML = matches.map((product) => SpicesStore.createProductCard(product)).join("");
    };
    queryInput.addEventListener("input", render);
    render();
  }

  function renderBlogs(selector = ".blog-listing__grid") {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = blogs
      .map(
        (blog, index) => `
          <article class="blog-card">
            <a class="blog-card__visual" href="${SpicesStore.url(`pages/blog-detail.html?id=${blog.id}`)}" style="--blog-image: url('${blog.image}')">Note ${String(index + 1).padStart(2, "0")}</a>
            <h3><a href="${SpicesStore.url(`pages/blog-detail.html?id=${blog.id}`)}">${blog.title}</a></h3>
            <p>${blog.summary}</p>
          </article>
        `
      )
      .join("");
  }

  function renderBlogDetail() {
    const blog = blogs.find((item) => item.id === getParam("id")) || blogs[0];
    const container = document.querySelector(".blog-detail");
    if (!container || !blog) return;

    const relatedProducts = (blog.relatedProducts || [])
      .map((productId) => products.find((product) => product.id === productId))
      .filter(Boolean);
    const relatedBlogs = blogs.filter((item) => item.id !== blog.id).slice(0, 2);

    document.title = `${blog.title} | Spices`;
    container.innerHTML = `
      <section class="blog-detail__hero">
        <p class="section-kicker">${blog.category}</p>
        <h1>${blog.title}</h1>
        <p>${blog.summary}</p>
        <div class="blog-detail__meta">
          <span>${blog.date}</span>
          <span>${blog.readTime}</span>
        </div>
      </section>
      <section class="blog-detail__layout">
        <article class="blog-detail__article">
          <div class="blog-detail__visual" style="--blog-image: url('${blog.image}')">Spices Note</div>
          ${blog.content
            .map(
              (section) => `
                <section class="blog-detail__section">
                  <h2>${section.heading}</h2>
                  <p>${section.body}</p>
                  ${
                    section.tips
                      ? `<ul class="blog-detail__tips">${section.tips.map((tip) => `<li>${tip}</li>`).join("")}</ul>`
                      : ""
                  }
                </section>
              `
            )
            .join("")}
          <section class="blog-faq" aria-labelledby="blog-faq-title">
            <p class="section-kicker">FAQ</p>
            <h2 id="blog-faq-title">Frequently Asked Questions</h2>
            <div class="blog-faq__list">
              ${(blog.faqs || [])
                .map(
                  (faq, index) => `
                    <article class="blog-faq__item ${index === 0 ? "is-open" : ""}">
                      <button class="blog-faq__question" type="button" aria-expanded="${index === 0 ? "true" : "false"}">
                        <span>${faq.question}</span>
                        <span class="blog-faq__icon">+</span>
                      </button>
                      <div class="blog-faq__answer">
                        <p>${faq.answer}</p>
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>
          </section>
        </article>
        <aside class="blog-detail__sidebar">
          <div class="blog-detail__panel">
            <h2>Related Products</h2>
            <div class="blog-detail__products">
              ${relatedProducts.map((product) => SpicesStore.createProductCard(product)).join("")}
            </div>
          </div>
          <div class="blog-detail__panel">
            <h2>More Reads</h2>
            <div class="blog-detail__more">
              ${relatedBlogs
                .map(
                  (item) => `
                    <a href="${SpicesStore.url(`pages/blog-detail.html?id=${item.id}`)}">
                      <strong>${item.title}</strong>
                      <span>${item.readTime}</span>
                    </a>
                  `
                )
                .join("")}
            </div>
          </div>
        </aside>
      </section>
    `;
  }

  function renderCheckout() {
    const summary = document.querySelector(".checkout-summary");
    if (!summary) return;
    summary.innerHTML = SpicesStore.createOrderSummary();
  }

  function bindPageEvents() {
    document.addEventListener("click", (event) => {
      const slideButton = event.target.closest("[data-slide]");
      if (slideButton) {
        const grid = document.querySelector(".product-showcase__grid");
        if (!grid) return;
        const direction = slideButton.dataset.slide === "next" ? 1 : -1;
        grid.scrollBy({ left: direction * Math.max(260, grid.clientWidth * 0.8), behavior: "smooth" });
      }

      const optionButton = event.target.closest(".option-row button");
      if (optionButton) {
        optionButton.parentElement.querySelectorAll("button").forEach((button) => button.classList.remove("is-selected"));
        optionButton.classList.add("is-selected");
      }

      const faqButton = event.target.closest(".blog-faq__question");
      if (faqButton) {
        const item = faqButton.closest(".blog-faq__item");
        const isOpen = item.classList.toggle("is-open");
        faqButton.setAttribute("aria-expanded", String(isOpen));
      }

      if (event.target.closest("[data-detail-plus]")) {
        const quantity = document.querySelector("[data-detail-quantity]");
        quantity.textContent = String(Number(quantity.textContent) + 1);
      }

      if (event.target.closest("[data-detail-minus]")) {
        const quantity = document.querySelector("[data-detail-quantity]");
        quantity.textContent = String(Math.max(1, Number(quantity.textContent) - 1));
      }

      const detailAdd = event.target.closest("[data-detail-add]");
      if (detailAdd) {
        const qty = Number(document.querySelector("[data-detail-quantity]")?.textContent || 1);
        SpicesStore.addToCart(detailAdd.dataset.detailAdd, qty, true);
      }

      const buyNow = event.target.closest("[data-buy-now]");
      if (buyNow) {
        const qty = Number(document.querySelector("[data-detail-quantity]")?.textContent || 1);
        SpicesStore.addToCart(buyNow.dataset.buyNow, qty, false);
        window.location.href = SpicesStore.url("pages/checkout.html");
      }
    });
  }

  renderCategoryQuickLinks();
  if (page === "home") renderHome();
  if (page === "shop") renderShop();
  if (page === "category") renderCategory();
  if (page === "product") renderProductDetail();
  if (page === "cart") renderCartPage();
  if (page === "search") renderSearchPage();
  if (page === "blogs") renderBlogs();
  if (page === "blog-detail") renderBlogDetail();
  if (page === "checkout") renderCheckout();
  bindPageEvents();
})();
