// ============================================================
// マネータイプ診断 アプリコントローラー
// ============================================================

const App = {
  // 状態管理
  state: {
    currentQuestion: 0,
    answers: [],
    result: null,
    email: null,
    xShared: false,
    profile: { nickname: '', age: '', gender: '' }, // ① プロフィール
  },

  // GASのURL（デプロイ後に差し替え）
  GAS_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

  // ============================================================
  // 初期化
  // ============================================================
  init() {
    this.renderTypeGrid();
    this.bindTopEvents();
    this.bindProfileEvents();
    this.showPage('top');
  },

  // ============================================================
  // ページ遷移
  // ============================================================
  showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + name);
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
  },

  // ============================================================
  // TOPページ
  // ============================================================
  renderTypeGrid() {
    const grid = document.getElementById('types-grid');
    if (!grid) return;
    grid.innerHTML = MONEY_DATA.types.map(t => `
      <div class="type-chip">
        <div class="type-chip-img-wrap">
          <img src="images/${t.image}" alt="${t.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
          <span style="display:none">${t.emoji}</span>
        </div>
        <div class="type-chip-name">${t.name}</div>
      </div>
    `).join('');
  },

  bindTopEvents() {
    document.querySelectorAll('.js-start-quiz').forEach(btn => {
      btn.addEventListener('click', () => this.startQuiz());
    });
  },

  // ============================================================
  // ① プロフィール入力
  // ============================================================
  bindProfileEvents() {
    const nicknameEl = document.getElementById('profile-nickname');
    const ageEl      = document.getElementById('profile-age');
    const genderEl   = document.getElementById('profile-gender');
    if (nicknameEl) nicknameEl.addEventListener('input', e => {
      this.state.profile.nickname = e.target.value.slice(0, 20);
    });
    if (ageEl) ageEl.addEventListener('change', e => {
      this.state.profile.age = e.target.value;
    });
    if (genderEl) genderEl.addEventListener('change', e => {
      this.state.profile.gender = e.target.value;
    });
  },

  // ============================================================
  // 診断開始
  // ============================================================
  startQuiz() {
    // 年代は必須チェック
    if (!this.state.profile.age) {
      this.showToast('年代を選択してください');
      const ageEl = document.getElementById('profile-age');
      if (ageEl) ageEl.focus();
      return;
    }
    this.state.currentQuestion = 0;
    this.state.answers = [];
    this.state.result = null;
    this.state.email = null;
    this.state.xShared = false;
    this.renderQuiz();
    this.showPage('quiz');
  },

  // ============================================================
  // 診断ページ描画
  // ============================================================
  renderQuiz() {
    const container = document.getElementById('quiz-container');
    if (!container) return;
    const total = MONEY_DATA.questions.length;
    container.innerHTML = MONEY_DATA.questions.map((q, qi) => `
      <div class="quiz-question ${qi === 0 ? 'active' : ''}" id="q-${qi}" data-qi="${qi}">
        <div class="quiz-q-label">Q${qi + 1} / ${total}</div>
        <div class="quiz-q-text">${q.text}</div>
        <div class="quiz-choices">
          ${q.choices.map((c, ci) => `
            <button class="quiz-choice" data-qi="${qi}" data-ci="${ci}">
              <span class="quiz-choice-letter">${['A','B','C','D'][ci]}</span>
              <span>${c.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
    this.updateProgress();
    this.bindQuizEvents();
  },

  bindQuizEvents() {
    document.querySelectorAll('.quiz-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const qi = parseInt(btn.dataset.qi);
        const ci = parseInt(btn.dataset.ci);
        this.selectChoice(qi, ci);
      });
    });
    document.getElementById('btn-next')?.addEventListener('click', () => this.goNextQuestion());
    document.getElementById('btn-back')?.addEventListener('click', () => this.goPrevQuestion());
  },

  selectChoice(qi, ci) {
    document.querySelectorAll(`.quiz-choice[data-qi="${qi}"]`).forEach(b => b.classList.remove('selected'));
    const target = document.querySelector(`.quiz-choice[data-qi="${qi}"][data-ci="${ci}"]`);
    if (target) target.classList.add('selected');
    const q = MONEY_DATA.questions[qi];
    this.state.answers[qi] = { questionId: q.id, choiceIndex: ci };
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.disabled = false;
  },

  goNextQuestion() {
    const qi = this.state.currentQuestion;
    if (!this.state.answers[qi]) return;
    if (qi >= MONEY_DATA.questions.length - 1) {
      this.finishQuiz();
      return;
    }
    document.getElementById(`q-${qi}`)?.classList.remove('active');
    this.state.currentQuestion++;
    document.getElementById(`q-${this.state.currentQuestion}`)?.classList.add('active');
    this.restoreSelection(this.state.currentQuestion);
    this.updateProgress();
    this.updateBtnState();
  },

  goPrevQuestion() {
    if (this.state.currentQuestion <= 0) { this.showPage('top'); return; }
    document.getElementById(`q-${this.state.currentQuestion}`)?.classList.remove('active');
    this.state.currentQuestion--;
    document.getElementById(`q-${this.state.currentQuestion}`)?.classList.add('active');
    this.restoreSelection(this.state.currentQuestion);
    this.updateProgress();
    this.updateBtnState();
  },

  restoreSelection(qi) {
    const saved = this.state.answers[qi];
    if (saved !== undefined) {
      document.querySelectorAll(`.quiz-choice[data-qi="${qi}"]`).forEach(b => b.classList.remove('selected'));
      document.querySelector(`.quiz-choice[data-qi="${qi}"][data-ci="${saved.choiceIndex}"]`)?.classList.add('selected');
    }
  },

  updateProgress() {
    const current = this.state.currentQuestion + 1;
    const total   = MONEY_DATA.questions.length;
    const fill  = document.getElementById('progress-fill');
    const label = document.getElementById('progress-label');
    if (fill)  fill.style.width = ((current / total) * 100) + '%';
    if (label) label.textContent = `${current} / ${total}`;
  },

  updateBtnState() {
    const qi      = this.state.currentQuestion;
    const nextBtn = document.getElementById('btn-next');
    const backBtn = document.getElementById('btn-back');
    if (nextBtn) {
      nextBtn.disabled   = !this.state.answers[qi];
      nextBtn.textContent = qi >= MONEY_DATA.questions.length - 1 ? '結果を見る →' : '次へ →';
    }
    if (backBtn) backBtn.textContent = qi === 0 ? '← TOPへ' : '← 戻る';
  },

  // ============================================================
  // 採点・判定
  // ============================================================
  finishQuiz() {
    this.showPage('loading');
    setTimeout(() => {
      const result = DiagnosisEngine.diagnose(this.state.answers);
      this.state.result = result;
      this.showPage('email');
    }, 1800);
  },

  // ============================================================
  // メール登録
  // ============================================================
  bindEmailEvents() {
    document.getElementById('btn-email-register')?.addEventListener('click', () => {
      const email = document.getElementById('input-email')?.value?.trim();
      if (email && !this.isValidEmail(email)) {
        this.showToast('メールアドレスの形式が正しくありません');
        return;
      }
      this.state.email = email || null;
      this.showResult();
    });
    document.getElementById('btn-email-skip')?.addEventListener('click', () => {
      this.state.email = null;
      this.showResult();
    });
  },

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // ============================================================
  // 結果ページ描画
  // ============================================================
  showResult() {
    const { result, email } = this.state;
    if (!result || !result.type) { this.showToast('判定エラーが発生しました'); return; }
    this.renderResult(result.type, result.axisScores);
    this.showPage('result');
    this.saveToSheets(result, email);
  },

  renderResult(t, scores) {
    const set     = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    // ヒーロー
    document.getElementById('result-type-emoji').textContent = t.emoji;
    document.getElementById('result-hero').style.setProperty('--type-color', t.colorMain);
    setText('result-ogp-catch', t.ogpCatch);

    // ① ニックネームがあれば「〇〇さんは〜」表示
    const nickname = this.state.profile.nickname;
    setText('result-title', nickname ? `${nickname}さんは「${t.name}」` : t.resultTitle);
    setText('result-lead', t.resultLead);

    // OGP画像
    const imgEl = document.getElementById('result-ogp-img');
    if (imgEl) {
      imgEl.src = `images/${t.ogpImage}`;
      imgEl.style.display = 'block';
      imgEl.onerror = () => {
        imgEl.style.display = 'none';
        document.getElementById('result-type-emoji-fallback').style.display = 'flex';
      };
    }

    // 各テキスト
    setText('result-summary', t.summary);
    set('result-desc', t.description);
    set('result-foryou', t.forYou);
    set('result-strengths',  t.strengths.map(s => `<span class="tag">${s}</span>`).join(''));
    set('result-weaknesses', t.weaknesses.map(w => `<span class="tag bad">${w}</span>`).join(''));
    setText('result-money', t.money);
    setText('result-work', t.work);
    setText('result-love', t.love);
    setText('result-failures', t.failures);
    setText('result-growth', t.growth);
    setText('result-stress', t.stress);
    setText('result-success-reason', t.successReason);
    setText('result-failure-scene', t.failureScene);

    // 相性
    const goodType = MONEY_DATA.getTypeByName(t.goodMatch);
    if (goodType) {
      const el = document.getElementById('result-good-match-emoji');
      if (el) el.innerHTML = `<img src="images/${goodType.image}" alt="${goodType.name}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin:0 auto;" onerror="this.outerHTML='${goodType.emoji}'">`;
    }
    setText('result-good-match-name', t.goodMatch);
    setText('result-good-match-reason', t.goodMatchReason);

    const badType = MONEY_DATA.getTypeByName(t.badMatch);
    if (badType) {
      const el = document.getElementById('result-bad-match-emoji');
      if (el) el.innerHTML = `<img src="images/${badType.image}" alt="${badType.name}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin:0 auto;" onerror="this.outerHTML='${badType.emoji}'">`;
    }
    setText('result-bad-match-name', t.badMatch);
    setText('result-bad-match-reason', t.badMatchReason);

    setText('result-message', t.message);
    setText('result-lucky-action', t.luckyAction);
    setText('result-lucky-color', t.luckyColor);
    setText('result-lucky-item', t.luckyItem);

    // ③ 広告枠描画
    this.renderAffiliate(t.id);

    // ボタン
    document.getElementById('btn-share-x')?.addEventListener('click', () => this.shareToX(t));
    document.getElementById('btn-retry')?.addEventListener('click', () => this.startQuiz());
  },

  // ============================================================
  // ③ 広告描画
  // ============================================================
  renderAffiliate(typeId) {
    const container = document.getElementById('affiliate-area');
    if (!container) return;
    const group = MONEY_DATA.getAffiliateGroup(typeId);
    if (!group) { container.style.display = 'none'; return; }

    container.innerHTML = `
      <div class="affiliate-wrap"
           data-ad-group="${group.id}"
           data-ad-name="${group.trackingName}">
        <div class="affiliate-label">✨ あなたにおすすめ</div>
        <div class="affiliate-banner">
          ${group.html}
        </div>
      </div>
    `;

    // ④ クリック計測（将来のCTR分析用・現段階はconsole.logのみ）
    container.querySelector('.affiliate-wrap')?.addEventListener('click', e => {
      const el = e.currentTarget;
      console.log('[AD_CLICK]', {
        group: el.dataset.adGroup,
        name:  el.dataset.adName,
        time:  new Date().toISOString(),
      });
      // 将来: saveAdClick(el.dataset.adGroup, el.dataset.adName) を呼ぶ
    });
  },

  // ============================================================
  // Xシェア
  // ============================================================
  shareToX(t) {
    this.state.xShared = true;
    const url  = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(
      `${t.snsText}\n「${t.catchcopy}」\n\n${t.message}\n\n#マネーアニマル診断 #マネータイプ診断 #${t.name}`
    );
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  },

  // ============================================================
  // ② Google Sheets保存（プロフィール3列追加）
  // ============================================================
  async saveToSheets(result, email) {
    const { type, axisScores } = result;
    const { nickname, age, gender } = this.state.profile;
    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    const payload = {
      action: 'saveDiagnosis',
      datetime: now,
      resultType: type.name,
      animal: type.emoji,
      mamoru: axisScores.mamoru,
      fuyasu: axisScores.fuyasu,
      ronri: axisScores.ronri,
      chokkan: axisScores.chokkan,
      keikaku: axisScores.keikaku,
      chosen: axisScores.chosen,
      anshin: axisScores.anshin,
      jiyuu: axisScores.jiyuu,
      shunyuKaizen: axisScores.shunyuKaizen,
      shisanKeisei: axisScores.shisanKeisei,
      email: email || '',
      xShare: this.state.xShared ? '済' : '未',
      memo: '',
      // ② 追加3列
      nickname: nickname || '',
      age: age || '',
      gender: gender || '',
    };

    if (this.GAS_URL.includes('YOUR_DEPLOYMENT_ID')) {
      console.log('[DEBUG] GAS保存スキップ:', payload);
      return;
    }

    try {
      await fetch(this.GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('GAS保存エラー:', err);
    }
  },

  // ============================================================
  // Toast
  // ============================================================
  showToast(msg, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.bindEmailEvents();
});
