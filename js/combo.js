class ComboManager {
    constructor() {
        this.comboMessages = [
            { combo: 3, message: "Nice!" },
            { combo: 5, message: "Great!" },
            { combo: 10, message: "Excellent!" },
            { combo: 15, message: "Amazing!" },
            { combo: 20, message: "Incredible!" },
            { combo: 30, message: "Unbelievable!" },
            { combo: 50, message: "LEGENDARY!" }
        ];
    }
    
    calculateScore(baseScore, combo, remainingTime) {
        // 提供されたコードと同じ計算式
        // score = 1 + combo * (remainingTime/100)^2
        // remainingTimeは0-800msの範囲
        const absCombo = Math.abs(combo);
        
        if (absCombo === 0) {
            return baseScore;
        }
        
        // 残り時間を100で割って2乗
        const timeBonus = Math.pow(remainingTime / 100, 2);
        
        // スコア計算: 1 + コンボ数 × (残り時間/100)²
        const score = Math.round(1 + absCombo * timeBonus);
        
        return score;
    }
    
    showComboMessage(combo) {
        // 適切なメッセージを見つける
        let message = null;
        for (let i = this.comboMessages.length - 1; i >= 0; i--) {
            if (combo >= this.comboMessages[i].combo) {
                message = this.comboMessages[i].message;
                break;
            }
        }
        
        if (message) {
            this.displayComboMessage(message, combo);
        }
    }
    
    displayComboMessage(message, combo) {
        const effectLayer = document.getElementById('effect-layer');
        const messageEl = document.createElement('div');
        messageEl.className = 'combo-message';
        messageEl.textContent = message;
        
        messageEl.style.cssText = `
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            font-size: 3em;
            font-weight: bold;
            color: #fbbf24;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 200;
            animation: comboMessagePop 1s ease forwards;
        `;
        
        // アニメーションスタイルを追加
        if (!document.getElementById('combo-message-style')) {
            const style = document.createElement('style');
            style.id = 'combo-message-style';
            style.textContent = `
                @keyframes comboMessagePop {
                    0% {
                        transform: translate(-50%, -50%) scale(0) rotate(-10deg);
                        opacity: 0;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.2) rotate(5deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1) rotate(0deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        effectLayer.appendChild(messageEl);
        
        // 特殊エフェクトを追加
        if (combo >= 20) {
            this.createSpecialEffect();
        }
        
        setTimeout(() => messageEl.remove(), 1000);
    }
    
    createSpecialEffect() {
        const effectLayer = document.getElementById('effect-layer');
        
        // 画面全体のフラッシュ効果
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%);
            animation: flashEffect 0.5s ease;
            pointer-events: none;
        `;
        
        if (!document.getElementById('flash-effect-style')) {
            const style = document.createElement('style');
            style.id = 'flash-effect-style';
            style.textContent = `
                @keyframes flashEffect {
                    0% {
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        effectLayer.appendChild(flash);
        setTimeout(() => flash.remove(), 500);
    }
    
    updateComboDisplay(combo) {
        const comboDisplay = document.getElementById('combo-display');
        const comboNumber = document.getElementById('combo');
        
        // コンボ数に応じて色を変更
        if (Math.abs(combo) >= 20) {
            comboDisplay.style.background = 'rgba(251, 191, 36, 0.3)';
            comboNumber.style.color = '#fbbf24';
        } else if (Math.abs(combo) >= 10) {
            comboDisplay.style.background = 'rgba(251, 191, 36, 0.2)';
            comboNumber.style.color = '#fde047';
        } else if (Math.abs(combo) >= 5) {
            comboDisplay.style.background = 'rgba(255, 255, 255, 0.25)';
            comboNumber.style.color = 'white';
        } else {
            comboDisplay.style.background = 'rgba(255, 255, 255, 0.2)';
            comboNumber.style.color = 'white';
        }
        
        // 負のコンボの場合は赤系に
        if (combo < 0) {
            comboDisplay.style.background = 'rgba(239, 68, 68, 0.3)';
            comboNumber.style.color = '#ef4444';
        }
    }
}

// コンボマネージャーのインスタンス作成と統合
document.addEventListener('DOMContentLoaded', () => {
    window.comboManager = new ComboManager();
    
    // ゲームクラスのメソッドを拡張
    const originalHandleCorrect = window.game.handleCorrectAnswer.bind(window.game);
    window.game.handleCorrectAnswer = function() {
        const prevCombo = this.combo;
        originalHandleCorrect();
        
        // コンボメッセージ表示
        if (this.combo > prevCombo && this.combo > 1) {
            window.comboManager.showComboMessage(this.combo);
        }
        
        // コンボ表示更新
        window.comboManager.updateComboDisplay(this.combo);
    };
    
    const originalHandleIncorrect = window.game.handleIncorrectAnswer.bind(window.game);
    window.game.handleIncorrectAnswer = function() {
        originalHandleIncorrect();
        window.comboManager.updateComboDisplay(this.combo);
    };
});