const prisma = require("./prisma");

function genId(prefix) {
  return (
    prefix +
    "-" +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

// Simple in-memory cache for heavy-read endpoints
const CATEGORY_CACHE_TTL_MS = Number(process.env.CATEGORY_CACHE_TTL_MS || 10000); // 10s default

let allCategoriesCache = null;
let allCategoriesCacheAt = 0;
const searchCache = new Map(); // key: search term, value: { at, data }

function isFresh(ts) {
  return ts && Date.now() - ts < CATEGORY_CACHE_TTL_MS;
}

function invalidateCategoryCaches() {
  allCategoriesCache = null;
  allCategoriesCacheAt = 0;
  searchCache.clear();
}

// Create category
async function createCategory(dto) {
  if (!dto.name) {
    throw new Error("Category name is required");
  }

  // default active = true
  let active = true;

  // allow either boolean `active` or string status "active"/"not"
  if (typeof dto.active === "boolean") {
    active = dto.active;
  } else if (dto.status) {
    const status = String(dto.status).toLowerCase();
    if (status === "active") active = true;
    else if (status === "not") active = false;
  }

  const category = await prisma.category.create({
    data: {
      name: dto.name,
      description: dto.description || null,
      active,
    },
  });

  invalidateCategoryCaches();
  return category;
}

// List all categories (with cache)
async function listCategories() {
  if (allCategoriesCache && isFresh(allCategoriesCacheAt)) {
    return allCategoriesCache;
  }

  const data = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  allCategoriesCache = data;
  allCategoriesCacheAt = Date.now();
  return data;
}

// 🔍 Search categories by name (with cache)
async function searchCategoriesByName(name) {
  const term = String(name || "").trim();
  if (!term) return [];

  const key = term.toLowerCase();
  const cached = searchCache.get(key);
  if (cached && isFresh(cached.at)) {
    return cached.data;
  }

  const data = await prisma.category.findMany({
    where: {
      name: {
        contains: term,
        mode: "insensitive",
      },
    },
    orderBy: { name: "asc" },
  });

  searchCache.set(key, { at: Date.now(), data });
  return data;
}

// Get category by id
async function getCategory(id) {
  return prisma.category.findUnique({
    where: { id },
  });
}

// Update category (name / description / status)
async function updateCategory(id, dto) {
  const data = {};

  if (dto.name !== undefined) data.name = dto.name;
  if (dto.description !== undefined) data.description = dto.description;

  if (dto.active !== undefined) {
    data.active = !!dto.active;
  } else if (dto.status) {
    const status = String(dto.status).toLowerCase();
    if (status === "active") data.active = true;
    else if (status === "not") data.active = false;
  }

  const category = await prisma.category.update({
    where: { id },
    data,
  });

  invalidateCategoryCaches();
  return category;
}

// Update only status using "active" or "not"
async function updateCategoryStatus(id, status) {
  const normalized = String(status).toLowerCase();
  const active = normalized === "active";

  const category = await prisma.category.update({
    where: { id },
    data: { active },
  });

  invalidateCategoryCaches();
  return category;
}

// Delete category
async function deleteCategory(id) {
  const deleted = await prisma.category.delete({
    where: { id },
  });

  invalidateCategoryCaches();
  return deleted;
}

module.exports = {
  createCategory,
  listCategories,
  searchCategoriesByName,
  getCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
};
