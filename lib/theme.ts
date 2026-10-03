export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/**
 * Runs synchronously in <head> before first paint, so there is no theme flash.
 *
 * Policy: an explicit choice stored by the toggle always wins. Without one,
 * new visitors get the light theme (the site's default identity).
 *
 * It also adds the `js` class, which enables progressive enhancements such
 * as the section reveal animation (content stays visible without JS).
 */
export const THEME_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='dark'){d.classList.add('dark');}}catch(e){}})();`;
