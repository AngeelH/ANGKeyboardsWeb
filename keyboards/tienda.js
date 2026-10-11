// =============================================
// ANG SHOP – tienda.js
// Router de vistas (#/productos), catálogo filtrable y bolsa de compras.
// Depende de productos.js (PRODUCTS, UPCOMING_DROPS, getProduct, formatPrice)
// y de script.js (window.openProductModal).
// =============================================

const $id = id => document.getElementById(id);

function readStore(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
}

// ── Aviso flotante ──
const toast = (() => {
    const el = $id('toast');
    let timer = null;
    return message => {
        el.textContent = message;
        el.classList.add('show');
        clearTimeout(timer);
        timer = setTimeout(() => el.classList.remove('show'), 2600);
    };
})();


// ═════════════════ BOLSA DE COMPRAS ═════════════════
const Bag = (() => {
    const KEY = 'ang-bag';
    const MAX_QTY = 10;

    const root     = $id('bag');
    const list     = $id('bag-items');
    const empty    = $id('bag-empty');
    const footer   = $id('bag-footer');
    const subtotal = $id('bag-subtotal');
    const subtitle = $id('bag-subtitle');
    const badge    = $id('bag-count');

    // [{ id, qty }] — se descartan productos que ya no existan
    let items = readStore(KEY, []).filter(i => getProduct(i.id) && i.qty > 0);
    let lastFocus = null;

    const count = () => items.reduce((n, i) => n + i.qty, 0);
    const total = () => items.reduce((sum, i) => sum + getProduct(i.id).price * i.qty, 0);

    function commit() {
        writeStore(KEY, items);
        render();
    }

    function add(id, qty = 1) {
        if (!getProduct(id)) return;
        const item = items.find(i => i.id === id);
        if (item) item.qty = Math.min(item.qty + qty, MAX_QTY);
        else items.push({ id, qty });
        commit();
        open();
        highlight(id);
    }

    function setQty(id, qty) {
        if (qty <= 0) return remove(id);
        const item = items.find(i => i.id === id);
        if (item) item.qty = Math.min(qty, MAX_QTY);
        commit();
    }

    function remove(id) {
        items = items.filter(i => i.id !== id);
        commit();
    }

    function itemTemplate({ id, qty }) {
        const p = getProduct(id);
        return `
            <li class="bag-item" data-id="${id}">
                <div class="bag-thumb"><img src="${p.img}" alt="" /></div>
                <div class="bag-info">
                    <p class="bag-name">${p.name}</p>
                    <p class="bag-meta">${p.layout} · ${p.tag.label}</p>
                    <div class="bag-qty" role="group" aria-label="Cantidad de ${p.name}">
                        <button type="button" data-qty="-1" aria-label="Quitar uno">−</button>
                        <span>${qty}</span>
                        <button type="button" data-qty="1" aria-label="Añadir uno" ${qty >= MAX_QTY ? 'disabled' : ''}>+</button>
                    </div>
                </div>
                <div class="bag-side">
                    <p class="bag-line">${formatPrice(p.price * qty)}</p>
                    <button type="button" class="bag-remove" data-remove aria-label="Eliminar ${p.name}">Eliminar</button>
                </div>
            </li>`;
    }

    function render() {
        const n = count();
        list.innerHTML = items.map(itemTemplate).join('');
        empty.hidden  = n > 0;
        footer.hidden = n === 0;
        list.hidden   = n === 0;
        subtotal.textContent = formatPrice(total());
        subtitle.textContent = n === 1 ? '1 artículo' : `${n} artículos`;

        badge.hidden = n === 0;
        badge.textContent = n > 9 ? '9+' : n;
    }

    function highlight(id) {
        const row = list.querySelector(`[data-id="${id}"]`);
        if (!row) return;
        row.classList.remove('flash');
        void row.offsetWidth;
        row.classList.add('flash');
        badge.classList.remove('bump');
        void badge.offsetWidth;
        badge.classList.add('bump');
    }

    function open() {
        if (root.classList.contains('open')) return;
        lastFocus = document.activeElement;
        root.classList.add('open');
        root.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        $id('bag-close').focus();
    }

    function close() {
        root.classList.remove('open');
        root.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    }

    // Controles dentro de la bolsa
    list.addEventListener('click', e => {
        const row = e.target.closest('.bag-item');
        if (!row) return;
        const item = items.find(i => i.id === row.dataset.id);
        const step = e.target.closest('[data-qty]');
        if (step) setQty(item.id, item.qty + Number(step.dataset.qty));
        if (e.target.closest('[data-remove]')) remove(item.id);
    });

    root.querySelectorAll('[data-bag-close]').forEach(el => el.addEventListener('click', close));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && root.classList.contains('open')) close();
    });

    function clear() {
        items = [];
        commit();
    }

    // Checkout vive en checkout.js (se carga después; existe al hacer clic)
    $id('bag-checkout').addEventListener('click', () => {
        close();
        Checkout.open();
    });
    $id('nav-cart').addEventListener('click', open);

    render();
    return { add, open, close, clear, count, total, items: () => items.map(i => ({ ...i })) };
})();

