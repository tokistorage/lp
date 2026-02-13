/**
 * TokiStorage Contact Form
 * LINE/Calendlyリンクをインターセプトし、モーダルフォームで送信
 * Google Apps Script経由でメール送信 + スプレッドシート記録
 */
(function() {
    // Google Apps Script Web App URL（デプロイ後に差し替え）
    var API_URL = 'GAS_WEB_APP_URL';

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
        errorMsg:    isEn ? 'Please try again later.'        : 'もう一度お試しください。',
        close:       isEn ? 'Close'                          : '閉じる',
        placeholder: isEn ? 'Please tell us what you\'d like to discuss.' : 'ご相談内容をお書きください。'
    };

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
                    '<button class="contact-result-close" id="contactErrorClose">' + t.close + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    // Extract context from LINE URL parameter
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

    function init() {
        // Intercept both LINE and Calendly links
        var ctaLinks = document.querySelectorAll(
            'a[href*="line.me/R/oaMessage"], a[href*="calendly.com"]'
        );
        if (ctaLinks.length === 0) return;

        var overlay = buildModal();
        var form = document.getElementById('contactForm');
        var submitBtn = document.getElementById('contactSubmit');
        var closeBtn = document.getElementById('contactClose');
        var successPanel = document.getElementById('contactSuccess');
        var errorPanel = document.getElementById('contactError');

        function openModal(context) {
            var textarea = form.querySelector('textarea[name="message"]');
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
                var firstInput = form.querySelector('input[name="name"]');
                if (firstInput) firstInput.focus();
            }, 100);
        }

        function closeModal() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Intercept CTA links
        ctaLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var href = this.getAttribute('href');
                openModal(extractContext(href));
            });
        });

        // Close handlers
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

        // Form submission via Google Apps Script
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (form.querySelector('input[name="botcheck"]').value) return;

            submitBtn.disabled = true;
            submitBtn.textContent = t.sending;

            var payload = {
                name: form.querySelector('input[name="name"]').value,
                contact: form.querySelector('input[name="contact"]').value,
                message: form.querySelector('textarea[name="message"]').value,
                page: document.title,
                url: window.location.href
            };

            fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function() {
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
