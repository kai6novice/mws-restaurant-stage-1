/**
 * Common database helper functions.
 **/

class DBHelper {
  static get dbName() {
    return 'restaurant-db';
  }
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    //const port = 8000 // Change this to your server port
    //const port = location.port; //fix: now the port is dynamic
    const port = 1337; //update to use local data server
    const path = '/restaurants';
    //return `http://localhost:${port}/data/restaurants.json`;
    return `http://localhost:${port}${path}`;
  }
  static INDIVIDUAL_RESTAURANT_DATABASE_URL(id) {
    //const port = 8000 // Change this to your server port
    //const port = location.port; //fix: now the port is dynamic
    const port = 1337; //update to use local data server
    const path = '/restaurants';
    //return `http://localhost:${port}/data/restaurants.json`;
    return `http://localhost:${port}${path}/${id}`;
  }
  static RESTAURANT_REVIEW_URL(id) {
    const port = 1337;
    const path = '/reviews';
    return `http://localhost:${port}${path}/?restaurant_id=${id}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.DATABASE_URL).then(response => {
      if (response.ok) {
        console.log('got restaurant response using URL: ' + DBHelper.DATABASE_URL);
        //console.log(response);
        return response.json();
      } else {
        const error = (`Request failed. Returned status of ${response.status}`);
        console.log('trying to fetch restaurant from indexed DB because response is NOT ok.');
        return DBHelper.promiseToFetchRestaurantsFromIndexedDB();
        //callback(error, null);
      }
    }).then(respJson => {
      if (respJson) {
        DBHelper.fileRestaurantIntoIndexedDB(respJson);
        console.log('got response json');
        console.log(respJson);
        callback(null, respJson);
      } else {
        callback('respJson is null', null);
      }
    }).catch(err => {
      //this is when we can't fetch the data from the backend server
      //try to find restaurants in indexedDB
      console.log('trying to fetch restaurant from indexedDB because response json failed??');
      callback('Failed to fetch restaurants from anywhere.', null);
      //callback(err, null);
    });
  }
  static promiseToFetchARestaurantFromIndexedDB(id) {
    console.log('in promiseToFetchARestaurantFromIndexedDB, trying to get restaurant with id: ' + id);
    if (!('indexedDB' in window)) {
      callback('This browser does\'t support IndexedDB', null);
    } else {
      if (idb) {
        console.log('idb is defined');
      } else {
        console.log('idb is undefined');
      }
      let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
      let promiseToGetARestaurant = promiseToOpenIDB.then(restaurantDB => {
        //got IDB
        console.log('got idb, and proceed to get restaurant object store...');
        if (!restaurantDB.objectStoreNames.console('restaurant')) {
          callback('The restaurant object store is not found in indexedDB.', null);
        } else {
          let tx = restaurantDB.transaction('restaurant', 'readonly');
          let restaurantObjStore = tx.objectStore('restaurant');
          return restaurantObjStore.get(id);
        }
      }).catch(err => {
        //fail to get IDB
        console.log('Failed to open IDB in promiseToFetchARestaurantFromIndexedDB');
        return null;
      });
      return promiseToGetARestaurant;
    }
  }
  /**
   * Try to fetch restaurants from indexedDB
   * @param {*} callback
   */
  static promiseToFetchRestaurantsFromIndexedDB() {
    if (!('indexedDB' in window)) {
      callback('This browser does\'t support IndexedDB', null);
    } else {
      if (idb) {
        console.log('idb is defined');
      } else {
        console.log('idb is undefined');
      }
      let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
      let promiseToGetAllRestaurants = promiseToOpenIDB.then(restaurantDB => {
        //got IDB
        console.log('got idb, and proceed to get restaurant object store...');
        if (!restaurantDB.objectStoreNames.console('restaurant')) {
          callback('The restaurant object store is not found in indexedDB.', null);
        } else {
          let tx = restaurantDB.transaction('restaurant', 'readonly');
          let restaurantObjStore = tx.objectStore('restaurant');
          return restaurantObjStore.getAll();
        }
      }).catch(err => {
        //fail to get IDB
        console.log('Failed to open IDB in promiseToFetchRestaurantsFromIndexedDB');
        return null;
      });
      promiseToGetAllRestaurants.then(restaurants => {
        //successfully retrieve all restaurants
        return restaurants;
      }).catch(err => {
        //failed to retrieve all restaurants
        console.log('Failed to get all restaurants from IDB in promiseToFetchRestaurantsFromIndexedDB');
        return null;
      });
    }
  }
  /**
   * File restaurant json data into indexedDB
   * @param {*} restaurantsJSON
   */
  static fileRestaurantIntoIndexedDB(restaurantsJSON) {
    console.log('restaurantsJSON received in fileRestaurantIntoIndexedDB');
    console.log(restaurantsJSON);
    if (!('indexedDB' in window)) {
      console.error('This browser does\'t support IndexedDB, abort filing restaurant into indexedDB.');
    } else {
      if (idb) {
        console.log('idb is defined');
      } else {
        console.log('idb is undefined');
      }
      let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
      let promiseToFileRestaurantToIDB = promiseToOpenIDB.then(restaurantDB => {
        console.log('in promiseToFileRestaurantToIDB');
        let tx = restaurantDB.transaction('restaurant', 'readwrite');
        let restaurantObjStore = tx.objectStore('restaurant');
        console.log('got object store');
        restaurantObjStore.clear();
        console.log('object store cleared');
        restaurantsJSON.forEach(restaurant => {
          console.log('try to file this restaurant');
          console.log(restaurant);
          restaurantObjStore.put(restaurant);
        });
        return tx.complete;
      }).catch(err => {
        //fail to get IDB
        console.error('There is a problem to retrieve indexedDB.');
      });
      promiseToFileRestaurantToIDB.then(() => {
        console.log('Successfully added all restaurants into indexedDB.');
      }).catch(err => {
        console.error('Failed to add all restaurants into indexedDB.');
      });
    }
  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    /*     DBHelper.fetchRestaurants((error, restaurants) => {
          if (error) {
            callback(error, null);
          } else {
            const restaurant = restaurants.find(r => r.id == id);
            if (restaurant) { // Got the restaurant
              callback(null, restaurant);
            } else { // Restaurant does not exist in the database
              callback('Restaurant does not exist', null);
            }
          }
        }); */
    console.log('try to fetch restaurant by id: ' + id);
    console.log('URL: ' + DBHelper.INDIVIDUAL_RESTAURANT_DATABASE_URL(id));
    let promiseToFetchRestaurant = fetch(DBHelper.INDIVIDUAL_RESTAURANT_DATABASE_URL(id)).then(response => {
      if (response.ok) {
        console.log('got restaurant response using URL: ' + DBHelper.INDIVIDUAL_RESTAURANT_DATABASE_URL(id));
        return response.json();
      } else {
        return DBHelper.promiseToFetchARestaurantFromIndexedDB(id);
      }
    }).catch(err => {
      console.log('problem fetching restaurant from backend or indexedeb.');
      return null;
    });
    promiseToFetchRestaurant.then(respJson => {
      if (respJson) {
        //DBHelper.fileRestaurantIntoIndexedDB(respJson);
        console.log('got response json');
        console.log(respJson);
        callback(null, respJson);
      } else {
        callback('respJson is null', null);
      }
    }).catch(err => {
      console.log('trying to fetch a restaurant from indexedDB because response json failed??');
      console.log(err);
      callback('Failed to fetch a restaurant from anywhere.', null);
      //callback(err, null);
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant) {
      console.log('getting image url for restaurant: ' + restaurant.id);
      console.log('the restaurant\'s image file name is: ' + restaurant.photograph + '.jpg');
      return (`/img/${restaurant.photograph}.jpg`);
    } else {
      console.log('someone request image url from undefined restaurant');
      return '';
    }
  }

  /**
   * Return responsive image setting
   */
  static responsiveImageForRestaurant(restaurant) {
    console.log('trying to get responsive image for restaurant: ' + restaurant.id);
    const restaurantPhotoURL = restaurant.photograph;
    let returnImage = '';
    if (restaurantPhotoURL) {
      const fileName = restaurantPhotoURL.substring(0, restaurantPhotoURL.lastIndexOf('.'));
      //const fileExtension = restaurantPhotoURL.substring(restaurantPhotoURL.lastIndexOf('.'));
      const fileExtension = ".jpg";
      if (fileName && fileName.length > 0 && fileExtension && fileExtension.length > 0) {
        returnImage = "/img/" + fileName + "-low" + fileExtension + " " + "400w" + ", " + "/img/" + fileName + "-mid" + fileExtension + " " + "600w" + ", " + "/img/" + fileName + fileExtension + " " + "800w";
      }
      //console.log('responsiveImageURL:'+returnImage);
    }
    return returnImage;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      })
    marker.addTo(map);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
  static promiseToFetchRestaurantReviews(restaurantID) {
    const restaurantReviewURL = DBHelper.RESTAURANT_REVIEW_URL(restaurantID);
    let promiseToFetchRestaurantReviewsFromURL = fetch(restaurantReviewURL).then(response => {
      if (response.ok) {
        console.log('got restaurant reviews response using URL: ' + restaurantReviewURL);
        return response.json();
      } else {
        const error = (`Request failed. Returned status of ${response.status}`);
        console.log('trying to fetch restaurant reviews from indexed DB because response is NOT ok.');
        reject(new Error('response is not ok'));
      }
    }).catch(err => {
      console.log(err);
      return null;
    });
    let promiseToFileRestaurantReviewsIntoIndexedDBForRestaurant = promiseToFetchRestaurantReviewsFromURL.then(respJson => {
      if (respJson) {
        DBHelper.promiseToFileRestaurantReviewsIntoIndexedDBForRestaurant(respJson, restaurantID);
        return respJson;
      } else {
        return null;
      }
    }).catch(err => {
      console.log('Fail to fetch restaurant reviews from URL');
      console.log(err);
      DBHelper.promiseToFetchRestaurantReviewsFromIndexedDB(restaurantID);
      return null;
    });
    return promiseToFileRestaurantReviewsIntoIndexedDBForRestaurant;
  }
  static promiseToFetchRestaurantReviewsFromIndexedDB(restaurantID) {
    console.log('running promiseToFetchRestaurantReviewsFromIndexedDB');
    console.log('restaurantID: ' + restaurantID);
    if (!('indexedDB' in window)) {
      callback('This browser does\'t support IndexedDB', null);
    } else {
      if (idb) {
        console.log('idb is defined');
      } else {
        console.log('idb is undefined');
      }
      let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
      let promiseToGetAllRestaurantReviews = promiseToOpenIDB.then(restaurantDB => {
        //got IDB
        console.log('got idb, and proceed to get restaurant object store...');
        if (!restaurantDB.objectStoreNames.console('restaurantReview')) {
          return null;
        } else {
          let tx = restaurantDB.transaction('restaurantReview', 'readonly');
          let restaurantReviewObjStore = tx.objectStore('restaurantReview');
          let restaurantReviewRestaurantIDIndex = restaurantReviewObjStore.index('restaurantIDIndex');

          return restaurantReviewRestaurantIDIndex.getAll(IDBKeyRange.only(restaurantID));
        }
      }).catch(err => {
        //fail to get IDB
        console.log('Failed to open IDB in promiseToFetchRestaurantReviewsFromIndexedDB');
        return null;
      });
      promiseToGetAllRestaurantReviews.then(restaurantReviews => {
        //successfully retrieve all restaurants
        return restaurantReviews;
      }).catch(err => {
        //failed to retrieve all restaurants
        console.log('Failed to get all restaurant reviews from IDB in promiseToFetchRestaurantReviewsFromIndexedDB');
        return null;
      });
    }
  }
  static promiseToFileRestaurantReviewsIntoIndexedDBForRestaurant(restaurantReviewsJSON, restaurantID) {
    console.log('restaurantReviewsJSON in fileRestaurantReviewsIntoIndexedDBForRestaurant');
    console.log(restaurantReviewsJSON);
    console.log(restaurantID);
    if (!('indexedDB' in window)) {
      console.error('This browser does\'t support IndexedDB, abort filing restaurant reviews into indexedDB.');
      return new Promise.reject('browser does not support indexeddb');
    }
    if (!idb) {
      console.log('idb is undefined');
      return new Promise.reject('idb is undefined for some reason?');
    }
    console.log('idb is defined');
    let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
    let promiseToFileRestaurantReviewsToIDB = promiseToOpenIDB.then(restaurantDB => {
      console.log('in promiseToFileRestaurantReviewsToIDB');
      let tx = restaurantDB.transaction('restaurantReview', 'readwrite');
      let restaurantReviewObjStore = tx.objectStore('restaurantReview');
      console.log('got restaurant review object store');
      //remove all reviews belong to this restaurant
      //TO-DO: fix this!!!
      /* let promiseToDeleteAllReviewForRestaurant = DBHelper.promiseToDeleteAllReviewForRestaurant(restaurantReviewObjStore, restaurantID);
      promiseToDeleteAllReviewForRestaurant.then(() => {
        restaurantReviewsJSON.forEach(restaurantReview => {
          console.log('try to file this restaurant');
          console.log(restaurantReview);
          restaurantReviewObjStore.put(restaurantReview);
        });
        return tx.complete;
      }).catch(err => {
        console.log('failed to delete all exisiting reviews for restaurant');
        console.log(err);
        console.log('continue to file to the indexeddb anyway');
        restaurantReviewsJSON.forEach(restaurantReview => {
          console.log('try to file this restaurant');
          console.log(restaurantReview);
          restaurantReviewObjStore.put(restaurantReview);
        });
        return tx.complete;
      }); */
      restaurantReviewsJSON.forEach(restaurantReview => {
        console.log('try to file this restaurant');
        console.log(restaurantReview);
        restaurantReviewObjStore.put(restaurantReview);
      });
      return tx.complete;
    }).catch(err => {
      //fail to get IDB
      console.log(err);
      console.error('There is a problem to retrieve indexedDB.');
      reject('');
    });
    return promiseToFileRestaurantReviewsToIDB;
  }
  static promiseToDeleteAllReviewForRestaurant(restaurantReviewObjStore, restaurantID) {
    console.log('in deleteAllReviewForRestaurant');
    console.log(restaurantID);
    //let tx = restaurantDB.transaction('restaurantReview', 'readwrite');
    //let restaurantReviewObjStore = tx.objectStore('restaurantReview');
    console.log('got restaurant review object store');
    let restaurantIDIndex = restaurantReviewObjStore.index('restaurantIDIndex');
    let promiseToGetAllReviewForRestaurantCount = restaurantIDIndex.count(IDBKeyRange.only(restaurantID));
    let promiseToDeleteAllReviewForRestaurant = promiseToGetAllReviewForRestaurantCount.then(totalReviewForRestaurant => {
      if (totalReviewForRestaurant > 0) {
        let promiseToGetAllReviewForRestaurant = restaurantIDIndex.openCursor(IDBKeyRange.only(restaurantID));
        let promiseToDeleteEachReviewForRestaurant = promiseToGetAllReviewForRestaurant.then(function deleteRestaurantReviewAt(cursor) {
          if(!cursor){
            return;
          }
          if (cursor) {
            console.log('trying to delete cursor');
            console.log(cursor);
            //console.log('delete cursor id:'+cursor.key);
            cursor.delete();
            cursor.continue().then(deleteRestaurantReviewAt);
          }
        }).catch(err => {
          console.log('problem getting all reviews for restaurant.');
          console.log(err);
          reject('');
        });
        return promiseToDeleteEachReviewForRestaurant;
      } else {
        console.log('there is no review for the restaurant.');
        return new Promise.resolve('');
      }
    }).catch(err => {
      console.log('problem getting total count of review for the restaurant.');
      console.log(err);
      return new Promise.reject('');
    });
    return promiseToDeleteAllReviewForRestaurant;
  }
  static promiseToOpenRestaurantIDB(idb) {
    return idb.open(DBHelper.dbName, 1, restaurantDB => {
      //restaurantDB.oldVersion
      console.log('try to open idb');
      if (!restaurantDB.objectStoreNames.contains('restaurant')) {
        console.log('restaurant object store is not found in opened idb');
        let restaurantObjStore = restaurantDB.createObjectStore('restaurant', { keyPath: 'id' });
        restaurantObjStore.createIndex('cuisineIndex', 'cuisine_type');
        restaurantObjStore.createIndex('neighborhoodIndex', 'neighborhood');
      }
      if (!restaurantDB.objectStoreNames.contains('restaurantReview')) {
        let restaurantReviewObjStore = restaurantDB.createObjectStore('restaurantReview', { keyPath: 'id' });
        restaurantReviewObjStore.createIndex('restaurantIDIndex', 'restaurant_id');
        restaurantReviewObjStore.createIndex('restaurantSyncIndex', 'sync');
      }
    });
  }
}

