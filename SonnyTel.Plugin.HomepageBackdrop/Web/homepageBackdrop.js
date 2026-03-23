// Homepage Backdrop — cycles backdrops on the homepage from all media sources.
// Only active when the user's "Backdrops" display setting is enabled.
(function () {
    'use strict';

    var ROTATION_INTERVAL_MS = 10000;
    var FETCH_LIMIT = 20;
    var HOMEPAGE_DELAY_MS = 500;

    var rotationTimer = null;
    var currentImages = [];
    var currentIndex = -1;
    var isActive = false;

    // --- Helpers ---

    function getBackdropContainer() {
        return document.querySelector('.backdropContainer');
    }

    function getBackgroundContainer() {
        return document.querySelector('.backgroundContainer');
    }

    function isHomePage() {
        var path = window.location.pathname;
        var hash = window.location.hash;

        // Legacy hash routing: #/home, #/home?tab=0, #/home?tab=1
        if (hash === '#/home' || hash.indexOf('#/home?') === 0 || hash === '#!/home' || hash.indexOf('#!/home?') === 0) {
            return true;
        }

        // Path routing: /home, /web/index.html (with hash #/home)
        if (path === '/home' || path === '/web/home' || path.endsWith('/home')) {
            return true;
        }

        // Root with no hash (can be home)
        if ((path === '/' || path === '/web/' || path === '/web/index.html') && (!hash || hash === '#' || hash === '#/')) {
            return true;
        }

        return false;
    }

    function isVideoPlaying() {
        // Check for active video elements (native playback)
        var videos = document.querySelectorAll('video');
        for (var i = 0; i < videos.length; i++) {
            if (!videos[i].paused) {
                return true;
            }
        }
        return false;
    }

    // --- Backdrop management ---

    function clearPluginBackdrop() {
        stopRotation();
        currentImages = [];
        currentIndex = -1;
        isActive = false;
    }

    function setBackdropImage(url) {
        var container = getBackdropContainer();
        if (!container) {
            return;
        }

        var existing = container.querySelector('.displayingBackdropImage');

        var backdropImage = document.createElement('div');
        backdropImage.classList.add('backdropImage');
        backdropImage.classList.add('displayingBackdropImage');
        backdropImage.style.backgroundImage = "url('" + url + "')";
        backdropImage.setAttribute('data-url', url);
        backdropImage.classList.add('backdropImageFadeIn');
        container.appendChild(backdropImage);

        var bgContainer = getBackgroundContainer();
        if (bgContainer) {
            bgContainer.classList.add('withBackdrop');
        }

        // Remove the old image after the animation completes
        if (existing) {
            setTimeout(function () {
                if (existing.parentNode) {
                    existing.parentNode.removeChild(existing);
                }
            }, 1000);
        }
    }

    function onRotationTick() {
        if (isVideoPlaying()) {
            return;
        }

        if (currentImages.length === 0) {
            return;
        }

        currentIndex++;
        if (currentIndex >= currentImages.length) {
            currentIndex = 0;
        }

        setBackdropImage(currentImages[currentIndex]);
    }

    function startRotation(images) {
        stopRotation();

        currentImages = images;
        currentIndex = -1;
        isActive = true;

        // Show first image immediately
        onRotationTick();

        if (images.length > 1) {
            rotationTimer = setInterval(onRotationTick, ROTATION_INTERVAL_MS);
        }
    }

    function stopRotation() {
        if (rotationTimer) {
            clearInterval(rotationTimer);
            rotationTimer = null;
        }
    }

    // --- API interaction ---

    function getApiClient() {
        // window.ApiClient is set by the Jellyfin web client once authenticated
        return window.ApiClient;
    }

    function checkBackdropsEnabled(apiClient) {
        var userId = apiClient.getCurrentUserId();
        return apiClient.getDisplayPreferences('usersettings', userId, 'emby').then(function (prefs) {
            var custom = prefs && prefs.CustomPrefs;
            if (!custom) {
                return false;
            }
            return custom.enableBackdrops === 'true';
        });
    }

    function fetchBackdropItems(apiClient) {
        var userId = apiClient.getCurrentUserId();
        return apiClient.getItems(userId, {
            SortBy: 'IsFavoriteOrLiked,Random',
            Limit: FETCH_LIMIT,
            Recursive: true,
            ImageTypes: 'Backdrop',
            EnableTotalRecordCount: false,
            MaxOfficialRating: 'PG-13'
            // No IncludeItemTypes — all media sources
        }).then(function (result) {
            return result.Items || [];
        });
    }

    function buildImageUrls(apiClient, items) {
        var urls = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
                var tagIndex = Math.floor(Math.random() * item.BackdropImageTags.length);
                var url = apiClient.getScaledImageUrl(item.Id, {
                    type: 'Backdrop',
                    tag: item.BackdropImageTags[tagIndex],
                    maxWidth: Math.round(screen.availWidth),
                    index: tagIndex
                });
                urls.push(url);
            }
        }
        return urls;
    }

    // --- Main logic ---

    function activateHomepageBackdrop() {
        var apiClient = getApiClient();
        if (!apiClient) {
            return;
        }

        checkBackdropsEnabled(apiClient).then(function (enabled) {
            if (!enabled) {
                return;
            }

            fetchBackdropItems(apiClient).then(function (items) {
                if (items.length === 0) {
                    return;
                }

                var urls = buildImageUrls(apiClient, items);
                if (urls.length === 0) {
                    return;
                }

                // Clear whatever the native code set, then start our rotation
                var container = getBackdropContainer();
                if (container) {
                    container.innerHTML = '';
                }

                startRotation(urls);
            });
        });
    }

    function onPageChange() {
        if (isHomePage()) {
            if (!isActive) {
                // Delay to run after native clearBackdrop/showBackdrop calls
                setTimeout(activateHomepageBackdrop, HOMEPAGE_DELAY_MS);
            }
        } else {
            if (isActive) {
                clearPluginBackdrop();
            }
        }
    }

    // --- Navigation hooks ---

    // Listen for hash changes (legacy routing)
    window.addEventListener('hashchange', onPageChange);

    // Listen for popstate (history-based routing)
    window.addEventListener('popstate', onPageChange);

    // Patch pushState/replaceState to detect SPA navigation
    var originalPushState = history.pushState;
    var originalReplaceState = history.replaceState;

    history.pushState = function () {
        originalPushState.apply(this, arguments);
        setTimeout(onPageChange, 0);
    };

    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        setTimeout(onPageChange, 0);
    };

    // Also handle the viewshow event that Jellyfin fires on page transitions
    document.addEventListener('viewshow', function () {
        setTimeout(onPageChange, 100);
    });

    // Initial check on script load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(onPageChange, 1000);
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            setTimeout(onPageChange, 1000);
        });
    }
})();
