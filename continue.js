(function () {
    'use strict';

    /*
        ==========================================
        ХЕШІ (як у Lampa)
        ==========================================
    */

    function getMovieHash(movie) {
        const title = movie.original_title || movie.title || '';
        return Lampa.Utils.hash(title);
    }

    function getEpisodeHash(season, episode, originalTitle) {
        // В Lampa separator використовується якщо season > 9
        const separator = season > 9 ? ':' : '';
        const hashString = season + separator + episode + originalTitle;
        return Lampa.Utils.hash(hashString);
    }

    /*
        ==========================================
        ПОШУК ОСТАННЬОЇ ПЕРЕГЛЯНУТОЇ СЕРІЇ
        ==========================================
    */

    function findLastWatchedEpisode(movie) {
        if (!movie.seasons || !movie.seasons.length) return null;

        const originalTitle =
            movie.original_name ||
            movie.original_title ||
            movie.title;

        let last = null;
        let maxTime = 0;

        movie.seasons.forEach(seasonObj => {
            if (!seasonObj.episodes) return;

            seasonObj.episodes.forEach(episodeObj => {
                const season = seasonObj.season_number;
                const episode = episodeObj.episode_number;

                const hash = getEpisodeHash(season, episode, originalTitle);
                const state = Lampa.Timeline.view(hash);

                if (state && state.time && state.time > maxTime) {
                    maxTime = state.time;

                    last = {
                        hash,
                        season,
                        episode,
                        time: state.time,
                        percent: state.percent || 0,
                        episodeData: episodeObj
                    };
                }
            });
        });

        return last;
    }

    /*
        ==========================================
        ДОДАВАННЯ КНОПКИ
        ==========================================
    */

    function addContinueButton(movie) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        const isSerial =
            movie.type === 'serial' ||
            movie.type === 'series' ||
            movie.serial === true;

        let state = null;
        let season = null;
        let episode = null;
        let episodeData = null;
        let displayInfo = '';

        /*
            ====== СЕРІАЛ ======
        */
        if (isSerial) {
            const last = findLastWatchedEpisode(movie);
            if (!last) return;

            state = {
                time: last.time,
                percent: last.percent
            };

            season = last.season;
            episode = last.episode;
            episodeData = last.episodeData;
            displayInfo = `S${season}E${episode}`;
        }

        /*
            ====== ФІЛЬМ ======
        */
        else {
            const hash = getMovieHash(movie);
            const view = Lampa.Timeline.view(hash);

            if (!view || !view.time) return;

            state = view;
        }

        if (!state || !state.time || state.time <= 0) return;

        /*
            ==========================================
            ФОРМУЄМО ТЕКСТ
            ==========================================
        */

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

        const subText =
            (displayInfo ? displayInfo + ' • ' : '') +
            Math.round(state.percent || 0) +
            '% • ' +
            timeString;

        /*
            ==========================================
            СТВОРЮЄМО КНОПКУ
            ==========================================
        */

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
            max-width: 220px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        /*
            ==========================================
            ЗАПУСК ПЛЕЄРА
            ==========================================
        */

        const playHandler = () => {
            if (isSerial) {
                Lampa.Player.play(movie, state.time, {
                    season,
                    episode,
                    episode_data: episodeData
                });
            } else {
                Lampa.Player.play(movie, state.time);
            }
        };

        button.addEventListener('hover:enter', playHandler);
        button.addEventListener('click', playHandler);

        const firstButton = container.querySelector('.full-start__button');
        if (firstButton) {
            container.insertBefore(button, firstButton);
        } else {
            container.appendChild(button);
        }

        console.log('✅ Кнопка "Продовжити" додана');
    }

    /*
        ==========================================
        INIT
        ==========================================
    */

    function init() {
        console.log('🚀 Continue Plugin Init');

        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;

            const movie = e.data.movie;

            setTimeout(() => {
                addContinueButton(movie);
            }, 600);
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

})();
