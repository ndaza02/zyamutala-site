const fs = require('fs');
const path = require('path');

const CARS_DIR = 'Cars';
const OUTPUT_FILE = 'market.html';
const DATA_FILE = 'all_cars_data.txt';
const IMAGES_FILE = 'all_images.txt';

// Read data files
const rawData = fs.readFileSync(DATA_FILE, 'utf8');
const rawImages = fs.readFileSync(IMAGES_FILE, 'utf8').split('\n').filter(Boolean);

// Parse Car Data
const cars = [];
let currentCar = null;

const lines = rawData.split('\n');
for (const line of lines) {
    if (line.startsWith('--- File:')) {
        if (currentCar) cars.push(currentCar);
        // Extract folder path from file path
        const match = line.match(/--- File: (.+) ---/);
        if (match) {
            const filePath = match[1];
            const dirPath = path.dirname(filePath);
            // Get relative path from current dir
            // Assuming the script is run from project root
            const relDir = path.relative(__dirname, dirPath);

            currentCar = {
                dir: relDir,
                name: path.basename(relDir), // Default name from folder
                text: [],
                details: {},
                isSold: false
            };
        }
    } else if (currentCar) {
        const trimmed = line.trim();
        if (trimmed) {
            currentCar.text.push(trimmed);

            // Parse Key-Value pairs loosely
            const lower = trimmed.toLowerCase();
            if (lower.includes('price:')) currentCar.details.price = trimmed.match(/Price:\s*(.+)/i)?.[1] || trimmed;
            if (lower.includes('mileage:') || lower.includes('mileage')) currentCar.details.mileage = trimmed.match(/Age:?\s*(.+)/i)?.[1] || trimmed.match(/(\d+\s*km)/i)?.[0] || trimmed;
            if (lower.includes('year') || trimmed.match(/^\d{4}$/)) currentCar.details.year = trimmed.match(/(\d{4})/)?.[1];
            if (lower.includes('trans')) currentCar.details.trans = trimmed.includes('Auto') ? 'Automatic' : 'Manual';
            if (lower.includes('location')) currentCar.details.location = trimmed.match(/Location:?\s*(.+)/i)?.[1];
            if (lower.includes('sold')) currentCar.isSold = true;
        }
    }
}
if (currentCar) cars.push(currentCar);

// Parse Images
const imageMap = {};
for (const imgPath of rawImages) {
    const relativePath = path.relative(__dirname, imgPath.trim());
    const dir = path.dirname(relativePath);
    if (!imageMap[dir]) imageMap[dir] = [];
    imageMap[dir].push(relativePath.replace(/\\/g, '/'));
}

// Map images to cars
for (const car of cars) {
    // We need to find the matching imageMap key. 
    // car.dir might be "Cars\BMW F30" or "Cars/BMW F30" depending on OS.
    // imageMap keys are relative paths.

    // Normalize paths for comparison
    const searchDir = car.dir.replace(/\\/g, '/');
    // Find images that start with this dir
    // Actually exact match is expected
    car.images = imageMap[searchDir] || [];

    // Fallback: try finding key that ends with the car folder name
    if (car.images.length === 0) {
        for (const k in imageMap) {
            if (k.replace(/\\/g, '/') === searchDir) {
                car.images = imageMap[k];
                break;
            }
        }
    }
}

// Generate HTML
let html = '';

// Helper to format price
function formatPrice(str) {
    if (!str) return 'Contact for Price';
    // cleaned
    const clean = str.replace(/[^\d]/g, '');
    if (!clean) return str;
    return '$' + parseInt(clean).toLocaleString();
}

