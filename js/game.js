class Game {
    constructor() {
        this.numbers = [];
        this.score = 0;
        this.timeLeft = 30;
        this.combo = 0;
        this.maxCombo = 0;
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.isPlaying = false;
        this.gameTimer = null;
        this.comboTimer = null;
        this.lastAnswerTime = Date.now();
        this.comboTimeLeft = 0;
        this.inputMethod = 'keyboard'; // 'keyboard' or 'touch'
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateInitialNumbers();
    }
    
    setupEventListeners() {
        // スタートボタン
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // リトライボタン
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // テンキーボタン
        document.querySelectorAll('.numpad-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isPlaying) {
                    this.inputMethod = 'touch'; // タッチ操作を記録
                    const value = parseInt(e.target.dataset.value);
                    this.checkAnswer(value);
                    btn.classList.add('pressed');
                    setTimeout(() => btn.classList.remove('pressed'), 200);
                }
            });
        });
        
        // キーボード入力
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying && e.key >= '0' && e.key <= '9') {
                this.inputMethod = 'keyboard'; // キーボード操作を記録
                const value = parseInt(e.key);
                this.checkAnswer(value);
                const btn = document.querySelector(`[data-value="${value}"]`);
                if (btn) {
                    btn.classList.add('pressed');
                    setTimeout(() => btn.classList.remove('pressed'), 200);
                }
            }
        });
    }
    
    generateInitialNumbers() {
        this.numbers = [];
        for (let i = 0; i < 4; i++) {
            this.numbers.push(Math.floor(Math.random() * 10));
        }
        this.updateNumberDisplay();
    }
    
    generateNextNumber() {
        return Math.floor(Math.random() * 10);
    }
    
    updateNumberDisplay() {
        document.querySelector('#num1 .number').textContent = this.numbers[0];
        document.querySelector('#num2 .number').textContent = this.numbers[1];
        document.querySelector('#preview1 .number').textContent = this.numbers[2];
        document.querySelector('#preview2 .number').textContent = this.numbers[3];
        
        // 10の位を更新
        this.updateTensDigit();
    }
    
    startGame() {
        this.score = 0;
        this.timeLeft = 30;
        this.combo = 0;
        this.maxCombo = 0;
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.isPlaying = true;
        this.lastAnswerTime = Date.now();
        
        this.generateInitialNumbers();
        this.updateUI();
        
        // 画面切り替え
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('game-screen').classList.add('active');
        
        // ゲームタイマー開始
        this.startGameTimer();
        
        // 初回のコンボタイマーリセット
        this.resetComboTimer();
    }
    
    startGameTimer() {
        const timerBar = document.getElementById('timer-fill');
        const timeDisplay = document.getElementById('time');
        
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            timeDisplay.textContent = this.timeLeft;
            
            // タイマーバーの更新
            const percentage = (this.timeLeft / 30) * 100;
            timerBar.style.width = percentage + '%';
            
            // 残り時間による警告
            if (this.timeLeft <= 10) {
                timerBar.style.background = '#fbbf24';
                document.getElementById('timer-display').classList.add('time-warning');
            }
            
            if (this.timeLeft <= 5) {
                timerBar.style.background = '#ef4444';
                document.getElementById('timer-display').classList.remove('time-warning');
                document.getElementById('timer-display').classList.add('time-critical');
            }
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    checkAnswer(answer) {
        const correctAnswer = (this.numbers[0] + this.numbers[1]) % 10;
        const isCorrect = answer === correctAnswer;
        
        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer();
        }
        
        // 次の問題へ
        this.slideNumbers();
    }
    
    updateTensDigit() {
        const sum = this.numbers[0] + this.numbers[1];
        const tensDigit = Math.floor(sum / 10);
        const tensElement = document.getElementById('tens-digit');
        
        if (tensDigit > 0) {
            tensElement.textContent = tensDigit;
            tensElement.style.opacity = '0.8';
        } else {
            tensElement.textContent = '';
            tensElement.style.opacity = '0';
        }
    }
    
    handleCorrectAnswer() {
        const now = Date.now();
        
        // コンボ判定
        // コンボタイマーがまだ動いている（comboTimeLeft > 0）なら継続
        // そうでなければ新規スタート
        if (this.comboTimeLeft > 0 && this.combo > 0) {
            // コンボ継続
            this.combo++;
        } else {
            // 新規コンボスタート
            this.combo = 1;
        }
        
        // スコア計算（コンボマネージャーを使用）
        // 残り時間をそのまま渡す（0-700ms）
        const points = window.comboManager?.calculateScore(1, this.combo, this.comboTimeLeft) || 1;
        
        // デバッグ用（本番では削除）
        console.log(`コンボ: ${this.combo}, 残り時間: ${this.comboTimeLeft}ms, 獲得ポイント: ${points}`);
        
        this.score += points;
        
        // エフェクト表示
        if (this.combo > 1) {
            this.showComboEffect();
        }
        this.showScorePopup(points, true);
        
        this.correctCount++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.lastAnswerTime = now;
        
        // 正解エフェクト
        this.showCorrectEffect();
        window.soundManager?.playCorrect();
        
        // コンボタイマーをリセット（700msから再スタート）
        this.resetComboTimer();
        
        this.updateUI();
    }
    
    handleIncorrectAnswer() {
        const now = Date.now();
        
        // 不正解もコンボ（マイナス）
        if (this.comboTimeLeft > 0 && this.combo < 0) {
            // 不正解コンボ継続
            this.combo--;
        } else {
            // 新規不正解コンボスタート
            this.combo = -1;
        }
        
        // スコア計算
        const points = -(window.comboManager?.calculateScore(1, Math.abs(this.combo), this.comboTimeLeft) || 1);
        this.score = Math.max(0, this.score + points); // スコアが負にならないように
        
        this.showScorePopup(points, false);
        
        this.incorrectCount++;
        this.lastAnswerTime = now;
        
        // 不正解エフェクト
        this.showIncorrectEffect();
        window.soundManager?.playIncorrect();
        
        // コンボタイマーリセット（700msから再スタート）
        this.resetComboTimer();
        
        this.updateUI();
    }
    
    slideNumbers() {
        // 各要素を取得
        const num1 = document.getElementById('num1');
        const num2 = document.getElementById('num2');
        const preview1 = document.getElementById('preview1');
        const preview2 = document.getElementById('preview2');
        
        // 新しい数字を生成
        const newNumber = this.generateNextNumber();
        
        // 内部的に数字を即座に更新（正解判定用）
        this.numbers.shift();
        this.numbers.push(newNumber);
        
        // アニメーションクラスを追加（CSSで定義）
        num1.classList.add('slide-left-out');
        num2.classList.add('slide-left-to-num1');
        preview1.classList.add('slide-up-and-scale');
        preview2.classList.add('slide-left-preview');
        
        // アニメーション終了後の処理
        setTimeout(() => {
            // アニメーションクラスを削除
            num1.classList.remove('slide-left-out');
            num2.classList.remove('slide-left-to-num1');
            preview1.classList.remove('slide-up-and-scale');
            preview2.classList.remove('slide-left-preview');
            
            // 表示を更新
            this.updateNumberDisplay();
            
            // 新しい数字の出現アニメーション
            preview2.classList.add('fade-in');
            setTimeout(() => preview2.classList.remove('fade-in'), 300);
            
            // キラキラエフェクト（待機数字が計算数字になった時）
            this.showSlideEffect();
        }, 500);
    }
    
    showSlideEffect() {
        const num2 = document.getElementById('num2');
        const rect = num2.getBoundingClientRect();
        const effectLayer = document.getElementById('effect-layer');
        const effectRect = effectLayer.getBoundingClientRect();
        
        // パーティクルエフェクト
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = (rect.left - effectRect.left + rect.width/2) + 'px';
                particle.style.top = (rect.top - effectRect.top + rect.height/2) + 'px';
                
                const angle = (Math.PI * 2 * i) / 3;
                const distance = 30;
                particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
                particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
                
                effectLayer.appendChild(particle);
                setTimeout(() => particle.remove(), 600);
            }, i * 50);
        }
    }
    
    resetComboTimer() {
        // 既存のタイマーをクリア
        clearInterval(this.comboTimer);
        
        // コンボが0の場合は何もしない
        if (this.combo === 0) {
            this.comboTimeLeft = 0;
            document.getElementById('combo-display').classList.remove('combo-active');
            return;
        }
        
        // 800msにリセット
        this.comboTimeLeft = 800;
        
        const comboFill = document.getElementById('combo-fill');
        comboFill.style.width = '100%';
        comboFill.style.transition = 'none'; // 即座に100%に
        
        // コンボ表示をアクティブに
        document.getElementById('combo-display').classList.add('combo-active');
        
        // 少し遅らせてからアニメーション開始
        setTimeout(() => {
            comboFill.style.transition = 'width 0.8s linear';
            comboFill.style.width = '0%';
        }, 10);
        
        const startTime = Date.now();
        this.comboTimer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            this.comboTimeLeft = Math.max(0, 800 - elapsed);
            
            if (this.comboTimeLeft <= 0) {
                clearInterval(this.comboTimer);
                document.getElementById('combo-display').classList.remove('combo-active');
                // コンボをリセット（表示は維持）
                this.combo = 0;
                // updateUIは呼ばない（コンボ表示を維持）
            }
        }, 10);
    }
    
    showCorrectEffect() {
        const num1 = document.getElementById('num1');
        const num2 = document.getElementById('num2');
        
        num1.classList.add('correct-effect');
        num2.classList.add('correct-effect');
        
        setTimeout(() => {
            num1.classList.remove('correct-effect');
            num2.classList.remove('correct-effect');
        }, 500);
        
        // パーティクルエフェクト
        this.createParticles(num1, false);
        this.createParticles(num2, false);
    }
    
    showIncorrectEffect() {
        const num1 = document.getElementById('num1');
        const num2 = document.getElementById('num2');
        
        num1.classList.add('incorrect-effect');
        num2.classList.add('incorrect-effect');
        
        setTimeout(() => {
            num1.classList.remove('incorrect-effect');
            num2.classList.remove('incorrect-effect');
        }, 500);
        
        // エラーパーティクル
        this.createParticles(num1, true);
        this.createParticles(num2, true);
    }
    
    showComboEffect() {
        const comboDisplay = document.getElementById('combo-display');
        const burst = document.createElement('div');
        burst.className = 'combo-burst';
        comboDisplay.appendChild(burst);
        
        setTimeout(() => burst.remove(), 600);
    }
    
    showScorePopup(points, isPositive) {
        const container = document.getElementById('numbers-container');
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        if (!isPositive) popup.classList.add('negative');
        
        // 大きな数字は短縮表示
        let displayPoints = points;
        if (Math.abs(points) >= 10000) {
            displayPoints = (Math.abs(points) / 1000).toFixed(1) + 'K';
        } else if (Math.abs(points) >= 1000) {
            displayPoints = Math.abs(points).toLocaleString();
        }
        
        popup.textContent = (isPositive ? '+' : '-') + displayPoints;
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        
        // 大きなポイントほど目立つように
        if (Math.abs(points) >= 1000) {
            popup.style.fontSize = '3em';
        }
        
        document.getElementById('effect-layer').appendChild(popup);
        
        setTimeout(() => popup.remove(), 1000);
    }
    
    createParticles(element, isError) {
        const rect = element.getBoundingClientRect();
        const effectLayer = document.getElementById('effect-layer');
        const effectRect = effectLayer.getBoundingClientRect();
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle' + (isError ? ' error' : '');
            
            const angle = (Math.PI * 2 * i) / 10;
            const distance = 50 + Math.random() * 50;
            
            particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
            
            particle.style.left = (rect.left - effectRect.left + rect.width / 2) + 'px';
            particle.style.top = (rect.top - effectRect.top + rect.height / 2) + 'px';
            
            effectLayer.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('combo').textContent = Math.abs(this.combo);
        document.getElementById('max-combo-value').textContent = this.maxCombo;
    }
    
    endGame() {
        this.isPlaying = false;
        clearInterval(this.gameTimer);
        clearInterval(this.comboTimer);
        
        // 終了画面の表示
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('end-screen').classList.add('active');
        
        // スコア表示
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('max-combo').textContent = this.maxCombo;
        document.getElementById('correct-count').textContent = this.correctCount;
        
        // ランキング判定
        if (window.rankingManager?.isHighScore(this.score)) {
            document.getElementById('name-input-container').style.display = 'block';
        } else {
            document.getElementById('name-input-container').style.display = 'none';
        }
        
        // タイマー表示リセット
        document.getElementById('timer-display').classList.remove('time-warning', 'time-critical');
    }
}

// ゲームインスタンスの作成
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});