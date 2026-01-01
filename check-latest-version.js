(function() {
  'use strict';
  
  // Configuration
  const REPO_OWNER = 'moranfru';
  const REPO_NAME = 'rtl-ltr';
  const BRANCH = 'main';
  const FILE_NAME = 'rtl-ltr.js';
  
  // Get current script's commit SHA from data attribute or URL
  function getCurrentVersion() {
    const scripts = document.querySelectorAll('script[src*="rtl-ltr.js"]');
    if (scripts.length === 0) return null;
    
    const script = scripts[scripts.length - 1];
    // Check if SHA is in the URL (commit-specific URL)
    const urlMatch = script.src.match(/\/rtl-ltr\/([a-f0-9]{7,40})\/rtl-ltr\.js/);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // Check data attribute if set
    return script.dataset.commitSha || null;
  }
  
  // Fetch latest commit SHA from GitHub API
  async function getLatestVersion() {
    try {
      // Method 1: Get latest commit from branch
      const branchUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}`;
      const branchResponse = await fetch(branchUrl);
      
      if (!branchResponse.ok) {
        throw new Error(`GitHub API error: ${branchResponse.status}`);
      }
      
      const branchData = await branchResponse.json();
      return branchData.commit.sha;
    } catch (error) {
      console.error('Error fetching latest version:', error);
      // Fallback: Try to get from commits API
      try {
        const commitsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${BRANCH}`;
        const commitsResponse = await fetch(commitsUrl);
        if (commitsResponse.ok) {
          const commitData = await commitsResponse.json();
          return commitData.sha;
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
      return null;
    }
  }
  
  // Compare versions
  function compareVersions(currentSha, latestSha) {
    if (!currentSha || !latestSha) return null;
    
    // Compare full SHA or short SHA
    const currentShort = currentSha.substring(0, 7);
    const latestShort = latestSha.substring(0, 7);
    
    return {
      isLatest: currentSha === latestSha || currentShort === latestShort,
      current: currentSha,
      latest: latestSha,
      currentShort: currentShort,
      latestShort: latestShort
    };
  }
  
  // Main function
  async function checkVersion() {
    const currentVersion = getCurrentVersion();
    const latestVersion = await getLatestVersion();
    
    if (!latestVersion) {
      console.warn('Could not determine latest version');
      return;
    }
    
    if (!currentVersion) {
      console.log('Latest version:', latestVersion.substring(0, 7));
      console.log('Current script URL does not contain commit SHA');
      return;
    }
    
    const comparison = compareVersions(currentVersion, latestVersion);
    
    if (comparison && !comparison.isLatest) {
      console.warn('⚠️ New version available!');
      console.log('Current:', comparison.currentShort);
      console.log('Latest:', comparison.latestShort);
      
      // Dispatch custom event for other scripts to listen to
      window.dispatchEvent(new CustomEvent('rtl-ltr-version-update', {
        detail: {
          current: comparison.current,
          latest: comparison.latest,
          currentShort: comparison.currentShort,
          latestShort: comparison.latestShort
        }
      }));
      
      // Optionally reload with latest version
      // Uncomment the line below to auto-reload with latest version
      // window.location.reload();
    } else {
      console.log('✅ Running latest version:', comparison.latestShort);
    }
  }
  
  // Run check when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkVersion);
  } else {
    checkVersion();
  }
  
  // Expose function globally for manual checking
  window.checkRtlLtrVersion = checkVersion;
})();

