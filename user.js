import { loadData, findNode, countDescendants, syncFromRemote } from "./app.js";

const EXPANDED_KEY = "maintenanceHubExpanded_user_v1";

let data = loadData();
let selectedId = data.root.children[0]?.id || "root";
let expanded = loadExpanded(); // collapsed by default

function applyRemote(next) {
  data = next;
  if (!findNode(data.root, selectedId)) {
    selectedId = data.root.children[0]?.id || "root";
  }
  renderAll();
}

// ---------- Sidebar drawer toggle ----------
const treeToggleBtn = document.getElementById("treeToggleBtn");
const overlay = document.getElementById("overlay");

function closeSidebar() { document.body.classList.remove("sidebar-open"); }
function toggleSidebar() { document.body.classList.toggle("sidebar-open"); }

treeToggleBtn?.addEventListener("click", toggleSidebar);
overlay?.addEventListener("click", closeSidebar);
window.addEventListener("resize", () => {
  if (window.innerWidth > 720) closeSidebar();
});

// ---------- Lightbox ----------
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");

function openLightbox(src, caption = "") {
  lightboxImg.src = src;
  lightboxCaption.textContent = caption;
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}

lightbox.addEventListener("click", () => {
  lightbox.classList.remove("open");
  lightboxImg.src = "";
  document.body.style.overflow = "";
});


// ---------- Floating Page Switcher (optional; safe if missing) ----------
const pageFab = document.getElementById("pageFab");
const pageFabBtn = document.getElementById("pageFabBtn");
const pageFabBackdrop = document.getElementById("pageFabBackdrop");
const fabUserLink = document.getElementById("fabUserLink");
const fabAdminLink = document.getElementById("fabAdminLink");

if (pageFab && pageFabBtn && pageFabBackdrop) {
  const path = location.pathname.toLowerCase();
const isAdminPage = path === "/admin" || path.endsWith("/admin/") || path.endsWith("/admin.html");

if (isAdminPage) {
  fabAdminLink && (fabAdminLink.style.opacity = "0.55");
  fabAdminLink && (fabAdminLink.style.pointerEvents = "none");
} else {
  fabUserLink && (fabUserLink.style.opacity = "0.55");
  fabUserLink && (fabUserLink.style.pointerEvents = "none");
}



  function closeFab() { pageFab.classList.remove("open"); }
  function toggleFab() { pageFab.classList.toggle("open"); }

  pageFabBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFab();
  });

  pageFabBackdrop.addEventListener("click", () => closeFab());

  document.addEventListener("click", (e) => {
    if (!pageFab.contains(e.target)) closeFab();
  });

  fabUserLink?.addEventListener("click", closeFab);
  fabAdminLink?.addEventListener("click", closeFab);
}

const elTree = document.getElementById("tree");
const elUpdatedAt = document.getElementById("updatedAt");
const elGallery = document.getElementById("gallery");
const elImgHint = document.getElementById("imgHint");

function loadExpanded() {
  try {
    const raw = localStorage.getItem(EXPANDED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveExpanded() {
  localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]));
}

function fmtUpdated() {
  if (!elUpdatedAt) return;
  elUpdatedAt.textContent = new Date(data.updatedAt).toLocaleString();
}

function renderSidebarTree() {
  if (!elTree) return;

  elTree.innerHTML = "";
  fmtUpdated();

  for (const child of data.root.children) {
    renderNodeRow(child, 0);
  }
}

function renderNodeRow(node, depth) {
  const row = document.createElement("div");
  row.className = "tree-item" + (node.id === selectedId ? " selected" : "");
  row.style.marginLeft = (depth * 12) + "px";

  const left = document.createElement("div");
  left.className = "left";

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = node.name;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${(node.children || []).length} child`;

  left.appendChild(name);
  left.appendChild(meta);

  const right = document.createElement("div");
  right.className = "badge";
  right.textContent = `${countDescendants(node)} under`;

  row.appendChild(left);
  row.appendChild(right);

  // click row: select + toggle expand/collapse 
  row.addEventListener("click", () => {
    selectedId = node.id;

    if ((node.children || []).length > 0) {
      if (expanded.has(node.id)) expanded.delete(node.id);
      else expanded.add(node.id);
      saveExpanded();
    }

    renderAll();
  });

  elTree.appendChild(row);

  if ((node.children || []).length > 0 && expanded.has(node.id)) {
    for (const c of node.children) renderNodeRow(c, depth + 1);
  }
}

function renderImagesOnly() {
  if (!elGallery) return;

  const found = findNode(data.root, selectedId);
  if (!found) return;

  const node = found.node;

  elGallery.innerHTML = "";
  const imgs = node.images || [];

  if (elImgHint) {
    elImgHint.textContent = imgs.length ? "" : "No images on this category.";
  }

  imgs.forEach((img) => {
    const card = document.createElement("div");
    card.className = "card";

    const image = document.createElement("img");
    image.src = img.url || img.dataUrl || "";
    image.alt = img.name || "image";
    image.style.cursor = "zoom-in";
    image.addEventListener("click", () => {
      openLightbox(img.url || img.dataUrl || "", img.name || "");
    });



    const cap = document.createElement("div");
    cap.className = "cap";
    cap.innerHTML = `<span>${img.name || "image"}</span><span></span>`;

    card.appendChild(image);
    card.appendChild(cap);
    elGallery.appendChild(card);
  });
}

function renderAll() {
  data = loadData();
  renderSidebarTree();
  renderImagesOnly();
}

syncFromRemote(applyRemote);
setInterval(() => syncFromRemote(applyRemote), 15000);

renderAll();
