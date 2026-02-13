const fs = require('fs');
const path = require('path');

const CARS_DIR = 'Cars';
const MARKET_FILE = 'market.html';
const INDEX_FILE = 'index.html';
const TEMPLATE_FILE = 'car_details_template.html';
const INVENTORY_DIR = 'inventory';
const BASE_URL = 'https://zyamutala.co.zw'; // Update this if domain changes

// Ensure inventory directory exists
if (!fs.existsSync(INVENTORY_DIR)) {
    fs.mkdirSync(INVENTORY_DIR);
}

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
        else if (fullText.includes('hatchback') || fullText.includes('vits') || fullText.includes('fit') || fullText.includes('demio')) carData.type = 'Hatchback';
        else if (fullText.includes('bus') || fullText.includes('van') || fullText.includes('quantum')) carData.type = 'Van / Bus';
    }
    if (fullText.includes('diesel')) carData.fuel = 'Diesel';
    if (fullText.includes('hybrid')) carData.fuel = 'Hybrid';

    carData.isSold = isSold;

    // Map Images - IMPORTANT: Using relative paths for web
    // Current script is in root, Cars is in root.
    // For generated pages in inventory/, we need to go up one level: ../Cars/...
    const images = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f)).map(f => path.join(CARS_DIR, folder, f).replace(/\\/g, '/'));

    // Find main image
    let mainImg = images.find(img => img.toLowerCase().includes('main image')) || images[0] || 'assets/placeholder.png';

    // Other images for thumbnails (up to 4)
    const thumbs = images.filter(img => img !== mainImg).slice(0, 4);

    carData.mainImg = mainImg;
    carData.images = images;
    carData.thumbs = thumbs;

    // Generate Slug
    // Example: "Toyota Fortuner Epic" -> "toyota-fortuner-epic"
    let slug = carData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    // Ensure uniqueness if duplicates exist
    let duplicateCount = cars.filter(c => c.slug === slug).length;
    if (duplicateCount > 0) {
        slug = `${slug}-${duplicateCount + 1}`;
    }
    carData.slug = slug;
    carData.link = `${INVENTORY_DIR}/${slug}.html`;

    cars.push(carData);
});

// 2. Generate Individual Pages
const templateContent = fs.readFileSync(TEMPLATE_FILE, 'utf8');

