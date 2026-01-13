
(function() {
  console.log('rtl-ltr.js v31');
  // --- CONFIGURATION ---
  const RTL_LANGS = ['he'];
  const TARGET_PREFIXES = ['wixui-', 'StylableHorizontalMenu'];
  const MENU_BREAKPOINT = 750; // Viewport width breakpoint in pixels for menu margin/padding swap
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

  // Handle wixui-rich-text__text elements: swap text-align right to left, remove inline text-align left
  const processRichTextElement = (el) => {
    if (!el) return;
    
    // Skip if already processed
    if (el.dataset.rtlRichTextFixed === 'true') return;
    
    // Check if element has wixui-rich-text__text class
    if (!el.className || typeof el.className !== 'string' || !el.className.includes('wixui-rich-text__text')) {
      return;
    }
    
    // Only process specific tag types: p, h1-h6, ul, ol, span
    const tagName = el.tagName ? el.tagName.toLowerCase() : '';
    const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'span'];
    if (!allowedTags.includes(tagName)) return;
    
    try {
      const computedStyle = window.getComputedStyle(el);
      const direction = computedStyle.getPropertyValue('direction');
      
      // Only process if element has direction: rtl
      if (direction && direction.trim() === 'rtl') {
        // First, remove inline style text-align: left if present (Wix viewer quirk)
        const inlineTextAlign = el.style.textAlign;
        if (inlineTextAlign && inlineTextAlign.trim().toLowerCase() === 'left') {
          el.style.removeProperty('text-align');
        }
        
        // Re-check computed style after removing inline left (in case it changed)
        const updatedComputedStyle = window.getComputedStyle(el);
        const computedTextAlign = updatedComputedStyle.getPropertyValue('text-align');
        
        // If text-align is 'right', change it to 'left' (LTR right becomes RTL left)
        if (computedTextAlign && computedTextAlign.trim() === 'right') {
          el.style.setProperty('text-align', 'left', 'important');
        } else if (computedTextAlign && computedTextAlign.trim() === 'center') {
          // Preserve center alignment - do not change
          // No action needed
        } else {
          // Otherwise, set text-align: right for RTL elements
          el.style.setProperty('text-align', 'right', 'important');
        }
      }
      
      // Mark as processed
      el.dataset.rtlRichTextFixed = 'true';
    } catch (error) {
      // Silently ignore errors
    }
  };

  // Process all wixui-rich-text__text elements in the document
  const processAllRichTextElements = () => {
    const richTextSelector = 'p.wixui-rich-text__text, h1.wixui-rich-text__text, h2.wixui-rich-text__text, h3.wixui-rich-text__text, h4.wixui-rich-text__text, h5.wixui-rich-text__text, h6.wixui-rich-text__text, ul.wixui-rich-text__text, ol.wixui-rich-text__text, span.wixui-rich-text__text';
    document.querySelectorAll(richTextSelector).forEach(processRichTextElement);
  };

  // Handle text tags with text-align: start - swap to right for RTL
  const processStartAlignedElements = (el) => {
    if (!el) return;
    
    // Skip wixui-rich-text__text elements - these are handled separately
    if (el.className && typeof el.className === 'string' && el.className.includes('wixui-rich-text__text')) {
      return;
    }
    
    // Only process specific text tags: p, h1-h6, ul, ol
    const tagName = el.tagName ? el.tagName.toLowerCase() : '';
    const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol'];
    if (!allowedTags.includes(tagName)) return;
    
    // Skip if already processed
    if (el.dataset.rtlStartAligned === 'true') return;
    
    try {
      const computedStyle = window.getComputedStyle(el);
      const textAlign = computedStyle.getPropertyValue('text-align');
      
      // If computed text-align is 'start', set to 'right' for RTL
      if (textAlign && textAlign.trim() === 'start') {
        el.style.setProperty('text-align', 'right', 'important');
        el.dataset.rtlStartAligned = 'true';
      }
    } catch (error) {
      // Silently ignore errors
    }
  };

  // Process all text tags with text-align: start
  const processAllStartAlignedElements = () => {
    const textTagSelector = 'p, h1, h2, h3, h4, h5, h6, ul, ol';
    document.querySelectorAll(textTagSelector).forEach(el => {
      // Skip wixui-rich-text__text elements - these are handled separately
      if (el.className && typeof el.className === 'string' && el.className.includes('wixui-rich-text__text')) {
        return;
      }
      processStartAlignedElements(el);
    });
  };

  // Handle info-element-text elements: swap text-align (if not centered) and swap direction
  //pro gallery
  const processInfoElementText = (el) => {
    if (!el) return;
    
    // Skip if already processed
    if (el.dataset.rtlInfoElementTextFixed === 'true') return;
    
    // Check if element has info-element-text class
    if (!el.className || typeof el.className !== 'string' || !el.className.includes('info-element-text')) {
      return;
    }
    
    try {
      const computedStyle = window.getComputedStyle(el);
      const direction = computedStyle.getPropertyValue('direction');
      const textAlign = computedStyle.getPropertyValue('text-align');
      
      // Swap direction: ltr -> rtl, rtl -> ltr
      if (direction && direction.trim() === 'ltr') {
        el.style.setProperty('direction', 'rtl', 'important');
      } else if (direction && direction.trim() === 'rtl') {
        el.style.setProperty('direction', 'ltr', 'important');
      }
      
      // Swap text-align if not centered: left -> right, right -> left, preserve center
      if (textAlign && textAlign.trim() === 'left') {
        el.style.setProperty('text-align', 'right', 'important');
      } else if (textAlign && textAlign.trim() === 'right') {
        el.style.setProperty('text-align', 'left', 'important');
      }
      // If center, do nothing (preserve it)
      
      el.dataset.rtlInfoElementTextFixed = 'true';
    } catch (error) {
      // Silently ignore errors
    }
  };

  // Process all info-element-text elements in the document
  const processAllInfoElementText = () => {
    document.querySelectorAll('.info-element-text').forEach(processInfoElementText);
  };

  // Handle button elements with AccordionContainer className prefix: set direction rtl
  //accordion title
  const processAccordionButton = (el) => {
    if (!el) return;
    
    // Skip if already processed
    if (el.dataset.rtlAccordionFixed === 'true') return;
    
    // Check if element is a button
    if (!el.tagName || el.tagName.toLowerCase() !== 'button') return;
    
    // Check if element has className with prefix 'AccordionContainer'
    if (!el.className || typeof el.className !== 'string') return;
    
    const hasAccordionPrefix = el.className.split(' ').some(cls => cls.startsWith('AccordionContainer'));
    if (!hasAccordionPrefix) return;
    
    try {
      el.style.setProperty('direction', 'rtl', 'important');
      el.dataset.rtlAccordionFixed = 'true';
    } catch (error) {
      // Silently ignore errors
    }
  };

  // Process all accordion button elements in the document
  const processAllAccordionButtons = () => {
    document.querySelectorAll('button[class*="AccordionContainer"]').forEach(processAccordionButton);
  };

  // Handle wixui-vector-image elements: mirror nested svg with scaleX(-1)
  const processVectorImage = (el) => {
    if (!el) return;
    
    // Skip if already processed
    if (el.dataset.rtlVectorImageFixed === 'true') return;
    
    // Check if element has wixui-vector-image class
    if (!el.className || typeof el.className !== 'string' || !el.className.includes('wixui-vector-image')) {
      return;
    }
    
    // Skip if element also has wixui-ignore-svg-rtl-swap class
    if (el.className.includes('wixui-ignore-svg-rtl-swap')) {
      return;
    }
    
    try {
      // Find nested svg element
      const svgElement = el.querySelector('svg');
      if (svgElement) {
        svgElement.style.transform = 'scaleX(-1)';
        el.dataset.rtlVectorImageFixed = 'true';
      }
    } catch (error) {
      // Silently ignore errors
    }
  };

  // Process all wixui-vector-image elements in the document
  const processAllVectorImages = () => {
    document.querySelectorAll('.wixui-vector-image').forEach(el => {
      // Skip if element also has wixui-ignore-svg-rtl-swap class
      if (el.className && typeof el.className === 'string' && el.className.includes('wixui-ignore-svg-rtl-swap')) {
        return;
      }
      processVectorImage(el);
    });
  };

  // Handle background media layers: mirror images within bgLayers
  //backround media
  const processBackgroundMedia = (el) => {
    if (!el) return;
    
    // Skip if already processed
    if (el.dataset.rtlBackgroundMediaFixed === 'true') return;
    
    // Check if element has data-hook="bgLayers"
    if (!el.hasAttribute || !el.hasAttribute('data-hook')) return;
    if (el.getAttribute('data-hook') !== 'bgLayers') return;
    
    try {
      // Find the nested image within this specific layer
      const img = el.querySelector('img');
      
      // Apply the horizontal flip if an image exists
      if (img) {
        img.style.transform = 'scaleX(-1)';
        el.dataset.rtlBackgroundMediaFixed = 'true';
      }
    } catch (error) {
      // Silently ignore errors
    }
  };

  // Process all background media layers in the document
  const processAllBackgroundMedia = () => {
    document.querySelectorAll('[data-hook="bgLayers"]').forEach(processBackgroundMedia);
  };

  // Handle wixui-mirror-img elements: mirror nested img with scaleX(-1)
  const processMirrorImg = (el) => {
    if (!el) return;
    
    // Skip if already processed
    if (el.dataset.rtlMirrorImgFixed === 'true') return;
    
    // Check if element has wixui-mirror-img class
    if (!el.className || typeof el.className !== 'string' || !el.className.includes('wixui-mirror-img')) {
      return;
    }
    
    try {
      // Find nested img element
      const imgElement = el.querySelector('img');
      if (imgElement) {
        imgElement.style.transform = 'scaleX(-1)';
        el.dataset.rtlMirrorImgFixed = 'true';
      }
    } catch (error) {
      // Silently ignore errors
    }
  };

  // Process all wixui-mirror-img elements in the document
  const processAllMirrorImgs = () => {
    document.querySelectorAll('.wixui-mirror-img').forEach(processMirrorImg);
  };

  // Check if viewport width is above breakpoint
  const isAboveBreakpoint = () => {
    return window.innerWidth > MENU_BREAKPOINT;
  };

  // Handle menu elements: swap margins/paddings on parent.parent for breakpoint > 750px
  const processMenuElement = (el) => {
    if (!el || !el.className || typeof el.className !== 'string') return;
    
    // Check if element has wixui-horizontal-menu or wixui-menu class
    const hasMenuClass = el.className.includes('wixui-horizontal-menu') || el.className.includes('wixui-menu');
    if (!hasMenuClass) return;
    
    // Skip if already processed (we'll track by the parent.parent element)
    if (el.dataset.rtlMenuProcessed === 'true') return;
    
    // Only process if viewport is above breakpoint
    if (!isAboveBreakpoint()) {
      return;
    }
    
    try {
      // Go 2 levels up: parent.parent
      const parent = el.parentElement;
      if (!parent) return;
      
      const grandParent = parent.parentElement;
      if (!grandParent) return;
      
      // Skip if grandparent already processed
      if (grandParent.dataset.rtlMenuGrandParentSwapped === 'true') return;
      
      const style = window.getComputedStyle(grandParent);
      const ml = style.marginLeft;
      const mr = style.marginRight;
      const pl = style.paddingLeft;
      const pr = style.paddingRight;
      
      // Swap Margins if either side has a value
      if (ml !== '0px' || mr !== '0px') {
        grandParent.style.setProperty('margin-left', mr, 'important');
        grandParent.style.setProperty('margin-right', ml, 'important');
      }
      
      // Swap Paddings if either side has a value
      if (pl !== '0px' || pr !== '0px') {
        grandParent.style.setProperty('padding-left', pr, 'important');
        grandParent.style.setProperty('padding-right', pl, 'important');
      }
      
      // Mark as processed
      grandParent.dataset.rtlMenuGrandParentSwapped = 'true';
      el.dataset.rtlMenuProcessed = 'true';
    } catch (error) {
      // Silently ignore errors
    }
  };

  // Process all menu elements
  const processAllMenuElements = () => {
    // Only process if viewport is above breakpoint
    if (!isAboveBreakpoint()) {
      return;
    }
    
    const menuSelector = '.wixui-horizontal-menu, .wixui-menu';
    document.querySelectorAll(menuSelector).forEach(processMenuElement);
  };

  const processElement = (el) => {
    if (!el || !el.className || typeof el.className !== 'string') return;
    
    // Only check if THIS script already processed it
    if (el.dataset.rtlSwapped === 'true') return;

    // Check if the element matches our target prefixes
    const hasPrefix = TARGET_PREFIXES.some(prefix => el.className.includes(prefix));
    if (!hasPrefix) return;

    // Skip if element has wixui-ignore-box-rtl-swap class
    if (el.className.includes('wixui-ignore-box-rtl-swap')) return;

    // Apply RTL internal direction
    el.style.setProperty('direction', 'rtl', 'important');

    // Fix CSS custom property --namePriceLayoutAlignItems
    fixAlignItemsProperty(el);

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
          
          // Process wixui-rich-text__text elements
          processRichTextElement(node);
          if (node.querySelectorAll) {
            const richTextSelector = 'p.wixui-rich-text__text, h1.wixui-rich-text__text, h2.wixui-rich-text__text, h3.wixui-rich-text__text, h4.wixui-rich-text__text, h5.wixui-rich-text__text, h6.wixui-rich-text__text, ul.wixui-rich-text__text, ol.wixui-rich-text__text, span.wixui-rich-text__text';
            node.querySelectorAll(richTextSelector).forEach(processRichTextElement);
          }
          
          // Process text tags with text-align: start (skip wixui-rich-text__text elements)
          if (!node.className || typeof node.className !== 'string' || !node.className.includes('wixui-rich-text__text')) {
            processStartAlignedElements(node);
          }
          if (node.querySelectorAll) {
            const textTagSelector = 'p, h1, h2, h3, h4, h5, h6, ul, ol';
            node.querySelectorAll(textTagSelector).forEach(el => {
              // Skip wixui-rich-text__text elements - these are handled separately
              if (el.className && typeof el.className === 'string' && el.className.includes('wixui-rich-text__text')) {
                return;
              }
              processStartAlignedElements(el);
            });
          }
          
          // Process menu elements
          processMenuElement(node);
          if (node.querySelectorAll) {
            const menuSelector = '.wixui-horizontal-menu, .wixui-menu';
            node.querySelectorAll(menuSelector).forEach(processMenuElement);
          }
          
          // Process info-element-text elements
          processInfoElementText(node);
          if (node.querySelectorAll) {
            node.querySelectorAll('.info-element-text').forEach(processInfoElementText);
          }
          
          // Process accordion button elements
          processAccordionButton(node);
          if (node.querySelectorAll) {
            node.querySelectorAll('button[class*="AccordionContainer"]').forEach(processAccordionButton);
          }
          
          // Process wixui-vector-image elements
          processVectorImage(node);
          if (node.querySelectorAll) {
            node.querySelectorAll('.wixui-vector-image').forEach(el => {
              // Skip if element also has wixui-ignore-svg-rtl-swap class
              if (el.className && typeof el.className === 'string' && el.className.includes('wixui-ignore-svg-rtl-swap')) {
                return;
              }
              processVectorImage(el);
            });
          }
          
          // Process background media layers
          processBackgroundMedia(node);
          if (node.querySelectorAll) {
            node.querySelectorAll('[data-hook="bgLayers"]').forEach(processBackgroundMedia);
          }
          
          // Process wixui-mirror-img elements
          processMirrorImg(node);
          if (node.querySelectorAll) {
            node.querySelectorAll('.wixui-mirror-img').forEach(processMirrorImg);
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

  // Revert menu swaps when viewport goes below breakpoint
  const revertMenuSwaps = () => {
    // Find all elements that were swapped
    const swappedElements = document.querySelectorAll('[data-rtl-menu-grand-parent-swapped="true"]');
    swappedElements.forEach(el => {
      // Remove inline margin and padding styles to revert to original
      el.style.removeProperty('margin-left');
      el.style.removeProperty('margin-right');
      el.style.removeProperty('padding-left');
      el.style.removeProperty('padding-right');
      // Remove the dataset flag so it can be processed again if viewport increases
      el.removeAttribute('data-rtl-menu-grand-parent-swapped');
    });
    
    // Also clear the menu element flags
    const menuElements = document.querySelectorAll('[data-rtl-menu-processed="true"]');
    menuElements.forEach(el => {
      el.removeAttribute('data-rtl-menu-processed');
    });
  };

  // Handle viewport resize for menu breakpoint
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const isAbove = isAboveBreakpoint();
      
      if (isAbove) {
        // Viewport is above breakpoint - process menu elements
        processAllMenuElements();
      } else {
        // Viewport is below breakpoint - revert menu swaps
        revertMenuSwaps();
      }
    }, 100); // Debounce resize events
  };

  // 4. REVEAL BODY
  const revealBody = () => {
    document.querySelectorAll(dynamicSelector).forEach(processElement);
    processStyleElements();
    processAllRichTextElements(); // Process wixui-rich-text__text elements
    processAllStartAlignedElements();
    processAllMenuElements(); // Process menu elements
    processAllInfoElementText(); // Process info-element-text elements
    processAllAccordionButtons(); // Process accordion button elements
    processAllVectorImages(); // Process wixui-vector-image elements
    processAllBackgroundMedia(); // Process background media layers
    processAllMirrorImgs(); // Process wixui-mirror-img elements
    const shield = document.getElementById('rtl-load-shield');
    if (shield) shield.remove();
    
    // Add resize listener for menu breakpoint handling
    window.addEventListener('resize', handleResize);
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
