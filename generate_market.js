const fs = require('fs');
const path = require('path');

const CARS_DIR = 'Cars';
const MARKET_FILE = 'market.html';
const INDEX_FILE = 'index.html';

// 1. Discover all car folders
const folders = fs.readdirSync(CARS_DIR).filter(f => {
    return fs.statSync(path.join(CARS_DIR, f)).isDirectory();
});

console.log(`Found ${folders.length} car folders.`);

const cars = [];

folders.forEach(folder => {
    const folderPath = path.join(CARS_DIR, folder);
    const files = fs.readdirSync(folderPath);

    // Identify status from folder name
    let isSold = folder.toUpperCase().includes('SOLD');

    // Find the text file (any .txt file)
    const txtFile = files.find(f => f.toLowerCase().endsWith('.txt'));
    let carData = {
        name: folder.split('-')[0].trim(),
        price: 'Contact for Price',
        mileage: 'N/A',
        year: 'N/A',
        trans: 'N/A',
        type: 'Other',
        fuel: 'Petrol',
        location: 'Bulawayo',
        note: 'Contact for more details',
        isSold: isSold
    };

    if (txtFile) {
        const content = fs.readFileSync(path.join(folderPath, txtFile), 'utf8');
        const lines = content.split('\n');

        lines.forEach(line => {
            const lower = line.toLowerCase().trim();
            if (lower.startsWith('name:')) carData.name = line.split(':')[1].trim();
            if (lower.startsWith('price:')) carData.price = line.split(':')[1].trim();
            if (lower.startsWith('mileage:')) carData.mileage = line.split(':')[1].trim();
            if (lower.startsWith('year:')) carData.year = line.split(':')[1].trim();
            if (lower.startsWith('transmission:')) carData.trans = line.split(':')[1].trim();
            if (lower.startsWith('type:')) carData.type = line.split(':')[1].trim();
            if (lower.startsWith('fuel:')) carData.fuel = line.split(':')[1].trim();
            if (lower.startsWith('location:')) carData.location = line.split(':')[1].trim();
            if (lower.startsWith('status:')) {
                if (line.split(':')[1].trim().toUpperCase() === 'SOLD') isSold = true;
            }
            if (lower.startsWith('read more:')) carData.note = line.split(':')[1].trim();
        });
    }

    // Inference if missing
    const fullText = (carData.name + ' ' + carData.note).toLowerCase();
    if (carData.type === 'Other') {
        if (fullText.includes('suv')) carData.type = 'SUV';
        else if (fullText.includes('sedan')) carData.type = 'Sedan';
        else if (fullText.includes('truck') || fullText.includes('bakkie') || fullText.includes('canter') || fullText.includes('atlas')) carData.type = 'Truck';
        else if (fullText.includes('hatchback') || fullText.includes('vits') || fullText.includes('fit')) carData.type = 'Hatchback';
    }
    if (fullText.includes('diesel')) carData.fuel = 'Diesel';
    if (fullText.includes('hybrid')) carData.fuel = 'Hybrid';

    carData.isSold = isSold;

    // Map Images
    const images = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f)).map(f => path.join(CARS_DIR, folder, f).replace(/\\/g, '/'));

    // Find main image
    let mainImg = images.find(img => img.toLowerCase().includes('main image')) || images[0] || 'assets/placeholder.jpg';

    // Other images for thumbnails (up to 4)
    const thumbs = images.filter(img => img !== mainImg).slice(0, 4);

    carData.mainImg = mainImg;
    carData.images = images;
    carData.thumbs = thumbs;

    cars.push(carData);
});

