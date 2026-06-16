/**
 * マネータイプ診断 - Google Apps Script
 * ② プロフィール3列追加（ニックネーム・年代・性別）
 */

const SHEET_NAME = '診断ログ';

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'マネータイプ診断GAS稼働中' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let data;
    try { data = JSON.parse(e.postData.contents); } catch { data = e.parameter; }

    if (data.action !== 'saveDiagnosis') return respond({ status: 'error', message: 'Unknown action' });

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return respond({ status: 'error', message: `シート "${SHEET_NAME}" が見つかりません` });

    ensureHeader(sheet);

    // 既存16列 + 追加3列 = 計19列
    const row = [
      data.datetime || new Date().toLocaleString('ja-JP'),
      data.resultType   || '',
      data.animal       || '',
      data.mamoru       || 0,
      data.fuyasu       || 0,
      data.ronri        || 0,
      data.chokkan      || 0,
      data.keikaku      || 0,
      data.chosen       || 0,
      data.anshin       || 0,
      data.jiyuu        || 0,
      data.shunyuKaizen || 0,
      data.shisanKeisei || 0,
      data.email        || '',
      data.xShare       || '未',
      data.memo         || '',
      // ② 追加3列
      data.nickname     || '',
      data.age          || '',
      data.gender       || '',
    ];

    sheet.appendRow(row);
    return respond({ status: 'ok', message: '保存完了' });

  } catch (err) {
    return respond({ status: 'error', message: err.toString() });
  }
}

function ensureHeader(sheet) {
  const headerRow = sheet.getRange(1, 1, 1, 19).getValues()[0];
  const isEmpty   = headerRow.every(cell => cell === '' || cell === null);

  if (isEmpty) {
    sheet.getRange(1, 1, 1, 19).setValues([[
      '日時', '結果タイプ', '動物',
      '守る', '増やす', '論理', '直感', '計画', '挑戦', '安心', '自由',
      '収入改善ニーズ', '資産形成ニーズ',
      'メールアドレス', 'Xシェア', '備考',
      'ニックネーム', '年代', '性別',
    ]]);
    const header = sheet.getRange(1, 1, 1, 19);
    header.setBackground('#4a2a8c');
    header.setFontColor('#ffffff');
    header.setFontWeight('bold');
  } else {
    // 既存ヘッダーに追加列がなければ末尾に追加
    const lastCol = sheet.getLastColumn();
    if (lastCol < 17) {
      sheet.getRange(1, 17, 1, 3).setValues([['ニックネーム', '年代', '性別']]);
      sheet.getRange(1, 17, 1, 3).setBackground('#4a2a8c').setFontColor('#ffffff').setFontWeight('bold');
    }
  }
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
