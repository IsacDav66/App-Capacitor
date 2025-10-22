// /js/modules/ui/videoPlayer.js

export function initializeVideoPlayers() {
    const videoElements = document.querySelectorAll('.plyr__video-embed:not(.plyr--ready)');
    const playerInstances = []; 

    videoElements.forEach(element => {
        const player = new Plyr(element, {
            clickToPlay: false,
            youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 },
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'fullscreen']
        });

        player.on('timeupdate', () => {
            const { currentTime, duration } = player;
            if (duration && (duration - currentTime) < 0.3) {
                player.currentTime = 0;
            }
        });
        playerInstances.push(player);
    });
    
    return playerInstances;
}

export function setupAutoplayObserver(playersToObserve) {
    if (!playersToObserve || playersToObserve.length === 0) return;

    const options = { root: null, rootMargin: '0px', threshold: 0.75 };

    const callback = (entries) => {
        entries.forEach(entry => {
            const player = playersToObserve.find(p => p.elements.container === entry.target);
            if (!player) return;

            if (entry.isIntersecting) {
                playersToObserve.forEach(otherPlayer => {
                    if (otherPlayer !== player && !otherPlayer.paused) {
                        otherPlayer.pause();
                    }
                });
                player.muted = true;
                player.play().catch(() => {});
            } else {
                player.pause();
            }
        });
    };

    const observer = new IntersectionObserver(callback, options);
    playersToObserve.forEach(player => observer.observe(player.elements.container));
}