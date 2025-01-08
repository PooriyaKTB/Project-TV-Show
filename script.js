// Store all episodes globally so we can filter them
let allEpisodes = [];

// Cache for storing fetched shows and episodes
const cache = {
  shows: null,
  episodes: {},
};

// Main setup function to initialize the page
function setup() {
  displayLoadingMessage();

  // Fetch shows and populate the show selector
  fetchShows()
    .then((shows) => {
      populateShowSelector(shows);
      cache.shows = shows; // Cache the shows
    })
    .catch((error) => {
      displayErrorMessage(`Failed to load shows. Please try again later.`);
      console.error('Error fetching shows:', error);
    });
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

// Populate the show selector dropdown
function populateShowSelector(shows) {
  const showSelector = document.getElementById('show-selector');

  // Add an option for each show
  shows.forEach((show) => {
    const option = document.createElement('option');
    option.value = show.id;
    option.textContent = show.name;
    showSelector.appendChild(option);
  });

  // Add event listener for when a show is selected
  showSelector.addEventListener('change', handleShowSelect);
}

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
  show.innerHTML = '<p>Loading episodes... Please wait.</p>';
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

// Initialize the page when the window loads
window.onload = setup;
