import express from "express";
import {
  createNotification,
  getNotifications,
  getNotificationsCount,
  markNotificationAsRead,
} from "../controllers/notification";
import { protect } from "../utils/protect";

const router = express.Router();

router.get("/getNotifications", protect, getNotifications);

router.get("/getNotificationsCount", protect, getNotificationsCount);

router.put("/markNotificationAsRead", protect, markNotificationAsRead);

router.post(
  "/createNotification/:receiverId/:postId",
  protect,
  createNotification
);

export default router;
