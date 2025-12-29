const DATA_URL = "assets/data/posts.json";

const state = {
  posts: [],
  filter: "all",
  search: "",
  category: "all",
  sliderIndex: 0,
  sliderTimer: null
};

function qs(id){ return document.getElementById(id); }
function esc(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

function enablePageTransitions(){
  const overlay = qs("pageTransition");
  document.body.classList.add("page-enter");

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if(!a) return;

    const href = a.getAttribute("href") || "";
    const isExternal = /^https?:\/\//i.test(href);
    const isAnchor = href.startsWith("#");
    const isNewTab = a.target === "_blank";

    if(isExternal || isAnchor || isNewTab) return;

    e.preventDefault();
    overlay.classList.add("show");
    setTimeout(() => {
      window.location.href = href;
    }, 220);
  });

  window.addEventListener("pageshow", () => {
    overlay.classList.remove("show");
  });
}

function categoryLabel(cat){
  if(cat === "local") return { text: "محلي", cls: "local" };
  if(cat === "international") return { text: "دولي", cls: "international" };
  if(cat === "qat") return { text: "قات", cls: "qat" };
  if(cat === "tips") return { text: "نصائح", cls: "tips" };
  return { text: "عام", cls: "" };
}

function postCard(post){
  const badge = categoryLabel(post.category);
  return `
    <article class="card">
      <img src="${esc(post.cover)}" alt="${esc(post.title)}" loading="lazy">
      <div class="card-body">
        <div class="card-meta">
          <span class="badge ${badge.cls}">${badge.text}</span>
          <span>${esc(post.date)}</span>
        </div>
        <h3 class="card-title">${esc(post.title)}</h3>
        <p class="card-excerpt">${esc(post.excerpt)}</p>
        <div class="card-meta">
          <span>${esc(post.location || "")}</span>
          <a class="read-more" href="post.html?id=${encodeURIComponent(post.id)}">قراءة الخبر</a>
        </div>
      </div>
    </article>
  `;
}

function applyFilters(posts){
  const search = state.search.trim().toLowerCase();
  const filter = state.filter;
  const category = state.category;

  return posts.filter(p => {
    const matchesChip = (filter === "all") ? true : (p.category === filter);
    const matchesSelect = (category === "all") ? true : (p.category === category);

    const hay = `${p.title} ${p.excerpt} ${p.location}`.toLowerCase();
    const matchesSearch = search ? hay.includes(search) : true;

    return matchesChip && matchesSelect && matchesSearch;
  });
}

function renderGrids(){
  const latestGrid = qs("latestGrid");
  const localGrid = qs("localGrid");
  const qatGrid = qs("qatGrid");
  const tipsGrid = qs("tipsGrid");

  const filtered = applyFilters(state.posts);

  latestGrid.innerHTML = filtered.slice(0, 9).map(postCard).join("");
  localGrid.innerHTML = filtered.filter(p => p.category === "local").slice(0, 9).map(postCard).join("");
  qatGrid.innerHTML = filtered.filter(p => p.category === "qat").slice(0, 9).map(postCard).join("");
  tipsGrid.innerHTML = filtered.filter(p => p.category === "tips").slice(0, 9).map(postCard).join("");
}

function renderSlider(){
  const track = qs("sliderTrack");
  const featured = state.posts.slice(0, 4);

  track.innerHTML = featured.map(p => {
    const badge = categoryLabel(p.category);
    return `
      <div class="slide">
        <img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">
        <div class="meta">
          <span class="badge ${badge.cls}">${badge.text}</span>
          <span>${esc(p.date)}</span>
          <span>${esc(p.location || "")}</span>
        </div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt)}</p>
        <a href="post.html?id=${encodeURIComponent(p.id)}">قراءة التفاصيل</a>
      </div>
    `;
  }).join("");

  state.sliderIndex = 0;
  updateSliderPosition();

  if(state.sliderTimer) clearInterval(state.sliderTimer);
  state.sliderTimer = setInterval(() => nextSlide(), 6000);
}

function updateSliderPosition(){
  const track = qs("sliderTrack");
  // ملاحظة: RTL + flex يجعل التحريك بهذا الاتجاه مناسباً بصرياً
  track.style.transform = `translateX(${state.sliderIndex * 100}%)`;
}

function prevSlide(){
  const max = Math.min(4, state.posts.length) - 1;
  state.sliderIndex = (state.sliderIndex - 1 + (max + 1)) % (max + 1);
  updateSliderPosition();
}
function nextSlide(){
  const max = Math.min(4, state.posts.length) - 1;
  state.sliderIndex = (state.sliderIndex + 1) % (max + 1);
  updateSliderPosition();
}

async function load(){
  qs("year").textContent = new Date().getFullYear();

  enablePageTransitions();

  const navToggle = qs("navToggle");
  const navMenu = qs("navMenu");
  navToggle.addEventListener("click", () => navMenu.classList.toggle("open"));

  qs("searchInput").addEventListener("input", (e) => {
    state.search = e.target.value;
    renderGrids();
  });

  qs("categorySelect").addEventListener("change", (e) => {
    state.category = e.target.value;
    renderGrids();
  });

  qs("chips").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if(!btn) return;
    document.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    state.filter = btn.dataset.filter;
    renderGrids();
  });

  qs("prevSlide").addEventListener("click", prevSlide);
  qs("nextSlide").addEventListener("click", nextSlide);

  const res = await fetch(DATA_URL, { cache: "no-store" });
  const posts = await res.json();

  posts.sort((a,b) => String(b.date).localeCompare(String(a.date)));
  state.posts = posts;

  renderSlider();
  renderGrids();
}

load().catch(err => {
  console.error(err);
  alert("حدث خطأ أثناء تحميل البيانات. تأكد من مسارات الملفات.");
});
