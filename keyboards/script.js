// ── Intersection Observer para animaciones de scroll ──
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in-on-scroll, .stagger-item').forEach(el => {
    observer.observe(el);
});

// ── Menú hamburguesa (móvil) ──
function toggleMenu() {
    const menu   = document.getElementById('mobile-menu');
    const btn    = document.getElementById('hamburger-btn');
    const isOpen = menu.classList.toggle('open');

    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
}

// Cierra el menú si el usuario hace clic fuera
document.addEventListener('click', function(e) {
    const menu = document.getElementById('mobile-menu');
    const btn  = document.getElementById('hamburger-btn');
    if (menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    }
});

// Cierra el menú al hacer resize a desktop
window.addEventListener('resize', function() {
    if (window.innerWidth >= 768) {
        const menu = document.getElementById('mobile-menu');
        const btn  = document.getElementById('hamburger-btn');
        menu.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    }
});

// ── FAQ Toggle ──
function toggleFaq(element) {
    const content = element.nextElementSibling;
    const icon    = element.querySelector('.icon-toggle');

    content.classList.toggle('open');
    icon.classList.toggle('open');
}

// ── Newsletter ──
function handleNewsletter(e) {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    alert(`¡Gracias por suscribirse! Te enviaremos actualizaciones a ${email}`);
    e.target.reset();
}

// ── Añadir al carrito (mock) ──
document.querySelectorAll('.btn').forEach(btn => {
    if (btn.textContent.trim() === 'Añadir al carrito') {
        btn.addEventListener('click', function() {
            const productName = this.closest('.card').querySelector('h3').textContent;
            alert(`${productName} añadido al carrito 🛒`);
        });
    }
});