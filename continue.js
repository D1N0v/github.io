(function () {
    'use strict';

    function addButton(movie) {

        let buttons = document.querySelector('.full__buttons');
        if (!buttons) return;

        // не додаємо двічі
        if (document.querySelector('.continue-btn')) return;

        let btn = document.createElement('div');
        btn.className = 'full__button selector continue-btn';
        btn.innerHTML = `
            <div class="full__button-icon">
                <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M8 5v14l11-7z"/>
                </svg>
            </div>
            <div class="full__button-text">Продовжити</div>
        `;

        // підтримка пульта
        btn.addEventListener('hover:enter', function () {
            Lampa.Noty.show('Продовжити натиснуто');
        });

        // підтримка миші
        btn.addEventListener('click', function () {
            Lampa.Noty.show('Продовжити натиснуто');
        });

        buttons.appendChild(btn);
    }

    function init() {

        Lampa.Listener.follow('full', function (e) {

            if (e.type !== 'complite') return;

            // невелика затримка щоб DOM повністю намалювався
            setTimeout(function () {
                addButton(e.data.movie);
            }, 300);

        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
