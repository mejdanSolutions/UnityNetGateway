import { Request, Response, NextFunction } from "express";

const errorHandler = async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = req.statusCode ? req.statusCode : 500;

  res.status(statusCode);

  res.json({
    message: err.message,
  });
};

export default errorHandler;
