import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import isEmpty from 'lodash/isEmpty';
import debounce from 'lodash/debounce';
import { FaSearch } from 'react-icons/fa';
import FacetList, { IFacetSel } from 'components/Facets/FacetList';
import Card from 'components/Card';
import Results from 'components/Results';
import Map from 'components/Map';
import FacetItem from 'components/Facets/FacetItem';
import { useAuthContext } from 'shared/utilities/contextAuth';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import { EnumType, XMetadata, XObservation, XTaxon } from 'shared/interfaces';
import s from './index.module.scss';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const q = `query($type: String!){
    observations(filters: {taxon: {type: {eq: $type}}}) {
    	data { id attributes {
        label description
        position { latitude longitude }
        image { data { id attributes { url height width } } }
        taxon { data { id attributes { type } } }
        meta_values { value metadatum { data { id } } }
        fav_users { data { id } }
        creator { data { id } }
      } } }
    taxons(filters: {type: {eq: $type}}) { data { id attributes {
      label species description
      metadata { data { id } }
      meta_values { value metadatum { data { id } } }
    } } }
    metadata { data { id attributes {
      label datatype description
      icon { data { id } }
    } } }
  }`;
  const { observations, taxons, metadata, extraProps } =
    await getData({ q, params: { type: params?.type }, withPark: true });
  const _obs: XObservation['data'][] = observations?.data || [];
  const _taxons: XTaxon['data'][] = taxons?.data || [];
  const _meta: XMetadata['data'][] = metadata?.data || [];
  const meta = _meta.filter(t => t.id != null && _obs.some(o =>
    o.attributes?.meta_values?.some(v => v.metadatum?.data?.id === t?.id)));
  const notFound = isEmpty(_obs);
  return {
    props: { observations: _obs, taxons: _taxons, extraProps, meta, type: params?.type },
    notFound
  };
};

// export const getStaticPaths: GetStaticPaths = async () => {
//   const q = `{ taxons { data { attributes { type } } } }`;
//   const { taxons } = await getData({ q });
//   const paths = taxons?.data
//     ?.map((o: XTaxon['data']) => o?.attributes?.type)
//     ?.filter((o: string, ind: number, self: string[]) => o != null && self.indexOf(o) === ind)
//     ?.map((o: string) => ({ params: { type: o } }));
//   return { paths, fallback: 'blocking' };
// };

