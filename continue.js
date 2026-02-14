(function () {
    'use strict';

    // Отримуємо реальний прогрес з Timeline API
    function getRealProgress(movie) {
        if (!window.Lampa || !Lampa.Timeline) return null;

        let best = null;

        // Перебираємо серії
        document.querySelectorAll('.season-episode__body').forEach(ep => {
            const season = ep.querySelector('.season-episode__season')?.textContent.trim() || '';
            const episode = ep.querySelector('.season-episode__episode')?.textContent.trim() || '';

            // Формуємо ключ (як у внутрішній логіці Lampa)
            const hashKey = Lampa.Utils.hash([season, episode, movie.original_title].join(''));

            // Забираємо конкретний прогрес
            const state = Lampa.Timeline.view(hashKey);

            if (state && state.percent > 0) {
                if (!best || state.percent > best.percent) {
                    best = {
                        season,
                        episode,
                        percent: state.percent,
                        time: state.time,
                        duration: state.duration,
                        hashKey
                    };
                }
            }
        });

        return best;
    }

    // Створюємо кнопку «Продовжити»
    function addContinueButton(movie) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        const progress = getRealProgress(movie);

        let subText = 'З початку';
        if (progress) {
            subText = `Сезон ${progress.season} • Епізод ${progress.episode} • ${progress.percent}%`;
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
        sub.style.fontSize = '12px';
        sub.style.opacity = '0.6';
        sub.style.marginTop = '4px';
        sub.style.maxWidth = '170px';
        sub.style.whiteSpace = 'nowrap';
        sub.style.overflow = 'hidden';
        sub.style.textOverflow = 'ellipsis';

        const playHandler = () => {
            if (progress) {
                Lampa.Player.play(movie, progress.time);
            } else {
                Lampa.Player.play(movie);
            }
        };

        button.addEventListener('hover:enter', playHandler);
        button.addEventListener('click', playHandler);

        container.prepend(button);
    }

    // Чекаємо, поки DOM сезону/серій підвантажиться
    function waitForEpisodes(movie) {
        let tries = 0;

        const interval = setInterval(() => {
            tries++;
            const ep = document.querySelector('.season-episode__body');
            if (ep || tries > 50) {
                clearInterval(interval);
                addContinueButton(movie);
            }
        }, 300);
    }

    // Ініціалізація
    function init() {
        Lampa.Listener.follow('full', e => {
            if (e.type !== 'complite') return;
            setTimeout(() => waitForEpisodes(e.data.movie), 400);
        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
