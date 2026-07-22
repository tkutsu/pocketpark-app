import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import debounce from 'lodash/debounce';
import { FaSearch } from 'react-icons/fa';
import FacetList, { IFacetSel } from 'components/Facets/FacetList';
import Card from 'components/Card';
import Results from 'components/Results';
import Map from 'components/Map';
import FacetItem from 'components/Facets/FacetItem';
import { useAuthContext } from 'shared/utilities/contextAuth';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import { EnumXPlacetype, XPlace } from 'shared/interfaces';
import s from './index.module.scss';

export const getStaticProps: GetStaticProps = async () => {
  const { extraProps } = await getData({ withPark: true });
  return { props: { extraProps }, revalidate: 1 };
};

interface IProps { extraProps: IExtraProps; }
const SearchPage: NextPage<IProps> = ({ extraProps }) => {
  const { park, places = [] } = extraProps;
  const { user } = useAuthContext();
  const [query, setQuery] = useState('');
  const [selectedFav, setSelectedFav] = useState<undefined | boolean>();
  const [selectedType, setSelectedType] = useState<EnumXPlacetype | undefined>();
  const [queryPlaces, setQueryPlaces] = useState(places);
  const result = useMemo(() => queryPlaces
    .filter(o => selectedType == null || o.attributes?.type === selectedType)
    .filter(o => user?.id == null || !selectedFav ||
      o.attributes?.fav_users?.data?.some(u => `${u.id}` === `${user.id}`)),
    [queryPlaces, selectedFav, selectedType, user?.id]);

  const hasFavs = user?.id != null &&
    result.some(o => o.attributes?.fav_users?.data?.some(u => `${u.id}` === `${user.id}`));

  const isFav = (o: XPlace['data']) => user?.id != null &&
    o.attributes?.fav_users?.data?.some(u => `${u.id}` === `${user.id}`);

  const updateQueryPlacesDebounced = useCallback(debounce((q?: string) => {
    const _places = places
      .filter(t => (t.attributes?.label || '').toLowerCase().includes((q || '').toLowerCase()));
    setQueryPlaces(_places);
  }, 500), [setQueryPlaces]);

  const handleQuery = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.currentTarget.value);
    updateQueryPlacesDebounced(e.currentTarget.value);
  };

  const handleType = (t?: EnumXPlacetype) => () =>
    setSelectedType(selectedType === t ? undefined : t);

  const getResPerFacet = (t?: EnumXPlacetype) =>
    queryPlaces.filter(o => o?.attributes?.type === t).length;

  const handleSelectFav = () => setSelectedFav(old => old ? undefined : true);

  const facetSel: IFacetSel[] = [
    hasFavs ? { label: 'favorites', selected: selectedFav, isBoolean: true } : {},
    { label: 'type', selected: selectedType },
  ];

  return (
    <Map extra={{ park, places: result }} withPlaceMarkers className={s.container}>
      <Head>
        <title key='title'>Discover Places</title>
      </Head>
      <div className={'title'}>Discover Places</div>
      <div className={s.search}>
        <div className={s.query}>
          <FaSearch className={s.searchIcon} />
          <input className={s.qInput} onChange={handleQuery} value={query} placeholder='search' />
        </div>
        <FacetList facetSel={facetSel}>
          {hasFavs &&
            <div className={s.facetList}>
              <FacetItem onClick={handleSelectFav} selected={selectedFav} label='favorites'
                isBoolean total={result.filter(o => o.attributes?.fav_users?.data
                  ?.some(u => `${u.id}` === `${user.id}`)).length} />
            </div>}
          <div className={s.facetList}>
            <FacetItem onClick={handleType(EnumXPlacetype.point)} label={EnumXPlacetype.point}
              total={getResPerFacet(EnumXPlacetype.point)}
              selected={selectedType === EnumXPlacetype.point} />
            <FacetItem onClick={handleType(EnumXPlacetype.path)} label={EnumXPlacetype.path}
              total={getResPerFacet(EnumXPlacetype.path)}
              selected={selectedType === EnumXPlacetype.path} />
            <FacetItem onClick={handleType(EnumXPlacetype.area)} label={EnumXPlacetype.area}
              total={getResPerFacet(EnumXPlacetype.area)}
              selected={selectedType === EnumXPlacetype.area} />
          </div>
        </FacetList>
      </div>
      <Results> {result.map(r =>
        <Card key={r.id} image={r.attributes?.images?.data} link={`/park/${r.id}`}
          text={r.attributes?.label} fav={isFav(r)} />)}
      </Results>
    </Map>
  );
};

export default SearchPage;
