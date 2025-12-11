const cluster = require("cluster");
const os = require("os");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const PORT = process.env.PORT || 8081;

// Wrap app setup in a function so we can run it in each worker
function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "catalog-service" });
  });

  // Service-specific routes will be mounted here.
  require("./routes")(app);

  app.use("/", express.static(path.join(__dirname, "..", "public")));

  return app;
}

if (cluster.isPrimary) {
  const numCPUs = Number(process.env.WEB_CONCURRENCY) || os.cpus().length;

  console.log(
    `[catalog-service] primary ${process.pid} starting ${numCPUs} workers`
  );

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `[catalog-service] worker ${worker.process.pid} died (${signal || code}). Spawning a new worker...`
    );
    // Auto-restart worker for resilience
    cluster.fork();
  });
} else {
  const app = createApp();

  app.listen(PORT, () => {
    console.log("[catalog-service] running on port", PORT, "pid", process.pid);
  });
}
