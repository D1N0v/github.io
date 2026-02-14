(function () {
    'use strict';

    const STORAGE_KEY = 'lampa_continue_data';

    // --- Робота з localStorage ---
    function getData() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function setData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function saveProgress(movieId, seriesId, time, percent) {
        const data = getData();
        if (!data[movieId]) data[movieId] = {};
        data[movieId][seriesId || 'movie'] = { time, percent, timestamp: Date.now() };
        setData(data);
        console.log('Прогрес збережено', movieId, seriesId, time, percent);
    }

    function getProgress(movieId, seriesId) {
        const data = getData();
        return (data[movieId] && data[movieId][seriesId || 'movie']) || null;
    }

    // --- Створення кнопки «Продовжити» ---
    function addContinueButton(movie, seriesId) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        const state = getProgress(movie.id, seriesId);

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

        const sub = button.querySelector('.continue-subtext');
        sub.style.cssText = `
            font-size:12px;
            opacity:0.6;
            margin-top:4px;
            max-width:170px;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
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

    // --- Ініціалізація плагіна ---
    function init() {
        // Слухаємо події завершення перегляду фільму/серії
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;

            const movie = e.data.movie;
            const seriesId = e.data.seriesId || 'movie';
            const time = e.data.time || 0;
            const percent = e.data.percent || 0;

            saveProgress(movie.id, seriesId, time, percent);

            // Додаємо кнопку після невеликої затримки
            setTimeout(() => addContinueButton(movie, seriesId), 300);
        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
