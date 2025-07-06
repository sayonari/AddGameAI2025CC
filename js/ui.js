class UIManager {
    constructor() {
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            end: document.getElementById('end-screen'),
            ranking: document.getElementById('ranking-screen'),
            achievements: document.getElementById('achievements-screen'),
            statistics: document.getElementById('statistics-screen'),
            theme: document.getElementById('theme-screen')
        };
        
        this.init();
    }
    
    init() {
        // 初期状態で全ての画面を非表示にする
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // iOS Safariの初期レンダリング問題対策
        setTimeout(() => {
            this.setupNavigationListeners();
            this.showScreen('start');
        }, 100);
    }
    
    setupNavigationListeners() {
        // スタート画面のボタン
        document.getElementById('ranking-btn').addEventListener('click', () => {
            this.showScreen('ranking');
            window.rankingManager?.displayRankings();
        });
        
        // 終了画面のボタン
        document.getElementById('back-to-start-btn').addEventListener('click', () => {
            this.showScreen('start');
        });
        
        // ランキング画面のボタン
        document.getElementById('back-from-ranking-btn').addEventListener('click', () => {
            this.showScreen('start');
        });
        
        // スコア登録ボタン
        document.getElementById('submit-score-btn').addEventListener('click', async () => {
            const name = document.getElementById('player-name').value.trim();
            if (name && window.game && window.rankingManager) {
                const btn = document.getElementById('submit-score-btn');
                btn.disabled = true;
                btn.textContent = '登録中...';
                
                // ローカルランキングに追加
                window.rankingManager.addScore(name, window.game.score);
                
                // オンラインランキングに送信（エラーが発生しても続行）
                if (window.GAS_WEBAPP_URL) {
                    try {
                        const success = await window.rankingManager.submitOnlineScore(name, window.game.score);
                        if (success) {
                            this.showNotification('スコアをオンラインランキングに登録しました！', 'success');
                        } else {
                            this.showNotification('オンライン登録に失敗しました（ローカルには保存されました）', 'error');
                        }
                    } catch (error) {
                        console.error('オンライン登録エラー:', error);
                        this.showNotification('オンライン登録に失敗しました（ローカルには保存されました）', 'error');
                    }
                }
                
                document.getElementById('name-input-container').style.display = 'none';
                
                // ランキング画面を表示
                this.showScreen('ranking');
                window.rankingManager.displayRankings();
                
                btn.disabled = false;
                btn.textContent = '登録';
            }
        });
        
        // 名前入力でEnterキー
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('submit-score-btn').click();
            }
        });
        
        // タブ切り替え
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const tab = e.target.dataset.tab;
                if (tab === 'online') {
                    window.rankingManager?.displayOnlineRankings();
                } else {
                    window.rankingManager?.displayRankings();
                }
            });
        });
        
        // 新機能のボタン
        document.getElementById('achievements-btn')?.addEventListener('click', () => {
            this.showScreen('achievements');
            this.displayAchievements();
        });
        
        document.getElementById('stats-btn')?.addEventListener('click', () => {
            this.showScreen('statistics');
            this.displayStatistics();
        });
        
        document.getElementById('theme-btn')?.addEventListener('click', () => {
            this.showScreen('theme');
            this.displayThemes();
        });
        
        // 戻るボタン
        document.getElementById('back-from-achievements-btn')?.addEventListener('click', () => {
            this.showScreen('start');
        });
        
        document.getElementById('back-from-stats-btn')?.addEventListener('click', () => {
            this.showScreen('start');
        });
        
        document.getElementById('back-from-theme-btn')?.addEventListener('click', () => {
            this.showScreen('start');
        });
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
        
        // 名前入力フィールドをクリア
        if (screenName === 'start') {
            document.getElementById('player-name').value = '';
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'error' ? '#ef4444' : '#4ade80'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: fadeIn 0.3s ease;
            z-index: 1000;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    updateLoadingState(isLoading, element) {
        if (isLoading) {
            element.disabled = true;
            element.textContent = '読み込み中...';
        } else {
            element.disabled = false;
            element.textContent = element.dataset.originalText || element.textContent;
        }
    }
    
    displayAchievements() {
        const container = document.getElementById('achievements-list');
        const countEl = document.getElementById('achievement-count');
        const totalEl = document.getElementById('achievement-total');
        
        if (window.achievementSystem) {
            container.innerHTML = '';
            container.appendChild(window.achievementSystem.displayAchievements());
            countEl.textContent = window.achievementSystem.getUnlockedCount();
            totalEl.textContent = window.achievementSystem.getTotalCount();
        }
    }
    
    displayStatistics() {
        const container = document.getElementById('statistics-content');
        
        if (window.statisticsTracker) {
            container.innerHTML = '';
            container.appendChild(window.statisticsTracker.displayStatistics());
        }
    }
    
    displayThemes() {
        const container = document.getElementById('theme-content');
        
        if (window.themeManager) {
            container.innerHTML = '';
            container.appendChild(window.themeManager.createThemeSelector());
        }
    }
}

// UIマネージャーのインスタンス作成
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
    
    // デイリーチャレンジをスタート画面に表示
    if (window.dailyChallenge) {
        const challengePreview = document.getElementById('daily-challenge-preview');
        if (challengePreview) {
            challengePreview.appendChild(window.dailyChallenge.displayChallenge());
        }
    }
});