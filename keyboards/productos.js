// =============================================
// ANG SHOP – productos.js
// Fuente única de datos: catálogo, vista rápida y bolsa leen de aquí.
// =============================================

// formats: claves de los chips de formato ('65', '75', 'custom')
// stock: 'disponible' | 'pocos'
// popularity: 1 = más popular (orden "Más Populares")
const PRODUCTS = [
    {
        id: 'p2',
        name: 'ANG Crimson',
        img: 'imagenes/Producto002.png',
        price: 549,
        layout: '65%',
        formats: ['65'],
        switchType: 'Táctil',
        tag: { label: 'Switch táctil', cls: 'blue' },
        stock: 'disponible',
        popularity: 1,
        short: '65% compacto con keycaps topográficos. Switches táctiles con respuesta marcada.',
        desc: 'El ANG Crimson lleva el formato 65% al límite con keycaps PBT de grabado topográfico en negro y rojo. Switches táctiles con un bump claro en cada pulsación, ideales para escribir con ritmo.',
        specs: { 'Conectividad': 'USB-C · Bluetooth 5.0', 'Batería': '3000 mAh · 120 h', 'Peso': '720 g', 'Material del chasis': 'Aluminio CNC anodizado', 'Switches': 'Táctiles 55 g', 'Layout': '65% · 68 teclas' }
    },
    {
        id: 'p1',
        name: 'ANG Aurora',
        img: 'imagenes/Producto001.png',
        price: 699,
        layout: '75%',
        formats: ['75'],
        switchType: 'Lineal',   // lineal silencioso
        tag: { label: 'Switch silencioso', cls: '' },
        stock: 'disponible',
        popularity: 2,
        short: '75% con perilla y pantalla integrada. Switches silenciosos de 45g, ideal para espacios compartidos.',
        desc: 'El ANG Aurora combina un formato 75% con una perilla multifunción y una pantalla integrada para ver hora, batería y perfiles. Sus switches silenciosos pre-lubricados y la espuma interna de cinco capas reducen el ruido sin perder precisión.',
        specs: { 'Conectividad': 'USB-C · Bluetooth 5.1 · 2.4 GHz', 'Batería': '4000 mAh · 150 h', 'Peso': '1.05 kg', 'Material del chasis': 'Policarbonato + placa de aluminio', 'Switches': 'Silenciosos 45 g', 'Layout': '75% · 81 teclas' }
    },
    {
        id: 'p3',
        name: 'ANG Blossom',
        img: 'imagenes/Producto003.png',
        price: 599,
        layout: 'TKL',
        formats: ['custom'],
        switchType: 'Lineal',
        tag: { label: 'Switch lineal', cls: 'green' },
        stock: 'pocos',
        popularity: 5,
        short: 'Tenkeyless con degradado rosa. Switches lineales suaves y pantalla lateral.',
        desc: 'El ANG Blossom es un tenkeyless con degradado rosa en keycaps doubleshot y una mini pantalla lateral. Sus switches lineales son suaves de principio a fin, para largas sesiones sin fatiga.',
        specs: { 'Conectividad': 'USB-C · Bluetooth 5.1 · 2.4 GHz', 'Batería': '4000 mAh · 140 h', 'Peso': '980 g', 'Material del chasis': 'ABS reforzado + placa de acero', 'Switches': 'Lineales 40 g', 'Layout': 'TKL · 87 teclas' }
    },
    {
        id: 'p4',
        name: 'ANG Hornet',
        img: 'imagenes/Producto004.png',
        price: 819,
        layout: '75%',
        formats: ['75', 'custom'],
        switchType: 'Lineal',
        tag: { label: 'Edición especial', cls: '' },
        stock: 'pocos',
        popularity: 3,
        short: '75% en español con acentos amarillos y perilla de aluminio. Tirada limitada.',
        desc: 'Edición especial ANG Hornet: layout 75% en español con Ñ nativa, acentos amarillos y perilla de aluminio maciza. Cada unidad está numerada y viene con un set adicional de keycaps.',
        specs: { 'Conectividad': 'USB-C · Bluetooth 5.1 · 2.4 GHz', 'Batería': '4000 mAh · 150 h', 'Peso': '1.1 kg', 'Material del chasis': 'Aluminio 6063 anodizado', 'Switches': 'Lineales 45 g', 'Layout': '75% ES · 82 teclas' }
    },
    {
        id: 'p5',
        name: 'ANG Glacier',
        img: 'imagenes/Producto005.png',
        price: 929,
        layout: '96%',
        formats: ['custom'],
        switchType: 'Lineal',
        tag: { label: 'Switch lineal', cls: 'green' },
        stock: 'disponible',
        popularity: 4,
        short: '96% con numpad completo. Switches lineales de precisión para profesionales.',
        desc: 'El ANG Glacier ofrece un formato 96% que conserva el numpad completo en un cuerpo compacto. Switches lineales de precisión e iluminación RGB envolvente en tonos hielo.',
        specs: { 'Conectividad': 'USB-C · Bluetooth 5.1 · 2.4 GHz', 'Batería': '5000 mAh · 180 h', 'Peso': '1.2 kg', 'Material del chasis': 'Aluminio + base de policarbonato', 'Switches': 'Lineales 45 g', 'Layout': '96% · 100 teclas' }
    }
];

// Slots "Próximo Drop": al tener imagen y precio, completar img/price/name
// y moverlo a PRODUCTS cuando salga a la venta.
const UPCOMING_DROPS = [
    { id: 'd1', name: 'Drop 01', eta: 'Diciembre 2026', img: null, teaser: 'Un 60% de aluminio con switches magnéticos.' },
    { id: 'd2', name: 'Drop 02', eta: 'Enero 2027',     img: null, teaser: 'Colaboración de keycaps artesanales.' },
    { id: 'd3', name: 'Drop 03', eta: 'Febrero 2027',   img: null, teaser: 'Un formato Alice ergonómico, edición limitada.' }
];

const getProduct = id => PRODUCTS.find(p => p.id === id);

const formatPrice = n => `S/ ${n.toLocaleString('es-PE')}`;
