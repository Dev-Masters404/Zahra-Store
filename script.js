const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRsWAlGj0TYr2snyCs_jlq2ovc56Fb0guAo0EjgkzZrKV1aAwnsys1qmtNfXKpP_DXmk0KQs7BARfl8/pub?gid=0&single=true&output=csv";     // رابط شيت المنتجات بصيغة CSV
const ORDERS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwGMm9UlRhJEfhxKMt8srflopGovwZ5ja3OyPJ3IL4r0-vMDbEIuFZLXB0wL9bueMU9lw/exec"; // رابط Google Apps Script لإرسال الطلبات

const FALLBACK_PRODUCTS = [
  { id: 1,  name: "ملايا الفيروز",       category: "عامرية", price: 500, image: "images/melaya1.jpeg",  trending: false },
  { id: 2,  name: "ملايا روكا",          category: "عامرية", price: 500, image: "images/melaya2.jpeg",  trending: false },
  { id: 3,  name: "ملايا حلا",           category: "عامرية", price: 500, image: "images/melaya3.jpeg",  trending: false },
  { id: 4,  name: "ملايا سيرين",         category: "عامرية", price: 500, image: "images/melaya4.jpeg",  trending: false },
  { id: 5,  name: "ملايا جوري",          category: "عامرية", price: 500, image: "images/melaya5.jpeg",  trending: false },
  { id: 6,  name: "ملايا لوز",           category: "عامرية", price: 500, image: "images/melaya6.jpeg",  trending: false },
  { id: 7,  name: "ملايا ياسمين",        category: "عامرية", price: 500, image: "images/melaya7.jpeg",  trending: false },
  { id: 8,  name: "ملايا نور",           category: "عامرية", price: 500, image: "images/melaya8.jpeg",  trending: false },
  { id: 9,  name: "ملايا مرجان",         category: "عامرية", price: 500, image: "images/melaya9.jpeg",  trending: false },
  { id: 10, name: "ملايا سوسن",          category: "عامرية", price: 500, image: "images/melaya10.jpeg", trending: false },
  { id: 11, name: "ملايا أميرة",         category: "3D",     price: 350, image: "images/melaya11.jpeg", trending: false },
  { id: 12, name: "ملايا فلامينجو",      category: "3D",     price: 350, image: "images/melaya12.jpeg", trending: false },
  { id: 13, name: "ملايا زهرة",          category: "3D",     price: 350, image: "images/melaya23.jpeg", trending: false },
  { id: 14, name: "ملايا سكر",           category: "3D",     price: 350, image: "images/melaya26.jpeg", trending: false },
  { id: 15, name: "ملايا كارميلا",       category: "3D",     price: 350, image: "images/melaya15.jpeg", trending: false },
  { id: 16, name: "ملايا فراشة",         category: "3D",     price: 350, image: "images/melaya16.jpeg", trending: false },
  { id: 17, name: "ملايا وردة",          category: "3D",     price: 350, image: "images/melaya17.jpeg", trending: false },
  { id: 18, name: "ملايا بنفسج",         category: "3D",     price: 350, image: "images/melaya18.jpeg", trending: false },
  { id: 19, name: "ملايا لونا",          category: "3D",     price: 350, image: "images/melaya19.jpeg", trending: false },
  { id: 20, name: "ملايا شمس",           category: "3D",     price: 350, image: "images/melaya20.jpeg", trending: false },
  { id: 21, name: "ملايا سندس",          category: "3D",     price: 350, image: "images/melaya21.jpeg", trending: false },
  { id: 22, name: "ملايا ريم",           category: "3D",     price: 350, image: "images/melaya22.jpeg", trending: false },
  { id: 23, name: "ملايا استرايب كلاسيك", category: "استرايب", price: 400, image: "images/melaya13.jpeg", trending: false },
  { id: 24, name: "مفروش عروسة رويال",   category: "عروسة",  price: 700, image: "images/melaya14.jpeg", trending: true  },
];

let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem("zahra_cart") || "[]");
let activeCategory = "الكل";
let searchTerm = "";

