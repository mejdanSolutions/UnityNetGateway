import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { minioClient } from "../app";
import shortUUID from "short-uuid";
import query from "../db";
import sharp from "sharp";

const uploadProfilePicture = asyncHandler(
  async (req: Request, res: Response) => {
    const { description } = req.body;
    const userId = req.user?.id;

    if (!req.file) {
      res.status(400);
      throw new Error("Photo not found");
    }

    let uuid = shortUUID.generate();

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

const getProfilePhotos = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const type = "profile";

  let q =
    "SELECT p.id, p.user_id ,p.text_content,p.photo,p.created_at,p.edited,u.first_name,u.last_name,u.image FROM posts p INNER JOIN users u ON p.user_id=u.id WHERE `type`=? AND `user_id`= ? ORDER BY p.created_at DESC";

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
});

const getCoverPhotos = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const type = "cover";

  let q =
    "SELECT p.id, p.user_id ,p.text_content,p.photo,p.created_at,p.edited,u.first_name,u.last_name,u.image FROM posts p INNER JOIN users u ON p.user_id=u.id WHERE `type`=? AND `user_id`= ? ORDER BY p.created_at DESC";

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
});

const deleteProfilePhoto = asyncHandler(async (req: Request, res: Response) => {
  const photoId = req.params.id;
  const userId = req.user?.id;

  //check if its is current profile photo
  let q = "SELECT u.image FROM users u INNER JOIN photos p ON u.image=p.photo";

  let data = await query(q, [photoId]);

  if (data) {
    q = "UPDATE users SET `image`= NULL WHERE `image`= ? AND `id`= ?";
    let result = await query(q, [data[0].image, userId]);
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

const getPhoto = asyncHandler(async (req: Request, res: Response) => {
  const photoId = req.params.photoId;
  const userId = req.params.userId;

  let q =
    "SELECT p.id, p.user_id ,p.text_content,p.photo,p.created_at,p.edited,u.first_name,u.last_name,u.image FROM posts p INNER JOIN users u ON p.user_id=u.id WHERE p.id =? AND p.user_id= ?";

  let data = await query(q, [photoId, userId]);

  minioClient.presignedUrl(
    "GET",
    "social-media",
    data[0].photo,
    24 * 60 * 60,
    function (err: Error | null, presignedUrl: string) {
      if (!err) {
        data[0].photo = presignedUrl;
      }
    }
  );

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

  res.status(200).json(data);
});

export {
  uploadProfilePicture,
  getProfilePhotos,
  uploadCoverPicture,
  getCoverPhotos,
  deleteProfilePhoto,
  getPhoto,
};
