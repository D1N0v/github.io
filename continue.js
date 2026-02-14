(function () {
    'use strict';

  function getEpisodeProgress() {
    const episodes = document.querySelectorAll('.season-episode__body');
    if (!episodes.length) return null;

    let best = null;

    episodes.forEach(ep => {
        // шукаємо саме внутрішній прогрес
        const progressEl = ep.querySelector('.season-episode__timeline div div');
        if (!progressEl) return;

        const styleWidth = progressEl.style.width || '';
        let percent = 0;

        // інколи width може бути у вигляді "45%" або "45.0%"
        if (styleWidth.includes('%')) {
            percent = parseInt(styleWidth.replace('%','')) || 0;
        }

        if (percent <= 0) return;

        if (!best || percent > best.percent) {
            const title = ep.querySelector('.season-episode__title')?.textContent?.trim() || '';
            const time = ep.querySelector('.season-episode__time')?.textContent?.trim() || '';
            best = { title, time, percent };
        }
    });

    return best;
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
        sub.style.maxWidth = '170px';
        sub.style.whiteSpace = 'nowrap';
        sub.style.overflow = 'hidden';
        sub.style.textOverflow = 'ellipsis';

        button.addEventListener('hover:enter', function () {
            Lampa.Player.play(movie);
        });

        button.addEventListener('click', function () {
            Lampa.Player.play(movie);
        });

        // 👉 Кнопка стає першою
        container.prepend(button);
    }

  function waitForEpisodes(movie) {
    let tries = 0;

    const interval = setInterval(() => {
        tries++;

        const progressFound = document.querySelector('.season-episode__timeline div div');
        if (progressFound || tries > 50) { // пробуємо довше
            clearInterval(interval);
            addContinueButton(movie);
        }
    }, 300);
}

    function init() {

        Lampa.Listener.follow('full', function (e) {

            if (e.type !== 'complite') return;

            // невелика пауза щоб намалювались кнопки
            setTimeout(function () {
                waitForEpisodes(e.data.movie);
            }, 400);

        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();


