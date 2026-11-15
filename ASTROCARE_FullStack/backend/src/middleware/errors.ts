import { Request, Response, NextFunction } from "express";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);
  res.status(500).json({
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
  });
}
