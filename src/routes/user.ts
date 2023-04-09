import express from "express";
import {
  deleteProfilePhoto,
  getLoggedUserInfo,
  getUserConversations,
  getUserCoverPhotos,
  getUserFriends,
  getUserInfo,
  getUserProfilePhotos,
  getUsersByLikes,
  getUsersByPhotoLikes,
  searchUsers,
  uploadCoverPicture,
  uploadProfilePicture,
} from "../controllers/user";
import { protect } from "../utils/protect";
import { upload } from "../utils/upload";

const router = express.Router();

router.get("/getLoggedUserInfo", protect, getLoggedUserInfo);

router.put(
  "/uploadProfilePicture",
  protect,
  upload.single("photo"),
  uploadProfilePicture
);

router.put(
  "/uploadCoverPicture",
  protect,
  upload.single("photo"),
  uploadCoverPicture
);

router.get("/getUserConversations", protect, getUserConversations);

router.get("/searchUsers", searchUsers);

router.get("/getUserInfo/:id", protect, getUserInfo);

router.get("/getUsersByLikes/:id", protect, getUsersByLikes);

router.get("/getUserFriends/:id", getUserFriends);

router.get("/getUsersByPhotoLikes/:id", getUsersByPhotoLikes);

router.get("/getUserProfilePhotos/:id", getUserProfilePhotos);

router.get("/getUserCoverPhotos/:id", getUserCoverPhotos);

router.delete("/deleteProfilePhoto/:id", deleteProfilePhoto);

export default router;
