let elements = {
  exploreBth: null,
  navigator: null,
  list: null,
  name: null,
  card: null,
  spotPokemonButton: null,
  mapDiv: null,
  map: null,
  spottedPokemon: null,
  addToListBtn: null,
  favoriteList: null,
  homeFavoriteButton: null,
  homeMapButton:null,
  homeListHeader:null,
  markers: null,
  shareBtn: null,
};

let favorite = [];

var nextPokemonList = "https://pokeapi.co/api/v2/pokemon";

const capitalizeFirstLetter = (name) => {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const fetchPokemonList = async () => {
  try {
    const response = await fetch(nextPokemonList);

    if (response.ok) {
      const jsonResponse = await response.json();
      nextPokemonList = jsonResponse.next;
      return jsonResponse.results;
    } else {
      console.error("Failed to fetch pokemon", response.status);
    }
  } catch (e) {
    console.error(e);
  }
};

const fetchPokemon = async (url) => {
  try {
    const response = await fetch(url);

    if (response.ok) {
      return await response.json();
    } else {
      console.error("Failed to fetch pokemon", response.status);
    }
  } catch (e) {
    console.error(e);
  }
};

const onTapPokemon = (pokemon) => {
  elements.navigator.pushPage("details.html", {
    data: { name: pokemon.name, url: pokemon.url },
  });
};

const onSpotPokemon = (pokemon) => {
  elements.navigator.pushPage("spot.html", {
    data: { id: pokemon.id, name: pokemon.name },
  });
};

const generateListItem = (pokemon) => {
  const listItem = document.createElement("ons-list-item");
  listItem.setAttribute("modifier", "chevron");
  listItem.setAttribute("tappable", true);
  listItem.onclick = () => onTapPokemon(pokemon);
  listItem.innerHTML = capitalizeFirstLetter(pokemon.name);
  return listItem;
};

const updatePokemonName = (name) => {
  elements.name.innerHTML = capitalizeFirstLetter(name);
};

const getPokemonTitle = (pokemon) => {
  const name = capitalizeFirstLetter(pokemon.name);
  const index = pokemon.game_indices.at(0).game_index;
  return `${name} #${index}`;
};

const createPokemonCard = (pokemon) => {
  // Image
  const image = document.querySelector("#img");
  image.setAttribute("src", pokemon.sprites.front_default);
  image.setAttribute("style", "width: 60%");

  // Title
  const title = document.querySelector("#title");
  title.setAttribute("class", "title card__title");
  title.innerHTML = getPokemonTitle(pokemon);

  // Types list
  const typesList = document.querySelector("#types-list");
  const typesListHeader = document.createElement("ons-list-header");
  typesListHeader.innerHTML = "TYPES";
  typesList.appendChild(typesListHeader);
  pokemon.types.forEach((type) => {
    const typeListItem = document.createElement("ons-list-item");
    typeListItem.innerHTML = capitalizeFirstLetter(type.type.name);
    typesList.appendChild(typeListItem);
  });

  // Stats list
  const statsList = document.querySelector("#stats-list");
  const statsListHeader = document.createElement("ons-list-header");
  statsListHeader.innerHTML = "STATS";
  statsList.appendChild(statsListHeader);
  pokemon.stats.forEach((stat) => {
    const statListItem = document.createElement("ons-list-item");
    statListItem.innerHTML = `<span>${capitalizeFirstLetter(
      stat.stat.name
    )} <span class='notification'>${
      stat.effort
    }</span> <span class='notification notification--cta'>${
      stat.base_stat
    }</span></span>`;
    statsList.appendChild(statListItem);
  });
};

const removeLoadingIndicator = () => {
  elements.card.removeAttribute("class");
  elements.card.removeChild(document.querySelector("#loading-indicator"));
  document.querySelector("#actions").removeAttribute("class");
};

const getPokemonList = async () => {
  var pokemonList = await fetchPokemonList();
  if (pokemonList) {
    pokemonList.forEach((pokemon) => {
      elements.list.appendChild(generateListItem(pokemon));
    });
  }
};

// favorite.html======================================
const getFavoritePokemonList = async () => {
  console.log("in get favorite list, favorite length: ", favorite);
  if (favorite.length > 0) {
    favorite.forEach((pokemon) => {
      elements.favoriteList.appendChild(generateFavoriteListItem(pokemon));
    });
  }
};

const generateFavoriteListItem = (pokemon) => {
  console.log("in generate Favorite List Item: ", pokemon.data.name);
  const listItem = document.createElement("ons-list-item");
  listItem.setAttribute("modifier", "chevron");
  listItem.setAttribute("tappable", true);
  listItem.onclick = () => onTapFavoritePokemon(pokemon);
  listItem.innerHTML = capitalizeFirstLetter(pokemon.data.name);
  return listItem;
};

const onTapFavoritePokemon = (pokemon) => {
  elements.navigator.pushPage("details.html", {
    data: { name: pokemon.data.name, url: pokemon.url },
  });
};
//===================================================
//  Notification=====================================

navigator.serviceWorker.register('sw.js');

const askPermission = async() =>{
  // is web notifications available on the browser
  if(!"Notification" in window){
    console.error("Notification API is not available on this device!");
    return false;
  }

  // Did the user previously allow notifications
  if (Notification.permission === 'granted'){
    return true;
  }

  // if the user denied or hasn't been asked yet
  if(Notification.permission === 'denied' || Notification.permission === 'default'){
    try{
      // ask for permission
      const permission = await Notification.requestPermission();
      if(permission === 'granted'){
        return true;
      }
      return false;
    }catch(e){
      console.error("There was an issue acquiring Notification permission",e);
      return false;
    }
  }
  return false;
}


const servicerWorkerNotify = async (title) => {
  const registration = await navigator.serviceWorker.ready;
  if(registration) return registration.showNotification(title);
}

const notifyActions = async(title) =>{
  const permission = await askPermission();
  if(permission){
    const rslt = await servicerWorkerNotify(title);
    console.log("success!", rslt);
  }
}
//===================================================
// Persist & Save data======================================
const saveWithPersist = async(pokemonUrl, pokemon) =>{
  if (navigator.storage && navigator.storage.persist){
    const persistent = await navigator.storage.persist();
    if(persistent){
      console.log("Storage will not be cleared except by explicit user action");
    }
    else{
      console.log("Storage may be cleared by the browser under storage pressure");
    }
  }
  saveFavorite(pokemonUrl, pokemon);
};

const saveFavorite = async (pokemonUrl, pokemon) => {
  if (favorite.length > 0) {
    const found = favorite.find((pokemon) => pokemon.url === pokemonUrl);
    if (found) {
      console.log("Pokemon already added!");
      notifyActions(`Add Failed! ${pokemon.name} already added!`);
      return;
    }
  }

  favorite.push({ url: pokemonUrl, data: pokemon });
  console.log("saving favorite:", favorite);
  try {
    await localforage.setItem("favorite", favorite);
  } catch (e) {
    return console.log("error", e);
  }
  console.log("success");
};

const loadFavorite = async () => {
  console.log("In loading state");
  favorite = [];
  try {
    const favoriteList = await localforage.getItem("favorite");
    if (favoriteList && Object.keys(favoriteList).length !== 0) {
      favorite = [...favoriteList];
      // set the values of the controls on the page to match state
    }

    console.log("in loading favorite: ", favorite);
    console.log("success");
  } catch (e) {
    console.log("error loading state", e);
  }
};
//===================================================
const initMap = () => {
  const map = L.map("map").setView({ lon: 0, lat: 0 }, 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);

  L.control.scale({ imperial: false, metric: true }).addTo(map);

  map.on("click", onMapClick);
  map.on("popupopen", (e) => {
    var marker = e.popup._source;
    elements.shareBtn = document.querySelector("#shareBtn");
    elements.shareBtn.onclick = () => sharePokemonLocation(marker);
  });

  return map;
};

const sharePokemonLocation = (marker) => {
  if (navigator.share) {
    navigator
      .share({
        title: `${elements.spottedPokemon.name} spotted!`,
        text: `Latitude: ${marker._latlng.lat}. Longitude: ${marker._latlng.lng}`,
      })
      .then(() => console.log("Successful share"))
      .catch((error) => console.log("Error sharing", error));
  }
};

const onMapClick = (event) => {
  addMarkerToMap(event.latlng, elements.spottedPokemon.name);
  saveMarkers();
};

const addMarkerToMap = (latlng, text) => {
  var marker = L.marker(latlng)
    .addTo(elements.map)
    .bindPopup(
      `<b class="popup-text">${text}</b><br/><b class="popup-text">Spotted Here!</b><br/><ons-fab id="shareBtn"><ons-icon icon="md-share"></ons-icon></ons-fab>`
    );
  elements.markers.push({ marker: marker, text: text });
};

document.addEventListener("init", async (event) => {
  var page = event.target;

  if (event.target.id === "login") {
    elements = {
      navigator: document.querySelector("#navigator"),
      exploreBth: document.querySelector("#exploreBtn"),
    };
    elements.exploreBth.onclick = function () {
      if (document.querySelector("#username").value === "") {
        var username = "Anonymous";
      } else {
        var username = document.querySelector("#username").value;
      }
      console.log("username: " + username);
      elements.navigator.pushPage("list.html", {data:{username:username}});
      loadFavorite();
    };
  }

  if (event.target.id === "home") {
    page.onInfiniteScroll = function (done) {
      getPokemonList().then(() => {
        done();
      });
    };

    elements = {
      navigator: document.querySelector("#navigator"),
      list: document.querySelector("#list"),
      homeFavoriteButton: document.querySelector("#home-favoriteBtn"),
      homeMapButton:document.querySelector("#home-mapBtn"),
      homeListHeader: document.querySelector("#home-list-header"),
    };
    getPokemonList();
    elements.homeListHeader.innerHTML = "Welcome! " + event.target.data.username;
    elements.homeFavoriteButton.onclick = () => {
      elements.navigator.pushPage("favorite.html");
    };
    elements.homeMapButton.onclick = () => {
      elements.navigator.pushPage("spot.html");
    };
  }

  if (event.target.id === "favorite") {
    elements.favoriteList = document.querySelector("#favorite-list");
    getFavoritePokemonList();
  }

  if (event.target.id === "details") {
    elements = {
      ...elements,
      name: document.querySelector("#name"),
      card: document.querySelector("#card"),
      spotPokemonButton: document.querySelector("#spot-pokemon"),
      addToFavoriteButton: document.querySelector("#add-to-favorite"),
    };

    updatePokemonName(event.target.data.name);
    var pokemonUrl = event.target.data.url;
    var pokemon = await fetchPokemon(event.target.data.url);
    if (pokemon) {
      createPokemonCard(pokemon);
      removeLoadingIndicator();
    }

    elements.spotPokemonButton.onclick = () => onSpotPokemon(pokemon);
    elements.addToFavoriteButton.onclick = () =>
      saveWithPersist(pokemonUrl, pokemon);
  }

  if (event.target.id === "spot") {
    elements = {
      ...elements,
      name: document.querySelector("#name"),
      mapDiv: document.querySelector("#map"),
      map: initMap(),
      spottedPokemon: {
        id: event.target.data.id,
        name: capitalizeFirstLetter(event.target.data.name),
      },
      markers: [],
    };

    loadMarkers();
    updatePokemonName(event.target.data.name);
  }
});

const popPage = () => elements.navigator.popPage();

// Pad the history with an extra page
window.addEventListener("load", () => window.history.pushState({}, ""));
// When the back button is pressed, if there are more pages in our navigator we will popPage(), else we will exist our app
window.addEventListener("popstate", () => {
  const pages = elements.navigator.pages;
  if (pages && pages.length > 1) {
    popPage();
    window.history.pushState({}, "");
  } else {
    window.history.back();
  }
});

const saveMarkers = () => {
  var markersArray = elements.markers.map((marker) => {
    return {
      latlng: marker.marker._latlng,
      text: marker.text,
    };
  });
  localStorage.setItem("pokemon-markers", JSON.stringify(markersArray));
};

const loadMarkers = () => {
  const markers = JSON.parse(localStorage.getItem("pokemon-markers"));
  if (markers) {
    markers.forEach((marker) => {
      addMarkerToMap(marker.latlng, marker.text);
    });
  }
};
