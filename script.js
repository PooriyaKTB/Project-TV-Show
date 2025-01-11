// Cache for API responses
const cache = {
  shows: null,
  episodes: new Map(),
};

// Global state
let allEpisodes = [];
let currentShowId = null;

// DOM elements
const cardsContainer = document.getElementById('cards-container');
const showContainer = document.getElementById('shows-container');
const searchInput = document.getElementById('episode-search');
const episodeSelector = document.getElementById('episode-selector');
const showSelector = document.getElementById('show-selector');
const mainHeader = document.querySelector('.main-header h1');

// Helper function to format episode codes
function formatEpisodeCode(season, number) {
  const seasonCode = String(season).padStart(2, '0');
  const episodeCode = String(number).padStart(2, '0');
  return `S${seasonCode}E${episodeCode}`;
}

// Create episode card
function createEpisodeCard(episode) {
  const card = document.createElement('div');
  card.classList.add('card');

  const img = document.createElement('img');
  img.src = episode.image?.medium || 'placeholder.jpg';
  img.alt = episode.name;
  img.loading = 'lazy';

  const cardContent = document.createElement('div');
  cardContent.classList.add('card-content');

  const episodeNumber = document.createElement('div');
  episodeNumber.classList.add('episode-number');
  episodeNumber.textContent = formatEpisodeCode(episode.season, episode.number);

  const title = document.createElement('h2');
  title.textContent = episode.name;

  const description = document.createElement('p');
  description.innerHTML = episode.summary || 'No description available.';

  cardContent.append(episodeNumber, title, description);
  card.append(img, cardContent);

  return card;
}

// Create show card
function createShowCard(show) {
  const card = document.createElement('div');
  card.classList.add('tv-show-card');

  const img = document.createElement('img');
  img.src = show.image?.medium || 'placeholder.jpg';
  img.alt = show.name;
  img.classList.add('tv-show-image');
  img.loading = 'lazy';

  const content = document.createElement('div');
  content.classList.add('tv-show-content');

  const title = document.createElement('h2');
  title.textContent = show.name;
  title.classList.add('tv-show-title');
  title.addEventListener('click', function () {
    loadEpisodesForShow(show.id);
  });

  const genres = document.createElement('p');
  genres.classList.add('tv-show-genres');
  genres.textContent = `Genres: ${show.genres.join(', ')}`;

  const status = document.createElement('p');
  status.classList.add('tv-show-status');
  status.textContent = `Status: ${show.status}`;

  const rating = document.createElement('p');
  rating.classList.add('tv-show-rating');
  rating.textContent = `Rating: ${show.rating.average || 'N/A'}`;

  const runtime = document.createElement('p');
  runtime.classList.add('tv-show-runtime');
  runtime.textContent = `Runtime: ${show.runtime} minutes`;

  const summary = document.createElement('div');
  summary.classList.add('tv-show-summary');
  summary.innerHTML = show.summary || 'No summary available.';

  content.append(title, genres, status, rating, runtime, summary);
  card.append(img, content);

  return card;
}

// Show listing view
function showShowsListing() {
  mainHeader.textContent = 'TV Shows'; // Ensure the header shows "TV Shows"
  currentShowId = null;

  // Reset UI elements
  searchInput.placeholder = 'Search shows...';
  episodeSelector.classList.add('hidden');
  showSelector.classList.remove('hidden');
  searchInput.value = '';

  // Display shows and set up search
  displayShows(cache.shows);
  searchInput.removeEventListener('input', handleSearch);
  searchInput.addEventListener('input', handleShowSearch);
}

// Episode listing view
function showEpisodesListing() {
  // Update UI elements
  searchInput.placeholder = 'Search episodes...';
  episodeSelector.classList.remove('hidden');
  showSelector.classList.remove('hidden');
  searchInput.value = '';

  // Set up search handlers
  searchInput.removeEventListener('input', handleShowSearch);
  searchInput.addEventListener('input', handleSearch);
}

// Filter episodes based on search term
function filterEpisodes(searchTerm) {
  const normalizedSearchTerm = searchTerm.toLowerCase();
  return allEpisodes.filter(function (episode) {
    return (
      episode.name.toLowerCase().includes(normalizedSearchTerm) ||
      episode.summary?.toLowerCase().includes(normalizedSearchTerm)
    );
  });
}

// Filter shows based on search term
function filterShows(shows, searchTerm) {
  const normalized = searchTerm.toLowerCase();
  return shows.filter(function (show) {
    return (
      show.name.toLowerCase().includes(normalized) ||
      show.genres.some(function (genre) {
        return genre.toLowerCase().includes(normalized);
      }) ||
      show.summary?.toLowerCase().includes(normalized)
    );
  });
}

// Display shows
function displayShows(shows) {
  // Clear both containers
  showContainer.innerHTML = '';
  cardsContainer.innerHTML = '';

  // Hide episodes container and show the shows container
  cardsContainer.style.display = 'none';
  showContainer.style.display = 'block';

  // Remove episode count and back button if they exist
  const existingCount = document.getElementById('episode-count');
  const existingButton = document.getElementById('back-button');
  if (existingCount) existingCount.remove();
  if (existingButton) existingButton.remove();

  // Display shows
  shows.forEach(function (show) {
    showContainer.appendChild(createShowCard(show));
  });
}

