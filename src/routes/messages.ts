import express from "express";
import {
  getMessages,
  getUserConversations,
  markMessageAsSeen,
  sendMessage,
} from "../controllers/messages";
import { protect } from "../utils/protect";
const router = express.Router();

router.get("/getUserConversations", protect, getUserConversations);

router.put("/markMessageAsSeen/:id", markMessageAsSeen);

router.post("/sendMessage/:senderId/:conversationId", sendMessage);

// router.get("/getMessages/:senderId/:receiverId", getMessages);

router.get("/getMessages/:conversationId", getMessages);

// router.get("/getLastMessages", getLastMessages);

export default router;
