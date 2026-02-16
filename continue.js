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

    function addContinueButton(movie){
        const container = document.querySelector('.full-start-new__buttons');
        if(!container) return;
        if(document.querySelector('.button--continue')) return;

        const viewed = Lampa.Storage.get('file_view') || {};
        const originalName = movie.original_name || movie.original_title || movie.title;

        // ==== шукаємо останню серію або фільм ====
        let last = null;

        // серіал
        if(movie.number_of_seasons || movie.first_air_date){
            for(let s=1; s<=20; s++){
                for(let e=1; e<=50; e++){
                    const hash = Lampa.Utils.hash([s, s>10?':':'', e, originalName].join(''));
                    const progress = viewed[hash];
                    if(progress && progress.time>0){
                        if(!last || s>last.season || (s===last.season && e>last.episode)){
                            last = {...progress};
                        }
                    }
                }
            }
        } else { // фільм
            const hash = Lampa.Utils.hash(originalName);
            const progress = viewed[hash];
            if(progress && progress.time>0) last = {...progress};
        }

        if(!last || !last.source) return; // немає що відтворювати

        let displayText = last.season ? `S${last.season}E${last.episode} • ${last.percent}% • ${formatTime(last.time)}` 
                                      : `${last.percent}% • ${formatTime(last.time)}`;

        // ==== створюємо кнопку ====
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

        button.addEventListener('hover:enter', ()=>Lampa.Player.play(movie, last.time, {url:last.source, season:last.season, episode:last.episode}));
        button.addEventListener('click', ()=>Lampa.Player.play(movie, last.time, {url:last.source, season:last.season, episode:last.episode}));

        const existingButtons = container.querySelectorAll('.full-start__button');
        if(existingButtons.length>0) container.insertBefore(button, existingButtons[0]);
        else container.appendChild(button);

        console.log('✅ Кнопка "Продовжити" додана');
    }

    // ===== Перехоплюємо Player.play і зберігаємо URL =====
    if(Lampa && Lampa.Player){
        const originalPlay = Lampa.Player.play;
        Lampa.Player.play = function(movie, time, params){
            try {
                const url = (params && (params.url || params.file || params.stream)) || movie.url || null;
                if(url){
                    const viewed = Lampa.Storage.get('file_view') || {};
                    const originalName = movie.original_name || movie.original_title || movie.title;
                    const percentValue = (params && params.percent) || 0;
                    const seasonValue = (params && params.season) || 0;
                    const episodeValue = (params && params.episode) || 0;
                    let hash;

                    if(seasonValue && episodeValue){
                        hash = Lampa.Utils.hash([seasonValue, seasonValue>10?':':'', episodeValue, originalName].join(''));
                        viewed[hash] = {time: time||0, percent: percentValue, source: url, season: seasonValue, episode: episodeValue};
                    } else {
                        hash = Lampa.Utils.hash(originalName);
                        viewed[hash] = {time: time||0, percent: percentValue, source: url};
                    }

                    Lampa.Storage.set('file_view', viewed);
                    console.log("💾 Збережено URL для продовження:", url);

                    // ==== Додаємо кнопку після збереження URL ====
                    setTimeout(()=>addContinueButton(movie), 300);
                }
            } catch(err){
                console.warn("⚠️ Помилка збереження URL:", err);
            }

            return originalPlay.apply(this, arguments);
        };
        console.log("✅ Перехоплення Player.play активовано");
    }

})();
