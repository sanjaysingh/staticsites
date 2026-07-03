(function () {
    const searchInput = document.getElementById('search');
    const resultsEl = document.getElementById('results');
    const hintEl = document.getElementById('hint');
    const recentEl = document.getElementById('recent-apps');
    const recentListEl = recentEl && recentEl.querySelector('.recent-list');
    const recentClearBtn = document.getElementById('recent-clear');

    const MIN_QUERY_LENGTH = 2;
    const MAX_RECENT_APPS = 5;
    const RECENT_APPS_KEY = 'recent-apps';
    const HINT_EXAMPLES = 'Examples: case, jwt, pdf, hash, uuid';
    const HINT_MIN_LENGTH = 'Type at least 2 characters — ' + HINT_EXAMPLES;

    let apps = [];
    let matches = [];
    let activeIndex = -1;
    let recentItems = [];
    let recentActiveIndex = -1;

    function searchHaystack(app) {
        return (app.title + ' ' + app.keywords.join(' ')).toLowerCase();
    }

    function filterApps(query) {
        const trimmed = query.trim();
        if (trimmed.length < MIN_QUERY_LENGTH) return [];

        const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return [];

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
            const trimmed = searchInput.value.trim();
            if (trimmed.length === 0) {
                hintEl.textContent = HINT_EXAMPLES;
            } else if (trimmed.length < MIN_QUERY_LENGTH) {
                hintEl.textContent = HINT_MIN_LENGTH;
            } else {
                hintEl.textContent = 'No matching apps';
            }
            hintEl.hidden = false;
            return;
        }

        hintEl.hidden = true;

        matches.forEach(function (app, index) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'result-item';
            item.setAttribute('role', 'option');
            item.setAttribute('data-index', String(index));
            item.textContent = app.title;
            item.addEventListener('click', function () {
                openApp(app);
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

    function getRecentApps() {
        try {
            const raw = localStorage.getItem(RECENT_APPS_KEY);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];

            const knownUrls = new Set(apps.map(function (app) {
                return app.url;
            }));

            return parsed
                .filter(function (entry) {
                    return entry && entry.url && entry.title && knownUrls.has(entry.url);
                })
                .slice(0, MAX_RECENT_APPS);
        } catch (e) {
            return [];
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
            recent = recent.slice(0, MAX_RECENT_APPS);
            localStorage.setItem(RECENT_APPS_KEY, JSON.stringify(recent));
        } catch (e) {
            // ignore storage errors (e.g. private browsing)
        }
    }

    function clearRecentApps() {
        try {
            localStorage.removeItem(RECENT_APPS_KEY);
        } catch (e) {
            // ignore storage errors
        }

        recentItems = [];
        recentActiveIndex = -1;
        renderRecentApps();
        searchInput.focus();
    }

    function isRecentVisible() {
        return recentEl && !recentEl.hidden && recentItems.length > 0;
    }

    function clearRecentActiveIndex() {
        setRecentActiveIndex(-1);
    }

    function setRecentActiveIndex(index) {
        if (!recentListEl) return;

        const items = recentListEl.querySelectorAll('.recent-item');
        items.forEach(function (el, i) {
            el.classList.toggle('active', i === index);
            el.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
        recentActiveIndex = index;
        if (index >= 0 && items[index]) {
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

    function updateRecentVisibility() {
        if (!recentEl) return;

        const hasQuery = searchInput.value.trim().length > 0;
        recentEl.hidden = hasQuery || recentItems.length === 0;

        if (hasQuery) {
            clearRecentActiveIndex();
        }
    }

    function getRecentInitial(title) {
        return title.trim().charAt(0).toUpperCase() || '?';
    }

    function renderRecentApps() {
        if (!recentListEl) return;

        recentItems = getRecentApps();
        recentListEl.innerHTML = '';
        recentActiveIndex = -1;

        if (recentItems.length === 0) {
            recentEl.hidden = true;
            return;
        }

        recentItems.forEach(function (entry, index) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'recent-item';
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', 'false');
            item.setAttribute('data-index', String(index));

            const icon = document.createElement('span');
            icon.className = 'recent-item-icon';
            icon.textContent = getRecentInitial(entry.title);
            icon.setAttribute('aria-hidden', 'true');

            const title = document.createElement('span');
            title.className = 'recent-item-title';
            title.textContent = entry.title;

            item.appendChild(icon);
            item.appendChild(title);
            item.addEventListener('click', function () {
                openApp(entry);
            });
            recentListEl.appendChild(item);
        });

        updateRecentVisibility();
    }

    function openApp(app) {
        saveRecentApp(app);
        window.location.href = app.url;
    }

    function onSearchInput() {
        const query = searchInput.value;
        matches = filterApps(query);
        renderResults();
        updateRecentVisibility();
    }

    searchInput.addEventListener('input', onSearchInput);

    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (matches.length > 0) {
                clearRecentActiveIndex();
                const next = activeIndex < matches.length - 1 ? activeIndex + 1 : 0;
                setActiveIndex(next);
            } else if (isRecentVisible()) {
                const next = recentActiveIndex < recentItems.length - 1 ? recentActiveIndex + 1 : 0;
                setRecentActiveIndex(next);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (matches.length > 0) {
                clearRecentActiveIndex();
                const prev = activeIndex > 0 ? activeIndex - 1 : matches.length - 1;
                setActiveIndex(prev);
            } else if (isRecentVisible()) {
                const prev = recentActiveIndex > 0 ? recentActiveIndex - 1 : recentItems.length - 1;
                setRecentActiveIndex(prev);
            }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            if (matches.length > 0 || !isRecentVisible()) return;

            e.preventDefault();
            const step = e.key === 'ArrowRight' ? 1 : -1;
            const next = recentActiveIndex < 0
                ? (step > 0 ? 0 : recentItems.length - 1)
                : (recentActiveIndex + step + recentItems.length) % recentItems.length;
            setRecentActiveIndex(next);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (matches.length > 0) {
                if (activeIndex >= 0 && matches[activeIndex]) {
                    openApp(matches[activeIndex]);
                } else if (matches.length === 1) {
                    openApp(matches[0]);
                }
            } else if (recentActiveIndex >= 0 && recentItems[recentActiveIndex]) {
                openApp(recentItems[recentActiveIndex]);
            } else if (recentItems.length === 1) {
                openApp(recentItems[0]);
            }
        } else if (e.key === 'Escape') {
            if (recentActiveIndex >= 0) {
                clearRecentActiveIndex();
                return;
            }

            searchInput.value = '';
            matches = [];
            renderResults();
            updateRecentVisibility();
            searchInput.blur();
        }
    });

    if (recentClearBtn) {
        recentClearBtn.addEventListener('click', function () {
            clearRecentApps();
        });
    }

    apps = window.APPS || [];
    if (apps.length === 0) {
        hintEl.textContent = 'Could not load app list';
        hintEl.hidden = false;
        return;
    }

    searchInput.disabled = false;
    searchInput.placeholder = 'Search apps…';
    renderRecentApps();
    searchInput.focus();
})();
