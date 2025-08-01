import express from "express";
import cors from "cors";
import { startPing, getStats, setTarget, getTarget } from "./pingWorker.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/data", (req, res) => {
  res.json(getStats());
});

app.get("/target", (req, res) => {
  res.json({ target: getTarget() });
});

app.post("/target", (req, res) => {
  const { target } = req.body;
  if (typeof target !== "string" || target.trim() === "") {
    return res.status(400).json({ error: "Invalid target" });
  }
  setTarget(target.trim());
  res.json({ success: true, target });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  startPing();
});
