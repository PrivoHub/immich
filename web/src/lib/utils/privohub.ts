/**
 * Links out to the hosted account portal.
 *
 * The portal is a separate application on its own domain, so these links are
 * always absolute and always open in a new tab, leaving the current session
 * in place.
 *
 * `suffix` is appended to the portal root, so it can be a path (`/storage`) or
 * a query string (`?changePlan`).
 */
const PORTAL_URL = 'https://privohub.com/portal';

/**
 * The public site. Where the logo on a shared link takes a visitor who is not
 * signed in to this workspace: nothing here is theirs to go back to, and this
 * host's root is only a sign-in page they cannot use.
 */
export const SITE_URL = 'https://privohub.com';

export const portalUrl = (suffix = '') => `${PORTAL_URL}${suffix}`;

export const openPortal = (suffix = '') => {
  window.open(portalUrl(suffix), '_blank', 'noopener,noreferrer');
};
