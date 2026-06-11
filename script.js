document.addEventListener('DOMContentLoaded', () => {

    const video = document.getElementById('live-player');
    const loading = document.getElementById('loading');
    const channelTitle = document.getElementById('channel-title');
    const serverBtns = document.querySelectorAll('.server-btn');

    let hls;

	const servers = {
		1: {
			url: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1709/output/index.m3u8',
			title: 'BTV National'
		},
		2: {
			url: 'https://owrcovcrpy.gpcdn.net/bpk-tv/1702/output/index.m3u8',
			title: 'Somoy TV'
		},
		3: {
			url: 'http://172.16.29.230:8090/hls/tsportshd.m3u8',
			title: 'T Sports HD'
		},
		4: {
			url: 'http://172.16.29.230:8090/hls/ptvsportshd.m3u8',
			title: 'PTV Sports HD'
		}
	};

    function setLoadingText(text) {
        const p = loading.querySelector('p');
        if (p) {
            p.innerText = text;
        }
    }

    function showLoading() {
        loading.style.display = 'flex';
        setLoadingText('Loading Live Stream...');

        setTimeout(() => {
            loading.style.opacity = '1';
        }, 10);
    }

    function hideLoading() {
        loading.style.opacity = '0';

        setTimeout(() => {
            loading.style.display = 'none';
        }, 500);
    }

    function loadStream(serverId) {

        const server = servers[serverId];

        if (!server) return;

        showLoading();

        channelTitle.innerText = server.title;

        if (hls) {
            hls.destroy();
            hls = null;
        }

        if (Hls.isSupported()) {

            hls = new Hls({
                debug: false,
                enableWorker: true
            });

            hls.loadSource(server.url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {

                hideLoading();

                video.play().catch(() => {
                    console.log('Autoplay blocked');
                });

            });

            hls.on(Hls.Events.ERROR, (event, data) => {

                if (!data.fatal) return;

                setLoadingText('Stream offline. Reconnecting...');
                showLoading();

                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {

                    console.log('Network error, reconnecting...');
                    hls.startLoad();

                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {

                    console.log('Media error, recovering...');
                    hls.recoverMediaError();

                } else {

                    console.log('Fatal error, destroying player...');
                    hls.destroy();

                }

            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {

            video.src = server.url;

            video.addEventListener('loadedmetadata', () => {

                hideLoading();

                video.play().catch(() => {
                    console.log('Autoplay blocked');
                });

            }, { once: true });

        } else {

            setLoadingText('HLS is not supported in this browser.');

        }
    }

    // Default stream
    loadStream(3);

    // Server switch buttons
    serverBtns.forEach(btn => {

        btn.addEventListener('click', (e) => {

            serverBtns.forEach(b => b.classList.remove('active'));

            e.currentTarget.classList.add('active');

            const serverId = e.currentTarget.getAttribute('data-server');

            loadStream(serverId);

        });

    });

    // Prevent accidental pause
    video.addEventListener('pause', () => {

        if (video.readyState >= 3) {

            const playPromise = video.play();

            if (playPromise !== undefined) {

                playPromise.catch(() => {
                    console.log('Forced live stream play');
                });

            }
        }

    });

});
