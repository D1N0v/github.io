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

    function addContinueButton(movie) {
        const container = document.querySelector('.full-start-new__buttons');
        if (!container) return;
        if (document.querySelector('.button--continue')) return;

        const isSerial = 
    (movie.number_of_seasons && movie.number_of_seasons > 0) ||
    Boolean(movie.first_air_date);


        let displayText = '';
        let time = 0;
        let percent = 0;
        let season, episode;

        if (isSerial) {
            // ==== Логіка з перевіреного коду ====
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
                            lastEpisode = {season:s, episode:e, time:progress.time, percent:progress.percent};
                        }
                    }
                }
            }

            if(!lastEpisode) return;

            season = lastEpisode.season;
            episode = lastEpisode.episode;
            time = lastEpisode.time;
            percent = lastEpisode.percent;
            displayText = `S${season}E${episode} • ${percent}% • ${formatTime(time)}`;

        } else {
            // ==== Для фільмів ====
            const hash = Lampa.Utils.hash(movie.original_title || movie.title);
            const state = Lampa.Timeline.view(hash);
            if(!state || state.time <=0) return;

            time = state.time;
            percent = state.percent;
            displayText = `${percent}% • ${formatTime(time)}`;
        }

        // ==== Створення кнопки ====
        const button = document.createElement('div');
        button.className = 'full-start__button selector button--continue';
        button.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
            <span>Продовжити перегляд</span>
            <div class="continue-subtext">${displayText}</div>
        `;

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

        button.addEventListener('hover:enter', ()=>playMovie(movie, season, episode, time));
        button.addEventListener('click', ()=>playMovie(movie, season, episode, time));

        const existingButtons = container.querySelectorAll('.full-start__button');
        if(existingButtons.length>0) container.insertBefore(button, existingButtons[0]);
        else container.appendChild(button);

        console.log(`✅ Кнопка "Продовжити" додана для ${isSerial?'серіалу':'фільму'}`);
    }

    function playMovie(movie, season, episode, time){
        const isSerial = movie.type === 'serial' || movie.type === 'series' || movie.serial === true;
        if(isSerial && season && episode){
            if(movie.seasons && movie.seasons[season-1]){
                const epData = movie.seasons[season-1].episodes[episode-1];
                if(epData){
                    Lampa.Player.play(movie, time, {season, episode, episode_data: epData});
                    return;
                }
            }
            Lampa.Player.play(movie, time, {season, episode});
        } else {
            Lampa.Player.play(movie, time);
        }
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

    console.log('🚀 Плагін "Продовжити перегляд" завантажено');
})();
