(function() {
    'use strict';

    function init() {

        Lampa.Listener.follow('full', function(e) {

            if (e.type !== 'complite') return;

            const movie = e.data.movie;

            // Перевіряємо чи є прогрес
            const progress = Lampa.Timeline && Lampa.Timeline.get(movie);

            if (!progress || progress.percent < 5 || progress.percent >= 95) return;

            Lampa.Listener.send('full_start', {
                title: '▶ Продовжити перегляд',
                icon: 'play_arrow',
                onSelect: function() {

                    // Запускаємо стандартний механізм
                    Lampa.Player.play(movie);

                }
            });
        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