async function loadProducts(){
  if (SHEET_CSV_URL){
    try{
      const res = await fetch(SHEET_CSV_URL);
      const csvText = await res.text();
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      PRODUCTS = parsed.data.map(row => ({
        id: row.id,
        name: (row.name || "").trim(),
        category: (row.category || "").trim(),
        price: Number(row.price) || 0,
        image: (row.image || "").trim(),
        trending: String(row.trending || "").toUpperCase() === "TRUE"
      }));
    }catch(err){
      console.error("تعذر تحميل الشيت، هنستخدم البيانات التجريبية:", err);
      PRODUCTS = FALLBACK_PRODUCTS;
    }
  } else {
    PRODUCTS = FALLBACK_PRODUCTS;
  }
  buildCategoryFilters();
  renderProducts();
  renderTrending();
}

function buildCategoryFilters(){
  const wrap = document.getElementById("category-filters");
  const categories = ["الكل", ...new Set(PRODUCTS.map(p => p.category).filter(Boolean))];
  wrap.innerHTML = categories.map(cat =>
    `<button class="filter-pill${cat === activeCategory ? " active" : ""}" data-category="${cat}">${cat}</button>`
  ).join("");

  wrap.querySelectorAll(".filter-pill").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      activeCategory = btn.dataset.category;
      wrap.querySelectorAll(".filter-pill").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts();
    });
  });
}

function renderProducts(){
  const grid = document.getElementById("product-grid");
  const emptyState = document.getElementById("empty-state");

  const filtered = PRODUCTS.filter(p=>{
    const matchesCategory = activeCategory === "الكل" || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0){
    grid.innerHTML = "";
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  grid.innerHTML = filtered.map(p => `
    <div class="product-card">
      <div class="product-image-wrap" data-label="${p.name}">
        ${p.trending ? '<span class="trending-badge">الأكثر طلبًا</span>' : ""}
        <img src="${p.image}" alt="${p.name}"
             onerror="this.closest('.product-image-wrap').classList.add('img-fallback')">
      </div>
      <div class="product-info">
        <span class="material-badge">${p.category}</span>
        <h3>${p.name}</h3>
        <p class="price">${p.price} ج.م</p>
        <button class="add-cart-btn" data-id="${p.id}">أضيفي للعربة</button>
      </div>
    </div>
  `).join("");

  grid.querySelectorAll(".add-cart-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      addToCart(btn.dataset.id);
      btn.textContent = "✓ اتضافت";
      btn.classList.add("added");
      setTimeout(()=>{ btn.textContent = "أضيفي للعربة"; btn.classList.remove("added"); }, 1200);
    });
  });
}

function renderTrending(){
  const container = document.getElementById("trending-content");
  const item = PRODUCTS.find(p => p.trending);
  if (!item){ container.innerHTML = ""; return; }

  container.innerHTML = `
    <div class="t-image-wrap" data-label="${item.name}">
      <img src="${item.image}" alt="${item.name}"
           onerror="this.closest('.t-image-wrap').classList.add('img-fallback')">
    </div>
    <div class="t-content">
      <p class="t-label">الأكثر طلبًا</p>
      <h2>${item.name}</h2>
      <p>طقم مفروش عروسة بخامة عامرية فاخرة، تفصيل يدوي بالكامل، مناسب كهدية أو تجهيز عروسة.</p>
      <p class="t-price">${item.price} ج.م</p>
      <button class="btn btn-primary" data-id="${item.id}" id="trending-add-btn">أضيفي للعربة</button>
    </div>
  `;

  document.getElementById("trending-add-btn").addEventListener("click", ()=>{
    addToCart(String(item.id));
  });
}

function addToCart(id){
  const product = PRODUCTS.find(p => String(p.id) === String(id));
  if (!product) return;
  const existing = cart.find(i => String(i.id) === String(id));
  if (existing){ existing.qty += 1; }
  else { cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 }); }
  saveCart();
  renderCart();
}

function changeQty(id, delta){
  const item = cart.find(i => String(i.id) === String(id));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => String(i.id) !== String(id));
  saveCart();
  renderCart();
}

function removeFromCart(id){
  cart = cart.filter(i => String(i.id) !== String(id));
  saveCart();
  renderCart();
}

function saveCart(){
  localStorage.setItem("zahra_cart", JSON.stringify(cart));
}

