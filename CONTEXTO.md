# Contexto del proyecto: ANG Shop

> Documento de traspaso. Resume todo lo construido hasta el 9 de octubre de 2026
> para continuar el trabajo desde otra terminal sin perder el historial.
> Léelo completo antes de modificar código.

## 1. Qué es

**ANG Shop** es la web de una tienda de teclados mecánicos (Perú, precios en Soles `S/`).
Es un sitio **estático: HTML + CSS + JavaScript puro**. No hay React, ni Vite, ni
Webpack, ni backend, ni `package.json`. Tailwind se carga por CDN.

- Idioma del sitio y de la conversación con el usuario: **español**.
- Estética obligatoria: **"Apple Liquid Glass"** en paleta **monocromática**
  (blanco, negro, grises). Los únicos colores permitidos son las fotos de producto,
  los badges pastel de tipo de switch, las estrellas ámbar `#F59E0B` y los puntos
  de stock (verde / ámbar).
- El usuario suele pedir cosas "en React" o "con prefijos de Tailwind". El proyecto
  no usa React: se implementa el equivalente en JS puro y se le explica.

## 2. Estructura de archivos

```
WebProclude/
├── CONTEXTO.md              ← este archivo
├── CLAUDE.md.md             ← NO es del proyecto: es un skill de diseño suelto (ignorar)
├── taste-skill/             ← ajeno al sitio (ignorar)
├── .claude/launch.json      ← servidor de vista previa (puerto 5500)
└── keyboards/               ← TODO el sitio vive aquí
    ├── index.html           (~750 líneas) única página; contiene las 2 vistas
    ├── style.css            (~1780) estilos de la portada, modal, footer, ajustes móviles
    ├── tienda.css           (~980) estilos del catálogo, dropdown, bolsa, toast
    ├── productos.js         (~100) DATOS: PRODUCTS, UPCOMING_DROPS, getProduct, formatPrice
    ├── script.js            (~400) portada: precarga, carrusel 3D, marquee, FAQ, newsletter, modal
    ├── tienda.js            (~490) router de vistas, catálogo, dropdown, bolsa de compras
    ├── checkout.css         (~620) estilos del modal de checkout
    ├── checkout.js          (~300) checkout en 3 pasos (envío, pago, confirmación) — simulado
    ├── cuenta.css           (~560) estilos del modal "Mi Cuenta" (usa los campos .ck-* de checkout.css)
    ├── cuenta.js            (~350) modal "Mi Cuenta": datos, pedidos, direcciones, seguridad, apariencia — simulado
    ├── tema.css             (~330) MODO OSCURO: sobrescrituras `html.dark …` de las otras 4 hojas
    └── imagenes/
        ├── pagos/                     logos de Yape, Plin y Visa (selector de método de pago)
        ├── logoglass01.png            logo (negro; en el footer se invierte a blanco con CSS)
        ├── Producto001.png … 005.png  fotos de teclados (500×500, fondo blanco)
        ├── arqui1.png                 despiece del teclado (sección Ingeniería de Precisión)
        ├── animado1.png               ya no se usa
        └── videoarqui1.MP4            ya no se usa (11 MB; se puede borrar)
```

Orden de carga de scripts (importa): `productos.js` → `script.js` → `tienda.js` → `checkout.js` → `cuenta.js`.

## 3. Cómo ejecutarlo

Las imágenes no cargan abriendo el archivo con `file://` en algunos entornos; usar un servidor:

```bash
npx -y http-server@14.1.1 keyboards -p 5500 -c-1
```

Luego abrir `http://localhost:5500`. También sirve la extensión Live Server de VS Code
apuntando a `keyboards/`.

## 4. Arquitectura: una sola página, dos vistas

No existe `productos.html` (el usuario lo prohibió expresamente). `index.html` contiene:

