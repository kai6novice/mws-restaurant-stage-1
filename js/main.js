let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
});

/**
 * Register Service Worker and allow it to cache file
 */
registerServiceWorker = () => {
  console.log('start register service worker');
  if (navigator.serviceWorker) {
    console.log('found navigator.serviceWorker');
    let promiseToRegisterServiceWorker = navigator.serviceWorker.register('/serviceWorker.js', {
      scope: '/'
    });
    console.log('registered the service worker');
    promiseToRegisterServiceWorker.then(serviceWorkerRegistration => {
      console.log('got service worker registration');
      if (!navigator.serviceWorker.controller) {
        console.log('cannot find service worker controller');
        return;
      }
      //call serviceWorkerRegistration.update() to force update
      if (serviceWorkerRegistration.installing) {
        let serviceWorker = serviceWorkerRegistration.installing;
        //serviceWorker.state;
        //  return "installing";
        //  return "installed"
        console.log('service worker is installing');
        serviceWorker.addEventListener('statechange', () => {
          if (serviceWorker.state === 'installed') {
            //to auto activate the new worker
            //worker.postMessage({action: 'skipWaiting'});
            //or somehow trigger service worker's (sw.js) self.skipWaiting() function
            console.log('listening to installed state');
          }
        });
      }
      if (serviceWorkerRegistration.waiting) {
        let serviceWorker = serviceWorkerRegistration.waiting;
        //serviceWorker.state;
        console.log('service worker is waiting');
      }
      if (serviceWorkerRegistration.active) {
        let serviceWorker = serviceWorkerRegistration.active;
        //serviceWorker.state;
        //  return "activating"
        //  return "activated"
        console.log('service worker is active');
      }
      serviceWorkerRegistration.addEventListener('updatefound', () => {
        console.log('listening to update found');
        let serviceWorker = serviceWorkerRegistration.installing;
        serviceWorker.addEventListener('statechange', () => {
          if (serviceWorker.state === 'installed') {
            console.log('listening to state change and got installed');
          }
        });
      });
    }).catch(err => {
      console.log('Failed to register serviceWorker.js');
      console.log(err);
    });
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      console.log('listening to controllerchange');
      // This fires when the service worker controlling this page
     // changes, eg a new worker has skipped waiting and become
     // the new active worker.
   });
  }
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute('aria-label', neighborhood);
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute('aria-label', cuisine);
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1Ijoia2FpNm5vdmljZSIsImEiOiJjamljZjJ0ZHcwMGJ5M3Ztb3VtN21hMTBxIn0.BB9H4GaNAfxeOlzJn8FuHg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery � <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const srcsetValue = DBHelper.responsiveImageForRestaurant(restaurant);
  if (srcsetValue.length > 0) {
    image.setAttribute('srcset', srcsetValue);
    //image.setAttribute('sizes','350w 50vw');
  }
  image.alt = restaurant.name + '\'s thumbnail';
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', 'View Details for ' + restaurant.name + 'restaurant.')
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
}
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

