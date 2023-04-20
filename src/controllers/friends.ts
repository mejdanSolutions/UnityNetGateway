import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import query from "../db";

const sendFriendRequest = asyncHandler(async (req: Request, res: Response) => {
  // user that is sending the friend request
  const senderId = req.user?.id;

  // user that is receiving
  const receiverId = req.params.id;
  //send friend request
  let q = "INSERT INTO friend_requests (`sender`, `receiver`) VALUES (?, ?)";
  const values = [senderId, receiverId];
  let data = await query(q, values);
  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }
  res.status(200).json("Friend request sent");
});

const getFriendRequests = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  // let q = "SELECT `sender` FROM friend_requests WHERE `receiver` = ?";

  // let q =
  // "SELECT u.id,u.first_name,u.last_name FROM friends f JOIN users u ON u.id=f.personA WHERE f.personB=?

  let q =
    "SELECT u.id, u.first_name, u.last_name FROM friend_requests f JOIN users u ON u.id=f.sender WHERE f.receiver=?";
  let data = await query(q, [userId]);

  res.status(200).json(data);
});

const acceptFriendRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const receiver = req.user?.id;
    const sender = req.params.id;
    let q = "DELETE FROM friend_requests WHERE `receiver`= ? AND `sender`=?";
    let values = [receiver, sender];

    let data = await query(q, values);

    if (!data.affectedRows) {
      res.status(500);
      throw new Error("Query => '" + q + "' => failed");
    }

    q = "INSERT INTO friends (`personA`, `personB`) VALUES (?, ?)";
    values = [receiver, sender];
    data = await query(q, values);

    if (!data.affectedRows) {
      res.status(500);
      throw new Error("Query => '" + q + "' => failed");
    }
    res.status(200).json("Friend request accepted");
  }
);

const checkFriendRequestStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const userTwo = req.params.id;
    //check if friend request already exists

    let q =
      "SELECT `id`,`receiver`,`sender` FROM friend_requests WHERE `receiver` = ? OR `sender`= ? AND `receiver` = ? OR `sender`=?";
    let values = [userId, userId, userTwo, userTwo];
    let data = await query(q, values);

    if (data.length) {
      res.json({
        status: true,
        receiver: data[0].receiver,
        sender: data[0].sender,
      });
    } else {
      res.json({
        status: false,
      });
    }
  }
);

const checkFriendsStatus = asyncHandler(async (req: Request, res: Response) => {
  const loggedUserId = req.user?.id;
  const secondUser = req.params.id;

  let q =
    "SELECT `id` FROM friends WHERE (`personA` = ? OR `personB`= ?) AND (`personA` = ? OR `personB` = ?)";
  const values = [loggedUserId, loggedUserId, secondUser, secondUser];
  let data = await query(q, values);

  if (data.length) {
    res.json(true);
  } else {
    res.json(false);
  }
});

const removeFromFriends = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const friendId = req.params.id;
  let q =
    "DELETE FROM friends WHERE `personA` = ? OR `personB` = ? AND `personA` = ? OR `personB` = ?";
  const values = [userId, userId, friendId, friendId];

  let data = await query(q, values);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Removed from friends");
});

const getFriendRequestsCount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    let q =
      "SELECT COUNT(*) AS requestCount FROM friend_requests WHERE `receiver`=?";

    let data = await query(q, [userId]);

    res.status(200).json(data[0]);
  }
);

export {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  checkFriendsStatus,
  removeFromFriends,
  checkFriendRequestStatus,
  getFriendRequestsCount,
};
