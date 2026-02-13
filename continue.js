(function() {
    'use strict';

    function init() {

        Lampa.Listener.follow('full', function(e) {
            if (e.type !== 'complite') return;

            // Перевіряємо кожні 100мс, поки не з'явиться контейнер для кнопок
            const interval = setInterval(function() {
                const container = document.querySelector('.full-start');
                if (!container) return;

                clearInterval(interval); // контейнер знайшли — зупиняємо чекання

                // Створюємо кнопку
                const button = document.createElement('div');
                button.className = 'button selector my-continue-btn';
                button.innerHTML = `
                    <div class="button__icon">
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                    <div class="button__text">Продовжити</div>
                `;

                // Для тесту — повідомлення при натисканні
                button.addEventListener('hover:enter', function() {
                    alert('Кнопка натиснута!');
                });

                // Додаємо кнопку після існуючої
                container.after(button);

            }, 100);

        });

    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
