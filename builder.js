const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGE_DIR = './images';
const TEMPLATE_FILE = './template.html';
const OUTPUT_FILE = './anthology.html';

async function build() {
    console.log('--- Starting Anthology Build ---');
    
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

        const processedImages = await Promise.all(rawImages.map(async (img) => {
            const ext = path.extname(img).toLowerCase();
            let currentName = img;
            
            if (ext === '.heif' || ext === '.heic') {
                const newName = img.replace(/\.(heif|heic)$/i, '.webp');
                const inputPath = path.join(folderPath, img);
                const outputPath = path.join(folderPath, newName);

                if (!fs.existsSync(outputPath)) {
                    await sharp(inputPath).rotate().toFormat('webp').toFile(outputPath);
                }
                currentName = newName;
            }

            // Filename Parsing Logic: Date-Tag-Caption.ext
            // Expects: "2024-Research-Visualizing Neural Networks"
            const nameWithoutExt = currentName.replace(/\.[^/.]+$/, "");
            const parts = nameWithoutExt.split('-'); 
            
            return {
                file: currentName,
                date: parts[0] || "Recent",
                tag: parts[1] || "General",
                caption: parts.slice(2).join(' ') || "Untitled Analysis"
            };
        }));

        // Folder name is the Archive Title (e.g., "AI-DENTISTRY")
        const albumTitle = folder.replace(/-/g, ' ').toUpperCase();
        const albumId = `album${index + 1}`;
        const itemClass = `item-${(index % 5) + 1}`;

        const imgTags = processedImages.map(data => 
            `<img src="images/${folder}/${data.file}" data-tag="${data.date} | ${data.tag}" data-cap="${data.caption}">`
        ).join('\n');

        htmlInjection += `
        <div class="album-trigger ${itemClass}" onclick="openCinema('${albumId}')">
            <img src="images/${folder}/${processedImages[0].file}">
            <div class="trigger-info">
                <span>PROJECT 0${index + 1}</span>
                <h3>${albumTitle}</h3>
            </div>
            <div id="${albumId}-data" style="display:none;">
                <div class="imgs">${imgTags}</div>
            </div>
        </div>`;
    }

    const result = template.replace('<main class="archive-float">', `<main class="archive-float">\n${htmlInjection}`);

    fs.writeFileSync(OUTPUT_FILE, result);
    console.log(`Build Complete: ${OUTPUT_FILE}`);
}

build();