cars.forEach((car, index) => {
    // Refine Details
    let price = car.details.price || '$0';
    // Clean price string
    if (car.text.find(l => l.includes('$'))) {
        const priceLine = car.text.find(l => l.includes('$'));
        const match = priceLine.match(/\$[\d,]+\s*(\w+)?/);
        if (match) price = match[0];
    }

    const mileage = car.details.mileage ? car.details.mileage.replace('Mileage:', '').trim() : 'N/A';
    const year = car.details.year || 'N/A';
    const trans = car.details.trans || 'N/A';
    const location = car.details.location || 'Bulawayo';
    const note = car.text.find(l => !l.includes('Price') && !l.includes('SOLD') && !l.includes('---') && l.length > 10) || 'Contact for details';

    const carId = `car-${index}`;
    const mainImg = car.images.find(i => i.toLowerCase().includes('main')) || car.images[0] || 'placeholder.jpg';

    const soldBadge = car.isSold ? '<span class="sold-badge">Sold</span>' : '';
    const btnClass = car.isSold ? 'btn btn-outline disabled' : 'btn btn-outline';
    const btnText = car.isSold ? 'Sold Out' : 'Schedule Test Drive';
    const imgFilter = car.isSold ? 'filter: grayscale(100%);' : '';

    // Thumbnails
    let thumbsHtml = '';
    // Take up to 4 images
    const thumbs = car.images.slice(0, 4);
    thumbs.forEach(img => {
        thumbsHtml += `<div class="thumb-img" onclick="changeImage('${carId}-main', '${img}')"><img src="${img}"></div>`;
    });

    html += `
    <div class="service-card" style="padding: 0; overflow: hidden; background: white;">
        ${soldBadge}
        <div style="padding: 1rem 1rem 0;">
            <div style="height: 250px; overflow: hidden; border-radius: 12px;">
                <img id="${carId}-main" src="${mainImg}" alt="${car.name}"
                    style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; ${imgFilter}">
            </div>
            <div class="thumb-grid">
                ${thumbsHtml}
            </div>
        </div>
        <div style="padding: 1.5rem;">
            <h4 style="font-size: 1.25rem; margin-bottom: 1rem;">${car.name}</h4>

            <div class="car-details-grid">
                <div class="detail-item"><span class="detail-label">Price</span><span class="detail-value">${price}</span></div>
                <div class="detail-item"><span class="detail-label">Mileage</span><span class="detail-value">${mileage.substring(0, 15)}</span></div>
                <div class="detail-item"><span class="detail-label">Year</span><span class="detail-value">${year}</span></div>
                <div class="detail-item"><span class="detail-label">Trans</span><span class="detail-value">${trans}</span></div>
                <div class="detail-item"><span class="detail-label">Zinara</span><span class="detail-value">Up-to-date</span></div>
                <div class="detail-item"><span class="detail-label">Location</span><span class="detail-value">${location}</span></div>
            </div>

            <div class="car-note">
                <span>Note</span>
                ${note.substring(0, 50)}...
            </div>

            <button class="${btnClass}" style="width: 100%;" onclick="sendWhatsApp('${car.name}')">${btnText}</button>
        </div>
    </div>
    `;
});

// Template Assembly
// We will read market.html, split by the cars-grid, and inject our html.
const originalHtml = fs.readFileSync('market.html', 'utf8');

// Find the insertion point
const startMarker = '<div class="cars-grid">';
const startIndex = originalHtml.indexOf(startMarker);

if (startIndex === -1) {
    console.error('Could not find .cars-grid in market.html');
    process.exit(1);
}

// Find the end of the cars-grid
// We know it is inside <main>, and <main> ends with </main>.
// The structure is <main> ... <div class="cars-grid"> ... </div> </main>
// So we can find </main> and find the last </div> before it.

const mainEndIndex = originalHtml.indexOf('</main>');
const endIndex = originalHtml.lastIndexOf('</div>', mainEndIndex);

if (endIndex === -1 || endIndex <= startIndex) {
    console.error('Could not find closing div for .cars-grid');
    process.exit(1);
}

const newContent = originalHtml.substring(0, startIndex + startMarker.length) +
    html +
    originalHtml.substring(endIndex);

fs.writeFileSync('market_updated.html', newContent);
console.log('Successfully generated market_updated.html with ' + cars.length + ' cars.');
