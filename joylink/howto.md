1단계: DB 연결 정보 수정 (db_connect.php)

로컬 파일(db_connect.php)을 열어서 Cafe24 DB 정보로 수정해야 합니다.

1.  db_connect.php 파일을 엽니다.
2.  아래 내용을 본인의 Cafe24 DB 정보로 바꿔주세요.
    - $host: 보통 localhost 그대로 둡니다.
    - $dbname: `webddang` (이미 존재하는 워드프레스 DB 이름을 사용해야
      합니다.)
    - $username: Cafe24 DB 아이디 (보통 FTP 아이디와 같음)
    - $password: Cafe24 DB 비밀번호

1 <?php
2 $host = 'localhost';
3 $dbname = 'webddang'; // 기존 DB 이름 사용!
4 $username = '본인아이디'; // Cafe24 아이디
5 $password = '본인비밀번호'; // Cafe24 DB 비번
6 // ... 아래는 그대로
7 ?>

---

2단계: 서버에 파일 업로드 (FTP)

파일질라(FileZilla)를 켜서 서버에 접속합니다.

1.  서버의 www 또는 public_html 폴더(웹 루트) 안으로 들어갑니다.
2.  `ailink` 라는 폴더를 새로 만듭니다. (이미 만들었다면 그 안으로 들어갑니다.)
3.  제작한 파일 5개를 모두 업로드합니다.
    - index.html
    - style.css
    - script.js
    - api.php
    - db_connect.php (수정된 파일)
    - (`schema.sql`은 업로드 안 해도 되지만, 백업용으로 올려둬도 무방합니다.)

---

3단계: 테이블 생성 (SSH 터미널)

SSH(PuTTY, 터미널 등)로 서버에 접속해서 links 테이블을 만들어야 합니다.

1.  SSH 접속: 터미널에서 ssh 아이디@도메인 입력 후 접속.
2.  MySQL 접속:
    1 mysql -u 아이디 -p webddang
    (비밀번호 입력 후 엔터) \* 주의: `webddang`은 사용자님의 DB 이름입니다.

3.  테이블 생성 쿼리 입력:
    MySQL 접속 프롬프트(mysql>)가 뜨면, 아래 코드를 복사해서 붙여넣고 엔터를
    칩니다. (schema.sql 내용입니다.)

1 CREATE TABLE IF NOT EXISTS links (
2 id INT AUTO_INCREMENT PRIMARY KEY,
3 title VARCHAR(255) NOT NULL,
4 url VARCHAR(2048) NOT NULL,
5 category ENUM('aisite', 'mysite') NOT NULL,
6 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
7 );

4.  확인 및 종료:
    - SHOW TABLES; 입력 -> links 테이블이 보이는지 확인.
    - exit 입력해서 MySQL 빠져나오기.

---

🚀 적용 완료!
이제 브라우저 주소창에 http://본인도메인/ailink/ 를 입력하면 사이트가 뜰
것입니다.

요약:

1.  db_connect.php에서 DB 이름을 webddang으로 수정.
2.  파일질라로 ailink 폴더에 파일 업로드.
3.  SSH로 MySQL 접속해서 CREATE TABLE ... 쿼리 한 번만 실행.

---

🔄 기능 업데이트 (2026-01-08): 순서 변경 기능 추가

링크의 순서를 자유롭게 변경하는 기능이 추가되었습니다. 이 기능을 사용하기 위해 데이터베이스에 컬럼을 추가해야 합니다.

**방법 1: 웹 브라우저로 실행 (간편)**
1. `migrate_db.php` 파일을 서버에 업로드합니다.
2. 브라우저에서 `http://본인도메인/ailink/migrate_db.php` 로 접속합니다.
3. "Column 'sort_order' added successfully" 메시지가 나오면 성공입니다.
4. 보안을 위해 서버에서 `migrate_db.php` 파일을 삭제하는 것이 좋습니다.

**방법 2: SSH/MySQL 직접 입력**
MySQL에 접속하여 다음 명령어를 실행하세요:

```sql
ALTER TABLE links ADD COLUMN sort_order INT DEFAULT 0;
```
