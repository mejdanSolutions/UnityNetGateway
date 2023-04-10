import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import query from "../db";

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

const isCommentLiked = asyncHandler(async (req: Request, res: Response) => {
  const commentId = req.params.id;
  const userId = 1;
  let q =
    "SELECT `id` FROM comment_likes WHERE `comment_id` = ? AND `user_id` = ?";
  let data = await query(q, [commentId, userId]);

  if (data.length) {
    res.json(true);
  } else {
    res.json(false);
  }
});

const getCommentLikesCount = asyncHandler(
  async (req: Request, res: Response) => {
    const commentId = req.params.id;

    let q =
      "SELECT COUNT(`id`) AS likes FROM comment_likes WHERE `comment_id` = ?";
    let data = await query(q, [commentId]);
    res.status(200).json(data[0]);
  }
);

const getPostComments = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;
  let q =
    "SELECT `id`,`user_id`,`post_id`,`comment`,`created_at` FROM comments WHERE `post_id` = ?";
  let data = await query(q, [postId]);
  res.status(200).json(data);
});

const commentPost = asyncHandler(async (req: Request, res: Response) => {
  const { comment } = req.body;
  const userId = req.user?.id;
  const postId = req.params.id;

  if (!comment) {
    res.status(400);
    throw new Error("Please enter your comment");
  }

  let q =
    "INSERT INTO comments (`user_id`,`post_id`,`comment`) VALUES (?, ?, ?)";
  const values = [userId, postId, comment];
  let data = await query(q, values);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Comment created");
});

const deletePostComment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const commentId = req.params.id;

  let q = "DELETE FROM comments WHERE `user_id` = ? AND `id` = ?";
  const values = [userId, commentId];

  let data = await query(q, values);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }
  res.status(200).json("Comment deleted");
});

const editPostComment = asyncHandler(async (req: Request, res: Response) => {
  const postId = req.params.id;
  const userId = 1;
  const { comment } = req.body;
  let q = "UPDATE comments SET `comment` = ? WHERE `id` = ? AND `user_id` = ?";
  const values = [comment, postId, userId];
  let data = await query(q, values);

  if (!data.affectedRows) {
    res.status(500);
    throw new Error("Query => '" + q + "' => failed");
  }

  res.status(200).json("Post comment updated");
});

const likePostComment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const commentId = req.params.id;
  //Chech if comment is already liked
  let q =
    "SELECT `id` FROM comment_likes WHERE `comment_id` = ? AND `user_id` = ?";
  let data = await query(q, [commentId, userId]);

  //like a comment
  if (data.length === 0) {
    q = "INSERT INTO comment_likes (`user_id`,`comment_id`) VALUES (?, ?)";
    const values = [userId, commentId];
    data = await query(q, values);

    if (!data.affectedRows) {
      res.status(500);
      throw new Error("Query => '" + q + "' => failed");
    }

    res.status(200).json("Comment liked");
  }
  //unlike a comment
  else {
    q = "DELETE FROM comment_likes WHERE `user_id` = ? AND `comment_id` = ?";
    const values = [userId, commentId];
    data = await query(q, values);

    if (!data.affectedRows) {
      res.status(500);
      throw new Error("Query => '" + q + "' => failed");
    }
    res.status(200).json("Comment unliked");
  }
});

export {
  commentPost,
  deletePostComment,
  editPostComment,
  likePostComment,
  getPostComments,
  getPostCommentsCount,
  getCommentLikesCount,
  isCommentLiked,
  getPostLikesCount,
};
