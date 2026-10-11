// =============================================
// ANG SHOP – cuenta.js
// Modal "Mi Cuenta": datos personales, pedidos, direcciones, seguridad y apariencia.
// Es una SIMULACIÓN: no hay login ni servidor. El perfil vive en
// localStorage['ang-cuenta'] y las contraseñas nunca se guardan.
// Depende de productos.js (getProduct, formatPrice), tienda.js ($id, toast,
// readStore, writeStore) y checkout.js (Checkout.rules, pedidos en 'ang-pedidos').
// =============================================

const Account = (() => {
    const KEY = 'ang-cuenta';

    // Perfil de demostración (se restaura al cerrar sesión)
    const DEFAULTS = {
        name: 'Ángel Manuel',
        email: 'angel.manuel@correo.com',
        phone: '',
        doc: '',
        avatar: null,
        notify: { whatsapp: true, email: true },
        addresses: [
            { id: 'a1', label: 'Casa',    zone: 'lima',       address: 'Av. Larco 345, Miraflores',       reference: 'Frente al parque Kennedy', primary: true },
            { id: 'a2', label: 'Oficina', zone: 'provincias', address: 'Calle Mercaderes 120, Arequipa', reference: '',                          primary: false }
        ]
    };

    // Pedidos de ejemplo; los hechos en el checkout se suman desde 'ang-pedidos'
    const SAMPLE_ORDERS = [
        { code: '#ANG-7315', date: '2026-10-06T12:00:00', total: 549, status: 'camino',    items: [{ id: 'p2', qty: 1 }], address: 'Av. Larco 345, Miraflores · Lima Metropolitana' },
        { code: '#ANG-8492', date: '2026-09-18T12:00:00', total: 699, status: 'entregado', items: [{ id: 'p1', qty: 1 }], address: 'Av. Larco 345, Miraflores · Lima Metropolitana' }
    ];

    const STATUS = { camino: 'En camino', entregado: 'Entregado' };
    const ZONES  = { lima: 'Lima Metropolitana', provincias: 'Provincias' };
    const AVATAR_SIZE = 192;

    const root         = $id('account');
    const win          = $id('account-window');
    const tabs         = [...root.querySelectorAll('[role="tab"]')];
    const profileForm  = $id('account-profile');
    const addressForm  = $id('account-address-form');
    const passwordForm = $id('account-password');
    const addressList  = $id('account-addresses');
    const addressAdd   = $id('account-address-add');
    const orderList    = $id('account-orders');

    let state = load();
    let lastFocus = null;

    function load() {
        return { ...structuredClone(DEFAULTS), ...readStore(KEY, {}) };
    }

    function save() {
        writeStore(KEY, state);
    }

    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // ── Validación (mismo marcado .ck-field del checkout) ──
    function setError(input, message) {
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        input.closest('.ck-field').querySelector('.ck-error').textContent = message;
    }

    // rules: { nombreDelCampo: valor => true | 'mensaje' }
    function validate(form, rules) {
        const invalid = Object.entries(rules).filter(([name, rule]) => {
            const input  = form.elements[name];
            const result = rule(input.value.trim());
            setError(input, result === true ? '' : result);
            return result !== true;
        });
        if (invalid.length) form.elements[invalid[0][0]].focus();
        return invalid.length === 0;
    }

    const optional = rule => v => v === '' || rule(v);

    function clearErrors() {
        root.querySelectorAll('.ck-input[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
        root.querySelectorAll('.ck-error').forEach(el => { el.textContent = ''; });
    }

    // ── Encabezado ──
    function renderHeader() {
        $id('account-name').textContent  = state.name;
        $id('account-email').textContent = state.email;

        const img = $id('account-avatar-img');
        const initials = $id('account-initials');
        img.hidden = !state.avatar;
        initials.hidden = Boolean(state.avatar);
        if (state.avatar) img.src = state.avatar;
        initials.textContent = state.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    }

    // "Subida" simulada: la foto se recorta en cuadrado y se guarda en el navegador
    function loadAvatar(file) {
        if (!file || !file.type.startsWith('image/')) return toast('Elige un archivo de imagen.');
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const side = Math.min(img.naturalWidth, img.naturalHeight);
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = AVATAR_SIZE;
            canvas.getContext('2d').drawImage(
                img,
                (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side,
                0, 0, AVATAR_SIZE, AVATAR_SIZE
            );
            URL.revokeObjectURL(url);
            state.avatar = canvas.toDataURL('image/jpeg', 0.85);
            save();
            renderHeader();
            toast('Foto de perfil actualizada.');
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            toast('No se pudo leer la imagen.');
        };
        img.src = url;
    }

    // ── Datos personales ──
    function fillProfile() {
        ['name', 'email', 'phone', 'doc'].forEach(field => { profileForm.elements[field].value = state[field]; });
    }

    // ── Pedidos ──
    function orderTemplate(order, i) {
        const items = order.items.filter(item => getProduct(item.id)).map(({ id, qty }) => {
            const p = getProduct(id);
            return `
                <li class="ck-item">
                    <div class="bag-thumb ck-thumb"><img src="${p.img}" alt="" /></div>
                    <p class="ck-item-name">${p.name}<span> × ${qty}</span></p>
                    <p class="ck-item-price">${formatPrice(p.price * qty)}</p>
                </li>`;
        }).join('');
        const date = new Date(order.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

        return `
            <li class="acc-order">
                <button type="button" class="acc-order-head" aria-expanded="false" aria-controls="account-order-${i}">
                    <span class="acc-order-main">
                        <span class="acc-order-code">${esc(order.code)}</span>
                        <span class="acc-order-date">${date}</span>
                    </span>
                    <span class="acc-status ${order.status}">${STATUS[order.status]}</span>
                    <span class="acc-order-total">${formatPrice(order.total)}</span>
                    <svg class="acc-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" /></svg>
                </button>
                <div class="acc-order-detail" id="account-order-${i}" hidden>
                    <ul class="ck-items">${items}</ul>
                    <p class="acc-order-address">Envío a: ${esc(order.address)}</p>
                </div>
            </li>`;
    }

    function renderOrders() {
        const orders = [...readStore('ang-pedidos', []), ...SAMPLE_ORDERS];
        orderList.innerHTML = orders.map(orderTemplate).join('');
    }

    // ── Direcciones ──
    function addressTemplate(a) {
        return `
            <li class="acc-address${a.primary ? ' is-primary' : ''}" data-id="${esc(a.id)}">
                <div class="acc-address-head">
                    <p class="acc-address-label">${esc(a.label)}</p>
                    <span class="acc-chip">${ZONES[a.zone]}</span>
                    ${a.primary ? '<span class="acc-chip acc-chip-dark">Predeterminada</span>' : ''}
                </div>
                <p class="acc-address-text">${esc(a.address)}</p>
                ${a.reference ? `<p class="acc-address-ref">Ref.: ${esc(a.reference)}</p>` : ''}
                <div class="acc-address-actions">
                    ${a.primary ? '' : '<button type="button" data-primary>Usar como predeterminada</button>'}
                    <button type="button" data-delete aria-label="Eliminar ${esc(a.label)}">Eliminar</button>
                </div>
            </li>`;
    }

    function renderAddresses() {
        addressList.innerHTML = state.addresses.length
            ? state.addresses.map(addressTemplate).join('')
            : '<li class="acc-empty">Aún no tienes direcciones guardadas.</li>';
    }

    function toggleAddressForm(show) {
        addressForm.hidden = !show;
        addressAdd.hidden = show;
        if (show) addressForm.elements.label.focus();
        else {
            addressForm.reset();
            clearErrors();
        }
    }

    // ── Seguridad ──
    function fillNotify() {
        root.querySelectorAll('[data-notify]').forEach(input => { input.checked = state.notify[input.dataset.notify]; });
    }

    // ── Apariencia ──
    // El tema es la clase "dark" en <html> (colores en tema.css). Se guarda aparte del
    // perfil para que no se pierda al cerrar sesión; el <head> lo aplica al cargar.
    const THEME_KEY = 'ang-tema';
    const currentTheme = () => document.documentElement.classList.contains('dark') ? 'oscuro' : 'claro';

    function setTheme(theme) {
        document.documentElement.classList.toggle('dark', theme === 'oscuro');
        writeStore(THEME_KEY, theme);
    }

    function fillTheme() {
        root.querySelectorAll('[name="theme"]').forEach(input => { input.checked = input.value === currentTheme(); });
    }

    // ── Pestañas ──
    function selectTab(name, { focus = false } = {}) {
        tabs.forEach(tab => {
            const selected = tab.dataset.tab === name;
            tab.setAttribute('aria-selected', selected);
            tab.tabIndex = selected ? 0 : -1;
            $id(tab.getAttribute('aria-controls')).hidden = !selected;
            if (selected && focus) tab.focus();
        });
        root.querySelector('.account-body').scrollTop = 0;
    }

    // ── Abrir / cerrar ──
    function open() {
        if (root.classList.contains('open')) return;
        lastFocus = document.activeElement;
        renderHeader();
        fillProfile();
        renderOrders();
        renderAddresses();
        fillNotify();
        fillTheme();
        selectTab('datos');
        root.classList.add('open');
        root.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        win.focus();
    }

    function close() {
        if (!root.classList.contains('open')) return;
        root.classList.remove('open');
        root.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        toggleAddressForm(false);
        passwordForm.reset();
        clearErrors();
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    }

    // ── Eventos ──
    profileForm.addEventListener('submit', e => {
        e.preventDefault();
        const { name, email, phone, doc } = Checkout.rules;
        if (!validate(profileForm, { name, email, phone: optional(phone), doc: optional(doc) })) return;
        ['name', 'email', 'phone', 'doc'].forEach(field => { state[field] = profileForm.elements[field].value.trim(); });
        save();
        renderHeader();
        toast('Cambios guardados.');
    });

    addressForm.addEventListener('submit', e => {
        e.preventDefault();
        const ok = validate(addressForm, {
            label:   v => v.length >= 2 || 'Ponle un nombre, por ejemplo "Casa".',
            address: Checkout.rules.address
        });
        if (!ok) return;
        const data = Object.fromEntries(new FormData(addressForm));
        state.addresses.push({
            id: `a${Date.now()}`,
            label: data.label.trim(),
            zone: data.zone,
            address: data.address.trim(),
            reference: data.reference.trim(),
            primary: state.addresses.length === 0
        });
        save();
        renderAddresses();
        toggleAddressForm(false);
        toast('Dirección guardada.');
    });

    addressList.addEventListener('click', e => {
        const card = e.target.closest('.acc-address');
        if (!card) return;
        const id = card.dataset.id;

        if (e.target.closest('[data-primary]')) {
            state.addresses.forEach(a => { a.primary = a.id === id; });
        } else if (e.target.closest('[data-delete]')) {
            const removed = state.addresses.find(a => a.id === id);
            state.addresses = state.addresses.filter(a => a.id !== id);
            // Si se borra la predeterminada, la primera que quede pasa a serlo
            if (removed.primary && state.addresses.length) state.addresses[0].primary = true;
            toast(`Dirección "${removed.label}" eliminada.`);
        } else {
            return;
        }
        save();
        renderAddresses();
    });

    addressAdd.addEventListener('click', () => toggleAddressForm(true));
    $id('account-address-cancel').addEventListener('click', () => toggleAddressForm(false));

    passwordForm.addEventListener('submit', e => {
        e.preventDefault();
        const next = passwordForm.elements.next.value;
        const ok = validate(passwordForm, {
            current: v => v.length > 0 || 'Ingresa tu contraseña actual.',
            next:    v => v.length >= 8 || 'Usa al menos 8 caracteres.',
            repeat:  v => v === next.trim() || 'Las contraseñas no coinciden.'
        });
        if (!ok) return;
        passwordForm.reset();   // nunca se guarda
        toast('Contraseña actualizada.');
    });

    root.addEventListener('change', e => {
        const input = e.target;
        if (input.dataset.notify) {
            state.notify[input.dataset.notify] = input.checked;
            save();
            toast(`Notificaciones por ${input.dataset.notify === 'whatsapp' ? 'WhatsApp' : 'email'} ${input.checked ? 'activadas' : 'desactivadas'}.`);
        }
        if (input.name === 'theme') {
            setTheme(input.value);
            toast(`Modo ${input.value} activado.`);
        }
        if (input.id === 'account-avatar-input') {
            loadAvatar(input.files[0]);
            input.value = '';
        }
    });

    // Al corregir un campo con error, se revisa de nuevo al enviar; aquí solo se limpia
    root.addEventListener('input', e => {
        if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, '');
    });

    orderList.addEventListener('click', e => {
        const head = e.target.closest('.acc-order-head');
        if (!head) return;
        const expanded = head.getAttribute('aria-expanded') === 'true';
        head.setAttribute('aria-expanded', !expanded);
        $id(head.getAttribute('aria-controls')).hidden = expanded;
    });

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => selectTab(tab.dataset.tab));
        tab.addEventListener('keydown', e => {
            const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
            if (!step) return;
            e.preventDefault();
            selectTab(tabs[(i + step + tabs.length) % tabs.length].dataset.tab, { focus: true });
        });
    });

    // Sin login real: "cerrar sesión" restaura el perfil de demostración
    $id('account-logout').addEventListener('click', () => {
        try { localStorage.removeItem(KEY); } catch { /* sin almacenamiento */ }
        state = load();
        close();
        toast('Sesión cerrada.');
    });

    root.querySelectorAll('[data-account-close]').forEach(el => el.addEventListener('click', close));
    $id('nav-user').addEventListener('click', open);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && root.classList.contains('open')) close();
    });

    return { open, close };
})();
