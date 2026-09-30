# Joyban 개인 포털

AI·웹개발·파이썬·자동화 분야의 사이트와 읽을 자료를 저장하고, 개인 기록으로 연결하는 시작 페이지입니다. 기존 게시판과 게시글 데이터는 유지합니다.

## 1차 구현

- 링크 저장·수정·삭제: URL, 제목, 분야, 유형, 태그, 메모
- 즐겨찾기 고정, 숫자로 표시 순서 지정
- 읽음 처리와 나중에 읽기 목록
- 분야·유형·태그·제목·메모 검색, 자료 30개씩 더 보기
- 기본 비공개 저장, 선택한 자료만 공개
- 내 작업 공간은 서버에서도 항상 비공개 강제
- 기존 게시판을 개인 기록으로 연결
- 모바일 대응과 키보드로 사용할 수 있는 링크·대화상자

RSS 소식 수집·예약 갱신·AI 요약은 2차 범위이며 아직 구현하지 않았습니다. 현재 보관함의 읽을거리는 직접 저장한 링크입니다. 기본 링크를 자동으로 넣지 않습니다.

## 환경

HTML/CSS/Vanilla JavaScript, PHP 8.2, MariaDB 10.x, Apache. Cafe24 `10G 광아우토반 FullSSD Plus 일반형`의 FTP 배포 구조를 유지합니다. Node 서버나 파이썬 상시 실행 프로세스가 필요하지 않습니다.

## 배포 패키지

`python3 tools/build_release.py`로 FTP 웹 파일과 별도 설치 자료를 `release/`에 만들 수 있습니다. 실제 업로드 순서는 [Cafe24 배포 안내](docs/cafe24-deployment.md)를 참고하세요.

## 기존 운영 사이트에 적용

1. 운영 DB와 웹 파일, 특히 `uploads/`를 백업합니다.
2. `sql/migrate-portal.sql`을 **현재 사용 중인 DB**에 실행합니다. `portal_links`, `auth_login_attempts` 테이블만 추가하고 `posts`, `media`, `admins`의 데이터는 변경하지 않습니다. 재실행할 수 있습니다.
3. 기존 DB 카테고리가 `ailand`, `job`, `profile`이면 백업 후 `sql/migrate-categories.sql`을 별도로 적용합니다. 이미 `aiworld`, `works`, `vision`, `skillup`이면 필요 없습니다.
4. DB 설정이 없으면 `api/config/db.example.php`를 `api/config/db.php`로 복사하고 실제 연결 정보를 넣습니다. 기존 운영 `db.php`는 덮어쓰지 않습니다. PDO 예제는 네이티브 prepared statement를 사용합니다.
5. SSH에서 `php tools/admin_password.php`를 실행해 관리자 `admin`의 비밀번호를 새 값으로 교체합니다. 저장소에 기록되었던 DB 비밀번호도 실제 사용 중이었다면 호스팅에서 교체하고 `db.php`에 반영합니다.
6. 아래 검증과 점검을 마친 후 웹 파일을 FTP로 업로드합니다. 숨김 파일인 루트 `.htaccess`, `uploads/.htaccess`도 반드시 포함합니다. `.git`, `tests`, 개발 문서, SQL은 공개 서버에 올리지 않는 편이 좋습니다. CLI 도구는 비밀번호 설정 후 서버에서 제거해도 됩니다.
7. 기존 `api/hash_gen.php`는 삭제합니다. PHP 설정에서 운영 `display_errors=Off`, `log_errors=On`을 적용합니다.
8. 공개 화면 → 로그인 → 비공개 링크 저장 → 공개 자료 저장 → 로그아웃 순서로 확인합니다. 기존 글 작성·수정·이미지 업로드도 확인합니다.

**SQL과 로그인 코드는 함께 적용해야 합니다.** 시도 제한 테이블을 만들지 않고 로그인 코드만 교체하면 로그인이 실패합니다. FTP 교체 중에는 유지보수 시간을 확보하세요.

