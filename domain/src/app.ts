import express, { Application } from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import compression from "compression";

const app: Application = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  compression({
    level: 6,
    threshold: 1024,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", routes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Sunucu ayağa kalktı !",
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

export default app;
