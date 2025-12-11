const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

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

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log("[catalog-service] running on port", PORT);
});
