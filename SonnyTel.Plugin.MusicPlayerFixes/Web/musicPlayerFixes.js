// Music Player Fixes — makes keyboard / Media Session "previous track"
// match the skip-back button behaviour: restart the current track when
// position >= 5 s, go to previous track only when < 5 s in.
//
// Strategy: delegate to the now-playing bar's .previousTrackButton whose
// click handler already implements the restart-first logic. This works on
// both the web client (HTML <audio>) and the desktop client (mpv) because
// the button handler calls playbackManager methods that abstract the
// underlying player. playbackManager itself is an ES module and not
// globally reachable from an injected script, so going through the button
// is the most reliable cross-client approach.
(function () {
    'use strict';

    function findPreviousTrackButton() {
        return document.querySelector('.previousTrackButton');
    }

    // --- 1. Keyboard interception (capture phase) -------------------
    // Fires before jellyfin-web's keyboardNavigation handler, which
    // would otherwise call playbackManager.previousTrack() directly.
    document.addEventListener('keydown', function (e) {
        if (e.key === 'MediaTrackPrevious') {
            var btn = findPreviousTrackButton();
            if (btn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                btn.click();
            }
        }
    }, true);

    // --- 2. Media Session wrapper -----------------------------------
    // Wraps the 'previoustrack' handler so OS-level media controls
    // (browser Media Session API) also get the restart-first behaviour.
    if (navigator.mediaSession) {
        var _origSetAction = navigator.mediaSession.setActionHandler.bind(navigator.mediaSession);

        navigator.mediaSession.setActionHandler = function (action, handler) {
            if (action === 'previoustrack') {
                _origSetAction(action, function () {
                    var btn = findPreviousTrackButton();
                    if (btn) {
                        btn.click();
                    } else if (handler) {
                        handler();
                    }
                });
            } else {
                _origSetAction(action, handler);
            }
        };
    }

    console.info('[MusicPlayerFixes] Loaded');
})();
