import express from "express";
import {
  acceptFriendRequest,
  checkFriendRequestStatus,
  checkFriendsStatus,
  getFriendRequests,
  getFriendRequestsCount,
  rejectFriendRequest,
  removeFromFriends,
  sendFriendRequest,
} from "../controllers/friends";
import { protect } from "../utils/protect";

const router = express.Router();

router.get("/getFriendRequests", protect, getFriendRequests);

router.get("/checkFriendsStatus/:id", protect, checkFriendsStatus);

router.get("/getFriendRequestsCount", protect, getFriendRequestsCount);

router.delete("/rejectFriendRequest/:senderId", protect, rejectFriendRequest);

router.get("/checkFriendRequestStatus/:id", protect, checkFriendRequestStatus);

router.get("/sendFriendRequest/:id", protect, sendFriendRequest);

router.get("/acceptFriendRequest/:id", protect, acceptFriendRequest);

router.get("/removeFromFriends/:id", protect, removeFromFriends);

export default router;
