document.documentElement.classList.remove('no-js');

// ── Precarga de imágenes de producto ──
// Descarga y decodifica las 5 imágenes al entrar, para que el carrusel y las
// tarjetas nunca se pinten vacías al deslizar.
const PRODUCT_IMAGES = [2, 1, 3, 4, 5].map(n => `imagenes/Producto00${n}.png`);

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

// ── Testimonios: marquee infinito ──
// Equivale a [...testimonios, ...testimonios]: el set base se repite hasta cubrir
// el ancho visible y luego se duplica completo, así el salto de -50% es invisible
// y nunca aparece un hueco al final (ni en móvil ni en pantallas anchas).
(function initMarquee() {
    const base  = document.getElementById('marquee-base');
    // Con movimiento reducido no hay animación: basta el set original
    if (!base || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const track = base.parentElement;
    const SECONDS_PER_SET = 45;
    const originals = [...base.children];
    let lastWidth = 0;

    function cloneHidden(node) {
        const copy = node.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        return copy;
    }

    function build() {
        const width = track.parentElement.clientWidth;
        if (width === lastWidth) return;
        lastWidth = width;

        base.replaceChildren(...originals);
        track.querySelectorAll('.marquee-group[aria-hidden="true"]').forEach(g => g.remove());

        // Repite el set dentro del grupo hasta que sea más ancho que la ventana
        let sets = 1;
        while (base.getBoundingClientRect().width < width && sets < 8) {
            originals.forEach(card => base.appendChild(cloneHidden(card)));
            sets++;
        }

        track.appendChild(cloneHidden(base));
        track.lastElementChild.removeAttribute('id');
        track.style.animationDuration = `${SECONDS_PER_SET * sets}s`;
    }

    build();
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 150);
    });
})();

// ── Carrusel 3D con efecto typewriter ──
(function initCarousel3D() {
    const stage = document.getElementById('carousel3d-stage');
    if (!stage) return;

    const root   = document.getElementById('carousel3d');
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
            // El activo al frente y nítido; los vecinos asoman atrás, pequeños y
            // desenfocados; el resto queda oculto (así el salto circular no se ve).
            card.style.transform =
                `translateX(calc(var(--spread) * ${d})) ` +
                `translateZ(${-abs * 260}px) ` +
                `rotateY(${-d * 32}deg) ` +
                `scale(${abs === 0 ? 1 : 0.78 - (abs - 1) * 0.14})`;
            card.style.opacity = abs === 0 ? 1 : abs === 1 ? 0.5 : 0;
            card.style.filter  = abs === 0 ? 'none' : `blur(${abs * 3}px) saturate(0.75)`;
            card.style.zIndex  = 10 - abs;
            card.style.pointerEvents = abs > 1 ? 'none' : '';
            card.classList.toggle('is-active', abs === 0);
            card.setAttribute('aria-hidden', abs !== 0);
        });
        dots.forEach((dot, i) => dot.classList.toggle('active', i === current));

        // Halo de fondo con los colores del teclado activo
        const [glowA, glowB] = cards[current].dataset.glow.split(',');
        root.style.setProperty('--glow-a', glowA);
        root.style.setProperty('--glow-b', glowB);

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
    root.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
    });

    // Centro vertical del escenario: ahí se ancla el halo de color
    function placeGlow() {
        root.style.setProperty('--stage-y', `${stage.offsetTop + stage.offsetHeight / 2}px`);
    }
    window.addEventListener('resize', placeGlow);
    placeGlow();

    layout();
})();


// ── Vista rápida de producto (modal) ──
// Lee de PRODUCTS (productos.js). Se expone como window.openProductModal(id)
// para que el catálogo la reutilice.
(function initProductModal() {
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    const $ = id => document.getElementById(id);
    const media = $('pmodal-media');
    const img   = $('pmodal-img');
    let lastFocus = null;
    let currentId = null;

    function open(id) {
        const product = getProduct(id);
        if (!product) return;
        currentId = id;

        img.src = product.img;
        img.alt = product.name;
        $('pmodal-tag').className   = `tag ${product.tag.cls}`.trim();
        $('pmodal-tag').textContent = product.tag.label;
        $('pmodal-name').textContent  = product.name;
        $('pmodal-price').textContent = formatPrice(product.price);
        $('pmodal-desc').textContent  = product.desc;
        $('pmodal-specs').innerHTML = Object.entries(product.specs)
            .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

        setZoom(false);
        lastFocus = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        $('pmodal-close').focus();
    }

    function close({ restoreFocus = true } = {}) {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (restoreFocus && lastFocus) lastFocus.focus();
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

    // Tarjetas destacadas de la portada
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('button')) return;  // el botón de bolsa tiene su propia acción
            open(card.dataset.product);
        });
        card.addEventListener('keydown', e => {
            if (e.target === card && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                open(card.dataset.product);
            }
        });
    });

    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => close()));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });

    $('pmodal-cta').addEventListener('click', () => {
        close({ restoreFocus: false });
        Bag.add(currentId);
    });

    window.openProductModal = open;
})();