// Cualquier botón con data-add-to-bag (portada, catálogo) añade a la bolsa
document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add-to-bag]');
    if (!btn) return;
    e.preventDefault();
    Bag.add(btn.dataset.addToBag);
});


// ═════════════════ DROPDOWN PERSONALIZADO ═════════════════
// Reemplaza al <select> nativo: listbox accesible con teclado (↑ ↓ Enter Esc).
function createDropdown(root, onChange) {
    const trigger = root.querySelector('.dropdown-trigger');
    const label   = root.querySelector('.dropdown-value');
    const menu    = root.querySelector('.dropdown-menu');
    const options = [...menu.querySelectorAll('[role="option"]')];
    let active = 0;

    options.forEach((opt, i) => { opt.id = `${menu.id}-opt-${i}`; });

    const selectedIndex = () => options.findIndex(o => o.getAttribute('aria-selected') === 'true');

    function setActive(i) {
        active = (i + options.length) % options.length;
        options.forEach((o, j) => o.classList.toggle('is-active', j === active));
        menu.setAttribute('aria-activedescendant', options[active].id);
    }

    function open() {
        root.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        setActive(Math.max(selectedIndex(), 0));
        menu.focus();
    }

    function close({ focusTrigger = true } = {}) {
        if (!root.classList.contains('open')) return;
        root.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
        if (focusTrigger) trigger.focus();
    }

    function select(i, { silent = false } = {}) {
        options.forEach((o, j) => o.setAttribute('aria-selected', j === i));
        label.textContent = options[i].textContent;
        if (!silent) onChange(options[i].dataset.value);
    }

    trigger.addEventListener('click', () => root.classList.contains('open') ? close() : open());

    trigger.addEventListener('keydown', e => {
        if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            open();
        }
    });

    menu.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
        else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
        else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(active); close(); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
        else if (e.key === 'Tab') close({ focusTrigger: false });
    });

    menu.addEventListener('mousemove', e => {
        const opt = e.target.closest('[role="option"]');
        if (opt) setActive(options.indexOf(opt));
    });

    menu.addEventListener('click', e => {
        const opt = e.target.closest('[role="option"]');
        if (!opt) return;
        select(options.indexOf(opt));
        close();
    });

    document.addEventListener('click', e => {
        if (!root.contains(e.target)) close({ focusTrigger: false });
    });

    return {
        setValue(value) {
            const i = options.findIndex(o => o.dataset.value === value);
            if (i >= 0) select(i, { silent: true });
        }
    };
}


