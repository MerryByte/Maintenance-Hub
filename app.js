

const STORE_KEY = "maintenanceHubData_v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function defaultData() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    root: {
      id: "root",
      name: "Maintenance Hub",
      images: [],
      children: [
        {
          id: uid(),
          name: "Excavator",
          images: [],
          children: [
            {
              id: uid(),
              name: "Caterpillar",
              images: [],
              children: [
                {
                  id: uid(),
                  name: "336",
                  images: [],
                  children: [
                    { id: uid(), name: "Engine", images: [], children: [] }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: uid(),
          name: "Dozer",
          images: [],
          children: [
            {
              id: uid(),
              name: "Caterpillar",
              images: [],
              children: [
                {
                  id: uid(),
                  name: "D6",
                  images: [],
                  children: [
                    { id: uid(), name: "Engine", images: [], children: [] }
                  ]
                }
              ]
            },
            {
              id: uid(),
              name: "Komatsu",
              images: [],
              children: [
                {
                  id: uid(),
                  name: "D61",
                  images: [],
                  children: [
                    { id: uid(), name: "Engine", images: [], children: [] }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seed = defaultData();
      localStorage.setItem(STORE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.root) throw new Error("Bad data");
    return parsed;
  } catch {
    const seed = defaultData();
    localStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveData(data) {
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

export function resetData() {
  const seed = defaultData();
  localStorage.setItem(STORE_KEY, JSON.stringify(seed));
  return seed;
}

export function findNode(root, id, path = []) {
  if (!root) return null;
  const nextPath = [...path, root];
  if (root.id === id) return { node: root, path: nextPath };

  for (const child of root.children || []) {
    const found = findNode(child, id, nextPath);
    if (found) return found;
  }
  return null;
}

export function countDescendants(node) {
  let count = 0;
  for (const c of node.children || []) {
    count += 1 + countDescendants(c);
  }
  return count;
}

export function removeNodeById(parent, id) {
  if (!parent?.children) return false;
  const idx = parent.children.findIndex(c => c.id === id);
  if (idx !== -1) {
    parent.children.splice(idx, 1);
    return true;
  }
  for (const c of parent.children) {
    if (removeNodeById(c, id)) return true;
  }
  return false;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
