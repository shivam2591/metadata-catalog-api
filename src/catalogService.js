const prisma = require("./prisma");

function genId(prefix) {
  return (
    prefix +
    "-" +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
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

  return prisma.category.create({
    data: {
      name: dto.name,
      description: dto.description || null,
      active,
    },
  });
}

// List all categories
async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
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

  return prisma.category.update({
    where: { id },
    data,
  });
}

// Update only status using "active" or "not"
async function updateCategoryStatus(id, status) {
  const normalized = String(status).toLowerCase();
  const active = normalized === "active";
  return prisma.category.update({
    where: { id },
    data: { active },
  });
}

// Delete category
async function deleteCategory(id) {
  return prisma.category.delete({
    where: { id },
  });
}

module.exports = {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory,
};
