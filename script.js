// Store all episodes globally so we can filter them
let allEpisodes = [];

// Main setup function to initialize the page
function setup() {
  // Load all episodes and store them globally
  allEpisodes = getAllEpisodes();

  // Set up the search box event listener
  setupSearchListener();

  // Populate the episode selector dropdown and set up its event listener
  setupEpisodeSelector();

  // Generate the initial page content with all episodes
  makePageForEpisodes(allEpisodes);

  // Update the displayed episode count
  updateEpisodeCount(allEpisodes.length, allEpisodes.length);
}

// Set up the search box to filter episodes based on user input
function setupSearchListener() {
  const searchBox = document.getElementById('searchBox');
  searchBox.addEventListener('input', handleSearch); // Call handleSearch on input
}

// Populate the episode selector dropdown and add an event listener
function setupEpisodeSelector() {
  const selector = document.getElementById('episode-selector');

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
