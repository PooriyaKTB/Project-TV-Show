//You can edit ALL of the code here
function setup() {
  const allEpisodes = getAllEpisodes();
  makePageForEpisodes(allEpisodes);
}

function makePageForEpisodes(episodeList) {
  const show = document.getElementById("show-card");
  show.innerHTML = "";
  const episodeCards = episodeList.map(createEpisodeCard);
  show.append(...episodeCards)
}


const createEpisodeCard = (episode) => {
  const template = document.getElementById("episode-template");
  const card = template.content.cloneNode(true);

  card.querySelector(".episode-title").textContent = episode.name;
  card.querySelector(".episode-code").textContent = `S${String(episode.season).padStart(2,"0")}E${String(episode.number).padStart(2,"0")}`;
  card.querySelector(".episode-img").src = episode.image.medium ;
  card.querySelector(".episode-summary").innerHTML = episode.summary ;

  return card;
}


window.onload = setup;
