(function () {
    'use strict';

    function addContinueButton() {

        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;

        // Не дублюємо кнопку
        if (document.querySelector('.button--continue')) return;

        const button = document.createElement('div');
        button.className = 'full-start__button selector button--continue';

        button.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
            <span>Продовжити</span>
        `;

        // Підтримка пульта
        button.addEventListener('hover:enter', function () {
            Lampa.Noty.show('Продовжити натиснуто');
        });

        // Підтримка миші
        button.addEventListener('click', function () {
            Lampa.Noty.show('Продовжити натиснуто');
        });

        container.appendChild(button);
    }

    function init() {

        Lampa.Listener.follow('full', function (e) {

            if (e.type !== 'complite') return;

            // Чекаємо поки кнопки точно намалюються
            setTimeout(addContinueButton, 200);

        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
