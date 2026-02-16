(function () {
    'use strict';

    const OWN_HISTORY_VERSION = 1;

    function getEpisodeHash(season, episode, originalName) {
        // Згідно з документацією: [сезон][розділювач][епізод][оригінальна_назва]
        // Розділювач ':' додається тільки якщо сезон > 10
        const separator = season > 10 ? ':' : '';
        const hashString = [season, separator, episode, originalName].join('');
        return Lampa.Utils.hash(hashString);
    }

    function getMovieHash(movie) {
        // Для фільмів використовуємо оригінальну назву
        return Lampa.Utils.hash(movie.original_title || movie.title);
    }

    function toNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function normalizeTitle(title) {
        return String(title || '').trim().toLowerCase();
    }

    function getProgressTimestamp(progress) {
        return toNumber(
            progress.updated || progress.update || progress.timestamp || progress.date || progress.created,
            Date.now()
        );
    }

    function getResumeTime(progress) {
        return toNumber(progress.time, toNumber(progress.last_time, 0));
    }

    function formatEpisodeLabel(season, episode) {
        const seasonValue = String(toNumber(season, 0)).padStart(2, '0');
        const episodeValue = String(toNumber(episode, 0)).padStart(2, '0');
        return `S${seasonValue}E${episodeValue}`;
    }

    function getCurrentProfileId() {
        const profiles = Lampa.Storage.get('profiles') || {};
        const currentProfile = Lampa.Storage.get('current_profile') || 'default';
        return profiles[currentProfile]?.id || currentProfile;
    }

    function getHistoryStorageKey() {
        const profileId = getCurrentProfileId();
        return profileId !== 'default' ? `continue_history_${profileId}` : 'continue_history';
    }

    function loadOwnHistory() {
        try {
            const data = Lampa.Storage.get(getHistoryStorageKey());
            if (!data || typeof data !== 'object') {
                return { version: OWN_HISTORY_VERSION, items: {} };
            }

            if (!data.items || typeof data.items !== 'object') {
                data.items = {};
            }

            data.version = OWN_HISTORY_VERSION;
            return data;
        } catch (e) {
            console.log('Помилка читання власної історії:', e);
            return { version: OWN_HISTORY_VERSION, items: {} };
        }
    }

    function saveOwnHistory(history) {
        const payload = {
            version: OWN_HISTORY_VERSION,
            items: history.items || {}
        };

        Lampa.Storage.set(getHistoryStorageKey(), payload);
        return payload;
    }

    function saveProgressEntry(entry) {
        if (!entry || !entry.hash) return;

        const history = loadOwnHistory();
        const existing = history.items[entry.hash] || {};

        history.items[entry.hash] = {
            ...existing,
            ...entry,
            updated: getProgressTimestamp(entry)
        };

        saveOwnHistory(history);
    }

    function getSavedStateByHash(hash) {
        if (!hash) return null;

        const history = loadOwnHistory();
        const state = history.items[hash];

        return state || null;
    }

    // Функція для пошуку останнього переглянутого епізоду серіалу у ВЛАСНІЙ історії
    function findLastWatchedForSerial(movie) {
        try {
            const history = loadOwnHistory();
            const knownTitles = [movie.original_name, movie.title, movie.original_title]
                .map(normalizeTitle)
                .filter(Boolean);

            if (!knownTitles.length) return null;

            console.log('Пошук серіалу у власній історії:', knownTitles);

            let lastWatched = null;
            let bestTimestamp = -1;
            let bestTime = -1;

            const items = Object.values(history.items);
            for (let i = 0; i < items.length; i++) {
                const progress = items[i];
                if (!progress) continue;

                const progressTitle = normalizeTitle(progress.movie || progress.title || progress.original_name || progress.original_title);
                const season = toNumber(progress.season, 0);
                const episode = toNumber(progress.episode, 0);
                const resumeTime = getResumeTime(progress);
                const percent = toNumber(progress.percent, 0);
                const timestamp = getProgressTimestamp(progress);

                if (knownTitles.includes(progressTitle) && season > 0 && episode > 0 && resumeTime > 0) {
                    if (timestamp > bestTimestamp || (timestamp === bestTimestamp && resumeTime > bestTime)) {
                        bestTimestamp = timestamp;
                        bestTime = resumeTime;
                        lastWatched = {
                            hash: progress.hash,
                            season: season,
                            episode: episode,
                            time: resumeTime,
                            percent: percent
                        };
                    }
                }
            }

            return lastWatched;
        } catch (e) {
            console.log('Помилка пошуку серіалу у власній історії:', e);
            return null;
        }
    }

    function createHistoryEntryFromTimeline(data) {
        if (!data || typeof data !== 'object') return null;

        const season = toNumber(data.season, 0);
        const episode = toNumber(data.episode, 0);
        const isSerial = season > 0 && episode > 0;

        const originalName = data.original_name || data.movie || data.title || data.original_title;
        const moviePayload = {
            original_title: data.original_title,
            title: data.movie || data.title,
            original_name: data.original_name
        };

        const hash = data.hash || (isSerial
            ? getEpisodeHash(season, episode, originalName)
            : getMovieHash(moviePayload));

        if (!hash) return null;

        return {
            hash,
            type: isSerial ? 'serial' : 'movie',
            season,
            episode,
            time: getResumeTime(data),
            percent: toNumber(data.percent, 0),
            movie: data.movie || data.title,
            title: data.title || data.movie,
            original_name: data.original_name,
            original_title: data.original_title,
            updated: getProgressTimestamp(data)
        };
    }

    function addContinueButton(movie, season = null, episode = null, savedState = null) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        const isSerial = movie.type === 'serial' || movie.type === 'series' || movie.serial === true;

        let hash;
        let state;
        let displayInfo = '';

        if (isSerial) {
            const originalName = movie.original_name || movie.title || movie.original_title;

            if (season && episode) {
                hash = getEpisodeHash(season, episode, originalName);
                state = getSavedStateByHash(hash);
                displayInfo = formatEpisodeLabel(season, episode);
            } else {
                const lastWatched = savedState || findLastWatchedForSerial(movie);

                if (lastWatched) {
                    hash = lastWatched.hash;
                    state = {
                        time: lastWatched.time,
                        percent: lastWatched.percent
                    };
                    displayInfo = formatEpisodeLabel(lastWatched.season, lastWatched.episode);

                    season = lastWatched.season;
                    episode = lastWatched.episode;
                }
            }
        } else {
            hash = getMovieHash(movie);
            state = getSavedStateByHash(hash);
        }

        if (!state || !state.time || state.time === 0) {
            console.log('Немає прогресу у власній історії для', isSerial ? 'серіалу' : 'фільму');
            return;
        }

        let subText = '';
        if (state.time > 0) {
            const totalSeconds = state.time;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);

            let timeString = '';
            if (hours > 0) {
                timeString = `${hours}г ${minutes}хв`;
            } else if (minutes > 0) {
                timeString = `${minutes}хв ${seconds}сек`;
            } else {
                timeString = `${seconds}сек`;
            }

            const percentText = state.percent > 0 ? `${Math.round(state.percent)}% • ` : '';
            subText = `${displayInfo ? displayInfo + ' • ' : ''}${percentText}${timeString}`;
        }

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
                        Lampa.Player.play(movie, state.time, {
                            season: season,
                            episode: episode,
                            episode_data: episodeData
                        });
                        return;
                    }
                }

                Lampa.Player.play(movie, state.time, {
                    season: season,
                    episode: episode
                });
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

        console.log(`✅ Кнопка "Продовжити" додана з власної історії для ${isSerial ? 'серіалу' : 'фільму'}`);
    }

    function init() {
        console.log('Ініціалізація плагіна "Продовжити перегляд" (власна історія)');

        Lampa.Listener.follow('full', function (e) {
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

        Lampa.Listener.follow('timeline', function (e) {
            if (e.type !== 'update') return;

            const entry = createHistoryEntryFromTimeline(e.data);
            if (!entry || !entry.time) return;

            saveProgressEntry(entry);
            console.log('Оновлено власну історію:', entry);
        });
    }

    if (window.Lampa) {
        if (Lampa.Listener) {
            init();
        } else {
            document.addEventListener('lampa', init);
        }
    } else {
        document.addEventListener('lampa', init);
    }

    console.log('🚀 Плагін "Продовжити перегляд" завантажено');
})();
