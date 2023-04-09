import asyncHandler from "express-async-handler";
import e, { Request, Response } from "express";
import query from "../db";
import { minioClient } from "../app";
import shortUUID from "short-uuid";

const getUserInfo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;

  let q =
    "SELECT `id`,`first_name`,`last_name`, `image`,`cover_image` FROM users WHERE `id` = ?";
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

const getLoggedUserInfo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  let q =
    "SELECT `id`, `first_name`, `last_name`,`image` FROM users WHERE `id`= ?";

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

  // let q =
  //   "SELECT (`personA` OR `personB`) AS id FROM friends WHERE `personA` = ? OR `personB` = ?";

  let q =
    "SELECT u.id,u.first_name,u.last_name, u.image FROM friends f JOIN users u ON u.id=f.personA WHERE f.personB=? UNION SELECT u.id, u.first_name, u.last_name, u.image FROM friends f JOIN users u ON u.id=f.personB WHERE f.personA = ?";

  let data = await query(q, [userId, userId]);

  console.log(data);

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
  // let users: any[] = [];

  // users = await Promise.all(
  //   data.map((friend: any) => {
  //     q =
  //       "SELECT `id`,`first_name`, `last_name`,`image` FROM users WHERE `id` = ?";
  //     let userData = query(q, [friend.id]);

  //     return userData;
  //   })
  // );

  // res.status(200).json(users.flat());
});

const getUsersByLikes = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;
  // let q = "SELECT `user_id` FROM post_likes WHERE `post_id` = ?";

  let q =
    "SELECT u.id, u.first_name, u.last_name, u.image FROM users u INNER JOIN post_likes p ON u.id=p.user_id WHERE `post_id`= ?";

  // let users: any[] = [];

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

  // users = await Promise.all(
  //   data.map((user: any) => {
  //     q =
  //       "SELECT `id`,`first_name`, `last_name`,`image` FROM users WHERE `id` = ?";
  //     let userData = query(q, [user.user_id]);

  //     return userData;
  //   })
  // );

  res.status(200).json(data);
});

const getUsersByPhotoLikes = asyncHandler(
  async (req: Request, res: Response) => {
    const photoId = req.params.id;

    let q =
      "SELECT u.id,u.first_name,u.last_name,u.image FROM users u JOIN photo_likes p ON p.user_id=u.id WHERE p.photo_id=?";

    let data = await query(q, [photoId]);

    res.json(data);
  }
);

const uploadProfilePicture = asyncHandler(
  async (req: Request, res: Response) => {
    const { description } = req.body;
    const userId = req.user?.id;

    if (!req.file) {
      res.status(400);
      throw new Error("Photo not found");
    }

    let uuid = shortUUID.generate();

    minioClient.fPutObject(
      "social-media",
      uuid,
      req.file?.path,
      {
        "Content-Type": "application/octet-stream",
      },
      function (error: Error | null, etag: any) {
        if (error) {
          console.log(error);
          return;
        }
      }
    );

    let q =
      "INSERT INTO posts (`user_id`, `text_content`, `photo`, `type`) VALUES (?, ?, ?, ?)";
    const values = [userId, description, uuid, "profile"];
    let data = await query(q, values);

    if (!data.affectedRows) {
      res.status(500);
      throw new Error("Query => '" + q + "' => failed");
    }

    q = "UPDATE users SET `image` = ? WHERE `id` = ?";

    data = await query(q, [uuid, userId]);

    res.status(200).json("Photo succesfully added");
  }
);

