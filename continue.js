(function () {
    'use strict';

    const STORAGE_KEY = 'lampa_continue_data';

    function getContinueData() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch(e) {
            return {};
        }
    }

    function setContinueData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function saveProgress(movieId, seriesId, time, percent) {
        const data = getContinueData();
        if (!data[movieId]) data[movieId] = {};
        data[movieId][seriesId || 'movie'] = { time, percent, timestamp: Date.now() };
        setContinueData(data);
    }

    function getProgress(movieId, seriesId) {
        const data = getContinueData();
        return (data[movieId] && data[movieId][seriesId || 'movie']) || null;
    }

    function addContinueButton(movie, seriesId) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        const state = getProgress(movie.id, seriesId);

        // Текст під кнопкою
        let subText = 'З початку';
        if (state && state.percent > 0) {
            subText = `${state.percent}% • ${Math.floor(state.time/60)}хв ${Math.floor(state.time%60)}сек`;
        }

        const button = document.createElement('div');
        button.className = 'full-start__button selector button--continue';
        button.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
            <span>Продовжити</span>
            <div class="continue-subtext">${subText}</div>
        `;

        button.querySelector('.continue-subtext').style.cssText = `
            font-size:12px; opacity:0.6; margin-top:4px; max-width:170px;
            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        `;

        const playHandler = () => {
            if (state && state.time) Lampa.Player.play(movie, state.time);
            else Lampa.Player.play(movie);
        };

        button.addEventListener('hover:enter', playHandler);
        button.addEventListener('click', playHandler);

        container.prepend(button);
        console.log('Кнопка "Продовжити" додана на сторінку');
    }

    function init() {
        // Слухаємо, коли користувач дивиться щось
        Lampa.Listener.follow('player', function(e) {
            if (e.type !== 'timeupdate') return;
            // movieId, seriesId, поточний час, відсоток прогресу
            saveProgress(e.data.movie.id, e.data.seriesId, e.data.time, e.data.percent);
        });

        // Додаємо кнопку на сторінку фільму/серіалу
        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;
            setTimeout(() => addContinueButton(e.data.movie, e.data.seriesId), 400);
        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
