/**
 * Applies parent-app branding (postMessage) to marketing embed pages.
 * Loaded by website.html and how-it-works.html.
 */
(function () {
  var MESSAGE_TYPE = 'mw-branding';
  var DEFAULT_NAME = 'PetaxAI Learning';

  function setCssVars(colors) {
    if (!colors) return;
    var root = document.documentElement;
    var brand =
      'linear-gradient(135deg, ' +
      colors.gradientStart +
      ' 0%, ' +
      colors.gradientMid +
      ' 50%, ' +
      colors.gradientEnd +
      ' 100%)';

    root.style.setProperty('--primary', colors.primaryContainer || colors.primary);
    root.style.setProperty('--secondary', colors.secondaryContainer || colors.gradientMid);
    root.style.setProperty('--tertiary', colors.tertiaryContainer || colors.gradientEnd);
    root.style.setProperty('--brand', brand);
    root.style.setProperty('--bg', colors.surfaceContainerLow || '#070708');
    root.style.setProperty('--surface', colors.surface || '#121214');
    root.style.setProperty('--surface-2', colors.surfaceContainer || '#1c1c1f');
    root.style.setProperty('--text', colors.onSurface || '#f4f4f5');
    root.style.setProperty('--muted', colors.onSurfaceVariant || '#a1a1aa');
    root.style.setProperty('--border', colors.outline || '#27272a');
  }

  function setText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = value;
    });
  }

  function setHtmlName(name) {
    if (!name) return;
    document.querySelectorAll('[data-brand="appName"]').forEach(function (el) {
      el.textContent = name;
    });
    document.querySelectorAll('[data-brand="appName-in"]').forEach(function (el) {
      var tpl = el.getAttribute('data-brand-template') || '{name}';
      el.textContent = tpl.replace(/\{name\}/g, name);
    });
    document.title = document.title.replace(DEFAULT_NAME, name);
    var meta = document.querySelector('meta[name="description"]');
    if (meta && meta.content) {
      meta.content = meta.content.replace(new RegExp(DEFAULT_NAME, 'g'), name);
    }
  }

  function setLogo(logoUrl, appName) {
    var imgs = document.querySelectorAll('[data-brand="logo"]');
    var marks = document.querySelectorAll('[data-brand="logo-fallback"]');
    if (!logoUrl) {
      imgs.forEach(function (img) {
        img.hidden = true;
      });
      marks.forEach(function (mark) {
        mark.hidden = false;
      });
      return;
    }
    imgs.forEach(function (img) {
      img.src = logoUrl;
      img.alt = appName || 'App logo';
      img.hidden = false;
    });
    marks.forEach(function (mark) {
      mark.hidden = true;
    });
  }

  function applyBranding(payload) {
    if (!payload) return;
    setCssVars(payload.colors);
    setHtmlName(payload.appName || DEFAULT_NAME);
    setText('[data-brand="tagline"]', payload.tagline);
    setLogo(payload.logoUrl, payload.appName);
    document.documentElement.classList.add('is-branded');
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin) return;
    var data = event.data;
    if (!data || data.type !== MESSAGE_TYPE || !data.payload) return;
    applyBranding(data.payload);
  });

  // Ready handshake so parent can push immediately after load
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'mw-branding-ready' }, window.location.origin);
    }
  } catch (e) {
    /* ignore */
  }

  window.__mwApplyBranding = applyBranding;
})();
