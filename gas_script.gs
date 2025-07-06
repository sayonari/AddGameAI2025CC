// Google Apps Script for AddGameAI2025CC Rankings

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // JSONPコールバックのチェック
  const callback = e.parameter.callback;
  
  try {
    const action = e.parameter.action;
    
    if (action === 'getRankings') {
      // ランキング取得
      const rankings = getRankings(sheet);
      return createResponse({success: true, rankings: rankings}, callback);
      
    } else if (action === 'addScore') {
      // スコア追加
      const name = e.parameter.name;
      const score = parseInt(e.parameter.score);
      const combo = parseInt(e.parameter.combo);
      const inputMethod = e.parameter.inputMethod || 'keyboard';
      
      // 検証を強化
      if (!name || isNaN(score) || score < 0 || score > 2000000) {
        return createResponse({success: false, error: 'Invalid parameters'}, callback);
      }
      
      // コンボの検証
      if (isNaN(combo) || combo < 0 || combo > 100) {
        return createResponse({success: false, error: 'Invalid combo'}, callback);
      }
      
      // 名前の検証（XSS対策）
      const sanitizedName = name.replace(/[<>\"'&]/g, '').substring(0, 10);
      
      // バージョンチェック（オプション）
      const version = e.parameter.version || '1.0.0';
      
      // タイムスタンプチェック（5分以内のリクエストのみ受け付け）
      const timestamp = parseInt(e.parameter.timestamp || '0');
      const now = Date.now();
      if (Math.abs(now - timestamp) > 300000) { // 5分
        return createResponse({success: false, error: 'Request timeout'}, callback);
      }
      
      // レート制限（同じ名前で短時間に大量投稿を防ぐ）
      const recentEntries = getRecentEntriesByName(sheet, sanitizedName, 30000); // 30秒以内
      if (recentEntries.length >= 1) {
        return createResponse({success: false, error: 'Too many submissions. Please wait.'}, callback);
      }
      
      addScore(sheet, sanitizedName, score, combo, inputMethod);
      const rankings = getRankings(sheet);
      
      return createResponse({success: true, rankings: rankings}, callback);
      
    } else {
      return createResponse({success: false, error: 'Invalid action'}, callback);
    }
    
  } catch (error) {
    return createResponse({success: false, error: error.toString()}, callback);
  }
}

function getRankings(sheet) {
  const data = sheet.getDataRange().getValues();
  const rankings = [];
  
  // ヘッダー行をスキップ
  for (let i = 1; i < data.length && i <= 100; i++) { // 最大100件
    if (data[i][0]) { // 名前が存在する場合
      rankings.push({
        name: data[i][0],
        score: data[i][1],
        combo: data[i][2],
        inputMethod: data[i][3] || 'keyboard',
        date: data[i][4] ? new Date(data[i][4]).toISOString() : new Date().toISOString()
      });
    }
  }
  
  // スコアでソート
  rankings.sort((a, b) => b.score - a.score);
  
  // 上位50件のみ返す
  return rankings.slice(0, 50);
}

function addScore(sheet, name, score, combo, inputMethod) {
  // 現在の日時
  const now = new Date();
  
  // 新しい行を追加
  sheet.appendRow([
    name.substring(0, 10), // 最大10文字
    score,
    combo || 0,
    inputMethod,
    now
  ]);
  
  // データをスコアでソート（ヘッダー行は除く）
  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5);
  range.sort({column: 2, ascending: false});
  
  // 100件を超えたら古いデータを削除
  if (sheet.getLastRow() > 101) { // ヘッダー行 + 100件
    sheet.deleteRows(102, sheet.getLastRow() - 101);
  }
}

function createResponse(data, callback) {
  let output;
  
  if (callback) {
    // JSONP形式で返す
    const jsonString = JSON.stringify(data);
    output = ContentService.createTextOutput(`${callback}(${jsonString})`);
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // 通常のJSON形式
    output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
  }
  
  return output;
}

// レート制限用の関数
function getRecentEntriesByName(sheet, name, timeWindowMs) {
  const data = sheet.getDataRange().getValues();
  const now = new Date().getTime();
  const recentEntries = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name && data[i][4]) {
      const entryTime = new Date(data[i][4]).getTime();
      if (now - entryTime < timeWindowMs) {
        recentEntries.push(data[i]);
      }
    }
  }
  
  return recentEntries;
}

// 初期設定用関数（一度だけ実行）
function initializeSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // ヘッダー行を設定
  sheet.getRange(1, 1, 1, 5).setValues([['Name', 'Score', 'Combo', 'InputMethod', 'Date']]);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 150); // Name
  sheet.setColumnWidth(2, 100); // Score
  sheet.setColumnWidth(3, 80);  // Combo
  sheet.setColumnWidth(4, 100); // InputMethod
  sheet.setColumnWidth(5, 150); // Date
}