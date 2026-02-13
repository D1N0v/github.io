(function () {
    'use strict';

    function formatTime(sec) {
        sec = Math.floor(sec || 0);
        let h = Math.floor(sec / 3600);
        let m = Math.floor((sec % 3600) / 60);
        let s = sec % 60;

        if (h > 0)
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        else
            return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function findContinue(movie) {

        const continues = Lampa.Favorite.continues();

        // шукаємо по всіх можливих варіантах id
        let item = continues
            .filter(i =>
                i.id == movie.id ||
                i.card_id == movie.id ||
                i.original_id == movie.id
            )
            .sort((a, b) => (b.time || 0) - (a.time || 0))[0];

        return item || null;
    }

    function addContinueButton(movie) {

        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;

        if (document.querySelector('.button--continue')) return;

        const item = findContinue(movie);

        let subText = 'З початку';
        let startTime = 0;

        if (item && item.time) {
            startTime = item.time;

            if (item.season && item.episode) {
                subText = `S${item.season}E${item.episode} • ${formatTime(item.time)}`;
            } else {
                subText = formatTime(item.time);
            }
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

        button.addEventListener('hover:enter', function () {
            Lampa.Player.play(movie, startTime);
        });

        button.addEventListener('click', function () {
            Lampa.Player.play(movie, startTime);
        });

        // 👉 Робимо кнопку першою
        container.prepend(button);
    }

    function init() {

        Lampa.Listener.follow('full', function (e) {

            if (e.type !== 'complite') return;

            setTimeout(function () {
                addContinueButton(e.data.movie);
            }, 400);

        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
