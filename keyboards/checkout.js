// =============================================
// ANG SHOP – checkout.js
// Modal de checkout en 3 pasos: envío → pago → confirmación.
// Es una SIMULACIÓN: no cobra ni envía datos a ningún servidor, y los datos
// de pago nunca se guardan (ni en localStorage).
// Depende de productos.js (getProduct, formatPrice) y de tienda.js ($id, toast, Bag).
// =============================================

const Checkout = (() => {
    const SHIPPING = {
        lima:       { label: 'Lima Metropolitana', cost: 0,  eta: '1 a 2 días hábiles' },
        provincias: { label: 'Provincias',         cost: 15, eta: '3 a 5 días hábiles' }
    };

    const METHODS = {
        yape:     'Yape / Plin',
        card:     'Tarjeta de crédito / débito',
        transfer: 'Transferencia bancaria'
    };

    const PROCESSING_MS = 900;

    const root         = $id('checkout');
    const win          = $id('checkout-window');
    const shippingForm = $id('checkout-shipping');
    const paymentForm  = $id('checkout-payment');
    const payBtn       = $id('checkout-pay');
    const panels       = [...root.querySelectorAll('[data-step-panel]')];
    const stepDots     = [...root.querySelectorAll('.ck-steps li')];

    let step = 1;
    let lastFocus = null;
    let processing = null;

    const digits = v => v.replace(/\D/g, '');
    const zone   = () => SHIPPING[shippingForm.elements.zone.value];
    const method = () => paymentForm.elements.method.value;

    // ── Validación ──
    // Cada regla recibe el valor (sin espacios extremos) y devuelve true o el mensaje de error.
    const RULES = {
        name:    v => v.length >= 3 || 'Ingresa tu nombre completo.',
        phone:   v => {
            let d = digits(v);
            if (d.length === 11 && d.startsWith('51')) d = d.slice(2);
            return /^9\d{8}$/.test(d) || 'Ingresa un celular de 9 dígitos.';
        },
        email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Ingresa un correo válido.',
        doc:     v => /^[A-Za-z0-9]{8,12}$/.test(v) || 'DNI de 8 dígitos o CE de hasta 12 caracteres.',
        address: v => v.length >= 6 || 'Ingresa la dirección de entrega.',

        operation:  v => /^\d{6,12}$/.test(v) || 'Ingresa el número de operación (6 a 12 dígitos).',
        cardNumber: v => /^\d{13,19}$/.test(digits(v)) || 'Revisa el número de tarjeta.',
        cardExp:    v => {
            const m = /^(\d{2})\/(\d{2})$/.exec(v);
            if (!m || +m[1] < 1 || +m[1] > 12) return 'Usa el formato MM/AA.';
            // Vigente hasta el último día del mes indicado
            return new Date(2000 + +m[2], +m[1], 1) > new Date() || 'La tarjeta está vencida.';
        },
        cardCvc:    v => /^\d{3,4}$/.test(v) || 'CVC de 3 o 4 dígitos.',
        cardName:   v => v.length >= 3 || 'Ingresa el nombre del titular.'
    };

    // Formato mientras se escribe
    const MASKS = {
        operation:  v => digits(v).slice(0, 12),
        cardNumber: v => digits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '),
        cardExp:    v => {
            const d = digits(v).slice(0, 4);
            return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
        },
        cardCvc:    v => digits(v).slice(0, 4)
    };

    function check(input) {
        const result  = RULES[input.name](input.value.trim());
        const message = result === true ? '' : result;
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        input.closest('.ck-field').querySelector('.ck-error').textContent = message;
        return !message;
    }

    function validate(scope) {
        const invalid = [...scope.querySelectorAll('.ck-input')]
            .filter(input => RULES[input.name])
            .filter(input => !check(input));
        if (invalid.length) invalid[0].focus();
        return invalid.length === 0;
    }

    function clearErrors() {
        root.querySelectorAll('.ck-input[aria-invalid]').forEach(input => input.removeAttribute('aria-invalid'));
        root.querySelectorAll('.ck-error').forEach(el => { el.textContent = ''; });
    }

    // ── Totales ──
    function renderTotals() {
        const subtotal = Bag.total();
        const shipping = zone().cost;
        const values = {
            subtotal: formatPrice(subtotal),
            shipping: shipping ? formatPrice(shipping) : 'Gratis',
            total:    formatPrice(subtotal + shipping)
        };
        root.querySelectorAll('[data-ck]').forEach(el => { el.textContent = values[el.dataset.ck]; });
    }

    // ── Pasos ──
    function goTo(n) {
        step = n;
        panels.forEach(panel => { panel.hidden = Number(panel.dataset.stepPanel) !== n; });
        stepDots.forEach(dot => {
            const i = Number(dot.dataset.step);
            dot.classList.toggle('is-active', i === n);
            dot.classList.toggle('is-done', i < n);
            dot.querySelector('.ck-step-num').textContent = i < n ? '✓' : i;
            if (i === n) dot.setAttribute('aria-current', 'step');
            else dot.removeAttribute('aria-current');
        });
        panels[n - 1].querySelector('.ck-scroll').scrollTop = 0;
        win.focus();
    }

    function syncMethod() {
        root.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== method(); });
    }

    function setProcessing(on) {
        payBtn.disabled = on;
        payBtn.textContent = on ? 'Procesando…' : 'Confirmar y Pagar';
    }

    // ── Confirmación ──
    function itemTemplate({ id, qty }) {
        const p = getProduct(id);
        return `
            <li class="ck-item">
                <div class="bag-thumb ck-thumb"><img src="${p.img}" alt="" /></div>
                <p class="ck-item-name">${p.name}<span> × ${qty}</span></p>
                <p class="ck-item-price">${formatPrice(p.price * qty)}</p>
            </li>`;
    }

    function placeOrder() {
        const data = Object.fromEntries(new FormData(shippingForm));
        const { label, cost, eta } = zone();

        const code = `#ANG-${Math.floor(1000 + Math.random() * 9000)}`;

        // Queda en el historial de "Mi Cuenta → Mis Pedidos" (cuenta.js)
        writeStore('ang-pedidos', [{
            code,
            date: new Date().toISOString(),
            total: Bag.total() + cost,
            status: 'camino',
            items: Bag.items(),
            address: `${data.address.trim()} · ${label}`
        }, ...readStore('ang-pedidos', [])]);

        $id('checkout-code').textContent  = code;
        $id('checkout-items').innerHTML   = Bag.items().map(itemTemplate).join('');
        $id('checkout-paid-shipping').textContent = cost ? formatPrice(cost) : 'Gratis';
        $id('checkout-paid-total').textContent    = formatPrice(Bag.total() + cost);

        // Datos escritos por el usuario: siempre con textContent
        $id('checkout-ship-name').textContent      = data.name.trim();
        $id('checkout-ship-address').textContent   = `${data.address.trim()} · ${label}`;
        $id('checkout-ship-reference').textContent = data.reference.trim() ? `Ref.: ${data.reference.trim()}` : '';
        $id('checkout-eta').textContent    = eta;
        $id('checkout-method').textContent = `Pago con ${METHODS[method()]}`;

        goTo(3);
    }

    // Al salir de la confirmación el pedido ya está hecho: se vacía la bolsa
    function reset() {
        Bag.clear();
        shippingForm.reset();
        paymentForm.reset();
        clearErrors();
    }

    // ── Abrir / cerrar ──
    function open() {
        if (!Bag.count() || root.classList.contains('open')) return;
        lastFocus = document.activeElement;
        syncMethod();
        renderTotals();
        root.classList.add('open');
        root.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        goTo(1);
    }

    function close() {
        if (!root.classList.contains('open')) return;
        clearTimeout(processing);
        setProcessing(false);
        root.classList.remove('open');
        root.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (step === 3) reset();
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    }

    // ── QR simulado ──
    // Patrón pseudoaleatorio fijo con los 3 localizadores: parece un QR, no codifica nada.
    function fakeQR(size = 25) {
        let seed = 20261009;
        const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
        const inFinder = (x, y) => (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
        const finder = (x, y) => `
            <path fill-rule="evenodd" d="M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z" />
            <rect x="${x + 2}" y="${y + 2}" width="3" height="3" />`;

        let modules = '';
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (!inFinder(x, y) && rand() > 0.52) modules += `M${x} ${y}h1v1h-1z`;
            }
        }

        return `
            <svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="Código QR de demostración">
                <path d="${modules}" />${finder(0, 0)}${finder(size - 7, 0)}${finder(0, size - 7)}
            </svg>`;
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Sin Clipboard API (p. ej. file://): copia mediante un campo temporal
            const field = document.createElement('textarea');
            field.value = text;
            field.style.cssText = 'position:fixed;opacity:0';
            root.append(field);
            field.select();
            const ok = document.execCommand('copy');
            field.remove();
            return ok;
        }
    }

    // ── Eventos ──
    shippingForm.addEventListener('submit', e => {
        e.preventDefault();
        if (validate(shippingForm)) goTo(2);
    });

    paymentForm.addEventListener('submit', e => {
        e.preventDefault();
        if (payBtn.disabled) return;
        if (!validate(paymentForm.querySelector(`[data-panel="${method()}"]`))) return;
        setProcessing(true);
        processing = setTimeout(() => {
            setProcessing(false);
            placeOrder();
        }, PROCESSING_MS);
    });

    shippingForm.addEventListener('change', e => {
        if (e.target.name === 'zone') renderTotals();
    });

    paymentForm.addEventListener('change', e => {
        if (e.target.name === 'method') syncMethod();
    });

    root.addEventListener('input', e => {
        const input = e.target;
        if (MASKS[input.name]) input.value = MASKS[input.name](input.value);
        if (input.getAttribute('aria-invalid') === 'true') check(input);
    });

    root.addEventListener('click', async e => {
        const btn = e.target.closest('[data-copy]');
        if (!btn) return;
        const ok = await copyText(btn.dataset.copy);
        toast(ok ? 'Número copiado al portapapeles.' : 'No se pudo copiar. Selecciónalo manualmente.');
    });

    $id('checkout-back').addEventListener('click', () => goTo(1));
    $id('checkout-finish').addEventListener('click', close);
    root.querySelectorAll('[data-checkout-close]').forEach(el => el.addEventListener('click', close));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && root.classList.contains('open')) close();
    });

    $id('checkout-qr').innerHTML = fakeQR();

    return { open, close, rules: RULES };
})();
