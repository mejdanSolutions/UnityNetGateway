import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import query from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    res.status(400);
    throw new Error("All fields must be filled");
  }
  let q = "SELECT `id` FROM users WHERE `email`= ?";

  let result = await query(q, [email]);

  if (result.length > 0) {
    res.status(400);
    throw new Error("User with this email already exists");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password has to be 6 characters min");
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  q =
    "INSERT INTO users (`first_name`,`last_name`,`email`,`password`) VALUES (?, ?, ?, ?)";
  const values = [firstName, lastName, email, hash];
  let r = await query(q, values);
  if (r.affectedRows == 1) {
    res.status(200).json("User successfully registered");
  }
});

const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All fields must be filled");
  }
  //Find user by email
  let q = "SELECT `id`,`password` FROM users WHERE `email` = ?";

  let data = await query(q, [email]);

  if (data.length === 0) {
    res.status(400);
    throw new Error("Email or password is not valid");
  }

  const isPasswordCorrect = bcrypt.compareSync(password, data[0].password);

  if (!isPasswordCorrect) {
    res.status(400);
    throw new Error("Email or password is not valid");
  }

  const token = jwt.sign({ id: data[0].id }, process.env.JWT_SECRET!);

  res
    .cookie("access_token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .json(token);
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  res
    .clearCookie("access_token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .json("successfully logged out");
});

const getLoginStatus = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.access_token;

  if (!token) {
    res.status(400);
    throw new Error("Not authorized");
  }

  let verified = jwt.verify(token, process.env.JWT_SECRET);

  if (verified) {
    res.json({ status: true, token: token });
  } else {
    res.json({ status: false });
  }
});

export { register, login, logout, getLoginStatus };
