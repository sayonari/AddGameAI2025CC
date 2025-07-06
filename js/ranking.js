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
        const GAS_URL = window.GAS_WEBAPP_URL; // index.htmlで設定
        if (!GAS_URL) {
            throw new Error('GAS URLが設定されていません');
        }
        
        const response = await fetch(`${GAS_URL}?action=getRankings`);
        const data = await response.json();
        
        if (data.success) {
            return data.rankings;
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    }
    
    async submitOnlineScore(name, score) {
        const GAS_URL = window.GAS_WEBAPP_URL;
        if (!GAS_URL) {
            console.error('GAS URLが設定されていません');
            return false;
        }
        
        try {
            const params = new URLSearchParams({
                action: 'addScore',
                name: name,
                score: score,
                combo: window.game?.maxCombo || 0,
                inputMethod: window.game?.inputMethod || 'keyboard'
            });
            
            const response = await fetch(`${GAS_URL}?${params.toString()}`);
            const data = await response.json();
            
            return data.success;
        } catch (error) {
            console.error('オンラインスコア送信エラー:', error);
            return false;
        }
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