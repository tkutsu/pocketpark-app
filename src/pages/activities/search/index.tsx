import { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import isEmpty from "lodash/isEmpty";
import { FaSearch } from "react-icons/fa";
import FacetItem from "components/Facets/FacetItem";
import Slider from "components/Slider";
import Map from "components/Map";
import Results from "components/Results";
import Card from "components/Card";
import FacetList, { IFacetSel } from "components/Facets/FacetList";
import getData, { IExtraProps } from "shared/utilities/api/getData";
import { XActivity, Xlist } from "shared/interfaces";
import { useAuthContext } from "shared/utilities/contextAuth";
import s from "./index.module.scss";

export const getStaticProps: GetStaticProps = async () => {
  const q = `{
    activities { data { id attributes {
      label description age_min age_max players_min players_max month_min month_max
      position { latitude longitude }
      images { data { id attributes { url height width } } }
      materials { value } tags { value } steps { value }
      fav_users { data { id } }
      comments { data { attributes { text } } }
    } } }
  }`;
  const { activities, extraProps } = await getData({ q, withPark: true });
  const dataProps = activities?.data || [];
  const notFound = isEmpty(dataProps);
  return { props: { dataProps, extraProps }, notFound, revalidate: 1 };
};

interface IProps {
  dataProps: XActivity["data"][];
  extraProps: IExtraProps;
}
const ActivitySearchPage: NextPage<IProps> = ({ dataProps, extraProps }) => {
  const { user } = useAuthContext();
  const getMin = (arr: (number | undefined)[]) =>
    Math.min(...arr.filter((num): num is number => num != null));
  const getMax = (arr: (number | undefined)[]) =>
    Math.max(...arr.filter((num): num is number => num != null));
  const getList = useCallback(
    (data: (Xlist[] | undefined)[]) =>
      data
        ?.map((d) => (d || []).map((o) => o.value))
        .flat()
        .filter(
          (v, ind, self): v is string => v != null && self.indexOf(v) === ind
        ),
    []
  );
  const defAgeMin = useMemo(
    () => getMin(dataProps.map((a) => a.attributes?.age_min)) || 0,
    []
  );
  const defAgeMax = useMemo(
    () => getMax(dataProps.map((a) => a.attributes?.age_max)) || 100,
    []
  );
  const defPlayersMin = useMemo(
    () => getMin(dataProps.map((a) => a.attributes?.players_min)),
    []
  );
  const defPlayersMax = useMemo(
    () => getMax(dataProps.map((a) => a.attributes?.players_max)),
    []
  );
  const defMonthMin = useMemo(
    () => getMin(dataProps.map((a) => a.attributes?.month_min)),
    []
  );
  const defMonthMax = useMemo(
    () => getMax(dataProps.map((a) => a.attributes?.month_max)),
    []
  );
  const defMaterials = useMemo(
    () => getList(dataProps.map((a) => a.attributes?.materials)),
    []
  );
  const defTags = useMemo(
    () => getList(dataProps.map((a) => a.attributes?.tags)),
    []
  );
  const [selectedFav, setSelectedFav] = useState<undefined | boolean>();
  const [query, setQuery] = useState("");
  const [age, setAge] = useState<number | undefined>(undefined);
  const [players, setPlayers] = useState<number | undefined>(undefined);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [materials, setMaterials] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [queryActivities, setQueryActivities] = useState(dataProps);
  const result = useMemo(
    () =>
      queryActivities
        .filter(
          (a) =>
            (age == null ||
              a.attributes?.age_min == null ||
              a.attributes?.age_min <= age) &&
            (age == null ||
              a.attributes?.age_max == null ||
              a.attributes?.age_max >= age) &&
            (players == null ||
              a.attributes?.players_min == null ||
              a.attributes?.players_min <= players) &&
            (players == null ||
              a.attributes?.players_max == null ||
              a.attributes?.players_max >= players) &&
            (month == null ||
              a.attributes?.month_min == null ||
              a.attributes?.month_min <= month) &&
            (month == null ||
              a.attributes?.month_max == null ||
              a.attributes?.month_max >= month) &&
            materials.every((m) =>
              getList([a.attributes?.materials]).includes(m)
            ) &&
            tags.every((t) => getList([a.attributes?.tags]).includes(t))
        )
        .filter(
          (o) =>
            user?.id == null ||
            !selectedFav ||
            o.attributes?.fav_users?.data?.some(
              (u) => `${u.id}` === `${user.id}`
            )
        ),
    [
      queryActivities,
      age,
      players,
      month,
      materials,
      tags,
      selectedFav,
      getList,
      user?.id,
    ]
  );

  const hasFavs =
    user?.id != null &&
    result.some((o) =>
      o.attributes?.fav_users?.data?.some((u) => `${u.id}` === `${user.id}`)
    );

  const isFav = (o: XActivity["data"]) =>
    user?.id != null &&
    o.attributes?.fav_users?.data?.some((u) => `${u.id}` === `${user.id}`);

  const updateQueryObsDebounced = useCallback(
    debounce((q?: string) => {
      const activities = dataProps.filter((a) =>
        (a.attributes?.label || "")
          .toLowerCase()
          .includes((q || "").toLowerCase())
      );
      setQueryActivities(activities);
    }, 500),
    [setQueryActivities]
  );

  const handleQuery = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.currentTarget.value);
    updateQueryObsDebounced(e.currentTarget.value);
  };

  const handleAgeChange = (values?: readonly number[]) =>
    setAge(values ? values[0] : undefined);
  const handlePlayersChange = (values?: readonly number[]) =>
    setPlayers(values ? values[0] : undefined);
  const handleMonthChange = (values?: readonly number[]) =>
    setMonth(values ? values[0] : undefined);
  const handleMaterialClick = (value: string) => () =>
    setMaterials((old) =>
      old.includes(value) ? old.filter((m) => m !== value) : [...old, value]
    );
  const handleTagClick = (value: string) => () =>
    setTags((old) =>
      old.includes(value) ? old.filter((t) => t !== value) : [...old, value]
    );

  const handleSelectFav = () =>
    setSelectedFav((old) => (old ? undefined : true));

  const facetSel: IFacetSel[] = [
    hasFavs
      ? { label: "favorites", selected: selectedFav, isBoolean: true }
      : {},
    { label: "players", selected: players },
    { label: "age", selected: age },
    { label: "month", selected: month },
    { label: "materials", selected: materials },
    { label: "tags", selected: tags },
  ];

  return (
    <Map activities={result} extra={extraProps} className={s.container}>
      <Head>
        <title key="title">Discover Activities</title>
      </Head>
      <div className={"title"}>Discover Activities</div>
      <div className={s.search}>
        <div className={s.query}>
          <FaSearch className={s.searchIcon} />
          <input
            className={s.qInput}
            onChange={handleQuery}
            value={query}
            placeholder="search"
          />
        </div>
        <FacetList facetSel={facetSel}>
          {hasFavs && (
            <div className={s.facetList}>
              <FacetItem
                onClick={handleSelectFav}
                selected={selectedFav}
                label="favorites"
                isBoolean
                total={
                  result.filter((o) =>
                    o.attributes?.fav_users?.data?.some(
                      (u) => `${u.id}` === `${user.id}`
                    )
                  ).length
                }
              />
            </div>
          )}
          <Slider
            min={defPlayersMin}
            max={defPlayersMax}
            values={[0]}
            defValues={[]}
            handleChange={handlePlayersChange}
          />
          <Slider
            min={defAgeMin}
            max={defAgeMax}
            values={[0]}
            defValues={[]}
            handleChange={handleAgeChange}
          />
          <Slider
            min={defMonthMin}
            max={defMonthMax}
            values={[0]}
            defValues={[]}
            handleChange={handleMonthChange}
          />
          <div className={s.facetList}>
            {defMaterials.map((m) => {
              const total = result.filter((r) =>
                r.attributes?.materials?.some((o) => o.value === m)
              ).length;
              return (
                total > 0 && (
                  <FacetItem
                    key={m}
                    onClick={handleMaterialClick(m)}
                    label={m}
                    total={total}
                    selected={materials.includes(m)}
                  />
                )
              );
            })}
          </div>
          <div className={s.facetList}>
            {defTags.map((t) => {
              const total = result.filter((r) =>
                r.attributes?.tags?.some((o) => o.value === t)
              ).length;
              return (
                total > 0 && (
                  <FacetItem
                    key={t}
                    onClick={handleTagClick(t)}
                    label={t}
                    total={total}
                    selected={tags.includes(t)}
                  />
                )
              );
            })}
          </div>
        </FacetList>
      </div>
      <Results>
        {" "}
        {result.map((r) => (
          <Card
            key={r.id}
            image={r.attributes?.images?.data}
            link={`/activities/${r.id}`}
            text={r.attributes?.label}
            fav={isFav(r)}
          />
        ))}
      </Results>
    </Map>
  );
};

export default ActivitySearchPage;
