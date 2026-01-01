// Inline version checker - add this to your HTML <head>
(function() {
  const REPO = 'moranfru/rtl-ltr';
  const BRANCH = 'main';
  
  fetch(`https://api.github.com/repos/${REPO}/branches/${BRANCH}`)
    .then(r => r.json())
    .then(data => {
      const latestSha = data.commit.sha.substring(0, 7);
      const scripts = document.querySelectorAll('script[src*="rtl-ltr.js"]');
      const currentScript = scripts[scripts.length - 1];
      const urlMatch = currentScript?.src.match(/\/([a-f0-9]{7,40})\/rtl-ltr\.js/);
      
      if (urlMatch) {
        const currentSha = urlMatch[1].substring(0, 7);
        if (currentSha !== latestSha) {
          console.warn(`⚠️ New version available! Current: ${currentSha}, Latest: ${latestSha}`);
        } else {
          console.log(`✅ Latest version: ${latestSha}`);
        }
      } else {
        console.log(`Latest version: ${latestSha} (using branch URL)`);
      }
    })
    .catch(err => console.error('Version check failed:', err));
})();

