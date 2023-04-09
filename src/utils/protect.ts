import asyncHandler from "express-async-handler";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import query from "../db";

interface ItokenPayload {
  id: string;
}

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.access_token;

    if (!token) {
      res.status(400);
      throw new Error("Not verified");
    }

    let verified = jwt.verify(token, process.env.JWT_SECRET!) as ItokenPayload;

    if (verified) {
      const userId = verified.id;

      let q =
        "SELECT `id`, `first_name`, `last_name`, `email`, `image` FROM users WHERE `id` = ?";
      let value = [userId];

      let userData = await query(q, value);

      req.user = userData[0];

      next();
    }
  }
);
