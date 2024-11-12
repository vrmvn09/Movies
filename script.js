const API_KEY = '7045741a000ae137ad8ebd7bca2a4847';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const searchBar = document.getElementById('search-bar');
const filterOptions = document.getElementById('filter-options');
const movieList = document.getElementById('movie-list');
const movieModal = document.getElementById('movie-modal');
const movieDetails = document.getElementById('movie-details');
const closeButton = document.querySelector('.close-button');
const viewWatchlistButton = document.getElementById('view-watchlist');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let currentPage = 1;
const maxPages = 500;
let isViewingWatchlist = false;

searchBar.addEventListener('input', handleSearch);
filterOptions.addEventListener('change', () => {
  fetchMoviesByFilter(filterOptions.value, 1);
  isViewingWatchlist = false;
  viewWatchlistButton.innerText = 'View Watchlist';
  filterOptions.style.display = 'inline-block'; 
});
closeButton.addEventListener('click', () => movieModal.classList.add('hidden'));
viewWatchlistButton.addEventListener('click', () => {
  if (isViewingWatchlist) {
    
    isViewingWatchlist = false;
    viewWatchlistButton.innerText = 'View Watchlist';
    filterOptions.style.display = 'inline-block'; 
    searchBar.value = ''; 
    fetchMoviesByFilter(filterOptions.value, 1); 
  } else {
    
    displayWatchlist();
    isViewingWatchlist = true;
    viewWatchlistButton.innerText = 'Back to Home';
    filterOptions.style.display = 'none'; 
  }
});
prevPageButton.addEventListener('click', () => changePage(-1));
nextPageButton.addEventListener('click', () => changePage(1));


window.addEventListener('load', () => fetchMoviesByFilter('popular', 1));

async function handleSearch() {
  const query = searchBar.value.toLowerCase().trim();

  if (isViewingWatchlist) {
    
    const filteredMovies = await Promise.all(watchlist.map(fetchMovieDetails));
    const searchResults = filteredMovies.filter(movie => movie.title.toLowerCase().includes(query));
    displayMovies(searchResults);
    prevPageButton.style.display = 'none';
    nextPageButton.style.display = 'none';
  } else {
    
    if (query.length > 2) {
      const movies = await fetchMovies(query, 1); 
      displayMovies(movies.results);
      
      
      prevPageButton.style.display = movies.total_pages > 1 ? 'inline-block' : 'none';
      nextPageButton.style.display = movies.total_pages > 1 ? 'inline-block' : 'none';

      currentPage = 1; 
    }
  }
}

async function fetchMovies(query, page = 1) {
  const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}&page=${page}`);
  const data = await response.json();
  return data; 
}

async function fetchMoviesByFilter(filter, page = 1) {
  const response = await fetch(`${BASE_URL}/movie/${filter}?api_key=${API_KEY}&page=${page}`);
  const data = await response.json();
  
  displayMovies(data.results);

  currentPage = page;

  
  prevPageButton.style.display = data.total_pages > 1 ? 'inline-block' : 'none';
  nextPageButton.style.display = data.total_pages > 1 ? 'inline-block' : 'none';

  
  prevPageButton.disabled = currentPage === 1;
  nextPageButton.disabled = currentPage >= data.total_pages;
}

function displayMovies(movies) {
  movieList.innerHTML = '';
  movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');
    movieCard.innerHTML = `
      <div class="movie-rating">${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</div>
      <img class="movie-poster" src="${IMAGE_BASE_URL + movie.poster_path}" alt="${movie.title}">
      <div class="movie-title">${movie.title}</div>
      <div class="movie-release-date">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</div>
    `;
    movieCard.addEventListener('click', () => openMovieDetails(movie.id));
    movieList.appendChild(movieCard);
  });
}

async function openMovieDetails(movieId) {
  const movie = await fetchMovieDetails(movieId);
  const cast = await fetchCast(movieId);
  const inWatchlist = watchlist.includes(movieId);

  movieDetails.innerHTML = `
    <div class="movie-header">
      <img class="movie-poster-large" src="${IMAGE_BASE_URL + movie.poster_path}" alt="${movie.title}">
      <div class="movie-info">
        <h2>${movie.title}</h2>
        <p>${movie.overview || "No description available."}</p>
        <div class="movie-details">
          <p><strong>Rating:</strong> ${movie.vote_average}/10</p>
          <p><strong>Runtime:</strong> ${movie.runtime} mins</p>
          <p><strong>Release Date:</strong> ${movie.release_date}</p>
        </div>
        <button class="watchlist-button" onclick="${inWatchlist ? `removeFromWatchlist(${movie.id})` : `addToWatchlist(${movie.id})`}">
          ${inWatchlist ? "Remove from Watchlist" : "+ Add to Watchlist"}
        </button>
      </div>
    </div>
    <h3>Cast:</h3>
    <div class="cast-list">
      ${cast.map(actor => `
        <div class="cast-member">
          <img class="actor-photo" src="${actor.profile_path ? IMAGE_BASE_URL + actor.profile_path : 'placeholder.jpg'}" alt="${actor.name}">
          <span>${actor.name}</span>
        </div>
      `).join('')}
    </div>
  `;
  movieModal.classList.remove('hidden');
}

async function fetchMovieDetails(movieId) {
  const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
  const data = await response.json();
  return data;
}

async function fetchCast(movieId) {
  const response = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`);
  const data = await response.json();
  return data.cast.slice(0, 10);
}

function addToWatchlist(movieId) {
  if (!watchlist.includes(movieId)) {
    watchlist.push(movieId);
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    alert('Movie added to watchlist');
  } else {
    alert('Movie is already in watchlist');
  }
}

function removeFromWatchlist(movieId) {
  watchlist = watchlist.filter(id => id !== movieId);
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
  alert('Movie removed from watchlist');
  movieModal.classList.add('hidden');
  if (isViewingWatchlist) {
    displayWatchlist();
  }
}

function changePage(direction) {
  if (isViewingWatchlist) return; 

  currentPage += direction;
  
  if (searchBar.value.trim().length > 2) {
    
    fetchMovies(searchBar.value.trim(), currentPage).then(movies => {
      displayMovies(movies.results);
      prevPageButton.disabled = currentPage === 1;
      nextPageButton.disabled = currentPage >= movies.total_pages;
    });
  } else {
    
    fetchMoviesByFilter(filterOptions.value, currentPage);
  }
}

async function displayWatchlist() {
  movieList.innerHTML = ''; 
  isViewingWatchlist = true;

  if (watchlist.length === 0) {
    movieList.innerHTML = '<p>Your watchlist is empty.</p>';
    prevPageButton.style.display = 'none';
    nextPageButton.style.display = 'none';
    return;
  }

  const watchlistMovies = watchlist.slice(0, 20);
  for (const movieId of watchlistMovies) {
    const movie = await fetchMovieDetails(movieId);
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');
    movieCard.innerHTML = `
      <div class="movie-rating">${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</div>
      <img class="movie-poster" src="${IMAGE_BASE_URL + movie.poster_path}" alt="${movie.title}">
      <div class="movie-title">${movie.title}</div>
      <div class="movie-release-date">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</div>
    `;
    movieCard.addEventListener('click', () => openMovieDetails(movie.id));
    movieList.appendChild(movieCard);
  }

  prevPageButton.style.display = watchlist.length > 20 ? 'inline-block' : 'none';
  nextPageButton.style.display = watchlist.length > 20 ? 'inline-block' : 'none';
}