// ═════════════════ CATÁLOGO ═════════════════
const Catalog = (() => {
    const grid    = $id('catalog-grid');
    const counter = $id('catalog-count');
    const empty   = $id('catalog-empty');
    const search  = $id('catalog-search');

    const state = { q: '', format: 'all', sw: null, sort: 'popular' };
    let reserved = new Set(readStore('ang-reservas', []));

    const normalize = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

    const STOCK_LABEL = { disponible: 'Disponible', pocos: 'Pocos en stock' };

    const SORTERS = {
        'popular':    (a, b) => a.popularity - b.popularity,
        'price-asc':  (a, b) => a.price - b.price,
        'price-desc': (a, b) => b.price - a.price
    };

    const BAG_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></svg>';

    const KEYCAP_ICON = `
        <svg class="cat-drop-art" viewBox="0 0 120 110" aria-hidden="true">
            <path d="M28 44 L60 28 L92 44 L60 60 Z" />
            <ellipse cx="60" cy="44" rx="18" ry="8.5" class="faint" />
            <path d="M28 44 L14 66 M92 44 L106 66 M60 60 L60 89" />
            <path d="M14 66 L60 89 L106 66" />
        </svg>`;

    function productCard(p) {
        return `
            <article class="cat-card" data-id="${p.id}">
                <button type="button" class="cat-media" data-open="${p.id}" aria-label="Ver detalles de ${p.name}">
                    <img src="${p.img}" alt="${p.name} – teclado mecánico" decoding="async" />
                    <span class="cat-stock ${p.stock}">${STOCK_LABEL[p.stock]}</span>
                    <span class="cat-quick">Vista rápida</span>
                </button>
                <div class="cat-body">
                    <div class="cat-meta">
                        <span class="tag ${p.tag.cls}">${p.tag.label}</span>
                        <span class="cat-layout">${p.layout}</span>
                    </div>
                    <h3 class="cat-name">${p.name}</h3>
                    <p class="cat-short">${p.short}</p>
                    <div class="cat-foot">
                        <span class="cat-price">${formatPrice(p.price)}</span>
                        <button type="button" class="cat-add" data-add-to-bag="${p.id}" aria-label="Añadir ${p.name} a la bolsa">
                            ${BAG_ICON}<span>Añadir<span class="cat-add-long"> a la bolsa</span></span>
                        </button>
                    </div>
                </div>
            </article>`;
    }

    function dropCard(d) {
        const isReserved = reserved.has(d.id);
        const media = d.img
            ? `<img src="${d.img}" alt="${d.name}" decoding="async" />`
            : `${KEYCAP_ICON}<span class="cat-drop-label">Próximo drop</span>`;
        return `
            <article class="cat-card cat-drop" data-drop="${d.id}">
                <div class="cat-media cat-drop-media">
                    ${media}
                    <span class="cat-stock soon">Próximamente</span>
                </div>
                <div class="cat-body">
                    <div class="cat-meta">
                        <span class="tag cat-tag-neutral">Próximo drop</span>
                        <span class="cat-layout">${d.eta}</span>
                    </div>
                    <h3 class="cat-name">${d.name}</h3>
                    <p class="cat-short">${d.teaser}</p>
                    <div class="cat-foot">
                        <span class="cat-price cat-price-muted">Precio por anunciar</span>
                        <button type="button" class="cat-reserve${isReserved ? ' done' : ''}" data-reserve="${d.id}" aria-pressed="${isReserved}">
                            ${isReserved ? '✓ Reservado' : 'Reservar'}
                        </button>
                    </div>
                </div>
            </article>`;
    }

    function filtered() {
        const q = normalize(state.q);
        return PRODUCTS
            .filter(p => state.format === 'all' || p.formats.includes(state.format))
            .filter(p => !state.sw || p.switchType === state.sw)
            .filter(p => !q || normalize(p.name).includes(q))
            .sort(SORTERS[state.sort]);
    }

    function render() {
        const products  = filtered();
        // Los drops solo acompañan la vista sin filtros (no "coinciden" con nada)
        const showDrops = state.format === 'all' && !state.sw && !normalize(state.q);

        grid.innerHTML = products.map(productCard).join('') +
            (showDrops ? UPCOMING_DROPS.map(dropCard).join('') : '');

        const n = products.length;
        counter.textContent = `${n} ${n === 1 ? 'teclado' : 'teclados'}` +
            (showDrops ? ` · ${UPCOMING_DROPS.length} próximos drops` : '');

        empty.hidden = n > 0;
        grid.hidden  = n === 0;
    }

    function setPressed(selector, isActive) {
        document.querySelectorAll(selector).forEach(btn => {
            const active = isActive(btn);
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active);
        });
    }

    // Búsqueda en tiempo real
    search.addEventListener('input', () => {
        state.q = search.value;
        render();
    });

    // Formato: selección única
    document.querySelectorAll('[data-format]').forEach(btn => btn.addEventListener('click', () => {
        state.format = btn.dataset.format;
        setPressed('[data-format]', b => b.dataset.format === state.format);
        render();
    }));

    // Switch: se activa/desactiva (un clic sobre el activo lo quita)
    document.querySelectorAll('[data-switch]').forEach(btn => btn.addEventListener('click', () => {
        state.sw = state.sw === btn.dataset.switch ? null : btn.dataset.switch;
        setPressed('[data-switch]', b => b.dataset.switch === state.sw);
        render();
    }));

    const sortDropdown = createDropdown($id('catalog-sort'), value => {
        state.sort = value;
        render();
    });

    $id('catalog-reset').addEventListener('click', () => {
        Object.assign(state, { q: '', format: 'all', sw: null, sort: 'popular' });
        search.value = '';
        sortDropdown.setValue('popular');
        setPressed('[data-format]', b => b.dataset.format === 'all');
        setPressed('[data-switch]', () => false);
        render();
    });

    // Tarjetas: vista rápida, reservas (el botón de bolsa lo maneja el listener global)
    grid.addEventListener('click', e => {
        if (e.target.closest('[data-add-to-bag]')) return;

        const reserve = e.target.closest('[data-reserve]');
        if (reserve) {
            const drop = UPCOMING_DROPS.find(d => d.id === reserve.dataset.reserve);
            if (reserved.has(drop.id)) {
                reserved.delete(drop.id);
                toast(`Reserva de ${drop.name} cancelada.`);
            } else {
                reserved.add(drop.id);
                toast(`Te avisaremos cuando ${drop.name} esté disponible.`);
            }
            writeStore('ang-reservas', [...reserved]);
            render();
            return;
        }

        const card = e.target.closest('.cat-card[data-id]');
        if (card) window.openProductModal(card.dataset.id);
    });

    render();
    return { render };
})();


