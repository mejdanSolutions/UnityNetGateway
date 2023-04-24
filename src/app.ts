import * as dotenv from "dotenv";
dotenv.config();
import express, { Application, NextFunction } from "express";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import postRoutes from "./routes/post";
import photoRoutes from "./routes/photos";
import messageRoutes from "./routes/messages";
import notificationRoutes from "./routes/notification";
import postCommentRoutes from "./routes/postComments";
import friendRoutes from "./routes/friends";
import errorHandler from "./utils/errorHandler";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import BodyParser from "body-parser";
import * as Minio from "minio";
import { ClientOptions } from "minio";
import { FriendRequest, Seen, User } from "./types/custom";
import { Message } from "./types/custom";
import { Notification } from "./types/custom";
import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import query from "./db";

const app: Application = express();

const io = require("socket.io")(8000, {
  cors: {
    origin: process.env.FRONTEND_URL,
  },
});

io.use((socket: Socket, next: NextFunction) => {
  const token = socket.handshake.query.token!;

  jwt.verify(
    token as string,
    process.env.JWT_SECRET,
    (err: jwt.VerifyErrors | null, decoded: any) => {
      if (err) {
        return console.log(err);
      }
      socket.user = decoded.user;

      next();
    }
  );
});

let users = new Map<number, string>();

const addUser = (userId: number, socketId: string) => {
  // !users.some((user) => user.userId === userId) &&
  //   users.push({ userId, socketId });

  if (!users.has(userId)) {
    // users.set(userId, socketId);
    users.set(userId, socketId);
  }
};

const removeUser = (socketId: string) => {
  const userEntries = [...users.entries()];

  const usersEntriesFilterd = userEntries.filter(
    ([_, value]) => value !== socketId
  );

  users = new Map(usersEntriesFilterd);
};

const getUser = (userId: number) => {
  // return users.find((user) => user.userId === userId);
  return users.get(userId);
};

io.on("connection", (socket: any) => {
  // io.emit("welcome", "hello from socket server!");

  //take userId and socketId from user that connected
  socket.on("addUser", (userId: number) => {
    console.log("userId", userId);
    console.log("socketId", socket.id);
    addUser(userId, socket.id);
    io.emit("getUsers", Array.from(users.keys()));
  });

  //send message
  socket.on(
    "sendMessage",
    ({ sender_id, receiverId, message, conversationId }: Message) => {
      console.log(message);
      const userSocketId = getUser(receiverId);

      if (!userSocketId) return;

      io.to(userSocketId).emit("getMessage", {
        conversation_id: conversationId,
        sender_id: sender_id,
        receiverId,
        message,
      });
    }
  );

  //send friend request
  socket.on(
    "sendFriendRequest",
    async ({ senderId, receiverId }: FriendRequest) => {
      const userSocketId = getUser(receiverId);

      if (!userSocketId) return;

      let q =
        "SELECT `id`,`first_name`,`last_name`,`image` FROM users WHERE `id` = ?";

      let data = await query(q, [senderId]);

      io.to(userSocketId).emit("getFriendRequest", data[0]);
    }
  );

  //send information when user gets unfriended
  socket.on("removeFromFriends", (receiverId: number) => {
    const userSocketId = getUser(receiverId);

    if (!userSocketId) return;

    console.log("removeFromFriendsReceiverId", userSocketId);

    io.to(userSocketId).emit("removedFromFriends", true);
  });

  //send information that message was seen
  socket.on("emitSeen", (data: Seen) => {
    const userSocketId = getUser(data.receiver_id);

    if (!userSocketId) return;

    io.to(userSocketId).emit("getSeen", data);
  });

  //send notification
  socket.on("sendNotification", (notification: Notification) => {
    const userSocketId = getUser(notification.receiver_id);

    if (!userSocketId) return;

    console.log(notification);

    io.to(userSocketId).emit("getNotification", notification);
  });

  //when users disconnects
  socket.on("disconnect", () => {
    console.log("user disconnected");
    removeUser(socket.id);
    io.emit("getUsers", Array.from(users.keys()));
  });
});

export let minioClient = new Minio.Client({
  endPoint: "127.0.0.1",
  port: 9000,
  useSSL: false,
  accessKey: "7rFfAu4twAyPZfQJ",
  secretKey: "RvCg6e1V5JJwM8nr4NjnNCylz7nUbs3X",
});

app.use(BodyParser.json({ limit: "4mb" }));
app.use(errorHandler);
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

//routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", postCommentRoutes);
app.use("/api/followers", friendRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/photos", photoRoutes);

minioClient.bucketExists("social-media", function (error) {
  if (error) {
    throw new Error("MinIO error bucket dosent exist");
  }

  app.listen(process.env.PORT, () => {
    console.log("Server started on port :", process.env.PORT);
  });
});
