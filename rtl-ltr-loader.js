// RTL-LTR Loader Script
// Paste this in your site header to automatically load and cache the latest rtl-ltr.js
(function() {
  'use strict';
  
  const STORAGE_KEY = 'rtl-ltr-code';
  const VERSION_KEY = 'rtl-ltr-version';
  const REPO_OWNER = 'moranfru';
  const REPO_NAME = 'rtl-ltr';
  const BRANCH = 'main';
  const FILE_NAME = 'rtl-ltr.js';
  const CDN_URL = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}/${FILE_NAME}`;
  const RAW_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${FILE_NAME}`;
  
  // Get latest commit SHA from GitHub API
  async function getLatestVersion() {
    try {
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/branches/${BRANCH}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
      const data = await response.json();
      return data.commit.sha;
    } catch (error) {
      console.error('[RTL-LTR Loader] Failed to fetch latest version:', error);
      return null;
    }
  }
  
  // Fetch script code using commit SHA to ensure exact version
  async function fetchScriptCode(commitSha) {
    try {
      // Use commit-specific jsDelivr CDN URL first (supports CORS)
      const commitCDNUrl = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${commitSha}/${FILE_NAME}`;
      
      // Use query parameters for cache busting (no custom headers to avoid CORS preflight)
      // Include full commit SHA in query params to ensure exact version
      const cacheBuster = '?v=' + commitSha + '&t=' + Date.now();
      
      // Try commit-specific jsDelivr CDN URL first (supports CORS)
      let response = await fetch(commitCDNUrl + cacheBuster);
      let usedUrl = commitCDNUrl;
      
      if (!response.ok) {
        // Fallback to GitHub API (supports CORS, returns base64 encoded content)
        console.log('[RTL-LTR Loader] jsDelivr failed, trying GitHub API...');
        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_NAME}?ref=${commitSha}`;
        response = await fetch(apiUrl);
        usedUrl = apiUrl;
        
        if (response.ok) {
          const data = await response.json();
          // GitHub API returns base64 encoded content
          const code = atob(data.content.replace(/\s/g, ''));
          console.log('[RTL-LTR Loader] fetched code from GitHub API');
          return code;
        }
      }
      
      if (!response.ok) {
        // Last resort: try branch CDN URL
        response = await fetch(CDN_URL + '?t=' + Date.now());
        usedUrl = CDN_URL;
      }
      
      if (!response.ok) throw new Error(`Failed to fetch script: ${response.status}`);
      
      const code = await response.text();
      console.log('[RTL-LTR Loader] fetched code from:', usedUrl);
      return code;
    } catch (error) {
      console.error('[RTL-LTR Loader] Failed to fetch script code:', error);
      return null;
    }
  }
  
  // Verify code matches expected version by checking for version string
  function verifyCodeVersion(code, expectedCommitSha) {
    if (!code || code.length === 0) return false;
    
    // Check if code contains the commit SHA (some files might have it)
    // Or check for version pattern like "v7" in console.log
    // For now, just verify code is not empty and seems valid
    const hasValidStructure = code.includes('function') || code.includes('=>');
    
    if (!hasValidStructure) {
      console.warn('[RTL-LTR Loader] Fetched code does not appear to be valid JavaScript');
      return false;
    }
    
    return true;
  }
  
  // Execute script code
  function executeCode(code) {
    try {
      const script = document.createElement('script');
      script.textContent = code;
      document.head.appendChild(script);
      document.head.removeChild(script);
    } catch (error) {
      console.error('[RTL-LTR Loader] Failed to execute script:', error);
    }
  }
  
  // Main loader function
  async function loadScript() {
    const storedCode = localStorage.getItem(STORAGE_KEY);
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    if (storedCode && storedVersion) {
      console.log('[RTL-LTR Loader] loaded from storage');
      // Execute cached code immediately (faster)
      executeCode(storedCode);
      
      // In parallel, check for newer version
      getLatestVersion().then(async latestVersion => {
        if (latestVersion && latestVersion !== storedVersion) {
          console.log('[RTL-LTR Loader] new version found (' + latestVersion.substring(0, 7) + '), fetching latest code...');
          // Fetch and update localStorage with latest version using commit SHA
          const latestCode = await fetchScriptCode(latestVersion);
          
          // Verify code is valid before saving
          if (latestCode && latestCode.length > 0 && verifyCodeVersion(latestCode, latestVersion)) {
            // Clear old storage first to ensure clean update
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(VERSION_KEY);
            
            // Save new version
            localStorage.setItem(STORAGE_KEY, latestCode);
            localStorage.setItem(VERSION_KEY, latestVersion);
            
            // Verify both were saved correctly
            const savedCode = localStorage.getItem(STORAGE_KEY);
            const savedVersion = localStorage.getItem(VERSION_KEY);
            
            if (savedCode === latestCode && savedVersion === latestVersion && savedCode.length > 0) {
              console.log('[RTL-LTR Loader] new version code saved successfully (' + savedCode.length + ' chars), refresh page to get latest code version');
            } else {
              console.error('[RTL-LTR Loader] failed to save new version to localStorage. Code length:', savedCode ? savedCode.length : 0);
            }
          } else {
            console.error('[RTL-LTR Loader] failed to fetch new version code or code verification failed. Code length:', latestCode ? latestCode.length : 0);
          }
        }
      }).catch(error => {
        console.error('[RTL-LTR Loader] error checking for new version:', error);
      });
    } else {
      console.log('[RTL-LTR Loader] no storage');
      // No storage, fetch latest version
      const latestVersion = await getLatestVersion();
      const latestCode = latestVersion ? await fetchScriptCode(latestVersion) : null;
      
      if (latestCode && latestVersion && verifyCodeVersion(latestCode, latestVersion)) {
        // Execute immediately
        executeCode(latestCode);
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, latestCode);
        localStorage.setItem(VERSION_KEY, latestVersion);
        console.log('[RTL-LTR Loader] fetched and saved latest version (' + latestVersion.substring(0, 7) + ', ' + latestCode.length + ' chars)');
      } else {
        console.error('[RTL-LTR Loader] failed to load script. Code valid:', latestCode ? verifyCodeVersion(latestCode, latestVersion) : false);
      }
    }
  }
  
  // Start loading when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadScript);
  } else {
    loadScript();
  }
})();

