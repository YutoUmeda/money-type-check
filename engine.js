// ============================================================
// マネータイプ診断 判定エンジン v5
// 変更点: タイブレーク最終フォールバックをランダムに変更
//         （偏り解消のため）
// ============================================================

const DiagnosisEngine = {

  diagnose(answers) {
    const totals = {
      mamoru: 0, fuyasu: 0,
      ronri: 0,  chokkan: 0,
      keikaku: 0, chosen: 0,
      anshin: 0, jiyuu: 0,
      shunyuKaizen: 0,
      shisanKeisei: 0,
    };

    let q9Answer = null;
    let q10Answer = null;

    answers.forEach(({ questionId, choiceIndex }) => {
      const q = MONEY_DATA.questions.find(q => q.id === questionId);
      if (!q) return;
      const choice = q.choices[choiceIndex];
      if (!choice) return;

      if (questionId === "Q9")  q9Answer  = choice.scores;
      if (questionId === "Q10") q10Answer = choice.scores;

      Object.keys(choice.scores).forEach(key => {
        totals[key] += choice.scores[key];
      });
    });

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

  _determineAxes(totals, q9, q10) {
    return {
      mamoru:  this._resolveAxis(totals.mamoru,  totals.fuyasu,  q9, q10, "mamoru",  "fuyasu"),
      ronri:   this._resolveAxis(totals.ronri,   totals.chokkan, q9, q10, "ronri",   "chokkan"),
      keikaku: this._resolveAxis(totals.keikaku, totals.chosen,  q9, q10, "keikaku", "chosen"),
      anshin:  this._resolveAxis(totals.anshin,  totals.jiyuu,   q9, q10, "anshin",  "jiyuu"),
    };
  },

  _resolveAxis(scoreA, scoreB, q9, q10, keyA, keyB) {
    // ① スコアが異なれば高い方
    if (scoreA !== scoreB) return scoreA > scoreB;

    // ② 同点 → Q9を優先
    if (q9) {
      const a9 = q9[keyA] || 0;
      const b9 = q9[keyB] || 0;
      if (a9 !== b9) return a9 > b9;
    }

    // ③ まだ同点 → Q10を優先
    if (q10) {
      const a10 = q10[keyA] || 0;
      const b10 = q10[keyB] || 0;
      if (a10 !== b10) return a10 > b10;
    }

    // ④ 最終フォールバック: ランダム
    //    旧: return false（Bサイド固定 → unicorn/turtleに偏る原因）
    //    新: Math.random() < 0.5（均等分散）
    return Math.random() < 0.5;
  }
};
