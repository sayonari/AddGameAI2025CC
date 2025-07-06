// シンプルなJSONP対応版 Google Apps Script

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const action = e.parameter.action || 'getRankings';
    const callback = e.parameter.callback;
    
    let result;
    
    if (action === 'getRankings') {
      // ランキング取得
      const rankings = getRankings(sheet);
      result = {success: true, rankings: rankings};
      
    } else if (action === 'addScore') {
      // スコア追加
      const name = e.parameter.name || '';
      const score = parseInt(e.parameter.score || '0');
      const combo = parseInt(e.parameter.combo || '0');
      const inputMethod = e.parameter.inputMethod || 'keyboard';
      
      if (name && score > 0) {
        addScore(sheet, name, score, combo, inputMethod);
        result = {success: true, message: 'Score added'};
      } else {
        result = {success: false, error: 'Invalid parameters'};
      }
      
    } else {
      result = {success: false, error: 'Unknown action'};
    }
    
    // レスポンスを返す
    return createOutput(result, callback);
    
  } catch (error) {
    return createOutput({success: false, error: error.toString()}, e.parameter.callback);
  }
}

function createOutput(data, callback) {
  const jsonString = JSON.stringify(data);
  
  if (callback) {
    // JSONP形式で返す
    const output = ContentService.createTextOutput(callback + '(' + jsonString + ')');
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return output;
  } else {
    // 通常のJSON形式で返す
    const output = ContentService.createTextOutput(jsonString);
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

function getRankings(sheet) {
  const data = sheet.getDataRange().getValues();
  const rankings = [];
  
  // ヘッダー行をスキップ（1行目から開始）
  for (let i = 1; i < data.length && rankings.length < 50; i++) {
    if (data[i][0]) { // 名前が存在する場合
      rankings.push({
        name: String(data[i][0]),
        score: Number(data[i][1]) || 0,
        combo: Number(data[i][2]) || 0,
        inputMethod: String(data[i][3] || 'keyboard'),
        date: data[i][4] ? new Date(data[i][4]).toISOString() : new Date().toISOString()
      });
    }
  }
  
  // スコアでソート（降順）
  rankings.sort((a, b) => b.score - a.score);
  
  return rankings;
}

function addScore(sheet, name, score, combo, inputMethod) {
  // 新しい行を追加
  sheet.appendRow([
    name.substring(0, 10), // 最大10文字
    score,
    combo,
    inputMethod,
    new Date()
  ]);
  
  // スコアでソート（2列目でソート、降順）
  if (sheet.getLastRow() > 1) {
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5);
    range.sort({column: 2, ascending: false});
  }
  
  // 100件を超えたら削除
  if (sheet.getLastRow() > 101) {
    sheet.deleteRows(102, sheet.getLastRow() - 101);
  }
}

// スプレッドシート初期化関数
function initializeSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // クリア
  sheet.clear();
  
  // ヘッダー設定
  sheet.getRange(1, 1, 1, 5).setValues([['Name', 'Score', 'Combo', 'InputMethod', 'Date']]);
  
  // 列幅設定
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 80);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 150);
}

// テスト関数
function test() {
  const e = {parameter: {action: 'getRankings', callback: 'test'}};
  const result = doGet(e);
  console.log(result.getContent());
}