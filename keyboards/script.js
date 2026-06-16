// Intersection Observer para animaciones
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

// FAQ Toggle
function toggleFaq(element) {
    const content = element.nextElementSibling;
    const icon = element.querySelector('.icon-toggle');

    content.classList.toggle('open');
    icon.classList.toggle('open');
}

// Newsletter
function handleNewsletter(e) {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    alert(`¡Gracias por suscribirse! Te enviaremos actualizaciones a ${email}`);
    e.target.reset();
}

// Añadir al carrito (mock)
document.querySelectorAll('.btn').forEach(btn => {
    if (btn.textContent.includes('Añadir al carrito')) {
        btn.addEventListener('click', function() {
            const productName = this.closest('.card').querySelector('h3').textContent;
            alert(`${productName} añadido al carrito 🛒`);
        });
    }
});