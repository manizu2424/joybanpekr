-- 1차 포털: 기존 posts, media, admins와 게시글 데이터는 변경하지 않습니다.
CREATE TABLE IF NOT EXISTS portal_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('ai', 'web', 'python', 'automation', 'other') NOT NULL DEFAULT 'other',
    kind ENUM('site', 'article', 'workspace') NOT NULL DEFAULT 'article',
    tags TEXT NOT NULL,
    visibility ENUM('private', 'public') NOT NULL DEFAULT 'private',
    is_favorite TINYINT(1) NOT NULL DEFAULT 0,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX links_visibility (visibility, kind),
    INDEX links_favorite_order (is_favorite, sort_order, id),
    INDEX links_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auth_login_attempts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip_hash CHAR(64) NOT NULL,
    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX login_ip_time (ip_hash, attempted_at),
    INDEX login_time (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
