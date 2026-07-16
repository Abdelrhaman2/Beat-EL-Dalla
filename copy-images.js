const fs = require('fs');
const path = require('path');

const srcDir = 'd:\\Beat Dalla 2';
const destDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Map Arabic filenames in the folder to English output filenames
const files = fs.readdirSync(srcDir);

const mapping = {
  'بن شاهين.webp': 'shaheen.webp',
  'بن الدلة.webp': 'dalla.webp',
  'ستار كوفي.webp': 'star.webp',
  'موكا.webp': 'moka.webp',
  'اسبريسو.webp': 'espresso.webp'
};

files.forEach(file => {
  const matchedKey = Object.keys(mapping).find(key => file.includes(key));
  if (matchedKey) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, mapping[matchedKey]);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} -> ${mapping[matchedKey]}`);
  }
});

// Since the logo is the 'موكا.webp' (or Dalla House profile picture), we also copy it as logo.webp
const mokaFile = files.find(file => file.includes('موكا.webp'));
if (mokaFile) {
  fs.copyFileSync(path.join(srcDir, mokaFile), path.join(destDir, 'logo.webp'));
  console.log(`Copied ${mokaFile} -> logo.webp`);
}
