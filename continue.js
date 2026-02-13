(function () {
    'use strict';

    function startPlugin() {

        Lampa.Listener.follow('full', function (e) {

            if (e.type !== 'complite') return;

            // Невелика затримка щоб DOM точно намалювався
            setTimeout(function () {

                let container = document.querySelector('.full-start');
                if (!container) return;

                // Якщо кнопка вже існує — не дублюємо
                if (document.querySelector('.continue-test-btn')) return;

                let button = document.createElement('div');
                button.className = 'button selector continue-test-btn';
                button.innerHTML = `
                    <div class="button__icon">
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                    <div class="button__text">Продовжити</div>
                `;

                // Підтримка пульта / клавіатури
                button.addEventListener('hover:enter', function () {
                    Lampa.Noty.show('Кнопка працює');
                });

                // Підтримка миші
                button.addEventListener('click', function () {
                    Lampa.Noty.show('Кнопка працює');
                });

                container.after(button);

            }, 500);
        });
    }

    if (window.Lampa) startPlugin();
    else document.addEventListener('lampa', startPlugin);

})();
