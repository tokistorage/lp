/**
 * Essay Navigation - Dynamic Cross-Links
 * エッセイ間のクロスリンクを動的に生成
 *
 * 構成: 個人 → 人生 → 信仰 → 社会 → 経済 → 文化 → 自然 → 技術 → メタ
 */
(function() {
  const essays = [
    // ── 基礎理論（個人の内面）──
    { id: 'psychology', ja: '心理学', en: 'Psychology' },
    { id: 'philosophy', ja: '社会哲学', en: 'Philosophy' },
    { id: 'integrity', ja: '誠実さ', en: 'Integrity' },
    { id: 'solitude', ja: '孤独の変容', en: 'Solitude' },
    { id: 'pathology', ja: '継承の病理', en: 'Pathology' },
    { id: 'emotion', ja: '感情の変容', en: 'Emotions as Transformation' },

    // ── 人生の節目 ──
    { id: 'lifecycle', ja: '生老病死', en: 'Life Cycle' },
    { id: 'adversity', ja: '逆境', en: 'Adversity' },
    { id: 'ceremony', ja: '冠婚葬祭', en: 'Rites of Passage' },
    { id: 'recital-record', ja: '発表会と親心', en: 'Recitals & Parenting' },
    { id: 'lifestyle', ja: '生き方', en: 'Lifestyle' },
    { id: 'independence', ja: 'オフグリッド', en: 'Off-Grid' },

    // ── 信仰・思想 ──
    { id: 'religion', ja: '宗教・神話', en: 'Religion' },
    { id: 'existentialism', ja: '存在主義経済', en: 'Existentialism' },
    { id: 'dimension', ja: '5次元という視点', en: 'The Fifth Dimension' },

    // ── 社会制度（小→大）──
    { id: 'organization', ja: '組織', en: 'Organizations' },
    { id: 'government', ja: '行政', en: 'Government' },
    { id: 'election', ja: '選挙と存在', en: 'Elections & Existence' },
    { id: 'nation', ja: '国家', en: 'Nation' },
    { id: 'global', ja: '国際社会', en: 'Global Society' },
    { id: 'strategy', ja: '国家戦略', en: 'National Strategy' },

    // ── 経済・財産 ──
    { id: 'industry', ja: '産業', en: 'Industry' },
    { id: 'consumption', ja: '消費', en: 'Consumption' },
    { id: 'gift-economy', ja: '贈与経済', en: 'Gift Economy' },
    { id: 'novelty-soap', ja: 'ノベルティ石鹸', en: 'Novelty Soap' },
    { id: 'fragrance', ja: '香りの科学', en: 'Science of Scent' },
    { id: 'advertising', ja: '広告とROI', en: 'Advertising & ROI' },
    { id: 'finance', ja: '金融', en: 'Finance' },
    { id: 'ownership', ja: '所有権', en: 'Ownership' },
    { id: 'realestate', ja: '不動産', en: 'Real Estate' },
    { id: 'esg', ja: 'ESG/GX', en: 'ESG/GX' },
    { id: 'sdgs', ja: 'SDGs', en: 'SDGs' },

    // ── 文化・社会活動 ──
    { id: 'education', ja: '教育', en: 'Education' },
    { id: 'early-education', ja: '幼児教育・知育', en: 'Early Childhood' },
    { id: 'media', ja: 'メディア', en: 'Media' },
    { id: 'entertainment', ja: 'エンタメ', en: 'Entertainment' },
    { id: 'art', ja: '芸術', en: 'Art' },
    { id: 'music', ja: '音楽', en: 'Music' },
    { id: 'tourism', ja: '観光', en: 'Tourism' },
    { id: 'sports', ja: 'スポーツ', en: 'Sports' },
    { id: 'history', ja: '歴史学', en: 'History' },

    // ── 自然・宇宙 ──
    { id: 'animal-welfare', ja: '動物愛護', en: 'Animal Welfare' },
    { id: 'ecology', ja: '生態系', en: 'Ecology' },
    { id: 'geology', ja: '地質学', en: 'Geology' },
    { id: 'hyoutanjima', ja: 'ひょうたん島の蓋然性', en: 'The Probability of Gourd Island' },
    { id: 'space', ja: '宇宙', en: 'Space' },

    // ── 技術・設計 ──
    { id: 'future', ja: 'AI時代', en: 'AI Era' },
    { id: 'perspective', ja: '視座の本質', en: 'The Essence of Perspective' },
    { id: 'chief-timeless', ja: 'Chief Timeless Officer', en: 'Chief Timeless Officer' },
    { id: 'hands', ja: '手で刻む', en: 'Inscribed by Hand' },
    { id: 'departure', ja: 'トレンドからの離脱', en: 'Departure from Trends' },
    { id: 'openness', ja: '公開主義', en: 'Openism' },
    { id: 'akashic-record', ja: 'アカシックレコード', en: 'Akashic Record' },
    { id: 'legacy', ja: '技術設計', en: 'Technical Design' },
    { id: 'deposition', ja: '金属蒸着', en: 'Deposition' },
    { id: 'voice-future', ja: '音声復元', en: 'Voice Restoration' },

    // ── メタ視点 ──
    { id: 'erasure', ja: '残さない選択', en: 'Choosing Not to Leave Behind' }
  ];

  const isEnglish = document.documentElement.lang === 'en';
  const currentPath = window.location.pathname;
  const currentFile = currentPath.split('/').pop().replace('.html', '').replace('-en', '');

  const links = essays.map(essay => {
    const href = isEnglish ? `${essay.id}-en.html` : `${essay.id}.html`;
    const label = isEnglish ? essay.en : essay.ja;
    if (essay.id === currentFile) {
      return `<span style="color: var(--text-muted);">${label}</span>`;
    }
    return `<a href="${href}">${label}</a>`;
  }).join(' · ');

  // Pearl Soap・100 Scenes・ユースケース・トキストレージ への導線
  const specialLinks = isEnglish
    ? `<br><br><a href="transparency-en.html" style="color: var(--amber, #D97706);">Before You Decide</a> · <a href="not-for-you-en.html" style="color: var(--amber, #D97706);">Not For Everyone</a> · <a href="trust-design-en.html" style="color: var(--amber, #D97706);">Trust Design</a> · <a href="pearl-soap.html" style="color: var(--toki-gold);">Pearl Soap</a> · <a href="100-scenes.html" style="color: var(--toki-gold);">100 Scenes</a> · <a href="usecases-en.html">Use Cases</a> · <a href="government-proposal-en.html">Government Proposal</a> · <a href="index-en.html">Toki Storage</a>`
    : `<br><br><a href="transparency.html" style="color: var(--amber, #D97706);">疑ってください</a> · <a href="not-for-you.html" style="color: var(--amber, #D97706);">向いていない方へ</a> · <a href="trust-design.html" style="color: var(--amber, #D97706);">信頼設計37項目</a> · <a href="pearl-soap.html" style="color: var(--toki-gold);">Pearl Soap</a> · <a href="100-scenes.html" style="color: var(--toki-gold);">100のシーン</a> · <a href="usecases.html">ユースケース</a> · <a href="government-proposal.html">行政提案</a> · <a href="index.html">トキストレージ</a>`;

  document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('essay-nav-links');
    if (container) {
      container.innerHTML = links + specialLinks;
    }
  });
})();
