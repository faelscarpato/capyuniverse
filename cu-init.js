/*
 * CapyUniverse Initializer
 *
 * This script normalizes the environment for all CapyUniverse
 * pages. When loaded, it performs the following actions:
 *  1. Sets a `data-theme="capyuniverse"` attribute on the
 *     `<html>` element. This attribute is consumed by the
 *     shared stylesheet (cu-style.css) to activate the dark,
 *     cosmic theme used by CapyIMG and other apps.
 *  2. Removes the `dark` class from the `<html>` element if
 *     present. Many of the legacy pages relied on the `dark`
 *     class provided by Tailwind for dark mode. Our theme
 *     replaces this mechanism to avoid conflicts.
 *  3. Dynamically loads the shared stylesheet `cu-style.css` if
 *     it has not already been added to the page. This allows us
 *     to propagate consistent styling across all Capy tools
 *     without manually editing every HTML file.
 *  4. Cleans up any Google Fonts link that references the Syne
 *     typeface. The CapyUniverse design now relies solely on
 *     Inter and JetBrains Mono, and the `.font-syne` class is
 *     overridden by cu-style.css to fall back to Inter. By
 *     stripping the Syne weights from the font URL we avoid
 *     downloading unnecessary assets.
 */

(() => {
  // Ensure this code runs after the DOM has at least parsed the head.
  try {
    const doc = document;
    const html = doc.documentElement;
    if (html) {
      // Apply the CapyUniverse theme attribute.
      html.setAttribute('data-theme', 'capyuniverse');
      // Remove the `dark` class if it exists to prevent Tailwind from
      // conflicting with our custom styles.
      html.classList.remove('dark');
    }

    // Inject the shared stylesheet if not already present.
    const existing = doc.querySelector('link[href$="cu-style.css"]');
    if (!existing) {
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'cu-style.css';
      // Append the stylesheet to the end of the <head> so that it
      // overrides inline styles defined earlier in the document.
      doc.head.appendChild(link);
    }

    // Remove references to the Syne typeface from Google Fonts links.
    const fontLinks = doc.querySelectorAll('link[href*="fonts.googleapis.com"]');
    fontLinks.forEach(link => {
      if (link.href.includes('family=Syne')) {
        // Strip the Syne family definition from the URL. This regex
        // removes patterns like `&family=Syne:wght@700;800` regardless
        // of its position. If the Syne family appears at the very
        // beginning (after the ?family=) the preceding & will not
        // exist so we handle both cases.
        let newHref = link.href
          .replace(/&?family=Syne:[^&]*/g, '')
          // Remove any trailing ampersand left behind
          .replace(/&&/g, '&')
          .replace(/\?&/, '?')
          .replace(/&$/, '');
        link.href = newHref;
      }
    });

    // Propagate progressive image hints site-wide.
    //  - Add loading="lazy" to non-critical images (outside headers)
    //  - Add decoding="async" where absent
    const applyProgressiveImages = () => {
      const images = Array.from(doc.querySelectorAll('img'));
      images.forEach(img => {
        const inHeader = img.closest('header, .header, .cu-header');
        if (!inHeader && !img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
        if (!img.hasAttribute('decoding')) {
          img.setAttribute('decoding', 'async');
        }
      });
    };

    if (doc.readyState === 'complete' || doc.readyState === 'interactive') {
      applyProgressiveImages();
    } else {
      doc.addEventListener('DOMContentLoaded', applyProgressiveImages, { once: true });
    }
  } catch (err) {
    // Fail silently so that the absence of this initializer never
    // breaks the host page. Errors will be logged for debugging.
    console.error('cu-init.js error:', err);
  }
})();