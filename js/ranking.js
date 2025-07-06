class RankingManager {
    constructor() {
        this.localStorageKey = 'addComboGameRankings';
        this.maxRankings = 10;
        this.rankings = this.loadRankings();
    }
    
    loadRankings() {
        try {
            const stored = localStorage.getItem(this.localStorageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('ランキング読み込みエラー:', e);
            return [];
        }
    }
    
    saveRankings() {
        try {
            localStorage.setItem(this.localStorageKey, JSON.stringify(this.rankings));
        } catch (e) {
            console.error('ランキング保存エラー:', e);
        }
    }
    
    addScore(name, score) {
        const entry = {
            name: name.substring(0, 10), // 最大10文字
            score: score,
            date: new Date().toISOString(),
            combo: window.game?.maxCombo || 0,
            inputMethod: window.game?.inputMethod || 'keyboard' // 入力方法を記録
        };
        
        // スコアを追加してソート
        this.rankings.push(entry);
        this.rankings.sort((a, b) => b.score - a.score);
        
        // 上位10件のみ保持
        this.rankings = this.rankings.slice(0, this.maxRankings);
        
        this.saveRankings();
        
        return this.rankings.findIndex(r => r === entry) + 1; // 順位を返す
    }
    
    isHighScore(score) {
        if (this.rankings.length < this.maxRankings) {
            return true;
        }
        return score > this.rankings[this.rankings.length - 1].score;
    }
    
    displayRankings() {
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = '';
        
        if (this.rankings.length === 0) {
            rankingList.innerHTML = '<div class="no-data">まだランキングがありません</div>';
            return;
        }
        
        this.rankings.forEach((entry, index) => {
            const rankingEntry = document.createElement('div');
            rankingEntry.className = 'ranking-entry';
            
            // 上位3位は特別な装飾
            if (index < 3) {
                rankingEntry.classList.add(`rank-${index + 1}`);
            }
            
            const date = new Date(entry.date);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            
            const inputIcon = entry.inputMethod === 'touch' ? '📱' : '⌨️';
            
            rankingEntry.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="name">${this.escapeHtml(entry.name)}</span>
                <span class="score">${entry.score}</span>
                <span class="input-method" style="margin-left: 5px;">${inputIcon}</span>
                <span class="combo" style="font-size: 0.8em; opacity: 0.7; margin-left: 10px;">C:${entry.combo}</span>
                <span class="date" style="font-size: 0.8em; opacity: 0.5; margin-left: 10px;">${dateStr}</span>
            `;
            
            rankingList.appendChild(rankingEntry);
        });
        
        // 上位ランキング用の特別なスタイルを追加
        this.addRankingStyles();
    }
    
    async displayOnlineRankings() {
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = '<div class="loading">オンラインランキングを読み込み中...</div>';
        
        try {
            const rankings = await this.fetchOnlineRankings();
            
            if (rankings.length === 0) {
                rankingList.innerHTML = '<div class="no-data">まだランキングがありません</div>';
                return;
            }
            
            rankingList.innerHTML = '';
            rankings.forEach((entry, index) => {
                const rankingEntry = document.createElement('div');
                rankingEntry.className = 'ranking-entry';
                
                // 上位3位は特別な装飾
                if (index < 3) {
                    rankingEntry.classList.add(`rank-${index + 1}`);
                }
                
                const date = new Date(entry.date);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                const inputIcon = entry.inputMethod === 'touch' ? '📱' : '⌨️';
                
                rankingEntry.innerHTML = `
                    <span class="rank">${index + 1}</span>
                    <span class="name">${this.escapeHtml(entry.name)}</span>
                    <span class="score">${entry.score}</span>
                    <span class="input-method" style="margin-left: 5px;">${inputIcon}</span>
                    <span class="combo" style="font-size: 0.8em; opacity: 0.7; margin-left: 10px;">C:${entry.combo}</span>
                    <span class="date" style="font-size: 0.8em; opacity: 0.5; margin-left: 10px;">${dateStr}</span>
                `;
                
                rankingList.appendChild(rankingEntry);
            });
            
            // 上位ランキング用の特別なスタイルを追加
            this.addRankingStyles();
            
        } catch (error) {
            console.error('オンラインランキング取得エラー:', error);
            rankingList.innerHTML = `
                <div class="no-data">
                    オンラインランキングの読み込みに失敗しました<br>
                    <small>しばらくしてから再度お試しください</small>
                </div>
            `;
        }
    }
    
    async fetchOnlineRankings() {
        const GAS_URL = window.GAS_WEBAPP_URL;
        if (!GAS_URL) {
            throw new Error('GAS URLが設定されていません');
        }
        
        
        // JSONP用のコールバック関数名を生成
        const callbackName = 'jsonpCallback_' + Date.now();
        
        return new Promise((resolve, reject) => {
            // グローバルコールバック関数を定義
            window[callbackName] = (data) => {
                delete window[callbackName]; // クリーンアップ
                if (data.success) {
                    resolve(data.rankings);
                } else {
                    reject(new Error(data.error || 'Unknown error'));
                }
            };
            
            // スクリプトタグを作成してJSONPリクエスト
            const script = document.createElement('script');
            script.src = `${GAS_URL}?action=getRankings&callback=${callbackName}`;
            script.onerror = () => {
                delete window[callbackName];
                script.remove();
                reject(new Error('Failed to load rankings'));
            };
            
            // 成功時のクリーンアップ
            script.onload = () => {
                setTimeout(() => script.remove(), 100);
            };
            
            document.body.appendChild(script);
            
            // タイムアウト処理
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    script.remove();
                    reject(new Error('Request timeout'));
                }
            }, 10000); // 10秒タイムアウト
        });
    }
    
    async submitOnlineScore(name, score) {
        const GAS_URL = window.GAS_WEBAPP_URL;
        if (!GAS_URL) {
            console.error('GAS URLが設定されていません');
            return false;
        }
        
        // 追加の検証
        const config = window.GAME_CONFIG || {};
        if (score > config.MAX_SCORE || score < 0) {
            console.error('無効なスコア');
            return false;
        }
        
        // レート制限チェック
        const lastSubmit = this.lastSubmitTime || 0;
        const now = Date.now();
        if (now - lastSubmit < (config.MIN_SUBMIT_INTERVAL || 30000)) {
            console.error('送信間隔が短すぎます');
            return false;
        }
        
        // JSONP用のコールバック関数名を生成
        const callbackName = 'jsonpSubmit_' + Date.now();
        
        return new Promise((resolve) => {
            try {
                // グローバルコールバック関数を定義
                window[callbackName] = (data) => {
                    delete window[callbackName];
                    if (data.success) {
                        this.lastSubmitTime = now;
                        resolve(true);
                    } else {
                        console.error('スコア送信エラー:', data.error);
                        resolve(false);
                    }
                };
                
                // パラメータを作成
                const params = new URLSearchParams({
                    action: 'addScore',
                    name: name,
                    score: score,
                    combo: Math.min(window.game?.maxCombo || 0, config.MAX_COMBO || 100),
                    inputMethod: window.game?.inputMethod || 'keyboard',
                    version: config.VERSION || '1.0.0',
                    timestamp: now,
                    callback: callbackName
                });
                
                // スクリプトタグを作成
                const script = document.createElement('script');
                script.src = `${GAS_URL}?${params.toString()}`;
                script.onerror = () => {
                    delete window[callbackName];
                    script.remove();
                    console.error('スクリプト読み込みエラー');
                    resolve(false);
                };
                
                // 成功時のクリーンアップ
                script.onload = () => {
                    setTimeout(() => script.remove(), 100);
                };
                
                document.body.appendChild(script);
                
                // タイムアウト処理
                setTimeout(() => {
                    if (window[callbackName]) {
                        delete window[callbackName];
                        script.remove();
                        console.error('リクエストタイムアウト');
                        resolve(false);
                    }
                }, 10000);
                
            } catch (error) {
                console.error('オンラインスコア送信エラー:', error);
                resolve(false);
            }
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    addRankingStyles() {
        // 動的にランキング用のスタイルを追加
        if (!document.getElementById('ranking-styles')) {
            const style = document.createElement('style');
            style.id = 'ranking-styles';
            style.textContent = `
                .ranking-entry.rank-1 {
                    background: linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0.1) 100%);
                    border: 2px solid rgba(255,215,0,0.5);
                }
                
                .ranking-entry.rank-1 .rank::before {
                    content: "👑 ";
                }
                
                .ranking-entry.rank-2 {
                    background: linear-gradient(135deg, rgba(192,192,192,0.3) 0%, rgba(192,192,192,0.1) 100%);
                    border: 2px solid rgba(192,192,192,0.5);
                }
                
                .ranking-entry.rank-2 .rank::before {
                    content: "🥈 ";
                }
                
                .ranking-entry.rank-3 {
                    background: linear-gradient(135deg, rgba(205,127,50,0.3) 0%, rgba(205,127,50,0.1) 100%);
                    border: 2px solid rgba(205,127,50,0.5);
                }
                
                .ranking-entry.rank-3 .rank::before {
                    content: "🥉 ";
                }
                
                .no-data {
                    text-align: center;
                    padding: 40px;
                    opacity: 0.7;
                }
                
                .loading {
                    text-align: center;
                    padding: 40px;
                    font-size: 1.2em;
                }
                
                .ranking-entry {
                    display: flex;
                    align-items: center;
                    transition: all 0.3s ease;
                    gap: 5px;
                }
                
                .ranking-entry:hover {
                    transform: translateX(5px);
                    background: rgba(255,255,255,0.2);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // デバッグ用：ダミーデータを追加
    addDummyData() {
        const names = ['たろう', 'はなこ', 'ゲーマー', 'プロ', 'マスター', '初心者', 'エース', 'チャンピオン'];
        const dummyData = [];
        
        for (let i = 0; i < 8; i++) {
            dummyData.push({
                name: names[i],
                score: Math.floor(Math.random() * 1000) + 100,
                date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                combo: Math.floor(Math.random() * 20) + 5,
                inputMethod: Math.random() > 0.5 ? 'touch' : 'keyboard'
            });
        }
        
        this.rankings = dummyData.sort((a, b) => b.score - a.score);
        this.saveRankings();
    }
}

// ランキングマネージャーのインスタンス作成
document.addEventListener('DOMContentLoaded', () => {
    window.rankingManager = new RankingManager();
});