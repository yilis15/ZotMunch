// ZotMunch — frontend interactions and local prototype state

// Sample dish data used by the prototype. Replace with API responses later.
const dishes = [
    {
        id: 'pancake',
        cuisine: 'American',
        foodType: 'Dessert',
        flavor: 'Sweet',
        name: 'Golden pancake stack',
        restaurant: 'Bluebird Café',
        location: 'Campus Plaza',
        price: 12.50,
        distance: 0.4,
        kind: 'Cafe',
        desc: 'Golden pancakes with a little sweetness.'
    },
    {
        id: 'tofu',
        cuisine: 'Chinese',
        foodType: 'Rice',
        flavor: 'Spicy',
        name: 'Mapo tofu',
        restaurant: 'Little Wok',
        location: 'University Center',
        price: 13,
        distance: 1.3,
        kind: 'Chinese',
        desc: 'Bold, warm and a little spicy.'
    },
    {
        id: 'ramen',
        cuisine: 'Japanese',
        foodType: 'Noodles',
        flavor: 'Savory',
        name: 'Cozy miso ramen',
        restaurant: 'Noodle Club',
        location: 'Campus Plaza',
        price: 16,
        distance: 2.2,
        kind: 'Japanese',
        desc: 'A comforting bowl to slow down with.'
    },
    {
        id: 'toast',
        cuisine: 'American',
        foodType: 'Sandwich',
        flavor: 'Light & Fresh',
        name: 'Avocado toast',
        restaurant: 'Bluebird Café',
        location: 'Campus Plaza',
        price: 12,
        distance: 2.7,
        kind: 'Cafe',
        desc: 'Fresh and easy between classes.'
    },
    {
        id: 'noodle',
        cuisine: 'Chinese',
        foodType: 'Noodles',
        flavor: 'Savory',
        name: 'Garlic noodles',
        restaurant: 'Little Wok',
        location: 'University Center',
        price: 14,
        distance: 1.3,
        kind: 'Chinese',
        desc: 'Savory noodles for a happy bite.'
    }
];

const read = (k, fallback) => {
    try {
        const v = JSON.parse(localStorage.getItem('zm_' + k));
        return v ?? fallback;
    }
    catch {
        return fallback;
    }
};
const filterDefaults = () => ({ cuisine: [], foodType: [], flavor: [], budget: [] });

function normalizeFilters(value) {
    const result = filterDefaults();
    for (const key of Object.keys(result)) {
        result[key] = Array.isArray(value?.[key]) ? value[key] : [];
    }
    return result;
}

const state = {
    page: 'welcome', mode: 'swipe', index: 1, feedQuery: '',
    saved: read('saved', {}), diet: read('diet', []), allergies: read('allergies', []),
    filters: normalizeFilters(read('filters', filterDefaults())),
    savedFilter: 'all', detailId: null, editing: false
};
let draftFilters = filterDefaults();
const persist = (k, v) => localStorage.setItem('zm_' + k, JSON.stringify(v));
const $ = id => document.getElementById(id);
// Within each filter group: OR. Across groups: AND. Empty group: no restriction.
const budgetMatches = (price, selected) => selected.length === 0 || selected.some(band => {
    if (band === '$1–20') return price >= 1 && price <= 20;
    if (band === '$20–50') return price > 20 && price <= 50;
    if (band === '$50+') return price > 50;
    return false;
});

function activeDishes() {
    const filters = state.filters;
    return dishes.filter(dish =>
        (filters.cuisine.length === 0 || filters.cuisine.includes(dish.cuisine)) &&
        (filters.foodType.length === 0 || filters.foodType.includes(dish.foodType)) &&
        (filters.flavor.length === 0 || filters.flavor.includes(dish.flavor)) &&
        budgetMatches(dish.price, filters.budget)
    );
}

