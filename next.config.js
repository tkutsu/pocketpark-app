module.exports = {
  compress: false, // gzip compression done in nginx
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: ['127.0.0.1', 'admin-pocketpark.bonsa.io'],
  },
  i18n: {
    locales: ['en-US'], // all the supported locales
    defaultLocale: 'en-US', // locale to be used for non-locale prefixed paths
  }
}
