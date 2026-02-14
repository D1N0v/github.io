(function () {
    'use strict';

    function addContinueButton(movie, season = null, episode = null) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        // Формування хешу
        let hash;
        if (season !== null && episode !== null) {
            // Для серіалів: добавляємо ':' тільки якщо сезон > 10
            const separator = season > 10 ? ':' : '';
            const hashString = [season, separator, episode, movie.original_name || movie.original_title].join('');
            hash = Lampa.Utils.hash(hashString);
        } else {
            // Для фільмів
            hash = Lampa.Utils.hash(movie.original_title || movie.title);
        }

        // Отримуємо стан прогресу
        const state = Lampa.Timeline.view(hash);

        // Текст під кнопкою
        let subText = 'З початку';
        if (state && state.percent > 0) {
            subText = `${state.percent}% • ${Math.floor(state.time/60)}хв ${Math.floor(state.time % 60)}сек`;
        }

        // Створюємо кнопку
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

        // Функція запуску плеєра з останнього часу
        const playHandler = () => {
            if (state && state.time) Lampa.Player.play(movie, state.time);
            else Lampa.Player.play(movie);
        };

        button.addEventListener('hover:enter', playHandler);
        button.addEventListener('click', playHandler);

        // Додаємо кнопку першою
        container.prepend(button);
        console.log('Кнопка "Продовжити" додана на сторінку');
    }

    function init() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;

            const movie = e.data.movie;
            const season = e.data.season;   // беремо сезон, якщо серіал
            const episode = e.data.episode; // беремо епізод, якщо серіал

            // Додаємо кнопку після невеликої затримки
            setTimeout(() => addContinueButton(movie, season, episode), 400);
        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
