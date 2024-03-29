import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import query from "../db";
import { minioClient } from "../app";
import shortUUID from "short-uuid";
import sharp from "sharp";
import mime from "mime";

const getSharesCount = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;

  let q =
    "SELECT COUNT(DISTINCT parent_id) AS shares_count FROM shared_posts WHERE `child_id` = ?";

  let data = await query(q, [postId]);

  res.status(200).json(data[0]);
});

const getPostCommentsCount = asyncHandler(
  async (req: Request, res: Response) => {
    const postId = req.params.id;

    // let q =
    //   "SELECT (SELECT COUNT(*) FROM comments c WHERE `post_id`= ?) AS comments, (SELECT COUNT(*) FROM post_likes pl WHERE `post_id`= ?) AS likes FROM dual";

    let q =
      "SELECT COUNT(*) AS comment_count FROM comments WHERE `post_id` = ?";

    let data = await query(q, [postId]);

    res.status(200).json(data[0]);
  }
);

const getPostLikesCount = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;

  let q = "SELECT COUNT(*) as likes_count FROM post_likes WHERE `post_id` = ?";

  let data = await query(q, [postId]);

  res.status(200).json(data[0]);
});

const isPostLiked = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;
  const userId = req.user?.id;
  let q = "SELECT `id` FROM post_likes WHERE `post_id` = ? AND `user_id` = ?";
  let data = await query(q, [postId, userId]);

  if (data.length === 0) {
    res.json(false);
  } else {
    res.json(true);
  }
});

const getUserPosts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const page = parseInt(req.params.page);
  const offset = (page - 1) * 10;

  let q = `
  SELECT p.id, p.user_id, p.text_content, p.type, p.photo, p.created_at, p.updated_at, p.edited,p.profile_id, u.first_name, u.last_name, u.image 
  FROM posts p 
  INNER JOIN users u ON p.user_id = u.id 
  WHERE (p.profile_id = ? AND p.user_id != p.profile_id) OR (p.user_id = ? AND p.profile_id IS NULL) OR (p.profile_id = ? AND p.profile_id=p.user_id)
  ORDER BY p.created_at DESC 
  LIMIT 10 OFFSET ${offset}
  `;

  let data = await query(q, [userId, userId, userId]);

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
          } else {
            console.log("Error generating minio url : ", err);
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
          } else {
            console.log("Error generating minio url : ", err);
          }
        }
      );
    }
  });

  res.status(200).json(data);
});

const createPost = asyncHandler(async (req: Request, res: Response) => {
  const { textContent, profileId } = req.body;
  const userId = req.user?.id;

  let q;
  let data;
  let values;

  if (!profileId) {
    q = "INSERT INTO posts (`text_content`,`user_id`) VALUES (?, ?)";
    values = [textContent, userId];
    data = await query(q, values);
  }

  if (profileId) {
    q =
      "INSERT INTO posts (`text_content`,`user_id`,`profile_id`) VALUES (?, ?, ?)";
    values = [textContent, userId, profileId];
    data = await query(q, values);
  }

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Post succesfully added");
});

const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const page = req.params.page;
  const offset = (+page - 1) * 10;

  //send posts that user and his friends own
  let q = `SELECT DISTINCT p.id, p.user_id, p.text_content, p.photo, p.type, p.created_at, p.updated_at,p.edited,p.profile_id, u.first_name, u.last_name, u.image
  FROM posts p
  INNER JOIN users u ON u.id = p.user_id
  LEFT JOIN friends f ON (f.personA = u.id OR f.personB = u.id)
  WHERE (u.id = ? AND p.profile_id IS NULL)
  OR (f.personA = ? AND p.profile_id IS NULL) OR (f.personB = ? AND p.profile_id IS NULL)
  ORDER BY p.created_at DESC
  LIMIT 10 OFFSET ?`;

  let data = await query(q, [userId, userId, userId, offset + ""]);

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
          } else {
            console.log("Error generating minio url : ", err);
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
          } else {
            console.log("Error generating minio url : ", err);
          }
        }
      );
    }
  });

  res.status(200).json(data);
});

