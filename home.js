(function () {
    const searchInput = document.getElementById('search');
    const resultsEl = document.getElementById('results');
    const hintEl = document.getElementById('hint');

    const MIN_QUERY_LENGTH = 3;

    let apps = [];
    let matches = [];
    let activeIndex = -1;

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
                hintEl.textContent = 'Type at least 3 characters to search';
            } else if (trimmed.length < MIN_QUERY_LENGTH) {
                hintEl.textContent = 'Type at least 3 characters to search';
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

    function openApp(app) {
        window.location.href = app.url;
    }

    function onSearchInput() {
        const query = searchInput.value;
        matches = filterApps(query);
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
            matches = [];
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
    searchInput.focus();
})();
