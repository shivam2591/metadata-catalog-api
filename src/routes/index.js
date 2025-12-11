const catalog = require("../catalogService");

module.exports = function (app) {
  // Create category
  app.post("/api/v1/categories", async (req, res) => {
    try {
      const data = await catalog.createCategory(req.body || {});
      res.json({ success: true, message: "Category created", data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // List all categories
  app.get("/api/v1/categories", async (req, res) => {
    try {
      const data = await catalog.listCategories();
      res.json({ success: true, message: "Category list", data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 🔍 Search categories by name
  app.get("/api/v1/categories/search", async (req, res) => {
    try {
      const name = (req.query.name || "").toString().trim();
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Query parameter 'name' is required",
        });
      }

      const data = await catalog.searchCategoriesByName(name);
      res.json({ success: true, message: "Category search results", data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Get single category by id
  app.get("/api/v1/categories/:id", async (req, res) => {
    try {
      const data = await catalog.getCategory(req.params.id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
      res.json({ success: true, message: "Category", data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Edit category (name / description / status)
  app.put("/api/v1/categories/:id", async (req, res) => {
    try {
      const data = await catalog.updateCategory(req.params.id, req.body || {});
      res.json({ success: true, message: "Category updated", data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Update only status (accepts "active" or "not")
  app.patch("/api/v1/categories/:id/status", async (req, res) => {
    try {
      const status =
        (req.body.status || req.query.status || "").toString().toLowerCase();

      if (!status || (status !== "active" && status !== "not")) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Use 'active' or 'not'.",
        });
      }

      const data = await catalog.updateCategoryStatus(req.params.id, status);
      res.json({ success: true, message: "Category status updated", data });
    } catch (err) {
      if (err.code === "P2025") {
        // Prisma: record not found
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Delete category
  app.delete("/api/v1/categories/:id", async (req, res) => {
    try {
      await catalog.deleteCategory(req.params.id);
      res.json({ success: true, message: "Category deleted" });
    } catch (err) {
      if (err.code === "P2025") {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
      res.status(400).json({ success: false, message: err.message });
    }
  });
};