```
<nav>                        Navbar compartido (sticky, liquid glass)
<main id="view-home">        VISTA PORTADA
<main id="view-catalog" hidden>   VISTA CATÁLOGO
<footer class="site-footer"> Footer compartido
<div id="product-modal">     Modal de vista rápida
<div id="bag">               Drawer de la bolsa
<div id="toast">             Aviso flotante
```

**Router por hash** (en `tienda.js`, `initRouter`):
- `#/productos` → muestra el catálogo, oculta la portada, título "Catálogo – ANG Shop".
- Cualquier otro hash (`#faq`, `#experiencia`, vacío) → portada. Si se viene del
  catálogo, hace `scrollIntoView` del ancla manualmente (estaba oculta).
- Las secciones con `id` tienen `scroll-margin-top: 66px` para no quedar bajo el navbar.

### Secciones de la portada (en orden)
1. **Carrusel 3D** de los 5 teclados (dentro del hero).
2. **Hero + "Ingeniería de Precisión"** unificados: badge "AHORA DISPONIBLE", título,
   subtítulo, imagen `arqui1.png` en tarjeta glass + una frase corta + 3 métricas en píldoras
   (48h / 0.1ms / 24k) + lista de 4 specs + un solo botón ("Explorar colección"). Detrás del
   texto hay un halo gris desenfocado (`.precision-glow`) para que el cristal se distinga.
3. **Productos Destacados** (`#productos`): 5 tarjetas + enlace "Ver catálogo completo →".
4. **La Experiencia ANG** (`#experiencia`): Bento Grid de 4 tarjetas con vectores SVG.
5. **Testimonios**: marquee infinito de 3 reseñas con avatares SVG.
6. **FAQ** (`#faq`): 4 tarjetas en acordeón.
7. **CTA "Únete al club ANG"**: cápsula email + botón.

## 5. Datos de productos (`productos.js`) — fuente única

El catálogo, el modal y la bolsa leen de `PRODUCTS`. Orden del array = orden de aparición.

| id | Nombre | Imagen | Precio | Layout | formats | switchType | Badge | Stock | Pop. |
|----|--------|--------|--------|--------|---------|------------|-------|-------|------|
| p2 | ANG Crimson | Producto002 | 549 | 65% | `['65']` | Táctil | Switch táctil (blue) | disponible | 1 |
| p1 | ANG Aurora  | Producto001 | 699 | 75% | `['75']` | Lineal | Switch silencioso | disponible | 2 |
| p3 | ANG Blossom | Producto003 | 599 | TKL | `['custom']` | Lineal | Switch lineal (green) | pocos | 5 |
| p4 | ANG Hornet  | Producto004 | 819 | 75% | `['75','custom']` | Lineal | Edición especial | pocos | 3 |
| p5 | ANG Glacier | Producto005 | 929 | 96% | `['custom']` | Lineal | Switch lineal (green) | disponible | 4 |

- **Crimson (Producto002) va primero** en carrusel, destacados y catálogo (pedido expreso).
  Los archivos NO se renombraron; solo se reordenó.
- `UPCOMING_DROPS`: 3 slots "Próximo drop" (`d1`–`d3`) con `img: null`. Para lanzar uno:
  ponerle imagen/precio y moverlo a `PRODUCTS`.
- **Datos inventados por el asistente, pendientes de confirmar por el usuario:** nombres de
  modelos, precios, descripciones, especificaciones, stock, popularidad y fechas de drops.
- ⚠️ **Duplicación conocida:** las 5 tarjetas de "Productos Destacados" y las 5 del carrusel
  están escritas a mano en `index.html` (nombre, precio, descripción corta). Si cambia un
  precio o nombre en `productos.js`, hay que cambiarlo también ahí.

## 6. Funcionalidades y cómo están hechas

### Navbar
- Enlaces: **Productos** (`#/productos`, `data-nav="catalog"`), **Experiencia** (`#experiencia`),
  **FAQ** (`#faq`). Estilo: `text-zinc-900 font-medium text-[15px] hover:text-zinc-500`.
