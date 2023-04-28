import asyncHandler from "express-async-handler";
import e, { Request, Response } from "express";
import query from "../db";
import { minioClient } from "../app";
import shortUUID from "short-uuid";

const getUserInfo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;

  let q =
    "SELECT `id`,`first_name`,`last_name`, `image`,`cover_image`,`city`,`country`,`last_active` FROM users WHERE `id` = ?";
  let result = await query(q, [userId]);

  if (result[0].image) {
    minioClient.presignedUrl(
      "GET",
      "social-media",
      result[0].image,
      24 * 60 * 60,
      function (err: Error | null, presignedUrl: string) {
        if (!err) {
          result[0].image = presignedUrl;
        }
      }
    );
  }

  if (result[0].cover_image) {
    minioClient.presignedUrl(
      "GET",
      "social-media",
      result[0].cover_image,
      24 * 60 * 60,
      function (err: Error | null, presignedUrl: string) {
        if (!err) {
          result[0].cover_image = presignedUrl;
        }
      }
    );
  }

  res.status(200).json(result[0]);
});

const editUserInfo = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, city, country } = req.body;
  const userId = 1;

  if (!firstName) {
    res.status(404);
    throw new Error("Please enter your first name");
  }

  if (!lastName) {
    res.status(404);
    throw new Error("Please enter you last name");
  }

  let q =
    "UPDATE users SET `first_name` = ?,`last_name` = ?,`city`=?,`country`=? WHERE `id` = ?";

  let data = await query(q, [
    firstName,
    lastName,
    city || null,
    country || null,
    userId,
  ]);

  res.status(200).json("User edited");
});

const getLoggedUserInfo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  let q =
    "SELECT `id`, `first_name`, `last_name`,`image`,`last_active`,`country`,`city` FROM users WHERE `id`= ?";

  let data = await query(q, [userId]);

  if (data[0].image) {
    minioClient.presignedUrl(
      "GET",
      "social-media",
      data[0].image,
      24 * 60 * 60,
      function (err: Error | null, presignedUrl: string) {
        if (!err) {
          data[0].image = presignedUrl;
        }
      }
    );
  }

  res.status(200).json(data[0]);
});

const getUserFriends = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;

  let q = `SELECT u.id,u.first_name,u.last_name, u.image FROM friends f 
    JOIN users u ON u.id=f.personA WHERE f.personB=? 
    UNION SELECT u.id, u.first_name, u.last_name, u.image FROM friends f JOIN users u ON u.id=f.personB
     WHERE f.personA = ?`;

  let data = await query(q, [userId, userId]);

  if (data.length === 0) {
    res.json([]);
    return;
  }

  data.forEach((user: any) => {
    if (user.image) {
      minioClient.presignedUrl(
        "GET",
        "social-media",
        user.image,
        24 * 60 * 60,
        function (err: Error | null, presignedUrl: string) {
          if (!err) {
            user.image = presignedUrl;
          }
        }
      );
    }
  });

  res.status(200).json(data);
});

const getUsersByLikes = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;

  let q =
    "SELECT u.id, u.first_name, u.last_name, u.image FROM users u INNER JOIN post_likes p ON u.id=p.user_id WHERE `post_id`= ?";

  let data = await query(q, [postId]);

  data.forEach((user: any) => {
    if (user.image) {
      minioClient.presignedUrl(
        "GET",
        "social-media",
        user.image,
        24 * 60 * 60,
        function (err: Error | null, presignedUrl: string) {
          if (!err) {
            user.image = presignedUrl;
          }
        }
      );
    }
  });

  res.status(200).json(data);
});

const getUsersByShares = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;

  let q = `SELECT DISTINCT u.id, u.first_name, u.last_name, u.image
  FROM users u
  JOIN (
    SELECT p.user_id, sp.parent_id
    FROM shared_posts sp
    JOIN posts p ON p.id = sp.parent_id
    WHERE sp.child_id = ?
  ) AS post_shares ON post_shares.user_id = u.id`;

  let data = await query(q, [postId]);

  data.forEach((user: any) => {
    if (user.image) {
      minioClient.presignedUrl(
        "GET",
        "social-media",
        user.image,
        24 * 60 * 60,
        function (err: Error | null, presignedUrl: string) {
          if (!err) {
            user.image = presignedUrl;
          }
        }
      );
    }
  });

  res.status(200).json(data);
});

const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;

  const searchTerm = `%${q}%`;

  let qu =
    "SELECT `id`,`first_name`,`last_name`,`image` FROM users WHERE `first_name` LIKE ? OR `last_name` LIKE ?";

  let data = await query(qu, [searchTerm, searchTerm]);

  data.forEach((user: any) => {
    if (user.image) {
      minioClient.presignedUrl(
        "GET",
        "social-media",
        user.image,
        24 * 60 * 60,
        function (err: Error | null, presignedUrl: string) {
          if (!err) {
            user.image = presignedUrl;
          }
        }
      );
    }
  });

  res.status(200).json(data);
});

export {
  getUserInfo,
  getUsersByLikes,
  getUserFriends,
  getLoggedUserInfo,
  searchUsers,
  getUsersByShares,
  editUserInfo,
};
