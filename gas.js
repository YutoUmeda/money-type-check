/**
 * マネータイプ診断 - Google Apps Script
 * デプロイ: ウェブアプリとして公開（全員アクセス可）
 *
 * 使い方:
 * 1. Google Sheetsを開く
 * 2. 拡張機能 > Apps Script
 * 3. このコードを貼り付けて保存
 * 4. デプロイ > 新しいデプロイ > ウェブアプリ
 *    - 実行ユーザー: 自分
 *    - アクセスできるユーザー: 全員（匿名含む）
 * 5. デプロイURLをapp.jsの GAS_URL に設定
 */

// シート名
const SHEET_NAME = '診断ログ';

/**
 * GETリクエスト（疎通確認用）
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'マネータイプ診断GAS稼働中' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POSTリクエスト（診断データ保存）
 */
function doPost(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch {
      data = e.parameter;
    }

    if (data.action !== 'saveDiagnosis') {
      return respond({ status: 'error', message: 'Unknown action' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return respond({ status: 'error', message: `シート "${SHEET_NAME}" が見つかりません` });
    }

    // ヘッダー行確認・追加
    ensureHeader(sheet);

    // データ行追加
    const row = [
      data.datetime || new Date().toLocaleString('ja-JP'),
      data.resultType || '',
      data.animal || '',
      data.mamoru || 0,
      data.fuyasu || 0,
      data.ronri || 0,
      data.chokkan || 0,
      data.keikaku || 0,
      data.chosen || 0,
      data.anshin || 0,
      data.jiyuu || 0,
      data.shunyuKaizen || 0,
      data.shisanKeisei || 0,
      data.email || '',
      data.xShare || '未',
      data.memo || '',
    ];

    sheet.appendRow(row);

    return respond({ status: 'ok', message: '保存完了' });

  } catch (err) {
    return respond({ status: 'error', message: err.toString() });
  }
}

/**
 * ヘッダー行を確認・追加
 */
function ensureHeader(sheet) {
  const headerRow = sheet.getRange(1, 1, 1, 16).getValues()[0];
  const isEmpty = headerRow.every(cell => cell === '' || cell === null);

  if (isEmpty) {
    sheet.getRange(1, 1, 1, 16).setValues([[
      '日時', '結果タイプ', '動物',
      '守る', '増やす', '論理', '直感', '計画', '挑戦', '安心', '自由',
      '収入改善ニーズ', '資産形成ニーズ',
      'メールアドレス', 'Xシェア', '備考'
    ]]);

    // ヘッダー書式
    const header = sheet.getRange(1, 1, 1, 16);
    header.setBackground('#4a2a8c');
    header.setFontColor('#ffffff');
    header.setFontWeight('bold');
  }
}

/**
 * レスポンス生成
 */
function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