function renderCart(){
  const itemsWrap = document.getElementById("cart-items");
  const footer = document.getElementById("cart-footer");
  const totalEl = document.getElementById("cart-total");
  const countEl = document.getElementById("cart-count");

  const totalQty = cart.reduce((sum,i)=>sum+i.qty, 0);
  countEl.textContent = totalQty;

  if (cart.length === 0){
    itemsWrap.innerHTML = '<p class="cart-empty-msg" id="cart-empty-msg">العربة فاضية دلوقتي</p>';
    footer.hidden = true;
    return;
  }
  footer.hidden = false;

  itemsWrap.innerHTML = cart.map(i => `
    <div class="cart-item">
      <img src="${i.image}" alt="${i.name}" onerror="this.style.opacity=0">
      <div class="cart-item-info">
        <h4>${i.name}</h4>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec" data-id="${i.id}">−</button>
          <span>${i.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${i.id}">+</button>
          <button class="remove-item" data-action="remove" data-id="${i.id}">إزالة</button>
        </div>
      </div>
      <strong>${i.price * i.qty} ج.م</strong>
    </div>
  `).join("");

  const total = cart.reduce((sum,i)=> sum + i.price * i.qty, 0);
  totalEl.textContent = `${total} ج.م`;

  itemsWrap.querySelectorAll("[data-action]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.id;
      if (btn.dataset.action === "inc") changeQty(id, 1);
      if (btn.dataset.action === "dec") changeQty(id, -1);
      if (btn.dataset.action === "remove") removeFromCart(id);
    });
  });
}

function toggleCart(open){
  document.getElementById("cart-panel").classList.toggle("open", open);
  document.getElementById("cart-overlay").classList.toggle("open", open);
}

async function submitOrder(e){
  e.preventDefault();
  const statusEl = document.getElementById("order-status");
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();

  if (cart.length === 0) return;

  const order = {
    date: new Date().toISOString(),
    name, phone, address,
    items: cart.map(i => `${i.name} x${i.qty}`).join(" - "),
    total: cart.reduce((sum,i)=> sum + i.price * i.qty, 0)
  };

  if (!ORDERS_SCRIPT_URL){
    statusEl.textContent = "لسه مفيش رابط Google Sheet متظبط لاستقبال الطلبات — كلمي المطور.";
    statusEl.className = "order-status error";
    return;
  }

  statusEl.textContent = "جاري إرسال الطلب...";
  statusEl.className = "order-status";

  try{
    await fetch(ORDERS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(order)
    });
    statusEl.textContent = "تم إرسال طلبك بنجاح! هنتواصل معاكِ قريب.";
    statusEl.className = "order-status success";
    cart = [];
    saveCart();
    renderCart();
    document.getElementById("checkout-form").reset();
  }catch(err){
    console.error(err);
    statusEl.textContent = "حصل خطأ أثناء إرسال الطلب، جربي تاني.";
    statusEl.className = "order-status error";
  }
}

function initSearch(){
  const searchBar = document.getElementById("search-bar");
  const searchInput = document.getElementById("search-input");

  document.getElementById("search-toggle").addEventListener("click", ()=>{
    searchBar.classList.toggle("open");
    if (searchBar.classList.contains("open")) searchInput.focus();
  });
  document.getElementById("search-close").addEventListener("click", ()=>{
    searchBar.classList.remove("open");
  });
  searchInput.addEventListener("input", ()=>{
    searchTerm = searchInput.value;
    renderProducts();
  });
}

function initMobileMenu(){
  const nav = document.getElementById("main-nav");
  document.getElementById("menu-toggle").addEventListener("click", ()=>{
    nav.classList.toggle("open");
  });
  nav.querySelectorAll(".nav-link").forEach(link=>{
    link.addEventListener("click", ()=> nav.classList.remove("open"));
  });
}

function initScrollspy(){
  const navLinks = document.querySelectorAll(".nav-link");
  const targets = ["home","products","trending","about","contact"]
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){
        navLinks.forEach(link=>{
          link.classList.toggle("active", link.dataset.section === entry.target.id);
        });
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

  targets.forEach(section => observer.observe(section));
}

document.addEventListener("DOMContentLoaded", ()=>{
  loadProducts();
  renderCart();
  initSearch();
  initMobileMenu();
  initScrollspy();

  document.getElementById("cart-toggle").addEventListener("click", ()=> toggleCart(true));
  document.getElementById("cart-close").addEventListener("click", ()=> toggleCart(false));
  document.getElementById("cart-overlay").addEventListener("click", ()=> toggleCart(false));
  document.getElementById("checkout-form").addEventListener("submit", submitOrder);
});