// 設定ファイル
(function() {
    // 難読化された設定
    // TODO: 新しいGAS URLのIDを下記の_0x4e2a[4]に設定してください
    const _0x4e2a = ['https://','script.google','.com/','macros/s/','AKfycbwpQVMGNGxCJWvltTfNHiQvlmr-jkbRDk7daFJL-JMhhq038PMokcX9QPvj6DO1nIuX','/exec'];
    const _0x3f5b = function(i) { return _0x4e2a[i]; };
    
    // URLを組み立て（簡単な難読化）
    window.GAS_WEBAPP_URL = _0x3f5b(0) + _0x3f5b(1) + _0x3f5b(2) + _0x3f5b(3) + _0x3f5b(4) + _0x3f5b(5);
    
    // 追加のセキュリティ設定
    window.GAME_CONFIG = {
        // 最大スコアの制限
        MAX_SCORE: 2000000,
        // 最小スコア送信間隔（ミリ秒）
        MIN_SUBMIT_INTERVAL: 30000, // 30秒
        // 最大コンボ数
        MAX_COMBO: 100,
        // バージョン（不正なクライアントの検出用）
        VERSION: '1.0.0'
    };
})();