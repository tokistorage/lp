/**
 * TokiStorage Contact Form
 * LINE/Calendlyリンクを置換し、モーダルフォームで送信
 * Google Apps Script経由でメール送信 + スプレッドシート記録
 */
(function() {
    var API_URL = 'https://script.google.com/macros/s/AKfycbwqw5USebrZxY_I0HW7dz3408k2k1xUvBMf--k96rt4oz_UomqlHDt49EG-O3qEzFPy/exec';

    var isEn = document.documentElement.lang === 'en';
    var t = {
        title:       isEn ? 'Contact Us'                    : 'お問い合わせ',
        name:        isEn ? 'Name'                           : 'お名前',
        contact:     isEn ? 'Email or Phone'                 : 'メールアドレスまたは電話番号',
        message:     isEn ? 'Message'                        : 'ご相談内容',
        required:    isEn ? '*'                               : '*',
        submit:      isEn ? 'Send Message'                   : '送信する',
        sending:     isEn ? 'Sending...'                     : '送信中...',
        successTitle:isEn ? 'Message Sent'                   : '送信完了',
        successMsg:  isEn ? 'We will reply within 24 hours.' : '24時間以内にご連絡いたします。',
        errorTitle:  isEn ? 'Send Failed'                    : '送信に失敗しました',
        errorMsg:    isEn ? 'Please try again, or contact us directly at:' : 'もう一度お試しいただくか、こちらに直接ご連絡ください：',
        close:       isEn ? 'Close'                          : '閉じる',
        placeholder: isEn ? 'Please tell us what you\'d like to discuss.' : 'ご相談内容をお書きください。',
        cta:         isEn ? 'Contact Us'                     : 'お問い合わせ'
    };

    // Cookie helpers
    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : '';
    }

    function setCookie(name, value, days) {
        var d = new Date();
        d.setTime(d.getTime() + days * 86400000);
        document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    }

    // Collect device/browser info
    function getDeviceInfo() {
        var ua = navigator.userAgent;
        var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
        return {
            device: isMobile ? 'mobile' : 'desktop',
            screen: screen.width + 'x' + screen.height,
            viewport: window.innerWidth + 'x' + window.innerHeight,
            ua: ua,
            lang: navigator.language || '',
            referrer: document.referrer || '',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        };
    }

    function buildModal() {
        var overlay = document.createElement('div');
        overlay.className = 'contact-overlay';
        overlay.id = 'contactOverlay';
        overlay.innerHTML =
            '<div class="contact-modal">' +
                '<div class="contact-header">' +
                    '<h2>' + t.title + '</h2>' +
                    '<button class="contact-close" id="contactClose" aria-label="Close">&times;</button>' +
                '</div>' +
                '<form class="contact-form" id="contactForm">' +
                    '<div class="contact-field">' +
                        '<label>' + t.name + '<span class="required">' + t.required + '</span></label>' +
                        '<input type="text" name="name" required autocomplete="name">' +
                    '</div>' +
                    '<div class="contact-field">' +
                        '<label>' + t.contact + '<span class="required">' + t.required + '</span></label>' +
                        '<input type="text" name="contact" required autocomplete="email">' +
                    '</div>' +
                    '<div class="contact-field">' +
                        '<label>' + t.message + '</label>' +
                        '<textarea name="message" rows="4" placeholder="' + t.placeholder + '"></textarea>' +
                    '</div>' +
                    '<div class="contact-hp" aria-hidden="true">' +
                        '<input type="text" name="botcheck" tabindex="-1" autocomplete="off">' +
                    '</div>' +
                    '<button type="submit" class="contact-submit" id="contactSubmit">' + t.submit + '</button>' +
                '</form>' +
                '<div class="contact-result" id="contactSuccess">' +
                    '<div class="contact-result-icon">&#10003;</div>' +
                    '<h3>' + t.successTitle + '</h3>' +
                    '<p>' + t.successMsg + '</p>' +
                    '<button class="contact-result-close" id="contactSuccessClose">' + t.close + '</button>' +
                '</div>' +
                '<div class="contact-result" id="contactError">' +
                    '<div class="contact-result-icon">!</div>' +
                    '<h3>' + t.errorTitle + '</h3>' +
                    '<p>' + t.errorMsg + '</p>' +
                    '<p class="contact-fallback-email"><a href="mailto:tokistorage1000@gmail.com">tokistorage1000@gmail.com</a></p>' +
                    '<button class="contact-result-close" id="contactErrorClose">' + t.close + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    function extractContext(href) {
        try {
            var url = new URL(href);
            var search = url.search;
            if (search && search.length > 1) {
                return decodeURIComponent(search.substring(1));
            }
        } catch(e) {}
        return document.title;
    }

    // Mail SVG icon
    var mailIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';

    function init() {
        // Replace LINE/Calendly links with contact CTA
        var lineCalendlyLinks = document.querySelectorAll(
            'a[href*="line.me/R/oaMessage"], a[href*="calendly.com"]'
        );
        lineCalendlyLinks.forEach(function(link) {
            link.removeAttribute('target');
            link.removeAttribute('rel');
            link.href = '#contact';
            link.innerHTML = mailIcon + ' ' + t.cta;
        });

        // Collect all contact trigger links (including converted + pre-existing #contact links)
        var ctaLinks = document.querySelectorAll('a[href="#contact"]');

        // If no contact links, inject CTA before essay-nav-links
        if (ctaLinks.length === 0) {
            var essayNav = document.getElementById('essay-nav-links');
            if (essayNav) {
                var ctaDiv = document.createElement('div');
                ctaDiv.className = 'essay-contact-cta';
                ctaDiv.innerHTML = '<a href="#contact" class="essay-contact-btn">' + mailIcon + ' ' + t.cta + '</a>';
                essayNav.parentNode.insertBefore(ctaDiv, essayNav);
                ctaLinks = ctaDiv.querySelectorAll('a');
            } else {
                return;
            }
        }

        var overlay = buildModal();
        var form = document.getElementById('contactForm');
        var submitBtn = document.getElementById('contactSubmit');
        var closeBtn = document.getElementById('contactClose');
        var successPanel = document.getElementById('contactSuccess');
        var errorPanel = document.getElementById('contactError');

        function openModal(context) {
            var nameInput = form.querySelector('input[name="name"]');
            var contactInput = form.querySelector('input[name="contact"]');
            var textarea = form.querySelector('textarea[name="message"]');

            // Auto-fill from cookies
            var savedName = getCookie('toki_name');
            var savedContact = getCookie('toki_contact');
            if (nameInput && savedName) nameInput.value = savedName;
            if (contactInput && savedContact) contactInput.value = savedContact;
            if (textarea && context) textarea.value = context;

            form.style.display = '';
            successPanel.classList.remove('active');
            errorPanel.classList.remove('active');
            submitBtn.disabled = false;
            submitBtn.textContent = t.submit;
            overlay.classList.add('active');
            overlay.offsetHeight;
            document.body.style.overflow = 'hidden';
            setTimeout(function() {
                if (savedName && savedContact) {
                    if (textarea) textarea.focus();
                } else if (nameInput) {
                    nameInput.focus();
                }
            }, 100);
        }

        function closeModal() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        ctaLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                openModal(document.title);
            });
        });

        // Auto-open modal when URL contains #contact
        if (window.location.hash === '#contact') {
            openModal(document.title);
        }

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
        });
        document.getElementById('contactSuccessClose').addEventListener('click', closeModal);
        document.getElementById('contactErrorClose').addEventListener('click', function() {
            errorPanel.classList.remove('active');
            form.style.display = '';
            submitBtn.disabled = false;
            submitBtn.textContent = t.submit;
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (form.querySelector('input[name="botcheck"]').value) return;

            submitBtn.disabled = true;
            submitBtn.textContent = t.sending;

            var device = getDeviceInfo();
            var payload = {
                name: form.querySelector('input[name="name"]').value,
                contact: form.querySelector('input[name="contact"]').value,
                message: form.querySelector('textarea[name="message"]').value,
                page: document.title,
                url: window.location.href,
                device: device.device,
                screen: device.screen,
                viewport: device.viewport,
                ua: device.ua,
                lang: device.lang,
                referrer: device.referrer,
                timezone: device.timezone
            };

            fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            })
            .then(function() {
                // Save name & contact to cookies (730 days)
                setCookie('toki_name', payload.name, 730);
                setCookie('toki_contact', payload.contact, 730);
                form.style.display = 'none';
                successPanel.classList.add('active');
                form.reset();
            })
            .catch(function() {
                form.style.display = 'none';
                errorPanel.classList.add('active');
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
