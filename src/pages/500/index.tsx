import Map from 'components/Map';
import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FaHome } from 'react-icons/fa';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import c from 'shared/utilities/classname';
import { useNoteContext } from 'shared/utilities/contextNotes';
import { EnumScrollType } from 'shared/utilities/useScrollTo';
import s from './index.module.scss';

export const getStaticProps: GetStaticProps = async () => {
  const { extraProps } = await getData({ withPark: true });
  return { props: { extraProps }, revalidate: 1 };
};

interface IProps {
  extraProps: IExtraProps;
}
const ServerErrorPage: NextPage<IProps> = ({ extraProps }) => {
  const { addNote } = useNoteContext();
  const [firstRender, setFirstRender] = useState<boolean>(false);
  const router = useRouter();
  const originalPage = ((router.asPath || '').split('/')[1] || '').toLowerCase();
  useEffect(() => {
    const searchablePages = ['activities', 'observations', 'park', 'trips'];
    if (searchablePages.includes(originalPage)) {
      addNote({ id: 'wrong-path', text: 'Could not find page' });
      router.replace(originalPage === 'observations' ? '/' : `/${originalPage}/search`);
    } else {
      setFirstRender(true);
    }
  }, [originalPage, setFirstRender]);
  return (firstRender
    ? <Map extra={extraProps} className={s.container} scrollTo={EnumScrollType.bottom}>
      <Head>
        <title key='title'>Page not found</title>
      </Head>
      <div className={s.text}>This corner of the park is empty!</div>
      <Link href='/' scroll={false}>
        <a className={c('button', s.link)}>
          <FaHome className={s.icon} />
          Home
        </a>
      </Link>
    </Map>
    : null);
};

export default ServerErrorPage;
