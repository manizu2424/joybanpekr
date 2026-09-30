"""격리된 임시 DB/코드 복사본에서만 실행하는 PHP·MariaDB 통합 테스트.
필수: Docker, Python 3. 실행: python3 tests/integration.py
운영 URL, 운영 DB, 로컬 db.php는 사용하지 않습니다.
"""
from pathlib import Path
import base64
import http.cookiejar
import json
import os
import secrets
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]

def docker(*args, data=None, quiet=True):
    return subprocess.run(['docker', *args], input=data, stdout=subprocess.PIPE if quiet else None,
                          stderr=subprocess.PIPE if quiet else None, check=True).stdout


def main():
    suffix = secrets.token_hex(4)
    network, db_name, web_name = [f'joyban-test-{kind}-{suffix}' for kind in ['net', 'db', 'web']]
    password = secrets.token_urlsafe(24)
    temp = Path(tempfile.mkdtemp(prefix='joyban-test-'))
    checks = 0
    def check(condition, title):
        nonlocal checks
        assert condition, title
        checks += 1
        print(f'PASS {title}', flush=True)
    try:
        shutil.copytree(ROOT, temp / 'site', ignore=shutil.ignore_patterns('.git', '.DS_Store', 'db.php'), dirs_exist_ok=True)
        shutil.copyfile(ROOT / 'api/config/db.example.php', temp / 'site/api/config/db.php')
        # 임시 컨테이너의 www-data가 첨부파일을 생성하는 테스트 폴더.
        os.chmod(temp / 'site/uploads', 0o777)
        docker('build', '-q', '-t', 'joyban-portal-test:local', str(ROOT / 'tests/docker'))
        docker('network', 'create', network)
        docker('run', '-d', '--name', db_name, '--network', network,
               '-e', f'MARIADB_ROOT_PASSWORD={password}', '-e', 'MARIADB_DATABASE=portal_test', 'mariadb:10.11')
        for _ in range(60):
            try:
                docker('exec', '-e', f'MYSQL_PWD={password}', db_name, 'mariadb', '-uroot', '-e', 'SELECT 1')
                break
            except subprocess.CalledProcessError:
                time.sleep(1)
        else:
            raise RuntimeError('임시 DB가 시작되지 않았습니다.')
        def sql(statement):
            return docker('exec', '-i', '-e', f'MYSQL_PWD={password}', db_name,
                          'mariadb', '-uroot', '--default-character-set=utf8mb4', 'portal_test', data=statement.encode()).decode()
        sql((ROOT / 'sql/schema.sql').read_text())
        sql("INSERT INTO posts(category,title,content) VALUES('aiworld','기존 기록','보존해야 하는 글');")
        sql((ROOT / 'sql/migrate-portal.sql').read_text())
        sql((ROOT / 'sql/migrate-portal.sql').read_text())
        check('기존 기록' in sql('SELECT title FROM posts'), '마이그레이션 재실행 및 기존 기록 보존')
        docker('run', '-d', '--name', web_name, '--network', network, '-p', '127.0.0.1::80',
               '-v', f'{temp / "site"}:/var/www/html', '-e', f'JOYBAN_DB_HOST={db_name}',
               '-e', 'JOYBAN_DB_NAME=portal_test', '-e', 'JOYBAN_DB_USER=root',
               '-e', f'JOYBAN_DB_PASSWORD={password}', 'joyban-portal-test:local')
        port = json.loads(docker('inspect', web_name))[0]['NetworkSettings']['Ports']['80/tcp'][0]['HostPort']
        base = f'http://127.0.0.1:{port}/'
        test_password = 'PortalTest-' + secrets.token_urlsafe(18)
        hashed = docker('exec', '-e', f'TEST_PASSWORD={test_password}', web_name, 'php', '-r',
                        'echo password_hash(getenv("TEST_PASSWORD"), PASSWORD_DEFAULT);').decode()
        sql(f"INSERT INTO admins(username,password) VALUES('admin','{hashed}')")
        lint = docker('exec', web_name, 'sh', '-c', 'find /var/www/html -name "*.php" -print0 | xargs -0 -n1 php -l').decode()
        check('Errors parsing' not in lint, '전체 PHP 8.2 문법 검사')
        public = urllib.request.build_opener()
        admin = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        def request(path, body=None, token=None, client=public, method=None, raw=False, content_type=None):
            headers = {}
            if body is not None:
                if isinstance(body, bytes):
                    headers['Content-Type'] = content_type or 'application/octet-stream'
                else:
                    body = json.dumps(body).encode(); headers['Content-Type'] = 'application/json'
            if token: headers['X-CSRF-Token'] = token
            req = urllib.request.Request(base + path, data=body, headers=headers, method=method)
            try:
                response = client.open(req, timeout=10)
            except urllib.error.HTTPError as error:
                response = error
            value = response.read()
            return response.status, value if raw else json.loads(value)
        for _ in range(30):
            try:
                if request('api/auth/status.php')[0] == 200: break
            except (OSError, ValueError): time.sleep(.2)
        check(request('', raw=True)[0] == 200, '포털 메인 페이지 응답')
        for path in ['.git/config', 'AGENT.md', 'sql/schema.sql', 'api/config/db.php', 'tools/admin_password.php', 'tests/integration.py']:
            check(request(path, raw=True)[0] in [403,404], f'비공개 파일 웹 접근 차단: {path}')
        check(request('api/links/save.php', {'title':'x'})[0] == 403, '비로그인 변경 차단')
        check(request('api/auth/login.php', {'username':'admin','password':hashed}, client=admin)[0] == 401, '저장된 해시 문자열 로그인 거부')
        check(request('api/auth/login.php', {'username':'admin','password':test_password}, client=admin)[0] == 200, '관리자 해시 비밀번호 로그인')
        _, auth = request('api/auth/status.php',client=admin); token = auth['csrfToken']
        check(bool(token), '로그인 세션 CSRF 토큰 제공')
        link = {'title':'파이썬 자료','url':'https://example.com/python','description':'API와 자동화 메모',
                'category':'python','kind':'article','tags':['API','Python'],'is_favorite':True,'is_read':False,'sort_order':0}
        check(request('api/links/save.php',link,client=admin)[0] == 403, 'CSRF 토큰 없는 저장 거부')
        code, result = request('api/links/save.php',link,token,admin); private_id=result['id']
        check(code == 200, '비공개 링크 생성')
        check(request('api/links/read.php')[1]['total'] == 0, '비공개 자료 공개 API 노출 차단')
        check(request('api/links/read.php?view=workspace')[0] == 403, '비로그인 작업 공간 조회 차단')
        _, rows=request('api/links/read.php',client=admin)
        check(rows['data'][0]['visibility']=='private', '새 링크 기본 비공개')
        check(request('api/links/read.php?category=python&q=API&tag=Python',client=admin)[1]['total']==1, '분야·메모·태그 복합 검색')
        check(request('api/links/read.php?tag=Py',client=admin)[1]['total']==0, '태그 정확히 일치하는 검색')
        check(request('api/links/read.php?q=%25',client=admin)[1]['total']==0, '검색어 와일드카드 이스케이프')
        public_link={**link,'title':'공개 도구','visibility':'public','kind':'site','is_favorite':False}
        _, result=request('api/links/save.php',public_link,token,admin); public_id=result['id']
        _, result=request('api/links/read.php')
        check(result['total']==1 and result['data'][0]['id']==public_id and 'is_read' not in result['data'][0], '공개 자료만 노출하고 개인 읽음 상태 제외')
        workspace={**link,'title':'내 작업','kind':'workspace','visibility':'public'}
        request('api/links/save.php',workspace,token,admin)
        check(request('api/links/read.php')[1]['total']==1, '작업 공간 공개 요청도 서버에서 비공개 강제')
        check(request('api/links/read.php?view=favorites',client=admin)[1]['total']==2, '즐겨찾기 필터')
        check(request('api/links/read.php?view=unread',client=admin)[1]['total']==1, '읽을거리 중 안 읽은 자료 필터')
        request('api/links/state.php',{'id':private_id,'is_read':True},token,admin)
        request('api/links/state.php',{'id':private_id,'is_favorite':False},token,admin)
        saved=request('api/links/read.php?category=python',client=admin)[1]['data']
        saved=next(row for row in saved if row['id']==private_id)
        check(saved['is_read'] and not saved['is_favorite'] and saved['title']==link['title'], '상태 변경은 다른 상태와 자료 내용을 보존')
        check(request('api/links/read.php?view=unread',client=admin)[1]['total']==0, '읽음 처리 및 즐겨찾기 해제')
        for invalid in ['javascript:alert(1)','data:text/html,x','https://user:pass@example.com']:
            check(request('api/links/save.php',{**link,'url':invalid},token,admin)[0]==400, '위험 URL 저장 거부')
        check(request('api/links/save.php',{**link,'tags':['x']*13},token,admin)[0]==400, '태그 개수 검증')
        check(request('api/links/save.php',{**link,'id':99999},token,admin)[0]==404, '존재하지 않는 링크 수정 거부')
        check(request('api/links/read.php?category%5B%5D=ai')[0]==400, '잘못된 쿼리 타입 검증')
        # 페이징 순서와 다음 페이지 중복 여부.
        for i in range(31):
            request('api/links/save.php',{**link,'title':f'페이지 {i}','is_favorite':False},token,admin)
        _, page1=request('api/links/read.php',client=admin)
        _, page2=request('api/links/read.php?page=2',client=admin)
        check(len(page1['data'])==30 and page1['has_more'] and not ({r['id'] for r in page1['data']} & {r['id'] for r in page2['data']}), '자료 페이지네이션과 중복 없는 정렬')
        check(request('api/links/delete.php',{'id':private_id},token,admin)[0]==200, '자료 삭제')
        check(request('api/links/delete.php',{'id':private_id},token,admin)[0]==404, '이미 삭제된 자료 처리')
        # 기존 게시글 경로가 새 인증 규칙과 호환되는지 확인.
        check(request('api/posts/read.php?category=aiworld')[1]['total_count']==1, '기존 게시판 목록 조회')
        def multipart(fields, files=()):
            boundary='joyban-'+secrets.token_hex(8); chunks=[]
            for name,value in fields.items():
                chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
            for name,filename,data,mime in files:
                chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode()+data+b'\r\n')
            chunks.append(f'--{boundary}--\r\n'.encode())
            return b''.join(chunks), 'multipart/form-data; boundary='+boundary
        data,mime=multipart({'category':'works','title':'테스트 기록','content':'본문'})
        check(request('api/posts/create.php',data,client=admin,content_type=mime)[0]==403, '기존 게시판 CSRF 검증')
        code,result=request('api/posts/create.php',data,token,admin,content_type=mime); post_id=result['post_id']
        check(code==200, '기존 글쓰기와 새 인증 호환')
        gif=base64.b64decode('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==')
        data,mime=multipart({'id':post_id,'category':'works','title':'첨부 기록','content':'본문'},[('files[]','pixel.gif',gif,'image/gif')])
        check(request('api/posts/update.php',data,token,admin,content_type=mime)[0]==200, '기존 글 수정 및 정상 이미지 업로드')
        _,post=request(f'api/posts/detail.php?id={post_id}&mode=edit',client=admin)
        check(post['data']['views']==0 and len(post['data']['media'])==1, '수정용 조회수 유지 및 첨부 조회')
        file_path=post['data']['media'][0]['file_path']
        check(request(file_path,raw=True)[0]==200, '업로드 파일 HTTP 접근')
        # 정상 업로드 다음 파일이 실패할 때 새 파일은 정리되고 기존 삭제도 취소되어야 함.
        media_id=post['data']['media'][0]['id']
        before=set((temp/'site/uploads').iterdir())
        data,mime=multipart({'id':post_id,'category':'works','title':'실패 수정','content':'본문','delete_files[]':media_id},[('files[]','good.gif',gif,'image/gif'),('files[]','fake.png',b'not an image','image/png')])
        check(request('api/posts/update.php',data,token,admin,content_type=mime)[0]==400, '위장 이미지 업로드 거부')
        check(set((temp/'site/uploads').iterdir())==before and request(file_path,raw=True)[0]==200, '실패 시 신규 파일 정리 및 기존 파일 보존')
        _,post=request(f'api/posts/detail.php?id={post_id}&mode=edit',client=admin)
        check(post['data']['title']=='첨부 기록' and len(post['data']['media'])==1, '실패한 수정 DB 롤백')
        check(request('api/posts/read.php?category=works')[1]['data'][0]['thumbnail']==file_path, '이미지 썸네일 선택')
        check(request('api/posts/delete.php',{'id':post_id},token,admin)[0]==200 and request(file_path,raw=True)[0]==404, '게시글 삭제 후 첨부 파일 정리')
        check(request('api/posts/update.php',raw=True,client=admin)[0]==405, '변경 API의 GET 요청 거부')
        check(request('api/auth/logout.php',{},token,admin)[0]==200, 'POST·CSRF 로그아웃')
        check(not request('api/auth/status.php',client=admin)[1]['isLoggedIn'], '로그아웃 후 세션 제거')
        check(request('api/links/read.php',client=admin)[1]['total']==1, '로그아웃 이후 비공개 자료 차단')
        for _ in range(5):
            check(request('api/auth/login.php',{'username':'admin','password':'incorrect'},client=admin)[0]==401, '잘못된 로그인 실패')
        check(request('api/auth/login.php',{'username':'admin','password':test_password},client=public)[0]==429, '새 브라우저 세션에서도 IP별 로그인 제한')
        docker('exec', web_name, 'rm', '/var/www/html/api/config/db.php')
        code, error = request('api/links/read.php')
        check(code==503 and error['status']=='error' and 'db.php' not in error['message'], f'DB 설정 누락 시 안전한 JSON 오류 (HTTP {code}: {error})')
        print(f'\n{checks} integration checks passed (PHP 8.2 / MariaDB 10.11).',flush=True)
    finally:
        for name in [web_name,db_name]:
            subprocess.run(['docker','rm','-f','-v',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        subprocess.run(['docker','network','rm',network],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        shutil.rmtree(temp)

if __name__ == '__main__':
    main()
