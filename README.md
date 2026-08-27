# joyban

AI, 웹 개발, 자동화와 개인 프로젝트를 기록하는 포트폴리오형 블로그입니다.

## 주요 기능

- 개인 소개 및 포트폴리오 메인 페이지
- 카테고리별 게시글 목록과 상세 보기
- 관리자 로그인
- 게시글 작성, 수정, 삭제
- 이미지 및 첨부파일 다중 업로드
- 동영상 링크와 외부 사이트 링크 지원
- 게시글 조회수와 카테고리별 통계 표시
- 모바일 반응형 화면

## 기술 스택

- Frontend: HTML5, CSS3, Vanilla JavaScript (ES6+)
- Backend: PHP 8.2
- Database: MariaDB 10.x / MySQL, PDO
- Web server: Apache 또는 PHP 내장 개발 서버

## 프로젝트 구조

```text
joyban/
├── index.html                 # 메인 페이지
├── board.html                 # 카테고리별 게시글 목록
├── view.html                  # 게시글 상세 페이지
├── admin_write.html           # 관리자 글 작성 및 수정
├── css/style.css              # 전체 스타일
├── js/app.js                  # 프론트엔드 로직
├── api/
│   ├── auth/                  # 로그인, 로그아웃, 세션 상태 확인
│   ├── config/db.php          # 로컬 DB 연결 설정
│   ├── posts/                 # 게시글 및 통계 API
│   └── upload/                # 업로드 처리 공통 코드
├── images/                    # 프로필 및 Open Graph 이미지
├── sql/schema.sql             # 기본 DB 스키마 및 관리자 계정
├── sql/migrate-categories.sql # 카테고리 마이그레이션
└── docs/                      # 개발 계획 및 참고 문서
```

## 실행 방법

### 1. 저장소 준비

```bash
git clone <repository-url>
cd joyban
```

### 2. 데이터베이스 설정

MariaDB 또는 MySQL에서 사용할 데이터베이스를 만든 후 `sql/schema.sql`을 실행합니다.

```bash
mysql -u <db-user> -p <database-name> < sql/schema.sql
```

필요한 경우 `sql/migrate-categories.sql`도 실행합니다.

### 3. DB 연결 정보 설정

`api/config/db.php`에 로컬 또는 운영 환경의 연결 정보를 설정합니다.

```php
$host = 'localhost';
$db   = '<database-name>';
$user = '<database-user>';
$pass = '<database-password>';
```

`api/config/db.php`는 비밀번호가 포함될 수 있으므로 Git에 커밋하지 않습니다. 이 파일은 프로젝트의 `.gitignore`에 등록되어 있습니다.

### 4. 로컬 서버 실행

PHP가 설치되어 있다면 프로젝트 루트에서 다음 명령을 실행합니다.

```bash
php -S localhost:8000
```

브라우저에서 <http://localhost:8000>을 엽니다. PHP 내장 서버는 개발 및 테스트용으로 사용하고, 운영 환경에서는 Apache 등의 웹 서버를 사용하세요.

## 카테고리

| 화면 이름 | 데이터베이스 값 | 설명                       |
| --------- | --------------- | -------------------------- |
| AI 이야기 | `aiworld`       | AI 도구, 자동화, 실험 기록 |
| 만든 것들 | `works`         | 웹사이트와 개인 프로젝트   |
| 생각정리  | `vision`        | 생각, 회고, 작업 방향      |
| 배움노트  | `skillup`       | 학습 및 문제 해결 기록     |

## 관리자 사용

1. 메인 페이지에서 관리자 로그인으로 이동합니다.
2. 로그인 후 글 작성 페이지에서 카테고리와 콘텐츠를 입력합니다.
3. 필요한 경우 여러 파일을 첨부합니다.
4. 게시글 상세 페이지에서 수정 또는 삭제할 수 있습니다.

`sql/schema.sql`에 초기 관리자 계정 정보가 포함되어 있습니다. 운영 전에 반드시 관리자 비밀번호를 변경하고, 데이터베이스에 평문 비밀번호가 저장되지 않았는지 확인하세요. PHP의 `password_hash()`와 `password_verify()` 사용을 권장합니다.

## 업로드 파일

업로드 파일은 프로젝트 루트의 `uploads/` 디렉터리에 저장됩니다. 업로드 파일은 실행 중 생성되는 데이터이므로 Git에서 제외됩니다. 운영 서버에서는 해당 디렉터리에 웹 서버가 파일을 저장할 수 있는 권한이 필요합니다.

## 보안 및 운영 주의사항

- DB 비밀번호와 세션 관련 설정을 공개 저장소에 올리지 않습니다.
- 운영 환경에서는 HTTPS를 사용합니다.
- 관리자 초기 비밀번호를 즉시 변경합니다.
- 로그인 API의 평문 비밀번호 호환 코드는 운영 전에 제거하고 해시 검증만 사용합니다.
- 업로드 확장자, MIME 타입, 파일 크기와 저장 경로를 운영 기준에 맞게 제한합니다.
- PHP 오류 상세 메시지가 외부에 노출되지 않도록 운영 설정을 점검합니다.

## 라이선스

현재 별도의 라이선스가 지정되지 않은 개인 프로젝트입니다.
