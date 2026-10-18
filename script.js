// ZotMunch — frontend interactions and local prototype state

// Sample dish data used by the prototype. Replace with API responses later.
const dishes = [
    {
        id: 'tofu',
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
const state = { page: 'welcome', mode: 'swipe', index: 0, saved: read('saved', {}), diet: read('diet', []), allergies: read('allergies', []), filters: read('filters', { type: 'All', budget: 40, distance: 15 }), savedFilter: 'all', detailId: null, editing: false };
const persist = (k, v) => localStorage.setItem('zm_' + k, JSON.stringify(v));
const $ = id => document.getElementById(id);
const activeDishes = () => dishes.filter(d => (state.filters.type === 'All' || d.kind === state.filters.type) && d.price <= state.filters.budget && d.distance <= state.filters.distance);
function showPage(page) {
    state.page = page; document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === page)); if (page === 'discover')
        renderDiscover(); if (page === 'saved')
        renderSaved(); if (page === 'me')
        renderNav(); if (page === 'preferences')
        renderChoices(); const scroll = document.querySelector('#' + page + ' .scroller'); if (scroll)
        scroll.scrollTop = 0;
}
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 2400); }
function navHTML(page) { return [['discover', 'Discover'], ['saved', 'Saved'], ['post', 'Post'], ['me', 'Me']].map(([id, name]) => `<button class="nav-item ${page === id ? 'active' : ''}" data-action="nav" data-page="${id}"><span class="nav-icon">${id === 'discover' ? '◇' : id === 'saved' ? '♡' : id === 'post' ? '+' : '○'}</span>${name}</button>`).join(''); }
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
function renderDiscover() {
    const arr = activeDishes(); const swipe = state.mode === 'swipe'; $('swipeMode').classList.toggle('selected', swipe); $('feedMode').classList.toggle('selected', !swipe); $('swipeArea').style.display = swipe ? 'block' : 'none'; $('feedArea').style.display = swipe ? 'none' : 'flex'; $('feedArea').style.flexDirection = 'column'; $('feedArea').style.gap = '10px'; let filters = state.filters; $('filterCount').textContent = filters.type === 'All' && filters.budget === 40 && filters.distance === 15 ? '' : '· ' + [filters.type !== 'All', filters.budget !== 40, filters.distance !== 15].filter(Boolean).length; if (!arr.length) {
        $('gestureCard').style.display = 'none';
        $('feedArea').innerHTML = '<div class="panel empty"><div class="icon-slot">No-match illustration placeholder</div><h2>No bites found.</h2><p class="small muted" style="margin:12px 0">Try relaxing your filters.</p><button class="btn blue" data-action="openFilters">Adjust filters</button></div>';
        $('swipeArea').querySelector('.swipe-hint').textContent = 'No matches · Adjust filters';
        renderNav();
        return;
    } $('gestureCard').style.display = 'block'; $('swipeArea').querySelector('.swipe-hint').textContent = 'Swipe left to skip · Swipe right to save'; state.index = state.index % arr.length; const d = arr[state.index]; $('dishName').textContent = d.name; $('dishPrice').textContent = '$' + d.price; $('dishRestaurant').textContent = d.restaurant + ' · ' + d.location; $('dishInfo').textContent = d.distance.toFixed(1) + ' mi away · ' + d.kind; $('dishPhoto').textContent = d.name + ' photo placeholder'; $('wantButton').textContent = state.saved[d.id] ? 'Saved ✓' : 'Want it ♥'; $('feedArea').innerHTML = arr.map(d => `<div class="feed-dish"><div class="photo-slot">Dish photo<br>placeholder</div><div class="details"><strong>${d.name}</strong><p>${d.restaurant}</p><p>$${d.price} · ${d.distance.toFixed(1)} mi</p><button class="want-mini" data-action="feedWant" data-id="${d.id}">${state.saved[d.id] ? 'Saved ✓' : 'Want it ♥'}</button> <button class="want-mini" style="background:var(--sky);color:var(--blue)" data-action="feedDetails" data-id="${d.id}">Details</button></div></div>`).join(''); renderNav();
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
function renderFilterControls() { const t = ['All', 'Chinese', 'Japanese', 'Cafe']; $('filterTypes').innerHTML = t.map(v => `<button class="chip ${state.filters.type === v ? 'selected' : ''}" data-action="type" data-value="${v}">${v}</button>`).join(''); $('budgetRange').value = state.filters.budget; $('distanceRange').value = state.filters.distance; updateRange(); }
function updateRange() { $('budgetLabel').textContent = 'Up to $' + $('budgetRange').value; $('distanceLabel').textContent = 'Within ' + $('distanceRange').value + ' mi'; }
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
            case 'openFilters':
                renderFilterControls();
                openOverlay('filters');
                break;
            case 'closeOverlay':
                closeOverlays();
                break;
            case 'type':
                state.filters.type = b.dataset.value;
                renderFilterControls();
                break;
            case 'clearFilters':
                state.filters = { type: 'All', budget: 40, distance: 15 };
                renderFilterControls();
                break;
            case 'applyFilters':
                state.filters.budget = +$('budgetRange').value;
                state.filters.distance = +$('distanceRange').value;
                persist('filters', state.filters);
                state.index = 0;
                closeOverlays();
                renderDiscover();
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
$('budgetRange').addEventListener('input', updateRange);
$('distanceRange').addEventListener('input', updateRange);
document.querySelectorAll('.overlay').forEach(v => v.addEventListener('click', e => {
    if (e.target === v)
        closeOverlays();
}));
let startX = 0, startY = 0;
$('swipeArea').addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
$('swipeArea').addEventListener('touchend', e => {
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
