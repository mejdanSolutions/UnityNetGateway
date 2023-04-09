import express from "express";
import {
  createNotification,
  getNotifications,
} from "../controllers/notification";
import { protect } from "../utils/protect";

const router = express.Router();

router.get("/getNotifications", protect, getNotifications);

router.post(
  "/createNotification/:receiverId/:postId",
  protect,
  createNotification
);

export default router;
