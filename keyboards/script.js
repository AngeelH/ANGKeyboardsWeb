document.documentElement.classList.remove('no-js');

// ── Precarga de imágenes de producto ──
// Descarga y decodifica las 5 imágenes al entrar, para que el carrusel y las
// tarjetas nunca se pinten vacías al deslizar.
const PRODUCT_IMAGES = [1, 2, 3, 4, 5].map(n => `imagenes/Producto00${n}.png`);

PRODUCT_IMAGES.forEach(src => {
    const img = new Image();
    img.src = src;
    img.decode().catch(() => {});
});

// Marca el contenedor como listo cuando su imagen ya está decodificada
function markWhenReady(img, container) {
    const ready = () => container.classList.add('img-ready');
    if (img.complete && img.naturalWidth) {
        img.decode().then(ready, ready);
    } else {
        img.addEventListener('load', () => img.decode().then(ready, ready), { once: true });
        img.addEventListener('error', ready, { once: true });
    }
}

document.querySelectorAll('.carousel3d-card img').forEach(img => markWhenReady(img, img.closest('.carousel3d-card')));
document.querySelectorAll('.product-card .product-img-wrap img').forEach(img => markWhenReady(img, img.parentElement));

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

// ── FAQ acordeón (una tarjeta abierta a la vez) ──
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const card   = btn.closest('.faq-card');
        const isOpen = card.classList.contains('open');

        document.querySelectorAll('.faq-card.open').forEach(c => {
            c.classList.remove('open');
            c.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
            card.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
        }
    });
});

// ── Newsletter (CTA club ANG) ──
(function initNewsletter() {
    const form  = document.getElementById('cta-form');
    if (!form) return;
    const input = form.querySelector('input');
    const hint  = document.getElementById('cta-hint');
    const defaultHint = hint.textContent;

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (!input.checkValidity()) {
            form.classList.remove('invalid');
            void form.offsetWidth;  // reinicia la animación de error
            form.classList.add('invalid');
            hint.textContent = 'Ingresa un correo válido, por ejemplo tu@correo.com';
            input.focus();
            return;
        }
        form.classList.remove('invalid');
        form.classList.add('success');
        hint.textContent = `Te escribiremos a ${input.value}`;
        input.disabled = true;
        form.querySelector('button').disabled = true;
    });

    input.addEventListener('input', () => {
        if (form.classList.contains('invalid')) {
            form.classList.remove('invalid');
            hint.textContent = defaultHint;
        }
    });
})();

// ── Añadir al carrito (mock) ──
document.querySelectorAll('.btn').forEach(btn => {
    if (btn.textContent.trim() === 'Añadir al carrito' && btn.closest('.card')) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();  // no abrir la vista rápida
            const productName = this.closest('.card').querySelector('h3').textContent;
            alert(`${productName} añadido al carrito 🛒`);
        });
    }
});

