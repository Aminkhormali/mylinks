const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGE_DIR = './images';
const TEMPLATE_FILE = './template.html';
const OUTPUT_FILE = './anthology.html';

async function build() {
    console.log('--- Starting Optimized Anthology Build ---');
    
    if (!fs.existsSync(TEMPLATE_FILE)) {
        console.error("Error: template.html not found!");
        process.exit(1);
    }

    const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
    const folders = fs.readdirSync(IMAGE_DIR).filter(f => 
        fs.statSync(path.join(IMAGE_DIR, f)).isDirectory()
    ).sort().reverse(); 

    let htmlInjection = '';

    for (const [index, folder] of folders.entries()) {
        const folderPath = path.join(IMAGE_DIR, folder);
        const rawImages = fs.readdirSync(folderPath).filter(img => /\.(jpg|jpeg|png|webp|gif|heif|heic)$/i.test(img));

        if (rawImages.length === 0) continue;

        const processedImages = [];

        for (const img of rawImages) {
            const ext = path.extname(img).toLowerCase();
            const isHeif = ext === '.heif' || ext === '.heic';
            const newName = isHeif ? img.replace(/\.(heif|heic)$/i, '.webp') : img;
            const inputPath = path.join(folderPath, img);
            const outputPath = path.join(folderPath, newName);

            // Logic: Convert HEIF OR Optimize existing images if they are huge
            if (isHeif || !img.endsWith('.webp')) {
                const finalWebpName = img.split('.')[0] + '.webp';
                const finalOutputPath = path.join(folderPath, finalWebpName);

                if (!fs.existsSync(finalOutputPath)) {
                    console.log(`Optimizing & Converting: ${img}`);
                    try {
                        await sharp(inputPath)
                            .rotate() 
                            .webp({ quality: 80, effort: 6 }) // Optimization settings
                            .toFile(finalOutputPath);
                        processedImages.push(generateMetaData(finalWebpName));
                    } catch (err) {
                        console.error(`Failed to process ${img}:`, err);
                    }
                } else {
                    processedImages.push(generateMetaData(finalWebpName));
                }
            } else {
                processedImages.push(generateMetaData(img));
            }
        }

        const galleryTitle = folder.replace(/-/g, ' ').toUpperCase();
        const albumId = `album${index + 1}`;
        const itemClass = `item-${(index % 5) + 1}`;

        const imgTags = processedImages.map(data => 
            `<img src="images/${folder}/${data.file}" data-tag="${data.date} • ${data.tag}" data-cap="${data.caption}">`
        ).join('\n');

        htmlInjection += `
        <div class="album-trigger ${itemClass}" onclick="openCinema('${albumId}')">
            <img src="images/${folder}/${processedImages[0].file}">
            <div class="trigger-info">
                <span>PROJECT 0${index + 1}</span>
                <h3>${galleryTitle}</h3>
            </div>
            <div id="${albumId}-data" style="display:none;">
                <div class="imgs">${imgTags}</div>
            </div>
        </div>`;
    }

    const result = template.replace(
        /<main class="archive-float">([\s\S]*?)<\/main>/,
        `<main class="archive-float">\n${htmlInjection}\n</main>`
    );

    fs.writeFileSync(OUTPUT_FILE, result);
    console.log(`Build Complete. Check ${OUTPUT_FILE}`);
}

// Helper to parse: Date-Tag-Caption
function generateMetaData(fileName) {
    const nameClean = fileName.replace(/\.[^/.]+$/, "");
    const parts = nameClean.split('-'); 
    return {
        file: fileName,
        date: parts[0] || "2026",
        tag: parts[1] || "Research",
        caption: parts.slice(2).join(' ') || "Visual Analysis"
    };
}

build();
