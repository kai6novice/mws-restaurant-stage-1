class ServiceWorkerHelper {
    static registerServiceWorker() {
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
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('listening to controllerchange');
                // This fires when the service worker controlling this page
                // changes, eg a new worker has skipped waiting and become
                // the new active worker.
            });
        }
    }
}