const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const postId = parseInt(req.params.id);
  const userId = req.user?.id;
  const type = req.body.type;
  let bucketName = "social-media";

  console.log(postId);

  let q;
  let data;

  if (type === "profile") {
    //check if its is current profile photo
    q =
      "SELECT u.image FROM users u INNER JOIN posts p ON u.image=p.photo WHERE u.id = ?";

    data = await query(q, [userId]);

    if (data) {
      q = "UPDATE users SET `image`= NULL WHERE id = ?";
      await query(q, [userId]);
    }
  }

  if (type === "cover") {
    //check if its is current cover photo
    q =
      "SELECT u.cover_image FROM users u INNER JOIN posts p ON u.cover_image=p.photo WHERE u.id = ?";

    data = await query(q, [userId]);

    if (data) {
      q = "UPDATE users SET `cover_image`= NULL WHERE id = ?";
      await query(q, [userId]);
    }
  }

  //delete photo from minio bucket
  q = "SELECT photo FROM posts WHERE `id`= ? AND `user_id`= ?";

  data = await query(q, [postId, userId]);

  if (data[0].photo !== null) {
    let objectName = data[0].photo;

    minioClient.removeObject(bucketName, objectName, (err) => {
      if (err) {
        console.error(`Error deleting object ${objectName}: ${err}`);
      } else {
        console.log(`Object ${objectName} deleted successfully`);
      }
    });
  }

  //delete post
  try {
    q = "DELETE FROM posts WHERE `id`= ? AND `user_id` = ?";
    data = await query(q, [postId, userId]);

    res.status(200).json("Post succesfully deleted");
  } catch (error) {
    console.log(error);
  }
});

const editPost = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;
  const userId = req.user?.id;
  const { textContent } = req.body;
  let q =
    "UPDATE posts SET `text_content` = ?, `edited`=true WHERE `id` = ? AND `user_id` = ?";
  const values = [textContent, postId, userId];
  let data = await query(q, values);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Post succesfully updated");
});

const likePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const postId = req.params.id;
  //Chech if post is already liked
  let q = "SELECT `id` FROM post_likes WHERE `post_id` = ? AND `user_id` = ?";
  let data = await query(q, [postId, userId]);

  //like post
  if (data.length === 0) {
    q = "INSERT INTO post_likes (`user_id`,`post_id`) VALUES (?, ?)";
    const values = [userId, postId];
    let data = await query(q, values);

    if (!data.affectedRows) {
      res.status(500);
      throw new Error("Query => '" + q + "' => failed");
    }
    res.status(200).json("Post liked");
  }
  //unlike post
  else {
    q = "DELETE FROM post_likes WHERE `user_id` = ? AND `post_id` = ?";
    const values = [userId, postId];
    let data = await query(q, values);

    if (!data.affectedRows) {
      res.status(500);
      throw new Error("Query => '" + q + "' => failed");
    }
    res.status(200).json("Post unliked");
  }
});

const getPost = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;

  let q = `SELECT u.id AS user_id, u.first_name,u.last_name,u.image,p.id,p.text_content,p.type,p.photo,p.created_at, p.edited FROM posts p
     INNER JOIN users u ON p.user_id=u.id WHERE p.id = ?`;

  let data = await query(q, [postId]);

  minioClient.presignedUrl(
    "GET",
    "social-media",
    data[0].image,
    24 * 60 * 60,
    function (err: Error | null, presignedUrl: string) {
      if (err) {
        console.log("Error generating minio url : ", err);
        return;
      }

      if (data[0].image) {
        data[0].image = presignedUrl;
      }
    }
  );

  minioClient.presignedUrl(
    "GET",
    "social-media",
    data[0].photo,
    24 * 60 * 60,
    function (err: Error | null, presignedUrl: string) {
      if (err) {
        console.log("Error generating minio url : ", err);
        return;
      }

      if (data[0].photo) {
        data[0].photo = presignedUrl;
      }
    }
  );

  res.status(200).json(data[0]);
});