cars.forEach(car => {
    let pageContent = templateContent;
    const numericPrice = parseInt(car.price.replace(/[^0-9]/g, '')) || 0;

    // SEO & Meta
    const metaTitle = `Buy ${car.name} in Bulawayo`;
    const metaDesc = `For Sale: ${car.name} - ${car.year} model. ${car.note.substring(0, 100)}... Available at Zyamutala.`;

    // Schema.org
    const schema = {
        "@context": "https://schema.org/",
        "@type": "Vehicle",
        "name": car.name,
        "image": `${BASE_URL}/${car.mainImg}`,
        "description": car.note,
        "bgref": car.trans,
        "vehicleConfiguration": car.type,
        "fuelType": car.fuel,
        "mileageFromOdometer": {
            "@type": "QuantitativeValue",
            "value": car.mileage,
            "unitCode": "KMT"
        },
        "vehicleModelDate": car.year,
        "offers": {
            "@type": "Offer",
            "url": `${BASE_URL}/${car.link}`,
            "priceCurrency": "USD",
            "price": numericPrice.toString(),
            "itemCondition": "https://schema.org/UsedCondition",
            "availability": car.isSold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
            "seller": {
                "@type": "AutoDealer",
                "name": "Zyamutala"
            }
        }
    };

    // Replacements
    pageContent = pageContent.replace(/{{META_TITLE}}/g, metaTitle);
    pageContent = pageContent.replace(/{{META_DESCRIPTION}}/g, metaDesc);
    pageContent = pageContent.replace(/{{OG_IMAGE}}/g, `${BASE_URL}/${car.mainImg}`);
    pageContent = pageContent.replace(/{{PAGE_URL}}/g, `${BASE_URL}/${car.link}`);
    pageContent = pageContent.replace(/{{SCHEMA_JSON}}/g, `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`);
    pageContent = pageContent.replace(/{{CAR_NAME}}/g, car.name);
    pageContent = pageContent.replace(/{{CAR_PRICE}}/g, car.price);
    pageContent = pageContent.replace(/{{MILEAGE}}/g, car.mileage);
    pageContent = pageContent.replace(/{{YEAR}}/g, car.year);
    pageContent = pageContent.replace(/{{TRANS}}/g, car.trans);
    pageContent = pageContent.replace(/{{FUEL}}/g, car.fuel);
    pageContent = pageContent.replace(/{{TYPE}}/g, car.type);
    pageContent = pageContent.replace(/{{LOCATION}}/g, car.location);
    pageContent = pageContent.replace(/{{NOTE}}/g, car.note);

    // Image Paths for generated pages need to go up one level (../)
    const mainImgRelative = `../${car.mainImg}`;
    pageContent = pageContent.replace(/{{MAIN_IMG_SRC}}/g, mainImgRelative);

    let thumbsHtml = '';
    // Includes main image as first thumb
    const pageThumbs = [car.mainImg, ...car.images.filter(i => i !== car.mainImg)].slice(0, 10); // Show more thumbs on detail page
    pageThumbs.forEach(img => {
        thumbsHtml += `<div class="thumb-item" onclick="changeMainImage('../${img}')"><img src="../${img}" onerror="this.onerror=null;this.src='../assets/placeholder.png';"></div>`;
    });
    pageContent = pageContent.replace(/{{GALLERY_THUMBS}}/g, thumbsHtml);

    // Buttons / Logic
    const soldBadge = car.isSold ? '<div style="background:red; color:white; padding:5px 10px; display:inline-block; border-radius:4px; margin-bottom:10px;">SOLD</div>' : '';
    pageContent = pageContent.replace(/{{SOLD_BADGE}}/g, soldBadge);

    const btnText = car.isSold ? 'Sold Out' : 'Schedule Test Drive';
    const whatsappAction = car.isSold ? "return false;" : `sendWhatsApp('${car.name}', '${car.year}')`;
    pageContent = pageContent.replace(/{{BTN_TEXT}}/g, btnText);
    pageContent = pageContent.replace(/{{WHATSAPP_ACTION}}/g, whatsappAction);

    // Save File
    fs.writeFileSync(car.link, pageContent);
});
console.log(`Generated ${cars.length} individual car pages in ${INVENTORY_DIR}/`);


// 3. Generate Sitemap
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${BASE_URL}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${BASE_URL}/${MARKET_FILE}</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
${cars.map(c => `    <url>
        <loc>${BASE_URL}/${c.link}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`).join('\n')}
