const fs = require('fs');
const path = require('path');

const srcDir = 'd:\\Beat Dalla 2\\New folder';
const destDir = path.join(__dirname, 'public', 'images', 'slideshow');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = [
  '2acbe0ae-be06-47ba-a280-826a4c98f134.webp',
  '7756a25a-be04-491b-907d-1b11de0f4177.webp',
  '8444020c-4df7-49a3-a809-1ed2d85af43c.webp',
  'c63d2c65-32d5-45dc-8234-a7de58d186e3.webp',
  'f35b8eab-7651-44ea-9d2a-a024e5b8ff11.webp'
];

files.forEach((file, index) => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, `slide${index + 1}.webp`);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} -> slide${index + 1}.webp`);
  } else {
    console.error(`File not found: ${srcPath}`);
  }
});
