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

    function toNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function normalizeTitle(title) {
        return String(title || '').trim().toLowerCase();
    }

    function getProgressTimestamp(progress) {
        return toNumber(
            progress.updated || progress.update || progress.timestamp || progress.date || progress.created,
            0
        );
    }

    function getResumeTime(progress) {
        return toNumber(progress.time, toNumber(progress.last_time, 0));
    }

    function formatEpisodeLabel(season, episode) {
        const seasonValue = String(toNumber(season, 0)).padStart(2, '0');
        const episodeValue = String(toNumber(episode, 0)).padStart(2, '0');
        return `S${seasonValue}E${episodeValue}`;
    }

    // Функція для отримання всіх збережених прогрессів
    function getAllSavedProgress() {
        try {
            const profiles = Lampa.Storage.get('profiles') || {};
            const currentProfile = Lampa.Storage.get('current_profile') || 'default';
            const profileId = profiles[currentProfile]?.id || currentProfile;
            
            // Шукаємо в localStorage ключі з прогресом
            const fileViewKey = profileId !== 'default' ? `file_view_${profileId}` : 'file_view';
            const savedProgress = Lampa.Storage.get(fileViewKey) || {};
            
            console.log('Знайдено прогреси:', savedProgress);
            return savedProgress;
        } catch (e) {
            console.log('Помилка отримання прогресу:', e);
            return {};
        }
    }

    // Функція для пошуку останнього переглянутого епізоду серіалу
    function findLastWatchedForSerial(movie) {
        try {
            const savedProgress = getAllSavedProgress();
            const knownTitles = [movie.original_name, movie.title, movie.original_title]
                .map(normalizeTitle)
                .filter(Boolean);
            
            if (!knownTitles.length) return null;
            
            console.log('Пошук для серіалу:', knownTitles);
            
            let lastWatched = null;
            let bestTimestamp = -1;
            let bestTime = -1;
            
            // Перебираємо всі збережені прогреси
            for (let hash in savedProgress) {
                const progress = savedProgress[hash];
                if (!progress) continue;

                const progressTitle = normalizeTitle(progress.movie || progress.title || progress.original_name || progress.original_title);
                const season = toNumber(progress.season, 0);
                const episode = toNumber(progress.episode, 0);
                const resumeTime = getResumeTime(progress);
                const percent = toNumber(progress.percent, 0);
                const timestamp = getProgressTimestamp(progress);
                
                // Перевіряємо чи це епізод нашого серіалу
                if (knownTitles.includes(progressTitle) && season > 0 && episode > 0 && resumeTime > 0) {
                    console.log('Знайдено епізод:', progress, 'hash:', hash);
                    
                    // Пріоритет: остання дата оновлення, потім час перегляду
                    if (timestamp > bestTimestamp || (timestamp === bestTimestamp && resumeTime > bestTime)) {
                        bestTimestamp = timestamp;
                        bestTime = resumeTime;
                        lastWatched = {
                            hash: hash,
                            season: season,
                            episode: episode,
                            time: resumeTime,
                            percent: percent
                        };
                    }
                }
            }
            
            return lastWatched;
        } catch (e) {
            console.log('Помилка пошуку серіалу:', e);
            return null;
        }
    }

    function addContinueButton(movie, season = null, episode = null, savedState = null) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        // Визначаємо чи це серіал
        const isSerial = movie.type === 'serial' || movie.type === 'series' || movie.serial === true;
        
        let hash;
        let state;
        let displayInfo = '';
        
        if (isSerial) {
            // Для серіалів
            const originalName = movie.original_name || movie.title || movie.original_title;
            
            // Якщо передано конкретний епізод
            if (season && episode) {
                hash = getEpisodeHash(season, episode, originalName);
                state = Lampa.Timeline.view(hash);
                displayInfo = formatEpisodeLabel(season, episode);
            } else {
                // Шукаємо останній переглянутий епізод
                const lastWatched = savedState || findLastWatchedForSerial(movie);
                
                if (lastWatched) {
                    hash = lastWatched.hash;
                    state = {
                        time: lastWatched.time,
                        percent: lastWatched.percent
                    };
                    displayInfo = formatEpisodeLabel(lastWatched.season, lastWatched.episode);
                    
                    // Оновлюємо season/episode для запуску
                    season = lastWatched.season;
                    episode = lastWatched.episode;
                }
            }
        } else {
            // Для фільмів
            hash = getMovieHash(movie);
            state = Lampa.Timeline.view(hash);
        }

        // Якщо немає збереженого прогресу, не показуємо кнопку
        if (!state || !state.time || state.time === 0) {
            console.log('Немає прогресу для', isSerial ? 'серіалу' : 'фільму');
            return;
        }

        // Форматуємо текст прогресу
        let subText = '';
        if (state.time > 0) {
            const totalSeconds = state.time;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = Math.floor(totalSeconds % 60);
            
            let timeString = '';
            if (hours > 0) {
                timeString = `${hours}г ${minutes}хв`;
            } else if (minutes > 0) {
                timeString = `${minutes}хв ${seconds}сек`;
            } else {
                timeString = `${seconds}сек`;
            }
            
            const percentText = state.percent > 0 ? `${Math.round(state.percent)}% • ` : '';
            subText = `${displayInfo ? displayInfo + ' • ' : ''}${percentText}${timeString}`;
        }

        console.log('Додаємо кнопку з даними:', {
            isSerial,
            displayInfo,
            state,
            hash
        });

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
            if (isSerial && season && episode) {
                // Для серіалів потрібно знайти правильний епізод
                console.log('Запуск серіалу:', { season, episode, time: state.time });
                
                // Шукаємо серію в даних
                if (movie.seasons && movie.seasons[season-1]) {
                    const episodeData = movie.seasons[season-1].episodes[episode-1];
                    if (episodeData) {
                        Lampa.Player.play(movie, state.time, {
                            season: season,
                            episode: episode,
                            episode_data: episodeData
                        });
                        return;
                    }
                }
                
                // Якщо не знайшли, пробуємо просто запустити
                Lampa.Player.play(movie, state.time, {
                    season: season,
                    episode: episode
                });
            } else {
                // Для фільмів просто запускаємо з часу
                Lampa.Player.play(movie, state.time);
            }
        };

        button.addEventListener('hover:enter', playHandler);
        button.addEventListener('click', playHandler);

        // Додаємо кнопку на початок контейнера
        const existingButtons = container.querySelectorAll('.full-start__button');
        if (existingButtons.length > 0) {
            container.insertBefore(button, existingButtons[0]);
        } else {
            container.appendChild(button);
        }
        
        console.log(`✅ Кнопка "Продовжити" додана для ${isSerial ? 'серіалу' : 'фільму'}`);
    }

    function init() {
        console.log('Ініціалізація плагіна "Продовжити перегляд"');
        
        Lampa.Listener.follow('full', function (e) {
            if (e.type !== 'complite') return;

            const movie = e.data.movie;
            
            console.log('Отримано дані фільму/серіалу:', movie);
            
            // Затримка для завантаження DOM
            setTimeout(() => {
                // Перевіряємо чи є дані про поточний епізод
                const season = e.data.season;
                const episode = e.data.episode;
                
                if (season && episode) {
                    // Якщо відкрито конкретний епізод
                    addContinueButton(movie, season, episode);
                } else {
                    // Якщо відкрито сторінку фільму/серіалу
                    addContinueButton(movie);
                }
            }, 800); // Збільшив затримку для кращого завантаження
        });

        // Слухаємо подію зміни плеєра
        Lampa.Listener.follow('player', function (e) {
            if (e.type === 'destroy') {
                // Можна оновити сторінку після завершення перегляду
                console.log('Плеєр закрито');
            }
        });

        // Також слухаємо подію зміни прогресу
        Lampa.Listener.follow('timeline', function (e) {
            if (e.type === 'update') {
                console.log('Оновлено прогрес:', e.data);
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

    console.log('🚀 Плагін "Продовжити перегляд" завантажено');
})();
