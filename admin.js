import {
  loadData, saveData, resetData,
  findNode, countDescendants, removeNodeById,
  fileToDataUrl
} from "./app.js";

const EXPANDED_KEY_ADMIN = "maintenanceHubExpanded_admin_v1";

let data = loadData();
let selectedId = data.root.children[0]?.id || "root";
let expanded = loadExpanded(); // collapsed by default

// Sidebar drawer toggle (mobile)
const treeToggleBtn = document.getElementById("treeToggleBtn");
const overlay = document.getElementById("overlay");

function closeSidebar() { document.body.classList.remove("sidebar-open"); }
function toggleSidebar() { document.body.classList.toggle("sidebar-open"); }

treeToggleBtn?.addEventListener("click", toggleSidebar);
overlay?.addEventListener("click", closeSidebar);
window.addEventListener("resize", () => { if (window.innerWidth > 720) closeSidebar(); });

// Lightbox
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


// DOM
const elAddMasterInput = document.getElementById("addMasterInput");
const elTree = document.getElementById("tree");
const elUpdatedAt = document.getElementById("updatedAt");
const elSelectedPath = document.getElementById("selectedPath");
const elRenameInput = document.getElementById("renameInput");
const elAddChildInput = document.getElementById("addChildInput");
const elGallery = document.getElementById("gallery");
const elImgInput = document.getElementById("imgInput");

// ---------- Floating Page Switcher ----------
const pageFab = document.getElementById("pageFab");
const pageFabBtn = document.getElementById("pageFabBtn");
const pageFabBackdrop = document.getElementById("pageFabBackdrop");
const fabUserLink = document.getElementById("fabUserLink");
const fabAdminLink = document.getElementById("fabAdminLink");

// Highlight current page + disable clicking it
const isAdminPage = location.pathname.toLowerCase().includes("admin.html");
if (isAdminPage) {
  fabAdminLink.style.opacity = "0.55";
  fabAdminLink.style.pointerEvents = "none";
} else {
  fabUserLink.style.opacity = "0.55";
  fabUserLink.style.pointerEvents = "none";
}

function closeFab() {
  pageFab.classList.remove("open");
}
function toggleFab() {
  pageFab.classList.toggle("open");
}

pageFabBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleFab();
});

pageFabBackdrop?.addEventListener("click", closeFab);

// Close if user taps anywhere else
document.addEventListener("click", (e) => {
  if (!pageFab.contains(e.target)) closeFab();
});

// Optional: close after picking a link (nice on mobile)
fabUserLink?.addEventListener("click", closeFab);
fabAdminLink?.addEventListener("click", closeFab);


function loadExpanded() {
  try {
    const raw = localStorage.getItem(EXPANDED_KEY_ADMIN);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveExpanded() {
  localStorage.setItem(EXPANDED_KEY_ADMIN, JSON.stringify([...expanded]));
}

function fmtUpdated() {
  elUpdatedAt.textContent = new Date(data.updatedAt).toLocaleString();
}

function pathText(path) {
  return path.map(n => n.name).join(" → ");
}

function renderTree() {
  elTree.innerHTML = "";
  fmtUpdated();
  for (const child of data.root.children) renderNodeRow(child, 0);
  renderSelectedPanel();
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
  const kids = (node.children || []).length;
  const imgs = (node.images || []).length;
  meta.textContent = `(${kids} child, ${imgs} img)`;

  left.appendChild(name);
  left.appendChild(meta);

  const right = document.createElement("div");
  right.className = "badge";
  right.textContent = `${countDescendants(node)} under`;

  row.appendChild(left);
  row.appendChild(right);

  // Click row: select + toggle expand/collapse (NO auto close of sidebar)
  row.addEventListener("click", () => {
    selectedId = node.id;

    if ((node.children || []).length > 0) {
      if (expanded.has(node.id)) expanded.delete(node.id);
      else expanded.add(node.id);
      saveExpanded();
    }

    renderTree();
  });

  elTree.appendChild(row);

  if ((node.children || []).length > 0 && expanded.has(node.id)) {
    for (const c of node.children || []) renderNodeRow(c, depth + 1);
  }
}

function renderSelectedPanel() {
  const found = findNode(data.root, selectedId);
  if (!found) return;

  const { node, path } = found;

  elSelectedPath.textContent = pathText(path);
  elRenameInput.value = node.name;

  // Gallery
  elGallery.innerHTML = "";
  const imgs = node.images || [];
  if (imgs.length === 0) {
    const p = document.createElement("div");
    p.className = "small";
    p.textContent = "No images on this node.";
    elGallery.appendChild(p);
    return;
  }

  imgs.forEach((img, idx) => {
    const card = document.createElement("div");
    card.className = "card";

    const image = document.createElement("img");
    image.src = img.dataUrl;
    image.alt = img.name || "image";
    image.style.cursor = "zoom-in";
    image.addEventListener("click", () => openLightbox(img.dataUrl, img.name || ""));

    const cap = document.createElement("div");
    cap.className = "cap";

    const left = document.createElement("span");
    left.textContent = img.name || "image";

    const del = document.createElement("button");
    del.textContent = "Remove";
    del.className = "danger";
    del.style.padding = "6px 8px";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      node.images.splice(idx, 1);
      saveData(data);
      data = loadData();
      renderTree();
    });

    cap.appendChild(left);
    cap.appendChild(del);

    card.appendChild(image);
    card.appendChild(cap);
    elGallery.appendChild(card);
  });
}

