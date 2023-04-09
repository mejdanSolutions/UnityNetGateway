import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import query from "../db";

const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user?.id;
  const receiverId = req.params.receiverId;
  const postId = req.params.postId;
  const { type } = req.body;

  let q =
    "INSERT INTO notifications (`sender_id`, `receiver_id`, `type`, `post_id`) VALUES (?, ?, ?, ?)";

  let data = await query(q, [senderId, receiverId, type, postId]);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Notification created");
});

const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const receiverId = req.user?.id;

  let q =
    "SELECT u.id, u.first_name, u.last_name, u.image, n.type, n.created_at,n.id as notification_id,n.post_id FROM users u INNER JOIN notifications n ON u.id=n.sender_id WHERE n.receiver_id=?";

  let data = await query(q, [receiverId]);

  res.status(200).json(data);
});

const getNotificationsCount = asyncHandler(
  async (req: Request, res: Response) => {}
);

export { createNotification, getNotifications };
