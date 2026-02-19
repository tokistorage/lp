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
    { id: 'backcasting', ja: '逆算思考と自己変容', en: 'Backcasting & Self-Transformation' },
    { id: 'boundary', ja: 'システム境界', en: 'System Boundaries' },
    { id: 'peace', ja: '万人の平和感', en: 'Peace for All' },
    { id: 'meiwaku', ja: '迷惑の構造', en: 'The Structure of Meiwaku' },
    { id: 'satiation', ja: '飽きと変容', en: 'Satiation & Transformation' },
    { id: 'transformation-journey', ja: '変容の旅路', en: 'Transformation Journey' },

    // ── 人生の節目 ──
    { id: 'lifecycle', ja: '生老病死', en: 'Life Cycle' },
    { id: 'adversity', ja: '逆境', en: 'Adversity' },
    { id: 'ceremony', ja: '冠婚葬祭', en: 'Rites of Passage' },
    { id: 'recital-record', ja: '発表会と親心', en: 'Recitals & Parenting' },
    { id: 'lifestyle', ja: '生き方', en: 'Lifestyle' },
    { id: 'independence', ja: 'オフグリッド', en: 'Off-Grid' },
    { id: 'what-to-leave', ja: '人が残したいもの', en: 'What to Leave Behind' },

    // ── 信仰・思想 ──
    { id: 'religion', ja: '宗教・神話', en: 'Religion' },
    { id: 'existentialism', ja: '存在主義経済', en: 'Existentialism' },
    { id: 'dimension', ja: '5次元という視点', en: 'The Fifth Dimension' },
    { id: 'shiseikan', ja: '死生観の醸成', en: 'Cultivating a View of Life & Death' },

    // ── 社会制度（小→大）──
    { id: 'organization', ja: '組織', en: 'Organizations' },
    { id: 'government', ja: '行政', en: 'Government' },
    { id: 'election', ja: '選挙と存在', en: 'Elections & Existence' },
    { id: 'nation', ja: '国家', en: 'Nation' },
    { id: 'national-record', ja: '国家記録の意義', en: 'National Records' },
    { id: 'global', ja: '国際社会', en: 'Global Society' },
    { id: 'strategy', ja: '国家戦略', en: 'National Strategy' },

    // ── 経済・財産 ──
    { id: 'industry', ja: '産業', en: 'Industry' },
    { id: 'consumption', ja: '消費', en: 'Consumption' },
    { id: 'gift-economy', ja: '贈与経済', en: 'Gift Economy' },
    { id: 'novelty-soap', ja: 'ノベルティ石鹸', en: 'Novelty Soap' },
    { id: 'fragrance', ja: '香りの科学', en: 'Science of Scent' },
    { id: 'advertising', ja: '広告とROI', en: 'Advertising & ROI' },
    { id: 'price-acceptance', ja: '高額商材の受容', en: 'Price Acceptance' },
    { id: 'finance', ja: '金融', en: 'Finance' },
    { id: 'ownership', ja: '所有権', en: 'Ownership' },
    { id: 'realestate', ja: '不動産', en: 'Real Estate' },
    { id: 'esg', ja: 'ESG/GX', en: 'ESG/GX' },
    { id: 'sdgs', ja: 'SDGs', en: 'SDGs' },
    { id: 'no-competition', ja: '競合不在の作り方', en: 'No Competition' },
    { id: 'platform', ja: 'プラットフォームの視界', en: 'Platform View' },
    { id: 'global-niche', ja: 'グローバルニッチ', en: 'Global Niche' },
    { id: 'global-honbinos', ja: 'グローバルホンビノス', en: 'Global Honbinos' },
    { id: 'ecosystem', ja: 'エコシステムの再定義', en: 'Redefining the Ecosystem' },
    { id: 'free-strategy', ja: 'フリー戦略の逆説', en: 'The Paradox of Free' },
    { id: 'brochure-essay', ja: 'ブローシャの限界と超越', en: 'The Limits of the Brochure' },
    { id: 'payment', ja: '決済手段', en: 'Payment Methods' },
    { id: 'partner-boundary', ja: 'パートナーの境界線', en: 'The Partner Boundary' },
    { id: 'made-to-order', ja: '受注生産の境界', en: 'The Boundary of Made-to-Order' },
    { id: 'post-nomad', ja: 'ポストノマド', en: 'Post-Nomad' },
    { id: 'disintermediation', ja: '流通構造の変容', en: 'Disintermediation' },
    { id: 'walking-partner', ja: '歩くパートナー', en: 'Walking Partner' },
    { id: 'sanpoyoshi', ja: '三方よしの溶解点', en: 'Sanpo-yoshi' },
    { id: 'burn-rate-zero', ja: 'バーンレートゼロ', en: 'Burn Rate Zero' },

    // ── 文化・社会活動 ──
    { id: 'education', ja: '教育', en: 'Education' },
    { id: 'early-education', ja: '幼児教育・知育', en: 'Early Childhood' },
    { id: 'media', ja: 'メディア', en: 'Media' },
    { id: 'entertainment', ja: 'エンタメ', en: 'Entertainment' },
    { id: 'art', ja: '芸術', en: 'Art' },
    { id: 'music', ja: '音楽', en: 'Music' },
    { id: 'tourism', ja: '観光', en: 'Tourism' },
    { id: 'commemorative-photo', ja: '記念写真の変容', en: 'Souvenir Photo' },
    { id: 'sports', ja: 'スポーツ', en: 'Sports' },
    { id: 'history', ja: '歴史学', en: 'History' },

    // ── 自然・宇宙 ──
    { id: 'animal-welfare', ja: '動物愛護', en: 'Animal Welfare' },
    { id: 'ecology', ja: '生態系', en: 'Ecology' },
    { id: 'geology', ja: '地質学', en: 'Geology' },
    { id: 'turtle', ja: '亀が導く永続性', en: 'Turtle & Permanence' },
    { id: 'urayasu', ja: '浦安という地の利', en: 'Urayasu' },
    { id: 'hyoutanjima', ja: 'ひょうたん島の蓋然性', en: 'The Probability of Gourd Island' },
    { id: 'space', ja: '宇宙', en: 'Space' },

    // ── 技術・設計 ──
    { id: 'coach', ja: 'タイムレスコーチ', en: 'Timeless Coach' },
    { id: 'future', ja: 'AI時代', en: 'AI Era' },
    { id: 'perspective', ja: '視座の本質', en: 'The Essence of Perspective' },
    { id: 'chief-timeless', ja: 'Chief Timeless Officer', en: 'Chief Timeless Officer' },
    { id: 'hands', ja: '手で刻む', en: 'Inscribed by Hand' },
    { id: 'departure', ja: 'トレンドからの離脱', en: 'Departure from Trends' },
    { id: 'openness', ja: '公開主義', en: 'Openism' },
    { id: 'akashic-record', ja: 'アカシックレコード', en: 'Akashic Record' },
    { id: 'legacy', ja: '技術設計', en: 'Technical Design' },
    { id: 'deposition', ja: '金属蒸着', en: 'Deposition' },
    { id: '30seconds', ja: '30秒音声の世界', en: '30 Seconds of Voice' },
    { id: 'voice-future', ja: '音声復元', en: 'Voice Restoration' },
    { id: 'image-clarity', ja: '画像の鮮明さ', en: 'Image Clarity' },
    { id: 'what-is-github', ja: 'GitHubとは何か', en: 'What Is GitHub' },
    { id: 'api-transformation', ja: 'APIの変容', en: 'API Transformation' },
    { id: 'ssdlc', ja: 'SSDLC', en: 'SSDLC' },
    { id: 'enterprise-architecture', ja: 'エンタープライズアーキテクチャ', en: 'Enterprise Architecture' },
    { id: 'poc', ja: 'PoCの目線', en: 'The PoC Perspective' },
    { id: 'why-not-consulting', ja: '導入プロジェクト不在の設計', en: 'Why No Implementation Project' },
    { id: 'decision-maker', ja: '責任者の決断', en: "The Decision-Maker's Resolution" },
    { id: 'backup-rule', ja: '3-2-1ルール', en: '3-2-1 Backup Rule' },
    { id: 'uv-laminate', ja: 'UVラミネート', en: 'UV Laminate' },
    { id: 'uptime', ja: '稼働率と外部依存', en: 'Uptime & Dependencies' },
    { id: 'cloudflare-gas', ja: 'CloudflareとGAS', en: 'Cloudflare & GAS' },
    { id: 'migration', ja: 'マイグレーションの設計', en: 'Designing Migration' },
    { id: 'vibe-coding', ja: 'バイブコーディング', en: 'Vibe Coding' },
    { id: 'rapid-prototyping', ja: 'ラピッドプロトタイピング', en: 'Rapid Prototyping' },

    // ── メタ視点 ──
    { id: 'preserving-words', ja: 'ことばを残す', en: 'Preserving Words' },
    { id: 'why-essays', ja: 'エッセイを刻む意義', en: 'The Significance of Inscribing Essays' },
    { id: 'erasure', ja: '残さない選択', en: 'Choosing Not to Leave Behind' },
    { id: 'narrative-trust', ja: '物語が語る信頼', en: 'The Trust That Stories Tell' }
  ];

  // ── Related Essays Map ──
  // 各エッセイに3〜5本の関連エッセイを定義
  const relatedMap = {
    // ── 基礎理論（個人の内面）──
    'psychology':             ['philosophy', 'integrity', 'emotion', 'backcasting', 'solitude'],
    'philosophy':             ['psychology', 'integrity', 'existentialism', 'boundary', 'peace'],
    'integrity':              ['philosophy', 'psychology', 'openness', 'sanpoyoshi', 'narrative-trust'],
    'solitude':               ['psychology', 'emotion', 'lifestyle', 'transformation-journey', 'satiation'],
    'pathology':              ['psychology', 'lifecycle', 'adversity', 'ceremony', 'organization'],
    'emotion':                ['psychology', 'solitude', 'satiation', 'transformation-journey', 'backcasting'],
    'backcasting':            ['transformation-journey', 'psychology', 'perspective', 'future', 'lifestyle'],
    'boundary':               ['philosophy', 'organization', 'partner-boundary', 'meiwaku', 'peace'],
    'peace':                  ['philosophy', 'meiwaku', 'religion', 'global', 'boundary'],
    'meiwaku':                ['peace', 'philosophy', 'organization', 'boundary', 'psychology'],
    'satiation':              ['emotion', 'solitude', 'transformation-journey', 'consumption', 'lifestyle'],
    'transformation-journey': ['backcasting', 'emotion', 'satiation', 'solitude', 'lifecycle'],
    // ── 人生の節目 ──
    'lifecycle':              ['shiseikan', 'ceremony', 'what-to-leave', 'pathology', 'transformation-journey'],
    'adversity':              ['lifecycle', 'backcasting', 'integrity', 'pathology', 'transformation-journey'],
    'ceremony':               ['lifecycle', 'what-to-leave', 'recital-record', 'shiseikan', 'religion'],
    'recital-record':         ['ceremony', 'early-education', 'commemorative-photo', 'music', 'what-to-leave'],
    'lifestyle':              ['independence', 'solitude', 'burn-rate-zero', 'post-nomad', 'backcasting'],
    'independence':           ['lifestyle', 'burn-rate-zero', 'post-nomad', 'ecology', 'platform'],
    'what-to-leave':          ['lifecycle', 'preserving-words', 'ceremony', 'shiseikan', 'legacy'],
    // ── 信仰・思想 ──
    'religion':               ['shiseikan', 'philosophy', 'ceremony', 'existentialism', 'peace'],
    'existentialism':         ['philosophy', 'religion', 'dimension', 'shiseikan', 'burn-rate-zero'],
    'dimension':              ['existentialism', 'akashic-record', 'space', 'religion', 'hyoutanjima'],
    'shiseikan':              ['lifecycle', 'religion', 'what-to-leave', 'existentialism', 'dimension'],
    // ── 社会制度 ──
    'organization':           ['government', 'boundary', 'enterprise-architecture', 'meiwaku', 'industry'],
    'government':             ['organization', 'nation', 'election', 'strategy', 'national-record'],
    'election':               ['government', 'nation', 'organization', 'strategy', 'philosophy'],
    'nation':                 ['government', 'global', 'strategy', 'national-record', 'election'],
    'national-record':        ['nation', 'akashic-record', 'preserving-words', 'legacy', 'history'],
    'global':                 ['nation', 'strategy', 'global-niche', 'global-honbinos', 'sdgs'],
    'strategy':               ['nation', 'global', 'no-competition', 'global-niche', 'platform'],
    // ── 経済・財産 ──
    'industry':               ['consumption', 'organization', 'platform', 'ecosystem', 'disintermediation'],
    'consumption':            ['industry', 'satiation', 'gift-economy', 'novelty-soap', 'fragrance'],
    'gift-economy':           ['consumption', 'sanpoyoshi', 'free-strategy', 'walking-partner', 'ceremony'],
    'novelty-soap':           ['fragrance', 'gift-economy', 'advertising', 'brochure-essay', 'consumption'],
    'fragrance':              ['novelty-soap', 'consumption', 'advertising', 'ecology', 'gift-economy'],
    'advertising':            ['brochure-essay', 'free-strategy', 'media', 'novelty-soap', 'price-acceptance'],
    'price-acceptance':       ['advertising', 'no-competition', 'brochure-essay', 'narrative-trust', 'payment'],
    'finance':                ['ownership', 'realestate', 'payment', 'burn-rate-zero', 'industry'],
    'ownership':              ['finance', 'realestate', 'what-to-leave', 'legacy', 'existentialism'],
    'realestate':             ['ownership', 'finance', 'urayasu', 'independence', 'industry'],
    'esg':                    ['sdgs', 'ecology', 'global', 'animal-welfare', 'industry'],
    'sdgs':                   ['esg', 'ecology', 'global', 'education', 'gift-economy'],
    'no-competition':         ['platform', 'global-niche', 'free-strategy', 'ecosystem', 'departure'],
    'platform':               ['no-competition', 'ecosystem', 'disintermediation', 'api-transformation', 'global-niche'],
    'global-niche':           ['no-competition', 'platform', 'global', 'global-honbinos', '30seconds'],
    'global-honbinos':        ['global-niche', 'global', 'sanpoyoshi', 'ecology', 'turtle'],
    'ecosystem':              ['platform', 'sanpoyoshi', 'no-competition', 'disintermediation', 'industry'],
    'free-strategy':          ['burn-rate-zero', 'sanpoyoshi', 'no-competition', 'gift-economy', 'advertising'],
    'brochure-essay':         ['advertising', 'free-strategy', 'novelty-soap', 'why-essays', 'narrative-trust'],
    'payment':                ['finance', 'burn-rate-zero', 'cloudflare-gas', 'partner-boundary', 'made-to-order'],
    'partner-boundary':       ['sanpoyoshi', 'walking-partner', 'made-to-order', 'boundary', 'integrity'],
    'made-to-order':          ['partner-boundary', 'industry', 'disintermediation', 'payment', 'migration'],
    'post-nomad':             ['lifestyle', 'independence', 'burn-rate-zero', 'global', 'future'],
    'disintermediation':      ['platform', 'ecosystem', 'industry', 'api-transformation', 'walking-partner'],
    'walking-partner':        ['sanpoyoshi', 'partner-boundary', 'global-honbinos', 'gift-economy', 'disintermediation'],
    'sanpoyoshi':             ['walking-partner', 'partner-boundary', 'ecosystem', 'free-strategy', 'gift-economy'],
    'burn-rate-zero':         ['vibe-coding', 'rapid-prototyping', 'migration', 'free-strategy', 'independence'],
    // ── 文化・社会活動 ──
    'education':              ['early-education', 'history', 'media', 'psychology', 'lifestyle'],
    'early-education':        ['education', 'recital-record', 'music', 'psychology', 'entertainment'],
    'media':                  ['entertainment', 'advertising', 'platform', 'history', 'openness'],
    'entertainment':          ['media', 'music', 'art', 'sports', 'tourism'],
    'art':                    ['music', 'hands', 'entertainment', 'preserving-words', 'history'],
    'music':                  ['art', 'entertainment', '30seconds', 'recital-record', 'voice-future'],
    'tourism':                ['commemorative-photo', 'urayasu', 'hyoutanjima', 'sports', 'entertainment'],
    'commemorative-photo':    ['recital-record', 'tourism', 'image-clarity', 'what-to-leave', 'hands'],
    'sports':                 ['entertainment', 'tourism', 'education', 'adversity', 'lifestyle'],
    'history':                ['national-record', 'preserving-words', 'geology', 'education', 'akashic-record'],
    // ── 自然・宇宙 ──
    'animal-welfare':         ['ecology', 'esg', 'turtle', 'peace', 'sdgs'],
    'ecology':                ['animal-welfare', 'sdgs', 'esg', 'geology', 'turtle'],
    'geology':                ['ecology', 'turtle', 'urayasu', 'history', 'space'],
    'turtle':                 ['geology', 'ecology', 'legacy', 'what-to-leave', 'history'],
    'urayasu':                ['hyoutanjima', 'realestate', 'geology', 'tourism', 'ecology'],
    'hyoutanjima':            ['urayasu', 'dimension', 'geology', 'space', 'ecology'],
    'space':                  ['dimension', 'geology', 'hyoutanjima', 'akashic-record', 'future'],
    // ── 技術・設計 ──
    'coach':                  ['chief-timeless', 'perspective', 'future', 'backcasting', 'departure'],
    'future':                 ['vibe-coding', 'coach', 'api-transformation', 'perspective', 'chief-timeless'],
    'perspective':            ['coach', 'chief-timeless', 'backcasting', 'philosophy', 'decision-maker'],
    'chief-timeless':         ['coach', 'perspective', 'future', 'decision-maker', 'departure'],
    'hands':                  ['departure', 'legacy', 'deposition', 'art', 'preserving-words'],
    'departure':              ['legacy', 'openness', 'hands', 'no-competition', 'burn-rate-zero'],
    'openness':               ['akashic-record', 'legacy', 'departure', 'ssdlc', 'what-is-github'],
    'akashic-record':         ['openness', 'legacy', 'national-record', 'dimension', 'preserving-words'],
    'legacy':                 ['openness', 'akashic-record', 'deposition', 'hands', 'backup-rule'],
    'deposition':             ['legacy', 'uv-laminate', 'hands', 'image-clarity', '30seconds'],
    '30seconds':              ['voice-future', 'image-clarity', 'global-niche', 'music', 'legacy'],
    'voice-future':           ['30seconds', 'image-clarity', 'legacy', 'akashic-record', 'future'],
    'image-clarity':          ['voice-future', '30seconds', 'deposition', 'commemorative-photo', 'uv-laminate'],
    'what-is-github':         ['openness', 'vibe-coding', 'cloudflare-gas', 'ssdlc', 'api-transformation'],
    'api-transformation':     ['platform', 'cloudflare-gas', 'what-is-github', 'future', 'disintermediation'],
    'ssdlc':                  ['legacy', 'openness', 'cloudflare-gas', 'uptime', 'backup-rule'],
    'enterprise-architecture':['organization', 'ssdlc', 'poc', 'decision-maker', 'migration'],
    'poc':                    ['rapid-prototyping', 'enterprise-architecture', 'decision-maker', 'why-not-consulting', 'vibe-coding'],
    'why-not-consulting':     ['poc', 'decision-maker', 'brochure-essay', 'burn-rate-zero', 'partner-boundary'],
    'decision-maker':         ['chief-timeless', 'perspective', 'poc', 'why-not-consulting', 'enterprise-architecture'],
    'backup-rule':            ['ssdlc', 'uptime', 'legacy', 'cloudflare-gas', 'uv-laminate'],
    'uv-laminate':            ['deposition', 'legacy', 'image-clarity', 'backup-rule', 'hands'],
    'uptime':                 ['cloudflare-gas', 'backup-rule', 'ssdlc', 'migration', 'api-transformation'],
    'cloudflare-gas':         ['uptime', 'backup-rule', 'api-transformation', 'what-is-github', 'burn-rate-zero'],
    'migration':              ['rapid-prototyping', 'cloudflare-gas', 'uptime', 'burn-rate-zero', 'ssdlc'],
    'vibe-coding':            ['burn-rate-zero', 'rapid-prototyping', 'migration', 'future', 'what-is-github'],
    'rapid-prototyping':      ['vibe-coding', 'burn-rate-zero', 'poc', 'migration', 'departure'],
    // ── メタ視点 ──
    'preserving-words':       ['why-essays', 'akashic-record', 'what-to-leave', 'narrative-trust', 'openness'],
    'why-essays':             ['preserving-words', 'brochure-essay', 'narrative-trust', 'openness', 'erasure'],
    'erasure':                ['preserving-words', 'why-essays', 'shiseikan', 'what-to-leave', 'openness'],
    'narrative-trust':        ['brochure-essay', 'preserving-words', 'integrity', 'why-essays', 'price-acceptance']
  };

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
    ? `<br><br><a href="manifesto-en.html" style="color: var(--toki-blue, #2563EB); font-weight: 500;">Manifesto</a> · <a href="transparency-en.html" style="color: var(--amber, #D97706);">Before You Decide</a> · <a href="not-for-you-en.html" style="color: var(--amber, #D97706);">Not For Everyone</a> · <a href="trust-design-en.html" style="color: var(--amber, #D97706);">Trust Design</a> · <a href="pearl-soap.html" style="color: var(--toki-gold);">Pearl Soap</a> · <a href="100-scenes.html" style="color: var(--toki-gold);">100 Scenes</a> · <a href="usecases-en.html">Use Cases</a> · <a href="client-proposal-en.html">Timeless Consulting</a> · <a href="timeless-coach.html">Timeless Coach</a> · <a href="partnership-en.html">Partnership</a> · <a href="government-proposal-en.html">Government Proposal</a> · <a href="patronage-en.html">Patronage</a> · <a href="index-en.html">Toki Storage</a>`
    : `<br><br><a href="manifesto.html" style="color: var(--toki-blue, #2563EB); font-weight: 500;">マニフェスト</a> · <a href="transparency.html" style="color: var(--amber, #D97706);">疑ってください</a> · <a href="not-for-you.html" style="color: var(--amber, #D97706);">向いていない方へ</a> · <a href="trust-design.html" style="color: var(--amber, #D97706);">信頼設計37項目</a> · <a href="pearl-soap.html" style="color: var(--toki-gold);">Pearl Soap</a> · <a href="100-scenes.html" style="color: var(--toki-gold);">100のシーン</a> · <a href="usecases.html">ユースケース</a> · <a href="client-proposal.html">タイムレスコンサルティング</a> · <a href="timeless-coach.html">タイムレスコーチ認定</a> · <a href="partnership.html">パートナーシップ</a> · <a href="government-proposal.html">行政提案</a> · <a href="patronage.html">パトロネージ</a> · <a href="index.html">トキストレージ</a>`;

  // ── Related Essays Section ──
  function buildRelatedSection(currentId) {
    var related = relatedMap[currentId];
    if (!related || related.length === 0) return '';
    var header = isEnglish ? 'Related Essays' : '関連エッセイ';
    var relatedLinks = related.map(function(id) {
      var essay = essays.find(function(e) { return e.id === id; });
      if (!essay) return '';
      var href = isEnglish ? essay.id + '-en.html' : essay.id + '.html';
      var label = isEnglish ? essay.en : essay.ja;
      return '<a href="' + href + '" style="font-weight: 500;">' + label + '</a>';
    }).filter(Boolean).join(' \u00b7 ');
    return '<span style="display:block;margin-bottom:1.5rem;padding-bottom:1rem;border-bottom:1px solid var(--border,#E2E8F0);">'
      + '<span style="display:block;font-size:0.65rem;letter-spacing:0.12em;color:var(--toki-blue,#2563EB);margin-bottom:0.5rem;font-weight:600;">'
      + header + '</span>' + relatedLinks + '</span>';
  }

  // ── Share Buttons ──
  var xIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  var linkedInIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';
  var lineIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.63.63 0 01-.63-.629V8.108c0-.345.281-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.63.63 0 01-.63.629.626.626 0 01-.51-.262l-2.455-3.339v2.972a.63.63 0 01-1.26 0V8.108a.63.63 0 01.63-.63c.2 0 .385.096.51.262l2.455 3.339V8.108a.63.63 0 011.26 0v4.771zm-5.741 0a.63.63 0 01-1.26 0V8.108a.63.63 0 011.26 0v4.771zm-2.527.629H4.856a.63.63 0 01-.63-.629V8.108c0-.345.282-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>';
  var hatenaIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20.47 0C22.42 0 24 1.58 24 3.53v16.94c0 1.95-1.58 3.53-3.53 3.53H3.53C1.58 24 0 22.42 0 20.47V3.53C0 1.58 1.58 0 3.53 0h16.94zm-3.705 14.47c-.78 0-1.41.63-1.41 1.41s.63 1.414 1.41 1.414 1.41-.634 1.41-1.414-.63-1.41-1.41-1.41zm.255-9.887h-2.34v8.142h2.34V4.583zm-6.36 5.747c1.156-.423 1.86-1.332 1.86-2.61C12.22 5.756 10.856 4.6 8.55 4.6H4.8v12.86h3.855c2.505 0 3.96-1.245 3.96-3.345 0-1.53-.9-2.55-2.055-2.865v-.06l.105.04zm-2.88-3.15h1.29c.855 0 1.38.405 1.38 1.14s-.48 1.17-1.38 1.17H7.78V7.18zm1.515 8.28H7.78v-2.58h1.515c1.005 0 1.53.465 1.53 1.29s-.525 1.29-1.53 1.29z"/></svg>';
  var fbIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>';
  var copyIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';

  function shareUrl(platform, text, url) {
    var e = encodeURIComponent;
    switch (platform) {
      case 'x':
        var maxText = 280 - 24;
        if (text.length > maxText) text = text.substring(0, maxText - 1) + '\u2026';
        return 'https://twitter.com/intent/tweet?text=' + e(text) + '&url=' + e(url);
      case 'linkedin':
        return 'https://www.linkedin.com/sharing/share-offsite/?url=' + e(url);
      case 'line':
        return 'https://social-plugins.line.me/lineit/share?url=' + e(url) + '&text=' + e(text);
      case 'hatena':
        return 'https://b.hatena.ne.jp/entry/s/' + url.replace(/^https?:\/\//, '');
      case 'facebook':
        return 'https://www.facebook.com/sharer/sharer.php?u=' + e(url) + '&quote=' + e(text);
    }
  }

  function getPageTitle() {
    var h1 = document.querySelector('.article-header h1');
    if (!h1) return document.title;
    return h1.childNodes[0].textContent.trim();
  }

  function getCleanText(el) {
    return el.textContent.replace(/\s+/g, ' ').trim();
  }

  function injectShareStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.share-bar{display:flex;align-items:center;gap:0.5rem;margin:2.5rem 0 0;padding:1rem 0;border-top:1px solid var(--border,#E2E8F0);}',
      '.share-bar-label{font-size:0.7rem;color:var(--text-muted,#94A3B8);letter-spacing:0.1em;font-weight:600;}',
      '.share-bar{flex-wrap:wrap;}',
      '.share-btn{display:inline-flex;align-items:center;gap:0.35rem;padding:0.4rem 0.7rem;border:1px solid var(--border,#E2E8F0);border-radius:6px;background:var(--bg-white,#fff);color:var(--text-secondary,#475569);font-size:0.75rem;font-family:var(--font-body);cursor:pointer;text-decoration:none;transition:all 0.15s;}',
      '.share-btn:hover{border-color:var(--toki-blue,#2563EB);color:var(--toki-blue,#2563EB);background:var(--toki-blue-pale,#EFF6FF);}',
      '.share-btn-copied{border-color:#16a34a!important;color:#16a34a!important;background:#f0fdf4!important;}',
      '.quotable{position:relative;}',
      '.quote-share{position:absolute;top:0.5rem;right:0.5rem;display:flex;align-items:center;gap:0.25rem;padding:0.3rem 0.5rem;border:1px solid var(--border,#E2E8F0);border-radius:5px;background:rgba(255,255,255,0.95);color:var(--text-muted,#94A3B8);font-size:0.65rem;cursor:pointer;text-decoration:none;opacity:0;transition:opacity 0.2s;font-family:var(--font-body);}',
      '.quotable:hover .quote-share{opacity:1;}',
      '.quote-share:hover{color:var(--toki-blue,#2563EB);border-color:var(--toki-blue,#2563EB);background:var(--toki-blue-pale,#EFF6FF);}',
      '@media print{.share-bar,.quote-share{display:none!important;}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function buildShareBar() {
    var articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    var pageUrl = window.location.href;
    var title = getPageTitle();
    var shareLabel = isEnglish ? 'SHARE' : 'SHARE';
    var copyLabel = isEnglish ? 'Copy link' : 'リンクをコピー';
    var copiedLabel = isEnglish ? 'Copied!' : 'コピーしました';

    var bar = document.createElement('div');
    bar.className = 'share-bar';
    bar.innerHTML = '<span class="share-bar-label">' + shareLabel + '</span>'
      + '<a class="share-btn" href="' + shareUrl('x', title, pageUrl) + '" target="_blank" rel="noopener">' + xIcon + ' Post</a>'
      + '<a class="share-btn" href="' + shareUrl('linkedin', title, pageUrl) + '" target="_blank" rel="noopener">' + linkedInIcon + ' LinkedIn</a>'
      + '<a class="share-btn" href="' + shareUrl('line', title, pageUrl) + '" target="_blank" rel="noopener">' + lineIcon + ' LINE</a>'
      + '<a class="share-btn" href="' + shareUrl('hatena', title, pageUrl) + '" target="_blank" rel="noopener">' + hatenaIcon + ' Hatena</a>'
      + '<a class="share-btn" href="' + shareUrl('facebook', title, pageUrl) + '" target="_blank" rel="noopener">' + fbIcon + ' Facebook</a>'
      + '<button class="share-btn" id="copy-url-btn">' + copyIcon + ' ' + copyLabel + '</button>';
    articleContent.appendChild(bar);

    document.getElementById('copy-url-btn').addEventListener('click', function() {
      var btn = this;
      navigator.clipboard.writeText(pageUrl).then(function() {
        btn.innerHTML = copyIcon + ' ' + copiedLabel;
        btn.classList.add('share-btn-copied');
        setTimeout(function() {
          btn.innerHTML = copyIcon + ' ' + copyLabel;
          btn.classList.remove('share-btn-copied');
        }, 2000);
      });
    });
  }

  function addQuoteSharing() {
    var pageUrl = window.location.href;
    var targets = document.querySelectorAll('.article-content blockquote, .article-content .key-point');
    var postLabel = 'Post';

    targets.forEach(function(el) {
      el.classList.add('quotable');
      var link = document.createElement('a');
      link.className = 'quote-share';
      link.target = '_blank';
      link.rel = 'noopener';
      link.innerHTML = xIcon + ' ' + postLabel;
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var text = getCleanText(el);
        window.open(shareUrl('x', text, pageUrl), '_blank', 'width=550,height=420');
      });
      el.appendChild(link);
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('essay-nav-links');
    if (container) {
      container.innerHTML = buildRelatedSection(currentFile) + links + specialLinks;
    }

    // Share buttons (only on essay pages with .article-content)
    if (document.querySelector('.article-content')) {
      injectShareStyles();
      buildShareBar();
      addQuoteSharing();
    }
  });
})();
