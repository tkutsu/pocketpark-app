import { useEffect, useMemo, useState } from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import prependHttp from 'prepend-http';
import axios from 'axios';
import { FaAngleDown, FaHeart, FaRegHeart } from 'react-icons/fa';
import isEmpty from 'lodash/isEmpty';
import Carousel from 'components/Carousel';
import Map from 'components/Map';
import Comments from 'components/Comments';
import Img from 'components/Img';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import { useNoteContext } from 'shared/utilities/contextNotes';
import { useAuthContext } from 'shared/utilities/contextAuth';
import stringToInt from 'shared/utilities/stringToInt';
import { EnumType, IUserAPI, IUserResREST, XPlace } from 'shared/interfaces';
import getUrlDomain from 'shared/utilities/getUrlDomain';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const q = `query($id: ID!){
    places(filters: {id: {eq: $id}}) { data { id attributes {
      label description type hex_color services { value }
      geodata { latitude longitude }
      images { data { id attributes { url height width } } }
      fav_users { data { id } }
      processes { data { id attributes { label description urls { id value } } } }
      comments {  data { id attributes {
        createdAt text creator { data { attributes { username } } }
      } } }
    } } }
  }`;
  const { places, extraProps } =
    await getData({ q, params: { id: params?.id }, withPark: true });
  const dataProps = places?.data[0] || {};
  const _extraProps = { park: extraProps.park, places: [dataProps] };
  const notFound = isEmpty(dataProps);
  return { props: { dataProps, extraProps: _extraProps }, notFound, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const q = `{ places { data { id } } }`;
  const { places } = await getData({ q });
  const paths = places?.data
    ?.filter((o: XPlace['data']) => o?.id != null)
    ?.map((o: XPlace['data']) => ({ params: { id: o.id } }));
  return { paths, fallback: 'blocking' };
};

interface IProps {
  dataProps: XPlace['data'];
  extraProps: IExtraProps;
}
const PlacePage: NextPage<IProps> = ({ dataProps, extraProps }) => {
  const { user } = useAuthContext();
  const { addNote } = useNoteContext();
  const attr = dataProps?.attributes || {};
  const id = dataProps.id;
  const favsExcludingUser = (attr?.fav_users?.data || [])
    ?.filter(u => u?.id != null && `${u?.id}` !== `${user?.id}`)?.length || 0;
  const [faved, setFaved] = useState(false);
  const [processOpen, setProcessOpen] = useState<string | null>();
  const imgList = useMemo(() => (attr?.images?.data || []).filter(Boolean), []);

  const handleProcess = (id?: string) => () => {
    setProcessOpen(old => old === id ? null : id);
  };

  const handleFav = async () => {
    if (!navigator?.onLine) {
      addNote({ id: 'offline', text: 'You are currently offline', warning: true });
    } else {
      try {
        const numId = stringToInt(id);
        const req: IUserAPI = { fav_place: numId };
        const { data: _data }: { data: IUserResREST; } = await axios.post('/api/user/update', req);
        setFaved(_data?.fav_places?.some(f => `${f.id}` === `${id}`) || false);
      } catch (e) {
        addNote({ id: 'fav', text: 'Could not add favorite', warning: true });
      }
    }
  };

  useEffect(() => {
    setFaved(
      user?.attributes?.fav_places?.data?.some(f => `${f.id}` === `${id}`) || false);
  }, [user?.attributes?.fav_places?.data?.length, id]);

  return (
    <Map className={s.container} extra={extraProps} withPlaceMarkers
      crumb={{ label: 'Places', link: `/park/search/` }}>
      <Head>
        <title key='title'>Place: {attr?.label}</title>
      </Head>
      <div className={'title'}>{attr?.label}</div>
      {user?.id != null &&
        <div className={s.buttons}>
          <div className={c(s.favorites, faved && s.faved)} onClick={handleFav}>
            {faved ? <FaHeart className={s.icon} /> : <FaRegHeart className={s.icon} />}
            {(favsExcludingUser || 0) + (faved ? 1 : 0)}
          </div>
        </div>}
      <div className={s.content}>
        {imgList.length > 1
          ? <Carousel sliderClass={s.slider} slideClass={s.slide}>{imgList}</Carousel>
          : <div className={s.image}>
            <Img image={imgList} alt={attr.label} imgClass={s.img} />
          </div>}
        {attr?.label &&
          <div className={s.meta}>
            {attr?.description &&
              <label className={s.inputGroup}>
                <div className={s.label}>Description</div>
                <div className={c(s.input, s.textarea)}>{attr?.description}</div>
              </label>}
            {(attr?.processes?.data || []).length > 0 &&
              <div className={s.processes}>
                <div className={s.title}>Processes</div>
                {(attr?.processes?.data || []).map(o =>
                  <div key={o.id} className={c(s.process, processOpen === o.id && s.open)}>
                    <div className={s.header} onClick={handleProcess(o.id)}>
                      {o.attributes?.label}
                      <FaAngleDown className={s.arrow} />
                    </div>
                    <div className={s.section}>
                      {o.attributes?.description &&
                        <label className={s.inputGroup}>
                          <div className={s.label}>Description</div>
                          <div className={c(s.input, s.textarea)}>{o.attributes?.description}</div>
                        </label>}
                      {(o.attributes?.urls || []).filter(url => url.value).length > 0 &&
                        <label className={s.inputGroup}>
                          <div className={s.label}>Links</div>
                          <div className={s.multiple}>
                            {o.attributes?.urls?.filter(url => url.value).map(url =>
                              <a key={url.id} href={prependHttp(url.value || '')}
                                rel='noopener noreferrer' target='_blank' className={s.url}>
                                <div className={s.input}>{getUrlDomain(url.value)}</div>
                              </a>)}
                          </div>
                        </label>}
                    </div>
                  </div>)}
              </div>}
          </div>}
      </div>
      <Comments className={s.comments} comments={attr.comments?.data} id={dataProps?.id}
        type={EnumType.park} />
    </Map>
  );
};

export default PlacePage;

