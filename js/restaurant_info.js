let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
  ServiceWorkerHelper.registerServiceWorker();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    self.restaurant = restaurant;
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoia2FpNm5vdmljZSIsImEiOiJjamljZjJ0ZHcwMGJ5M3Ztb3VtN21hMTBxIn0.BB9H4GaNAfxeOlzJn8FuHg',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery � <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(self.newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      console.log('got a restaurant from');
      console.log(restaurant);
      self.restaurant = restaurant;
      if (!restaurant) {
        console.log('failed to fetch restaurant by id: ' + id);
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const srcsetValue = DBHelper.responsiveImageForRestaurant(restaurant);
  if (srcsetValue.length > 0) {
    console.log('set responsive image into srcset');
    image.setAttribute('srcset', srcsetValue);
    //image.setAttribute('sizes','350w 50vw');
  }
  image.setAttribute('alt', restaurant.name + '\'s image');
  const favImage = document.querySelector('img.favImage');
  favImage.alt = 'toggle ' + restaurant.name + ' as favorite';
  if (restaurant.is_favorite == "true") {
    favImage.classList.add('isFavorite');
  } else {
    favImage.classList.add('notFavorite');
  }
  const restaurantID = restaurant.id;
  favImage.onclick = (function () {
    let toggleRestaurantAsFavoriteFunc = function () {
      if (this.classList.contains("isFavorite")) {
        //alert('registering restaurant: '+restaurantID+' as not favorite');
        this.classList.replace("isFavorite", "notFavorite");
        DBHelper.markRestaurantAsFavorite(restaurantID, false);
      } else {
        //alert('registering restaurant: '+restaurantID+' as favorite');
        this.classList.replace("notFavorite", "isFavorite");
        DBHelper.markRestaurantAsFavorite(restaurantID, true);
      }
    };
    return toggleRestaurantAsFavoriteFunc;
  })();
  const cuisine = document.getElementById('restaurant-cuisine');
  console.log('set cuisine into innerHTML');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    console.log('set operating_hours');
    fillRestaurantHoursHTML();
  }
  // fill reviews
  console.log('set review');
  DBHelper.fetchRestaurantReviews(restaurantID, (error, restaurantReviews) => {
    if (error) {
      console.error(error);
      fillReviewsHTML();
    } else {
      fillReviewsHTML(restaurantReviews);
    }
  });
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.className = 'review-user-name';
  li.appendChild(name);

  const date = document.createElement('p');
  //date.innerHTML = review.date;
  date.innerHTML = new Date(review.createdAt).toLocaleDateString() || '';
  date.className = 'review-date';
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review-rating';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'review-comment';
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

submitNewReview = () => {
  let form = document.getElementById("reviewForm");
  let name = form.elements.namedItem('name').value;
  let rating = form.elements.namedItem('rating').value;
  let comments = form.elements.namedItem('comments').value;
  let restaurantID = (new URL(document.location)).searchParams.get("id");
  //console.log(form);
  alert('submit new review for restaurant: ' + restaurantID);
  let promiseToAddNewReview = DBHelper.promiseToAddNewReview(restaurantID, name, rating, comments);
  let promiseToRefreshReviewHTML = promiseToAddNewReview.then(() => {
    alert('clearing review html');
    clearReviewHTML();
    alert('cleared review html');
    DBHelper.fetchRestaurantReviews(restaurantID, (error, restaurantReviews) => {
      if (error) {
        console.error(error);
        fillReviewsHTML();
      } else {
        console.log('filling review html');
        fillReviewsHTML(restaurantReviews);
        console.log('filled review html');
      }
    });
    return "";
  }).catch(err => {
    console.log('problem adding new review');
    console.log(err);
    return Promise.resolve("");
  });
  promiseToRefreshReviewHTML.then(() => {
    console.log('resetting review form');
    document.getElementById("reviewForm").reset();
    console.log('reseted review form');
  }).catch(err => {
    console.log('problem refresh review html');
    console.log(err);
  });
};
clearNewReview = () => {
  //alert('clear new review');
};
clearReviewHTML = () => {
  const container = document.getElementById('reviews-container');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  const reviewList = document.createElement('ul');
  reviewList.id = "reviews-list";
  container.appendChild(reviewList);
};