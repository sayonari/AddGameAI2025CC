class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {
            correct: null,
            incorrect: null,
            combo: null,
            gameStart: null,
            gameEnd: null,
            countdown: null
        };
        
        this.enabled = true;
        this.init();
    }
    
    init() {
        // Web Audio APIの初期化
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // 音声を生成
            this.createSounds();
            
            // ユーザーインタラクションで音声を有効化
            document.addEventListener('click', () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            }, { once: true });
            
        } catch (e) {
            console.warn('Web Audio APIがサポートされていません:', e);
            this.enabled = false;
        }
    }
    
    createSounds() {
        // 正解音（明るい上昇音）
        this.sounds.correct = this.createTone([523.25, 659.25, 783.99], 0.1, 'sine');
        
        // 不正解音（低い下降音）
        this.sounds.incorrect = this.createTone([293.66, 246.94], 0.15, 'square', 0.3);
        
        // コンボ音（きらめき音）
        this.sounds.combo = this.createTone([1046.50, 1318.51, 1567.98], 0.08, 'sine', 0.5);
        
        // ゲーム開始音
        this.sounds.gameStart = this.createTone([261.63, 329.63, 392.00, 523.25], 0.1, 'sine');
        
        // ゲーム終了音
        this.sounds.gameEnd = this.createTone([523.25, 392.00, 329.63, 261.63], 0.15, 'sine');
        
        // カウントダウン音
        this.sounds.countdown = this.createTone([880], 0.1, 'sine', 0.5);
    }
    
    createTone(frequencies, duration, type = 'sine', volume = 1.0) {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const now = this.audioContext.currentTime;
            const gainNode = this.audioContext.createGain();
            gainNode.connect(this.audioContext.destination);
            
            // 音量設定
            gainNode.gain.setValueAtTime(volume * 0.3, now);
            
            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                oscillator.type = type;
                oscillator.frequency.setValueAtTime(freq, now + index * duration);
                
                oscillator.connect(gainNode);
                oscillator.start(now + index * duration);
                oscillator.stop(now + (index + 1) * duration);
                
                // フェードアウト
                gainNode.gain.exponentialRampToValueAtTime(
                    0.01,
                    now + frequencies.length * duration
                );
            });
        };
    }
    
    playCorrect() {
        if (this.sounds.correct) {
            this.sounds.correct();
        }
    }
    
    playIncorrect() {
        if (this.sounds.incorrect) {
            this.sounds.incorrect();
        }
    }
    
    playCombo() {
        if (this.sounds.combo) {
            this.sounds.combo();
        }
    }
    
    playGameStart() {
        if (this.sounds.gameStart) {
            this.sounds.gameStart();
        }
    }
    
    playGameEnd() {
        if (this.sounds.gameEnd) {
            this.sounds.gameEnd();
        }
    }
    
    playCountdown() {
        if (this.sounds.countdown) {
            this.sounds.countdown();
        }
    }
    
    // ボリューム調整
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }
    
    // 音声の有効/無効切り替え
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// サウンドマネージャーのインスタンス作成
document.addEventListener('DOMContentLoaded', () => {
    window.soundManager = new SoundManager();
    
    // ゲーム開始時に音を鳴らす
    const originalStartGame = window.game.startGame.bind(window.game);
    window.game.startGame = function() {
        window.soundManager.playGameStart();
        originalStartGame();
    };
    
    // ゲーム終了時に音を鳴らす
    const originalEndGame = window.game.endGame.bind(window.game);
    window.game.endGame = function() {
        window.soundManager.playGameEnd();
        originalEndGame();
    };
    
    // コンボ時の音
    const originalShowComboEffect = window.game.showComboEffect.bind(window.game);
    window.game.showComboEffect = function() {
        if (window.game.combo > 5) {
            window.soundManager.playCombo();
        }
        originalShowComboEffect();
    };
    
    // カウントダウン音（残り5秒以下）
    const originalStartGameTimer = window.game.startGameTimer.bind(window.game);
    window.game.startGameTimer = function() {
        originalStartGameTimer();
        
        // 既存のタイマー処理に音を追加
        const originalInterval = window.game.gameTimer;
        clearInterval(window.game.gameTimer);
        
        window.game.gameTimer = setInterval(() => {
            window.game.timeLeft--;
            document.getElementById('time').textContent = window.game.timeLeft;
            
            const percentage = (window.game.timeLeft / 30) * 100;
            document.getElementById('timer-fill').style.width = percentage + '%';
            
            if (window.game.timeLeft <= 10) {
                document.getElementById('timer-fill').style.background = '#fbbf24';
                document.getElementById('timer-display').classList.add('time-warning');
            }
            
            if (window.game.timeLeft <= 5) {
                document.getElementById('timer-fill').style.background = '#ef4444';
                document.getElementById('timer-display').classList.remove('time-warning');
                document.getElementById('timer-display').classList.add('time-critical');
                
                // カウントダウン音
                window.soundManager.playCountdown();
            }
            
            if (window.game.timeLeft <= 0) {
                window.game.endGame();
            }
        }, 1000);
    };
});