// Buttons
document.getElementById("addMasterBtn").addEventListener("click", () => {
  const name = (elAddMasterInput?.value || "").trim();
  if (!name) return;

  data.root.children = data.root.children || [];
  const newNode = {
    id: (Math.random().toString(36).slice(2, 10) + Date.now().toString(36)),
    name,
    images: [],
    children: []
  };

  data.root.children.push(newNode);

  // Optional: auto-select the new master category
  selectedId = newNode.id;

  // Optional: auto-expand it (won't matter until it has children)
  expanded.add(newNode.id);
  saveExpanded();

  if (elAddMasterInput) elAddMasterInput.value = "";

  saveData(data);
  data = loadData();
  renderTree();
});


document.getElementById("renameBtn").addEventListener("click", () => {
  const found = findNode(data.root, selectedId);
  if (!found) return;

  const name = elRenameInput.value.trim();
  if (!name) return;

  found.node.name = name;
  saveData(data);
  data = loadData();
  renderTree();
});

document.getElementById("addChildBtn").addEventListener("click", () => {
  const found = findNode(data.root, selectedId);
  if (!found) return;

  const name = elAddChildInput.value.trim();
  if (!name) return;

  found.node.children = found.node.children || [];
  found.node.children.push({
    id: (Math.random().toString(36).slice(2, 10) + Date.now().toString(36)),
    name,
    images: [],
    children: []
  });

  // expand parent so the new child is visible
  expanded.add(found.node.id);
  saveExpanded();

  elAddChildInput.value = "";
  saveData(data);
  data = loadData();
  renderTree();
});

document.getElementById("deleteBtn").addEventListener("click", () => {
  if (selectedId === "root") return;

  removeNodeById(data.root, selectedId);
  selectedId = data.root.children[0]?.id || "root";

  saveData(data);
  data = loadData();
  renderTree();
});

document.getElementById("addImagesBtn").addEventListener("click", async () => {
  const found = findNode(data.root, selectedId);
  if (!found) return;

  const files = Array.from(elImgInput.files || []);
  if (files.length === 0) return;

  found.node.images = found.node.images || [];
  for (const f of files) {
    const dataUrl = await fileToDataUrl(f);
    found.node.images.push({
      id: crypto.randomUUID?.() || String(Date.now()),
      name: f.name,
      dataUrl
    });
  }

  elImgInput.value = "";
  saveData(data);
  data = loadData();
  renderTree();
});

document.getElementById("clearImagesBtn").addEventListener("click", () => {
  const found = findNode(data.root, selectedId);
  if (!found) return;

  found.node.images = [];
  saveData(data);
  data = loadData();
  renderTree();
});

// document.getElementById("resetBtn").addEventListener("click", () => {
//   data = resetData();
//   selectedId = data.root.children[0]?.id || "root";
//   expanded = new Set();
//   localStorage.removeItem(EXPANDED_KEY_ADMIN);
//   renderTree();
// });

renderTree();
