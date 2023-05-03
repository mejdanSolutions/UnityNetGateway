import express from "express";
import {
  editUserInfo,
  getLoggedUserInfo,
  getUserFriends,
  getUserInfo,
  getUsersByLikes,
  getUsersByShares,
  searchUsers,
} from "../controllers/user";
import { protect } from "../utils/protect";
import { upload } from "../utils/upload";

const router = express.Router();

router.get("/getLoggedUserInfo", protect, getLoggedUserInfo);

router.get("/searchUsers", searchUsers);

router.get("/searchSuggestions", searchUsers);

router.put("/editUserInfo", protect, editUserInfo);

router.get("/getUserInfo/:id", protect, getUserInfo);

router.get("/getUsersByLikes/:id", protect, getUsersByLikes);

router.get("/getUsersByShares/:id", getUsersByShares);

router.get("/getUserFriends/:id", getUserFriends);

export default router;