- Iconos SVG: bolsa (`#nav-cart`, con contador `#bag-count`) y usuario (`#nav-user`,
  abre el modal "Mi Cuenta").
- Menú hamburguesa en móvil (`toggleMenu()` en `script.js`).
- El usuario pidió varias veces **no tocar el diseño del navbar**: usar solo clases Tailwind
  en el HTML, no modificar `.nav-glass` en `style.css`.

### Carrusel 3D (`script.js` → `initCarousel3D`)
- **Ocupa todo el viewport** (`min-height: 100svh - navbar`). Debajo del teclado solo van el
  nombre y la descripción (typewriter) y una fila de controles `‹ puntos ›`.
- Los teclados se muestran **sin recuadro**: las fotos ya son PNG transparentes (el blanco
  lo ponía la tarjeta). `object-fit: cover` recorta la franja central de la foto cuadrada.
- **Halo de color** (excepción pedida a la regla monocromática): cada tarjeta lleva
  `data-glow="#colorA,#colorB"`; el JS los pasa a `--glow-a / --glow-b` (registradas con
  `@property` para animar el cambio) y `--stage-y` ancla el halo al centro del escenario.
  Intensidad baja (`color-mix` al 58 % / 38 % / 30 %). Viñeta suave en las esquinas.
- Transición: el activo queda al frente y nítido con sombra y flotación suave; los vecinos
  asoman detrás, pequeños, desaturados y desenfocados; el resto se oculta.
- Tarjetas posicionadas con `translateX / translateZ / rotateY / scale` según su distancia a
  la activa. Navegación: flechas, puntos, clic en laterales, arrastre/swipe, teclado.
- **Typewriter**: escribe nombre y luego descripción (`data-name`, `data-desc` de cada tarjeta).
- **Autoplay**: al terminar de escribir espera `AUTOPLAY_DELAY = 10000` ms y avanza.
  Toda navegación pasa por `goTo()` → `typeCaption()`, que cancela ambos timers.

### Modal de vista rápida (`script.js` → `initProductModal`)
- Se abre con `window.openProductModal(id)`. Lee de `PRODUCTS`.
- Imagen con zoom (clic amplía 2.2× y sigue al cursor), specs, botón "Añadir a la bolsa".
- Cierra con ×, Esc o clic fuera. Bloquea el scroll con `body.modal-open`.

### Catálogo (`tienda.js` → `Catalog`)
- Estado: `{ q, format, sw, sort }`. Render completo en cada cambio (`render()`).
- Búsqueda en tiempo real por nombre (ignora mayúsculas y tildes).
- Chips de formato: Todos / 65% / 75% / Custom (selección única).
- Chips de switch: Lineal / Táctil / Clicky (conmutables; ninguno es Clicky → estado vacío).
- Orden: dropdown propio (`createDropdown`), accesible con teclado.
- Grilla: 4 col (≥1180px) · 3 (≥900) · 2 (≥560) · **2 en móvil** (<560).
- Los 3 "Próximo drop" solo se muestran sin filtros activos. "Reservar" se guarda en
  `localStorage['ang-reservas']`.

### Bolsa de compras (`tienda.js` → `Bag`)
- API global: `Bag.add(id)`, `Bag.open()`, `Bag.close()`, `Bag.clear()`, `Bag.items()`,
  `Bag.count()`, `Bag.total()`.
- Cualquier elemento con `data-add-to-bag="pX"` añade a la bolsa (listener global).
- Drawer lateral con cantidades (máx. 10), eliminar y subtotal en S/. El envío se calcula
  en el checkout.
- Persiste en `localStorage['ang-bag']`.
- "Ir al checkout" cierra la bolsa y abre el modal de checkout.

### Checkout (`checkout.js` → `Checkout`)
- Modal `#checkout` en 3 pasos con indicador superior: **Envío → Pago → Confirmación**.
  API global: `Checkout.open()`, `Checkout.close()`.
