/**
 * Execute from console of site's dashboard for context/auth
 * Adding a new custom script object to the site's embeds
 * Set the injected_script_code and injected_script_name variables to the desired script code and name

 * 
 */
(async () => {
    try {
        const INNJECTED_SCRIPT_CODE="<script>\n(function() {\n    const targetId = \\\"WIX_ADS\\\";\n    const siteRootSelector = \\\"div#site-root\\\";\n\n    const clean = () => {\n        const ad = document.getElementById(targetId);\n        if (ad) ad.remove();\n\n        const root = document.querySelector(siteRootSelector);\n        if (root) {\n            root.style.setProperty(\\\"--wix-ads-height\\\", \\\"0px\\\", \\\"important\\\");\n            root.style.setProperty(\\\"margin-top\\\", \\\"0px\\\", \\\"important\\\");\n            root.style.setProperty(\\\"top\\\", \\\"0px\\\", \\\"important\\\");\n        }\n    };\n\n    const observer = new MutationObserver(() => {\n        clean();\n    });\n\n    observer.observe(document.documentElement, {\n        childList: true,\n        subtree: true,\n        attributes: true,\n        attributeFilter: [\\\"style\\\", \\\"class\\\"]\n    });\n\n    const style = document.createElement(\\\"style\\\");\n    style.innerHTML = `#${targetId} { display: none !important; height: 0 !important; } ${siteRootSelector} { --wix-ads-height: 0px !important; margin-top: 0px !important; top: 0px !important; }`;\n    document.documentElement.appendChild(style);\n\n    window.addEventListener(\\\"DOMContentLoaded\\\", clean);\n    clean();\n})();\n<\/script>";
        const INJECTED_SCRIPT_NAME = "WIX_ADS_REMOVER";
        // 1. Find the link in the DOM and extract the dashboard GUID
        const anchor = document.querySelector('a[href^="/dashboard/"]');
        if (!anchor) throw new Error("Could not find a Wix dashboard link in the DOM.");

        const href = anchor.getAttribute('href');
        const dashboardGuidMatch = href.match(/\/dashboard\/([a-fA-F0-9-]{36})/);
        if (!dashboardGuidMatch) throw new Error("Could not extract GUID from dashboard link.");
        
        const dashboardGuid = dashboardGuidMatch[1];
        console.log(`Step 1: Extracted Dashboard GUID: ${dashboardGuid}`);

        // 2. Fetch the actual siteId from the Wix internal API
        const getUrl = `https://manage.wix.com/_api/wix-html-live-site-data-webapp/html_embeds/${dashboardGuid}`;
        const getResponse = await fetch(getUrl);
        if (!getResponse.ok) throw new Error(`GET request failed: ${getResponse.status}`);
        
        const getData = await getResponse.json();
        const siteId = getData.siteId;
        
        if (!siteId) throw new Error("API response did not contain a siteId.");
        console.log(`Step 2: Found Site ID: ${siteId}`);

        // 3. Generate a new GUID for the new embed entry
        const newGuid = crypto.randomUUID();
        console.log(`Step 3: Generated New Embed GUID: ${newGuid}`);

        // 4. Execute the POST request to save the new custom code
        const postUrl = `https://manage.wix.com/_api/wix-html-live-site-data-webapp/html_embeds/${siteId}`;
        
        // Note: We use the existing XSRF token from your cookies automatically via 'include' credentials,
        // but it's best to grab it from the cookie if the header is strictly required.
        const xsrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || "";

        const postResponse = await fetch(postUrl, {
            "method": "POST",
            "headers": {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
                "x-xsrf-token": xsrfToken, // Dynamically pulled from your browser cookies
            },
            "body": JSON.stringify({
                "content": {
                    "type": "custom",
                    "html": INNJECTED_SCRIPT_CODE,
                    "category": {
                        "enumClass": "com.wixpress.live.site.data.types.CustomContentCategory",
                        "value": "ESSENTIAL"
                    }
                },
                "enabled": true,
                "name": INJECTED_SCRIPT_NAME,
                "position": "head",
                "pages": null,
                "loadOnce": true,
                "embedType": "custom",
                "siteId": siteId,
                "id": newGuid
            }),
            "credentials": "include"
        });

        if (postResponse.ok) {
            console.log("%cSuccess! New code embed added.", "color: green; font-weight: bold;");
            const result = await postResponse.json();
            console.log(result);
        } else {
            const errorText = await postResponse.text();
            console.error(`POST failed with status ${postResponse.status}:`, errorText);
        }

    } catch (err) {
        console.error("Workflow failed:", err.message);
    }
})();