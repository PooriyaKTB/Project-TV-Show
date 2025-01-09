// Store all episodes globally so we can filter them
let allEpisodes = [];

// Cache for storing fetched shows and episodes
const cache = {
  shows: null,
  episodes: {},
};

// Main setup function to initialize the page
function setup() {
  document.getElementById('episode-selector').style.display = 'none'; // Hide episodes initially
  document.getElementById('nav-to-shows').style.display = 'none'; // Hide back to show button initially
  document.getElementById('searchBox').placeholder = 'Search shows...'; // Set initial placeholder
  displayShows(); // Display the list of shows
  setupShowSearch(); // Enable show search
  setupShowSelector();
  displayLoadingMessage();
}

// Fetch all shows from the TVMaze API
async function fetchShows() {
  const url = 'https://api.tvmaze.com/shows';
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const shows = await response.json();
    return shows.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
  } catch (error) {
    console.error('Error fetching shows:', error);
    throw error;
  }
}

async function displayShows() {
  if (cache.shows) {
    populateShowsListing(cache.shows);
  } else {
    try {
      const shows = await fetchShows();
      cache.shows = shows; // Cache the shows
      populateShowsListing(shows);
    } catch (error) {
      displayErrorMessage(`Failed to load shows. Please try again later.`);
      console.error('Error fetching shows:', error);
    }
  }
}

// Populate the shows listing
function populateShowsListing(shows) {
  const showListing = document.getElementById('show-listing');
  showListing.innerHTML = ''; // Clear existing content

  const fragment = document.createDocumentFragment();

  shows.forEach((show) => {
    const card = document.createElement('div');
    card.classList.add('show-card');

    card.innerHTML = `
      <img src="${show.image?.medium || 'placeholder.jpg'}" alt="${show.name}">
      <h2 class="show-name" data-id="${show.id}">${show.name}</h2>
      <p>${show.summary}</p>
      <p><strong>Genres:</strong> ${show.genres.join(', ')}</p>
      <p><strong>Status:</strong> ${show.status}</p>
      <p><strong>Rating:</strong> ${show.rating.average || 'N/A'}</p>
      <p><strong>Runtime:</strong> ${show.runtime} mins</p>
    `;

    fragment.appendChild(card);
  });

  showListing.appendChild(fragment);

  // Add click listeners to show names
  const showNames = document.querySelectorAll('.show-name');
  showNames.forEach((name) =>
    name.addEventListener('click', (e) => handleShowClick(e.target.dataset.id))
  );
}

async function setupShowSelector() {
  const showSelector = document.getElementById("show-selector");
  if (cache.shows) {
    populateShowSelector(cache.shows);
  } else {
    try {
      const shows = await fetchShows();
      cache.shows = shows;
      populateShowSelector(shows);
    } catch (error) {
      console.error("Error fetching shows:", error);
    }
  }

  showSelector.addEventListener("change", async (event) => {
    const showId = event.target.value;
    if (!showId) return;
    await handleShowSelect({ target: {value: showId}});
  });
}

// Populate the show selector dropdown
function populateShowSelector(shows) {
  const showSelector = document.getElementById('show-selector');
  showSelector.innerHTML = '<option value="">Select a Show</option>';
  shows.forEach((show) => {
    const option = document.createElement('option');
    option.value = show.id;
    option.textContent = show.name;
    showSelector.appendChild(option);
  });
}

async function handleShowClick(showId) {
  document.getElementById('show-listing').style.display = 'none';
  document.getElementById('episode-listing').style.display = 'block';
  document.getElementById('nav-to-shows').style.display = 'block';
  document.getElementById('episode-selector').style.display = 'block'; // Show episode selector
  toggleSearchBehavior(false); // Switch to episode search
  await handleShowSelect({ target: { value: showId } });
}

// Add hover effect for elements with the class "show-title"
document.addEventListener("DOMContentLoaded", () => {
  const showTitles = document.querySelectorAll(".show-title");

  showTitles.forEach((title) => {
    title.style.cursor = "pointer"; // Set cursor to pointer on hover
  });
});

// Handle show selection
async function handleShowSelect(event) {
  const showId = event.target.value;

  if (!showId) return; // Ignore if no show is selected

  displayLoadingMessage();

  try {
    let episodes;

    // Check if episodes are already cached
    if (cache.episodes[showId]) {
      episodes = cache.episodes[showId];
    } else {
      // Fetch episodes for the selected show
      episodes = await fetchEpisodes(showId);
      cache.episodes[showId] = episodes; // Cache the episodes
    }

    allEpisodes = episodes;

    // Reset search and episode selector
    document.getElementById('searchBox').value = '';
    document.getElementById('clear-icon').style.display = 'none';
    document.getElementById('episode-selector').value = 'all';

    // Update the page with the new episodes
    makePageForEpisodes(allEpisodes);
    updateEpisodeCount(allEpisodes.length, allEpisodes.length);
    setupEpisodeSelector();
  } catch (error) {
    displayErrorMessage(`Failed to load episodes. Please try again later.`);
    console.error('Error fetching episodes:', error);
  }
}

// Fetch episodes for a specific show
async function fetchEpisodes(showId) {
  const url = `https://api.tvmaze.com/shows/${showId}/episodes`;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching episodes:', error);
    throw error;
  }
}

// Display a loading message while fetching data
function displayLoadingMessage() {
  const show = document.getElementById('show-card');
  show.innerHTML = `
    <div class="loading-spinner"></div>
    <p>Loading episodes... Please wait.</p>
  `;
}

// Display an error message to the user
function displayErrorMessage(message) {
  const show = document.getElementById('show-card');
  show.innerHTML = `<p class="error-message">${message}</p>`;
}

