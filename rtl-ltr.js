
(function() {
  console.log('rtl-ltr.js v14');
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

  // Fix CSS custom property --namePriceLayoutAlignItems
  const fixAlignItemsProperty = (el) => {
    try {
      const computedStyle = window.getComputedStyle(el);
      const alignItemsValue = computedStyle.getPropertyValue('--namePriceLayoutAlignItems');
      
      if (alignItemsValue && alignItemsValue.trim() === 'flex-end') {
        el.style.setProperty('--namePriceLayoutAlignItems', 'flex-start', 'important');
      }
    } catch (error) {
      // Silently ignore errors
    }
  };

  // Handle wixui-rich-text__text text-align for specific tags
  // These texts should remain left-aligned while other elements are swapped to RTL
  const processRichTextChildren = (el) => {
    if (!el || !el.className || typeof el.className !== 'string') return;
    
    // Check if element has wixui-rich-text__text class
    if (!el.className.includes('wixui-rich-text__text')) return;
    
    // Only process specific tag types: p, h1-h6, ul, ol, s
    const tagName = el.tagName.toLowerCase();
    const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 's'];
    if (!allowedTags.includes(tagName)) return;
    
    // Skip if already processed
    if (el.dataset.rtlTextAlignFixed === 'true') return;
    
    try {
      const computedStyle = window.getComputedStyle(el);
      const textAlign = computedStyle.getPropertyValue('text-align');
      
      if (textAlign && textAlign.trim() === 'right') {
        el.style.setProperty('text-align', 'left', 'important');
        el.dataset.rtlTextAlignFixed = 'true';
      }
    } catch (error) {
      // Silently ignore errors
    }
  };
  
  // Process all wixui-rich-text__text elements in the document
  const processAllRichTextElements = () => {
    const richTextSelector = 'p.wixui-rich-text__text, h1.wixui-rich-text__text, h2.wixui-rich-text__text, h3.wixui-rich-text__text, h4.wixui-rich-text__text, h5.wixui-rich-text__text, h6.wixui-rich-text__text, ul.wixui-rich-text__text, ol.wixui-rich-text__text, s.wixui-rich-text__text';
    document.querySelectorAll(richTextSelector).forEach(processRichTextChildren);
  };

  const processElement = (el) => {
    if (!el || !el.className || typeof el.className !== 'string') return;
    
    // Only check if THIS script already processed it
    if (el.dataset.rtlSwapped === 'true') return;

    // Check if the element matches our target prefixes
    const hasPrefix = TARGET_PREFIXES.some(prefix => el.className.includes(prefix));
    if (!hasPrefix) return;

    // Apply RTL internal direction
    el.style.setProperty('direction', 'rtl', 'important');

    // Fix CSS custom property --namePriceLayoutAlignItems
    fixAlignItemsProperty(el);

    // Handle wixui-rich-text__text child elements (if this element contains them)
    processRichTextChildren(el);

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
          
          // Process rich text elements
          processRichTextChildren(node);
          if (node.querySelectorAll) {
            const richTextSelector = 'p.wixui-rich-text__text, h1.wixui-rich-text__text, h2.wixui-rich-text__text, h3.wixui-rich-text__text, h4.wixui-rich-text__text, h5.wixui-rich-text__text, h6.wixui-rich-text__text, ul.wixui-rich-text__text, ol.wixui-rich-text__text, s.wixui-rich-text__text';
            node.querySelectorAll(richTextSelector).forEach(processRichTextChildren);
          }
          
          // Process style elements
          if (node.tagName === 'STYLE' || node.querySelectorAll) {
            const styleElements = node.tagName === 'STYLE' ? [node] : node.querySelectorAll('style');
            styleElements.forEach(styleEl => {
              let cssText = styleEl.textContent || styleEl.innerHTML;
              if (cssText.includes('--namePriceLayoutAlignItems') && cssText.includes('flex-end')) {
                cssText = cssText.replace(/--namePriceLayoutAlignItems:\s*flex-end/g, '--namePriceLayoutAlignItems: flex-start');
                cssText = cssText.replace(/--namePriceLayoutAlignItems:\s*flex-end\s*;/g, '--namePriceLayoutAlignItems: flex-start;');
                
                if (styleEl.textContent !== undefined) {
                  styleEl.textContent = cssText;
                } else {
                  styleEl.innerHTML = cssText;
                }
                styleEl.dataset.rtlProcessed = 'true';
              }
            });
          }
        }
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Process style elements to fix CSS custom properties
  const processStyleElements = () => {
    document.querySelectorAll('style').forEach(styleEl => {
      if (styleEl.dataset.rtlProcessed === 'true') return;
      
      let cssText = styleEl.textContent || styleEl.innerHTML;
      if (cssText.includes('--namePriceLayoutAlignItems') && cssText.includes('flex-end')) {
        cssText = cssText.replace(/--namePriceLayoutAlignItems:\s*flex-end/g, '--namePriceLayoutAlignItems: flex-start');
        cssText = cssText.replace(/--namePriceLayoutAlignItems:\s*flex-end\s*;/g, '--namePriceLayoutAlignItems: flex-start;');
        
        if (styleEl.textContent !== undefined) {
          styleEl.textContent = cssText;
        } else {
          styleEl.innerHTML = cssText;
        }
        styleEl.dataset.rtlProcessed = 'true';
      }
    });
  };

  // 4. REVEAL BODY
  const revealBody = () => {
    document.querySelectorAll(dynamicSelector).forEach(processElement);
    processStyleElements();
    processAllRichTextElements();
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
