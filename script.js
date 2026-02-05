document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.desktop-nav'); // reusing class for simplicity or add a mobile-nav class

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            const header = document.querySelector('header');
            header.classList.toggle('nav-open');

            // Prevent body scroll when menu is open
            document.body.style.overflow = header.classList.contains('nav-open') ? 'hidden' : 'auto';

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

    // Close menu when a link is clicked
    const navLinks = document.querySelectorAll('.desktop-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const header = document.querySelector('header');
            if (header.classList.contains('nav-open')) {
                header.classList.remove('nav-open');
                document.body.style.overflow = 'auto';
                const icon = mobileToggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    if (window.lucide) lucide.createIcons();
                }
            }
        });
    });

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

    // Sell Form Validation
    const sellForm = document.getElementById('sellForm');
    const attachmentInput = document.getElementById('attachment');
    const fileError = document.getElementById('file-error');
    const submitBtn = document.getElementById('submitBtn');

    if (attachmentInput && fileError) {
        attachmentInput.addEventListener('change', () => {
            const files = attachmentInput.files;
            let totalSize = 0;
            const maxSize = 10 * 1024 * 1024; // 10MB

            for (let i = 0; i < files.length; i++) {
                totalSize += files[i].size;
            }

            if (totalSize > maxSize) {
                fileError.style.display = 'block';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.style.opacity = '0.5';
                    submitBtn.style.cursor = 'not-allowed';
                }
            } else {
                fileError.style.display = 'none';
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    submitBtn.style.cursor = 'pointer';
                }
            }
        });
    }

    if (sellForm && submitBtn) {
        // Set _next dynamically to support local and production
        const nextInput = sellForm.querySelector('input[name="_next"]');
        if (nextInput) {
            nextInput.value = window.location.origin + window.location.pathname + "?success=true";
        }

        sellForm.addEventListener('submit', () => {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span style="display: flex; align-items: center; justify-content: center; gap: 8px;"><div class="loader" style="width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div> Submitting...</span>';
            submitBtn.style.opacity = '0.8';

            // Add spinner animation style if not exists
            if (!document.getElementById('spinner-style')) {
                const style = document.createElement('style');
                style.id = 'spinner-style';
                style.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
                document.head.appendChild(style);
            }
        });
    }

    // Success State Detection
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('success')) {
        const formContainer = document.getElementById('form-container');
        const successCard = document.getElementById('success-card');
        if (formContainer && successCard) {
            formContainer.style.display = 'none';
            successCard.style.display = 'block';
            successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
function sendWhatsApp(carName, year) {
    const phoneNumber = "263784624431";
    const yearText = year ? ` (${year})` : "";
    const text = encodeURIComponent(`Hi Zyamutala, I am interested in scheduling a test drive for the ${carName}${yearText}. Is it still available?`);
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, '_blank');
}

// FAQ Logic
function toggleFaq(element) {
    const isActive = element.classList.contains('active');

    // Close all other FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // Toggle clicked FAQ
    if (!isActive) {
        element.classList.add('active');
    }
}
