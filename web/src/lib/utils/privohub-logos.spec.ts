import { applyPrivoHubLogos, PRIVOHUB_LOGOS } from '$lib/utils/privohub-logos';
import { logoManager, Theme } from '@immich/ui';

const VARIANTS = ['icon', 'logo', 'inline', 'stacked', 'stacked-futo'] as const;

describe('privohub logos', () => {
  beforeEach(() => {
    logoManager.resetLogos();
  });

  // The stock assets are bundled and resolve to inlined data URIs, so the only
  // thing worth asserting about them is that they are not ours.
  it('serves something other than our mark until the override is applied', () => {
    for (const variant of VARIANTS) {
      expect(logoManager.getLogo(variant, Theme.Light)).not.toMatch(/^\/logo/);
    }
  });

  // The variant a Modal header draws for itself, which is why this one matters
  // most: no modal in the app asks for a logo, so nothing here would reveal a
  // regression except this.
  it('overrides the icon both themes resolve to', () => {
    applyPrivoHubLogos();

    expect(logoManager.getLogo('icon', Theme.Light)).toBe('/logo.svg');
    expect(logoManager.getLogo('icon', Theme.Dark)).toBe('/logo.svg');
    expect(logoManager.getLogo('logo', Theme.Light)).toBe('/logo.svg');
  });

  it('overrides every remaining variant per theme', () => {
    applyPrivoHubLogos();

    expect(logoManager.getLogo('inline', Theme.Light)).toBe(PRIVOHUB_LOGOS.unstacked.light);
    expect(logoManager.getLogo('inline', Theme.Dark)).toBe(PRIVOHUB_LOGOS.unstacked.dark);
    expect(logoManager.getLogo('stacked', Theme.Light)).toBe(PRIVOHUB_LOGOS.stacked.light);
    expect(logoManager.getLogo('stacked', Theme.Dark)).toBe(PRIVOHUB_LOGOS.stacked.dark);
    expect(logoManager.getLogo('stacked-futo', Theme.Light)).toBe(PRIVOHUB_LOGOS.stacked_futo.light);
    expect(logoManager.getLogo('stacked-futo', Theme.Dark)).toBe(PRIVOHUB_LOGOS.stacked_futo.dark);
  });

  it('leaves no variant on a bundled asset', () => {
    applyPrivoHubLogos();

    for (const variant of VARIANTS) {
      for (const theme of [Theme.Light, Theme.Dark]) {
        expect(logoManager.getLogo(variant, theme)).toMatch(/^\/logo[\w-]*\.svg$/);
      }
    }
  });
});
