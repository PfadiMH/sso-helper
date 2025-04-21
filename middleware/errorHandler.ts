import { NextFunction, Request, Response } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(
    `[${new Date().toISOString()}] An unhandled error occurred:`,
    err.stack || err
  );
  if (!res.headersSent) {
    res
      .status(500)
      .send("Internal Server Error: An unexpected error occurred!");
  }
};
