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
        let sourceLink = null;

        if (isSerial) {
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
            sourceLink = lastEpisode.source || null;
            displayText = `S${season}E${episode} • ${percent}% • ${formatTime(time)}`;

        } else {
            const hash = Lampa.Utils.hash(movie.original_title || movie.title);
            const state = Lampa.Timeline.view(hash);
            if(!state || state.time <=0) return;

            time = state.time;
            percent = state.percent;
            sourceLink = state.source || null;
            displayText = `${percent}% • ${formatTime(time)}`;
        }

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

        // Встановлюємо подію відтворення з джерелом
        button.addEventListener('hover:enter', ()=>playMovie(movie, season, episode, time, sourceLink));
        button.addEventListener('click', ()=>playMovie(movie, season, episode, time, sourceLink));

        const existingButtons = container.querySelectorAll('.full-start__button');
        if(existingButtons.length>0) container.insertBefore(button, existingButtons[0]);
        else container.appendChild(button);

        console.log(`✅ Кнопка "Продовжити" додана для ${isSerial?'серіалу':'фільму'}`);
    }

    function playMovie(movie, season, episode, time, source){
        const isSerial = movie.type === 'serial' || movie.type === 'series' || movie.serial === true;

        const options = {season, episode, episode_data: undefined};
        if(source) options.source = source; // додаємо джерело

        if(isSerial && season && episode){
            if(movie.seasons && movie.seasons[season-1]){
                const epData = movie.seasons[season-1].episodes[episode-1];
                if(epData) options.episode_data = epData;
            }
            Lampa.Player.play(movie, time, options);
        } else {
            Lampa.Player.play(movie, time, options);
        }
    }

    // Під час відтворення зберігаємо джерело
    Lampa.Listener.follow('player_start', e=>{
        const movie = e.data.movie;
        const time = e.data.time || 0;
        const percent = e.data.percent || 0;
        const source = e.data.source || null;
        const season = e.data.season;
        const episode = e.data.episode;

        if(movie && time>0){
            const originalName = movie.original_name || movie.original_title || movie.title;
            if(originalName){
                const viewed = Lampa.Storage.get('file_view') || {};
                const hash = season && episode
                    ? Lampa.Utils.hash([season, season>10?':':'', episode, originalName].join(''))
                    : Lampa.Utils.hash(originalName);

                viewed[hash] = {time, percent, source};
                Lampa.Storage.set('file_view', viewed);
            }
        }
    });

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

    console.log('🚀 Плагін "Продовжити" із збереженням джерела завантажено');
})();
