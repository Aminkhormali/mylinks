const fs = require('fs');
const path = require('path');

const IMAGE_DIR = './images';
const TEMPLATE_FILE = './template.html';
const OUTPUT_FILE = './anthology.html';

function build() {
    console.log('--- Starting Anthology Build ---');
    
    if (!fs.existsSync(TEMPLATE_FILE)) {
        console.error("Error: template.html not found!");
        return;
    }

    if (!fs.existsSync(IMAGE_DIR)) {
        console.log("Images directory not found. Creating it...");
        fs.mkdirSync(IMAGE_DIR);
    }

    const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
    
    // Scan folders inside /images
    const folders = fs.readdirSync(IMAGE_DIR).filter(f => 
        fs.statSync(path.join(IMAGE_DIR, f)).isDirectory()
    ).sort().reverse(); 

    let htmlInjection = '';

    folders.forEach((folder, index) => {
        const folderPath = path.join(IMAGE_DIR, folder);
        const images = fs.readdirSync(folderPath).filter(img => /\.(jpg|jpeg|png|webp|gif)$/i.test(img));

        if (images.length === 0) return;

        // "2026-MED" -> Tag: "2026 | MED", Title: "MED"
        const tag = folder.replace('-', ' | ');
        const folderParts = folder.split('-');
        const title = folderParts.length > 1 ? folderParts.slice(1).join(' ').toUpperCase() : folder.toUpperCase();
        
        const albumId = `album${index + 1}`;
        const itemClass = `item-${(index % 5) + 1}`;

        const imgTags = images.map(img => 
            `<img src="images/${folder}/${img}" data-tag="${tag}" data-cap="Archive Entry: ${img.split('.')[0]}">`
        ).join('\n');

        htmlInjection += `
        <div class="album-trigger ${itemClass}" onclick="openCinema('${albumId}')">
            <img src="images/${folder}/${images[0]}">
            <div class="trigger-info"><span>ARCHIVE 0${index + 1}</span><h3>${title}</h3></div>
            <div id="${albumId}-data" style="display:none;">
                <div class="imgs">${imgTags}</div>
            </div>
        </div>`;
    });

    const result = template.replace(
        /([\s\S]*?)/,
        `\n${htmlInjection}\n`
    );

    fs.writeFileSync(OUTPUT_FILE, result);
    console.log(`Successfully generated ${OUTPUT_FILE}`);
    console.log('--- Build Complete ---');
}

// Run the build once
build();
