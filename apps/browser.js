/**
 * Opera GX Virtual Browser
 * – Eigene Startseite (funktioniert immer)
 * – iframe wo möglich
 * – Host-Tab-Fallback wo Seiten Embedding blocken
 * – Download-Passwort-Schutz
 * – Touch-freundlich
 */
const BrowserApp = {
  homeUrl: 'gx://home',
  searchUrl: (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent(q) + '&kae=d',

  render(container, winId, options = {}) {
    const startUrl = options.url || this.homeUrl;
    container.innerHTML = `
      <div class="browser-app">
        <div class="browser-tabs" id="${winId}_tabs"></div>
        <div class="browser-toolbar">
          <button class="browser-nav-btn" id="${winId}_back" title="Zurück" type="button">←</button>
          <button class="browser-nav-btn" id="${winId}_fwd" title="Vorwärts" type="button">→</button>
          <button class="browser-nav-btn" id="${winId}_reload" title="Aktualisieren" type="button">↻</button>
          <button class="browser-nav-btn" id="${winId}_home" title="Startseite" type="button">⌂</button>
          <div class="browser-address">
            <input type="text" id="${winId}_url" placeholder="Suchen oder URL eingeben" value="" enterkeyhint="go" autocapitalize="off" autocomplete="off" spellcheck="false">
          </div>
          <button class="browser-nav-btn" id="${winId}_go" title="Los" type="button">➔</button>
          <button class="browser-nav-btn" id="${winId}_newtab" title="Neuer Tab" type="button">+</button>
          <button class="browser-nav-btn" id="${winId}_host" title="Im echten Browser öffnen" type="button">↗</button>
        </div>
        <div class="browser-content" id="${winId}_content"></div>
      </div>
    `;

    const state = {
      tabs: [{ id: 1, title: 'Start', url: startUrl, history: [startUrl], histIndex: 0 }],
      activeTab: 1,
      nextId: 2
    };

    const tabsEl = document.getElementById(winId + '_tabs');
    const contentEl = document.getElementById(winId + '_content');
    const urlInput = document.getElementById(winId + '_url');
    const getActive = () => state.tabs.find(t => t.id === state.activeTab);

    const normalizeUrl = (input) => {
      let u = (input || '').trim();
      if (!u) return this.homeUrl;
      if (u === 'gx://home' || u === 'about:home' || u === 'about:blank') return this.homeUrl;
      if (/^https?:\/\//i.test(u)) return u;
      if (!u.includes(' ') && (u.includes('.') || u.startsWith('localhost'))) return 'https://' + u;
      return this.searchUrl(u);
    };

    const displayUrl = (url) => (url === this.homeUrl ? '' : url);

    const renderTabs = () => {
      tabsEl.innerHTML = state.tabs.map(t => `
        <div class="browser-tab ${t.id === state.activeTab ? 'active' : ''}" data-id="${t.id}">
          <span class="tab-title">${this.escape(t.title)}</span>
          <button class="tab-close" data-id="${t.id}" type="button" aria-label="Tab schließen">✕</button>
        </div>
      `).join('');

      tabsEl.querySelectorAll('.browser-tab').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target.closest('.tab-close')) return;
          state.activeTab = parseInt(el.dataset.id, 10);
          renderTabs();
          loadActive();
        });
      });
      tabsEl.querySelectorAll('.tab-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.dataset.id, 10);
          if (state.tabs.length === 1) {
            state.tabs[0] = { id: state.tabs[0].id, title: 'Start', url: this.homeUrl, history: [this.homeUrl], histIndex: 0 };
            state.activeTab = state.tabs[0].id;
          } else {
            state.tabs = state.tabs.filter(t => t.id !== id);
            if (state.activeTab === id) state.activeTab = state.tabs[0].id;
          }
          renderTabs();
          loadActive();
        });
      });
    };

    const renderHome = () => {
      contentEl.innerHTML = `
        <div class="gx-startpage">
          <div class="gx-start-logo">
            <svg viewBox="0 0 64 64" width="64" height="64">
              <circle cx="32" cy="32" r="30" fill="none" stroke="#ff1b2d" stroke-width="3"/>
              <path d="M18 38 Q32 12 46 38 Q32 50 18 38" fill="#ff1b2d"/>
              <circle cx="32" cy="32" r="7" fill="#0d0d0d"/>
            </svg>
            <h1>Opera <span>GX</span></h1>
            <p>Gaming Browser · Virtual PC</p>
          </div>
          <form class="gx-start-search" id="${winId}_homesearch">
            <input type="search" id="${winId}_homeq" placeholder="Im Web suchen…" enterkeyhint="search" autocomplete="off">
            <button type="submit">Suchen</button>
          </form>
          <div class="gx-start-links">
            <button type="button" data-url="https://duckduckgo.com/?kae=d">DuckDuckGo</button>
            <button type="button" data-url="https://en.wikipedia.org/wiki/Main_Page">Wikipedia</button>
            <button type="button" data-url="https://www.wikipedia.org">Wikipedia.org</button>
            <button type="button" data-url="https://example.com">Example.com</button>
            <button type="button" data-url="https://info.cern.ch">CERN (1. Website)</button>
            <button type="button" data-url="https://archive.org">Archive.org</button>
          </div>
          <p class="gx-start-hint">Viele moderne Seiten blockieren iframes. Nutze dann „↗“ oben rechts, um die Seite im echten Browser-Tab zu öffnen.</p>
        </div>
      `;
      document.getElementById(winId + '_homesearch')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = document.getElementById(winId + '_homeq')?.value || '';
        if (q.trim()) navigate(q.trim());
      });
      contentEl.querySelectorAll('[data-url]').forEach(btn => {
        btn.addEventListener('click', () => navigate(btn.dataset.url));
      });
      setTimeout(() => document.getElementById(winId + '_homeq')?.focus(), 50);
    };

    const showBlocked = (url) => {
      contentEl.innerHTML = `
        <div class="browser-fallback">
          <div style="font-size:48px;">🔒</div>
          <h3>Seite blockiert Embedding</h3>
          <p>Diese Website erlaubt keine Anzeige in einem eingebetteten Fenster (X-Frame-Options / CSP).</p>
          <p style="font-size:12px;opacity:0.7;word-break:break-all;margin:8px 0;">${this.escape(url)}</p>
          <button type="button" id="${winId}_openext" class="media-btn">Im echten Browser-Tab öffnen</button>
          <p style="font-size:12px;opacity:0.5;margin-top:12px;">Das ist eine normale Browser-Sicherheitsregel – kein Fehler dieses virtuellen PCs.</p>
        </div>
      `;
      document.getElementById(winId + '_openext')?.addEventListener('click', async () => {
        if (VirtualPC.isDownloadUrl(url)) {
          const ok = await VirtualPC.requireDownloadPassword('Externen Link öffnen');
          if (!ok) return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    };

    const showDownloadGate = (url) => {
      contentEl.innerHTML = `
        <div class="browser-fallback">
          <div style="font-size:48px;">🔒</div>
          <h3>Download-Schutz aktiv</h3>
          <p>Diese Adresse sieht nach einem Download aus.</p>
          <p style="font-size:12px;opacity:0.7;word-break:break-all;">${this.escape(url)}</p>
          <button type="button" id="${winId}_dlunlock" class="media-btn">Passwort eingeben &amp; fortfahren</button>
        </div>
      `;
      document.getElementById(winId + '_dlunlock')?.addEventListener('click', async () => {
        const ok = await VirtualPC.requireDownloadPassword('Download / Datei-Link');
        if (ok) {
          window.open(url, '_blank', 'noopener,noreferrer');
          VirtualPC.notify('Browser', 'Link freigeschaltet', '🔓');
        }
      });
    };

    const loadActive = () => {
      const tab = getActive();
      if (!tab) return;
      urlInput.value = displayUrl(tab.url);
      contentEl.innerHTML = '';

      if (tab.url === this.homeUrl) {
        tab.title = 'Start';
        renderTabs();
        renderHome();
        return;
      }

      if (VirtualPC.isDownloadUrl(tab.url)) {
        showDownloadGate(tab.url);
        return;
      }

      // Loading indicator
      contentEl.innerHTML = `<div class="browser-fallback"><div class="boot-spinner" style="margin:0 auto 16px;"></div><p>Lade Seite…</p></div>`;

      const iframe = document.createElement('iframe');
      iframe.src = tab.url;
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation');
      iframe.setAttribute('referrerpolicy', 'no-referrer');
      iframe.setAttribute('allow', 'fullscreen');
      iframe.style.cssText = 'width:100%;height:100%;border:none;background:#111;';

      let settled = false;
      const settle = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (!ok) {
          showBlocked(tab.url);
          return;
        }
        contentEl.innerHTML = '';
        contentEl.appendChild(iframe);
        try {
          const title = iframe.contentDocument?.title;
          if (title) tab.title = title.slice(0, 40);
          else tab.title = new URL(tab.url).hostname;
        } catch (e) {
          try { tab.title = new URL(tab.url).hostname; } catch (_) { tab.title = 'Seite'; }
        }
        renderTabs();
      };

      const timer = setTimeout(() => {
        // Nach Timeout trotzdem iframe zeigen – manche Seiten laden langsam
        settle(true);
      }, 4000);

      iframe.onload = () => settle(true);
      iframe.onerror = () => settle(false);

      // Sofort anzeigen (besser UX); Fallback nur wenn User klickt
      contentEl.innerHTML = '';
      contentEl.appendChild(iframe);

      // History
      try {
        let hist = JSON.parse(localStorage.getItem('vpc_browser_history') || '[]');
        hist.unshift({ url: tab.url, time: Date.now() });
        localStorage.setItem('vpc_browser_history', JSON.stringify(hist.slice(0, 80)));
      } catch (e) {}
    };

    const navigate = async (input) => {
      const tab = getActive();
      if (!tab) return;
      const url = normalizeUrl(input);
      if (VirtualPC.isDownloadUrl(url) && url !== this.homeUrl) {
        const ok = await VirtualPC.requireDownloadPassword('Navigation zu Download-Adresse');
        if (!ok) {
          VirtualPC.notify('Browser', 'Ohne Passwort blockiert', '🔒');
          return;
        }
      }
      tab.url = url;
      tab.history = tab.history.slice(0, tab.histIndex + 1);
      tab.history.push(url);
      tab.histIndex = tab.history.length - 1;
      tab.title = url === this.homeUrl ? 'Start' : 'Laden…';
      renderTabs();
      loadActive();
    };

    document.getElementById(winId + '_go').addEventListener('click', () => navigate(urlInput.value));
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigate(urlInput.value);
      }
    });
    document.getElementById(winId + '_back').addEventListener('click', () => {
      const tab = getActive();
      if (tab && tab.histIndex > 0) {
        tab.histIndex--;
        tab.url = tab.history[tab.histIndex];
        tab.title = tab.url === this.homeUrl ? 'Start' : '…';
        renderTabs();
        loadActive();
      }
    });
    document.getElementById(winId + '_fwd').addEventListener('click', () => {
      const tab = getActive();
      if (tab && tab.histIndex < tab.history.length - 1) {
        tab.histIndex++;
        tab.url = tab.history[tab.histIndex];
        renderTabs();
        loadActive();
      }
    });
    document.getElementById(winId + '_reload').addEventListener('click', () => loadActive());
    document.getElementById(winId + '_home').addEventListener('click', () => navigate(this.homeUrl));
    document.getElementById(winId + '_newtab').addEventListener('click', () => {
      const id = state.nextId++;
      state.tabs.push({ id, title: 'Start', url: this.homeUrl, history: [this.homeUrl], histIndex: 0 });
      state.activeTab = id;
      renderTabs();
      loadActive();
    });
    document.getElementById(winId + '_host').addEventListener('click', async () => {
      const tab = getActive();
      if (!tab || tab.url === this.homeUrl) {
        VirtualPC.notify('Browser', 'Keine externe URL in diesem Tab', 'ℹ️');
        return;
      }
      if (VirtualPC.isDownloadUrl(tab.url)) {
        const ok = await VirtualPC.requireDownloadPassword('Im Host-Browser öffnen');
        if (!ok) return;
      }
      window.open(tab.url, '_blank', 'noopener,noreferrer');
    });

    renderTabs();
    loadActive();
  },

  escape(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }
};

window.BrowserApp = BrowserApp;
