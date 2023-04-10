import express from "express";
import {
  commentPost,
  deletePostComment,
  editPostComment,
  getCommentLikesCount,
  getPostComments,
  isCommentLiked,
  likePostComment,
} from "../controllers/postComments";
import { protect } from "../utils/protect";

const router = express.Router();

router.post("/commentPost/:id", protect, commentPost);

router.delete("/deletePostComment/:id", protect, deletePostComment);

router.put("/editPostComment/:id", protect, editPostComment);

router.get("/likePostComment/:id", protect, likePostComment);

router.get("/getPostComments/:id", protect, getPostComments);

router.get("/getCommentLikesCount/:id", protect, getCommentLikesCount);

router.get("/isCommentLiked/:id", protect, isCommentLiked);

export default router;