function filterSelectionCount() {
    return Object.values(state.filters).reduce((total, values) => total + values.length, 0);
}
function showPage(page) {
    state.page = page; document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === page)); if (page === 'discover')
        renderDiscover(); if (page === 'saved')
        renderSaved(); if (page === 'me')
        renderNav(); if (page === 'preferences')
        renderChoices(); const scroll = document.querySelector('#' + page + ' .scroller'); if (scroll)
        scroll.scrollTop = 0;
}
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 2400); }
function navHTML(page) { return [['discover', 'Discover'], ['post', 'Post'], ['saved', 'Saved'], ['me', 'Me']].map(([id, name]) => `<button class="nav-item ${page === id ? 'active' : ''}" data-action="nav" data-page="${id}"><span class="nav-icon">${id === 'discover' ? '◇' : id === 'saved' ? '♡' : id === 'post' ? '+' : '○'}</span>${name}</button>`).join(''); }
function renderNav() { ['discover', 'saved', 'me'].forEach(id => $(id + 'Nav').innerHTML = navHTML(state.page)); }
function renderChoices() { const groups = [['dietChoices', 'diet', ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Dairy-free', 'No restrictions']], ['allergyChoices', 'allergies', ['Milk', 'Eggs', 'Fish', 'Shellfish', 'Peanuts', 'Tree nuts', 'Wheat', 'Soy', 'Sesame', 'No allergies']]]; groups.forEach(([target, key, values]) => $(target).innerHTML = values.map(v => `<button class="chip ${state[key].includes(v) ? 'selected' : ''}" data-action="choice" data-kind="${key}" data-value="${v}">${v}</button>`).join('')); }
function toggleChoice(key, v) {
    const none = key === 'diet' ? 'No restrictions' : 'No allergies'; if (v === none)
        state[key] = state[key].includes(none) ? [] : [none];
    else {
        state[key] = state[key].filter(x => x !== none);
        state[key] = state[key].includes(v) ? state[key].filter(x => x !== v) : [...state[key], v];
    } renderChoices();
}
// Feed cards follow the Figma layout. Tapping the card opens its details.
function renderFeedCards() {
    const query = state.feedQuery.trim().toLowerCase();
    const filtered = activeDishes().filter(d =>
        `${d.name} ${d.restaurant} ${d.kind} ${d.desc}`.toLowerCase().includes(query)
    );

    const feedArea = $('feedArea');
    if (!filtered.length) {
        feedArea.innerHTML = `
            <div class="panel empty">
                <h2>No bites found.</h2>
                <p class="small muted">Try another search or change your filters.</p>
                <button class="btn blue" data-action="openFilters">Adjust filters</button>
            </div>`;
        return;
    }

    feedArea.innerHTML = `
        <div class="feed-section-heading">
            <h2>Popular with Anteaters</h2>
            <button class="feed-see-all" data-action="seeAll">See all</button>
        </div>
        <div class="feed-card-list">
            ${filtered.map(d => `
                <article class="feed-feature-card" role="button" tabindex="0"
                    data-action="feedDetails" data-id="${d.id}"
                    aria-label="View details for ${d.name}">
                    <div class="feed-feature-photo photo-slot">
                        <span>${d.name} image placeholder</span>
                    </div>
                    <div class="feed-feature-body">
                        <h3>${d.name}</h3>
                        <p class="feed-feature-location">
                            ${d.restaurant} · ${d.location} &nbsp; ${d.distance.toFixed(1)} mile
                        </p>
                        <p class="feed-feature-loved">♥ Loved by 300 Anteaters</p>
                        <div class="feed-feature-footer">
                            <span class="feed-feature-tag">${d.id === 'pancake' ? 'sweet' : d.kind}</span>
                            <strong class="feed-feature-price">$${d.price.toFixed(2)}</strong>
                        </div>
                    </div>
                </article>`).join('')}
        </div>`;
}

function renderDiscover() {
    const arr = activeDishes();
    const swipe = state.mode === 'swipe';
    $('swipeMode').classList.toggle('selected', swipe);
    $('feedMode').classList.toggle('selected', !swipe);
    $('swipeArea').style.display = swipe ? 'flex' : 'none';
    $('feedArea').style.display = swipe ? 'none' : 'flex';
    $('feedSearchDock').hidden = swipe;
    $('discover').classList.toggle('feed-mode', !swipe);
    $('discoverHeading').textContent = swipe ? 'A bite of surprise.' : 'Good bites around campus.';
    $('discoverMascot').textContent = swipe ? 'Mascot / cookie' : 'Mascot / stamp';

    const filters = state.filters;
    const count = filterSelectionCount();
    $('filterCount').textContent = count ? '· ' + count : '';

    renderFeedCards();

    if (!arr.length) {
        $('gestureCard').style.display = 'none';
        document.querySelector('.swipe-actions').style.display = 'none';
        $('swipeArea').querySelector('.swipe-hint').textContent = 'No matches · Adjust filters';
        renderNav();
        return;
    }

    $('gestureCard').style.display = 'block';
    document.querySelector('.swipe-actions').style.display = 'grid';
    $('swipeArea').querySelector('.swipe-hint').textContent = '← Skip   ·   Tap for details   ·   Want it →';
    state.index %= arr.length;
    const d = arr[state.index];
    $('dishName').textContent = d.name;
    $('dishPrice').textContent = '$' + d.price.toFixed(2);
    $('dishRestaurant').textContent = `${d.restaurant} · ${d.location}`;
    $('dishSocial').textContent = '♥ Loved by 300 Anteaters';
    $('dishPhoto').textContent = d.name + ' photo placeholder';
    $('wantButton').textContent = state.saved[d.id] ? 'Saved ✓' : '♥ Want it';
    renderNav();
}
function advance() {
    const arr = activeDishes(); if (arr.length) {
        state.index = (state.index + 1) % arr.length;
        renderDiscover();
    }
}
function saveDish(id) {
    if (!state.saved[id]) {
        state.saved[id] = { tried: false };
        persist('saved', state.saved);
        toast('Saved! Keep discovering.');
    }
    else
        toast('Already in your Saved list.'); renderDiscover();
}
function renderSaved() { const all = dishes.filter(d => state.saved[d.id]); const filtered = all.filter(d => state.savedFilter === 'all' || (state.savedFilter === 'tried' ? state.saved[d.id].tried : !state.saved[d.id].tried)); $('savedCount').textContent = `${new Set(all.map(d => d.restaurant)).size} spots saved  ·  ${all.filter(d => !state.saved[d.id].tried).length} still to try`; $('savedTabs').querySelectorAll('button').forEach(b => b.classList.toggle('selected', b.dataset.filter === state.savedFilter)); const groups = {}; filtered.forEach(d => (groups[d.restaurant] ??= []).push(d)); $('savedList').innerHTML = filtered.length ? Object.entries(groups).map(([rest, items]) => `<div class="panel restaurant"><h2>${rest}</h2><p class="small muted">${items[0].location}</p>${items.map(d => `<div class="saved-row"><div class="photo-slot mini">Photo</div><div class="saved-copy"><strong>${d.name}</strong><p>$${d.price} · ${d.distance.toFixed(1)} mi</p><p>${state.saved[d.id].tried ? 'Tried it ✓' : 'Not yet'}</p></div><button data-action="tried" data-id="${d.id}">${state.saved[d.id].tried ? 'Undo' : 'Tried it'}</button></div>`).join('')}</div>`).join('') : '<div class="panel empty"><div class="icon-slot">Saved empty-state illustration placeholder</div><h2>Nothing here yet.</h2><p class="small muted" style="margin:12px 0">Save a dish to start your delicious little list.</p><button class="btn blue" data-action="discover">Discover food</button></div>'; renderNav(); }
function openOverlay(id) { $(id + 'Overlay').classList.add('show'); }
function closeOverlays() { document.querySelectorAll('.overlay').forEach(x => x.classList.remove('show')); }
// ==========================================
// Temporary filters — Figma screen 06
// ==========================================
const filterOptions = {
    cuisine: ['Japanese', 'Taiwanese', 'Mexican', 'Vietnamese', 'Korean',
        'Hawaiian', 'Middle Eastern', 'Italian', 'Chinese', 'Indian',
        'Filipino', 'Thai'],
    foodType: ['Rice', 'Noodles', 'Hot pot', 'Dumplings', 'Tacos',
        'Pizza', 'Sandwich', 'Dessert', 'Drinks'],
    flavor: ['Spicy', 'Sweet', 'Sour', 'Savory', 'Light & Fresh'],
    budget: ['$1–20', '$20–50', '$50+']
};

const filterContainers = {
    cuisine: 'filterCuisines',
    foodType: 'filterFoodTypes',
    flavor: 'filterFlavors',
    budget: 'filterBudgets'
};

function renderFilterControls() {
    Object.entries(filterOptions).forEach(([group, options]) => {
        $(filterContainers[group]).innerHTML = options.map(option => {
            const selected = draftFilters[group].includes(option);
            return `<button type="button" class="filter-chip${selected ? ' selected' : ''}"
                data-action="toggleFilter" data-group="${group}"
                data-value="${option}" aria-pressed="${selected}">${option}</button>`;
        }).join('');
    });
}

function toggleDraftFilter(group, value) {
    if (!Object.prototype.hasOwnProperty.call(filterOptions, group)) return;
    if (!filterOptions[group].includes(value)) return;

    const selections = draftFilters[group];
    draftFilters[group] = selections.includes(value)
        ? selections.filter(item => item !== value)
        : [...selections, value];
    renderFilterControls();
}

function openTemporaryFilters() {
    // Closing the sheet without pressing Show dishes discards draft changes.
    draftFilters = structuredClone(state.filters);
    renderFilterControls();
    openOverlay('filters');
}

function clearTemporaryFilters() {
    draftFilters = filterDefaults();
    renderFilterControls();
}

function applyTemporaryFilters() {
    state.filters = structuredClone(draftFilters);
    persist('filters', state.filters);
    state.index = 0;
    closeOverlays();
    renderDiscover();
}

function showDetail(id) {
    const d = dishes.find(x => x.id === id); if (!d)
        return; state.detailId = id; $('detailName').textContent = d.name; $('detailRestaurant').textContent = d.restaurant + ' · ' + d.location; $('detailMeta').textContent = `$${d.price} · ${d.distance.toFixed(1)} mi · ${d.kind}`; $('detailWant').textContent = state.saved[id] ? 'Saved ✓' : 'Want it ♥'; openOverlay('details');
}
document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]'); if (!b)
        return; let a = b.dataset.action, id = b.dataset.id; switch (a) {
            case 'start':
            case 'email':
                if (a === 'email' && !$('email').value.trim()) {
                    toast('Enter an email to continue in demo mode.');
                    break;
                }
                state.editing = false;
                showPage('preferences');
                break;
            case 'welcome':
                showPage('welcome');
                break;
            case 'choice':
                toggleChoice(b.dataset.kind, b.dataset.value);
                break;
            case 'savePreferences':
                persist('diet', state.diet);
                persist('allergies', state.allergies);
                showPage(state.editing ? 'me' : 'discover');
                toast('Preferences saved.');
                break;
            case 'skipPreferences':
                showPage('discover');
                break;
            case 'editPreferences':
                state.editing = true;
                showPage('preferences');
                break;
            case 'discover':
                showPage('discover');
                break;
            case 'nav':
                if (b.dataset.page === 'post') {
                    toast('Posting is outside this vertical slice.');
                }
                else
                    showPage(b.dataset.page);
                break;
            case 'swipeMode':
                state.mode = 'swipe';
                renderDiscover();
                break;
            case 'feedMode':
                state.mode = 'feed';
                renderDiscover();
                break;
            case 'skip':
                advance();
                break;
            case 'want': {
                let arr = activeDishes();
                if (arr.length) {
                    saveDish(arr[state.index].id);
                    advance();
                }
                break;
            }
            case 'details': {
                let arr = activeDishes();
                if (arr.length)
                    showDetail(arr[state.index].id);
                break;
            }
            case 'feedWant':
                saveDish(id);
                break;
            case 'feedDetails':
                showDetail(id);
                break;
            case 'seeAll':
                $('feedSearch').focus();
                break;
            case 'openFilters':
                openTemporaryFilters();
                break;
            case 'closeOverlay':
                closeOverlays();
                break;
            case 'toggleFilter':
                toggleDraftFilter(b.dataset.group, b.dataset.value);
                break;
            case 'clearFilters':
                clearTemporaryFilters();
                break;
            case 'applyFilters':
                applyTemporaryFilters();
                break;
            case 'wantDetail':
                saveDish(state.detailId);
                $('detailWant').textContent = 'Saved ✓';
                break;
            case 'savedFilter':
                state.savedFilter = b.dataset.filter;
                renderSaved();
                break;
            case 'tried':
                state.saved[id].tried = !state.saved[id].tried;
                persist('saved', state.saved);
                renderSaved();
                break;
        }
});
$('feedSearch').addEventListener('input', event => {
    state.feedQuery = event.target.value;
    renderFeedCards();
});
$('feedArea').addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.feed-feature-card')) {
        event.preventDefault();
        showDetail(event.target.dataset.id);
    }
});
document.querySelectorAll('.overlay').forEach(v => v.addEventListener('click', e => {
    if (e.target === v)
        closeOverlays();
}));
let startX = 0, startY = 0;
$('gestureCard').addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
$('gestureCard').addEventListener('touchend', e => {
    let dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY; if (Math.abs(dx) > 75 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx > 0) {
            let arr = activeDishes();
            if (arr.length) {
                saveDish(arr[state.index].id);
                advance();
            }
        }
        else
            advance();
    }
}, { passive: true });
renderChoices();
renderDiscover();
renderSaved();
