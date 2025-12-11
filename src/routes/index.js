const catalog = require("../catalogService");

module.exports = function(app) {

  // Series
  app.post("/api/v1/series", async (req, res) => {
    try {
      const data = await catalog.createSeries(req.body || {});
      res.json({ success: true, message: "Series created", data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.get("/api/v1/series", async (req, res) => {
    const data = await catalog.listSeries();
    res.json({ success: true, message: "Series list", data });
  });

  app.get("/api/v1/series/:id", async (req, res) => {
    const data = await catalog.getSeries(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Series not found" });
    res.json({ success: true, message: "Series", data });
  });

  // Episodes
  app.post("/api/v1/episodes", async (req, res) => {
    try {
      const data = await catalog.createEpisode(req.body || {});
      res.json({ success: true, message: "Episode created", data });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.get("/api/v1/episodes/series/:seriesId", async (req, res) => {
    const data = await catalog.listEpisodesBySeries(req.params.seriesId);
    res.json({ success: true, message: "Episodes by series", data });
  });

  // Explore feed
  app.get("/api/v1/explore/feed", async (req, res) => {
    const language = req.query.language || "hi";
    const size = Math.max(1, Math.min(100, parseInt(req.query.size || "20", 10) || 20));

    await catalog.seedDummyIfEmpty();
    const data = await catalog.exploreFeed(language, size);

    res.json({ success: true, message: "Explore feed", data });
  });
};
