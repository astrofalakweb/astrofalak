const fs = require('fs');
const https = require('https');
const path = require('path');

const urls = [
  'https://www.solarsystemscope.com/textures/download/2k_sun.jpg',
  'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg',
  'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg',
  'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
  'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
  'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg',
  'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg',
  'https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png',
  'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg',
  'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg',
  'https://www.solarsystemscope.com/textures/download/2k_moon.jpg'
];

const dir = path.join(__dirname, 'public', 'textures');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function download(url) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(url);
    const dest = path.join(dir, filename);
    if (fs.existsSync(dest)) {
      console.log(`Exists: ${filename}`);
      return resolve();
    }
    
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        console.error(`Failed to download ${url}: ${res.statusCode}`);
        return reject();
      }
      
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
        console.log(`Downloaded: ${filename}`);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  for (const url of urls) {
    try {
      await download(url);
    } catch (e) {
      console.error(e);
    }
  }
}

main();
