/* Génère les icônes PNG de l'app à partir des SVG de assets/logo/. */
const sharp = require('sharp');
const path = require('path');

const logoDir = path.join(__dirname, '..', 'assets', 'logo');
const outDir = path.join(__dirname, '..', 'assets', 'images');

async function render(svg, out, size) {
  await sharp(path.join(logoDir, svg))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(outDir, out));
  console.log('✔', out, `${size}x${size}`);
}

(async () => {
  await render('icon.svg', 'icon.png', 1024);
  await render('splash.svg', 'splash-icon.png', 1024);
  await render('adaptive-foreground.svg', 'android-icon-foreground.png', 1024);
  await render('icon.svg', 'favicon.png', 48);
  console.log('Icônes générées.');
})();
