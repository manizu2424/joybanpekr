-- 데이터베이스 생성 (이미 존재하면 생략 가능)
-- CREATE DATABASE IF NOT EXISTS joyban DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE joyban;

-- 1. 관리자 테이블
CREATE TABLE IF NOT EXISTS `admins` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 게시글 테이블
CREATE TABLE IF NOT EXISTS `posts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category` ENUM('profile', 'ailand', 'works', 'vision', 'job') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `views` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 미디어(첨부파일) 테이블
CREATE TABLE IF NOT EXISTS `media` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255),
    `file_type` VARCHAR(50) DEFAULT 'image',
    `display_order` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 관리자 계정 추가 (비밀번호: manizu24*)
-- [주의] 현재 PHP 실행 불가로 인해 평문으로 입력되었습니다. 실제 운영 시에는 반드시 password_hash('manizu24*', PASSWORD_BCRYPT)로 생성된 해시값으로 변경해야 로그인이 가능합니다.
INSERT INTO `admins` (`username`, `password`) VALUES 
('admin', 'manizu24*');

UPDATE admins SET password = '$2y$12$PNAimc1RsDQ8Ksfy7LBPqO7C3D4ucSHjywi024JFkKAbLZC.YKs32' WHERE username = 'admin';
