import { FC } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { SWRConfig } from 'swr';
import { SWRConfigOptions } from 'shared/constants';
import { RedisUserProvider } from 'shared/utilities/contextRedisUser';
import { MapProvider } from 'shared/utilities/contextMap';
import { HintProvider } from 'shared/utilities/contextHints';
import { NoteProvider } from 'shared/utilities/contextNotes';
import { AuthProvider } from 'shared/utilities/contextAuth';
import 'shared/styles/_normalize.scss';
import 'shared/styles/_globals.scss';
import 'shared/styles/_partials.scss';

const App: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <SWRConfig value={SWRConfigOptions}>
      <NoteProvider>
        <HintProvider>
          <MapProvider>
            <RedisUserProvider>
              <AuthProvider>
                <Head>
                  <title key='title'>PocketPark</title>
                  <meta key='charset' charSet='utf-8' />
                  <meta key='viewport' name='viewport'
                    content='initial-scale=1.0, width=device-width, user-scalable=no' />
                </Head>
                <Component {...pageProps} />
              </AuthProvider>
            </RedisUserProvider>
          </MapProvider>
        </HintProvider>
      </NoteProvider>
    </SWRConfig>
  );
};

export default App;
