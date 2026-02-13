/* TokiStorage Landing Page - JavaScript
 *
 * Features:
 * - FAQ accordion
 * - Smooth anchor scrolling
 * - Mobile navigation toggle
 * - Scroll reveal animations
 * - Navbar scroll effect
 */

document.addEventListener('DOMContentLoaded', function() {

    // ---- FAQ Accordion ----
    document.querySelectorAll('.faq-question').forEach(function(button) {
        button.addEventListener('click', function() {
            var item = this.parentElement;
            var isActive = item.classList.contains('active');

            // Close all other FAQ items
            document.querySelectorAll('.faq-item').forEach(function(faq) {
                faq.classList.remove('active');
            });

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // ---- Smooth Scroll for Hash Anchors ----
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (!href || href === '#') return;
            e.preventDefault();
            var target = document.querySelector(href);
            if (target) {
                var navHeight = document.querySelector('.toki-nav').offsetHeight;
                var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }

            // Close mobile nav if open
            var navLinks = document.querySelector('.nav-links');
            if (navLinks) navLinks.classList.remove('open');
        });
    });

    // ---- Mobile Navigation Toggle ----
    var navToggle = document.querySelector('.nav-toggle');
    var navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('open');
        });
    }

    // ---- Scroll Reveal ----
    var revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    // Apply reveal class and observe
    var revealSelectors = [
        '.persona-card',
        '.problem-card',
        '.feature-card',
        '.stat-card',
        '.evidence-box',
        '.experience-card',
        '.testimonial-card',
        '.pricing-card',
        '.faq-item',
        '.process-step'
    ];

    revealSelectors.forEach(function(selector) {
        document.querySelectorAll(selector).forEach(function(el) {
            el.classList.add('reveal');
            revealObserver.observe(el);
        });
    });

    // ---- Navbar Scroll Effect ----
    var nav = document.querySelector('.toki-nav');
    if (nav) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                nav.style.borderBottomColor = 'rgba(59, 130, 246, 0.2)';
            } else {
                nav.style.borderBottomColor = 'rgba(59, 130, 246, 0.1)';
            }
        });
    }

    // ---- Persona More Toggle ----
    var personaToggle = document.getElementById('personaToggle');
    var personaMore = document.getElementById('personaMore');
    if (personaToggle && personaMore) {
        personaToggle.addEventListener('click', function() {
            var isOpen = personaMore.style.display !== 'none';
            personaMore.style.display = isOpen ? 'none' : 'block';
            personaToggle.classList.toggle('open', !isOpen);
        });
    }

    // ---- Pearl Soap QR Referral Banner ----
    var params = new URLSearchParams(window.location.search);
    var ref = params.get('ref');
    var soapBanner = document.getElementById('soapBanner');
    var soapClose = document.getElementById('soapBannerClose');

    function closeSoapBanner() {
        soapBanner.style.opacity = '0';
        setTimeout(function() {
            soapBanner.style.display = 'none';
            document.body.classList.remove('has-soap-banner');
        }, 300);
    }

    if (ref === 'soap' && soapBanner) {
        soapBanner.style.display = 'block';
        soapBanner.style.transition = 'opacity 0.3s ease';
        document.body.classList.add('has-soap-banner');

        // Auto-hide after 8 seconds
        setTimeout(closeSoapBanner, 8000);
    }

    if (soapClose) {
        soapClose.addEventListener('click', closeSoapBanner);
    }

    // ---- Console Message ----
    console.log('%cトキストレージ - 千年先へ届ける存在証明', 'color: #3B82F6; font-size: 16px; font-weight: bold;');
});
