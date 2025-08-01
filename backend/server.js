import express from "express";
import cors from "cors";
import { startPing, getStats } from "./pingWorker.js";

const app = express();
const PORT = 3001;

app.use(cors());

app.get("/data", (req, res) => {
  res.json(getStats());
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  startPing(); // begin background ping
});
