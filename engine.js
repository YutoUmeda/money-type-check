// ============================================================
// マネータイプ診断 判定エンジン
// ============================================================

const DiagnosisEngine = {

  /**
   * 回答配列から集計＆タイプ判定を行う
   * @param {Array} answers - [{questionId, choiceIndex}, ...]
   * @returns {Object} result
   */
  diagnose(answers) {
    const totals = {
      mamoru: 0, fuyasu: 0,
      ronri: 0,  chokkan: 0,
      keikaku: 0, chosen: 0,
      anshin: 0, jiyuu: 0,
      shunyuKaizen: 0,
      shisanKeisei: 0,
    };

    // Q9, Q10の回答を保存（タイブレーク用）
    let q9Answer = null;
    let q10Answer = null;

    answers.forEach(({ questionId, choiceIndex }) => {
      const q = MONEY_DATA.questions.find(q => q.id === questionId);
      if (!q) return;
      const choice = q.choices[choiceIndex];
      if (!choice) return;

      if (questionId === "Q9") q9Answer = choice.scores;
      if (questionId === "Q10") q10Answer = choice.scores;

      Object.keys(choice.scores).forEach(key => {
        totals[key] += choice.scores[key];
      });
    });

    // 4軸判定（タイブレーク込み）
    const axes = this._determineAxes(totals, q9Answer, q10Answer);
    const typeData = MONEY_DATA.getTypeByAxes(
      axes.mamoru, axes.ronri, axes.keikaku, axes.anshin
    );

    return {
      totals,
      axes,
      type: typeData,
      axisScores: {
        mamoru:  totals.mamoru,
        fuyasu:  totals.fuyasu,
        ronri:   totals.ronri,
        chokkan: totals.chokkan,
        keikaku: totals.keikaku,
        chosen:  totals.chosen,
        anshin:  totals.anshin,
        jiyuu:   totals.jiyuu,
        shunyuKaizen: totals.shunyuKaizen,
        shisanKeisei: totals.shisanKeisei,
      }
    };
  },

  /**
   * タイブレークルールに従って4軸を決定
   */
  _determineAxes(totals, q9, q10) {
    return {
      mamoru:  this._resolveAxis(totals.mamoru,  totals.fuyasu,  false, q9, q10, "mamoru",  "fuyasu"),
      ronri:   this._resolveAxis(totals.ronri,   totals.chokkan, false, q9, q10, "ronri",   "chokkan"),
      keikaku: this._resolveAxis(totals.keikaku, totals.chosen,  false, q9, q10, "keikaku", "chosen"),
      anshin:  this._resolveAxis(totals.anshin,  totals.jiyuu,   false, q9, q10, "anshin",  "jiyuu"),
    };
  },

  /**
   * 1軸の判定（同点時タイブレーク）
   * @returns {boolean} true = 第1項目（守る/論理/計画/安心）, false = 第2項目
   */
  _resolveAxis(scoreA, scoreB, defaultA, q9, q10, keyA, keyB) {
    if (scoreA !== scoreB) return scoreA > scoreB;

    // ① 同点 → Q9を優先
    if (q9) {
      const a9 = q9[keyA] || 0;
      const b9 = q9[keyB] || 0;
      if (a9 !== b9) return a9 > b9;
    }

    // ② まだ同点 → Q10を優先
    if (q10) {
      const a10 = q10[keyA] || 0;
      const b10 = q10[keyB] || 0;
      if (a10 !== b10) return a10 > b10;
    }

    // ③ まだ同点 → デフォルト優先ルール
    // 増やす > 直感 > 挑戦 > 自由 を優先 → 軸のBサイドを優先
    // mamoru/fuyasu → fuyasu優先 → return false
    // ronri/chokkan → chokkan優先 → return false
    // keikaku/chosen → chosen優先 → return false
    // anshin/jiyuu → jiyuu優先 → return false
    return false;
  }
};
