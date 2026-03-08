/**
 * TokiStorage Page View Tracker
 * Cookie UUIDでユニークユーザー識別、GASにビーコン送信
 */
(function() {
    var API_URL = 'https://script.google.com/macros/s/AKfycbxcyIzOVc9huwRjS_djqMr4OfygfwoJjDc29NrlWki-CaMjAPW40WRaAz8d1s9r8KpC/exec';

    // Cookie helper
    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }

    function setCookie(name, value, days) {
        var d = new Date();
        d.setTime(d.getTime() + days * 86400000);
        document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    }

    // Generate UUID v4
    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    // Get or create visitor ID
    function getVisitorId() {
        var vid = getCookie('toki_vid');
        if (!vid) {
            vid = uuid();
            setCookie('toki_vid', vid, 730); // 2 years
        }
        return vid;
    }

    // Detect source
    function getSource() {
        var params = new URLSearchParams(window.location.search);
        if (params.get('ref') === 'qr') return 'qr';
        if (params.get('ref')) return 'ref:' + params.get('ref');
        if (document.referrer) {
            try {
                var ref = new URL(document.referrer);
                if (ref.hostname === window.location.hostname) return 'internal';
                return 'referral:' + ref.hostname;
            } catch(e) {}
        }
        return 'direct';
    }

    // Bot / crawler detection
    function isBot() {
        var ua = navigator.userAgent;
        if (/bot|crawl|spider|slurp|facebook|twitter|linkedin|whatsapp|telegram|discord|preview|fetch|curl|wget|headless|phantom|selenium|puppeteer|lighthouse|pagespeed|pingdom|uptimerobot|monitor/i.test(ua)) return true;
        if (navigator.webdriver) return true;
        if (!window.localStorage) return true;
        return false;
    }

    function track() {
        if (isBot()) return;

        var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        var payload = {
            type: 'pageview',
            vid: getVisitorId(),
            page: document.title,
            path: window.location.pathname,
            source: getSource(),
            device: isMobile ? 'mobile' : 'desktop',
            screen: screen.width + 'x' + screen.height,
            lang: navigator.language || '',
            referrer: document.referrer || '',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        };

        var body = JSON.stringify(payload);

        // Use sendBeacon for non-blocking, fallback to fetch
        if (navigator.sendBeacon) {
            navigator.sendBeacon(API_URL, body);
        } else {
            fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: body
            });
        }
    }

    // Track on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', track);
    } else {
        track();
    }
})();

/**
 * TokiStorage Display Settings
 * localStorage に保存された文字サイズ・配色設定を全ページに適用
 */
(function() {
    var FONT_SIZES = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' };
    var COLOR_SCHEMES = {
        standard:  null,
        high:      { bg: '#FFFFFF', text: '#000000', link: '#0000EE' },
        dark:      { bg: '#1a1a2e', text: '#E0E0E0', link: '#64B5F6' },
        yellow:    { bg: '#000000', text: '#FFFF00', link: '#00FFFF' }
    };

    function apply() {
        var fs = localStorage.getItem('toki_fontsize');
        var cs = localStorage.getItem('toki_colorscheme');

        var style = document.getElementById('toki-display-override');
        if (!style) {
            style = document.createElement('style');
            style.id = 'toki-display-override';
            document.head.appendChild(style);
        }

        var rules = [];
        if (fs && FONT_SIZES[fs]) {
            rules.push('html { font-size: ' + FONT_SIZES[fs] + ' !important; }');
        }
        if (cs && COLOR_SCHEMES[cs]) {
            var c = COLOR_SCHEMES[cs];
            rules.push('body, .legal-page, .legal-inner, main, .toki-nav, footer, .toki-footer { background-color: ' + c.bg + ' !important; color: ' + c.text + ' !important; }');
            rules.push('h1, h2, h3, h4, h5, h6, p, li, td, th, span, label, .legal-inner p, .legal-inner li, .legal-inner h2 { color: ' + c.text + ' !important; }');
            rules.push('a, .legal-inner a { color: ' + c.link + ' !important; }');
        }
        style.textContent = rules.join('\n');
    }

    apply();
    window._tokiDisplayApply = apply;
})();
