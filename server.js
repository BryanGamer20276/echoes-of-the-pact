// server.js
const express = require("express");
const path = require("path");
const routes = require("./src/routes");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", routes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Echoes of the Pact corriendo en http://localhost:${PORT}`);
});
