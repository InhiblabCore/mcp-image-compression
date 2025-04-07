import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 9003;

// 静态资源服务
app.use(express.static(join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.js"));
});

// add health router
app.get("/health", (res) => {
  res.send("ok");
});

// start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
