# AI 지침
*   **답변은 한국어로 할 것**

# AILink 프로젝트 문서

## 프로젝트 개요
**AILink**는 심플하고 아름다운 "유리 느낌(Glassmorphism)" UI 디자인이 적용된 링크 관리 웹 애플리케이션입니다. 사용자는 웹 링크를 "AI 사이트(AI Site)"와 "내 사이트(My Site)" 두 가지 카테고리로 분류하여 저장할 수 있으며, 드래그 앤 드롭 등을 통해 링크의 순서를 자유롭게 변경할 수 있습니다.

## 주요 기능
*   **링크 관리**: 링크 추가, 수정, 삭제 (CRUD).
*   **카테고리 분류**: 'AI Site'와 'My Site' 탭으로 분리하여 관리.
*   **순서 변경**: 사용자가 원하는 순서대로 링크 배치 가능 (DB 영구 저장).
*   **다크 모드 UI**: 눈이 편안한 다크 테마와 세련된 Glassmorphism 디자인 적용.

## 기술 스택
*   **프론트엔드**: HTML5, CSS3, Vanilla JavaScript (ES6+).
*   **백엔드**: PHP (RESTful API 방식).
*   **데이터베이스**: MySQL (PHP PDO 사용).

## 프로젝트 구조 및 주요 파일

### 백엔드 (Backend)
*   **`api.php`**: 핵심 API 컨트롤러입니다. 
    *   `GET`: 저장된 모든 링크를 `sort_order` 순으로 가져옵니다.
    *   `POST`: 새 링크 생성 또는 링크 순서 일괄 업데이트(Reorder)를 처리합니다.
    *   `PUT`: 기존 링크의 정보를 수정합니다.
    *   `DELETE`: 링크를 삭제합니다.
*   **`db_connect.php`**: 데이터베이스 연결 설정 파일입니다. (설치 시 수정 필요)
*   **`schema.sql`**: **(통합 설치 파일)** 데이터베이스 초기화를 위한 전체 SQL 스크립트입니다. `links` 테이블 생성 및 `sort_order` 컬럼 설정을 모두 포함합니다.

### 프론트엔드 (Frontend)
*   **`index.html`**: 메인 페이지 구조 및 모달 창(팝업) 마크업.
*   **`style.css`**: 전체적인 디자인 스타일링 (배경, 카드 디자인, 반응형 레이아웃).
*   **`script.js`**: 애플리케이션 로직.
    *   API 통신 (`fetch` API 사용).
    *   DOM 조작 및 이벤트 리스너.
    *   링크 렌더링 및 순서 변경 로직 처리.

## 설치 및 설정 방법 (New Server)

1.  **데이터베이스 설정**:
    *   MySQL 데이터베이스를 생성합니다 (예: `ailink_db`).
    *   `schema.sql` 파일을 실행하여 테이블을 생성합니다. (별도의 마이그레이션 불필요)

2.  **연결 정보 수정**:
    *   `db_connect.php` 파일을 엽니다.
    *   `$host`, `$dbname`, `$username`, `$password` 변수를 실제 서버 환경에 맞게 수정합니다.

3.  **서버 실행**:
    *   Apache, Nginx 등의 웹 서버 루트 또는 하위 디렉토리에 프로젝트를 위치시킵니다.
    *   PHP 내장 서버 사용 시:
        ```bash
        php -S localhost:8000
        ```

## 개발 노트
*   **데이터베이스 마이그레이션**: 초기 버전에는 `migrate_db.php`가 사용되었으나, 현재는 `schema.sql`에 모든 스키마 정의(`sort_order` 포함)가 통합되었습니다. 새 설치 시에는 `schema.sql`만 사용하면 됩니다.
*   **API 보안**: 기본적인 PDO Prepared Statement를 사용하여 SQL Injection을 방지합니다.
