const DATA_URL = "assets/data/posts.json";

function qsid(id){ return document.getElementById(id); }
function qs(sel){ return document.querySelector(sel); }
function esc(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

function enablePageTransitions(){
  const overlay = qsid("pageTransition");
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

function card(post){
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

function getId(){
  const u = new URL(window.location.href);
  return u.searchParams.get("id");
}

async function load(){
  const yearEl = qsid("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  enablePageTransitions();

  const id = getId();
  if(!id){
    qsid("postContainer").innerHTML =
      `<div class="post-body"><h1>لم يتم تحديد خبر</h1><p class="content">ارجع للرئيسية واختر خبرًا.</p></div>`;
    return;
  }

  const res = await fetch(DATA_URL, { cache: "no-store" });
  const posts = await res.json();

  const post = posts.find(p => p.id === id);
  if(!post){
    qsid("postContainer").innerHTML =
      `<div class="post-body"><h1>الخبر غير موجود</h1><p class="content">قد يكون تم حذف الخبر أو تغيير معرفه.</p></div>`;
    return;
  }

  const badge = categoryLabel(post.category);
  document.title = `${post.title} | موقع الجمل`;

  const paragraphs = Array.isArray(post.content) ? post.content : [String(post.content || "")];

  qsid("postContainer").innerHTML = `
    <img class="post-cover" src="${esc(post.cover)}" alt="${esc(post.title)}">
    <div class="post-body">
      <h1>${esc(post.title)}</h1>
      <div class="meta">
        <span class="badge ${badge.cls}">${badge.text}</span>
        <span>${esc(post.date)}</span>
        <span>${esc(post.location || "")}</span>
      </div>
      <div class="content">
        ${paragraphs.map(p => `<p>${esc(p)}</p>`).join("")}
      </div>
    </div>
  `;

  const related = posts
    .filter(p => p.category === post.category && p.id !== post.id)
    .sort((a,b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 6);

  qsid("relatedGrid").innerHTML =
    related.length ? related.map(card).join("") : "<p class='muted'>لا توجد أخبار ذات صلة حاليًا.</p>";
}

load().catch(err => {
  console.error(err);
  alert("حدث خطأ أثناء تحميل الخبر. تأكد من المسارات.");
});
