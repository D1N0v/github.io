(function() {
    'use strict';

    function init() {
        // Слухаємо, коли сторінка фільму повністю завантажена
        Lampa.Listener.follow('full', function(e) {

            if (e.type !== 'complite') return;

            // Створюємо кнопку
            const button = $(`
                <div class="button selector my-continue-btn">
                    <div class="button__icon">
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                    <div class="button__text">Продовжити</div>
                </div>
            `);

            // Просто виводимо повідомлення при натисканні
            button.on('hover:enter', function(){
                alert('Кнопка натиснута!');
            });

            // Додаємо кнопку після стандартних кнопок
            $('.full-start').after(button);
        });
    }

    // Ініціалізація плагіна
    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