- **Paso 1**: nombre, teléfono, DNI/CE, correo, ubicación (Lima S/ 0 · Provincias S/ 15),
  dirección y referencia. Validación propia (`RULES`), errores bajo cada campo.
- **Paso 2**: Yape/Plin (QR simulado + número de operación), tarjeta (número, MM/AA, CVC,
  titular) o transferencia (cuentas BCP e Interbank con botón "Copiar"). Solo se valida el
  panel del método elegido.
- **Paso 3**: check animado, código `#ANG-XXXX` aleatorio, resumen de artículos, dirección y
  entrega estimada. Al salir de este paso (botón, ×, Esc o clic fuera) se vacía la bolsa y se
  limpian los formularios. Cerrar en los pasos 1–2 conserva lo escrito y la bolsa.
- **Es una simulación**: no cobra, no envía nada a ningún servidor y los datos de pago no se
  guardan. El QR no codifica nada y las cuentas bancarias son ceros a propósito.
- Los textos escritos por el usuario se pintan con `textContent` (nunca `innerHTML`).

### Mi Cuenta (`cuenta.js` → `Account`)
- Modal `#account` que abre el ícono de usuario. API global: `Account.open()`, `Account.close()`.
- Encabezado: avatar redondo (iniciales o foto), nombre, correo e insignia "Miembro ANG VIP".
  La "subida" de foto es local: se recorta a 192 px y se guarda como data URL.
- 5 pestañas (`role="tablist"`, flechas ← →): **Datos personales** (nombre, correo, teléfono,
  DNI/CE), **Mis Pedidos** (acordeón; pedidos de ejemplo + los hechos en el checkout, que se
  guardan en `localStorage['ang-pedidos']`), **Direcciones** (añadir, eliminar, predeterminada)
  **Seguridad** (cambio de contraseña, switches de WhatsApp/Email, "Cerrar Sesión") y
  **Apariencia** (tema Claro / Oscuro).
- **Es una simulación**: no hay login. El perfil vive en `localStorage['ang-cuenta']`; las
  contraseñas se validan y se descartan (nunca se guardan). "Cerrar Sesión" borra ese perfil
  y vuelve al de demostración (`DEFAULTS`).
- Reutiliza las reglas de validación del checkout (`Checkout.rules`). Lo que escribe el
  usuario se escapa con `esc()` antes de ir a `innerHTML`.

### Modo oscuro (`tema.css`)
- Se activa con la clase **`dark` en `<html>`**, desde Mi Cuenta → Apariencia (`setTheme` en
  `cuenta.js`). Se guarda en `localStorage['ang-tema']` (`"claro"` / `"oscuro"`), aparte del
  perfil: "Cerrar Sesión" no lo cambia. Un `<script>` en el `<head>` lo aplica antes de pintar.
- `tema.css` se carga la última y **solo cambia colores**: cada regla repite un selector de
  `style.css` / `tienda.css` / `checkout.css` / `cuenta.css` con el prefijo `html.dark`. Las
  hojas originales no se tocaron; el modo claro queda idéntico.
- Criterio: los neutros se invierten (blanco → `#141417`, negro → `#F5F5F5`, cristal →
  `rgba(36,36,40,α)`), las sombras siguen negras y los colores con tono se conservan. Por eso
  los botones negros pasan a ser claros con texto oscuro.
- No cambian: el footer (ya era oscuro), los velos de los modales, el QR del checkout y las
  miniaturas del selector de tema. Al final del archivo hay ajustes a mano: utilidades de
  Tailwind del navbar, logo invertido, badges de switch, pozos de imagen y viñeta del hero.
- ⚠️ **Al añadir o recolorear un componente, hay que añadir su color en `tema.css`**; si no,
  en oscuro se verá con los colores del tema claro.

### Testimonios (`script.js` → `initMarquee`)
- El HTML tiene UN set (`#marquee-base`); el JS lo repite hasta cubrir el ancho visible y
  luego duplica el grupo. La animación CSS mueve `-50%`. Recalcula en `resize`.
