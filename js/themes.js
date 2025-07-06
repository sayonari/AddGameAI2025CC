class ThemeManager {
    constructor() {
        this.themes = {
            default: {
                name: 'デフォルト',
                primary: '#4CAF50',
                secondary: '#45a049',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                text: '#333',
                card: 'rgba(255, 255, 255, 0.95)'
            },
            dark: {
                name: 'ダークモード',
                primary: '#bb86fc',
                secondary: '#9965f4',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                text: '#e0e0e0',
                card: 'rgba(30, 30, 46, 0.95)'
            },
            ocean: {
                name: 'オーシャン',
                primary: '#00bcd4',
                secondary: '#0097a7',
                background: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
                text: '#fff',
                card: 'rgba(255, 255, 255, 0.9)'
            },
            sunset: {
                name: 'サンセット',
                primary: '#ff6b6b',
                secondary: '#ee5a6f',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                text: '#fff',
                card: 'rgba(255, 255, 255, 0.9)'
            },
            forest: {
                name: 'フォレスト',
                primary: '#4caf50',
                secondary: '#388e3c',
                background: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
                text: '#fff',
                card: 'rgba(255, 255, 255, 0.9)'
            },
            candy: {
                name: 'キャンディ',
                primary: '#e91e63',
                secondary: '#c2185b',
                background: 'linear-gradient(135deg, #ff6ec4 0%, #7873f5 100%)',
                text: '#fff',
                card: 'rgba(255, 255, 255, 0.95)'
            },
            monochrome: {
                name: 'モノクローム',
                primary: '#424242',
                secondary: '#212121',
                background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
                text: '#e0e0e0',
                card: 'rgba(255, 255, 255, 0.1)'
            }
        };
        
        this.currentTheme = localStorage.getItem('selectedTheme') || 'default';
        this.applyTheme(this.currentTheme);
    }
    
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;
        
        const root = document.documentElement;
        
        // CSS変数を更新
        root.style.setProperty('--primary-color', theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);
        root.style.setProperty('--text-color', theme.text);
        root.style.setProperty('--card-background', theme.card);
        
        // 背景を更新
        document.body.style.background = theme.background;
        
        // ダークモードの場合は追加のスタイル調整
        if (themeName === 'dark' || themeName === 'monochrome') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        
        this.currentTheme = themeName;
        localStorage.setItem('selectedTheme', themeName);
    }
    
    createThemeSelector() {
        const selector = document.createElement('div');
        selector.className = 'theme-selector';
        selector.innerHTML = '<h3>🎨 テーマ選択</h3>';
        
        const grid = document.createElement('div');
        grid.className = 'theme-grid';
        
        for (const [key, theme] of Object.entries(this.themes)) {
            const themeOption = document.createElement('div');
            themeOption.className = `theme-option ${key === this.currentTheme ? 'active' : ''}`;
            themeOption.style.background = theme.background;
            themeOption.innerHTML = `
                <div class="theme-preview">
                    <div class="theme-name">${theme.name}</div>
                </div>
            `;
            
            themeOption.addEventListener('click', () => {
                // 前のアクティブを削除
                document.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                themeOption.classList.add('active');
                
                this.applyTheme(key);
                
                // 選択エフェクト
                themeOption.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    themeOption.style.transform = '';
                }, 100);
            });
            
            grid.appendChild(themeOption);
        }
        
        selector.appendChild(grid);
        return selector;
    }
}

// グローバルに追加
window.themeManager = new ThemeManager();