// Set up the search box to filter episodes based on user input
function setupSearchListener() {
  const searchBox = document.getElementById('searchBox');
  const clearIcon = document.getElementById('clear-icon');

  searchBox.addEventListener('input', handleSearch); // Call handleSearch on input

  // Show the clear icon when there's text in the search bar
  searchBox.addEventListener('input', () => {
    if (searchBox.value.trim() !== '') {
      clearIcon.style.display = 'block';
    } else {
      clearIcon.style.display = 'none';
      makePageForEpisodes(allEpisodes);
      updateEpisodeCount(allEpisodes.length, allEpisodes.length);
    }
  });

  // Clear the search bar when the clear icon is clicked
  clearIcon.addEventListener('click', () => {
    searchBox.value = '';
    clearIcon.style.display = 'none';
    makePageForEpisodes(allEpisodes);
    updateEpisodeCount(allEpisodes.length, allEpisodes.length);
    handleSearch();
  });
}

// Populate the episode selector dropdown and add an event listener
function setupEpisodeSelector() {
  const selector = document.getElementById('episode-selector');

  // Clear existing options except the first one
  selector.innerHTML = '<option value="all">All Episodes</option>';

  // Populate the selector with options for each episode
  allEpisodes.forEach((episode) => {
    const option = document.createElement('option');
    const seasonNum = String(episode.season).padStart(2, '0'); // Format season number
    const episodeNum = String(episode.number).padStart(2, '0'); // Format episode number
    option.value = `S${seasonNum}E${episodeNum}`;
    option.textContent = `S${seasonNum}E${episodeNum} - ${episode.name}`;
    selector.appendChild(option);
  });

  // Add event listener for when an episode is selected
  selector.addEventListener('change', handleEpisodeSelect);
}

// Handle episode selection from the dropdown
function handleEpisodeSelect(event) {
  const selectedValue = event.target.value;
  const searchBox = document.getElementById('searchBox');

  // Clear the search box when an episode is selected
  searchBox.value = '';

  if (selectedValue === 'all') {
    // Display all episodes if "All Episodes" is selected
    makePageForEpisodes(allEpisodes);
    updateEpisodeCount(allEpisodes.length, allEpisodes.length);
  } else {
    // Find the selected episode and display it
    const selectedEpisode = allEpisodes.find((episode) => {
      const seasonNum = String(episode.season).padStart(2, '0');
      const episodeNum = String(episode.number).padStart(2, '0');
      return `S${seasonNum}E${episodeNum}` === selectedValue;
    });

    // Update the page with the selected episode or fallback to all episodes
    makePageForEpisodes(selectedEpisode ? [selectedEpisode] : allEpisodes);
    updateEpisodeCount(
      selectedEpisode ? 1 : allEpisodes.length,
      allEpisodes.length
    );
  }
}

// Handle the search box input to filter episodes
function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();

  // Reset the episode selector to "All Episodes" when searching
  document.getElementById('episode-selector').value = 'all';

  // Filter episodes based on the search term
  const filteredEpisodes = allEpisodes.filter((episode) => {
    const titleMatch = episode.name.toLowerCase().includes(searchTerm);
    const summaryMatch = episode.summary.toLowerCase().includes(searchTerm);
    return titleMatch || summaryMatch;
  });

  // Update the page with the filtered episodes
  makePageForEpisodes(filteredEpisodes);
  updateEpisodeCount(filteredEpisodes.length, allEpisodes.length);
}

// Update the episode count display
function updateEpisodeCount(matchCount, totalCount) {
  const countDisplay = document.getElementById('episode-count');
  countDisplay.textContent = `Displaying ${matchCount}/${totalCount} episodes`;
}

// Generate the page content with a list of episodes
function makePageForEpisodes(episodeList) {
  const show = document.getElementById('show-card');
  show.innerHTML = ''; // Clear the existing content
  const episodeCards = episodeList.map(createEpisodeCard); // Create episode cards
  show.append(...episodeCards); // Append the cards to the page
}

// Create an individual episode card using the template
const createEpisodeCard = (episode) => {
  const template = document.getElementById('episode-template');
  const card = template.content.cloneNode(true); // Clone the template content

  // Set the episode details in the card
  card.querySelector('.episode-title').textContent = episode.name;
  card.querySelector('.episode-code').textContent = `S${String(
    episode.season
  ).padStart(2, '0')}E${String(episode.number).padStart(2, '0')}`;
  card.querySelector('.episode-img').src = episode.image.medium;
  card.querySelector('.episode-summary').innerHTML = episode.summary;

  return card;
};

// Add navigation between shows and episodes views
document.getElementById('nav-to-shows').addEventListener('click', () => {
  document.getElementById('episode-listing').style.display = 'none';
  document.getElementById('episode-listing').style.display = 'none';
  document.getElementById('show-listing').style.display = 'block';
  document.getElementById('nav-to-shows').style.display = 'none';
  document.getElementById('episode-selector').style.display = 'none'; // Hide episode selector
  toggleSearchBehavior(true); // Switch to show search
});

// Set up the show search functionality
function setupShowSearch() {
  const searchBox = document.getElementById('searchBox');
  searchBox.placeholder = 'Search shows...'; // Adjust placeholder for show search

  searchBox.addEventListener('input', () => {
    const searchTerm = searchBox.value.toLowerCase();

    const filteredShows = cache.shows.filter((show) => {
      const nameMatch = show.name.toLowerCase().includes(searchTerm);
      const genreMatch = show.genres.some((genre) =>
        genre.toLowerCase().includes(searchTerm)
      );
      const summaryMatch = show.summary?.toLowerCase().includes(searchTerm);

      return nameMatch || genreMatch || summaryMatch;
    });

    populateShowsListing(filteredShows);
  });
}

// Initialize the page when the window loads
window.onload = setup;