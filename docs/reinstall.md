# 서버 재설치

서버를 비우고 다시 설치하면, 예전 글을 살리는 과정은 없습니다. 지금 서버에 있는 글과 첨부파일은 지워집니다.

## 1. 데이터베이스를 새로 만듭니다

Cafe24의 phpMyAdmin에서 기존 테이블을 지운 뒤, 이 프로젝트의 `sql/schema.sql` 내용을 실행합니다. 게시판 테이블과 링크 보관함 테이블이 함께 만들어집니다.

## 2. 접속 정보를 넣습니다

`api/config/db.example.php`를 `api/config/db.php`로 복사하고, Cafe24 데이터베이스 이름·아이디·비밀번호를 적습니다. 데이터베이스 이름은 지금처럼 `webmanizu`입니다.

## 3. 파일을 올립니다

이 컴퓨터에서 아래를 실행하고, 만들어진 `release/joyban-web.zip`을 풀어 사이트 폴더에 올립니다. `db.php`도 `api/config/` 안에 함께 둡니다.

```bash
python3 tools/build_release.py
```

## 4. 관리자 비밀번호를 만듭니다

puTTY로 서버에 접속한 뒤, 사이트 폴더에서 아래를 실행합니다.

```bash
php tools/admin_password.php
```

아이디는 `admin`, 비밀번호는 12자 이상으로 정합니다. 이 도구는 웹 브라우저에서 열리지 않습니다.

## 확인

https://joyban.pe.kr 을 열고, 오른쪽 위 로그인으로 들어갑니다. 처음에는 글과 링크가 비어 있는 것이 정상입니다.
