document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.desktop-nav'); // reusing class for simplicity or add a mobile-nav class

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            const header = document.querySelector('header');
            header.classList.toggle('nav-open');

            // Optional: Toggle icon (menu <-> x)
            const icon = mobileToggle.querySelector('i');
            if (header.classList.contains('nav-open')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            if (window.lucide) lucide.createIcons();
        });
    }

    // Scroll Animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        el.style.opacity = '0';
        el.classList.add('animate'); // trigger css animation
        // Actually, let's use the observer to add the class
        el.classList.remove('animate');
        observer.observe(el);
    });

    // Commission Calculator
    const priceInput = document.getElementById('asking-price');
    const resultDisplay = document.getElementById('commission-result');
    const netDisplay = document.getElementById('net-result');

    if (priceInput && resultDisplay) {
        priceInput.addEventListener('input', (e) => {
            const price = parseFloat(e.target.value);
            if (!isNaN(price) && price > 0) {
                const commission = price * 0.05;
                const net = price - commission;
                resultDisplay.textContent = `$${commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                if (netDisplay) {
                    netDisplay.textContent = `$${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
            } else {
                resultDisplay.textContent = '$0.00';
                if (netDisplay) netDisplay.textContent = '$0.00';
            }
        });
    }

    // Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }
});

// Image Gallery Logic
function changeImage(mainImageId, newSrc) {
    const mainImg = document.getElementById(mainImageId);
    if (mainImg) {
        // Simple fade effect
        mainImg.style.opacity = '0.5';
        setTimeout(() => {
            mainImg.src = newSrc;
            mainImg.style.opacity = '1';
        }, 150);
    }
}

// WhatsApp Integration
function sendWhatsApp(carName) {
    const phoneNumber = "263784624431";
    const text = encodeURIComponent(`Hi Zyamutala, I am interested in scheduling a test drive for the ${carName}. Is it still available?`);
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');
}
