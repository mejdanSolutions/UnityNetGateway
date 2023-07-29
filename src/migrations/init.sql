CREATE USER 'SocialMedia'@'localhost' IDENTIFIED BY 'ispitivac';

GRANT CREATE, ALTER, DROP,
INSERT,
UPDATE,
DELETE,
SELECT
,
    REFERENCES,
    RELOAD on *.* TO 'SocialMedia' @'localhost'
WITH
GRANT OPTION;

CREATE DATABASE SocialMedia;

USE SocialMedia;

CREATE TABLE
    users (
        id INT NOT NULL AUTO_INCREMENT,
        first_name VARCHAR(20) NOT NULL,
        last_name VARCHAR(20) NOT NULL,
        email VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        cover_image VARCHAR(255) PRIMARY KEY (id)
    );

ALTER TABLE users ADD COLUMN last_active TIMESTAMP AFTER cover_image;

ALTER TABLE posts ADD COLUMN photo VARCHAR(255) AFTER type;

CREATE TABLE
    posts (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        text_content VARCHAR(1000) NOT NULL,
        description VARCHAR(1000),
        type VARCHAR(1000),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

CREATE TABLE
    shared_posts (
        parent_id INT NOT NULL,
        child_id INT NOT NULL,
        PRIMARY KEY (parent_id, child_id),
        CONSTRAINT fk_shared_posts_parent_id FOREIGN KEY (parent_id) REFERENCES posts (id) ON DELETE CASCADE,
        CONSTRAINT fk_shared_posts_child_id FOREIGN KEY (child_id) REFERENCES posts (id) ON DELETE CASCADE
    )
CREATE INDEX
    idx_child_id ON shared_posts (child_id);

CREATE TABLE
    post_likes (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_post_likes_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_post_likes_post_id FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
    );

CREATE INDEX idx_post_likes_post_id ON post_likes (post_id);

CREATE TABLE
    comments (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        comment VARCHAR(1000) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_comments_post_id FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
    );

CREATE INDEX post_id_index ON comments (post_id);

CREATE TABLE
    comment_likes (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        comment_id INT NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_comment_likes_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_comment_likes_comment_id FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE
    );

ALTER TABLE photos ADD COLUMN type VARCHAR(15) AFTER photo;

CREATE TABLE
    friend_requests (
        id INT NOT NULL AUTO_INCREMENT,
        sender INT NOT NULL,
        receiver INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_friend_request_sender FOREIGN KEY (sender) REFERENCES users (id),
        CONSTRAINT fk_friend_request_receiver_id FOREIGN KEY (receiver) REFERENCES users (id)
    );

CREATE TABLE
    friends (
        id INT NOT NULL AUTO_INCREMENT,
        personA INT NOT NULL,
        personB INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_friends_user_id FOREIGN KEY (personA) REFERENCES users (id),
        CONSTRAINT fk_friends_friend_id FOREIGN KEY (personB) REFERENCES users (id)
    );

CREATE TABLE
    messages (
        id INT NOT NULL AUTO_INCREMENT,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        message VARCHAR(1000) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_messages_sender_id FOREIGN KEY (sender_id) REFERENCES users (id),
        CONSTRAINT fk_messages_receiver_id FOREIGN KEY (receiver_id) REFERENCES users (id)
    );

ALTER TABLE messages ADD COLUMN seen_at TIMESTAMP AFTER message;

CREATE TABLE
    messages (
        id int NOT NULL AUTO_INCREMENT,
        conversation_id int NOT NULL,
        sender_id int NOT NULL,
        message varchar(1000) NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        CREATE DATABASE SocialMedia;

USE SocialMedia;

CREATE TABLE
    users (
        id INT NOT NULL AUTO_INCREMENT,
        first_name VARCHAR(20) NOT NULL,
        last_name VARCHAR(20) NOT NULL,
        email VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        image VARCHAR(255),
        cover_image VARCHAR(255) PRIMARY KEY (id)
    );

ALTER TABLE users ADD COLUMN last_active TIMESTAMP AFTER cover_image;

ALTER TABLE posts ADD COLUMN photo VARCHAR(255) AFTER type;

CREATE TABLE
    posts (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        text_content VARCHAR(1000) NOT NULL,
        description VARCHAR(1000),
        type VARCHAR(1000),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

CREATE TABLE
    shared_posts (
        parent_id INT NOT NULL,
        child_id INT NOT NULL,
        PRIMARY KEY (parent_id, child_id),
        CONSTRAINT fk_shared_posts_parent_id FOREIGN KEY (parent_id) REFERENCES posts (id) ON DELETE CASCADE,
        CONSTRAINT fk_shared_posts_child_id FOREIGN KEY (child_id) REFERENCES posts (id) ON DELETE CASCADE
    )
CREATE INDEX
    idx_child_id ON shared_posts (child_id);

CREATE TABLE
    post_likes (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_post_likes_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_post_likes_post_id FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
    );

CREATE INDEX idx_post_likes_post_id ON post_likes (post_id);

CREATE TABLE
    comments (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        comment VARCHAR(1000) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_comments_post_id FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
    );

CREATE INDEX post_id_index ON comments (post_id);

CREATE TABLE
    comment_likes (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        comment_id INT NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_comment_likes_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_comment_likes_comment_id FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE
    );

ALTER TABLE photos ADD COLUMN type VARCHAR(15) AFTER photo;

CREATE TABLE
    friend_requests (
        id INT NOT NULL AUTO_INCREMENT,
        sender INT NOT NULL,
        receiver INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_friend_request_sender FOREIGN KEY (sender) REFERENCES users (id),
        CONSTRAINT fk_friend_request_receiver_id FOREIGN KEY (receiver) REFERENCES users (id)
    );

CREATE TABLE
    friends (
        id INT NOT NULL AUTO_INCREMENT,
        personA INT NOT NULL,
        personB INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_friends_user_id FOREIGN KEY (personA) REFERENCES users (id),
        CONSTRAINT fk_friends_friend_id FOREIGN KEY (personB) REFERENCES users (id)
    );

CREATE TABLE
    messages (
        id INT NOT NULL AUTO_INCREMENT,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        message VARCHAR(1000) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_messages_sender_id FOREIGN KEY (sender_id) REFERENCES users (id),
        CONSTRAINT fk_messages_receiver_id FOREIGN KEY (receiver_id) REFERENCES users (id)
    );

ALTER TABLE messages ADD COLUMN seen_at TIMESTAMP AFTER message;

CREATE TABLE
    messages (
        id int NOT NULL AUTO_INCREMENT,
        conversation_id int NOT NULL,
        sender_id int NOT NULL,
        message varchar(1000) NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT k_messages_conversation_id FOREIGN KEY (conversation_id) REFERENCES friends (id) ON DELETE CASCADE,
        CONSTRAINT fk_messages_sender_id FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
    );

CREATE TABLE
    `notifications` (
        `id` int NOT NULL AUTO_INCREMENT,
        `sender_id` int NOT NULL,
        `receiver_id` int NOT NULL,
        `post_id` int NOT NULL,
        `type` varchar(15) NOT NULL,
        `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `fk_notifications_receiver_id` (`receiver_id`),
        KEY `fk_notifications_sender_id` (`sender_id`),
        KEY `fk_notifications_post_id` (`post_id`),
        CONSTRAINT `fk_notifications_post_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
        CONSTRAINT `fk_notifications_receiver_id` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`),
        CONSTRAINT `fk_notifications_sender_id` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
    ) ENGINE = InnoDB AUTO_INCREMENT = 27 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

ALTER TABLE `notifications`
ADD
    COLUMN `read` BOOLEAN DEFAULT FALSE AFTER `type`;

ALTER TABLE posts ADD COLUMN edited TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE posts ADD profile_id INT;

ALTER TABLE posts DROP COLUMN description;

`id` int NOT NULL AUTO_INCREMENT,
`sender_id` int NOT NULL,
`receiver_id` int NOT NULL,
`post_id` int NOT NULL,
`type` varchar(15) NOT NULL,
`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (`id`),
KEY `fk_notifications_receiver_id` (`receiver_id`),
KEY `fk_notifications_sender_id` (`sender_id`),
KEY `fk_notifications_post_id` (`post_id`),
CONSTRAINT `fk_notifications_post_id` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
CONSTRAINT `fk_notifications_receiver_id` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`),
CONSTRAINT `fk_notifications_sender_id` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 27 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

ALTER TABLE `notifications`
ADD
    COLUMN `read` BOOLEAN DEFAULT FALSE AFTER `type`;

ALTER TABLE posts ADD COLUMN edited TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE posts ADD profile_id INT;

ALTER TABLE posts DROP COLUMN description;