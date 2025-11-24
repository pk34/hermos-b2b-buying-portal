(function () {
  const ENVIRONMENT_B2B_API_URL = {
    local: 'http://localhost:9000',
    integration: 'https://api-b2b.integration.zone',
    staging: 'https://api-b2b.staging.zone',
    production: 'https://api-b2b.bigcommerce.com',
  };

  const BUYER_PORTAL_INJECTED_SCRIPT_CLASS = 'buyer-portal-scripts-headless';

  const headlessScriptNode = document.currentScript;
  const providedEnvironment = headlessScriptNode?.dataset?.environment;

  function getAPIBaseURL(environment) {
    const resolvedEnvironment = environment || window.B3?.setting?.environment || 'production';
    return ENVIRONMENT_B2B_API_URL[resolvedEnvironment] || ENVIRONMENT_B2B_API_URL.production;
  }

  const parseAndInsertStorefrontScripts = (storefrontScripts) => {
    const b2bScriptDocument = new DOMParser().parseFromString(storefrontScripts, 'text/html');
    const b2bScriptNodes = b2bScriptDocument.querySelectorAll('script');

    if (b2bScriptNodes.length === 0) return;

    const existingBuyerPortalScriptNodes = document.querySelectorAll(
      `script.${BUYER_PORTAL_INJECTED_SCRIPT_CLASS}`,
    );

    if (existingBuyerPortalScriptNodes.length > 0) {
      existingBuyerPortalScriptNodes.forEach((oldNode) => {
        oldNode.parentNode?.removeChild(oldNode);
      });
    }

    b2bScriptNodes.forEach((node) => {
      const scriptElement = document.createElement('script');
      [...node.attributes].forEach((attr) => {
        scriptElement.setAttribute(attr.nodeName, attr.nodeValue || '');
      });
      scriptElement.innerHTML = node.innerHTML;
      scriptElement.className = BUYER_PORTAL_INJECTED_SCRIPT_CLASS;
      document.body.appendChild(scriptElement);
    });
  };

  async function getScriptContent(originUrl) {
    const params = {
      siteUrl: originUrl,
      storeHash: headlessScriptNode?.dataset?.storehash || '',
      channelId: headlessScriptNode?.dataset?.channelid || '',
      environment: providedEnvironment,
    };

    const response = await fetch(`${getAPIBaseURL(params.environment)}/graphql`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          {
            storefrontScript(
              storeHash: "${params.storeHash}"
              channelId: ${params.channelId}
              siteUrl: "${params.siteUrl}"
            ) {
              script
              storeHash
              channelId
            }
          }`,
      }),
    });

    if (!response.ok) {
      throw new Error('network error');
    }

    const {
      data: { storefrontScript },
    } = await response.json();

    return storefrontScript.script;
  }

  (async function loadHeadlessScripts() {
    try {
      const scriptContent = await getScriptContent(window.location.origin);
      parseAndInsertStorefrontScripts(scriptContent);
    } catch (error) {
      console.error('Unexpected error during headless buyer portal initialization', error);
    }
  })();
})();
