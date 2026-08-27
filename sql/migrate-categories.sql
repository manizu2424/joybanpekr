-- 기존 카테고리 값을 현재 한글 메뉴 구조에 맞는 내부 코드로 변경합니다.
-- 적용 전 DB 백업을 권장합니다.

ALTER TABLE `posts`
MODIFY `category` ENUM('profile', 'ailand', 'works', 'vision', 'job', 'aiworld', 'skillup') NOT NULL;

UPDATE `posts` SET `category` = 'aiworld' WHERE `category` = 'ailand';
UPDATE `posts` SET `category` = 'skillup' WHERE `category` = 'job';
UPDATE `posts` SET `category` = 'skillup' WHERE `category` = 'profile';

ALTER TABLE `posts`
MODIFY `category` ENUM('aiworld', 'works', 'vision', 'skillup') NOT NULL;
