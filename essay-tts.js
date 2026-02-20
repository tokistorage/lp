(function () {
  'use strict';

  if (!('speechSynthesis' in window)) return;

  var synth = window.speechSynthesis;
  var lang = document.documentElement.lang === 'en' ? 'en' : 'ja';
  var utterance = null;
  var state = 'stopped'; // stopped | playing | paused
  var chunks = [];
  var chunkIndex = 0;
  var rate = 1.0;
  var CHUNK_MAX = 180;

  // --- UI injection ---------------------------------------------------

  function injectStyles() {
    var css = document.createElement('style');
    css.textContent = [
      '.tts-btn{display:inline-flex;align-items:center;gap:4px;font-size:.7rem;color:var(--text-secondary,#475569);background:none;border:1px solid var(--border,#E2E8F0);border-radius:4px;padding:3px 8px;cursor:pointer;font-family:inherit;transition:background .15s,color .15s;white-space:nowrap}',
      '.tts-btn:hover{background:var(--toki-violet,var(--toki-blue,#2563EB));color:#fff;border-color:var(--toki-violet,var(--toki-blue,#2563EB))}',
      '.tts-btn.is-active{background:var(--toki-violet,var(--toki-blue,#2563EB));color:#fff;border-color:var(--toki-violet,var(--toki-blue,#2563EB))}',
      '.tts-icon{width:14px;height:14px;fill:currentColor;flex-shrink:0}',
      '.tts-speed{font-size:.65rem;min-width:2.2em;text-align:center}',
      '.tts-controls{display:inline-flex;align-items:center;gap:4px}',
      '.tts-progress{position:fixed;top:0;left:0;height:2px;background:var(--toki-violet,var(--toki-blue,#2563EB));z-index:1001;transition:width .3s;pointer-events:none}',
      '.tts-highlight{background:rgba(124,58,237,.08);border-radius:2px;transition:background .2s}',
      '@media print{.tts-controls,.tts-progress{display:none}}'
    ].join('\n');
    document.head.appendChild(css);
  }

  function svgIcon(name) {
    var paths = {
      play: '<polygon points="5,3 19,12 5,21"/>',
      pause: '<rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/>',
      stop: '<rect x="4" y="4" width="16" height="16" rx="2"/>',
      faster: '<polygon points="3,6 11,12 3,18"/><polygon points="11,6 19,12 11,18"/>'
    };
    return '<svg class="tts-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' + (paths[name] || '') + '</svg>';
  }

  function buildControls() {
    var navRight = document.querySelector('.article-nav .nav-right');
    if (!navRight) return;

    var wrap = document.createElement('span');
    wrap.className = 'tts-controls';

    // play / pause button
    var playBtn = document.createElement('button');
    playBtn.className = 'tts-btn';
    playBtn.id = 'tts-play';
    playBtn.setAttribute('aria-label', lang === 'ja' ? '読み上げ' : 'Read aloud');
    playBtn.innerHTML = svgIcon('play') + '<span class="tts-label">' + (lang === 'ja' ? '読み上げ' : 'Listen') + '</span>';
    wrap.appendChild(playBtn);

    // speed button
    var speedBtn = document.createElement('button');
    speedBtn.className = 'tts-btn';
    speedBtn.id = 'tts-speed';
    speedBtn.setAttribute('aria-label', lang === 'ja' ? '速度変更' : 'Change speed');
    speedBtn.innerHTML = '<span class="tts-speed">1×</span>';
    wrap.appendChild(speedBtn);

    // stop button
    var stopBtn = document.createElement('button');
    stopBtn.className = 'tts-btn';
    stopBtn.id = 'tts-stop';
    stopBtn.setAttribute('aria-label', lang === 'ja' ? '停止' : 'Stop');
    stopBtn.innerHTML = svgIcon('stop');
    stopBtn.style.display = 'none';
    wrap.appendChild(stopBtn);

    // insert before lang-switch
    var langSwitch = navRight.querySelector('.lang-switch');
    if (langSwitch) {
      navRight.insertBefore(wrap, langSwitch);
    } else {
      navRight.appendChild(wrap);
    }

    // progress bar
    var bar = document.createElement('div');
    bar.className = 'tts-progress';
    bar.id = 'tts-progress';
    bar.style.width = '0%';
    document.body.appendChild(bar);

    playBtn.addEventListener('click', togglePlay);
    speedBtn.addEventListener('click', cycleSpeed);
    stopBtn.addEventListener('click', stopAll);
  }

  // --- Text extraction ------------------------------------------------

  function extractText() {
    var parts = [];

    // Title
    var h1 = document.querySelector('.article-header h1');
    if (h1) parts.push(h1.textContent.trim());

    // Subtitle
    var sub = document.querySelector('.article-subtitle');
    if (sub) parts.push(sub.textContent.trim());

    // Article content — walk through child nodes in order
    var content = document.querySelector('.article-content');
    if (content) {
      var children = content.children;
      for (var i = 0; i < children.length; i++) {
        var el = children[i];
        // skip references section and share bar (injected by essay-nav)
        if (el.classList.contains('references')) continue;
        if (el.classList.contains('share-bar')) continue;
        if (el.classList.contains('disclaimer')) continue;
        var text = el.textContent.trim();
        if (text) parts.push(text);
      }
    }

    return parts;
  }

  function splitIntoChunks(parts) {
    var result = [];
    for (var i = 0; i < parts.length; i++) {
      var text = parts[i];
      if (text.length <= CHUNK_MAX) {
        result.push({ text: text, partIndex: i });
      } else {
        // split at sentence boundaries
        var sentences = text.match(/[^。.!!\?\?]+[。.!!\?\?]?/g) || [text];
        var buf = '';
        for (var j = 0; j < sentences.length; j++) {
          if (buf.length + sentences[j].length > CHUNK_MAX && buf.length > 0) {
            result.push({ text: buf.trim(), partIndex: i });
            buf = '';
          }
          buf += sentences[j];
        }
        if (buf.trim()) {
          result.push({ text: buf.trim(), partIndex: i });
        }
      }
    }
    return result;
  }

  // --- Playback -------------------------------------------------------

  function pickVoice() {
    var voices = synth.getVoices();
    var preferred = lang === 'ja'
      ? ['Google 日本語', 'Microsoft Nanami', 'Kyoko', 'O-Ren', 'Hattori']
      : ['Google US English', 'Microsoft Aria', 'Samantha', 'Daniel'];

    for (var p = 0; p < preferred.length; p++) {
      for (var v = 0; v < voices.length; v++) {
        if (voices[v].name.indexOf(preferred[p]) !== -1) return voices[v];
      }
    }
    // fallback: first voice matching lang
    for (var v2 = 0; v2 < voices.length; v2++) {
      if (voices[v2].lang.indexOf(lang) === 0) return voices[v2];
    }
    return null;
  }

  function speakChunk(index) {
    if (index >= chunks.length) {
      stopAll();
      return;
    }
    chunkIndex = index;
    updateProgress();

    utterance = new SpeechSynthesisUtterance(chunks[index].text);
    utterance.lang = lang === 'ja' ? 'ja-JP' : 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    var voice = pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = function () {
      speakChunk(index + 1);
    };
    utterance.onerror = function (e) {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        speakChunk(index + 1);
      }
    };

    synth.speak(utterance);
  }

  function startPlaying() {
    if (chunks.length === 0) {
      var parts = extractText();
      chunks = splitIntoChunks(parts);
    }
    if (chunks.length === 0) return;

    state = 'playing';
    updateUI();
    speakChunk(chunkIndex);
  }

  function togglePlay() {
    if (state === 'stopped') {
      startPlaying();
    } else if (state === 'playing') {
      synth.pause();
      state = 'paused';
      updateUI();
    } else if (state === 'paused') {
      synth.resume();
      state = 'playing';
      updateUI();
    }
  }

  function stopAll() {
    synth.cancel();
    state = 'stopped';
    chunkIndex = 0;
    updateUI();
    updateProgress();
  }

  function cycleSpeed() {
    var speeds = [1.0, 1.25, 1.5, 0.75];
    var idx = speeds.indexOf(rate);
    rate = speeds[(idx + 1) % speeds.length];

    var label = document.querySelector('#tts-speed .tts-speed');
    if (label) label.textContent = rate + '×';

    // restart current chunk at new speed
    if (state === 'playing') {
      synth.cancel();
      speakChunk(chunkIndex);
    }
  }

  // --- UI updates -----------------------------------------------------

  function updateUI() {
    var playBtn = document.getElementById('tts-play');
    var stopBtn = document.getElementById('tts-stop');
    if (!playBtn) return;

    if (state === 'stopped') {
      playBtn.innerHTML = svgIcon('play') + '<span class="tts-label">' + (lang === 'ja' ? '読み上げ' : 'Listen') + '</span>';
      playBtn.classList.remove('is-active');
      if (stopBtn) stopBtn.style.display = 'none';
    } else if (state === 'playing') {
      playBtn.innerHTML = svgIcon('pause') + '<span class="tts-label">' + (lang === 'ja' ? '一時停止' : 'Pause') + '</span>';
      playBtn.classList.add('is-active');
      if (stopBtn) stopBtn.style.display = '';
    } else if (state === 'paused') {
      playBtn.innerHTML = svgIcon('play') + '<span class="tts-label">' + (lang === 'ja' ? '再開' : 'Resume') + '</span>';
      playBtn.classList.add('is-active');
      if (stopBtn) stopBtn.style.display = '';
    }
  }

  function updateProgress() {
    var bar = document.getElementById('tts-progress');
    if (!bar) return;
    if (state === 'stopped') {
      bar.style.width = '0%';
    } else {
      var pct = chunks.length > 0 ? ((chunkIndex / chunks.length) * 100) : 0;
      bar.style.width = pct + '%';
    }
  }

  // --- Chrome keepalive workaround ------------------------------------
  // Chrome pauses synthesis after ~15s; this resumes it
  var keepAlive;
  function startKeepAlive() {
    clearInterval(keepAlive);
    keepAlive = setInterval(function () {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 12000);
  }
  function stopKeepAlive() {
    clearInterval(keepAlive);
  }

  // watch state changes for keepalive
  var origToggle = togglePlay;
  togglePlay = function () {
    origToggle();
    if (state === 'playing') startKeepAlive();
    else stopKeepAlive();
  };
  var origStop = stopAll;
  stopAll = function () {
    origStop();
    stopKeepAlive();
  };

  // --- Initialise -----------------------------------------------------

  function init() {
    // only run on essay pages
    if (!document.querySelector('.article-content')) return;

    injectStyles();
    buildControls();

    // ensure voices are loaded (async in some browsers)
    if (synth.getVoices().length === 0) {
      synth.addEventListener('voiceschanged', function () {}, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // cleanup on page unload
  window.addEventListener('beforeunload', function () {
    synth.cancel();
    stopKeepAlive();
  });
})();
