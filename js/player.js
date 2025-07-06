class PlayerManager {
    constructor() {
        this.storageKey = 'playerName';
        this.defaultName = 'ゲスト';
        this.currentName = this.loadName();
    }
    
    loadName() {
        try {
            const savedName = localStorage.getItem(this.storageKey);
            return savedName || this.defaultName;
        } catch (e) {
            console.error('名前の読み込みエラー:', e);
            return this.defaultName;
        }
    }
    
    saveName(name) {
        if (!name || name.trim() === '') {
            return false;
        }
        
        const trimmedName = name.trim().substring(0, 10);
        
        try {
            localStorage.setItem(this.storageKey, trimmedName);
            this.currentName = trimmedName;
            return true;
        } catch (e) {
            console.error('名前の保存エラー:', e);
            return false;
        }
    }
    
    getName() {
        return this.currentName;
    }
    
    hasName() {
        return this.currentName !== this.defaultName;
    }
    
    clearName() {
        try {
            localStorage.removeItem(this.storageKey);
            this.currentName = this.defaultName;
        } catch (e) {
            console.error('名前のクリアエラー:', e);
        }
    }
    
    displayNameStatus() {
        const nameInput = document.getElementById('player-name-input');
        const saveBtn = document.getElementById('save-name-btn');
        
        if (nameInput) {
            nameInput.value = this.currentName !== this.defaultName ? this.currentName : '';
            
            // 保存済みの場合は表示を変更
            if (this.hasName()) {
                saveBtn.textContent = '変更';
                nameInput.placeholder = '現在: ' + this.currentName;
            }
        }
        
        // 終了画面の名前入力欄も更新
        const endScreenNameInput = document.getElementById('player-name');
        if (endScreenNameInput && this.hasName()) {
            endScreenNameInput.value = this.currentName;
        }
    }
}

// プレイヤーマネージャーのインスタンス作成
document.addEventListener('DOMContentLoaded', () => {
    window.playerManager = new PlayerManager();
    
    // 名前の表示を初期化
    window.playerManager.displayNameStatus();
    
    // 保存ボタンのイベントリスナー
    const saveNameBtn = document.getElementById('save-name-btn');
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('player-name-input');
            const name = nameInput.value.trim();
            
            if (name) {
                if (window.playerManager.saveName(name)) {
                    // 成功フィードバック
                    saveNameBtn.textContent = '保存済み！';
                    saveNameBtn.style.background = '#4ade80';
                    
                    setTimeout(() => {
                        saveNameBtn.textContent = '変更';
                        saveNameBtn.style.background = '';
                        nameInput.placeholder = '現在: ' + name;
                    }, 1500);
                }
            }
        });
        
        // Enterキーで保存
        const nameInput = document.getElementById('player-name-input');
        if (nameInput) {
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveNameBtn.click();
                }
            });
        }
    }
});