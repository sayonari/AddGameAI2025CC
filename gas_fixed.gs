// Google Apps Script for AddGameAI2025CC Rankings (修正版)

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const action = e.parameter.action || 'getRankings';
  const callback = e.parameter.callback;
  
  let responseData;
  
  try {
    if (action === 'getRankings') {
      const rankings = getRankings(sheet);
      responseData = {success: true, rankings: rankings};
    } else if (action === 'addScore') {
      const name = e.parameter.name;
      const score = parseInt(e.parameter.score);
      const combo = parseInt(e.parameter.combo || '0');
      const inputMethod = e.parameter.inputMethod || 'keyboard';
      
      if (!name || isNaN(score) || score < 0 || score > 2000000) {
        responseData = {success: false, error: 'Invalid parameters'};
      } else if (isNaN(combo) || combo < 0 || combo > 100) {
        responseData = {success: false, error: 'Invalid combo'};
      } else {
        const sanitizedName = name.replace(/[<>\"'&]/g, '').substring(0, 10);
        addScore(sheet, sanitizedName, score, combo, inputMethod);
        const rankings = getRankings(sheet);
        responseData = {success: true, rankings: rankings};
      }
    } else {
      responseData = {success: false, error: 'Invalid action'};
    }
  } catch (error) {
    responseData = {success: false, error: error.toString()};
  }
  
  // レスポンスを作成
  const jsonString = JSON.stringify(responseData);
  let output;
  
  if (callback) {
    // JSONP形式
    output = ContentService.createTextOutput(callback + '(' + jsonString + ')');
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // 通常のJSON
    output = ContentService.createTextOutput(jsonString);
    output.setMimeType(ContentService.MimeType.JSON);
  }
  
  return output;
}

function getRankings(sheet) {
  const data = sheet.getDataRange().getValues();
  const rankings = [];
  
  // ヘッダー行をスキップ
  for (let i = 1; i < data.length && i <= 100; i++) {
    if (data[i][0]) {
      rankings.push({
        name: data[i][0],
        score: data[i][1],
        combo: data[i][2] || 0,
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
  const now = new Date();
  
  // 新しい行を追加
  sheet.appendRow([
    name.substring(0, 10),
    score,
    combo || 0,
    inputMethod,
    now
  ]);
  
  // データをスコアでソート
  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5);
  range.sort({column: 2, ascending: false});
  
  // 100件を超えたら古いデータを削除
  if (sheet.getLastRow() > 101) {
    sheet.deleteRows(102, sheet.getLastRow() - 101);
  }
}

// 初期設定用関数
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

// テスト用関数
function testDoGet() {
  const e = {
    parameter: {
      action: 'getRankings',
      callback: 'testCallback'
    }
  };
  
  const result = doGet(e);
  console.log(result.getContent());
}