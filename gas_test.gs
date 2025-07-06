// テスト用の簡単な関数
function doGet(e) {
  // シンプルなテストレスポンス
  const callback = e.parameter.callback;
  const testData = {
    success: true,
    message: "GAS is working!",
    timestamp: new Date().toISOString()
  };
  
  if (callback) {
    // JSONP形式
    const output = ContentService.createTextOutput(
      `${callback}(${JSON.stringify(testData)})`
    );
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
    return output;
  } else {
    // 通常のJSON
    const output = ContentService.createTextOutput(JSON.stringify(testData));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}