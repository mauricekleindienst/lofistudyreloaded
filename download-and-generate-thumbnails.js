// download-and-generate-thumbnails.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const ffmpeg = require('fluent-ffmpeg');

// Load backgrounds from exported JSON
const backgrounds = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'backgrounds.json'), 'utf8'));
const videoDir = path.join(__dirname, 'public', 'backgrounds');
const thumbDir = path.join(__dirname, 'public', 'thumbnails');
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

(async () => {
  for (const bg of backgrounds) {
    if (!bg.src.match(/\.(mp4|webm|mov)$/i)) continue;
    const localVideoPath = path.join(videoDir, bg.filename);
    // Download if not already present
    if (!fs.existsSync(localVideoPath)) {
      console.log(`Downloading: ${bg.src}`);
      try {
        await downloadFile(bg.src, localVideoPath);
        console.log(`Downloaded: ${localVideoPath}`);
      } catch (err) {
        console.error(`Download failed for ${bg.src}:`, err.message);
        continue;
      }
    } else {
      console.log(`Already exists: ${localVideoPath}`);
    }
    // Generate thumbnail
    const thumbPath = path.join(thumbDir, `${bg.id}.jpg`);
    await new Promise((resolve, reject) => {
      ffmpeg(localVideoPath)
        .on('end', () => {
          console.log(`Thumbnail created: ${thumbPath}`);
          resolve();
        })
        .on('error', err => {
          console.error(`Error for ${bg.filename}:`, err.message);
          resolve(); // Continue to next video
        })
        .screenshots({
          timestamps: ['1'],
          filename: path.basename(thumbPath),
          folder: thumbDir,
          size: '640x360'
        });
    });
  }
  console.log('All done!');
})();
