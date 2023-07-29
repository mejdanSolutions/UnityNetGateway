import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import query from "../db";
import { minioClient } from "../app";

const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user?.id;
  const receiverId = req.params.receiverId;
  const postId = req.params.postId;

  const { type } = req.body;

  let q =
    "INSERT INTO notifications (`sender_id`, `receiver_id`, `type`, `post_id`) VALUES (?, ?, ?, ?)";
  let data = await query(q, [senderId, receiverId, type, postId || null]);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Notification created");
});

const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const receiverId = req.user?.id;

  let q = `SELECT u.id, u.first_name, u.last_name, u.image, n.type, n.created_at,n.id as notification_id,n.post_id FROM users u 
    INNER JOIN notifications n ON u.id=n.sender_id WHERE n.receiver_id=? ORDER BY created_at DESC`;

  let data = await query(q, [receiverId]);

  data.forEach((post: any) => {
    if (post.image) {
      minioClient.presignedUrl(
        "GET",
        "social-media",
        post.image,
        24 * 60 * 60,
        function (err: Error | null, presignedUrl: string) {
          if (!err) {
            post.image = presignedUrl;
          } else {
            console.log("Error generating minio url : ", err);
          }
        }
      );
    }
  });

  res.status(200).json(data);
});

const getNotificationsCount = asyncHandler(
  async (req: Request, res: Response) => {
    const receiverId = req.user?.id;

    let q =
      "SELECT COUNT(*) AS notifications_count FROM notifications WHERE receiver_id = ? AND `read` = false;";

    let data = await query(q, [receiverId]);

    res.status(200).json(data[0]);
  }
);

const markNotificationAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const receiverId = req.user?.id;

    let q =
      "UPDATE notifications SET `read` = true WHERE receiver_id = ? AND `read` = false";

    let data = await query(q, [receiverId]);

    res.status(200).json("Notifications marked as read!");
  }
);

export {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  getNotificationsCount,
};
