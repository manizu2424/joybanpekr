# AI 지침

- **답변은 한국어로 할 것**

# joyban 프로젝트 문서

## 프로젝트 개요

개인포트폴리오 및 블로깅 기능이 있는 웹 애플리케이션. 사용자는 컨텐츠(이미지와 텍스트, 첨부파일)을 등록하고 수정, 삭제할 수 있음.

## 운영 사이트 : https://joyban.pe.kr

## 기술 스택

- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript (ES6+).
- **백엔드**: PHP 8.2 (RESTful API 방식).
- **데이터베이스**: MariaDB 10.x (MySQL, PHP PDO 사용).
- **서버**: Cafe24 호스팅 (Linux/Apache).

## 설치할 서버상태

- 도메인 : joyban.pe.kr
- cafe24 10G 광아우토반 FullSSD Plus 일반형
- 서버환경 : 리눅스, UTF-8 (PHP8.2, mariadb-10.x)
- 서버아이피 : uws8-wpm-085 | 112.175.247.177
- database : id webddang / pw domyung24!
- db 연결방법 : puTTY를 통한 SSH접속
- 기본database로 webmanizu 있음
- 배포방법 : fileZilla를 이용한 FTP 방식

---

## 🛠️ 개발 진행 상황 (2026-01-09 업데이트)

### 1. 프로젝트 구조 수립

```text
joyban/
├── api/                    # 백엔드 API (PHP)
│   └── posts/stats.php     # [New] 카테고리별 게시글 통계 API
├── css/                    # style.css (반응형 디자인 적용)
├── js/                     # app.js (프론트엔드 로직 - UIManager 추가)
├── sql/                    # 데이터베이스 관련 (schema.sql)
├── uploads/                # 사용자가 업로드한 파일 저장소
├── index.html              # 메인 페이지 (통계 표시 추가)
├── board.html              # 게시글 목록 페이지 (AIland, Works 등 공용)
├── view.html               # 게시글 상세 페이지 (미디어 타입별 표시 개선)
├── admin_write.html        # 관리자 글쓰기 페이지 (커스텀 알림 적용)
```
