import { isProduction } from 'shared/utilities/isAssertions';
import { APIRoutes } from 'shared/utilities/useSWR';
import { PublicConfiguration, BareFetcher, ProviderConfiguration, Cache } from 'swr/dist/types';

const constants = {
  URL: process.env.NEXT_PUBLIC_URL,
  MAP: {
    COPYRIGHT: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    TILES: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  STRAPI: {
    API: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1337',
    JWT: ({ remove }: { remove?: boolean; }) => ({
      httpOnly: true,
      secure: isProduction(),
      maxAge: remove ? 0 : 30 * 24 * 60 * 60,
      expires: remove ? new Date(0) : undefined,
      path: '/',
    }),
  },
  REDIS: {
    URL: process.env.NEXT_PUBLIC_REDIS_URL || 'http://127.0.0.1:3002',
    EVENT: process.env.NEXT_PUBLIC_REDIS_USER_GEO_EVENT || 'user_geo',
    CHANNEL: process.env.NEXT_PUBLIC_REDIS_USER_GEO_CHANNEL || 'users_geo',
  },
};

export const imgCompressConfig = {
  fileType: 'image/jpeg',
  maxSizeMB: 0.75,
  maxWidthOrHeight: 1200,
  useWebWorker: true
};

type IconfigSWR =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Partial<PublicConfiguration<any, any, BareFetcher<any>>>
    & Partial<ProviderConfiguration>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    & { provider?: ((cache: Readonly<Cache<any>>) => Cache<any>) | undefined; })
  | undefined;

export const SWRConfigOptions: IconfigSWR = {
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    if (error.status === 404) return; // Never retry on 404.
    if (key === APIRoutes.me) return; // Never retry for a specific key.
    if (retryCount >= 10) return; // Only retry up to 10 times.
    setTimeout(() => revalidate({ retryCount }), 5000); // Retry after 5 seconds.
  }
};

export default constants;
