import { logoManager, type LogoSet } from '@immich/ui';

/**
 * Point the component library's logo at our own mark.
 *
 * Swapping the `<Logo>` call sites we own is not enough, because the library
 * renders the logo itself: `Modal` shows `<Logo variant="icon">` in its header
 * whenever `icon` is not a string, and `icon` defaults to `true`. Most modals
 * never pass one, so the stock mark appears on screens that hold no reference
 * to a logo at all and no grep of this repo would find them.
 *
 * Every `<Logo>` in the library resolves its `src` through `logoManager`, so
 * one override at boot covers those modals and anything upstream adds later.
 *
 * Only `icon` renders today. The lockups are still supplied because the type
 * demands a value for each variant, and a bare shield in a slot shaped for a
 * wordmark would be worse than wrong, it would look broken.
 *
 * The one thing this cannot reach is the `alt` text, which the library
 * hardcodes to "Immich logo".
 */
export const PRIVOHUB_LOGOS: LogoSet = {
  stacked: {
    light: '/logo-stacked-light.svg',
    dark: '/logo-stacked-dark.svg',
  },
  unstacked: {
    light: '/logo-inline-light.svg',
    dark: '/logo-inline-dark.svg',
  },
  // FUTO is Immich's sponsor lockup and has no counterpart here, so it takes
  // the ordinary stacked mark rather than a made-up variant.
  stacked_futo: {
    light: '/logo-stacked-light.svg',
    dark: '/logo-stacked-dark.svg',
  },
  icon: '/logo.svg',
};

export const applyPrivoHubLogos = () => logoManager.setLogo(PRIVOHUB_LOGOS);
