(function() {
    'use strict';

    const PLUGIN_NAME = 'continue_button';

    function init() {

        // Додаємо кнопку на сторінку фільму / серіалу
        Lampa.Listener.follow('full', function(e) {

            if (e.type !== 'complite') return;

            const movie = e.data.movie;
            const history = Lampa.Favorite.continues().find(i => i.id == movie.id);

            if (!history) return;

            // Додаємо кнопку
            Lampa.Listener.send('full_start', {
                title: '▶ Продовжити перегляд',
                icon: 'play_arrow',
                onSelect: function() {

                    // Lampa сама пам’ятає:
                    // джерело
                    // переклад
                    // серію
                    // таймкод

                    Lampa.Activity.push({
                        url: movie.url,
                        component: 'player',
                        method: 'play',
                        card: movie
                    });

                }
            });
        });
    }

    if (window.Lampa) init();
    else document.addEventListener('lampa', init);

})();
