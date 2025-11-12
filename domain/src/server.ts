// IMPORTANT: Load environment variables BEFORE any other imports
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import http from "http";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.maxConnections = 200; // Handle 200 simultaneous connections
server.timeout = 120000; // 2 minutes timeout
server.keepAliveTimeout = 65000; // 65 seconds (longer than default 5s)
server.headersTimeout = 66000; // Slightly longer than keepAliveTimeout

server.listen(PORT, () => {});
