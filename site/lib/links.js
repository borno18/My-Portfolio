export function opensExternalTab(href, ...siteUrls) {
  if (typeof href !== 'string' || !/^https?:\/\//i.test(href) || !URL.canParse(href)) return false;
  const { origin } = new URL(href);
  return !siteUrls.some(url => url && new URL(url).origin === origin);
}
