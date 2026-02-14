(function () {
    'use strict';

    function addContinueButton(movie) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        const originalTitle = movie.original_title || movie.title;
        const hash = Lampa.Utils.hash(originalTitle);
        const state = Lampa.Timeline.view(hash);

        // Текст під кнопкою
        let subText = 'З початку';
        if (state && state.percent > 0) {
            subText = `${state.percent}% • ${Math.floor(state.time/60)}хв ${Math.floor(state.time%60)}сек`;
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
        sub.style.fontSize = '12px';
        sub.style.opacity = '0.6';
        sub.style.marginTop = '4px';
        sub.style.maxWidth = '170px';
        sub.style.whiteSpace = 'nowrap';
        sub.style.overflow = 'hidden';
        sub.style.textOverflow = 'ellipsis';

        // Функція запуску плеєра з останнього часу
        const playHandler = () => {
            if (state && state.time) {
                Lampa.Player.play(movie, state.time);
            } else {
                Lampa.Player.play(movie);
            }
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

            // Додаємо невелику затримку, щоб кнопки намалювалися
            setTimeout(() => addContinueButton(e.data.movie), 400);
        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
