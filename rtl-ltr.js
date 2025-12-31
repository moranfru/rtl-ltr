//cdn cache check v3
(function() {
  // --- CONFIGURATION ---
  const RTL_LANGS = ['he'];
  const TARGET_PREFIXES = ['wixui-', 'StylableHorizontalMenu'];
  // ---------------------

  // 1. URL & QUERY CHECKS
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('custom_mirroring') === 'false') return;

  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const isRTLLang = pathSegments.some(segment => RTL_LANGS.includes(segment.toLowerCase()));
  if (!isRTLLang) return;

  // 2. BLOCK LAYOUT SHIFT (Hide Body)
  const styleHide = document.createElement('style');
  styleHide.id = 'rtl-load-shield';
  styleHide.innerHTML = `body { opacity: 0 !important; transition: none !important; }`;
  document.head.appendChild(styleHide);

  const processElement = (el) => {
    if (!el || !el.className || typeof el.className !== 'string') return;
    
    // Only check if THIS script already processed it
    if (el.dataset.rtlSwapped === 'true') return;

    // Check if the element matches our target prefixes
    const hasPrefix = TARGET_PREFIXES.some(prefix => el.className.includes(prefix));
    if (!hasPrefix) return;

    // Apply RTL internal direction
    el.style.setProperty('direction', 'rtl', 'important');

    const style = window.getComputedStyle(el);
    const ml = style.marginLeft;
    const mr = style.marginRight;
    const pl = style.paddingLeft;
    const pr = style.paddingRight;

    // Swap Margins if either side has a value
    if (ml !== '0px' || mr !== '0px') {
      el.style.setProperty('margin-left', mr, 'important');
      el.style.setProperty('margin-right', ml, 'important');
    }
    // Swap Paddings if either side has a value
    if (pl !== '0px' || pr !== '0px') {
      el.style.setProperty('padding-left', pr, 'important');
      el.style.setProperty('padding-right', pl, 'important');
    }

    // Mark as processed by this script
    el.dataset.rtlSwapped = 'true';
  };

  // Construct selector: [class^="prefix"], [class*=" prefix"]
  const dynamicSelector = TARGET_PREFIXES.map(p => `[class^="${p}"], [class*=" ${p}"]`).join(', ');

  // 3. OBSERVE DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          processElement(node);
          node.querySelectorAll(dynamicSelector).forEach(processElement);
        }
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // 4. REVEAL BODY
  const revealBody = () => {
    document.querySelectorAll(dynamicSelector).forEach(processElement);
    const shield = document.getElementById('rtl-load-shield');
    if (shield) shield.remove();
  };

  const failSafe = setTimeout(revealBody, 3000);

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    clearTimeout(failSafe);
    revealBody();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      clearTimeout(failSafe);
      revealBody();
    });
  }
})();