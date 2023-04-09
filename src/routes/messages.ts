import express from "express";
import {
  getMessages,
  markMessageAsSeen,
  sendMessage,
} from "../controllers/messages";

const router = express.Router();

router.put("/markMessageAsSeen/:id", markMessageAsSeen);

router.post("/sendMessage/:senderId/:conversationId", sendMessage);

// router.get("/getMessages/:senderId/:receiverId", getMessages);

router.get("/getMessages/:conversationId", getMessages);

// router.get("/getLastMessages", getLastMessages);

export default router;