interface IProps {
  observations: XObservation['data'][];
  taxons: XTaxon['data'][];
  meta: XMetadata['data'][];
  type: EnumType.animals | EnumType.plants;
  extraProps: IExtraProps;
}
const ObservationSearchPage: NextPage<IProps> = ({
  observations, taxons, meta, extraProps, type
}) => {
  const { user } = useAuthContext();
  const [query, setQuery] = useState('');
  const [facetObs, setFacetObs] = useState(observations);
  const [queryObs, setQueryObs] = useState(observations);
  const [taxonObs, setTaxonObs] = useState(observations);
  const [selectFav, setSelectedFav] = useState<undefined | boolean>();
  const [selectCreated, setSelectedCreated] = useState<undefined | boolean>();
  const [selectedFacets, setSelectedFacets] = useState<{ [id: string]: string[]; }>({});
  const [selTaxonId, setSelTaxonId] = useState<string>();
  const selTaxonLabel = useMemo(() =>
    taxons.find(t => t.id === selTaxonId)?.attributes?.label, [selTaxonId]);

  const result = useMemo(() => facetObs
    .filter(o => queryObs.some(qo => qo.id === o.id) && taxonObs.some(to => to.id === o.id))
    .filter(o => user?.id == null || !selectFav ||
      o.attributes?.fav_users?.data?.some(u => `${u.id}` === `${user.id}`))
    .filter(o => user?.id == null || !selectCreated ||
      `${o.attributes?.creator?.data?.id}` === `${user.id}`),
    [facetObs, queryObs, taxonObs, user?.id, selectCreated, selectFav]);

  const hasCreated = user?.id != null &&
    result.some(o => `${o.attributes?.creator?.data?.id}` === `${user.id}`);
  const hasFavs = user?.id != null &&
    result.some(o => o.attributes?.fav_users?.data?.some(u => `${u.id}` === `${user.id}`));

  const isFav = (o: XObservation['data']) => user?.id != null &&
    o.attributes?.fav_users?.data?.some(u => `${u.id}` === `${user.id}`);

  const handleFacetClick = (id: string, value?: string) => () => {
    if (value == null) { return; }
    const newSelectedFacets = {
      ...selectedFacets,
      [id]: selectedFacets[id]?.includes(value)
        ? selectedFacets[id].filter(v => v !== value)
        : [...(selectedFacets[id] || []), value]
    };
    const newObs = observations
      .filter(o => Object.keys(newSelectedFacets)
        .filter(k => (newSelectedFacets[k] || []).length > 0)
        .every(k => newSelectedFacets[k]
          .every(v => o.attributes?.meta_values
            ?.find(o_meta => o_meta.value?.toLowerCase() === v?.toLowerCase()))));
    setFacetObs(newObs);
    setSelectedFacets(newSelectedFacets);
  };

  const getResPerFacet = useCallback((id?: string, value?: string) =>
    result.filter(o => o?.attributes?.meta_values
      ?.find(v => v?.metadatum?.data?.id === id && v.value !== '' &&
        (value == null || v.value?.toLowerCase() === value?.toLowerCase()))),
    [result]);

  const updateQueryObsDebounced = useCallback(debounce((q?: string) => {
    const obs = observations
      .filter(o => (o.attributes?.label || '').toLowerCase().includes((q || '').toLowerCase()));
    setQueryObs(obs);
  }, 500), [setQueryObs]);

  const handleQuery = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.currentTarget.value);
    updateQueryObsDebounced(e.currentTarget.value);
  };

  const handleTaxon = (id?: string) => () => {
    const newTaxon = id === selTaxonId ? undefined : id;
    setSelTaxonId(newTaxon);
    setTaxonObs(newTaxon != null
      ? observations.filter(o => o.attributes?.taxon?.data?.id === id)
      : observations);
  };

  const handleSelectFav = () => setSelectedFav(old => old ? undefined : true);
  const handleSelectCreated = () => setSelectedCreated(old => old ? undefined : true);

  const facetSel: IFacetSel[] = [
    hasFavs ? { label: 'favorites', selected: selectFav, isBoolean: true } : {},
    hasCreated ? { label: 'created', selected: selectCreated, isBoolean: true } : {},
    { label: 'taxons', selected: selTaxonLabel },
    ...meta.map(f => ({
      label: f.attributes?.label,
      selected: selectedFacets[f.id],
      empty: getResPerFacet(f.id).length === 0
    })),
  ];

  return (
    <Map observations={result} extra={extraProps} className={s.container}>
      <Head>
        <title key='title'>Discover {type}</title>
      </Head>
      <div className={'title'}>Discover {type}</div>
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
            {taxons.filter(t => result.find(o => o.attributes?.taxon?.data?.id === t.id)).map(t =>
              <FacetItem key={t.id} onClick={handleTaxon(t.id)} label={t.attributes?.label}
                total={result.filter(o => o.attributes?.taxon?.data?.id === t.id).length}
                selected={selTaxonId === t.id} />)}
          </div>
          {meta.map(m =>
            <div key={m.id} className={s.facetList}>
              {getResPerFacet(m.id)
                .map(o => o.attributes?.meta_values?.filter(v => v.metadatum?.data?.id === m.id)
                  .map(v => v?.value?.toLowerCase())).flat().filter((v, ind, self): v is string =>
                    v != null && v !== '' && (self.indexOf(v) === ind)).sort().map(v =>
                      <FacetItem onClick={handleFacetClick(m.id, v)} key={v} label={v}
                        total={getResPerFacet(m.id, v).filter(v => v != null).length}
                        selected={(selectedFacets[m.id] || []).includes(v)} />)}
            </div>)}
        </FacetList>
      </div>
      <Results> {result.map(r =>
        <Card key={r.id} image={r.attributes?.image?.data} link={`/observations/${r.id}`}
          text={r.attributes?.label} fav={isFav(r)} />)}
      </Results>
    </Map>
  );
};

export default ObservationSearchPage;
