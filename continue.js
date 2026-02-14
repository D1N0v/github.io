(function () {
    'use strict';

    function getEpisodeProgress() {

        const episode = document.querySelector('.season-episode__body');
        if (!episode) return null;

        const title = episode.querySelector('.season-episode__title')?.textContent || '';
        const time = episode.querySelector('.season-episode__time')?.textContent || '';

        const progressEl = episode.querySelector('.time-line > div');
        if (!progressEl) return null;

        const width = progressEl.style.width || '0%';
        const percent = parseInt(width.replace('%', '')) || 0;

        if (percent <= 0) return null;

        return {
            title,
            time,
            percent
        };
    }

    function addContinueButton(movie) {

        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;

        if (document.querySelector('.button--continue')) return;

        const progress = getEpisodeProgress();

        let subText = 'З початку';

        if (progress) {
            subText = `${progress.title} • ${progress.time} • ${progress.percent}%`;
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
        sub.style.maxWidth = '160px';
        sub.style.whiteSpace = 'nowrap';
        sub.style.overflow = 'hidden';
        sub.style.textOverflow = 'ellipsis';

        button.addEventListener('hover:enter', function () {
            Lampa.Player.play(movie);
        });

        button.addEventListener('click', function () {
            Lampa.Player.play(movie);
        });

        container.prepend(button);
    }

    function init() {

        Lampa.Listener.follow('full', function (e) {

            if (e.type !== 'complite') return;

            // чекаємо поки серії намалюються
            setTimeout(function () {
                addContinueButton(e.data.movie);
            }, 600);

        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