// Display episodes
function displayEpisodes(episodes) {
  // Clear both containers
  showContainer.innerHTML = '';
  cardsContainer.innerHTML = '';
  // Display episodes
  episodes.forEach(function (episode) {
    cardsContainer.appendChild(createEpisodeCard(episode));
  });

  // Update episode count and add back button
  const searchWrapper = document.querySelector('.search-wrapper');

  // Remove any existing episode count and back button
  const existingCount = document.getElementById('episode-count');
  const existingButton = document.getElementById('back-button');
  if (existingCount) existingCount.remove();
  if (existingButton) existingButton.remove();

  // Create episode count
  const countDisplay = document.createElement('div');
  countDisplay.id = 'episode-count';
  countDisplay.textContent = `${episodes.length} / ${allEpisodes.length} episodes`;

  // Create back button
  const backButton = document.createElement('button');
  backButton.id = 'back-button';
  backButton.textContent = 'Back to Shows';
  backButton.classList.add('back-button');
  backButton.addEventListener('click', function () {
    showSelector.value = ''; // Reset show selector
    showShowsListing(); // Go back to shows listing
  });

  // Add both elements to search wrapper
  searchWrapper.appendChild(countDisplay);
  searchWrapper.appendChild(backButton);
}

// Populate episode selector
function populateEpisodeSelector(episodes) {
  episodeSelector.innerHTML = '<option value="">Select Episode</option>';

  episodes.forEach(function (episode) {
    const option = document.createElement('option');
    option.value = episode.id;
    option.textContent = `${formatEpisodeCode(
      episode.season,
      episode.number
    )} - ${episode.name}`;
    episodeSelector.appendChild(option);
  });
}

// Populate show selector (without optgroup)
function populateShowSelector(shows) {
  // Clear existing options
  showSelector.innerHTML = "<option value=''>Select Show</option>";

  // Sort shows by name
  const sortedShows = [...shows].sort(function (a, b) {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  // Add shows to the selector
  sortedShows.forEach(function (show) {
    const option = document.createElement('option');
    option.value = show.id;
    option.textContent = show.name;
    showSelector.appendChild(option);
  });
}

// Handle episode selection
function handleEpisodeSelection(event) {
  const selectedEpisodeId = event.target.value;

  if (selectedEpisodeId) {
    const selectedEpisode = allEpisodes.find(function (episode) {
      return episode.id === parseInt(selectedEpisodeId, 10);
    });
    displayEpisodes(selectedEpisode ? [selectedEpisode] : []);
  } else {
    displayEpisodes(allEpisodes);
  }
}

// Handle show selection
function handleShowSelection(event) {
  const selectedShowId = event.target.value;
  if (selectedShowId) {
    loadEpisodesForShow(selectedShowId);
  } else {
    showShowsListing();
  }
}

// Handle episode search
function handleSearch(event) {
  const searchTerm = event.target.value;
  const filteredEpisodes = searchTerm
    ? filterEpisodes(searchTerm)
    : allEpisodes;
  displayEpisodes(filteredEpisodes);
}

// Handle show search
function handleShowSearch(event) {
  const searchTerm = event.target.value;
  const filteredShows = searchTerm
    ? filterShows(cache.shows, searchTerm)
    : cache.shows;
  displayShows(filteredShows);
}

// Load episodes for selected show
async function loadEpisodesForShow(showId) {
  if (showId === currentShowId) return;
  currentShowId = showId;

  // Show loading state
  cardsContainer.innerHTML = '';
  showContainer.style.display = 'none';
  cardsContainer.style.display = 'block';

  const loadingMessage = document.createElement('p');
  loadingMessage.id = 'loading-message';
  loadingMessage.textContent = 'Loading episodes...';
  cardsContainer.appendChild(loadingMessage);

  try {
    // Check cache first
    if (cache.episodes.has(showId)) {
      allEpisodes = cache.episodes.get(showId);
      displayEpisodes(allEpisodes);
      populateEpisodeSelector(allEpisodes);
      showEpisodesListing();
      return;
    }

    // Fetch episodes if not in cache
    const response = await fetch(
      `https://api.tvmaze.com/shows/${showId}/episodes`
    );
    if (!response.ok)
      throw new Error(`Failed to fetch episodes: ${response.statusText}`);

    const episodes = await response.json();
    cache.episodes.set(showId, episodes);
    allEpisodes = episodes;

    displayEpisodes(episodes);
    populateEpisodeSelector(episodes);
    showEpisodesListing();
  } catch (error) {
    cardsContainer.innerHTML = `<p class="error">Error loading episodes. Please try again.</p>`;
  }
}

// Initialize the app
async function init() {
  try {
    const response = await fetch('https://api.tvmaze.com/shows');
    if (!response.ok)
      throw new Error(`Failed to fetch shows: ${response.statusText}`);

    cache.shows = await response.json();
    populateShowSelector(cache.shows);
    showShowsListing(); // This will display shows initially

    // Event listeners
    showSelector.addEventListener('change', handleShowSelection);
    episodeSelector.addEventListener('change', handleEpisodeSelection);
    searchInput.addEventListener('input', handleShowSearch);
  } catch (error) {
    showContainer.innerHTML = `<p class="error">Error loading shows. Please try again.</p>`;
  }
}

// Start the app
window.onload = init;
