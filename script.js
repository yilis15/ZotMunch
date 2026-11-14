// ZotMunch — frontend interactions and local prototype state

// Sample dish data used by the prototype. Replace with API responses later.
const dishes = [
    {
        id: 'pancake',
        image: 'assets/food/pancakes.jpg',
        cuisine: 'American',
        foodType: 'Dessert',
        flavor: 'Sweet',
        name: 'Golden pancake stack',
        restaurant: 'Bluebird Café',
        location: 'Campus Plaza',
        price: 12.50,
        publishedAt: '2026-11-10T09:00:00Z',
        savedCount: 240,
        distance: 0.4,
        kind: 'Cafe',
        desc: 'Golden pancakes with a little sweetness.'
    },
    {
        id: 'tofu',
        image: 'assets/food/mapo-tofu.jpg',
        cuisine: 'Chinese',
        foodType: 'Rice',
        flavor: 'Spicy',
        name: 'Mapo tofu',
        restaurant: 'Little Wok',
        location: 'University Center',
        price: 13,
        publishedAt: '2026-11-08T10:00:00Z',
        savedCount: 300,
        distance: 1.3,
        kind: 'Chinese',
        desc: 'Bold, warm and a little spicy.'
    },
    {
        id: 'ramen',
        image: 'assets/food/ramen.jpg',
        cuisine: 'Japanese',
        foodType: 'Noodles',
        flavor: 'Savory',
        name: 'Cozy miso ramen',
        restaurant: 'Noodle Club',
        location: 'Campus Plaza',
        price: 16,
        publishedAt: '2026-11-12T12:00:00Z',
        savedCount: 180,
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
        publishedAt: '2026-11-13T10:00:00Z',
        savedCount: 110,
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
        publishedAt: '2026-11-07T13:00:00Z',
        savedCount: 92,
        distance: 1.3,
        kind: 'Chinese',
        desc: 'Savory noodles for a happy bite.'
    },
    {
        id: 'chicken', cuisine: 'Chinese', foodType: 'Rice', flavor: 'Savory',
        name: 'Chicken rice', restaurant: 'Campus Kitchen', location: 'Near UCI',
        price: 14.50, publishedAt: '2026-11-11T15:00:00Z', savedCount: 150,
        distance: 1.1, kind: 'Chinese',
        image: 'assets/food/chicken-rice.jpg',
        desc: 'A rice dish featured in the companion web prototype.'
    }
];
const feedSorts = [
    { key: 'price-asc', group: 'Price', heading: 'Price: Low to high', label: 'Low to high', field: 'price', direction: 'asc', mark: '$ ↑' },
    { key: 'price-desc', group: 'Price', heading: 'Price: High to low', label: 'High to low', field: 'price', direction: 'desc', mark: '$ ↓' },
    { key: 'date-desc', group: 'Date', heading: 'Date: Newest first', label: 'Newest first', field: 'publishedAt', direction: 'desc', mark: '↓' },
    { key: 'date-asc', group: 'Date', heading: 'Date: Oldest first', label: 'Oldest first', field: 'publishedAt', direction: 'asc', mark: '↑' },
    { key: 'saved-desc', group: 'Popularity', heading: 'Popularity: Most saved', label: 'Most saved', field: 'savedCount', direction: 'desc', mark: '↓' },
    { key: 'saved-asc', group: 'Popularity', heading: 'Popularity: Fewest saved', label: 'Fewest saved', field: 'savedCount', direction: 'asc', mark: '↑' }
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
    profileAvatar: read('profileAvatar', 'assets/mascots/mug.png'),
    profileAvatarDraft: 'assets/mascots/mug.png',
    filters: normalizeFilters(read('filters', filterDefaults())),
    savedFilter: 'all', savedSelecting: false, selectedSaved: new Set(),
    feedSortKey: 'saved-desc', detailId: null, editing: false,
    reviewRating: 4, reviewPhotos: [],
    postPhotos: [], postRestaurantBranch: null, postMatch: null,
    postMatchDismissed: '', postTagsExpanded: false, postTags: []
};
let savedRemovalBatch = [];
let savedUndoTimer = null;
let savedUndoRemaining = 8000;
let savedUndoStartedAt = 0;
let savedUndoPaused = false;
let savedRemoveOpener = null;
let feedSortOpener = null;
const profileAvatars = [
    ['Hello', 'assets/mascots/hero.png'],
    ['Mug', 'assets/mascots/mug.png'],
    ['Cookie', 'assets/mascots/cookie.png'],
    ['Orange', 'assets/mascots/orange-hug.png'],
    ['Sleep', 'assets/mascots/sleep.png'],
    ['Sparkle', 'assets/mascots/orange-burst.png']
];
if (!profileAvatars.some(([, src]) => src === state.profileAvatar)) {
    state.profileAvatar = 'assets/mascots/mug.png';
}
const restaurantBranches = [
    { restaurant: 'Little Wok', location: 'University Center', address: '4257 Campus Dr, Irvine' },
    { restaurant: 'Little Wok', location: 'Westpark', address: '1800 Main St, Irvine' },
    { restaurant: 'Bluebird Café', location: 'Campus Plaza', address: '4100 Campus Dr, Irvine' },
    { restaurant: 'Noodle Club', location: 'Campus Plaza', address: '4100 Campus Dr, Irvine' }
];
const postTagOptions = {
    'Dietary preferences': ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Dairy-free'],
    Allergies: ['Milk', 'Eggs', 'Fish', 'Shellfish', 'Peanuts', 'Tree nuts', 'Wheat', 'Soy', 'Sesame'],
    Cuisine: ['Japanese', 'Taiwanese', 'Mexican', 'Vietnamese', 'Korean', 'Chinese', 'Indian', 'Thai'],
    'Food type': ['Rice', 'Noodles', 'Hot pot', 'Dumplings', 'Sandwich', 'Dessert', 'Drinks'],
    Flavor: ['Spicy', 'Sweet', 'Sour', 'Savory', 'Light & Fresh']
};
const swipeConfig = { deadZone: 8, dominance: 1.2, thresholdRatio: 0.25, maxAlpha: 0.42, maxRotation: 8, returnMs: 180, exitMs: 300, buttonMs: 120, reducedExitMs: 150 };
let swipePointer = null;
let swipeBusy = false;
let suppressSwipeClickUntil = 0;
let draftFilters = filterDefaults();
const persist = (k, v) => localStorage.setItem('zm_' + k, JSON.stringify(v));
const $ = id => document.getElementById(id);

