(function () {
    'use strict';

    function formatTime(sec){
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        if(h>0) return `${h}г ${m}хв`;
        if(m>0) return `${m}хв ${s}сек`;
        return `${s}сек`;
    }

    // ===== Перехоплюємо Player.play, щоб зберігати джерело =====
    if(Lampa && Lampa.Player){
        const originalPlay = Lampa.Player.play;
        Lampa.Player.play = function(movie, time, params){
            try {
                const url = (params && (params.url || params.file || params.stream)) || movie.url || null;
                if(url){
                    const viewed = Lampa.Storage.get('file_view') || {};
                    const originalName = movie.original_name || movie.original_title || movie.title;
                    let hash;

                    if(params && params.season && params.episode){
                        // Серіал
                        hash = Lampa.Utils.hash([params.season, params.season>10?':':'', params.episode, originalName].join(''));
                        viewed[hash] = {
                            time: time || 0,
                            percent: params.percent || 0,
                            source: url,
                            season: params.season,
                            episode: params.episode
                        };
                    } else {
                        // Фільм
                        hash = Lampa.Utils.hash(originalName);
                        viewed[hash] = {
                            time: time || 0,
                            percent: params.percent || 0,
                            source: url
                        };
                    }

                    Lampa.Storage.set('file_view', viewed);
                    console.log("💾 Збережено URL для продовження:", url);
                }
            } catch(err){
                console.warn("⚠️ Помилка збереження URL:", err);
            }

            return originalPlay.apply(this, arguments);
        };
        console.log("✅ Перехоплення Player.play активовано");
    }

    // ===== Створення кнопки «Продовжити» =====
    function addContinueButton(movie) {
        const container = document.querySelector('.full-start-new__buttons');
        if(!container) return;
        if(document.querySelector('.button--continue')) return;

        const isSerial = (movie.number_of_seasons && movie.number_of_seasons > 0) || Boolean(movie.first_air_date);
        let displayText = '';
        let time = 0, percent = 0, season, episode, source = null;

        if(isSerial){
            const activity = Lampa.Activity.active();
            if(!activity || !activity.card) return;
            const card = activity.card;
            const originalName = card.original_name || card.original_title;
            if(!originalName) return;

            const viewed = Lampa.Storage.get('file_view') || {};
            let lastEpisode = null;

            for(let s=1; s<=20; s++){
                for(let e=1; e<=50; e++){
                    const hash = Lampa.Utils.hash([s, s>10?':':'', e, originalName].join(''));
                    const progress = viewed[hash];
                    if(progress && progress.time>0){
                        if(!lastEpisode || s>lastEpisode.season || (s===lastEpisode.season && e>lastEpisode.episode)){
                            lastEpisode = {season:s, episode:e, time:progress.time, percent:progress.percent, source: progress.source};
                        }
                    }
                }
            }

            if(!lastEpisode) return;
            season = lastEpisode.season;
            episode = lastEpisode.episode;
            time = lastEpisode.time;
            percent = lastEpisode.percent;
            source = lastEpisode.source;
            displayText = `S${season}E${episode} • ${percent}% • ${formatTime(time)}`;
        } else {
            const hash = Lampa.Utils.hash(movie.original_title || movie.title);
            const state = Lampa.Storage.get('file_view')?.[hash];
            if(!state || state.time <=0) return;
            time = state.time;
            percent = state.percent;
            source = state.source;
            displayText = `${percent}% • ${formatTime(time)}`;
        }

        if(!source) return; // без джерела відтворювати нема сенсу

        const button = document.createElement('div');
        button.className = 'full-start__button selector button--continue';
        button.style.display = 'flex';
        button.style.flexDirection = 'column';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.gap = '2px';

        const top = document.createElement('div');
        top.style.display = 'flex';
        top.style.alignItems = 'center';
        top.style.gap = '4px';
        top.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
            <span class="continue-main">Продовжити</span>
        `;

        const sub = document.createElement('div');
        sub.className = 'continue-subtext';
        sub.textContent = displayText;
        sub.style.cssText = `
            font-size: 11px;
            opacity: 0.7;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        button.appendChild(top);
        button.appendChild(sub);

        button.addEventListener('hover:enter', ()=>playMovie(movie, season, episode, time, source));
        button.addEventListener('click', ()=>playMovie(movie, season, episode, time, source));

        const existingButtons = container.querySelectorAll('.full-start__button');
        if(existingButtons.length>0) container.insertBefore(button, existingButtons[0]);
        else container.appendChild(button);

        console.log(`✅ Кнопка "Продовжити" додана для ${isSerial?'серіалу':'фільму'}`);
    }

    function playMovie(movie, season, episode, time, source){
        const isSerial = movie.type === 'serial' || movie.type === 'series' || movie.serial === true;

        // Передаємо URL напряму в Player.play
        const params = {season, episode, episode_data: movie.seasons?.[season-1]?.episodes?.[episode-1], url: source};
        Lampa.Player.play(movie, time, params);
    }

    function init(){
        Lampa.Listener.follow('full', e=>{
            if(e.type!=='complite') return;
            const movie = e.data.movie;
            setTimeout(()=>addContinueButton(movie), 800);
        });
    }

    if(window.Lampa){
        if(Lampa.Listener) init();
        else document.addEventListener('lampa', init);
    } else {
        document.addEventListener('lampa', init);
    }

    console.log('🚀 Плагін "Продовжити" завантажено');
})();