const uploadCoverPicture = asyncHandler(async (req: Request, res: Response) => {
  const { description } = req.body;
  const userId = req.user?.id;

  if (!req.file) {
    res.status(400);
    throw new Error("Photo not found");
  }

  let uuid = shortUUID.generate();

  minioClient.fPutObject(
    "social-media",
    uuid,
    req.file?.path,
    {
      "Content-Type": "application/octet-stream",
    },
    function (error: Error | null, etag: any) {
      if (error) {
        console.log(error);
        return;
      }
    }
  );

  let q =
    "INSERT INTO posts (`user_id`, `text_content`, `photo`, `type`) VALUES (?, ?, ?, ?)";
  const values = [userId, description, uuid, "cover"];
  let data = await query(q, values);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  q = "UPDATE users SET `cover_image` = ? WHERE `id` = ?";

  data = await query(q, [uuid, userId]);

  res.status(200).json("Photo succesfully added");
});

const getUserProfilePhotos = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id;
    const type = "profile";

    let q =
      "SELECT p.id, p.user_id ,p.text_content,p.photo,p.created_at,u.first_name,u.last_name,u.image FROM posts p INNER JOIN users u ON p.user_id=u.id WHERE `type`=? AND `user_id`= ?";

    let data = await query(q, [type, userId]);

    data.forEach((post: any) => {
      if (post.photo) {
        minioClient.presignedUrl(
          "GET",
          "social-media",
          post.photo,
          24 * 60 * 60,
          function (err: Error | null, presignedUrl: string) {
            if (!err) {
              post.photo = presignedUrl;
            }
          }
        );
      }
      if (post.image) {
        minioClient.presignedUrl(
          "GET",
          "social-media",
          post.image,
          24 * 60 * 60,
          function (err: Error | null, presignedUrl: string) {
            if (!err) {
              post.image = presignedUrl;
            }
          }
        );
      }
    });

    res.status(200).json(data);
  }
);

const getUserCoverPhotos = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const type = "cover";

  let q =
    "SELECT `id`,`user_id`,`text_content`,`photo`,`type` FROM posts WHERE `type`=? AND `user_id`= ?";

  let data = await query(q, [type, userId]);

  data.forEach((post: any) => {
    if (post.photo) {
      minioClient.presignedUrl(
        "GET",
        "social-media",
        post.photo,
        24 * 60 * 60,
        function (err: Error | null, presignedUrl: string) {
          if (!err) {
            post.photo = presignedUrl;
          }
        }
      );
    }
  });

  res.status(200).json(data);
});

const deleteProfilePhoto = asyncHandler(async (req: Request, res: Response) => {
  const photoId = req.params.id;

  //check if its is current profile photo
  let q = "SELECT u.image FROM users u INNER JOIN photos p ON u.image=p.photo";

  let data = await query(q, [photoId]);

  console.log("current profile pic ", data);

  if (data) {
    q = "UPDATE users SET `image`= NULL WHERE `image`= ?";
    let result = await query(q, [data[0].image]);
  }

  // delete from photos
  q = "DELETE FROM photos WHERE `id`=? AND `type`= ?";

  data = await query(q, [photoId, "profile"]);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Profile photo deleted");
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

const getUserConversations = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    let q =
      "SELECT u.id,f.id AS conversation_id, u.first_name, u.last_name, u.image, m.message AS last_message, m.created_at AS last_message_date, m.sender_id FROM friends f INNER JOIN users u ON (f.personA = u.id OR f.personB = u.id) AND u.id != ? LEFT JOIN (SELECT conversation_id, MAX(created_at) AS max_created_at FROM messages GROUP BY conversation_id) last_msg ON f.id = last_msg.conversation_id LEFT JOIN messages m ON last_msg.conversation_id = m.conversation_id AND last_msg.max_created_at = m.created_at WHERE f.personA = ? OR f.personB = ? ORDER BY last_message_date DESC";

    let data = await query(q, [userId, userId, userId]);

    res.json(data);
  }
);

export {
  getUserInfo,
  getUsersByLikes,
  getUserFriends,
  getLoggedUserInfo,
  getUsersByPhotoLikes,
  uploadProfilePicture,
  getUserProfilePhotos,
  uploadCoverPicture,
  getUserCoverPhotos,
  deleteProfilePhoto,
  searchUsers,
  getUserConversations,
};
