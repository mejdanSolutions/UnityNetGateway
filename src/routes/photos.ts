import express from "express";
import {
  deleteProfilePhoto,
  getCoverPhotos,
  getProfilePhotos,
  uploadProfilePicture,
  uploadCoverPicture,
  getPhoto,
} from "../controllers/photos";
import { protect } from "../utils/protect";
import { upload } from "../utils/upload";

const router = express.Router();

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

router.get("/getPhoto/:userId/:photoId", getPhoto);

router.get("/getUserProfilePhotos/:id", getProfilePhotos);

router.get("/getUserCoverPhotos/:id", getCoverPhotos);

router.delete("/deleteProfilePhoto/:id", protect, deleteProfilePhoto);

export default router;
