import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import query from "../db";
import { minioClient } from "../app";
import shortUUID from "short-uuid";

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

  // "SELECT u.id, u.first_name, u.last_name FROM friend_requests f JOIN users u ON u.id=f.sender WHERE f.receiver=?";

  // let q =
  //   "SELECT u.id, u.first_name, u.last_name, p.text_content FROM posts p JOIN users u ON u.id=p.user_id WHERE u.id =?";

  let q =
    "SELECT p.id,p.user_id,p.text_content,p.description,p.type,p.photo,p.created_at,p.updated_at,u.first_name,u.last_name,u.image FROM posts p INNER JOIN users u ON p.user_id=u.id WHERE u.id =?";

  let data = await query(q, [userId]);

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
});

const createPost = asyncHandler(async (req: Request, res: Response) => {
  const { textContent } = req.body;
  const userId = req.user?.id;
  let q = "INSERT INTO posts (`text_content`,`user_id`) VALUES (?, ?)";
  const values = [textContent, userId];
  let data = await query(q, values);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Post succesfully added");
});

const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  // let q =
  //   "SELECT `id`,`text_content`,`user_id`,`created_at` FROM posts WHERE `user_id` = ? ORDER BY `created_at`";

  //check if the user has friends
  let q = "SELECT `id` FROM friends WHERE `personA`= ? OR `personB`= ?";

  let data = await query(q, [userId, userId]);

  //user does not have any friends
  if (data.length === 0) {
    q =
      "SELECT p.id,p.text_content,p.description,p.type,p.photo,p.created_at,p.updated_at,u.first_name,u.last_name,u.image FROM posts p INNER JOIN users u ON p.user_id=u.id";

    //find if user has posts
    let result = await query(q, [userId]);

    result.forEach((post: any) => {
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
    //if not send send empty array

    //else his posts
    res.json(result);
    return;
  }

  // q =
  //   "SELECT posts.id, posts.user_id, posts.text_content, posts.created_at FROM posts INNER JOIN friends ON friends.personA=? OR friends.personB = ? WHERE friends.personA=posts.user_id OR friends.personB=posts.user_id";

  //send posts that user and his friends own
  q =
    "SELECT distinct p.id, p.user_id,p.text_content, p.photo ,p.type,p.created_at,p.updated_at,u.first_name,u.last_name, u.image FROM posts p INNER JOIN friends f ON p.user_id IN (f.personA, f.personB) AND ? IN (f.personA, f.personB) INNER JOIN users u ON u.id=p.user_id";

  data = await query(q, [userId]);

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
    } else if (post.image) {
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
});

const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;
  const userId = req.user?.id;
  let q = "DELETE FROM posts WHERE `id`= ? AND `user_id` = ?";
  let data = await query(q, [postId, userId]);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Post succesfully deleted");
});

const editPost = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;
  const userId = 1;
  const { textContent } = req.body;
  let q =
    "UPDATE posts SET `text_content` = ? WHERE `id` = ? AND `user_id` = ?";
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


  let q =
    "SELECT u.id AS user_id, u.first_name,u.last_name,u.image,p.id,p.text_content,p.type,p.photo,p.created_at FROM posts p INNER JOIN users u ON p.user_id=u.id WHERE p.id = ?";

  let data = await query(q, [postId]);

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

      console.log(req.file);
    }
  );

  let q =
    "INSERT INTO posts (`user_id`, `text_content`, `photo`) VALUES (?, ?, ?)";
  const values = [userId, description, uuid];
  let data = await query(q, values);

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

  q =
    "SELECT p.id,p.user_id,p.text_content, p.photo, p.type,u.first_name, u.last_name,u.image FROM posts p INNER JOIN users u ON p.user_id=u.id WHERE p.id=?";

  data = await query(q, [data[0].child_id]);

  res.json(data);
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
};
