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
    savedFilter: 'all', detailId: null, editing: false,
    reviewRating: 4, reviewPhotos: []
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
        renderChoices(); if (page === 'review')
        renderReview(); const scroll = document.querySelector('#' + page + ' .scroller'); if (scroll)
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
                <div class="icon-slot">
                    Saved empty-state illustration placeholder
                </div>
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
                                Photo
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
    const rating = latest?.rating ?? 4.6;
    const reviewText = latest?.body || '“Comfort food after a long lab. A little spicy!”';
    const ratingRow = document.querySelector('.detail-rating');
    const reviewBody = document.querySelector('.detail-review-text');
    if (ratingRow) {
        ratingRow.innerHTML = `<span class="detail-stars">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}</span><span>${rating.toFixed(1)} · ${18 + dishReviews.length} reviews</span>`;
    }
    if (reviewBody) reviewBody.textContent = latest?.body ? `“${latest.body}”` : reviewText;
}

function renderReview() {
    const dish = dishes.find(item => item.id === state.detailId);
    if (!dish) return;
    $('reviewDishName').textContent = dish.name;
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
                if (state.saved[id])
                    delete state.saved[id];
                    persist('saved', state.saved);
                    renderSaved();
                    renderDiscover();
                    toast('Removed from Saved.');
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
$('feedSearch').addEventListener('input', event => {
    state.feedQuery = event.target.value;
    renderFeedCards();
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
