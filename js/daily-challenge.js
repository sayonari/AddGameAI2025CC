class DailyChallenge {
    constructor() {
        this.challenges = [
            { target: 500, name: '初級チャレンジ', reward: '🌟' },
            { target: 1000, name: '中級チャレンジ', reward: '⭐' },
            { target: 1500, name: '上級チャレンジ', reward: '✨' },
            { target: 2000, name: 'マスターチャレンジ', reward: '💫' }
        ];
        this.loadProgress();
    }
    
    getTodayChallenge() {
        // 日付をシードにして毎日異なるチャレンジを生成
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        const hash = this.hashCode(dateString);
        
        // その日のチャレンジを決定
        const challengeIndex = Math.abs(hash) % this.challenges.length;
        const challenge = this.challenges[challengeIndex];
        
        // ランダムな係数（0.8〜1.2）
        const multiplier = 0.8 + (Math.abs(hash % 40) / 100);
        const targetScore = Math.round(challenge.target * multiplier);
        
        return {
            ...challenge,
            target: targetScore,
            date: dateString
        };
    }
    
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }
    
    loadProgress() {
        const saved = localStorage.getItem('dailyChallengeProgress');
        this.progress = saved ? JSON.parse(saved) : {};
        
        // 今日の進捗を確認
        const today = new Date();
        const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
        
        if (!this.progress[dateString]) {
            this.progress[dateString] = {
                completed: false,
                bestScore: 0,
                attempts: 0
            };
        }
    }
    
    saveProgress() {
        localStorage.setItem('dailyChallengeProgress', JSON.stringify(this.progress));
    }
    
    checkChallenge(score) {
        const challenge = this.getTodayChallenge();
        const progress = this.progress[challenge.date];
        
        progress.attempts++;
        progress.bestScore = Math.max(progress.bestScore, score);
        
        if (score >= challenge.target && !progress.completed) {
            progress.completed = true;
            this.saveProgress();
            return {
                completed: true,
                challenge: challenge,
                firstTime: true
            };
        }
        
        this.saveProgress();
        return {
            completed: progress.completed,
            challenge: challenge,
            progress: (score / challenge.target * 100).toFixed(1),
            firstTime: false
        };
    }
    
    displayChallenge() {
        const challenge = this.getTodayChallenge();
        const progress = this.progress[challenge.date];
        
        const challengeElement = document.createElement('div');
        challengeElement.className = 'daily-challenge-display';
        challengeElement.innerHTML = `
            <h3>🎯 今日のチャレンジ</h3>
            <p class="challenge-name">${challenge.name} ${challenge.reward}</p>
            <p class="challenge-target">目標: ${challenge.target}点</p>
            <div class="challenge-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(100, progress.bestScore / challenge.target * 100)}%"></div>
                </div>
                <p class="progress-text">${progress.bestScore} / ${challenge.target}</p>
            </div>
            ${progress.completed ? '<p class="challenge-completed">✅ クリア済み！</p>' : ''}
        `;
        
        return challengeElement;
    }
    
    getStreak() {
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            
            if (this.progress[dateString]?.completed) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        
        return streak;
    }
}

// グローバルに追加
window.dailyChallenge = new DailyChallenge();