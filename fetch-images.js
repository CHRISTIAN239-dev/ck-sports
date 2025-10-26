const https = require('https');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'articles.json');
const assetsDir = path.join(__dirname, 'assets');

if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  if (!fs.existsSync(dataPath)) {
    console.error('data/articles.json not found');
    process.exit(1);
  }

  const articles = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  for (const a of articles) {
    if (!a.image || a.image.startsWith('assets/')) continue;
    const ext = path.extname(new URL(a.image).pathname).split('?')[0] || '.jpg';
    const filename = `article-${a.id}${ext}`;
    const dest = path.join(assetsDir, filename);
    try {
      console.log('Downloading', a.image, '->', dest);
      await download(a.image, dest);
      // update article image to local path
      a.image = `assets/${filename}`;
    } catch (err) {
      console.error('Failed to download', a.image, err.message);
    }
  }

  // write updated articles file
  fs.writeFileSync(dataPath, JSON.stringify(articles, null, 2), 'utf8');
  console.log('Done downloading images.');
}

main().catch(err => { console.error(err); process.exit(1); });
