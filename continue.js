(function() {
    'use strict';

    const plugin = {
        name: 'continue_button',
        version: '1.0',
        init: function() {

            // Слухаємо подію відкриття повного перегляду фільму
            Lampa.Listener.follow('full', function(e) {

                if (e.type !== 'complite') return;

                const movie = e.data.movie;

                // Перевіряємо, чи є запис у continues (де ми зупинилися)
                const continues = Lampa.Favorite.continues();
                const item = continues.find(i => i.id == movie.id);

                if (!item) return;

                // Затримка для того, щоб кнопки встигли намалюватися
                setTimeout(function(){

                    // Створюємо кнопку
                    const button = $(`
                        <div class="button selector continue-btn">
                            <div class="button__icon">
                                <svg viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                            <div class="button__text">Продовжити</div>
                        </div>
                    `);

                    // При натисканні відтворюємо з останньої позиції
                    button.on('hover:enter', function(){
                        Lampa.Player.play(movie, item.time || 0);
                    });

                    // Додаємо кнопку після стандартних кнопок
                    $('.full-start').after(button);

                }, 300);

            });
        }
    };

    // Ініціалізація плагіна
    if (window.Lampa) plugin.init();
    else document.addEventListener('lampa', () => plugin.init());

})();
