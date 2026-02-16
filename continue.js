(function () {
    'use strict';

    function getEpisodeHash(season, episode, originalName) {
        const separator = season > 10 ? ':' : '';
        return Lampa.Utils.hash([season, separator, episode, originalName].join(''));
    }

    function getMovieHash(movie) {
        return Lampa.Utils.hash(movie.original_title || movie.title);
    }

    function getAllSavedProgress() {
        try {
            const profiles = Lampa.Storage.get('profiles') || {};
            const currentProfile = Lampa.Storage.get('current_profile') || 'default';
            const profileId = profiles[currentProfile]?.id || currentProfile;
            const fileViewKey = profileId !== 'default' ? `file_view_${profileId}` : 'file_view';
            return Lampa.Storage.get(fileViewKey) || {};
        } catch (e) {
            console.log('Помилка отримання прогресу:', e);
            return {};
        }
    }

    function findLastWatchedForSerial(movie) {
        const viewed = getAllSavedProgress();
        const originalName = movie.original_name || movie.title || movie.original_title;
        if (!originalName) return null;

        let lastEpisode = null;

        for (let season = 1; season <= 20; season++) {
            for (let episode = 1; episode <= 50; episode++) {
                const hash = getEpisodeHash(season, episode, originalName);
                const progress = viewed[hash];

                if (progress && progress.time > 0) {
                    // Беремо останню серію по хронології
                    if (!lastEpisode || season > lastEpisode.season || (season === lastEpisode.season && episode > lastEpisode.episode)) {
                        lastEpisode = {
                            hash,
                            season,
                            episode,
                            time: progress.time,
                            percent: progress.percent
                        };
                    }
                }
            }
        }

        return lastEpisode;
    }

    function formatTime(sec) {
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        if (h > 0) return `${h}г ${m}хв`;
        if (m > 0) return `${m}хв ${s}сек`;
        return `${s}сек`;
    }

    function addContinueButton(movie, season = null, episode = null, savedState = null) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        const isSerial = movie.type === 'serial' || movie.type === 'series' || movie.serial === true;

        let hash, state, displayInfo = '';

        if (isSerial) {
            const originalName = movie.original_name || movie.title || movie.original_title;

            if (season && episode) {
                hash = getEpisodeHash(season, episode, originalName);
                state = Lampa.Timeline.view(hash);
                displayInfo = `S${season}E${episode}`;
            } else {
                const lastWatched = savedState || findLastWatchedForSerial(movie);
                if (!lastWatched) return; // Якщо немає переглянутого епізоду, не показуємо кнопку
                hash = lastWatched.hash;
                state = { time: lastWatched.time, percent: lastWatched.percent };
                displayInfo = `S${lastWatched.season}E${lastWatched.episode}`;
                season = lastWatched.season;
                episode = lastWatched.episode;
            }
        } else {
            hash = getMovieHash(movie);
            state = Lampa.Timeline.view(hash);
            if (!state || state.time <= 0) return; // Для фільмів без прогресу кнопка не потрібна
        }

        const subText = displayInfo
            ? `${displayInfo} • ${Math.round(state.percent)}% • ${formatTime(state.time)}`
            : `${Math.round(state.percent)}% • ${formatTime(state.time)}`;

        const button = document.createElement('div');
        button.className = 'full-start__button selector button--continue';
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
            <span>Продовжити перегляд</span>
            <div class="continue-subtext">${subText}</div>
        `;

        const sub = button.querySelector('.continue-subtext');
        sub.style.cssText = `
            font-size: 11px;
            opacity: 0.7;
            margin-top: 2px;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
        `;

        const playHandler = () => {
            if (isSerial && season && episode) {
                if (movie.seasons && movie.seasons[season - 1]) {
                    const episodeData = movie.seasons[season - 1].episodes[episode - 1];
                    if (episodeData) {
                        Lampa.Player.play(movie, state.time, { season, episode, episode_data: episodeData });
                        return;
                    }
                }
                Lampa.Player.play(movie, state.time, { season, episode });
            } else {
                Lampa.Player.play(movie, state.time);
            }
        };

        button.addEventListener('hover:enter', playHandler);
        button.addEventListener('click', playHandler);

        const existingButtons = container.querySelectorAll('.full-start__button');
        if (existingButtons.length > 0) {
            container.insertBefore(button, existingButtons[0]);
        } else {
            container.appendChild(button);
        }

        console.log(`✅ Кнопка "Продовжити" додана для ${isSerial ? 'серіалу' : 'фільму'}`);
    }

    function init() {
        console.log('Ініціалізація плагіна "Продовжити перегляд"');

        Lampa.Listener.follow('full', e => {
            if (e.type !== 'complite') return;

            const movie = e.data.movie;

            setTimeout(() => {
                const season = e.data.season;
                const episode = e.data.episode;

                if (season && episode) {
                    addContinueButton(movie, season, episode);
                } else {
                    addContinueButton(movie);
                }
            }, 800);
        });

        Lampa.Listener.follow('player', e => {
            if (e.type === 'destroy') console.log('Плеєр закрито');
        });

        Lampa.Listener.follow('timeline', e => {
            if (e.type === 'update') console.log('Оновлено прогрес:', e.data);
        });
    }

    if (window.Lampa) {
        if (Lampa.Listener) init();
        else document.addEventListener('lampa', init);
    } else {
        document.addEventListener('lampa', init);
    }

    console.log('🚀 Плагін "Продовжити перегляд" завантажено');
})();
