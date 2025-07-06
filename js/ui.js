class UIManager {
    constructor() {
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            end: document.getElementById('end-screen'),
            ranking: document.getElementById('ranking-screen')
        };
        
        this.init();
    }
    
    init() {
        this.setupNavigationListeners();
        this.showScreen('start');
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
                
                // オンラインランキングに送信
                if (window.GAS_WEBAPP_URL) {
                    try {
                        await window.rankingManager.submitOnlineScore(name, window.game.score);
                        this.showNotification('スコアをオンラインランキングに登録しました！', 'success');
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
}

// UIマネージャーのインスタンス作成
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});