노출되었던 비밀정보는 현재 파일에서 제거했습니다. 기존 Git 이력까지 삭제한 것은 아닙니다. 평문 관리자 비밀번호의 로그인 호환 코드는 제거했으므로 평문 계정은 CLI 도구로 먼저 해시 비밀번호로 교체해야 합니다.

상세 배포 순서와 되돌리는 방법은 [포털 전환 문서](docs/personal-portal.md)를 참고하세요.

## 새 설치

```sh
mysql -u <db-user> -p <database-name> < sql/schema.sql
cp api/config/db.example.php api/config/db.php
# db.php의 DB 연결 정보 수정
php tools/admin_password.php
php -S localhost:8000
```

`http://localhost:8000`을 엽니다. PHP 내장 서버는 개발용이며 `.htaccess` 접근 제한을 적용하지 않습니다. 운영에서는 Apache를 사용합니다. PHP PDO MySQL과 fileinfo 확장이 필요합니다. 파일당 20MB 이하, 한 번에 최대 10개 첨부를 허용하며, 실제 서버의 `upload_max_filesize`, `post_max_size`, `max_file_uploads`가 더 낮으면 그 제한이 우선합니다.

## 사용법

1. 관리자 로그인 후 **링크 저장**을 누릅니다.
2. 사이트·도구는 유형을 `사이트 · 도구`로, 글·영상은 `읽을거리`로 선택합니다.
3. 태그는 쉼표로 구분합니다. 기본 공개 범위는 `나만 보기`입니다.
4. 자주 쓰는 사이트는 즐겨찾기에 고정합니다. 정렬 순서가 작은 자료부터 표시되며 같은 순서는 최근 저장한 자료가 먼저 나옵니다.
5. 읽을거리는 `읽음`으로 처리하면 `나중에 읽기`에서 빠집니다. 링크를 여는 것만으로 읽음 처리되지는 않습니다.
6. 태그를 클릭하면 해당 태그의 자료만 표시됩니다. 태그 필터의 × 버튼으로 해제합니다.

공개 방문자는 공개 링크와 개인 기록만 봅니다. 읽음 상태, 비공개 자료, 내 작업 공간은 관리자만 조회·변경할 수 있습니다. 기존 게시글은 공개 기록입니다. 링크의 비공개 설정이 기존 게시글이나 첨부파일을 비공개로 바꾸지는 않습니다.

## 검증

JavaScript 문법과 보안 회귀 테스트:

```sh
node --check js/portal.js
node --check js/app.js
node --test tests/portal.test.cjs
```

PHP 8.2·MariaDB 10.11 통합 테스트 (Docker와 Python 3 필요):

```sh
python3 tests/integration.py
```

통합 테스트는 임시 코드 복사본·DB·Docker 네트워크를 만들고 종료 시 제거합니다. 운영 DB와 로컬 `db.php`를 사용하지 않습니다. 공식 PHP·MariaDB 이미지를 최초 실행 시 다운로드하며, 테스트용 PHP 이미지는 캐시에 남습니다. 마이그레이션 보존, 인증·CSRF, 비공개 접근, 링크 CRUD·검색·페이징, 기존 글쓰기·업로드 롤백을 검증합니다. 브라우저 시각 검증은 별도입니다.

## 구조

```text
index.html                 개인 포털
css/portal.css             포털 스타일
js/portal.js               보관함·검색·관리자 UI
api/links/                 링크 조회·저장·상태 변경·삭제
api/auth/                  세션·로그인·로그아웃·CSRF
api/config/db.example.php  비밀정보 없는 DB 예제
sql/migrate-portal.sql     기존 DB용 추가 테이블
sql/schema.sql             새 설치용 스키마
board.html / view.html     공개 개인 기록
admin_write.html           기록 작성·수정
uploads/.htaccess          업로드 폴더의 실행 파일 차단
```
