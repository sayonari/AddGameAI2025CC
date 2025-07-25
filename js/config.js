// 設定ファイル
(function() {
    // GAS URLを設定
    window.GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwZEsWe5g0QOb_KDe7KPJ-rxluzjyWE6hbCgjtyLjIlFvWGajYvU4df5DHrYnMmGVAj/exec';
    
    // JSONP非対応の場合はfetchを使用するフラグ
    window.USE_FETCH_INSTEAD_OF_JSONP = true;
    
    // GitHub Pages用：CORSプロキシを使用
    window.USE_CORS_PROXY = true;
    // 複数のCORSプロキシを試す
    window.CORS_PROXIES = [
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://corsproxy.io/?'
    ];
    window.CORS_PROXY_URL = window.CORS_PROXIES[0];  // デフォルトは最初のプロキシ
    
    
    // 追加のセキュリティ設定
    window.GAME_CONFIG = {
        // 最大スコアの制限
        MAX_SCORE: 2000000,
        // 最小スコア送信間隔（ミリ秒）
        MIN_SUBMIT_INTERVAL: 5000, // 5秒（テスト用に短縮）
        // 最大コンボ数
        MAX_COMBO: 100,
        // バージョン（不正なクライアントの検出用）
        VERSION: '1.0.0'
    };
})();