- Pausa al pasar el cursor solo con `@media (hover: hover)` (en táctil se quedaba detenido).

### Newsletter (`script.js` → `initNewsletter`)
- Valida el email, muestra "✓ ¡Suscripción confirmada!". **Mock**: no envía nada a ningún servidor.

### FAQ
- Acordeón de una tarjeta abierta a la vez; altura animada con `grid-template-rows: 0fr → 1fr`.

## 7. Trampas técnicas ya resueltas (no reintroducir)

1. **`backdrop-filter` + `mix-blend-mode` dentro de transformaciones 3D** hacía que Chrome
   pintara vacías las tarjetas del carrusel. Las tarjetas del carrusel **no usan
   `backdrop-filter` ni blend modes**; el vidrio se simula con gradiente + borde + reflejo.
2. **`backdrop-filter` anidado**: un hijo con blur dentro de un padre con blur pierde su
   desenfoque. Por eso el vidrio de `.catalog-toolbar` está en su `::before`, no en el
   elemento (así el menú desplegable sí desenfoca).
3. **Hover con elevación en elementos con animación de entrada**: `.stagger-item.visible`
   usa `animation … forwards`, que fija `transform`. Para el hover se usa la propiedad
   **`translate`** (no `transform`).
4. **Navbar en pantallas < 290px** desbordaba y desplazaba toda la página. Se arregló con
   `h-7 sm:h-8`, `w-9 sm:w-10` y `min-w-0` en el logo.
5. **Marquee con hueco**: si el grupo es más angosto que la ventana aparece un espacio al
   final del ciclo. Lo resuelve `initMarquee` repitiendo el set.
6. **Reproducción de video en reversa**: los navegadores no soportan `playbackRate` negativo.
   Se implementó y luego el usuario pidió quitar el video; hoy se usa `arqui1.png`.
7. **Imágenes**: carga `eager` + `<link rel="preload">` + precarga por JS con `decode()`.
   Los contenedores muestran un shimmer hasta que la imagen está lista (clase `.img-ready`).
8. **Heredocs de bash en Git Bash (Windows)** fallan con comillas simples o backticks en el
   contenido. Para scripts auxiliares, escribirlos a un archivo en vez de usar heredoc.

## 8. Convenciones del código

- Comentarios y textos en **español**. Secciones marcadas con `// ── Título ──` (JS) y
  `/* ── Título ── */` (CSS).
- Receta "Liquid Glass" usada en todo el sitio:
  ```css
  border-radius: 1.5rem;
  background: linear-gradient(160deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55));
  backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(0,0,0,0.15–0.25);
  box-shadow: 0 1px 0 rgba(255,255,255,0.95) inset, 0 20px 40px -20px rgba(0,0,0,0.25);
  ```
- Tipografías: títulos (`h1–h3`) en serif (`Instrument Serif` / fallback), texto en
  `Plus Jakarta Sans`.
- Ajustes móviles: bloques `@media (max-width: 639px)` al final de `style.css` y
  `(max-width: 559px)` al final de `tienda.css`. **El usuario exige que el escritorio no
  cambie** cuando pide arreglos móviles.
- Accesibilidad que ya existe y hay que mantener: `aria-*` en modal, drawer, acordeón y
  dropdown; cierre con Esc; `prefers-reduced-motion` respetado.

## 9. Cómo se ha estado verificando

No hay tests. Cada cambio se comprobó con Chrome sin ventana (puppeteer-core contra
`localhost:5500`) en 320 / 375 / 1400 px: errores de consola, `scrollWidth` vs ancho de
pantalla (scroll horizontal) y capturas. El único error conocido y aceptado es el 404 de
`favicon.ico` (no existe).

## 10. Pendientes y cosas a confirmar con el usuario

