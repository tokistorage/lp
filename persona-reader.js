(function () {
    'use strict';

    var CONFIG = {
        ja: {
            label: '読み方を選ぶ',
            personas: {
                full:         { name: '全部読む',       desc: '完全版——すべてのセクションを読む' },
                entrepreneur: { name: '起業家として',   desc: 'コア欲求と事業設計の反転に焦点' },
                layoff:       { name: '備えとして',     desc: 'AGIとレイオフへの構造的な備え' },
                ceremony:     { name: '冠婚葬祭から',   desc: '体感を物証にする技術と閾の通過' }
            },
            sections: {
                entrepreneur: [
                    '1. 雇用の本質', '2. 自由度の設計', '3. 起業家の無意識',
                    'ダニエル・ピンク', 'エフェクチュエーション',
                    '4. 反転の構造', '5. 多面的な反転',
                    '顧客にとって', 'パートナーにとって', '社会にとって', '創業者自身',
                    '6. 欲求の手放し',
                    '7. ポストAGI', '従順さの消失',
                    '制約が生んだ',
                    '8. 起業家精神の再定義', 'エコシステム',
                    'Wiseを使う',
                    'これらを叶える', 'エッセンシャル',
                    '選択の先', '結び', '参考文献'
                ],
                layoff: [
                    '7. ポストAGI', '従順さの消失', '場所の溶解', '分業の崩壊',
                    'レイオフの不可逆性', '他人事から自分ごと',
                    '時を越える体験', 'いつわりの存在否定',
                    '体感としての物証',
                    'これらを叶える', 'エッセンシャル',
                    '選択の先', '結び', '参考文献'
                ],
                ceremony: [
                    '時を越える体験',
                    '8. 起業家精神の再定義', '変容の先にある冠婚葬祭',
                    'スピリチュアル界隈', '体感としての物証',
                    '唯一の民主媒体', '贈与経済',
                    '外界に寄らず',
                    'これらを叶える', '選択の先',
                    '結び', '参考文献'
                ]
            },
            count: function (s, t) { return s === t ? '' : t + 'セクション中 ' + s + 'セクションを表示'; }
        },
        en: {
            label: 'Choose how to read',
            personas: {
                full:         { name: 'Read all',          desc: 'Complete version — every section' },
                entrepreneur: { name: 'As entrepreneur',   desc: 'Core desires and the inversion of business design' },
                layoff:       { name: 'As preparation',    desc: 'Structural preparation for AGI and layoffs' },
                ceremony:     { name: 'From ceremonies',   desc: 'Turning felt experience into physical evidence' }
            },
            sections: {
                entrepreneur: [
                    '1. The Essence', '2. Designing Freedom', '3. The Entrepreneur',
                    'Daniel Pink', 'Effectuation',
                    '4. The Structure of Inversion', '5. Multifaceted',
                    'Inversion for Customers', 'Inversion for Partners', 'Inversion for Society', 'Inversion for the Founder',
                    '6. Is Releasing',
                    '7. The External', 'Disappearance of Obedience',
                    'Products Born from Constraint',
                    '8. Redefining', 'Ecosystems Are Invalidated',
                    'Using Wise',
                    'Toki Storage Is What', 'Shift to Essentials',
                    'Question Beyond', 'Conclusion', 'References'
                ],
                layoff: [
                    '7. The External', 'Disappearance of Obedience', 'Dissolution of Location', 'Collapse of Division',
                    'Irreversibility of Layoffs', 'Someone Else',
                    'Transcending Time', 'False Denial',
                    'Bodily Experience as Physical Evidence',
                    'Toki Storage Is What', 'Shift to Essentials',
                    'Question Beyond', 'Conclusion', 'References'
                ],
                ceremony: [
                    'Transcending Time',
                    '8. Redefining', 'Ceremonies of Passage',
                    'Spiritual Community', 'Bodily Experience as Physical Evidence',
                    'Quartz Glass', 'Gift Economy',
                    'Inhabit Blessing',
                    'Toki Storage Is What', 'Question Beyond',
                    'Conclusion', 'References'
                ]
            },
            count: function (s, t) { return s === t ? '' : 'Showing ' + s + ' of ' + t + ' sections'; }
        }
    };

    var lang = document.documentElement.lang === 'en' ? 'en' : 'ja';
    var config = CONFIG[lang];

    var articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    /* ── Build section groups from headings ── */
    var headings = Array.prototype.slice.call(articleContent.querySelectorAll('h2, h3'));
    var sectionGroups = [];

    headings.forEach(function (heading, i) {
        var elements = [heading];
        var sibling = heading.nextElementSibling;
        var nextHeading = headings[i + 1] || null;
        while (sibling && sibling !== nextHeading) {
            elements.push(sibling);
            sibling = sibling.nextElementSibling;
        }
        sectionGroups.push({ heading: heading, elements: elements, text: heading.textContent.trim() });
    });

    /* ── Build persona selector UI ── */
    var selector = document.createElement('div');
    selector.className = 'persona-selector';
    var html = '<p class="persona-label">' + config.label + '</p><div class="persona-buttons">';
    Object.keys(config.personas).forEach(function (key) {
        var p = config.personas[key];
        html += '<button class="persona-btn' + (key === 'full' ? ' active' : '') + '" data-persona="' + key + '" title="' + p.desc + '">' + p.name + '</button>';
    });
    html += '</div>';
    selector.innerHTML = html;

    var header = document.querySelector('.article-header');
    if (header) header.after(selector);

    var countEl = document.createElement('p');
    countEl.className = 'persona-count';
    selector.after(countEl);

    /* ── Toggle logic ── */
    function switchPersona(persona) {
        /* buttons */
        var btns = selector.querySelectorAll('.persona-btn');
        for (var b = 0; b < btns.length; b++) {
            btns[b].classList.toggle('active', btns[b].getAttribute('data-persona') === persona);
        }

        /* persona-specific core messages */
        var msgs = document.querySelectorAll('[data-persona-msg]');
        for (var m = 0; m < msgs.length; m++) {
            msgs[m].style.display = msgs[m].getAttribute('data-persona-msg') === persona ? '' : 'none';
        }

        /* elements with explicit data-persona restrictions (exclude selector buttons) */
        var restricted = document.querySelectorAll('[data-persona]:not(.persona-btn)');
        for (var r = 0; r < restricted.length; r++) {
            var allowed = restricted[r].getAttribute('data-persona').split(' ');
            restricted[r].style.display = allowed.indexOf(persona) !== -1 ? '' : 'none';
        }

        /* section visibility */
        if (persona === 'full') {
            sectionGroups.forEach(function (g) {
                g.elements.forEach(function (el) { el.style.display = ''; });
            });
            countEl.textContent = '';
            return;
        }

        var sectionKeys = config.sections[persona];
        var shown = 0;
        sectionGroups.forEach(function (group) {
            var match = sectionKeys.some(function (key) { return group.text.indexOf(key) !== -1; });
            group.elements.forEach(function (el) { el.style.display = match ? '' : 'none'; });
            if (match) shown++;
        });

        /* re-apply data-persona after section toggle (overrides section display) */
        for (var r2 = 0; r2 < restricted.length; r2++) {
            var a = restricted[r2].getAttribute('data-persona').split(' ');
            restricted[r2].style.display = a.indexOf(persona) !== -1 ? '' : 'none';
        }

        countEl.textContent = config.count(shown, sectionGroups.length);

        /* scroll to top */
        if (header) window.scrollTo({ top: header.offsetTop - 60, behavior: 'smooth' });
    }

    /* ── Events ── */
    selector.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.persona-btn') : null;
        if (!btn && e.target.classList.contains('persona-btn')) btn = e.target;
        if (!btn) return;
        var persona = btn.getAttribute('data-persona');
        switchPersona(persona);
        if (history.replaceState) history.replaceState(null, '', '#' + persona);
    });

    /* URL hash on load */
    var hash = location.hash.slice(1);
    if (hash && config.personas[hash]) {
        switchPersona(hash);
    }
})();
