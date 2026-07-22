import { useEffect, useMemo, useState } from "react";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import axios from "axios";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import isEmpty from "lodash/isEmpty";
import Carousel from "components/Carousel";
import Map from "components/Map";
import Comments from "components/Comments";
import Img from "components/Img";
import { useNoteContext } from "shared/utilities/contextNotes";
import { months as monthArr } from "shared/utilities/formatISODate";
import getData, { IExtraProps } from "shared/utilities/api/getData";
import stringToInt from "shared/utilities/stringToInt";
import { EnumType, IUserAPI, IUserResREST, XActivity } from "shared/interfaces";
import c from "shared/utilities/classname";
import s from "./index.module.scss";
import { useAuthContext } from "shared/utilities/contextAuth";

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const q = `query($id: ID!){
    activities(filters: {id: {eq: $id}}) { data { id attributes {
      label description age_min age_max players_min players_max month_min month_max
      position { latitude longitude }
      images { data { id attributes { url height width } } }
      materials { id value } tags { id value } steps { id value }
      fav_users { data { id } }
      comments {  data { id attributes {
        createdAt text creator { data { attributes { username } } }
      } } }
    }}}
  }`;
  const { activities, extraProps } = await getData({
    q,
    params: { id: params?.id },
    withPark: true,
  });
  const dataProps = activities?.data[0] || {};
  const notFound = isEmpty(dataProps);
  return { props: { dataProps, extraProps }, notFound, revalidate: 1 };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const q = `{ activities { data { id } } }`;
  const { activities } = await getData({ q });
  const paths = activities?.data
    ?.filter((o: XActivity["data"]) => o?.id != null)
    ?.map((o: XActivity["data"]) => ({ params: { id: o.id } }));
  return { paths, fallback: "blocking" };
};

interface IProps {
  dataProps: XActivity["data"];
  extraProps: IExtraProps;
}
const ActivityPage: NextPage<IProps> = ({ dataProps, extraProps }) => {
  const { user } = useAuthContext();
  const { addNote } = useNoteContext();
  const attr = dataProps?.attributes || {};
  const id = dataProps.id;
  const favsExcludingUser =
    (attr?.fav_users?.data || [])?.filter(
      (u) => u?.id != null && `${u?.id}` !== `${user?.id}`
    )?.length || 0;
  const [faved, setFaved] = useState(false);
  const imgList = useMemo(() => (attr.images?.data || []).filter(Boolean), []);
  const months = useMemo(() => {
    const getMonth = (m?: number): string | null =>
      m && 1 <= m && m <= monthArr.length ? monthArr[m - 1] : null;
    return [getMonth(attr?.month_min), getMonth(attr?.month_max)];
  }, []);

  const handleFav = async () => {
    if (!navigator?.onLine) {
      addNote({
        id: "offline",
        text: "You are currently offline",
        warning: true,
      });
    } else {
      try {
        const numId = stringToInt(id);
        const req: IUserAPI = { fav_activity: numId };
        const { data: _data }: { data: IUserResREST } = await axios.post(
          "/api/user/update",
          req
        );
        setFaved(
          _data?.fav_activities?.some((f) => `${f.id}` === `${id}`) || false
        );
      } catch (e) {}
    }
  };

  useEffect(() => {
    setFaved(
      user?.attributes?.fav_activities?.data?.some(
        (f) => `${f.id}` === `${id}`
      ) || false
    );
  }, [user?.attributes?.fav_activities?.data?.length, id]);

  return (
    <Map
      className={s.container}
      activities={[dataProps]}
      extra={extraProps}
      crumb={{ label: "Activities", link: `/activities/search/` }}
    >
      <Head>
        <title key="title">Activity: {attr?.label}</title>
      </Head>
      <div className={"title"}>{attr?.label}</div>
      {user?.id != null && (
        <div className={s.buttons}>
          <div className={c(s.favorites, faved && s.faved)} onClick={handleFav}>
            {faved ? (
              <FaHeart className={s.icon} />
            ) : (
              <FaRegHeart className={s.icon} />
            )}
            {(favsExcludingUser || 0) + (faved ? 1 : 0)}
          </div>
        </div>
      )}
      <div className={s.content}>
        {imgList.length > 1 ? (
          <Carousel sliderClass={s.slider} slideClass={s.slide}>
            {imgList}
          </Carousel>
        ) : (
          <div className={s.image}>
            <Img image={imgList} alt={attr.label} imgClass={s.img} />
          </div>
        )}
        {attr?.label && (
          <div className={s.meta}>
            {attr?.description && (
              <label className={s.inputGroup}>
                <div className={s.label}>Description</div>
                <div className={c(s.input, s.textarea)}>
                  {attr?.description}
                </div>
              </label>
            )}
            {(attr?.age_min != null || attr?.age_max != null) && (
              <label className={s.inputGroup}>
                <div className={s.label}>Ages</div>
                <div className={s.input}>
                  {(attr?.age_min != null && attr?.age_max != null
                    ? `${attr?.age_min} to ${attr?.age_max}`
                    : attr?.age_max == null
                    ? `${attr?.age_min}+`
                    : `${attr?.age_max} or less`) + " years old"}
                </div>
              </label>
            )}
            {(attr?.players_min != null || attr?.players_max != null) && (
              <label className={s.inputGroup}>
                <div className={s.label}>Players</div>
                <div className={s.input}>
                  {(attr?.players_min != null && attr?.players_max != null
                    ? `${attr?.players_min} to ${attr?.players_max}`
                    : attr?.players_max == null
                    ? `${attr?.players_min}+`
                    : `${attr?.players_max} or less`) + " players"}
                </div>
              </label>
            )}
            {(months[0] != null || months[1] != null) && (
              <label className={s.inputGroup}>
                <div className={s.label}>Months</div>
                <div className={s.input}>
                  {months[0] != null && months[1] != null
                    ? `${months[0]} to ${months[1]}`
                    : months[1] == null
                    ? `${months[0]}`
                    : `${months[1]}`}
                </div>
              </label>
            )}
            {(attr?.materials || []).filter((o) => o.value).length > 0 && (
              <label className={s.inputGroup}>
                <div className={s.label}>Materials</div>
                <div className={s.multiple}>
                  {attr?.materials
                    ?.filter((o) => o.value)
                    .map((o) => (
                      <div key={o.id} className={s.input}>
                        {o.value}
                      </div>
                    ))}
                </div>
              </label>
            )}
            {(attr?.tags || []).filter((o) => o.value).length > 0 && (
              <label className={s.inputGroup}>
                <div className={s.label}>Tags</div>
                <div className={s.multiple}>
                  {attr?.tags
                    ?.filter((o) => o.value)
                    .map((o) => (
                      <div key={o.id} className={s.input}>
                        {o.value}
                      </div>
                    ))}
                </div>
              </label>
            )}
            {(attr?.steps || []).filter((o) => o.value).length > 0 && (
              <label className={s.inputGroup}>
                <div className={s.label}>Steps</div>
                <ol className={s.list}>
                  {attr?.steps
                    ?.filter((o) => o.value)
                    .map((o) => (
                      <li key={o.id} className={s.input}>
                        {o.value}
                      </li>
                    ))}
                </ol>
              </label>
            )}
          </div>
        )}
      </div>
      <Comments
        className={s.comments}
        comments={attr.comments?.data}
        id={dataProps.id}
        type={EnumType.activities}
      />
    </Map>
  );
};

export default ActivityPage;
