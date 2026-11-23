(() => {
  'use strict';

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];

  const orden = ['sobre', 'cofre', 'carta', 'flor'];
  const escenas = {
    sobre: $('#escena-sobre'),
    cofre: $('#escena-cofre'),
    carta: $('#escena-carta'),
    flor: $('#escena-flor'),
  };

  const sobre = $('#sobre');
  const cofre = $('#cofre');
  const mensajeCofre = $('#mensaje-cofre');
  const btnAbrirSobre = $('#abrir-sobre');
  const btnAbrirCofre = $('#abrir-cofre');
  const btnSeguir = $('#seguir-carta');
  const florFinal = $('#flor-final');
  const pistaFlor = $('#pista-flor');
  const reveladoFlor = $('#revelado-flor');
  const aviso = $('#aviso');
  const pasos = $$('.paso');

  const pocaAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ms = (normal, reducido = 0) => (pocaAnimacion.matches ? reducido : normal);

  let actual = 'sobre';
  let alcanzado = 0;
  let cambiando = false;
  const temporizadores = new Set();

  function despues(tiempo, fn) {
    const id = setTimeout(() => {
      temporizadores.delete(id);
      fn();
    }, tiempo);
    temporizadores.add(id);
    return id;
  }

  function cancelarTemporizadores() {
    temporizadores.forEach(clearTimeout);
    temporizadores.clear();
  }

  function anunciar(texto) {
    aviso.textContent = '';
    // Pequeña pausa para que los lectores de pantalla noten el cambio.
    setTimeout(() => { aviso.textContent = texto; }, 60);
  }

  /* ---------- Movimiento 3D: sigue al dedo o al ratón y, si nadie toca, se mece solo ---------- */

  const motor3d = (() => {
    let objetivos = [];
    let px = 0, py = 0, cx = 0, cy = 0;
    let ultimoGesto = -1e9;
    let cuadro = 0;

    function apuntar(e) {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
      ultimoGesto = performance.now();
    }

    function pintar(t) {
      cuadro = requestAnimationFrame(pintar);
      let ox, oy;
      if (t - ultimoGesto > 1600) {
        ox = Math.sin(t / 1500) * 0.62;
        oy = Math.sin(t / 2100 + 1) * 0.5;
      } else {
        ox = px;
        oy = py;
      }
      cx += (ox - cx) * 0.07;
      cy += (oy - cy) * 0.07;
      const sx = cx.toFixed(3);
      const sy = cy.toFixed(3);
      for (const el of objetivos) {
        el.style.setProperty('--tx', sx);
        el.style.setProperty('--ty', sy);
      }
    }

    function arrancar() {
      if (!cuadro && !pocaAnimacion.matches && !document.hidden) cuadro = requestAnimationFrame(pintar);
    }

    function parar() {
      cancelAnimationFrame(cuadro);
      cuadro = 0;
    }

    window.addEventListener('pointermove', apuntar, { passive: true });
    window.addEventListener('pointerdown', apuntar, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? parar() : arrancar()));

    return {
      enfocar(seccion) {
        objetivos = $$('[data-3d]', seccion);
        arrancar();
      },
    };
  })();

  /* ---------- Los corazones de arriba: dónde estás y a dónde puedes volver ---------- */

  function pintarPasos() {
    pasos.forEach((paso, i) => {
      paso.disabled = i > alcanzado;
      if (orden[i] === actual) paso.setAttribute('aria-current', 'step');
      else paso.removeAttribute('aria-current');
    });
  }

  pasos.forEach((paso) => {
    paso.addEventListener('click', () => {
      if (cambiando || paso.dataset.ir === actual) return;
      cancelarTemporizadores();
      irA(paso.dataset.ir);
    });
  });

  /* ---------- Cambio de escena ---------- */

  function irA(nombre, alCambiar) {
    if (cambiando || nombre === actual) return;
    cambiando = true;

    const sale = escenas[actual];
    const entra = escenas[nombre];
    const dejaElFoco = sale.contains(document.activeElement) || document.activeElement === document.body;
    sale.classList.remove('is-activa');

    setTimeout(() => {
      sale.hidden = true;
      // Cada escena queda lista para cuando se vuelva a ella.
      if (sale === escenas.sobre) cerrarSobre();
      if (sale === escenas.cofre && cofre.classList.contains('is-abierto')) {
        terminarCofre();
        cofre.classList.add('is-asentado');
      }
      if (alCambiar) alCambiar();

      entra.hidden = false;
      window.scrollTo(0, 0);
      void entra.offsetWidth; // fuerza el reflow para que la entrada se anime
      entra.classList.add('is-activa');
      actual = nombre;
      alcanzado = Math.max(alcanzado, orden.indexOf(nombre));
      cambiando = false;
      pintarPasos();
      motor3d.enfocar(entra);

      const foco = $('[data-foco]', entra);
      if (foco && dejaElFoco) foco.focus({ preventScroll: true });
    }, ms(300));
  }

  /* ---------- Escena 1: sobre ---------- */

  function abrirSobre() {
    if (cambiando || sobre.classList.contains('is-abierto')) return;
    sobre.classList.add('is-abierto');
    escenas.sobre.classList.add('is-abriendo');
    btnAbrirSobre.disabled = true;
    despues(ms(2300, 300), () => irA('cofre'));
  }

  function cerrarSobre() {
    sobre.classList.remove('is-abierto');
    escenas.sobre.classList.remove('is-abriendo');
    btnAbrirSobre.disabled = false;
  }

  btnAbrirSobre.addEventListener('click', abrirSobre);
  sobre.addEventListener('click', abrirSobre);

  /* ---------- Escena 2: cofre ---------- */

  function terminarCofre() {
    mensajeCofre.classList.add('is-visible');
    btnAbrirCofre.hidden = true;
    btnSeguir.hidden = false;
  }

  function abrirCofre() {
    if (cambiando || cofre.classList.contains('is-abierto')) return;
    cofre.classList.add('is-abierto');
    btnAbrirCofre.disabled = true;

    despues(ms(800, 0), () => {
      mensajeCofre.classList.add('is-visible');
      anunciar(mensajeCofre.textContent);
    });

    // Cuando ya salieron todas, las flores quedan fijas en su sitio.
    despues(ms(2600, 0), () => cofre.classList.add('is-asentado'));

    // «Seguir» aparece enseguida, pero no tan pronto como para pulsarlo con un doble toque.
    despues(ms(1200, 500), () => {
      const teniaFoco = document.activeElement === btnAbrirCofre || document.activeElement === document.body;
      terminarCofre();
      if (teniaFoco) btnSeguir.focus({ preventScroll: true });
    });
  }

  btnAbrirCofre.addEventListener('click', abrirCofre);
  cofre.addEventListener('click', abrirCofre);
  btnSeguir.addEventListener('click', () => irA('carta'));

  /* ---------- Escena 3: carta ---------- */

  $('#ir-flor').addEventListener('click', () => irA('flor'));

  // Cada párrafo se levanta del papel cuando le toca leerse.
  (function prepararLectura() {
    const trozos = $$('.carta-texto p, .carta-firma, .carta-pd, .carta-estampas');
    if (!('IntersectionObserver' in window) || pocaAnimacion.matches) return;
    trozos.forEach((t) => t.classList.add('al-leer'));
    const vigia = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('is-vista');
        vigia.unobserve(entrada.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    trozos.forEach((t) => vigia.observe(t));
  })();

  /* ---------- Escena 4: última flor ---------- */

  function soltarCorazones() {
    if (pocaAnimacion.matches) return;
    const cantidad = 9;
    for (let i = 0; i < cantidad; i++) {
      const c = document.createElement('img');
      c.className = 'chispa';
      c.alt = '';
      c.src = i % 3 === 2 ? './assets/flowers/destello.svg' : './assets/corazon.svg';
      const angulo = (-150 + (120 / (cantidad - 1)) * i + (Math.random() * 16 - 8)) * (Math.PI / 180);
      const distancia = 5.5 + Math.random() * 3.5;
      c.style.setProperty('--cx', (Math.cos(angulo) * distancia).toFixed(2) + 'rem');
      c.style.setProperty('--cy', (Math.sin(angulo) * distancia).toFixed(2) + 'rem');
      c.style.setProperty('--ct', (i * 35) + 'ms');
      c.style.setProperty('--cs', (0.9 + Math.random() * 0.7).toFixed(2) + 'rem');
      c.addEventListener('animationend', () => c.remove());
      florFinal.appendChild(c);
    }
  }

  function tocarFlor() {
    if (cambiando) return;
    if (!florFinal.classList.contains('is-florecida')) {
      florFinal.classList.add('is-florecida');
      florFinal.setAttribute('aria-label', 'La florecita, ya abierta');
      pistaFlor.classList.add('is-oculta');
      reveladoFlor.classList.add('is-visible');
      anunciar(reveladoFlor.textContent.replace(/\s+/g, ' ').trim());
    }
    if (florFinal.querySelectorAll('.chispa').length < 18) soltarCorazones();
  }

  florFinal.addEventListener('click', tocarFlor);

  $('#releer').addEventListener('click', () => irA('carta'));

  /* ---------- Reinicio limpio, sin recargar ---------- */

  function reiniciar() {
    if (cambiando) return;
    cancelarTemporizadores();
    irA('sobre', () => {
      cerrarSobre();

      cofre.classList.remove('is-abierto', 'is-asentado');
      mensajeCofre.classList.remove('is-visible');
      btnAbrirCofre.disabled = false;
      btnAbrirCofre.hidden = false;
      btnSeguir.hidden = true;

      florFinal.classList.remove('is-florecida');
      florFinal.setAttribute('aria-label', 'Tocar la florecita');
      florFinal.querySelectorAll('.chispa').forEach((c) => c.remove());
      pistaFlor.classList.remove('is-oculta');
      reveladoFlor.classList.remove('is-visible');
      aviso.textContent = '';
      alcanzado = -1; // irA lo deja en 0 al terminar de volver al sobre
    });
  }

  $('#reiniciar').addEventListener('click', reiniciar);

  /* ---------- Florecitas que caen despacio de fondo ---------- */

  (function sembrarAmbiente() {
    const capa = $('#ambiente');
    const tonos = ['rosa', 'rosa', 'crema', 'salvia', 'oro'];
    const cantidad = window.innerWidth < 600 ? 11 : 18;
    for (let i = 0; i < cantidad; i++) {
      const p = document.createElement('span');
      p.className = 'petalo petalo-' + tonos[i % tonos.length];
      const duracion = 16 + Math.random() * 16;
      p.style.setProperty('--px', (Math.random() * 100).toFixed(1) + '%');
      p.style.setProperty('--py', (Math.random() * 100).toFixed(1) + '%');
      p.style.setProperty('--pu', (2 + Math.round(Math.random() * 2)) + 'px');
      p.style.setProperty('--pt', duracion.toFixed(1) + 's');
      p.style.setProperty('--pd', (-Math.random() * duracion).toFixed(1) + 's');
      p.style.setProperty('--pv', (Math.random() * 14 - 7).toFixed(1) + 'vw');
      capa.appendChild(p);
    }
  })();

  pintarPasos();
  motor3d.enfocar(escenas.sobre);
})();