// Images from the companion web version, stored locally for offline use.
// Uploaded post images continue to use their existing object URLs.
function dishPhotoMarkup(dish, fallback = 'Dish photo placeholder') {
    return dish.image
        ? `<img class="dish-image" src="${dish.image}" alt="${dish.name}" loading="lazy">`
        : `<span>${fallback}</span>`;
}
function setDishPhoto(element, dish) {
    element.replaceChildren();
    if (dish.image) {
        const img = document.createElement('img');
        img.src = dish.image;
        img.alt = dish.name;
        img.className = 'dish-image';
        element.appendChild(img);
    } else {
        element.textContent = `${dish.name} photo placeholder`;
    }
}

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
    closeOverlays();
    closeSavedRemove(false);
    closeFeedSort(false);
    hideSavedUndo();
    state.page = page;
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === page));
    if (page === 'discover') renderDiscover();
    if (page === 'saved') renderSaved();
    if (page === 'me') {
        renderNav();
        renderMe();
    }
    if (page === 'editProfile') renderProfileEditor(true);
    if (page === 'preferences') renderChoices();
    if (page === 'review') renderReview();
    if (page === 'post') renderPost();
    if (page === 'postReview') renderPostReview();
    const scroll = document.querySelector('#' + page + ' .scroller');
    if (scroll) scroll.scrollTop = 0;
}
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(window.toastTimer); window.toastTimer = setTimeout(() => el.classList.remove('show'), 2400); }
function navHTML(page) { return [['discover', 'Discover'], ['post', 'Post'], ['saved', 'Saved'], ['me', 'Me']].map(([id, name]) => `<button class="nav-item ${page === id ? 'active' : ''}" data-action="nav" data-page="${id}"><span class="nav-icon">${id === 'discover' ? '◇' : id === 'saved' ? '♡' : id === 'post' ? '+' : '○'}</span>${name}</button>`).join(''); }
function renderNav() { ['discover', 'saved', 'me'].forEach(id => $(id + 'Nav').innerHTML = navHTML(state.page)); }
function renderMe() { $('profileAvatar').src = state.profileAvatar; }
function renderProfileEditor(resetSelection = false) {
    if (resetSelection) state.profileAvatarDraft = state.profileAvatar;
    $('profileAvatarError').hidden = true;
    $('profileAvatarPreview').src = state.profileAvatarDraft;
    $('profileAvatarChoices').innerHTML = profileAvatars.map(([name, src]) => `
        <button type="button" class="profile-avatar-choice ${src === state.profileAvatarDraft ? 'selected' : ''}"
            data-action="selectProfileAvatar" data-avatar="${src}" aria-pressed="${src === state.profileAvatarDraft}">
            <img src="${src}" alt=""><span>${name}</span>${src === state.profileAvatarDraft ? '<span class="profile-avatar-check" aria-hidden="true">✓</span>' : ''}
        </button>
    `).join('');
}
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
    const sort = feedSorts.find(option => option.key === state.feedSortKey) || feedSorts[4];
    const filtered = activeDishes().filter(d =>
        `${d.name} ${d.restaurant} ${d.kind} ${d.desc}`.toLowerCase().includes(query)
    );
    const sorted = filtered.slice().sort((a, b) => {
        const rawA = a[sort.field];
        const rawB = b[sort.field];
        const valueA = sort.field === 'publishedAt' ? Date.parse(rawA) : rawA;
        const valueB = sort.field === 'publishedAt' ? Date.parse(rawB) : rawB;
        const missingA = rawA == null || (sort.field === 'publishedAt' && Number.isNaN(valueA));
        const missingB = rawB == null || (sort.field === 'publishedAt' && Number.isNaN(valueB));
        if (missingA !== missingB) return missingA ? 1 : -1;
        if (!missingA && valueA !== valueB) {
            return (valueA - valueB) * (sort.direction === 'asc' ? 1 : -1);
        }
        return String(a.id).localeCompare(String(b.id));
    });

    const feedArea = $('feedArea');
    feedArea.innerHTML = `
        <div class="feed-section-heading">
            <div class="feed-sort-title">
                <h2 id="feedSortHeading">${sort.heading}</h2>
                <span class="feed-sort-count">${sorted.length} ${sorted.length === 1 ? 'dish' : 'dishes'}</span>
            </div>
            <button class="feed-sort-trigger" id="feedSortButton" type="button"
                aria-haspopup="dialog" aria-expanded="false" aria-controls="feedSortOverlay">
                <span aria-hidden="true">↕</span> Sort <span aria-hidden="true">⌄</span>
            </button>
        </div>
        ${sorted.length ? `<div class="feed-card-list">
            ${sorted.map(d => `
                <article class="feed-feature-card" role="button" tabindex="0"
                    data-action="feedDetails" data-id="${d.id}"
                    aria-label="View details for ${d.name}">
                    <div class="feed-feature-photo photo-slot">
                        ${dishPhotoMarkup(d, d.name + " image placeholder")}
                    </div>
                    <div class="feed-feature-body">
                        <h3>${d.name}</h3>
                        <p class="feed-feature-location">
                            ${d.restaurant} · ${d.location} &nbsp; ${d.distance.toFixed(1)} mile
                        </p>
                        <p class="feed-feature-loved">♥ Saved by ${d.savedCount ?? 0} Anteaters</p>
                        <p class="feed-feature-date">${d.publishedAt ? `Posted ${new Date(d.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Date unavailable'}</p>
                        <div class="feed-feature-footer">
                            <span class="feed-feature-tag">${d.id === 'pancake' ? 'sweet' : d.kind}</span>
                            <strong class="feed-feature-price">$${d.price.toFixed(2)}</strong>
                        </div>
                    </div>
                </article>`).join('')}
        </div>` : `
            <div class="panel empty">
                <h2>No bites found.</h2>
                <p class="small muted">Try another search or change your filters.</p>
                <button class="btn blue" data-action="openFilters">Adjust filters</button>
            </div>`}`;
    renderFeedSortOptions();
}

function renderDiscover() {
    const arr = activeDishes();
    const swipe = state.mode === 'swipe';
    resetSwipeCard();
    $('swipeMode').classList.toggle('selected', swipe);
    $('feedMode').classList.toggle('selected', !swipe);
    $('swipeArea').style.display = swipe ? 'flex' : 'none';
    $('feedArea').style.display = swipe ? 'none' : 'flex';
    $('feedSearchDock').hidden = swipe;
    $('discover').classList.toggle('feed-mode', !swipe);
    $('discoverHeading').textContent = swipe ? 'A bite of surprise.' : 'Good bites around campus.';
    $('discoverMascot').innerHTML = `<img src="assets/mascots/${swipe ? 'cookie' : 'orange-burst'}.png" alt="" aria-hidden="true">`;

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
    setDishPhoto($('dishPhoto'), d);
    $('wantButton').textContent = state.saved[d.id] ? 'Saved ✓' : '♥ Want it';
    renderNav();
}
function swipeThreshold(width) {
    return Math.max(swipeConfig.deadZone + 1, width * swipeConfig.thresholdRatio);
}
function resetSwipeCard() {
    const card = $('gestureCard');
    card.classList.remove('swipe-card--dragging', 'swipe-card--settling', 'swipe-card--exiting');
    card.style.removeProperty('transform');
    card.style.removeProperty('opacity');
    card.style.borderColor = 'var(--ink)';
    $('swipeCardTint').style.opacity = '0';
    $('skipBadge').style.opacity = '0';
    $('wantBadge').style.opacity = '0';
    $('skipCaption').textContent = 'Keep swiping left';
    $('wantCaption').textContent = 'Keep swiping right';
}
function swipeFeedback(dx, width = $('gestureCard').getBoundingClientRect().width) {
    const threshold = swipeThreshold(width);
    const progress = Math.max(0, Math.min(1, (Math.abs(dx) - swipeConfig.deadZone) / (threshold - swipeConfig.deadZone)));
    return {
        progress,
        alpha: swipeConfig.maxAlpha * progress,
        rotation: Math.sign(dx) * swipeConfig.maxRotation * progress,
        direction: progress === 0 ? 'neutral' : dx < 0 ? 'skip' : 'want',
        ready: Math.abs(dx) >= threshold,
    };
}
function applySwipeFeedback(dx) {
    const card = $('gestureCard');
    const feedback = swipeFeedback(dx);
    const tint = $('swipeCardTint');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.style.transform = reducedMotion
        ? 'translate3d(0, 0, 0) rotate(0deg)'
        : `translate3d(${dx}px, 0, 0) rotate(${feedback.rotation}deg)`;
    card.style.borderColor = feedback.direction === 'want' ? 'var(--gold)' : feedback.direction === 'skip' ? 'var(--blue)' : 'var(--ink)';
    tint.style.background = feedback.direction === 'want' ? 'var(--gold)' : 'var(--blue)';
    tint.style.opacity = String(feedback.alpha);
    for (const [direction, badge, caption] of [
        ['skip', $('skipBadge'), $('skipCaption')],
        ['want', $('wantBadge'), $('wantCaption')],
    ]) {
        badge.style.opacity = feedback.direction === direction ? String(Math.min(1, feedback.progress * 1.7)) : '0';
        caption.textContent = feedback.ready
            ? direction === 'skip' ? 'Release to skip' : 'Release to save'
            : direction === 'skip' ? 'Keep swiping left' : 'Keep swiping right';
    }
}
function setSwipeBusy(value) {
    swipeBusy = value;
    $('gestureCard').setAttribute('aria-busy', String(value));
    ['skip', 'details', 'want'].forEach(action => {
        const button = document.querySelector(`[data-action="${action}"]`);
        if (button) button.disabled = value;
    });
    ['swipeMode', 'feedMode'].forEach(id => { $(id).disabled = value; });
    const filters = document.querySelector('[data-action="openFilters"]');
    if (filters) filters.disabled = value;
}
function releaseSwipePointer() {
    if (!swipePointer) return;
    const pointerId = swipePointer.id;
    swipePointer = null;
    if ($('gestureCard').hasPointerCapture(pointerId)) $('gestureCard').releasePointerCapture(pointerId);
}
function pauseSwipe(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
}
async function settleSwipe() {
    if (swipeBusy) return;
    setSwipeBusy(true);
    const card = $('gestureCard');
    card.classList.remove('swipe-card--dragging');
    card.classList.add('swipe-card--settling');
    applySwipeFeedback(0);
    await pauseSwipe(swipeConfig.returnMs);
    resetSwipeCard();
    setSwipeBusy(false);
}
async function performSwipe(direction, source = 'button', releasedDx = null) {
    if (swipeBusy) return;
    const dishesToShow = activeDishes();
    if (!dishesToShow.length) return;
    const dish = dishesToShow[state.index % dishesToShow.length];
    const card = $('gestureCard');
    const width = card.getBoundingClientRect().width;
    const dx = (direction === 'skip' ? -1 : 1) * swipeThreshold(width);
    setSwipeBusy(true);
    releaseSwipePointer();
    card.classList.remove('swipe-card--dragging');
    if (source !== 'drag') {
        card.classList.add('swipe-card--settling');
        void card.offsetWidth;
        applySwipeFeedback(dx);
        await pauseSwipe(swipeConfig.buttonMs);
    } else {
        applySwipeFeedback(releasedDx ?? dx);
    }
    card.classList.remove('swipe-card--settling');
    card.classList.add('swipe-card--exiting');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.style.transform = reducedMotion
        ? 'translate3d(0, 0, 0)'
        : `translate3d(${(direction === 'skip' ? -1 : 1) * (window.innerWidth + width)}px, 0, 0) rotate(${direction === 'skip' ? -swipeConfig.maxRotation : swipeConfig.maxRotation}deg)`;
    card.style.opacity = '0';
    await pauseSwipe(reducedMotion ? swipeConfig.reducedExitMs : swipeConfig.exitMs);
    if (direction === 'want') {
        const alreadySaved = Boolean(state.saved[dish.id]);
        try {
            saveDish(dish.id, false);
        } catch {
            if (!alreadySaved) delete state.saved[dish.id];
            toast('Could not save this dish. Please try again.');
            resetSwipeCard();
            setSwipeBusy(false);
            return;
        }
    }
    advance();
    setSwipeBusy(false);
}
function onSwipePointerDown(event) {
    if (swipeBusy || state.page !== 'discover' || state.mode !== 'swipe' || !event.isPrimary ||
        (event.pointerType === 'mouse' && event.button !== 0)) return;
    swipePointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, moved: false, locked: false, vertical: false };
    $('gestureCard').setPointerCapture(event.pointerId);
}
function onSwipePointerMove(event) {
    if (!swipePointer || swipePointer.id !== event.pointerId || swipeBusy) return;
    const dx = event.clientX - swipePointer.startX;
    const dy = event.clientY - swipePointer.startY;
    swipePointer.dx = dx;
    swipePointer.dy = dy;
    if (Math.hypot(dx, dy) > swipeConfig.deadZone) swipePointer.moved = true;
    if (swipePointer.vertical) return;
    if (!swipePointer.locked) {
        if (Math.abs(dx) > swipeConfig.deadZone && Math.abs(dx) > swipeConfig.dominance * Math.abs(dy)) {
            swipePointer.locked = true;
            $('gestureCard').classList.add('swipe-card--dragging');
        } else if (Math.abs(dy) > swipeConfig.deadZone && Math.abs(dy) >= Math.abs(dx)) {
            swipePointer.vertical = true;
            return;
        }
    }
    if (swipePointer.locked) applySwipeFeedback(dx);
}
function onSwipePointerUp(event) {
    if (!swipePointer || swipePointer.id !== event.pointerId) return;
    const gesture = swipePointer;
    gesture.dx = event.clientX - gesture.startX;
    gesture.dy = event.clientY - gesture.startY;
    if (Math.hypot(gesture.dx, gesture.dy) > swipeConfig.deadZone) gesture.moved = true;
    if (gesture.locked) applySwipeFeedback(gesture.dx);
    if (gesture.moved) suppressSwipeClickUntil = performance.now() + 450;
    releaseSwipePointer();
    $('gestureCard').classList.remove('swipe-card--dragging');
    const decision = gesture.locked && Math.abs(gesture.dx) >= swipeThreshold($('gestureCard').getBoundingClientRect().width)
        ? gesture.dx < 0 ? 'skip' : 'want'
        : null;
    if (decision) performSwipe(decision, 'drag', gesture.dx);
    else if (gesture.locked) settleSwipe();
    else if (gesture.moved) resetSwipeCard();
}
function cancelSwipeGesture() {
    if (!swipePointer) return;
    const wasLocked = swipePointer.locked;
    if (swipePointer.moved) suppressSwipeClickUntil = performance.now() + 450;
    releaseSwipePointer();
    $('gestureCard').classList.remove('swipe-card--dragging');
    if (wasLocked) settleSwipe();
    else resetSwipeCard();
}
function advance() {
    const arr = activeDishes(); if (arr.length) {
        state.index = (state.index + 1) % arr.length;
        renderDiscover();
    }
}
function saveDish(id, shouldRender = true) {
    if (!state.saved[id]) {
        state.saved[id] = { tried: false };
        persist('saved', state.saved);
        toast('Saved! Keep discovering.');
    }
    else toast('Already in your Saved list.');
    if (shouldRender) renderDiscover();
}
function updateDetailWantButton(id) {
    const isSaved = Boolean(state.saved[id]);

    const heart = $('detailHeart');
    const label = $('detailWantText');
    const button = $('detailWant');

    heart.textContent = isSaved ? '♥' : '♡';
    heart.classList.toggle('is-saved', isSaved);

    label.textContent = 'Want it';
    button.setAttribute('aria-pressed', String(isSaved));
}


// Toggle between saved and unsaved
function toggleSavedDish(id) {
    if (!id) return;

    if (state.saved[id]) {
        // Remove from Saved List
        delete state.saved[id];
        state.selectedSaved.delete(id);
        toast('Removed from Saved.');
    } else {
        // Add to Saved List
        state.saved[id] = {
            tried: false
        };
        toast('Saved! Keep discovering.');
    }

    // Store the updated state
    persist('saved', state.saved);

    // Update all related views
    updateDetailWantButton(id);
    renderDiscover();
    renderSaved();
}
function renderSaved() {
    // Get all saved dishes
    const allSavedDishes = dishes.filter(
        dish => state.saved[dish.id]
    );

    // Filter by Tried / Not Yet status
    const filteredDishes = allSavedDishes.filter(dish => {
        if (state.savedFilter === 'all') {
            return true;
        }

        const isTried = state.saved[dish.id].tried;

        if (state.savedFilter === 'tried') {
            return isTried;
        }

        return !isTried;
    });

    // Update saved count
    const restaurantCount = new Set(
        allSavedDishes.map(dish => dish.restaurant)
    ).size;

    const notYetCount = allSavedDishes.filter(
        dish => !state.saved[dish.id].tried
    ).length;

    $('savedCount').textContent =
        `${restaurantCount} spots saved · ${notYetCount} still to try`;

    state.selectedSaved = new Set(
        [...state.selectedSaved].filter(id => Boolean(state.saved[id]))
    );
    $('saved').classList.toggle('saved-selecting', state.savedSelecting);
    $('savedSelectionControls').hidden = allSavedDishes.length === 0;
    $('savedSelectionHint').textContent = state.savedSelecting
        ? 'Select dishes to remove'
        : 'Your saved dishes, all in one place.';
    $('savedSelectToggle').textContent = state.savedSelecting ? 'Done' : 'Select';
    const visibleSelectedCount = filteredDishes.filter(dish =>
        state.selectedSaved.has(dish.id)
    ).length;
    $('savedSelectAll').hidden = !state.savedSelecting || filteredDishes.length === 0;
    $('savedSelectAll').textContent =
        visibleSelectedCount === filteredDishes.length ? 'Deselect all' : 'Select all';
    updateSavedSelection();

    // Update tabs
    $('savedTabs').querySelectorAll('button').forEach(button => {
        button.classList.toggle(
            'selected',
            button.dataset.filter === state.savedFilter
        );
    });

    // Group saved dishes by restaurant
    const groups = {};
    filteredDishes.forEach(dish => {
        if (!groups[dish.restaurant]) {
            groups[dish.restaurant] = [];
        }
        groups[dish.restaurant].push(dish);
    });
    // Empty state
    if (filteredDishes.length === 0) {
        $('savedList').innerHTML = `
            <div class="panel empty">
                <div class="empty-art"><img src="assets/mascots/sleep.png" alt="A resting Anteater"></div>
                <h2>Nothing here yet.</h2>
                <p class="small muted" style="margin:12px 0">
                    Save a dish to start your delicious little list.
                </p>
                <button
                    class="btn blue"
                    data-action="discover"
                >
                    Discover food
                </button>
            </div>
        `;
        renderNav();
        return;
    }
    // Render restaurant groups
    $('savedList').innerHTML = Object.entries(groups)
        .map(([restaurant, items]) => {
            const dishCards = items.map(dish => {
                const tried = state.saved[dish.id].tried;
                return `
                    <div class="saved-row">
                        <input
                            class="saved-selection-checkbox"
                            type="checkbox"
                            data-saved-selection="${dish.id}"
                            aria-label="Select ${dish.name} for removal"
                            ${state.selectedSaved.has(dish.id) ? 'checked' : ''}
                            ${state.savedSelecting ? '' : 'hidden'}
                        >
                        <!-- Clickable dish card -->
                        <div
                            class="saved-dish-card"
                            data-action="savedDetails"
                            data-id="${dish.id}"
                            role="button"
                            tabindex="0"
                            aria-label="View ${dish.name} details"
                        >
                            <!-- Dish image -->
                            <div class="photo-slot mini">
                                ${dishPhotoMarkup(dish, 'Photo')}
                            </div>
                            <!-- Dish information -->
                            <div class="saved-copy">
                                <strong>
                                    ${dish.name}
                                </strong>
                                <p>
                                    $${dish.price.toFixed(2)}
                                    · ${dish.distance.toFixed(1)} mi
                                </p>
                                <p class="saved-status">
                                    ${tried ? 'Tried it ✓' : 'Not yet'}
                                </p>
                            </div>
                        </div>
                        <!-- Delete saved dish -->
                        <button
                            class="saved-delete"
                            data-action="removeSaved"
                            data-id="${dish.id}"
                            aria-label="Remove ${dish.name} from Saved"
                            title="Remove from Saved"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="1.8"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M3 6h18"/>
                                <path d="M8 6V4h8v2"/>
                                <path d="M5 6l1 15h12l1-15"/>
                                <path d="M10 10v7"/>
                                <path d="M14 10v7"/>
                            </svg>
                        </button>

                        <!-- Tried It Button -->
                        <button
                            class="saved-tried-button"
                            data-action="tried"
                            data-id="${dish.id}"
                        >
                            ${tried ? 'Undo' : 'Tried it'}
                        </button>
                    </div>
                `;
            }).join('');
            return `
                <div class="panel restaurant">
                    <h2>${restaurant}</h2>
                    <p class="small muted">
                        ${items[0].location}
                    </p>
                    ${dishCards}
                </div>
            `;
        }).join('');
    renderNav();
}
function updateSavedSelection() {
    const count = [...state.selectedSaved].filter(id => Boolean(state.saved[id])).length;
    $('savedSelectionCount').textContent = `${count} selected`;
    $('removeSelectedSaved').textContent = count === 1 ? 'Remove 1 dish' : `Remove ${count} dishes`;
    $('removeSelectedSaved').disabled = count === 0;
    $('savedSelectionDock').hidden =
        state.page !== 'saved' || !state.savedSelecting ||
        !dishes.some(dish => state.saved[dish.id]) || !$('savedUndoToast').hidden;
    document.querySelectorAll('.saved-row').forEach(row => {
        row.classList.toggle(
            'selected',
            Boolean(row.querySelector('.saved-selection-checkbox')?.checked)
        );
    });
}
function setDialogBackgroundInert(value) {
    document.querySelectorAll('.app > .view, .app > .toast, .app > .home-indicator')
        .forEach(element => { element.inert = value; });
}
function openSavedRemove() {
    const selected = dishes.filter(dish =>
        state.selectedSaved.has(dish.id) && state.saved[dish.id]
    );
    if (!selected.length) return;
    savedRemoveOpener = document.activeElement;
    const count = selected.length;
    const restaurantCount = new Set(selected.map(dish => dish.restaurant)).size;
    const noun = count === 1 ? 'dish' : 'dishes';
    $('savedRemoveTitle').textContent = `Remove ${count} ${noun}?`;
    $('savedRemoveDescription').textContent = count === 1
        ? 'Are you sure you want to remove this dish from your saved list?'
        : 'Are you sure you want to remove these dishes from your saved list?';
    $('confirmSavedRemove').textContent = `Remove ${count} ${noun}`;
    $('savedRemovalSummary').innerHTML = `
        <div class="saved-summary-thumbnails">
            ${selected.slice(0, 3).map(dish => `<img src="${dish.image || ''}" alt="">`).join('')}
        </div>
        <div>${count} ${noun} selected
            <small>From ${restaurantCount} ${restaurantCount === 1 ? 'restaurant' : 'restaurants'}</small>
        </div>`;
    $('savedRemoveOverlay').hidden = false;
    setDialogBackgroundInert(true);
    $('cancelSavedRemove').focus({ preventScroll: true });
}
function closeSavedRemove(restoreFocus = true) {
    if ($('savedRemoveOverlay').hidden) return;
    $('savedRemoveOverlay').hidden = true;
    setDialogBackgroundInert(false);
    if (restoreFocus) {
        const target = savedRemoveOpener?.isConnected ? savedRemoveOpener : $('savedSelectToggle');
        target?.focus({ preventScroll: true });
    }
}
function confirmSavedRemoval() {
    savedRemovalBatch = dishes
        .filter(dish => state.selectedSaved.has(dish.id) && state.saved[dish.id])
        .map(dish => ({ id: dish.id, save: { ...state.saved[dish.id] } }));
    if (!savedRemovalBatch.length) {
        closeSavedRemove();
        return;
    }
    savedRemovalBatch.forEach(({ id }) => delete state.saved[id]);
    state.selectedSaved.clear();
    persist('saved', state.saved);
    closeSavedRemove(false);
    renderSaved();
    renderDiscover();
    showSavedUndo();
    $('savedNav').querySelector('.nav-item')?.focus({ preventScroll: true });
}
function showSavedUndo() {
    clearTimeout(savedUndoTimer);
    savedUndoRemaining = 8000;
    savedUndoStartedAt = performance.now();
    savedUndoPaused = false;
    const count = savedRemovalBatch.length;
    $('savedUndoMessage').textContent = `${count} ${count === 1 ? 'dish' : 'dishes'} removed`;
    $('savedUndoToast').hidden = false;
    const progress = document.querySelector('.saved-undo-progress');
    progress.style.animation = 'none';
    void progress.offsetWidth;
    progress.style.animation = '';
    savedUndoTimer = setTimeout(hideSavedUndo, savedUndoRemaining);
    updateSavedSelection();
}
function hideSavedUndo() {
    clearTimeout(savedUndoTimer);
    savedUndoTimer = null;
    $('savedUndoToast').hidden = true;
    savedUndoRemaining = 8000;
    savedUndoPaused = false;
    savedRemovalBatch = [];
    updateSavedSelection();
}
function pauseSavedUndo() {
    if ($('savedUndoToast').hidden || savedUndoPaused) return;
    savedUndoPaused = true;
    clearTimeout(savedUndoTimer);
    savedUndoRemaining = Math.max(0, savedUndoRemaining - (performance.now() - savedUndoStartedAt));
}
function resumeSavedUndo() {
    if ($('savedUndoToast').hidden || !savedUndoPaused ||
        $('savedUndoToast').matches(':hover, :focus-within')) return;
    savedUndoPaused = false;
    savedUndoStartedAt = performance.now();
    savedUndoTimer = setTimeout(hideSavedUndo, savedUndoRemaining);
}
function undoSavedRemoval() {
    if (!savedRemovalBatch.length) return;
    const count = savedRemovalBatch.length;
    savedRemovalBatch.forEach(({ id, save }) => { state.saved[id] = save; });
    persist('saved', state.saved);
    hideSavedUndo();
    renderSaved();
    renderDiscover();
    toast(`${count} ${count === 1 ? 'dish' : 'dishes'} restored to Saved.`);
    $('savedSelectToggle').focus({ preventScroll: true });
}
function renderFeedSortOptions() {
    $('feedSortOptions').innerHTML = ['Price', 'Date', 'Popularity'].map(group => `
        <div class="feed-sort-group">
            <h3>${group === 'Popularity' ? 'Popularity · saves' : group}</h3>
            ${feedSorts.filter(option => option.group === group).map(option => `
                <button class="feed-sort-option" type="button" role="radio"
                    aria-checked="${state.feedSortKey === option.key}" data-feed-sort="${option.key}">
                    <span class="feed-sort-mark" aria-hidden="true">${option.mark}</span>
                    <span>${option.heading}</span>
                    ${state.feedSortKey === option.key ? '<span class="feed-sort-check" aria-hidden="true">✓</span>' : ''}
                </button>`).join('')}
        </div>`).join('');
}
function openFeedSort() {
    feedSortOpener = document.activeElement;
    renderFeedSortOptions();
    $('feedSortOverlay').hidden = false;
    $('feedSortButton')?.setAttribute('aria-expanded', 'true');
    setDialogBackgroundInert(true);
    $('feedSortOptions').querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
}
function closeFeedSort(restoreFocus = true) {
    if ($('feedSortOverlay').hidden) return;
    $('feedSortOverlay').hidden = true;
    $('feedSortButton')?.setAttribute('aria-expanded', 'false');
    setDialogBackgroundInert(false);
    const trigger = restoreFocus && feedSortOpener?.isConnected
        ? feedSortOpener
        : restoreFocus ? $('feedSortButton') : null;
    trigger?.focus({ preventScroll: true });
}
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

let detailReturnPage = 'discover';

function showDetail(id) {
    const dish = dishes.find(d => d.id === id);

    if (!dish) {
        return;
    }

    // Store selected dish and previous page.
    state.detailId = id;
    detailReturnPage = state.page;

    // Dish information
    $('detailName').textContent = dish.name;

    $('detailPrice').textContent =
        `$${dish.price.toFixed(2)}`;

    $('detailRestaurant').textContent =
        dish.restaurant;

    $('detailLocation').textContent =
        `${dish.location} · ${dish.distance.toFixed(1)} mi`;
    renderDetailReview(id);

    // Dish image or placeholder
    const photo = $('detailPhoto');

    photo.replaceChildren();

    if (dish.image) {
        const img = document.createElement('img');

        img.src = dish.image;
        img.alt = dish.name;

        photo.appendChild(img);
    } else {
        photo.textContent =
            `${dish.name} photo placeholder`;
    }

    // Update saved status
    updateDetailWantButton(id);
    // Show independent detail page
    showPage('detail');
}

function renderDetailReview(id) {
    const reviews = read('reviews', {});
    const dishReviews = reviews[id] || [];
    const latest = dishReviews[dishReviews.length - 1];
    const rating = latest?.rating ?? (id === 'tofu' ? 4.6 : null);
    const reviewText = latest?.body || (id === 'tofu' ? '“Comfort food after a long lab. A little spicy!”' : 'No community reviews yet.');
    const ratingRow = document.querySelector('.detail-rating');
    const reviewBody = document.querySelector('.detail-review-text');
    if (ratingRow) {
        ratingRow.innerHTML = rating === null ? '<span>Be the first to review</span>' : `<span class="detail-stars">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}</span><span>${rating.toFixed(1)} · ${id === 'tofu' ? 18 + dishReviews.length : dishReviews.length} reviews</span>`;
    }
    if (reviewBody) reviewBody.textContent = latest?.body ? `“${latest.body}”` : reviewText;
}

function renderReview() {
    const dish = dishes.find(item => item.id === state.detailId);
    if (!dish) return;
    $('reviewDishName').textContent = dish.name;
    setDishPhoto($('reviewDishPhoto'), dish);
    $('reviewDishRestaurant').textContent = `${dish.restaurant} · ${dish.location}`;
    $('reviewDishPhoto').textContent = `${dish.name} photo placeholder`;
    state.reviewRating = 4;
    state.reviewPhotos = [];
    $('reviewText').value = '';
    $('reviewPhotoPreviews').replaceChildren();
    renderReviewStars();
}

function renderReviewStars() {
    document.querySelectorAll('[data-action="rateReview"]').forEach(button => {
        const selected = Number(button.dataset.rating) <= state.reviewRating;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-checked', String(Number(button.dataset.rating) === state.reviewRating));
    });
}

function showReview() {
    if (!state.detailId) return;
    state.reviewRating = 4;
    state.reviewPhotos = [];
    showPage('review');
}

function renderReviewPhotoPreviews() {
    const container = $('reviewPhotoPreviews');
    container.replaceChildren();
    state.reviewPhotos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'review-photo-preview';
        const image = document.createElement('img');
        image.src = photo.url;
        image.alt = `Review photo ${index + 1}`;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'review-photo-remove';
        remove.textContent = '×';
        remove.setAttribute('aria-label', `Remove photo ${index + 1}`);
        remove.addEventListener('click', () => {
            URL.revokeObjectURL(photo.url);
            state.reviewPhotos.splice(index, 1);
            renderReviewPhotoPreviews();
        });
        item.append(image, remove);
        container.appendChild(item);
    });
}

function postReview(event) {
    event.preventDefault();
    if (!state.reviewRating) {
        toast('Please select a star rating first.');
        return;
    }
    const reviews = read('reviews', {});
    const dishReviews = reviews[state.detailId] || [];
    dishReviews.push({
        rating: state.reviewRating,
        body: $('reviewText').value.trim(),
        createdAt: new Date().toISOString()
    });
    reviews[state.detailId] = dishReviews;
    persist('reviews', reviews);
    state.reviewPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
    state.reviewPhotos = [];
    renderDetailReview(state.detailId);
    showPage('detail');
    toast('Thanks! Your review has been posted.');
}

function clearPostPhotoPreviews() {
    state.postPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
    state.postPhotos = [];
    $('postPhotoPreviews').replaceChildren();
    $('postPhotosInput').value = '';
}

function startPost() {
    clearPostPhotoPreviews();
    state.postRestaurantBranch = null;
    state.postMatch = null;
    state.postMatchDismissed = '';
    state.postTags = [];
    state.postTagsExpanded = false;
    $('postForm').reset();
    $('postRestaurantSuggestions').hidden = true;
    $('postRestaurantSuggestions').replaceChildren();
    showPage('post');
}

function renderPost() {
    if (!state.postRestaurantBranch) $('postRestaurantSuggestions').hidden = true;
}

function normalized(value) {
    return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function renderRestaurantSuggestions(query) {
    const container = $('postRestaurantSuggestions');
    const term = normalized(query);
    const matches = term
        ? restaurantBranches.filter(branch =>
            normalized(`${branch.restaurant} ${branch.location} ${branch.address}`).includes(term)
        )
        : restaurantBranches;
    container.replaceChildren();
    if (!matches.length) {
        container.hidden = true;
        return;
    }
    matches.forEach(branch => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'post-restaurant-option';
        option.dataset.action = 'selectPostRestaurant';
        option.dataset.restaurant = branch.restaurant;
        option.dataset.location = branch.location;
        option.dataset.address = branch.address;
        option.innerHTML = `<span class="post-pin" aria-hidden="true">♧</span><span><strong>${branch.restaurant} · ${branch.location}</strong><small>${branch.address}</small></span>`;
        container.appendChild(option);
    });
    container.hidden = false;
}

function findPostDishMatch() {
    const branch = state.postRestaurantBranch;
    if (!branch) return null;
    const dishName = normalized($('postDishName').value);
    const restaurantName = normalized(branch.restaurant);
    const location = normalized(branch.location);
    if (!dishName) return null;
    return dishes.find(dish =>
        normalized(dish.name) === dishName &&
        normalized(dish.restaurant) === restaurantName &&
        normalized(dish.location) === location
    ) ?? null;
}

function checkPostDishMatch() {
    const match = findPostDishMatch();
    if (!match) {
        state.postMatch = null;
        return false;
    }
    const signature = `${match.id}:${normalized(state.postRestaurantBranch.address)}`;
    if (signature === state.postMatchDismissed) return false;
    if (state.postMatch?.id === match.id) return true;
    state.postMatch = match;
    $('postMatchDishName').textContent = match.name;
    $('postMatchRestaurant').textContent = `${match.restaurant} · ${match.location}`;
    $('postMatchAddress').textContent = state.postRestaurantBranch.address;
    $('postMatchOverlay').classList.add('show');
    return true;
}

function selectPostRestaurant(button) {
    state.postRestaurantBranch = {
        restaurant: button.dataset.restaurant,
        location: button.dataset.location,
        address: button.dataset.address
    };
    state.postMatchDismissed = '';
    $('postRestaurant').value = button.dataset.restaurant;
    $('postRestaurantSuggestions').hidden = true;
    checkPostDishMatch();
}

function renderPostPhotoPreviews() {
    const container = $('postPhotoPreviews');
    container.replaceChildren();
    state.postPhotos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'post-photo-preview';
        const image = document.createElement('img');
        image.src = photo.url;
        image.alt = `Dish photo ${index + 1}`;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'review-photo-remove';
        remove.textContent = '×';
        remove.setAttribute('aria-label', `Remove dish photo ${index + 1}`);
        remove.addEventListener('click', () => {
            URL.revokeObjectURL(photo.url);
            state.postPhotos.splice(index, 1);
            renderPostPhotoPreviews();
        });
        item.append(image, remove);
        container.appendChild(item);
    });
}

function savePostDraft(event) {
    event.preventDefault();
    const branch = state.postRestaurantBranch;
    if (!branch) {
        toast('Choose a restaurant and branch first.');
        $('postRestaurant').focus();
        renderRestaurantSuggestions($('postRestaurant').value);
        return;
    }
    const match = findPostDishMatch();
    if (match && checkPostDishMatch()) {
        return;
    }
    state.postMatch = null;
    state.postTags = [];
    $('existingReviewText').value = $('postReviewText').value.trim();
    showPage('postReview');
}

function renderPostReview() {
    const heading = document.querySelector('#postReview .post-header h2');
    if (heading) heading.textContent = 'Share a bite';
    const button = document.querySelector('.review-tags-heading');
    button.setAttribute('aria-expanded', String(state.postTagsExpanded));
    $('postTagOptions').hidden = !state.postTagsExpanded;
    $('postTagOptions').innerHTML = state.postTagsExpanded
        ? Object.entries(postTagOptions).map(([group, options]) => `
            <section class="post-tag-group">
                <h4>${group}</h4>
                <div class="post-tag-chips">${options.map(tag => `
                    <button type="button" class="post-tag-chip${state.postTags.includes(tag) ? ' selected' : ''}"
                        data-action="togglePostTag" data-tag="${tag}" aria-pressed="${state.postTags.includes(tag)}">${tag}</button>
                `).join('')}</div>
            </section>`).join('')
        : '';
    $('postSelectedTags').innerHTML = state.postTags.map(tag => `<span class="post-selected-tag">${tag}</span>`).join('');
}

function publishPost() {
    const branch = state.postRestaurantBranch;
    const match = state.postMatch;
    const body = $('existingReviewText').value.trim();
    const post = {
        id: `post-${Date.now()}`,
        dishId: match?.id ?? null,
        dishName: match?.name ?? $('postDishName').value.trim(),
        restaurant: branch?.restaurant ?? $('postRestaurant').value.trim(),
        location: branch?.location ?? '',
        address: branch?.address ?? '',
        price: Number($('postPrice').value),
        body,
        tags: [...state.postTags],
        createdAt: new Date().toISOString()
    };
    const posts = read('posts', []);
    posts.unshift(post);
    persist('posts', posts);

    if (match) {
        const reviews = read('reviews', {});
        const dishReviews = reviews[match.id] || [];
        dishReviews.push({ body, tags: [...state.postTags], createdAt: post.createdAt });
        reviews[match.id] = dishReviews;
        persist('reviews', reviews);
    } else {
        const newDish = {
            id: post.id,
            name: post.dishName,
            restaurant: post.restaurant,
            location: post.location,
            price: post.price,
            publishedAt: post.createdAt,
            savedCount: 0,
            distance: 0,
            kind: 'Other',
            desc: body,
            image: state.postPhotos[0]?.url
        };
        dishes.unshift(newDish);
        const reviews = read('reviews', {});
        reviews[newDish.id] = [{ body, tags: [...state.postTags], createdAt: post.createdAt }];
        persist('reviews', reviews);
        state.postMatch = newDish;
    }
    showPage('postSuccess');
}

// Return to the previous page
function backFromDetail() {
    showPage(detailReturnPage);
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
            case 'editProfile':
                showPage('editProfile');
                break;
            case 'backToMe':
                showPage('me');
                break;
            case 'selectProfileAvatar':
                if (profileAvatars.some(([, src]) => src === b.dataset.avatar)) {
                    state.profileAvatarDraft = b.dataset.avatar;
                    renderProfileEditor();
                }
                break;
            case 'saveProfilePicture':
                try {
                    persist('profileAvatar', state.profileAvatarDraft);
                    state.profileAvatar = state.profileAvatarDraft;
                    showPage('me');
                    toast('Profile picture saved.');
                } catch {
                    $('profileAvatarError').textContent = 'Could not save your profile picture. Try again.';
                    $('profileAvatarError').hidden = false;
                }
                break;
            case 'discover':
                showPage('discover');
                break;
            case 'nav':
                if (b.dataset.page === 'post') {
                    startPost();
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
                performSwipe('skip');
                break;
            case 'want':
                performSwipe('want');
                break;
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
                toggleSavedDish(state.detailId);
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
            case 'savedDetails':
                showDetail(id);
                break;
            case 'removeSaved':
                if (state.saved[id]) {
                    state.savedSelecting = true;
                    state.selectedSaved = new Set([id]);
                    renderSaved();
                    openSavedRemove();
                }
                break;
            case 'backFromDetail':
                backFromDetail();
                break;
            case 'directions': {
                const dish = dishes.find(
                    d => d.id === state.detailId);
                if (dish) {
                    const query = [
                        dish.restaurant,
                        dish.location,
                        'Irvine CA'
                    ].join(' ');
                    const mapUrl =
                        'https://www.google.com/maps/search/?api=1&query=' +
                        encodeURIComponent(query);
                    window.open(mapUrl, '_blank', 'noopener,noreferrer');}
                break;
            }
            case 'otherDishes': {
                const dish = dishes.find(
                    d => d.id === state.detailId);
                if (!dish) {
                    break;
                }
                state.mode = 'feed';
                showPage('discover');
                const search = $('feedSearch');
                if (search) {
                    search.value = dish.restaurant;
                    search.dispatchEvent(
                        new Event('input', { bubbles: true }));}
                break;
            }
            case 'writeReview':
                showReview();
                break;
            case 'backFromPost':
                clearPostPhotoPreviews();
                showPage('discover');
                break;
            case 'backToPost':
                showPage('post');
                break;
            case 'selectPostRestaurant':
                selectPostRestaurant(b);
                break;
            case 'addPostPhotos':
                $('postPhotosInput').click();
                break;
            case 'addMyReview':
                if (state.postMatch) {
                    $('postMatchOverlay').classList.remove('show');
                    $('existingReviewText').value = $('postReviewText').value.trim();
                    state.postTags = state.postMatch.id === 'tofu' ? ['Spicy'] : [];
                    state.postTagsExpanded = false;
                    showPage('postReview');
                }
                break;
            case 'closePostMatch':
            case 'dismissPostMatch': {
                const match = state.postMatch;
                if (match && state.postRestaurantBranch) {
                    state.postMatchDismissed = `${match.id}:${normalized(state.postRestaurantBranch.address)}`;
                }
                state.postMatch = null;
                $('postMatchOverlay').classList.remove('show');
                break;
            }
            case 'togglePostTags':
                state.postTagsExpanded = !state.postTagsExpanded;
                renderPostReview();
                break;
            case 'togglePostTag': {
                const tag = b.dataset.tag;
                state.postTags = state.postTags.includes(tag)
                    ? state.postTags.filter(item => item !== tag)
                    : [...state.postTags, tag];
                renderPostReview();
                break;
            }
            case 'publishPost':
                publishPost();
                break;
            case 'viewMyPost':
                if (state.postMatch) showDetail(state.postMatch.id);
                break;
            case 'backToDiscover':
                clearPostPhotoPreviews();
                state.postMatch = null;
                showPage('discover');
                break;
            case 'backFromReview':
                showPage('detail');
                break;
            case 'rateReview':
                state.reviewRating = Number(b.dataset.rating);
                renderReviewStars();
                break;
            case 'addReviewPhotos':
                $('reviewPhotosInput').click();
                break;
            case 'reviewEditTags':
                toast('Edit tags from the dish details page.');
                break;
        }
});
$('reviewPhotosInput').addEventListener('change', event => {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'));
    state.reviewPhotos.push(...files.map(file => ({ file, url: URL.createObjectURL(file) })));
    renderReviewPhotoPreviews();
    event.target.value = '';
});
$('reviewForm').addEventListener('submit', postReview);
$('postForm').addEventListener('submit', savePostDraft);
$('postRestaurant').addEventListener('input', event => {
    state.postRestaurantBranch = null;
    state.postMatchDismissed = '';
    renderRestaurantSuggestions(event.target.value);
});
$('postDishName').addEventListener('input', () => {
    state.postMatchDismissed = '';
    checkPostDishMatch();
});
$('postPhotosInput').addEventListener('change', event => {
    const files = Array.from(event.target.files || []).filter(file => file.type.startsWith('image/'));
    state.postPhotos.push(...files.map(file => ({ file, url: URL.createObjectURL(file) })));
    renderPostPhotoPreviews();
    event.target.value = '';
});
$('feedSearch').addEventListener('input', event => {
    state.feedQuery = event.target.value;
    renderFeedCards();
});
$('savedSelectToggle').addEventListener('click', () => {
    state.savedSelecting = !state.savedSelecting;
    state.selectedSaved.clear();
    hideSavedUndo();
    renderSaved();
});
$('savedSelectAll').addEventListener('click', () => {
    const visible = dishes.filter(dish =>
        state.saved[dish.id] &&
        (state.savedFilter === 'all' ||
            (state.savedFilter === 'tried' ? state.saved[dish.id].tried : !state.saved[dish.id].tried))
    );
    const allSelected = visible.length > 0 &&
        visible.every(dish => state.selectedSaved.has(dish.id));
    visible.forEach(dish => {
        if (allSelected) state.selectedSaved.delete(dish.id);
        else state.selectedSaved.add(dish.id);
    });
    renderSaved();
});
$('savedList').addEventListener('change', event => {
    const checkbox = event.target.closest('[data-saved-selection]');
    if (!checkbox) return;
    if (checkbox.checked) state.selectedSaved.add(checkbox.dataset.savedSelection);
    else state.selectedSaved.delete(checkbox.dataset.savedSelection);
    const visible = dishes.filter(dish =>
        state.saved[dish.id] &&
        (state.savedFilter === 'all' ||
            (state.savedFilter === 'tried' ? state.saved[dish.id].tried : !state.saved[dish.id].tried))
    );
    const selectedCount = visible.filter(dish => state.selectedSaved.has(dish.id)).length;
    $('savedSelectAll').textContent =
        selectedCount === visible.length ? 'Deselect all' : 'Select all';
    updateSavedSelection();
});
$('removeSelectedSaved').addEventListener('click', openSavedRemove);
$('closeSavedRemove').addEventListener('click', () => closeSavedRemove());
$('cancelSavedRemove').addEventListener('click', () => closeSavedRemove());
$('confirmSavedRemove').addEventListener('click', confirmSavedRemoval);
$('savedRemoveOverlay').addEventListener('click', event => {
    if (event.target.matches('[data-dismiss-saved-remove]')) closeSavedRemove();
});
$('undoSavedButton').addEventListener('click', undoSavedRemoval);
$('savedUndoToast').addEventListener('mouseenter', pauseSavedUndo);
$('savedUndoToast').addEventListener('mouseleave', resumeSavedUndo);
$('savedUndoToast').addEventListener('focusin', pauseSavedUndo);
$('savedUndoToast').addEventListener('focusout', () => requestAnimationFrame(resumeSavedUndo));
$('feedArea').addEventListener('click', event => {
    if (event.target.closest('#feedSortButton')) openFeedSort();
});
$('closeFeedSort').addEventListener('click', () => closeFeedSort());
$('feedSortOverlay').addEventListener('click', event => {
    if (event.target.matches('[data-dismiss-feed-sort]')) closeFeedSort();
});
$('feedSortOptions').addEventListener('click', event => {
    const option = event.target.closest('[data-feed-sort]');
    if (!option) return;
    state.feedSortKey = option.dataset.feedSort;
    closeFeedSort(false);
    renderFeedCards();
    $('discover').querySelector('.scroller').scrollTop = 0;
    $('feedSortButton')?.focus({ preventScroll: true });
});
$('feedSortOptions').addEventListener('keydown', event => {
    const options = [...$('feedSortOptions').querySelectorAll('[data-feed-sort]')];
    const index = options.indexOf(document.activeElement);
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 :
        (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
});
document.addEventListener('keydown', event => {
    const removeOpen = !$('savedRemoveOverlay').hidden;
    const sortOpen = !$('feedSortOverlay').hidden;
    const dialog = removeOpen
        ? $('savedRemoveOverlay').querySelector('[role="dialog"]')
        : sortOpen ? $('feedSortOverlay').querySelector('[role="dialog"]') : null;
    if (!dialog) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        if (removeOpen) closeSavedRemove();
        else closeFeedSort();
        return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button:not([disabled])')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});
document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') {
        return;
    }
    const card = event.target.closest(
        '[data-action="savedDetails"], [data-action="feedDetails"]'
    );
    if (!card) return;
    event.preventDefault();
    showDetail(card.dataset.id);
});
document.querySelectorAll('.overlay').forEach(v => v.addEventListener('click', e => {
    if (e.target !== v) return;
    if (v.id === 'postMatchOverlay') {
        const match = state.postMatch;
        if (match && state.postRestaurantBranch) {
            state.postMatchDismissed = `${match.id}:${normalized(state.postRestaurantBranch.address)}`;
        }
        state.postMatch = null;
        v.classList.remove('show');
    } else {
        closeOverlays();
    }
}));
const swipeCard = $('gestureCard');
swipeCard.addEventListener('pointerdown', onSwipePointerDown);
swipeCard.addEventListener('pointermove', onSwipePointerMove);
swipeCard.addEventListener('pointerup', onSwipePointerUp);
swipeCard.addEventListener('pointercancel', cancelSwipeGesture);
swipeCard.addEventListener('lostpointercapture', cancelSwipeGesture);
swipeCard.addEventListener('dragstart', event => event.preventDefault());
swipeCard.addEventListener('click', () => {
    if (performance.now() < suppressSwipeClickUntil || swipeBusy) return;
    const arr = activeDishes();
    if (arr.length) showDetail(arr[state.index % arr.length].id);
});
swipeCard.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && !swipeBusy) {
        event.preventDefault();
        suppressSwipeClickUntil = performance.now() + 450;
        const arr = activeDishes();
        if (arr.length) showDetail(arr[state.index % arr.length].id);
    }
});
window.addEventListener('blur', cancelSwipeGesture);
document.addEventListener('keydown', event => {
    if (event.repeat || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
        state.page !== 'discover' || state.mode !== 'swipe' || swipeBusy ||
        document.querySelector('.overlay.show') ||
        event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    event.preventDefault();
    performSwipe(event.key === 'ArrowLeft' ? 'skip' : 'want');
});
renderChoices();
renderDiscover();
renderSaved();
