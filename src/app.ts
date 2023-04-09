import * as dotenv from "dotenv";
dotenv.config();
import express, { Application, NextFunction } from "express";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import postRoutes from "./routes/post";
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

let users: User[] = [];

const addUser = (userId: number, socketId: string) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId: string) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId: number) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket: any) => {
  // io.emit("welcome", "hello from socket server!");

  //take userId and socketId from user that connected
  socket.on("addUser", (userId: number) => {
    console.log("userId", userId);
    console.log("socketId", socket.id);
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //send message
  socket.on(
    "sendMessage",
    ({ sender_id, receiverId, message, conversationId }: Message) => {
      console.log(message);
      const user: any = getUser(receiverId);
      const anotherUser: any = getUser(sender_id);

      if (!user || !anotherUser) return;

      io.to(anotherUser.socketId).emit("getMessage", {
        conversation_id: conversationId,
        sender_id: sender_id,
        receiverId,
        message,
      });
      io.to(user.socketId).emit("getMessage", {
        conversation_id: conversationId,
        sender_id: sender_id,
        receiverId,
        message,
      });
    }
  );

  //send friend request
  socket.on("sendFriendRequest", ({ request, receiverId }: FriendRequest) => {
    const user: any = getUser(receiverId);

    if (!user) return;

    io.to(user.socketId).emit("getFriendRequest", request);
  });

  //send information that message was seen
  socket.on("emitSeen", (data: Seen) => {
    const user: any = getUser(data.receiver_id);

    if (!user) return;

    io.to(user.socketId).emit("getSeen", data);
  });

  //send notification
  socket.on("sendNotification", (notification: Notification) => {
    const user: any = getUser(notification.receiver_id);

    if (!user) return;

    // if (user.id !== notification.id) return;

    io.to(user.socketId).emit("getNotification", notification);
  });

  //when users disconnects
  socket.on("disconnect", () => {
    console.log("user disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
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

minioClient.bucketExists("social-media", function (error) {
  if (error) {
    throw new Error("MinIO error bucket dosent exist");
  }

  app.listen(process.env.PORT, () => {
    console.log("Server started on port :", process.env.PORT);
  });
});
