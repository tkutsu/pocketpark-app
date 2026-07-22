const getUrlDomain = (url?: string) => (url || '')
  .replace('https://', '').replace('http://', '').replace('www.', '')
  .split('.')[0];

export default getUrlDomain;
