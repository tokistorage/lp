/**
 * TokiStorage Page View Tracker
 * Cookie UUIDでユニークユーザー識別、GASにビーコン送信
 */
(function() {
    var API_URL = 'https://script.google.com/macros/s/AKfycbzkTrsYn9dYkOnLDEFdOTqZUiUptqI-3suVe7TJ5qZFF4oZupOq07sBJslNrkDOFjjj/exec';

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

    function track() {
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
