self.addEventListener('install', event => {
    //cache everything you need to control
    //call self.skipWaiting(); to take over previous service worker
    console.log('service working installing');
    let promiseToGetCache = caches.open('restaurant-cache-v1');
    let promiseToCacheAllFiles = promiseToGetCache.then(cache => {
        console.log('got cache at install');
        let promiseToAddFilesToCache = cache.addAll([
            '/',
            '/img/1-low.jpg',
            '/img/1-mid.jpg',
            '/img/1.jpg',
            '/img/2-low.jpg',
            '/img/2-mid.jpg',
            '/img/2.jpg',
            '/img/3-low.jpg',
            '/img/3-mid.jpg',
            '/img/3.jpg',
            '/img/4-low.jpg',
            '/img/4-mid.jpg',
            '/img/4.jpg',
            '/img/5-low.jpg',
            '/img/5-mid.jpg',
            '/img/5.jpg',
            '/img/6-low.jpg',
            '/img/6-mid.jpg',
            '/img/6.jpg',
            '/img/7-low.jpg',
            '/img/7-mid.jpg',
            '/img/7.jpg',
            '/img/8-low.jpg',
            '/img/8-mid.jpg',
            '/img/8.jpg',
            '/img/9-low.jpg',
            '/img/9-mid.jpg',
            '/img/9.jpg',
            '/img/10-low.jpg',
            '/img/10-mid.jpg',
            '/img/10.jpg',
            '/index.html',
            '/restaurant.html',
            '/js/dbhelper.js',
            '/js/main.js',
            '/js/restaurant_info.js',
            '/serviceWorker.js',
            '/css/styles.css',
            '/data/restaurants.json',
            '/favicon.ico',
            'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
            'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css'
        ]).then(()=>console.log('cached all successfully')).catch(err=>console.log('cache all error: '+ error));
        //let cachePromise = cache.add(''); //add a single item to the cache
        return promiseToAddFilesToCache.then(()=>self.skipWaiting).then(()=>console.log('successfully self skippping'));
    });
    event.waitUntil(promiseToCacheAllFiles); //let browser know if the install is complete
});

self.addEventListener('activate', event => {
    //this is when service worker is ready
    //call clients.claim() here?? probably don't need it.
    /*
        //clean up previous cache when this service worker is activated
        event.waitUntil(
            let promiseToGetCachesKeys = caches.keys();
            promiseToGetCachesKeys.then(keys => Promise.all(
                keys.map(key => {
                    if (!expectedCaches.includes(key)) {
                        return caches.delete(key);
                    }
                })
            )).then(() => {
                console.log('V2 now ready to handle fetches!');
            })
        );
        //second example of cleanup
        event.waitUntil(
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.filter(function(cacheName) {
                        return cacheName.startsWith('wittr-') &&
                            !allCaches.includes(cacheName);
                    }).map(function(cacheName) {
                        return caches.delete(cacheName);
                    })
                );
            })
        );
    */
});
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    console.log('got fetch request for: '+url.href);
    console.log('request origin is: '+url.origin);
    console.log('location origin: '+location.origin);
    console.log('trying fetching '+event.request.url+' from cache');
    let promiseToGetCache = caches.open('restaurant-cache-v1');
    let promiseToGetCachedResponse = promiseToGetCache.then(function(cache){
        console.log('got cache at fetch');
        console.log('try to find '+url.pathname + 'in cache');
        return cache.match(url.pathname);
    });
    let promiseToGetResponse=promiseToGetCachedResponse.then(function(response){
        if(!response){
            console.log('did not find '+url.href+' in cache');
            console.log('initiate fetch');
            return fetch(event.request);
        }else{
            console.log('found '+url.pathname+' in cache and return cached data');
            return response;
        }
    })
    event.respondWith(promiseToGetResponse);
    /* example of serving file from cache
        //event.respondWith(fetch)
        //event.respondWith(push)
        //event.respondWith(sync)
        if (url.origin == location.origin && url.pathname == '/dog.svg') {
            event.respondWith(caches.match('/cat.svg'));
            //event.respondWith(); //take a response or a promise of a response object
        }
        event.respondWith(
            fetch(event.request).then(function(response){
            if(response.status == 404){
                return new Response(“Whoops, not found.”)
            }else{
                return response;
            }
            }).catch(function(){
            return new Response(“Server error”)
            })
        );
        event.respondWith(  //this will take a response or promise of a response obj
            new Response(‘somehtml content’,{
                headers:{
                ‘content-type’:’text/html’
                }
            })
        );
    */
});
self.addEventListener('message', event => {
    let message = event.data;
    console.log('in message event');
    //take a message to trigger self.skipWaiting(); so user have control over the new version of service worker
});