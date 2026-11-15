import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
      methods: ["GET", "POST", "PATCH"]
    }
  });
  io.on("connection", socket => {
    console.log("Dashboard connected:", socket.id);
    socket.on("disconnect", () => console.log("Dashboard disconnected:", socket.id));
  });
  return io;
}

export function emitEvent(event: string, payload: unknown): void {
  if (io) io.emit(event, payload);
}
