class StatisticsTracker {
    constructor() {
        this.sessionStats = {
            startTime: null,
            answers: [],
            reactionTimes: [],
            mistakePatterns: {}
        };
        this.loadLifetimeStats();
    }
    
    loadLifetimeStats() {
        const saved = localStorage.getItem('lifetimeStatistics');
        this.lifetimeStats = saved ? JSON.parse(saved) : {
            totalPlayTime: 0,
            totalAnswers: 0,
            correctAnswers: 0,
            averageReactionTime: 0,
            fastestReaction: Infinity,
            slowestReaction: 0,
            mistakePatterns: {},
            dailyStats: {},
            bestDay: { date: null, score: 0 },
            currentStreak: 0,
            longestStreak: 0,
            lastPlayDate: null
        };
    }
    
    saveLifetimeStats() {
        localStorage.setItem('lifetimeStatistics', JSON.stringify(this.lifetimeStats));
    }
    
    startSession() {
        this.sessionStats = {
            startTime: Date.now(),
            answers: [],
            reactionTimes: [],
            mistakePatterns: {}
        };
    }
    
    recordAnswer(num1, num2, userAnswer, correctAnswer, reactionTime, isCorrect) {
        const answerData = {
            num1,
            num2,
            userAnswer,
            correctAnswer,
            reactionTime,
            isCorrect,
            timestamp: Date.now()
        };
        
        this.sessionStats.answers.push(answerData);
        
        if (isCorrect) {
            this.sessionStats.reactionTimes.push(reactionTime);
        } else {
            // 間違いパターンを記録
            const pattern = `${num1}+${num2}`;
            if (!this.sessionStats.mistakePatterns[pattern]) {
                this.sessionStats.mistakePatterns[pattern] = {
                    count: 0,
                    wrongAnswers: []
                };
            }
            this.sessionStats.mistakePatterns[pattern].count++;
            this.sessionStats.mistakePatterns[pattern].wrongAnswers.push(userAnswer);
        }
    }
    
    endSession(finalScore, maxCombo) {
        const sessionDuration = Date.now() - this.sessionStats.startTime;
        const today = new Date().toDateString();
        
        // セッション統計を計算
        const correctCount = this.sessionStats.answers.filter(a => a.isCorrect).length;
        const totalCount = this.sessionStats.answers.length;
        const accuracy = totalCount > 0 ? (correctCount / totalCount * 100).toFixed(1) : 0;
        
        let avgReactionTime = 0;
        if (this.sessionStats.reactionTimes.length > 0) {
            avgReactionTime = Math.round(
                this.sessionStats.reactionTimes.reduce((a, b) => a + b, 0) / 
                this.sessionStats.reactionTimes.length
            );
        }
        
        // ライフタイム統計を更新
        this.lifetimeStats.totalPlayTime += sessionDuration;
        this.lifetimeStats.totalAnswers += totalCount;
        this.lifetimeStats.correctAnswers += correctCount;
        
        // 反応時間の更新
        if (this.sessionStats.reactionTimes.length > 0) {
            const minReaction = Math.min(...this.sessionStats.reactionTimes);
            const maxReaction = Math.max(...this.sessionStats.reactionTimes);
            this.lifetimeStats.fastestReaction = Math.min(this.lifetimeStats.fastestReaction, minReaction);
            this.lifetimeStats.slowestReaction = Math.max(this.lifetimeStats.slowestReaction, maxReaction);
            
            // 全体の平均反応時間を再計算
            const totalReactionTime = this.lifetimeStats.averageReactionTime * (this.lifetimeStats.correctAnswers - correctCount) + 
                                    this.sessionStats.reactionTimes.reduce((a, b) => a + b, 0);
            this.lifetimeStats.averageReactionTime = Math.round(totalReactionTime / this.lifetimeStats.correctAnswers);
        }
        
        // 間違いパターンの更新
        for (const [pattern, data] of Object.entries(this.sessionStats.mistakePatterns)) {
            if (!this.lifetimeStats.mistakePatterns[pattern]) {
                this.lifetimeStats.mistakePatterns[pattern] = { count: 0 };
            }
            this.lifetimeStats.mistakePatterns[pattern].count += data.count;
        }
        
        // デイリー統計の更新
        if (!this.lifetimeStats.dailyStats[today]) {
            this.lifetimeStats.dailyStats[today] = {
                plays: 0,
                totalScore: 0,
                bestScore: 0,
                totalTime: 0
            };
        }
        
        const dailyStat = this.lifetimeStats.dailyStats[today];
        dailyStat.plays++;
        dailyStat.totalScore += finalScore;
        dailyStat.bestScore = Math.max(dailyStat.bestScore, finalScore);
        dailyStat.totalTime += sessionDuration;
        
        // ベストデーの更新
        if (dailyStat.bestScore > (this.lifetimeStats.bestDay.score || 0)) {
            this.lifetimeStats.bestDay = {
                date: today,
                score: dailyStat.bestScore
            };
        }
        
        // ストリークの更新
        this.updateStreak();
        
        this.saveLifetimeStats();
        
        // セッション結果を返す
        return {
            duration: sessionDuration,
            totalAnswers: totalCount,
            correctAnswers: correctCount,
            accuracy: accuracy,
            avgReactionTime: avgReactionTime,
            score: finalScore,
            maxCombo: maxCombo
        };
    }
    
    updateStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (this.lifetimeStats.lastPlayDate === yesterday) {
            this.lifetimeStats.currentStreak++;
        } else if (this.lifetimeStats.lastPlayDate !== today) {
            this.lifetimeStats.currentStreak = 1;
        }
        
        this.lifetimeStats.longestStreak = Math.max(
            this.lifetimeStats.longestStreak,
            this.lifetimeStats.currentStreak
        );
        
        this.lifetimeStats.lastPlayDate = today;
    }
    
    getTopMistakes(limit = 5) {
        const mistakes = Object.entries(this.lifetimeStats.mistakePatterns)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit);
        
        return mistakes.map(([pattern, data]) => ({
            pattern,
            count: data.count
        }));
    }
    
    displayStatistics() {
        const container = document.createElement('div');
        container.className = 'statistics-container';
        
        const avgAccuracy = this.lifetimeStats.totalAnswers > 0 
            ? (this.lifetimeStats.correctAnswers / this.lifetimeStats.totalAnswers * 100).toFixed(1)
            : 0;
        
        const totalTime = this.formatTime(this.lifetimeStats.totalPlayTime);
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>プレイ統計</h4>
                    <p>総プレイ時間: ${totalTime}</p>
                    <p>総回答数: ${this.lifetimeStats.totalAnswers}</p>
                    <p>正答率: ${avgAccuracy}%</p>
                </div>
                
                <div class="stat-card">
                    <h4>反応時間</h4>
                    <p>平均: ${this.lifetimeStats.averageReactionTime}ms</p>
                    <p>最速: ${this.lifetimeStats.fastestReaction === Infinity ? '-' : this.lifetimeStats.fastestReaction + 'ms'}</p>
                    <p>最遅: ${this.lifetimeStats.slowestReaction}ms</p>
                </div>
                
                <div class="stat-card">
                    <h4>記録</h4>
                    <p>ベストデー: ${this.lifetimeStats.bestDay.date || '-'}</p>
                    <p>最高スコア: ${this.lifetimeStats.bestDay.score}</p>
                    <p>連続プレイ: ${this.lifetimeStats.currentStreak}日</p>
                </div>
                
                <div class="stat-card">
                    <h4>よく間違える問題 TOP5</h4>
                    ${this.getTopMistakes().map((m, i) => 
                        `<p>${i + 1}. ${m.pattern} (${m.count}回)</p>`
                    ).join('')}
                </div>
            </div>
            
            <div class="chart-container">
                <canvas id="statsChart"></canvas>
            </div>
        `;
        
        // グラフを後で描画
        setTimeout(() => this.drawChart(), 100);
        
        return container;
    }
    
    drawChart() {
        const canvas = document.getElementById('statsChart');
        if (!canvas) return;
        
        // 簡易的な棒グラフを描画（最近7日間のスコア）
        const ctx = canvas.getContext('2d');
        const days = this.getLastNDaysData(7);
        
        // Canvas設定
        canvas.width = canvas.offsetWidth;
        canvas.height = 200;
        
        const barWidth = canvas.width / days.length * 0.8;
        const maxScore = Math.max(...days.map(d => d.score), 1);
        
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
        
        days.forEach((day, index) => {
            const barHeight = (day.score / maxScore) * (canvas.height - 40);
            const x = index * (canvas.width / days.length) + (canvas.width / days.length * 0.1);
            const y = canvas.height - barHeight - 20;
            
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // ラベル
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(day.label, x + barWidth / 2, canvas.height - 5);
            ctx.fillText(day.score, x + barWidth / 2, y - 5);
            
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
        });
    }
    
    getLastNDaysData(n) {
        const days = [];
        const today = new Date();
        
        for (let i = n - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            const dayData = this.lifetimeStats.dailyStats[dateString] || { bestScore: 0 };
            days.push({
                label: `${date.getMonth() + 1}/${date.getDate()}`,
                score: dayData.bestScore
            });
        }
        
        return days;
    }
    
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}時間${minutes % 60}分`;
        } else if (minutes > 0) {
            return `${minutes}分${seconds % 60}秒`;
        } else {
            return `${seconds}秒`;
        }
    }
}

// グローバルに追加
window.statisticsTracker = new StatisticsTracker();