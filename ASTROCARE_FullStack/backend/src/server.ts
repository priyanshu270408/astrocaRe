import "dotenv/config";
import { createServer } from "http";
import app from "./app";
import { connectDatabase } from "./config/db";
import { initSocket } from "./config/socket";

async function start() {
  await connectDatabase();
  const server = createServer(app);
  initSocket(server);
  const port = Number(process.env.PORT || 5000);
  server.listen(port, "0.0.0.0", () => {
    console.log(`ASTROCARE API listening on http://localhost:${port}`);
  });
}

start().catch(error => {
  console.error("Failed to start ASTROCARE:", error);
  process.exit(1);
});