// Helper to generate a single car card HTML
function generateCarCard(car, index, isHome = false) {
    const carId = isHome ? `home-car-${index}` : `car-${index}`;
    const soldBadge = car.isSold ? '<span class="sold-badge">Sold</span>' : '';
    const btnClass = car.isSold ? 'btn btn-outline disabled' : 'btn btn-outline';
    const btnText = car.isSold ? 'Sold Out' : (isHome ? 'Schedule Test Drive' : 'Schedule Test Drive');
    const imgFilter = car.isSold ? 'filter: grayscale(100%);' : '';

    let thumbsHtml = '';
    const allThumbs = [car.mainImg, ...car.thumbs].slice(0, 4);
    allThumbs.forEach(img => {
        thumbsHtml += `<div class="thumb-img" onclick="changeImage('${carId}-main', '${img}')"><img src="${img}"></div>`;
    });

    const numericPrice = parseInt(car.price.replace(/[^0-9]/g, '')) || 0;

    return `
    <div class="service-card" style="padding: 0; overflow: hidden; background: white;" 
        data-type="${car.type}" data-fuel="${car.fuel}" data-trans="${car.trans}" data-price="${numericPrice}">
        ${soldBadge}
        <div style="padding: 1rem 1rem 0;">
            <div style="height: 250px; overflow: hidden; border-radius: 12px;">
                <img id="${carId}-main" src="${car.mainImg}" alt="${car.name}"
                    style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; ${imgFilter}">
            </div>
            <div class="thumb-grid">
                ${thumbsHtml}
            </div>
        </div>
        <div style="padding: 1.5rem;">
            <h4 style="font-size: 1.25rem; margin-bottom: 1rem;">${car.name}</h4>

            <div class="car-details-grid">
                <div class="detail-item"><span class="detail-label">Price</span><span class="detail-value">${car.price}</span></div>
                <div class="detail-item"><span class="detail-label">Mileage</span><span class="detail-value">${car.mileage}</span></div>
                <div class="detail-item"><span class="detail-label">Year</span><span class="detail-value">${car.year}</span></div>
                <div class="detail-item"><span class="detail-label">Trans</span><span class="detail-value">${car.trans}</span></div>
                <div class="detail-item"><span class="detail-label">Type</span><span class="detail-value">${car.type}</span></div>
                <div class="detail-item"><span class="detail-label">Location</span><span class="detail-value">${car.location}</span></div>
            </div>

            <div class="car-note">
                <span>Note</span>
                ${car.note}
            </div>

            <button class="${btnClass}" style="width: 100%;" onclick="sendWhatsApp('${car.name}', '${car.year}')">${btnText}</button>
        </div>
    </div>
    `;
}

// 2. Generate and Inject into market.html
const marketCarsHtml = cars.map((car, i) => generateCarCard(car, i)).join('\n');
injectHtml(MARKET_FILE, '<div class="cars-grid">', marketCarsHtml);

// 3. Generate and Inject into index.html (Featured Vehicles - 6 Available)
const availableCars = cars.filter(c => !c.isSold).slice(0, 6);
const homeCarsHtml = availableCars.map((car, i) => generateCarCard(car, i, true)).join('\n');
injectHtml(INDEX_FILE, '<div class="services-grid">', homeCarsHtml, true); // Search for the second occurrence or handle specifically

function injectHtml(filePath, startMarker, content, isHome = false) {
    const originalHtml = fs.readFileSync(filePath, 'utf8');
    let startIndex = originalHtml.indexOf(startMarker);

    if (isHome) {
        // For index.html, the first .services-grid is "Why Zimbabwe Trusts Zyamutala"
        // The second one is "Featured Vehicles"
        startIndex = originalHtml.indexOf(startMarker, startIndex + startMarker.length);
    }

    if (startIndex === -1) {
        console.error(`Could not find ${startMarker} in ${filePath}`);
        return;
    }

    const splitPoint = startIndex + startMarker.length;

    // Find the end marker (closing div of the grid)
    // We assume the grid content ends before the next major section or footer
    let endMarker = isHome ? '</section>' : '</div>';
    let searchEndIndex = isHome ? originalHtml.indexOf('<!-- Testimonials Section -->') : originalHtml.indexOf('</main>');

    if (isHome) {
        // In index.html, the featured section ends before Testimonials
        const featuredSectionEnd = originalHtml.lastIndexOf('</div>', searchEndIndex);
        const finalHtml = originalHtml.substring(0, splitPoint) + '\n' + content + '\n' + originalHtml.substring(featuredSectionEnd);
        fs.writeFileSync(filePath, finalHtml);
    } else {
        // In market.html, it's simpler
        const gridEndIndex = originalHtml.lastIndexOf('</div>', searchEndIndex);
        const finalHtml = originalHtml.substring(0, splitPoint) + '\n' + content + '\n' + originalHtml.substring(gridEndIndex);
        fs.writeFileSync(filePath, finalHtml);
    }

    console.log(`Successfully updated ${filePath}`);
}