// ── Carrusel 3D con efecto typewriter ──
(function initCarousel3D() {
    const stage = document.getElementById('carousel3d-stage');
    if (!stage) return;

    const cards  = Array.from(stage.querySelectorAll('.carousel3d-card'));
    const nameEl = document.getElementById('carousel3d-name');
    const descEl = document.getElementById('carousel3d-desc');
    const dotsEl = document.getElementById('carousel3d-dots');
    const total  = cards.length;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current  = 0;
    let typingTimer = null;
    let autoplayTimer = null;
    const AUTOPLAY_DELAY = 10000;

    // Puntos de navegación
    const dots = cards.map((card, i) => {
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Ver ${card.dataset.name}`);
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
        return dot;
    });

    // Distancia circular más corta entre la tarjeta y la activa (-2..2)
    function offsetOf(i) {
        let d = i - current;
        if (d > total / 2)  d -= total;
        if (d < -total / 2) d += total;
        return d;
    }

    function layout() {
        cards.forEach((card, i) => {
            const d   = offsetOf(i);
            const abs = Math.abs(d);
            card.style.transform =
                `translateX(calc(var(--spread) * ${d})) ` +
                `translateZ(${-abs * 220}px) ` +
                `rotateY(${-d * 38}deg) ` +
                `scale(${1 - abs * 0.14})`;
            card.style.opacity = abs === 0 ? 1 : abs === 1 ? 0.6 : 0.22;
            card.style.filter  = abs === 0 ? 'none' : `brightness(${1 - abs * 0.06}) blur(${abs * 0.6}px)`;
            card.style.zIndex  = 10 - abs;
            card.classList.toggle('is-active', abs === 0);
            card.setAttribute('aria-hidden', abs !== 0);
        });
        dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
        typeCaption(cards[current].dataset.name, cards[current].dataset.desc);
    }

    // Escribe nombre y luego descripción carácter por carácter
    function typeCaption(name, desc) {
        clearTimeout(typingTimer);
        clearTimeout(autoplayTimer);
        if (reduceMotion) {
            nameEl.textContent = name;
            descEl.textContent = desc;
            scheduleAutoplay();
            return;
        }
        nameEl.textContent = '';
        descEl.textContent = '';
        const queue = [[nameEl, name, 55], [descEl, desc, 18]];
        let q = 0, c = 0;

        (function step() {
            const [el, text, speed] = queue[q];
            el.textContent = text.slice(0, ++c);
            if (c >= text.length) {
                q++; c = 0;
                if (q >= queue.length) return scheduleAutoplay();
                typingTimer = setTimeout(step, 180);
                return;
            }
            typingTimer = setTimeout(step, speed);
        })();
    }

    // Avanza al siguiente producto 10 s después de terminar la escritura.
    // Toda navegación pasa por goTo → typeCaption, que limpia este timer.
    function scheduleAutoplay() {
        clearTimeout(autoplayTimer);
        autoplayTimer = setTimeout(() => goTo(current + 1), AUTOPLAY_DELAY);
    }

    function goTo(i) {
        current = (i + total) % total;
        layout();
    }

    document.getElementById('carousel3d-prev').addEventListener('click', () => goTo(current - 1));
    document.getElementById('carousel3d-next').addEventListener('click', () => goTo(current + 1));

    // Clic en tarjetas adyacentes
    cards.forEach((card, i) => card.addEventListener('click', () => {
        if (!dragMoved && i !== current) goTo(i);
    }));

    // Arrastre / swipe lateral
    let startX = null, dragMoved = false;
    stage.addEventListener('pointerdown', e => {
        startX = e.clientX;
        dragMoved = false;
        stage.classList.add('dragging');
    });
    window.addEventListener('pointerup', e => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 40) {
            dragMoved = true;
            goTo(current + (dx < 0 ? 1 : -1));
        }
        startX = null;
        stage.classList.remove('dragging');
    });

    // Flechas del teclado
    document.getElementById('carousel3d').addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
    });

    layout();
})();


// ── Vista rápida de producto (modal) ──
const PRODUCT_DETAILS = {
    p1: {
        desc: 'El ANG Aurora combina un formato 75% con una perilla multifunción y una pantalla integrada para ver hora, batería y perfiles. Sus switches silenciosos pre-lubricados y la espuma interna de cinco capas reducen el ruido sin perder precisión.',
        specs: { 'Conectividad': 'USB-C · Bluetooth 5.1 · 2.4 GHz', 'Batería': '4000 mAh · 150 h', 'Peso': '1.05 kg', 'Material del chasis': 'Policarbonato + placa de aluminio', 'Switches': 'Silenciosos 45 g', 'Layout': '75% · 81 teclas' }
    },
    p2: {
        desc: 'El ANG Crimson lleva el formato 65% al límite con keycaps PBT de grabado topográfico en negro y rojo. Switches táctiles con un bump claro en cada pulsación, ideales para escribir con ritmo.',
        specs: { 'Conectividad': 'USB-C · Bluetooth 5.0', 'Batería': '3000 mAh · 120 h', 'Peso': '720 g', 'Material del chasis': 'Aluminio CNC anodizado', 'Switches': 'Táctiles 55 g', 'Layout': '65% · 68 teclas' }
    },
    p3: {
        desc: 'El ANG Blossom es un tenkeyless con degradado rosa en keycaps doubleshot y una mini pantalla lateral. Sus switches lineales son suaves de principio a fin, para largas sesiones sin fatiga.',
        specs: { 'Conectividad': 'USB-C · Bluetooth 5.1 · 2.4 GHz', 'Batería': '4000 mAh · 140 h', 'Peso': '980 g', 'Material del chasis': 'ABS reforzado + placa de acero', 'Switches': 'Lineales 40 g', 'Layout': 'TKL · 87 teclas' }
    },
    p4: {
        desc: 'Edición especial ANG Hornet: layout 75% en español con Ñ nativa, acentos amarillos y perilla de aluminio maciza. Cada unidad está numerada y viene con un set adicional de keycaps.',
        specs: { 'Conectividad': 'USB-C · Bluetooth 5.1 · 2.4 GHz', 'Batería': '4000 mAh · 150 h', 'Peso': '1.1 kg', 'Material del chasis': 'Aluminio 6063 anodizado', 'Switches': 'Lineales 45 g', 'Layout': '75% ES · 82 teclas' }
    },
    p5: {
        desc: 'El ANG Glacier ofrece un formato 96% que conserva el numpad completo en un cuerpo compacto. Switches lineales de precisión e iluminación RGB envolvente en tonos hielo.',
        specs: { 'Conectividad': 'USB-C · Bluetooth 5.1 · 2.4 GHz', 'Batería': '5000 mAh · 180 h', 'Peso': '1.2 kg', 'Material del chasis': 'Aluminio + base de policarbonato', 'Switches': 'Lineales 45 g', 'Layout': '96% · 100 teclas' }
    }
};

(function initProductModal() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    const $ = id => document.getElementById(id);
    const media = $('pmodal-media');
    const img   = $('pmodal-img');
    let lastFocus = null;
    let currentName = '';

    function open(card) {
        const data = PRODUCT_DETAILS[card.dataset.product];
        const tag  = card.querySelector('.tag');
        currentName = card.querySelector('h3').textContent;

        img.src = card.querySelector('img').src;
        img.alt = currentName;
        $('pmodal-tag').className   = tag.className;
        $('pmodal-tag').textContent = tag.textContent;
        $('pmodal-name').textContent  = currentName;
        $('pmodal-price').textContent = card.querySelector('.product-price').textContent;
        $('pmodal-desc').textContent  = data.desc;
        $('pmodal-specs').innerHTML = Object.entries(data.specs)
            .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

        setZoom(false);
        lastFocus = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        $('pmodal-close').focus();
    }

    function close() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (lastFocus) lastFocus.focus();
    }

    // Zoom: clic para ampliar, el punto de zoom sigue al cursor
    function setZoom(on) {
        media.classList.toggle('zoomed', on);
        $('pmodal-zoom-hint').textContent = on ? 'Clic para reducir' : 'Clic para ampliar';
        if (!on) img.style.transformOrigin = 'center';
    }

    media.addEventListener('click', e => {
        const zoomed = !media.classList.contains('zoomed');
        setZoom(zoomed);
        if (zoomed) moveZoom(e);
    });

    function moveZoom(e) {
        const r = media.getBoundingClientRect();
        img.style.transformOrigin =
            `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    }

    media.addEventListener('mousemove', e => {
        if (media.classList.contains('zoomed')) moveZoom(e);
    });

    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => open(card));
        card.addEventListener('keydown', e => {
            if (e.target === card && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                open(card);
            }
        });
    });

    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });

    $('pmodal-cta').addEventListener('click', () => {
        alert(`${currentName} añadido al carrito 🛒`);
        close();
    });
})();
