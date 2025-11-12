import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import http from "http";

const PORT = process.env.PORT || 3000;

const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  const server = http.createServer(app);

  server.maxConnections = 50;
  server.timeout = 60000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  server.listen(PORT, () => {
  });
}

export default app;