- [ ] Confirmar o reemplazar los **datos inventados** (nombres, precios, specs, stock, drops,
      reseña de Sofía Larrea, respuestas del FAQ).
- [ ] La reseña de María García menciona «El **Prism**», un modelo que ya no existe.
- [ ] **Checkout real** (Culqi / Mercado Pago / Stripe) — hoy el flujo es una simulación.
      Antes de publicar: QR real de Yape/Plin, cuentas bancarias reales, y el formulario de
      tarjeta debe reemplazarse por el de la pasarela (no procesar tarjetas en el front).
- [ ] Confirmar costo de envío a provincias (S/ 15) y plazos de entrega (1–2 / 3–5 días hábiles).
- [ ] El `<link>` a `phosphor-icons@1.4.2` de `index.html` da 404 y no se usa: se puede quitar.
- [ ] **Newsletter real** (Mailchimp / Brevo / backend) — hoy no guarda el correo.
- [ ] **Login real**: "Mi Cuenta" es una simulación sin autenticación ni servidor.
- [ ] Confirmar los datos de demostración de "Mi Cuenta" (correo, direcciones, pedidos de ejemplo).
- [ ] Confirmar las métricas de "Ingeniería de Precisión" (48h, 0.1ms, 24k): son texto de marketing.
- [ ] Enlaces del footer y redes sociales apuntan a `#` (faltan URLs reales).
- [ ] Unificar las tarjetas de Destacados y del carrusel para que se generen desde
      `productos.js` (elimina la duplicación de la sección 5).
- [ ] Falta `favicon.ico`.
- [ ] `videoarqui1.MP4` (11 MB) y `animado1.png` ya no se usan: se pueden borrar.

## 11. Historial de la sesión (en orden)

1. Guardado de las 5 fotos como `Producto001`–`005.png`.
2. Carrusel 3D con tarjetas glass y efecto typewriter.
3. Hero y "Ingeniería de Precisión" unificados con video ping-pong → luego reemplazado por
   la imagen `arqui1.png` en tarjeta glass.
4. Autoplay del carrusel (5 s → ajustado a 10 s tras el typewriter).
5. Rediseño de Productos Destacados + modal de vista rápida; precios a Soles.
6. Corrección de imágenes que no se pintaban (bug de GPU) + precarga + placeholders.
7. Bento Grid "La Experiencia ANG" (reemplazó "Diseñado con precisión" y "Especificaciones técnicas").
8. Testimonios en marquee con avatares SVG y 3ª reseña.
9. FAQ en tarjetas glass con acordeón animado.
10. CTA "Únete al club ANG" con cápsula y estado de éxito.
11. Footer oscuro centrado con íconos sociales SVG.
12. Producto002 (Crimson) pasó a ser el primero.
13. Navbar: 3 enlaces + íconos de bolsa y usuario; luego mayor contraste.
14. Catálogo completo como segunda vista (router por hash), filtros, drops y bolsa de compras.
15. Optimización móvil: overflow, grillas de 2 columnas, carrusel, footer en 3 columnas.
16. Precisión en 2 columnas en móvil, marquee infinito real y dropdown personalizado.
17. Modal de checkout en 3 pasos conectado al botón "Ir al checkout" (sin commit todavía).
18. Carrusel del hero a pantalla completa, sin recuadros, con halo de color y viñeta (sin commit).
19. Fotos de Aurora, Crimson y Blossom reemplazadas por versiones de 1000×1000 (sin commit).
20. "Ingeniería de Precisión" minimalista: frase única, métricas en píldoras, un solo botón (sin commit).
21. Catálogo móvil: la barra de filtros ya no se monta sobre las tarjetas (`top: auto`) (sin commit).
22. Modal "Mi Cuenta" conectado al ícono de usuario del navbar (sin commit).
23. Pestaña "Apariencia" en Mi Cuenta y modo oscuro de toda la tienda (`tema.css`) (sin commit).

Último commit conocido: `7a7c648` (rama `main`).