// ═════════════════ ROUTER DE VISTAS ═════════════════
// #/productos → catálogo. Cualquier otro hash (#faq, #experiencia…) → portada.
(function initRouter() {
    const views = { home: $id('view-home'), catalog: $id('view-catalog') };
    const baseTitle = document.title;
    let current = null;

    function route() {
        const hash = location.hash;
        const view = hash.startsWith('#/productos') ? 'catalog' : 'home';
        const changed = view !== current;

        if (changed) {
            Object.entries(views).forEach(([name, el]) => { el.hidden = name !== view; });
            const el = views[view];
            el.classList.remove('view-enter');
            void el.offsetWidth;
            el.classList.add('view-enter');
            current = view;
        }

        document.querySelectorAll('[data-nav="catalog"]').forEach(a => {
            if (view === 'catalog') a.setAttribute('aria-current', 'page');
            else a.removeAttribute('aria-current');
        });
        document.title = view === 'catalog' ? 'Catálogo – ANG Shop' : baseTitle;

        if (view === 'catalog') {
            if (changed) window.scrollTo(0, 0);
            return;
        }

        // En la portada: si venimos del catálogo, el navegador no pudo hacer
        // scroll al ancla (estaba oculta), así que lo hacemos al mostrarla.
        const target = hash.length > 1 && !hash.startsWith('#/') ? document.getElementById(hash.slice(1)) : null;
        if (changed) {
            if (target) requestAnimationFrame(() => target.scrollIntoView());
            else window.scrollTo(0, 0);
        }
    }

    window.addEventListener('hashchange', route);
    route();
})();
