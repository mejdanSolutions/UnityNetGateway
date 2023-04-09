import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import query from "../db";

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.params.senderId;
  const conversationId = req.params.conversationId;

  const { message } = req.body;

  let q =
    "INSERT INTO messages (conversation_id, sender_id, message) VALUES (?,?,?)";

  let data = await query(q, [conversationId, senderId, message]);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Message sent");
});

const getMessages = asyncHandler(async (req: Request, res: Response) => {
  // const loggedUser = req.params.senderId;
  // const otherUser = req.params.receiverId;
  const conversationId = req.params.conversationId;

  // let q =
  //   "SELECT `sender_id` AS id,`receiver_id` AS anotherUserId,`message`,`created_at` FROM messages WHERE `sender_id`= ? AND `receiver_id`=? UNION SELECT `sender_id`,`receiver_id` AS anotherUserId,`message`,`created_at` FROM messages WHERE `sender_id`=? AND `receiver_id`=? ORDER BY created_at ASC";

  let q =
    "SELECT `id`,`conversation_id`,`sender_id`,`message`,`created_at`,`seen_at` FROM messages WHERE `conversation_id`=? ORDER BY created_at ASC";

  let data = await query(q, [conversationId]);

  // let data = await query(q, [loggedUser, otherUser, otherUser, loggedUser]);

  res.status(200).json(data);
});

// const getLastMessages = asyncHandler(async (req: Request, res: Response) => {
//   // const conversationId = req.params.conversationId;

//   let q =
//     "SELECT `id`, `conversation_id`,`sender_id`, `message`, `created_at`,`seen_at` FROM messages WHERE id IN (SELECT max(`id`) FROM messages GROUP BY `conversation_id`)";

//   let data = await query(q, []);

//   res.json(data);
// });

const markMessageAsSeen = asyncHandler(async (req: Request, res: Response) => {
  const messageId = req.params.id;

  let q = "UPDATE messages SET `seen_at` = NOW() WHERE `id`= ?";

  await query(q, [messageId]);

  q =
    "SELECT `id`,`conversation_id`,`sender_id`,`message`,`created_at`,`seen_at` FROM messages WHERE `id`= ?";

  let data = await query(q, [messageId]);

  res.status(200).json(data[0]);
});

export { sendMessage, getMessages, markMessageAsSeen };
