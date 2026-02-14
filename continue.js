(function () {
    'use strict';

    function getEpisodeHash(season, episode, originalName) {
        // Згідно з документацією: [сезон][розділювач][епізод][оригінальна_назва]
        // Розділювач ':' додається тільки якщо сезон > 10
        const separator = season > 10 ? ':' : '';
        const hashString = [season, separator, episode, originalName].join('');
        return Lampa.Utils.hash(hashString);
    }

    function getMovieHash(movie) {
        // Для фільмів використовуємо оригінальну назву
        return Lampa.Utils.hash(movie.original_title || movie.title);
    }

    function addContinueButton(movie, season = null, episode = null) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        // Визначаємо чи це серіал
        const isSerial = season !== null && episode !== null;
        
        // Формуємо хеш згідно з документацією
        let hash;
        let displayInfo = '';
        
        if (isSerial) {
            // Для серіалів використовуємо оригінальну назву серіалу
            const originalName = movie.original_name || movie.title || movie.original_title;
            hash = getEpisodeHash(season, episode, originalName);
            displayInfo = `S${season}E${episode}`;
        } else {
            // Для фільмів
            hash = getMovieHash(movie);
        }

        // Отримуємо стан прогресу
        const state = Lampa.Timeline.view(hash);
        
        // Якщо немає збереженого прогресу, не показуємо кнопку
        if (!state || !state.time || state.time === 0) return;

        // Форматуємо текст прогресу
        let subText = '';
        if (state.percent > 0) {
            const hours = Math.floor(state.time / 3600);
            const minutes = Math.floor((state.time % 3600) / 60);
            const seconds = Math.floor(state.time % 60);
            
            let timeString = '';
            if (hours > 0) {
                timeString = `${hours}год ${minutes}хв`;
            } else {
                timeString = `${minutes}хв ${seconds}сек`;
            }
            
            subText = `${displayInfo ? displayInfo + ' • ' : ''}${state.percent}% • ${timeString}`;
        }

        // Створюємо кнопку
        const button = document.createElement('div');
        button.className = 'full-start__button selector button--continue';
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
            <span>Продовжити перегляд</span>
            <div class="continue-subtext">${subText}</div>
        `;

        // Стилізація підпису
        const sub = button.querySelector('.continue-subtext');
        sub.style.cssText = `
            font-size: 11px;
            opacity: 0.7;
            margin-top: 2px;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
        `;

        // Функція запуску плеєра з останнього часу
        const playHandler = () => {
            if (isSerial) {
                // Для серіалів потрібно передати сезон та епізод
                Lampa.Player.play(movie, state.time, {
                    season: season,
                    episode: episode,
                    movie: movie
                });
            } else {
                // Для фільмів просто запускаємо з часу
                Lampa.Player.play(movie, state.time);
            }
        };

        button.addEventListener('hover:enter', playHandler);
        button.addEventListener('click', playHandler);

        // Додаємо кнопку на початок контейнера
        container.prepend(button);
        
        console.log(`Кнопка "Продовжити" додана для ${isSerial ? 'серіалу' : 'фільму'}:`, {
            hash: hash,
            state: state,
            displayInfo: displayInfo
        });
    }

    // Додаткова функція для пошуку останнього переглянутого епізоду серіалу
    function getLastWatchedEpisode(movie) {
        try {
            // Отримуємо історію переглядів з watched_history
            const history = Lampa.Storage.get('online_watched_last');
            if (!history) return null;

            const movieId = movie.id;
            const movieType = movie.type;
            
            // Шукаємо останній переглянутий епізод для цього серіалу
            for (let key in history) {
                const item = history[key];
                if (item.id === movieId && item.type === movieType) {
                    return {
                        season: item.season,
                        episode: item.episode
                    };
                }
            }
        } catch (e) {
            console.log('Помилка отримання історії:', e);
        }
        return null;
    }

    function init() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;

            const movie = e.data.movie;
            
            // Затримка для завантаження DOM
            setTimeout(() => {
                // Спочатку перевіряємо чи є збережений прогрес для поточного епізоду
                const season = e.data.season;
                const episode = e.data.episode;
                
                if (season && episode) {
                    // Якщо відкрито конкретний епізод
                    addContinueButton(movie, season, episode);
                } else if (movie.type === 'serial' || movie.type === 'series') {
                    // Якщо відкрито сторінку серіалу, шукаємо останній переглянутий епізод
                    const lastWatched = getLastWatchedEpisode(movie);
                    if (lastWatched) {
                        addContinueButton(movie, lastWatched.season, lastWatched.episode);
                    }
                } else {
                    // Для фільмів
                    addContinueButton(movie);
                }
            }, 500);
        });

        // Також слухаємо подію зміни плеєра для оновлення прогресу
        Lampa.Listener.follow('player', function (e) {
            if (e.type === 'destroy') {
                // Можна оновити кнопку після завершення перегляду
                console.log('Плеєр закрито, прогрес оновлено');
            }
        });
    }

    // Ініціалізація плагіна
    if (window.Lampa) {
        if (Lampa.Listener) {
            init();
        } else {
            document.addEventListener('lampa', init);
        }
    } else {
        document.addEventListener('lampa', init);
    }

    console.log('Плагін "Продовжити перегляд" завантажено');
})();
