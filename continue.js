(function() {
    'use strict';

    function init() {

        Lampa.Listener.follow('full', function(e) {

            if (e.type !== 'complite') return;

            const movie = e.data.movie;

            // перевіряємо чи є запис у continues
            const continues = Lampa.Favorite.continues();
            const item = continues.find(i => i.id == movie.id);

            if (!item) return;

            // чекаємо поки намалюються кнопки
            setTimeout(function(){

                const button = $(
                    `<div class="button selector continue-btn">
                        <div class="button__icon">
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="M8 5v14l11-7z"/>
                            </svg>
                        </div>
                        <div class="button__text">Продовжити</div>
                    </div>`
                );

                button.on('hover:enter', function(){
                    Lampa.Player.play(movie);
                });

                $('.full-start').after(button);

            },300);

        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
