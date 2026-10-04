(function () {
    const searchInput = document.getElementById('search');
    const resultsEl = document.getElementById('results');
    const hintEl = document.getElementById('hint');

    const RECENT_APPS_KEY = 'recent-apps';

    let apps = [];
    let matches = [];
    let activeIndex = -1;

    function searchHaystack(app) {
        return (app.title + ' ' + app.keywords.join(' ')).toLowerCase();
    }

    function getRecentApps() {
        try {
            const raw = localStorage.getItem(RECENT_APPS_KEY);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            const knownUrls = new Set(apps.map(function (app) {
                return app.url;
            }));

            return parsed.filter(function (entry) {
                return entry && entry.url && knownUrls.has(entry.url);
            });
        } catch (e) {
            return [];
        }
    }

    function withRecentFirst(list) {
        const recentOrder = new Map();
        getRecentApps().forEach(function (entry, index) {
            if (!recentOrder.has(entry.url)) recentOrder.set(entry.url, index);
        });

        return list.slice().sort(function (a, b) {
            const aRank = recentOrder.has(a.url) ? recentOrder.get(a.url) : Number.POSITIVE_INFINITY;
            const bRank = recentOrder.has(b.url) ? recentOrder.get(b.url) : Number.POSITIVE_INFINITY;
            return aRank - bRank;
        });
    }

    function filterApps(query) {
        const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return withRecentFirst(apps);

        return apps.filter(function (app) {
            const haystack = searchHaystack(app);
            return tokens.every(function (token) {
                return haystack.indexOf(token) !== -1;
            });
        });
    }

    function renderResults() {
        resultsEl.innerHTML = '';
        activeIndex = -1;

        if (matches.length === 0) {
            hintEl.textContent = 'No matching apps';
            hintEl.hidden = false;
            return;
        }

        hintEl.hidden = true;

        matches.forEach(function (app, index) {
            const item = document.createElement('a');
            item.className = 'result-item';
            item.href = app.url;
            item.target = '_blank';
            item.rel = 'noopener noreferrer';
            item.setAttribute('role', 'option');
            item.setAttribute('data-index', String(index));
            item.textContent = app.title;
            item.addEventListener('click', function () {
                saveRecentApp(app);
                if (!searchInput.value.trim()) {
                    matches = filterApps('');
                    renderResults();
                }
            });
            resultsEl.appendChild(item);
        });
    }

    function setActiveIndex(index) {
        const items = resultsEl.querySelectorAll('.result-item');
        items.forEach(function (el, i) {
            el.classList.toggle('active', i === index);
        });
        activeIndex = index;
        if (index >= 0 && items[index]) {
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

    function saveRecentApp(app) {
        try {
            let recent = [];
            const raw = localStorage.getItem(RECENT_APPS_KEY);
            if (raw) {
                recent = JSON.parse(raw);
                if (!Array.isArray(recent)) recent = [];
            }

            recent = recent.filter(function (entry) {
                return entry.url !== app.url;
            });
            recent.unshift({ title: app.title, url: app.url, openedAt: Date.now() });
            localStorage.setItem(RECENT_APPS_KEY, JSON.stringify(recent));
        } catch (e) {
            // ignore storage errors (e.g. private browsing)
        }
    }

    function openApp(app) {
        saveRecentApp(app);
        matches = filterApps(searchInput.value);
        renderResults();
        window.open(app.url, '_blank', 'noopener,noreferrer');
    }

    function onSearchInput() {
        matches = filterApps(searchInput.value);
        renderResults();
    }

    searchInput.addEventListener('input', onSearchInput);

    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (matches.length === 0) return;
            const next = activeIndex < matches.length - 1 ? activeIndex + 1 : 0;
            setActiveIndex(next);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (matches.length === 0) return;
            const prev = activeIndex > 0 ? activeIndex - 1 : matches.length - 1;
            setActiveIndex(prev);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && matches[activeIndex]) {
                openApp(matches[activeIndex]);
            } else if (matches.length === 1) {
                openApp(matches[0]);
            }
        } else if (e.key === 'Escape') {
            searchInput.value = '';
            matches = filterApps('');
            renderResults();
            searchInput.blur();
        }
    });

    apps = window.APPS || [];
    if (apps.length === 0) {
        hintEl.textContent = 'Could not load app list';
        hintEl.hidden = false;
        return;
    }

    searchInput.disabled = false;
    searchInput.placeholder = 'Search apps…';
    matches = filterApps('');
    renderResults();
    searchInput.focus();
})();
