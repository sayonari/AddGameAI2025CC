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
            combo: window.game?.maxCombo || 0
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
            
            rankingEntry.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="name">${this.escapeHtml(entry.name)}</span>
                <span class="score">${entry.score}</span>
                <span class="combo" style="font-size: 0.8em; opacity: 0.7; margin-left: 10px;">C:${entry.combo}</span>
                <span class="date" style="font-size: 0.8em; opacity: 0.5; margin-left: 10px;">${dateStr}</span>
            `;
            
            rankingList.appendChild(rankingEntry);
        });
        
        // 上位ランキング用の特別なスタイルを追加
        this.addRankingStyles();
    }
    
    displayOnlineRankings() {
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = '<div class="loading">オンラインランキングを読み込み中...</div>';
        
        // オンラインランキングの実装（仮）
        setTimeout(() => {
            rankingList.innerHTML = `
                <div class="no-data">
                    オンラインランキングは準備中です<br>
                    <small>今後のアップデートで実装予定</small>
                </div>
            `;
        }, 1000);
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
                combo: Math.floor(Math.random() * 20) + 5
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