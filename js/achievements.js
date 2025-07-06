class AchievementSystem {
    constructor() {
        this.achievements = [
            // コンボ実績
            { id: 'combo_5', name: '5コンボ達成', description: '5回連続正解', icon: '🔥', condition: (stats) => stats.maxCombo >= 5 },
            { id: 'combo_10', name: '10コンボマスター', description: '10回連続正解', icon: '💥', condition: (stats) => stats.maxCombo >= 10 },
            { id: 'combo_20', name: 'コンボキング', description: '20回連続正解', icon: '👑', condition: (stats) => stats.maxCombo >= 20 },
            
            // スコア実績
            { id: 'score_500', name: 'ビギナー', description: 'スコア500点達成', icon: '🌱', condition: (stats) => stats.highScore >= 500 },
            { id: 'score_1000', name: 'アドバンス', description: 'スコア1000点達成', icon: '🌟', condition: (stats) => stats.highScore >= 1000 },
            { id: 'score_2000', name: 'エキスパート', description: 'スコア2000点達成', icon: '💎', condition: (stats) => stats.highScore >= 2000 },
            { id: 'score_3000', name: 'レジェンド', description: 'スコア3000点達成', icon: '🏆', condition: (stats) => stats.highScore >= 3000 },
            
            // プレイ回数実績
            { id: 'play_10', name: '常連さん', description: '10回プレイ', icon: '🎮', condition: (stats) => stats.totalGames >= 10 },
            { id: 'play_50', name: 'ゲーマー', description: '50回プレイ', icon: '🎯', condition: (stats) => stats.totalGames >= 50 },
            { id: 'play_100', name: 'マニア', description: '100回プレイ', icon: '🎖️', condition: (stats) => stats.totalGames >= 100 },
            
            // 正答率実績
            { id: 'accuracy_80', name: '正確無比', description: '正答率80%以上（10問以上）', icon: '🎯', condition: (stats) => stats.totalAnswers >= 10 && (stats.correctAnswers / stats.totalAnswers) >= 0.8 },
            { id: 'accuracy_90', name: '計算マスター', description: '正答率90%以上（20問以上）', icon: '🧮', condition: (stats) => stats.totalAnswers >= 20 && (stats.correctAnswers / stats.totalAnswers) >= 0.9 },
            
            // 特殊実績
            { id: 'perfect_game', name: 'パーフェクト', description: '1ゲームで全問正解', icon: '💯', condition: (stats) => stats.perfectGames > 0 },
            { id: 'speed_demon', name: 'スピードデーモン', description: '平均反応時間500ms以下', icon: '⚡', condition: (stats) => stats.avgReactionTime > 0 && stats.avgReactionTime <= 500 },
            { id: 'daily_warrior', name: 'デイリーウォーリアー', description: '7日連続デイリーチャレンジクリア', icon: '🗓️', condition: (stats) => window.dailyChallenge?.getStreak() >= 7 }
        ];
        
        this.loadUnlocked();
        this.loadStats();
    }
    
    loadUnlocked() {
        const saved = localStorage.getItem('unlockedAchievements');
        this.unlocked = saved ? JSON.parse(saved) : {};
    }
    
    saveUnlocked() {
        localStorage.setItem('unlockedAchievements', JSON.stringify(this.unlocked));
    }
    
    loadStats() {
        const saved = localStorage.getItem('gameStatistics');
        this.stats = saved ? JSON.parse(saved) : {
            totalGames: 0,
            highScore: 0,
            maxCombo: 0,
            totalAnswers: 0,
            correctAnswers: 0,
            totalReactionTime: 0,
            perfectGames: 0,
            avgReactionTime: 0
        };
    }
    
    saveStats() {
        localStorage.setItem('gameStatistics', JSON.stringify(this.stats));
    }
    
    updateStats(gameData) {
        this.stats.totalGames++;
        this.stats.highScore = Math.max(this.stats.highScore, gameData.score);
        this.stats.maxCombo = Math.max(this.stats.maxCombo, gameData.maxCombo);
        this.stats.totalAnswers += gameData.totalAnswers;
        this.stats.correctAnswers += gameData.correctAnswers;
        this.stats.totalReactionTime += gameData.totalReactionTime;
        
        if (gameData.totalAnswers > 0 && gameData.correctAnswers === gameData.totalAnswers) {
            this.stats.perfectGames++;
        }
        
        // 平均反応時間を計算
        if (this.stats.correctAnswers > 0) {
            this.stats.avgReactionTime = Math.round(this.stats.totalReactionTime / this.stats.correctAnswers);
        }
        
        this.saveStats();
        
        // 新しい実績をチェック
        return this.checkAchievements();
    }
    
    checkAchievements() {
        const newAchievements = [];
        
        for (const achievement of this.achievements) {
            if (!this.unlocked[achievement.id] && achievement.condition(this.stats)) {
                this.unlocked[achievement.id] = {
                    unlockedAt: new Date().toISOString(),
                    name: achievement.name,
                    icon: achievement.icon
                };
                newAchievements.push(achievement);
            }
        }
        
        if (newAchievements.length > 0) {
            this.saveUnlocked();
        }
        
        return newAchievements;
    }
    
    displayAchievements() {
        const container = document.createElement('div');
        container.className = 'achievements-grid';
        
        for (const achievement of this.achievements) {
            const isUnlocked = !!this.unlocked[achievement.id];
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            achievementEl.innerHTML = `
                <div class="achievement-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                    ${isUnlocked ? `<small>解除: ${new Date(this.unlocked[achievement.id].unlockedAt).toLocaleDateString()}</small>` : ''}
                </div>
            `;
            
            container.appendChild(achievementEl);
        }
        
        return container;
    }
    
    getUnlockedCount() {
        return Object.keys(this.unlocked).length;
    }
    
    getTotalCount() {
        return this.achievements.length;
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-popup">
                <h3>🎉 実績解除！</h3>
                <div class="achievement-content">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <div>
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // アニメーション後に削除
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
}

// グローバルに追加
window.achievementSystem = new AchievementSystem();