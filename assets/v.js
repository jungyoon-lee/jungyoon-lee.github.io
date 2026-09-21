(function () {
  var URL_ = 'https://old-rain-5bc0.agurimon18.workers.dev/';
  var SS = 'vs';   // sessionStorage: current session
  var LS = 'vr';   // localStorage: visit count

  // opt out this browser for good by opening any page with #me once
  try {
    if (location.hash === '#me') localStorage.setItem('noTrack', '1');
    if (localStorage.getItem('noTrack')) return;
  } catch (e) { return; }

  var ua = navigator.userAgent;
  if (/bot|crawl|spider|slurp|headless|lighthouse|preview|monitor/i.test(ua)) return;

  function load() { try { return JSON.parse(sessionStorage.getItem(SS)) || null; } catch (e) { return null; } }
  function save(s) { try { sessionStorage.setItem(SS, JSON.stringify(s)); } catch (e) {} }

  var s = load();
  if (!s) {
    var n = 1;
    try { n = (parseInt(localStorage.getItem(LS), 10) || 0) + 1; localStorage.setItem(LS, n); } catch (e) {}
    s = {
      ref: document.referrer,
      repeat: n,
      device: /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop',
      browser: /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome'
             : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'other',
      screen: window.innerWidth + '×' + window.innerHeight,
      lang: navigator.language || '',
      tz: (window.Intl && Intl.DateTimeFormat().resolvedOptions().timeZone) || '',
      pages: [], clicks: [], dur: 0, sent: 0
    };
  }

  // /index.html and / are the same page — record one form so paths group cleanly
  var path = location.pathname.replace(/\/index\.html$/, '/') || '/';
  var page = { p: path + location.search, t: 0, s: 0 };
  s.pages.push(page);
  save(s);

  var t0 = Date.now(), maxScroll = 0, internal = false;

  function scrollPct() {
    var h = document.documentElement;
    var total = h.scrollHeight - h.clientHeight;
    if (total <= 0) return 100;
    return Math.min(100, Math.round((h.scrollTop || document.body.scrollTop) / total * 100));
  }
  function tick() { var p = scrollPct(); if (p > maxScroll) maxScroll = p; }
  addEventListener('scroll', tick, { passive: true });
  tick();

  function sync() {
    page.t = Math.round((Date.now() - t0) / 1000);
    page.s = maxScroll;
    s.dur = s.pages.reduce(function (a, x) { return a + (x.t || 0); }, 0);
    save(s);
  }

  // record PDF opens and outbound clicks; plain internal links just continue the session
  addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;

    var abs, sameSite;
    try { abs = new URL(href, location.href); sameSite = abs.hostname === location.hostname; }
    catch (e) { return; }

    var isPdf = /\.pdf($|[?#])/i.test(abs.pathname);
    if (sameSite && !isPdf) { internal = true; return; }

    var label = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) || abs.hostname;
    s.clicks.push({ l: label, h: abs.href });
    sync();
  }, true);

  function send() {
    if (s.sent) return;
    sync();
    if (internal) return;                 // moving within the site — hold the digest
    s.sent = 1; save(s);
    var body = new Blob([JSON.stringify(s)], { type: 'text/plain' });   // avoids a CORS preflight
    if (!(navigator.sendBeacon && navigator.sendBeacon(URL_, body))) {
      fetch(URL_, { method: 'POST', body: JSON.stringify(s), keepalive: true, mode: 'cors' }).catch(function () {});
    }
  }

  addEventListener('pagehide', send);
  addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') sync(); });
})();