</urlset>`;

fs.writeFileSync('sitemap.xml', sitemapContent);
console.log('Generated sitemap.xml');


// 4. Update Market and Index HTML (Linking to new pages)
// Helper to generate a single car card HTML
function generateCarCard(car, index, isHome = false) {
    const carId = isHome ? `home-car-${index}` : `car-${index}`;
    const soldBadge = car.isSold ? '<span class="sold-badge">Sold</span>' : '';
    // If sold, we might still want to allow viewing the page, or keep it disabled?
    // User requested "change cta ... to SEE MORE".
    // Let's make it "SEE MORE" for available, and keep "Sold Out" for sold.
    // But let's make the Sold Out button also link to the page so they can see it?
    // Standard pattern: Sold items often just stay sold.
    // I'll assume only Available cars get "SEE MORE".

    // Logic:
    // Available: Text "SEE MORE", Link to detail page, Primary Style
    // Sold: Text "Sold Out", Link to detail page (why not?), Outline Style

    // Actually, user said: "when someone clicks on the see more it takes them to the html product page"
    // So ONLY "SEE MORE" needs to link.

    const isSold = car.isSold;
    const detailLink = car.link;

    // Button Logic
    let btnHtml;
    if (isSold) {
        btnHtml = `<button class="btn btn-outline disabled" style="width: 100%;">Sold Out</button>`;
    } else {
        btnHtml = `<a href="${detailLink}" class="btn btn-primary" style="width: 100%; justify-content: center;">SEE MORE</a>`;
    }

    const imgFilter = car.isSold ? 'filter: grayscale(100%);' : '';

    let thumbsHtml = '';
    const allThumbs = [car.mainImg, ...car.thumbs].slice(0, 4);
    allThumbs.forEach(img => {
        thumbsHtml += `<div class="thumb-img" onclick="changeImage('${carId}-main', '${img}'); event.preventDefault(); event.stopPropagation();"><img src="${img}" onerror="this.onerror=null;this.src='assets/placeholder.png';"></div>`;
    });

    const numericPrice = parseInt(car.price.replace(/[^0-9]/g, '')) || 0;

    return `
    <div class="service-card" style="padding: 0; overflow: hidden; background: white;" 
        data-type="${car.type}" data-fuel="${car.fuel}" data-trans="${car.trans}" data-price="${numericPrice}">
        ${soldBadge}
        <div style="padding: 1rem 1rem 0;">
            <!-- Wrap Image in Link -->
            <a href="${detailLink}" style="display:block;">
                <div style="height: 250px; overflow: hidden; border-radius: 12px;">
                    <img id="${carId}-main" src="${car.mainImg}" alt="${car.name}"
                        style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; ${imgFilter}" onerror="this.onerror=null;this.src='assets/placeholder.png';">
                </div>
            </a>
            <div class="thumb-grid">
                ${thumbsHtml}
            </div>
        </div>
        <div style="padding: 1.5rem;">
            <a href="${detailLink}">
                <h4 style="font-size: 1.25rem; margin-bottom: 1rem;">${car.name}</h4>
            </a>
            
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

            ${btnHtml}
        </div>
    </div>
    `;
}

// 5. Inject into market.html
const marketCarsHtml = cars.map((car, i) => generateCarCard(car, i)).join('\n');
injectHtml(MARKET_FILE, '<div class="cars-grid">', marketCarsHtml);

// 6. Inject into index.html (Featured Vehicles - 6 Available)
const availableCars = cars.filter(c => !c.isSold).slice(0, 6);
const homeCarsHtml = availableCars.map((car, i) => generateCarCard(car, i, true)).join('\n');
injectHtml(INDEX_FILE, '<div class="featured-grid">', homeCarsHtml, true);

function injectHtml(filePath, startMarker, content, isHome = false) {
    const originalHtml = fs.readFileSync(filePath, 'utf8');
    let startIndex = originalHtml.indexOf(startMarker);

    if (startIndex === -1) {
        console.error(`Could not find ${startMarker} in ${filePath}`);
        return;
    }

    const splitPoint = startIndex + startMarker.length;

    // Find the end marker (closing div of the grid)
    let searchEndIndex = isHome ? originalHtml.indexOf('<!-- Testimonials Section -->') : originalHtml.indexOf('</main>');

    if (isHome) {
        // In index.html, we need to find the closing div of the featured-grid
        let endPos = originalHtml.lastIndexOf('</div>', searchEndIndex); // container close
        endPos = originalHtml.lastIndexOf('</div>', endPos - 1); // featured-grid close

        const finalHtml = originalHtml.substring(0, splitPoint) + '\n' + content + '\n' + originalHtml.substring(endPos);
        fs.writeFileSync(filePath, finalHtml);
    } else {
        // In market.html, it's simpler
        const gridEndIndex = originalHtml.lastIndexOf('</div>', searchEndIndex);
        const finalHtml = originalHtml.substring(0, splitPoint) + '\n' + content + '\n' + originalHtml.substring(gridEndIndex);
        fs.writeFileSync(filePath, finalHtml);
    }

    console.log(`Successfully updated ${filePath}`);
}
