import express from "express";
import {
  addPhoto,
  createPost,
  deletePost,
  editPost,
  getPost,
  getPostCommentsCount,
  getPostLikesCount,
  getPosts,
  getSharedPost,
  getSharesCount,
  getUserPosts,
  isPostLiked,
  isPostShared,
  likePost,
  sharePost,
} from "../controllers/post";
import { protect } from "../utils/protect";
import { upload } from "../utils/upload";

const router = express.Router();

router.post("/createPost", protect, createPost);

router.post("/addPhoto", protect, upload.single("photo"), addPhoto);

router.get("/getPosts/:page", protect, getPosts);

router.get("/getSharesCount/:id", getSharesCount);

router.get("/getPostCommentsCount/:id", protect, getPostCommentsCount);

router.get("/getPostLikesCount/:id", protect, getPostLikesCount);

router.get("/getPost/:id", getPost);

router.get("/getUserPosts/:id/:page", protect, getUserPosts);

router.get("/isPostLiked/:id", protect, isPostLiked);

router.put("/deletePost/:id", protect, deletePost);

router.put("/editPost/:id", protect, editPost);

router.get("/likePost/:id", protect, likePost);

router.post("/sharePost/:id", protect, sharePost);

router.get("/isPostShared/:id", isPostShared);

router.get("/getSharedPost/:id", protect, getSharedPost);

export default router;
