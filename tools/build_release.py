"""Build Cafe24 FTP and setup bundles without local credentials or user uploads."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'release'
OUTPUT.mkdir(exist_ok=True)
web_files = [ROOT / name for name in (
    'index.html', 'board.html', 'view.html', 'admin_write.html',
    '.htaccess', 'favicon.svg', 'robots.txt', 'sitemap.xml',
    'uploads/.htaccess',
    'images/aibot-flat-white.png', 'images/og-image.png', 'images/profile-placeholder.svg',
)]
for directory in ('css', 'js', 'api'):
    web_files.extend(path for path in (ROOT / directory).rglob('*')
                     if path.is_file() and path.suffix in ('.css', '.js', '.php')
                     and path != ROOT / 'api/config/db.php')
setup_files = [ROOT / name for name in (
    'sql/migrate-portal.sql', 'sql/migrate-categories.sql', 'sql/schema.sql',
    'tools/admin_password.php', 'docs/cafe24-deployment.md',
    'docs/personal-portal.md', 'README.md',
)]
for name, paths in (('joyban-web.zip', web_files), ('joyban-setup.zip', setup_files)):
    with ZipFile(OUTPUT / name, 'w', ZIP_DEFLATED) as archive:
        for path in sorted(set(paths)):
            archive.write(path, path.relative_to(ROOT).as_posix())
    print(f'{name}: {len(set(paths))} files')
