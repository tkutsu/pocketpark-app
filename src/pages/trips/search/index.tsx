import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';
import { FaSearch } from 'react-icons/fa';
import Results from 'components/Results';
import FacetList, { IFacetSel } from 'components/Facets/FacetList';
import Card from 'components/Card';
import Map from 'components/Map';
import FacetItem from 'components/Facets/FacetItem';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import { useAuthContext } from 'shared/utilities/contextAuth';
import { XTrip } from 'shared/interfaces';
import s from './index.module.scss';

export const getServerSideProps: GetServerSideProps = async () => {
  const q = `{
    trips { data { id attributes {
      label description featured
      image { data { id attributes { url height width } } }
      fav_users { data { id } }
      creator { data { id } }
      path(pagination: { limit:1 }) {latitude longitude}
    } } }
  }`;
  const { trips, extraProps } = await getData({ q, withPark: true });
  const dataProps = trips?.data || [];
  const notFound = isEmpty(dataProps);
  return { props: { dataProps, extraProps }, notFound };
};

interface IProps {
  dataProps: XTrip['data'][];
  extraProps: IExtraProps;
}
const SearchPage: NextPage<IProps> = ({ dataProps, extraProps }) => {
  const { user } = useAuthContext();
  const [query, setQuery] = useState('');
  const [selectFav, setSelectedFav] = useState<undefined | boolean>();
  const [selectCreated, setSelectedCreated] = useState<undefined | boolean>();
  const [isFeatured, setIsFeatured] = useState<boolean | undefined>();
  const [queryTrips, setQueryTrips] = useState(dataProps);
  const result = useMemo(() => queryTrips
    .filter(o => isFeatured == null || o.attributes?.featured === isFeatured)
    .filter(o => user?.id == null || !selectFav ||
      o.attributes?.fav_users?.data?.some(u => `${u.id}` === `${user.id}`))
    .filter(o => user?.id == null || !selectCreated ||
      `${o.attributes?.creator?.data?.id}` === `${user.id}`),
    [queryTrips, isFeatured, selectFav, selectCreated, user?.id]);

  const hasCreated = user?.id != null &&
    result.some(o => `${o.attributes?.creator?.data?.id}` === `${user.id}`);
  const hasFavs = user?.id != null &&
    result.some(o => o.attributes?.fav_users?.data?.some(u => `${u.id}` === `${user.id}`));

  const isFav = (o: XTrip['data']) => user?.id != null &&
    o.attributes?.fav_users?.data?.some(u => `${u.id}` === `${user.id}`);

  const updateQueryTripsDebounced = useCallback(debounce((q?: string) => {
    const trips = dataProps
      .filter(t => (t.attributes?.label || '').toLowerCase().includes((q || '').toLowerCase()));
    setQueryTrips(trips);
  }, 500), [setQueryTrips]);

  const handleQuery = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.currentTarget.value);
    updateQueryTripsDebounced(e.currentTarget.value);
  };

  const handleFeatured = (featured?: boolean) => () =>
    setIsFeatured(isFeatured === featured ? undefined : featured);

  const getResPerFacet = (featured?: boolean) =>
    queryTrips.filter(o => o?.attributes?.featured === featured).length;

  const getType = (featured?: boolean) =>
    featured == null ? undefined : (featured ? 'park tours' : 'user trips');

  const handleSelectFav = () => setSelectedFav(old => old ? undefined : true);
  const handleSelectCreated = () => setSelectedCreated(old => old ? undefined : true);

  const facetSel: IFacetSel[] = [
    hasFavs ? { label: 'favorites', selected: selectFav, isBoolean: true } : {},
    hasCreated ? { label: 'created', selected: selectCreated, isBoolean: true } : {},
    { label: 'type', selected: getType(isFeatured) },
  ];

  return (
    <Map trips={result} extra={extraProps} className={s.container}>
      <Head>
        <title key='title'>Discover Trips</title>
      </Head>
      <div className={'title'}>Discover Trips</div>
      <div className={s.search}>
        <div className={s.query}>
          <FaSearch className={s.searchIcon} />
          <input className={s.qInput} onChange={handleQuery} value={query} placeholder='search' />
        </div>
        <FacetList facetSel={facetSel}>
          {hasFavs &&
            <div className={s.facetList}>
              <FacetItem onClick={handleSelectFav} selected={selectFav} label='favorites'
                isBoolean total={result.filter(o => o.attributes?.fav_users?.data
                  ?.some(u => `${u.id}` === `${user.id}`)).length} />
            </div>}
          {hasCreated &&
            <div className={s.facetList}>
              <FacetItem onClick={handleSelectCreated} selected={selectCreated} label='created'
                isBoolean total={result
                  .filter(o => `${o.attributes?.creator?.data?.id}` === `${user.id}`)
                  .length} />
            </div>}
          <div className={s.facetList}>
            {getResPerFacet(true) > 0 &&
              <FacetItem onClick={handleFeatured(true)} label={getType(true)}
                selected={isFeatured === true} total={getResPerFacet(true)} />}
            {getResPerFacet(false) > 0 &&
              <FacetItem onClick={handleFeatured(false)} label={getType(false)}
                selected={isFeatured === false} total={getResPerFacet(false)} />}
          </div>
        </FacetList>
      </div>
      <Results> {result.map(r =>
        <Card key={r.id} image={r.attributes?.image?.data} link={`/trips/${r.id}`}
          text={r.attributes?.label} fav={isFav(r)} />)}
      </Results>
    </Map>
  );
};

export default SearchPage;