const sharePost = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const postId = req.params.id;
  const { description } = req.body;

  let q =
    "INSERT INTO posts (`user_id`,`text_content`,`type`) VALUES (?, ?, ?)";
  let data = await query(q, [userId, description, "shared"]);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  //get parent id
  q = "SELECT LAST_INSERT_ID() AS id";

  data = await query(q, []);

  let parentId = data[0].id;

  q = "INSERT INTO shared_posts (`parent_id`,`child_id`) VALUES (?, ?)";

  data = await query(q, [parentId, postId]);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Post shared");
});

const isPostShared = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;

  let q = "SELECT `id` FROM shared_posts WHERE `post_id`= ?";

  let data = await query(q, [postId]);

  if (data) {
    res.json(true);
  } else {
    res.json(false);
  }
});

const addPhoto = asyncHandler(async (req: Request, res: Response) => {
  const { description, profileId } = req.body;
  const userId = req.user?.id;

  if (!req.file) {
    res.status(400);
    throw new Error("Photo not found");
  }

  const { path, mimetype } = req.file;

  const processedImageBuffer = await sharp(path).resize(800, 800).toBuffer();

  console.log("image", processedImageBuffer);

  const uuid = shortUUID.generate();

  try {
    const processedImageBuffer = await sharp(req.file.path)
      .jpeg({ quality: 15 })
      .toBuffer();

    minioClient.putObject(
      "social-media",
      uuid,
      processedImageBuffer,
      (err, etag) => {
        if (err) {
          console.error("Error uploading to MinIO:", err);
          return res
            .status(500)
            .json({ error: "Failed to upload the image to MinIO" });
        }

        console.log("Image uploaded to MinIO successfully");
      }
    );
  } catch (error) {
    console.error("Error processing the image:", error);
    res.status(500).json({ error: "Failed to process the image" });
  }

  let q;
  let values;
  let data;

  if (!profileId) {
    q =
      "INSERT INTO posts (`user_id`, `text_content`, `photo`) VALUES (?, ?, ?)";
    values = [userId, description, uuid];
    data = await query(q, values);
  }

  if (profileId) {
    q =
      "INSERT INTO posts (`user_id`, `text_content`, `photo`, `profile_id`) VALUES (?, ?, ?, ?)";
    values = [userId, description, uuid, parseInt(profileId)];
    data = await query(q, values);
  }

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Photo succesfully added");
});

const getSharedPost = asyncHandler(async (req: Request, res: Response) => {
  const parentId = req.params.id;
  const userId = req.user?.id;

  let q = "SELECT `child_id` FROM shared_posts WHERE `parent_id`= ?";

  let data = await query(q, [parentId]);

  q = `SELECT p.id,p.user_id,p.text_content, p.photo, p.type,u.first_name, u.last_name,u.image, p.created_at FROM posts p
     INNER JOIN users u ON p.user_id=u.id WHERE p.id=?`;

  let result = await query(q, [data[0].child_id]);

  minioClient.presignedUrl(
    "GET",
    "social-media",
    result[0].image,
    24 * 60 * 60,
    function (err: Error | null, presignedUrl: string) {
      if (err) {
        console.log("Error generating minio url : ", err);
        return;
      }

      if (result[0].image) {
        result[0].image = presignedUrl;
      }
    }
  );

  minioClient.presignedUrl(
    "GET",
    "social-media",
    result[0].photo,
    24 * 60 * 60,
    function (err: Error | null, presignedUrl: string) {
      if (err) {
        console.log("Error generating minio url : ", err);
        return;
      }

      if (result[0].photo) {
        result[0].photo = presignedUrl;
      }
    }
  );

  res.json(result);
});

export {
  createPost,
  deletePost,
  editPost,
  getPosts,
  likePost,
  isPostLiked,
  getUserPosts,
  getPost,
  sharePost,
  isPostShared,
  addPhoto,
  getSharedPost,
  getPostCommentsCount,
  getPostLikesCount,
  getSharesCount,
};
