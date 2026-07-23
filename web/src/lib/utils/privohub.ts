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

export const portalUrl = (suffix = '') => `${PORTAL_URL}${suffix}`;

export const openPortal = (suffix = '') => {
  window.open(portalUrl(suffix), '_blank', 'noopener,noreferrer');
};
