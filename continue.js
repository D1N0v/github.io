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

    function addContinueButton(movie) {

        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;

        if (document.querySelector('.button--continue')) return;

        const continues = Lampa.Favorite.continues();
        const item = continues.find(i => i.id == movie.id);

        if (!item) return; // якщо немає збереженого перегляду — кнопку не показуємо

        let subText = '';

        if (item.season && item.episode) {
            subText = `S${item.season}E${item.episode} • ${formatTime(item.time)}`;
        } else {
            subText = formatTime(item.time);
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

        // Стилі підпису
        button.querySelector('.continue-subtext').style.fontSize = '12px';
        button.querySelector('.continue-subtext').style.opacity = '0.6';
        button.querySelector('.continue-subtext').style.marginTop = '4px';

        // Запуск з моменту зупинки
        button.addEventListener('hover:enter', function () {
            Lampa.Player.play(movie, item.time || 0);
        });

        button.addEventListener('click', function () {
            Lampa.Player.play(movie, item.time || 0);
        });

        // 👉 Робимо кнопку першою
        container.prepend(button);
    }

    function init() {

        Lampa.Listener.follow('full', function (e) {

            if (e.type !== 'complite') return;

            setTimeout(function () {
                addContinueButton(e.data.movie);
            }, 300);

        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
