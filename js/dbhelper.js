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
  static get POST_REVIEW_URL() {
    const port = 1337; //update to use local data server
    const path = '/reviews';
    return `http://localhost:${port}${path}/`;
  }
  static RESTAURANT_AS_FAVORITE_URL(id, isFavorite) {
    const port = 1337;
    const path = '/restaurants';
    //http://localhost:1337/restaurants/<restaurant_id>/
    return `http://localhost:${port}${path}/${id}/?is_favorite=${isFavorite}`;
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let promiseToSyncPendingRecord = DBHelper.promiseToSyncPendingRecord();
    console.log(DBHelper.DATABASE_URL);
    let promiseToFetchRestaurantsFromURL = fetch(DBHelper.DATABASE_URL);
    let promiseToFetchRestaurant = promiseToFetchRestaurantsFromURL.then(response => {
      if (response.ok) {
        console.log('got restaurant response using URL: ' + DBHelper.DATABASE_URL);
        let promiseToTurnResponseToJson = response.json();
        promiseToTurnResponseToJson.then(respJson => {
          console.log('got response json');
          let respJsonClone = Object.assign({}, respJson);
          //TO-DO: continue here:
          DBHelper.refreshRestaurantsIDB(respJsonClone);
          console.log('finish refreshing restaurant idb');
          callback(null, respJson);
        }).catch(err => {
          console.log('Problem converting response to json');
          console.log(err);
          throw new Error('Problem converting response to json')
        });
      } else {
        console.log(`Fetched item from server, but there is a problem, status: ${response.status}`);
        throw new Error(response.statusText);
      }
    }).catch(err => {
      //fetch from URL failed
      console.log('fetch from URL failed');
      let promiseToFetchRestaurantsFromIndexedDB = DBHelper.promiseToFetchRestaurantsFromIndexedDB();
      promiseToFetchRestaurantsFromIndexedDB.then(restaurants => {
        callback(null, restaurants);
      }).catch(err => {
        callback('Failed to fetch restaurants from anywhere.', null);
      });
    });
  }
  static promiseToFetchARestaurantFromIndexedDB(id) {
    console.log('in promiseToFetchARestaurantFromIndexedDB, trying to get restaurant with id: ' + id);
    if (!('indexedDB' in window)) {
      console.log('indexedDB is undefined');
      return Promise.reject('');
    }
    if (!idb) {
      console.log('idb is undefined');
      return Promise.reject('');
    }
    let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
    let promiseToGetARestaurant = promiseToOpenIDB.then(restaurantDB => {
      //got IDB
      console.log('got idb, and proceed to get restaurant object store.....');
      if (!restaurantDB.objectStoreNames.contains('restaurant')) {
        console.log('restaurant db does not have a restaurant object store');
        throw new Error('restaurant DB does not have the restaurant object store');
      } else {
        console.log('restaurant db has restaurant object store');
        let tx = restaurantDB.transaction('restaurant', 'readonly');
        let restaurantObjStore = tx.objectStore('restaurant');
        console.log('key id: ' + id);
        console.log('type of id: ' + typeof id);
        return restaurantObjStore.get(parseInt(id));
      }
    }).catch(err => {
      //fail to get IDB
      console.log('Failed to open IDB in promiseToFetchARestaurantFromIndexedDB');
      return Promise.reject('');
    });
    return promiseToGetARestaurant;
  }
  /**
   * Try to fetch restaurants from indexedDB
   * @param {*} callback
   */
  static promiseToFetchRestaurantsFromIndexedDB() {
    console.log('in promiseToFetchRestaurantsFromIndexedDB');
    if (!('indexedDB' in window)) {
      return Promise.reject(null);
    }
    if (!idb) {
      console.log('idb is undefined');
      return Promise.reject(null);
    }
    let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
    let promiseToGetAllRestaurants = promiseToOpenIDB.then(restaurantDB => {
      //got IDB
      console.log('got idb, and proceed to get restaurant object store...');
      if (!restaurantDB.objectStoreNames.contains('restaurant')) {
        throw new Error('restaurant db does not contain restaurant object store');
      } else {
        let tx = restaurantDB.transaction('restaurant', 'readonly');
        let restaurantObjStore = tx.objectStore('restaurant');
        return restaurantObjStore.getAll();
      }
    }).catch(err => {
      //fail to get IDB
      console.log('Failed to open IDB in promiseToFetchRestaurantsFromIndexedDB');
      return Promise.reject(null);
    });
    return promiseToGetAllRestaurants;
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
      return;
    }
    if (!idb) {
      console.log('idb is undefined');
      return;
    }
    let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
    let promiseToFileRestaurantToIDB = promiseToOpenIDB.then(restaurantDB => {
      console.log('in promiseToFileRestaurantToIDB');
      let tx = restaurantDB.transaction('restaurant', 'readwrite');
      let restaurantObjStore = tx.objectStore('restaurant');
      console.log('got object store');
      //restaurantObjStore.clear();
      //console.log('object store cleared');
      if (restaurantsJSON && restaurantsJSON.length > 0) {
        restaurantsJSON.forEach(restaurant => {
          console.log('try to file this restaurant');
          console.log(restaurant);
          restaurantObjStore.put(restaurant);
        });
      }
      return tx.complete;
    }).catch(err => {
      //fail to get IDB
      console.error('There is a problem to retrieve indexedDB.');
      console.log(err);
    });
  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    let promiseToSyncPendingRecord = DBHelper.promiseToSyncPendingRecord();
    console.log('try to fetch restaurant by id: ' + id);
    console.log('URL: ' + DBHelper.INDIVIDUAL_RESTAURANT_DATABASE_URL(id));
    let promiseToFetchRestaurant = fetch(DBHelper.INDIVIDUAL_RESTAURANT_DATABASE_URL(id)).then(response => {
      if (response.ok) {
        console.log('got restaurant response using URL: ' + DBHelper.INDIVIDUAL_RESTAURANT_DATABASE_URL(id));
        let promiseToTurnResponseToJson = response.json();
        promiseToTurnResponseToJson.then(respJson => {
          let respJsonClone = Object.assign({}, respJson);
          //TO-DO: continue here:
          DBHelper.refreshRestaurantIDB(respJsonClone, id);
          callback(null, respJson);
        }).catch(err => {
          console.log('Problem converting response to json');
          console.log(err);
          throw new Error('Problem converting response to json')
        });
      } else {
        console.log(`Fetched item from server, but there is a problem, status: ${response.status}`);
        throw new Error(response.statusText);
      }
    }).catch(err => {
      console.log('problem fetching restaurant from backend.');
      DBHelper.promiseToFetchARestaurantFromIndexedDB(id).then(restaurant => {
        console.log('got back from promiseToFetchARestuarantFromIndexedDB');
        console.log(restaurant);
        callback(null, restaurant);
      }).catch(err => {
        callback(err, null);
      });
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
  static fetchRestaurantReviews(restaurantID, callback) {
    let promiseToSyncPendingRecord= DBHelper.promiseToSyncPendingRecord();
    console.log('done sync pending review');
    const restaurantReviewURL = DBHelper.RESTAURANT_REVIEW_URL(restaurantID);
    let promiseToFetchRestaurantReviewsFromURL = fetch(restaurantReviewURL);
    let promiseToFetchRestaurantReview = promiseToFetchRestaurantReviewsFromURL.then(response => {
      //TO-DO: read here.
      if (response.ok) {
        console.log('got restaurant reviews response using URL: ' + restaurantReviewURL);
        //file restaurant review into indexeddb
        let promiseToFetchRestaurantReviewJson = response.json();
        promiseToFetchRestaurantReviewJson.then(restaurantReviews => {
          //clear out all ther review for restaurant in indexeddb
          let restaurantReviewsClone = Object.assign({}, restaurantReviews);
          DBHelper.refreshARestaurantReviewsIDB(restaurantReviewsClone, restaurantID);
          callback(null, restaurantReviews);
        }).catch(err => {
          //problem converting restaurant review response to json
          console.log('problem converting restaurant review response to json.');
          console.log(err);
          DBHelper.fetchRestaurantReviewsFromIndexedDB(restaurantID, callback);
        });
      } else {
        console.log(`Fetched item from server, but there is a problem, status: ${response.status}`);
        throw new Error(response.statusText);
      }
    }).catch(err => {
      console.log('failed to load restaurant review from backend URL');
      console.log(err);
      DBHelper.fetchRestaurantReviewsFromIndexedDB(restaurantID, callback);
    });
  }
  static fetchRestaurantReviewsFromIndexedDB(restaurantID, callback) {
    console.log('running fetchRestaurantReviewsFromIndexedDB');
    console.log('restaurantID: ' + restaurantID);
    if (!('indexedDB' in window)) {
      //return Promise.reject(null);
      return;
    }
    if (!idb) {
      console.log('idb is undefined');
      //return Promise.reject(null);
      return;
    }
    let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
    promiseToOpenIDB.then(restaurantDB => {
      //got IDB
      console.log('got idb, and proceed to get restaurant object store...');
      if (!restaurantDB.objectStoreNames.contains('restaurantReview')) {
        throw Error('restaurantDB does not contain restaurant review object store');
      } else {
        let tx = restaurantDB.transaction('restaurantReview', 'readonly');
        let restaurantReviewObjStore = tx.objectStore('restaurantReview');
        let restaurantReviewRestaurantIDIndex = restaurantReviewObjStore.index('restaurantIDIndex');
        let promiseToGetAllRestaurantReview = restaurantReviewRestaurantIDIndex.getAll(IDBKeyRange.only(parseInt(restaurantID)));
        promiseToGetAllRestaurantReview.then(restaurantReviews => {
          if (restaurantReviews) {
            callback(null, restaurantReviews);
          } else {
            callback('failed to get restaurant review from IDB', null);
          }
        }).catch(err => {
          callback(err, null);
        });
        return tx.complete;
      }
    }).catch(err => {
      //fail to get IDB
      console.log('Failed to open IDB in promiseToFetchRestaurantReviewsFromIndexedDB');
      console.log(err);
      callback(err, null);
      return null;
    });
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
  static promiseToDeleteAllReviewForRestaurant(restaurantID) {
    console.log('in deleteAllReviewForRestaurant');
    console.log(restaurantID);
    if (!('indexedDB' in window)) {
      return Promise.reject(null);
    }
    if (!idb) {
      console.log('idb is undefined');
      return Promise.reject(null);
    }
    let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
    let promiseToGetAllRestaurantReviewsFromIDB = promiseToOpenIDB.then(restaurantDB => {
      //got IDB
      console.log('got idb, and proceed to get restaurant object store...');
      if (!restaurantDB.objectStoreNames.contains('restaurantReview')) {
        throw Error('restaurantDB does not contain restaurant review object store');
      } else {
        let tx = restaurantDB.transaction('restaurantReview', 'readwrite');
        let restaurantReviewObjStore = tx.objectStore('restaurantReview');
        console.log('got restaurant review object store');
        let restaurantIDIndex = restaurantReviewObjStore.index('restaurantIDIndex');
        let promiseToGetAllReviewForRestaurant = restaurantIDIndex.openCursor(IDBKeyRange.only(parseInt(restaurantID)));
        return promiseToGetAllReviewForRestaurant;
      }
    }).catch(err => {
      //problem open idb
      console.log('problem opening idb');
      console.log(err);
      return Promise.reject('problem opening idb, so fail to delete review for restaurant');
    });
    let promiseToDeleteAllReviewForRestaurant = promiseToGetAllRestaurantReviewsFromIDB.then(function deleteRestaurantReviewAt(cursor) {
      if (!cursor) {
        return tx.complete;
      }
      if (cursor) {
        console.log('trying to delete cursor');
        console.log(cursor);
        //console.log('delete cursor id:'+cursor.key);
        cursor.delete();
        return cursor.continue().then(deleteRestaurantReviewAt);
      }
    }).catch(err => {
      console.log('problem getting all reviews for restaurant.');
      console.log(err);
      return Promise.reject('');
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
        restaurantObjStore.createIndex('restaurantSyncIndex', 'sync');
      }
      if (!restaurantDB.objectStoreNames.contains('restaurantReview')) {
        let restaurantReviewObjStore = restaurantDB.createObjectStore('restaurantReview', {
          keyPath: 'id',
          autoIncrement: true
        });
        restaurantReviewObjStore.createIndex('restaurantIDIndex', 'restaurant_id');
        restaurantReviewObjStore.createIndex('restaurantReviewSyncIndex', 'sync');
      }
    });
  }
  static promiseToAddNewReview(restaurantID, name, rating, comments) {
    console.log(DBHelper.POST_REVIEW_URL);
    const restaurantReview = {
      "restaurant_id": parseInt(restaurantID),
      "name": name,
      "rating": rating,
      "comments": comments
    };
    let promiseToPostNewReviewToBackend = fetch(DBHelper.POST_REVIEW_URL, {
      method: 'POST',
      body: JSON.stringify(restaurantReview)
    });
    let promiseToFileNewReview = promiseToPostNewReviewToBackend.then(response => {
      if (response.ok) {
        console.log('posted new review to backend successfully');
        return '';
      } else {
        console.log('buffer the new review in indexeddb');
        restaurantReview.sync = "pending";
        let promiseToFileRestaurantReviewsIntoIndexedDBForRestaurant = DBHelper.promiseToFileRestaurantReviewsIntoIndexedDBForRestaurant([restaurantReview], restaurantID);
      }
    }).catch(err => {
      console.log('error posting new review to backend');
      console.log(err);
      console.log('buffer the new review in indexeddb');
      restaurantReview.sync = "pending";
      let promiseToFileRestaurantReviewsIntoIndexedDBForRestaurant = DBHelper.promiseToFileRestaurantReviewsIntoIndexedDBForRestaurant([restaurantReview], restaurantID);
    });
    return promiseToFileNewReview;
  }
  static promiseToSyncPendingRecord() {
    console.log('in promiseToSyncPendingRecord');
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
    let promiseToSyncPendingReviews = promiseToOpenIDB.then(restaurantDB => {
      console.log('got restaurant db in promiseToSyncPendingReviews');
      let tx1 = restaurantDB.transaction('restaurantReview', 'readwrite');
      let tx2 = restaurantDB.transaction('restaurant', 'readwrite');
      let restaurantReviewObjStore = tx1.objectStore('restaurantReview');
      let restaurantObjStore = tx2.objectStore('restaurant');
      let restaurantReviewSyncIndex = restaurantReviewObjStore.index('restaurantReviewSyncIndex');
      let restaurantSyncIndex = restaurantObjStore.index('restaurantSyncIndex');
      let promiseToGetAllPendingReviews = restaurantReviewSyncIndex.getAll(IDBKeyRange.only("pending"));
      let promiseToGetAllPendingRestaurants = restaurantSyncIndex.getAll(IDBKeyRange.only("pending"));
      let promiseArray2 = [];
      let promiseToFileAllPendingReviews = promiseToGetAllPendingReviews.then(restaurantReviews => {
        console.log('got restaurant reviews in sync pending review');
        console.log(restaurantReviews);
        if (restaurantReviews && restaurantReviews.length > 0) {
          console.log('got pending review');
          let promiseArray = [];
          restaurantReviews.forEach(restaurantReview => {
            let restaurantReviewID = restaurantReview.id;
            let tempRestaurantReview = Object.assign({}, restaurantReview);
            if (delete tempRestaurantReview.sync && delete tempRestaurantReview.id) {
              let promiseToPostNewReviewToBackend = fetch(DBHelper.POST_REVIEW_URL, {
                method: 'POST',
                body: JSON.stringify(tempRestaurantReview)
              });
              let promiseToFileReview = promiseToPostNewReviewToBackend.then(response => {
                if (response.ok) {
                  console.log('done filing ' + restaurantReviewID + ' to the backend');
                  delete restaurantReview.sync;
                  restaurantReviewObjStore.put(restaurantReview, restaurantReviewID);
                  return "";
                } else {
                  throw Error('problem trying to post restaurant review to the backend');
                }
              }).catch(err => {
                //there is a network problem when posting to backend.
                console.log('problem filing ' + restaurantReviewID + ' to the backend');
                console.log(err);
                return Promise.reject("");
              });
              promiseArray.push(promiseToFileReview);
            } else {
              //failed to remove sync and id property //WHAT!?!?
              console.log('problem remove sync and id property from  ' + restaurantReviewID);
              return Promise.reject('problem removing pending status');
            }
          })
          Promise.all(promiseArray).then(() => {
            return tx1.complete;
          }).catch(err => {
            console.log('Failed to process all review refersh');
            console.log(err);
            return Promise.reject('Fail to process all review refresh');
          });
        } else {
          console.log('got no pending restaurant review');
          return tx1.complete;
        }
      }).catch(err => {
        //fail to get all restaurant reviews from the sync index
        console.log('fail to get all restaurant reviews from the sync index');
        console.log(err);
        throw Error('fail to get all restaurant reviews from the sync index');
      });
      let promiseToFileAllPendingRestaurants = promiseToGetAllPendingRestaurants.then(restaurants => {
        console.log('got restaurants in sync pending');
        console.log(restaurants);
        if (restaurants && restaurants.length > 0) {
          console.log('got pending restaurants');
          let promiseArray = [];
          restaurants.forEach(restaurant => {
            let restaurantID = restaurant.id;
            let restaurantIsFavorite = restaurant.is_favorite;
            let promiseToPostRestaurantFavoriteToBackend = fetch(DBHelper.RESTAURANT_AS_FAVORITE_URL(restaurantID, restaurantIsFavorite), {
              method: 'PUT'
            });
            let promiseToFileRestaurantToIDB = promiseToPostRestaurantFavoriteToBackend.then(response => {
              if (response.ok) {
                console.log('done update ' + restaurantID + ' to the backend');
                if (delete restaurant.sync) {
                  restaurantObjStore.put(restaurant);
                } else {
                  //failed to remove sync //WHAT!?!?
                  console.log('problem remove sync from  ' + restaurantID);
                  return Promise.reject('problem removing pending status');
                }

                return "";
              } else {
                throw Error('problem trying to update restaurant to the backend');
              }
            }).catch(err => {
              //there is a network problem when posting to backend.
              console.log('problem update ' + restaurantID + ' to the backend');
              console.log(err);
              return Promise.reject("");
            });
            promiseArray.push(promiseToFileRestaurantToIDB);
          })
          Promise.all(promiseArray).then(() => {
            return tx2.complete;
          }).catch(err => {
            console.log('Failed to process all restaurant favorite refersh');
            console.log(err);
            return Promise.reject('Fail to process all restaurant favorite refresh');
          });
        } else {
          console.log('got no pending restaurant favorite');
          return tx2.complete;
        }
      }).catch(err => {
        //fail to get all restaurant reviews from the sync index
        console.log('fail to get all pending restaurant from the sync index');
        console.log(err);
        throw Error('fail to get all pending restaurant from the sync index');
      });
      promiseArray2.push(promiseToFileAllPendingReviews);
      promiseArray2.push(promiseToFileAllPendingRestaurants);
      let promiseTOFileAllPendingRecords = Promise.all(promiseArray2);
      return promiseTOFileAllPendingRecords;
    }).catch(err => {
      console.log('problem opening restaurant idb');
      console.log(err);
      throw Error('problem opening restaurant idb');
    });
    return promiseToSyncPendingReviews;
  }
  static refreshARestaurantReviewsIDB(restaurantReviews, restaurantID) {
    //TO-DO: implement this:
    console.log('in refreshARestaurantReviewsIDB');
    if (!('indexedDB' in window)) {
      console.log('indexedDB is undefined')
      //return Promise.reject(null);
      return;
    }
    if (!idb) {
      console.log('idb is undefined');
      //return Promise.reject(null);
      return;
    }
    let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
    promiseToOpenIDB.then(restaurantDB => {
      console.log('got restaurant idb')
      if (!restaurantDB.objectStoreNames.contains('restaurantReview')) {
        throw Error('restaurantDB does not contain restaurant review object store');
      } else {
        let tx = restaurantDB.transaction('restaurantReview', 'readwrite');
        let restaurantReviewObjStore = tx.objectStore('restaurantReview');
        let restaurantIDIndex = restaurantReviewObjStore.index('restaurantIDIndex');
        let promiseToGetAllReviewForRestaurant = restaurantIDIndex.openKeyCursor(IDBKeyRange.only(parseInt(restaurantID)));
        let promiseToDeleteAllReviewForRestaurant = promiseToGetAllReviewForRestaurant.then(function deleteRestaurantReviewAt(cursor) {
          if (!cursor) {
            return Promise.resolve('');
          }
          if (cursor) {
            console.log('trying to delete cursor');
            console.log(cursor);
            console.log('delete cursor id:' + cursor.key);
            restaurantReviewObjStore.delete(cursor.primaryKey);
            return cursor.continue().then(deleteRestaurantReviewAt);
          }
        }).catch(err => {
          console.log('problem getting all reviews for restaurant.');
          console.log(err);
          throw new Error('problem getting all reviews for restaurant.');
        });
        promiseToDeleteAllReviewForRestaurant.then(() => {
          console.log('done delete all historical reviews for restaurant');
          console.log('now file new reviews');
          console.log(restaurantReviews);
          let promiseArray = [];
          for (let key in restaurantReviews) {

            if (!restaurantReviews.hasOwnProperty(key)) continue;
            let restaurantReview = restaurantReviews[key];
            console.log('adding restaurant review: ');
            console.log(restaurantReview);
            //delete restaurantReview.id;
            console.log('after delete restaurant review: ');
            console.log(restaurantReview);
            let promiseToAddReviewToReviewObjStore = restaurantReviewObjStore.add(restaurantReview);
            promiseArray.push(promiseToAddReviewToReviewObjStore);
          }
          Promise.all(promiseArray).then(() => {
            return tx.complete;
          }).catch(err => {
            console.log('failed to add all restaurant review to restaurant review obj store');
            console.log(err);
            return;
          });
        }).catch(err => {
          //delete all reviews for restaurant failed
          console.log('delete all reviews for restaurant failed');
          console.log(err);
          console.log('now file new reviews');
          console.log(restaurantReviews);
          let promiseArray = [];
          for (let key in restaurantReviews) {
            if (!restaurantReviews.hasOwnProperty(key)) continue;
            let restaurantReview = restaurantReviews[key];
            console.log('adding restaurant review: ');
            console.log(restaurantReview);
            let promiseToAddReviewToReviewObjStore = restaurantReviewObjStore.add(restaurantReview);
            promiseArray.push(promiseToAddReviewToReviewObjStore);
          }
          Promise.all(promiseArray).then(() => {
            return tx.complete;
          }).catch(err => {
            console.log('failed to add all restaurant review to restaurant review obj store');
            console.log(err);
            return;
          });
        });
      }
    }).catch(err => {
      //problem open idb
      console.log('problem opening idb');
      console.log(err);
      //return Promise.reject('problem opening idb, so fail to delete review for restaurant');
      return;
    });
  }
  static refreshRestaurantIDB(restaurantJSON, id) {
    if (!('indexedDB' in window)) {
      return Promise.reject('');
    }
    if (!idb) {
      console.log('idb is undefined');
      return Promise.reject('');
    }
    let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
    promiseToOpenIDB.then(restaurantDB => {
      //got IDB
      console.log('got idb, and proceed to get restaurant object store...');
      if (!restaurantDB.objectStoreNames.contains('restaurant')) {
        console.log('restaurant db does not have a restaurant object store');
        throw new Error('restaurant DB does not have the restaurant object store');
      } else {
        console.log('restaurant db has restaurant object store');
        let tx = restaurantDB.transaction('restaurant', 'readwrite');
        let restaurantObjStore = tx.objectStore('restaurant');
        restaurantObjStore.put(restaurantJSON);
        return tx.complete;
      }
    }).catch(err => {
      console.log('refresh a restaurant: ' + id + ' failed');
      console.log(err);
    });
  }
  static refreshRestaurantsIDB(restaurantsJSON) {
    if (!('indexedDB' in window)) {
      return Promise.reject('');
    }
    if (!idb) {
      console.log('idb is undefined');
      return Promise.reject('');
    }
    console.log('in refreshRestaurantsIDB');
    console.log(restaurantsJSON);
    let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
    promiseToOpenIDB.then(restaurantDB => {
      //got IDB
      console.log('got idb, and proceed to get restaurant object store...');
      if (!restaurantDB.objectStoreNames.contains('restaurant')) {
        console.log('restaurant db does not have a restaurant object store');
        throw new Error('restaurant DB does not have the restaurant object store');
      } else {
        console.log('restaurant db has restaurant object store');
        let tx = restaurantDB.transaction('restaurant', 'readwrite');
        let restaurantObjStore = tx.objectStore('restaurant');
        let promiseToClearRestaurantObjStore = restaurantObjStore.clear();
        promiseToClearRestaurantObjStore.then(() => {
          console.log('restaurantsJSON received');
          console.log(restaurantsJSON);
          console.log('length: ' + restaurantsJSON.length);
          if (restaurantsJSON) {
            console.log('we have a legit restaurantsJSON');
            for (let key in restaurantsJSON) {
              if (!restaurantsJSON.hasOwnProperty(key)) continue;
              let restaurantJSON = restaurantsJSON[key];
              console.log('adding restaurant: ');
              console.log(restaurantJSON);
              restaurantObjStore.add(restaurantJSON);
            }
          }
          return tx.complete;
        }).catch(err => {
          console.log('fail to clear restaurant object store');
          console.log(err);
          if (restaurantsJSON) {
            console.log('we have a legit restaurantsJSON');
            for (let key in restaurantsJSON) {
              if (!restaurantsJSON.hasOwnProperty(key)) continue;
              let restaurantJSON = restaurantsJSON[key];
              console.log('adding restaurant: ');
              console.log(restaurantJSON);
              restaurantObjStore.add(restaurantJSON);
            }
          }
          return tx.complete;
        });
      }
    }).catch(err => {
      console.log('refresh all restaurants failed');
      console.log(err);
    });
  }
  static markRestaurantAsFavorite(restaurantID, isFavorite) {
    console.log('in markRestaurantAsFavorite');
    console.log(restaurantID);
    console.log(isFavorite);
    console.log(DBHelper.RESTAURANT_AS_FAVORITE_URL(restaurantID, isFavorite));
    let promiseToPostFavoriteToBackend = fetch(DBHelper.RESTAURANT_AS_FAVORITE_URL(restaurantID, isFavorite), {
      method: 'PUT'
    });
    promiseToPostFavoriteToBackend.then(response => {
      if (response.ok) {
        //put it in restaurant objStore
        let promiseToTurnResponseToJson = response.json();
        promiseToTurnResponseToJson.then(respJson => {
          let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
          let promiseToFileFavoriteRestaurantToIDB = promiseToOpenIDB.then(restaurantDB => {
            let tx = restaurantDB.transaction('restaurant', 'readwrite');
            let restaurantObjStore = tx.objectStore('restaurant');
            restaurantObjStore.put(respJson);
            return tx.complete;
          }).catch(err => {
            console.log('problem open idb when trying to file restaurant favorite into idb');
            console.log(err);
          });
        }).catch(err => {
          console.log('problem converting response to json');
          console.log(err);
          throw new Error('problem converting response to json');
        });
      } else {
        throw new Error('unable to PUT the favorite to backend server.');
      }
    }).catch(err => {
      //fail to put favorite to backend
      //find the restaurant in restaurant objStore
      //save it there and mark it as sync pending
      let promiseToOpenIDB = DBHelper.promiseToOpenRestaurantIDB(idb);
      let promiseToFileFavoriteRestaurantToIDB = promiseToOpenIDB.then(restaurantDB => {
        let tx = restaurantDB.transaction('restaurant', 'readwrite');
        let restaurantObjStore = tx.objectStore('restaurant');
        let promiseToGetRestaurantFromObjStore = restaurantObjStore.get(parseInt(restaurantID));
        promiseToGetRestaurantFromObjStore.then(restaurant=>{
          restaurant.is_favorite=isFavorite.toString();
          restaurant.sync="pending";
          restaurantObjStore.put(restaurant);
          return tx.complete;
        }).catch(err=>{
          console.log('problem getting restaurant from idb');
          console.log(err);
          throw new Error('problem getting restaurant from idb');
        });
      }).catch(err => {
        console.log('problem open idb when trying to file restaurant favorite into idb');
        console.log(err);
      });
    })
  }
}

