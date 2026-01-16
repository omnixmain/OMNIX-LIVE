const M3U_URL = 'https://github.com/omnixmain/OMNIX-PLAYLIST-ZONE/raw/refs/heads/main/playlist/RoarZoneTv.m3u';

// DOM Elements
const channelGrid = document.getElementById('channel-grid');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('player-modal');
const closePlayerBtn = document.getElementById('closePlayer');
const currentTitle = document.getElementById('current-title');

let allChannels = [];
let art = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    fetchPlaylist();

    // Search listener
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allChannels.filter(ch => ch.name.toLowerCase().includes(query));
        renderChannels(filtered);
    });

    // Close modal listener
    closePlayerBtn.addEventListener('click', destroyPlayer);

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            destroyPlayer();
        }
    });

    // Handle Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            destroyPlayer();
        }
    });
});

async function fetchPlaylist() {
    try {
        // Using AllOrigins proxy to bypass CORS restrictions on local file system
        const PROXY_URL = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(PROXY_URL + encodeURIComponent(M3U_URL));

        if (!response.ok) throw new Error('Network response was not ok');
        const text = await response.text();
        parseM3U(text);
    } catch (error) {
        console.error('Error fetching playlist:', error);
        loading.innerHTML = `<p style="color: #e50914;">Failed to load playlist.<br>${error.message}<br><br>Tip: If you are opening this as a local file, browser security might block requests. Try using a local server (VS Code Live Server) or this proxy fix should help.</p>`;
    }
}

function parseM3U(content) {
    const lines = content.split('\n');
    allChannels = [];

    let currentChannel = {};

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('#EXTINF:')) {
            // Parse metadata
            // Example: #EXTINF:-1 tvg-id="ZeeCinema.in" tvg-logo="https://..." group-title="Movies",Zee Cinema
            currentChannel = {};

            // Extract attributes using regex or string splits
            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            const groupMatch = line.match(/group-title="([^"]*)"/);
            const nameMatch = line.match(/,(.+)$/);

            currentChannel.logo = logoMatch ? logoMatch[1] : 'https://via.placeholder.com/150x150?text=TV';
            currentChannel.group = groupMatch ? groupMatch[1] : 'General';
            currentChannel.name = nameMatch ? nameMatch[1].trim() : 'Unknown Channel';

        } else if (line.startsWith('http')) {
            // It's the URL
            currentChannel.url = line;
            if (currentChannel.name) {
                allChannels.push(currentChannel);
            }
        }
    });

    loading.style.display = 'none';
    renderChannels(allChannels);
}

function renderChannels(channels) {
    channelGrid.innerHTML = '';

    if (channels.length === 0) {
        channelGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No channels found.</p>';
        return;
    }

    channels.forEach((channel, index) => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.onclick = () => openPlayer(channel);

        // Lazy load images could be added for performance
        card.innerHTML = `
            <div class="channel-logo-wrapper">
                <img src="${channel.logo}" alt="${channel.name}" class="channel-logo" loading="lazy" onerror="this.src='https://via.placeholder.com/300x169/222/fff?text=No+Logo'">
                <div class="play-overlay"><i class="ri-play-circle-fill"></i></div>
            </div>
            <div class="channel-name" title="${channel.name}">${channel.name}</div>
        `;

        channelGrid.appendChild(card);
    });
}

function openPlayer(channel) {
    modal.classList.add('active');
    currentTitle.textContent = channel.name;

    // Check if it's HLS
    const isHLS = channel.url.includes('.m3u8');

    art = new Artplayer({
        container: '.artplayer-app',
        url: channel.url,
        volume: 0.5,
        isLive: true,
        autoplay: true,
        pip: true,
        autoSize: true,
        autoMini: true,
        screenshot: true,
        setting: true,
        loop: true,
        flip: true,
        playbackRate: true,
        aspectRatio: true,
        fullscreen: true,
        miniProgressBar: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: true,
        airplay: true,
        theme: '#e50914',
        customType: {
            m3u8: function (video, url, art) {
                if (Hls.isSupported()) {
                    if (art.hls) art.hls.destroy();
                    const hls = new Hls();
                    hls.loadSource(url);
                    hls.attachMedia(video);
                    art.hls = hls;
                    art.on('destroy', () => hls.destroy());
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = url;
                } else {
                    art.notice.show = 'Unsupported playback format: m3u8';
                }
            }
        },
    });
}

function destroyPlayer() {
    if (art) {
        art.destroy(false);
        art = null;
    }
    modal.classList.remove('active');
}
