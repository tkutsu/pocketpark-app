import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useMemo, useState } from 'react';
import {
  FaChevronDown, FaInfoCircle, FaPhoneAlt, FaRegCalendarCheck, FaRegCalendarTimes, FaRegEnvelope, FaRegMap, FaRegPlusSquare
} from 'react-icons/fa';
import Card from 'components/Card';
import Map from 'components/Map';
import { XActivity, XPlace, XTrip } from 'shared/interfaces';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import { XObservation } from 'shared/interfaces';
import c from 'shared/utilities/classname';
import s from './index.module.scss';
import Link from 'next/link';
import { useAuthContext } from 'shared/utilities/contextAuth';

export const getServerSideProps: GetServerSideProps = async () => {
  const q = `{
    observations { data { id attributes {
      taxon { data { id attributes { type } } }
    } } }
    activities{ data { id } }
    places { data { id } }
    trips { data { id } }
  }`;
  const {
    observations, activities, places, trips, extraProps
  } = await getData({ q, withPark: true });
  return {
    props: {
      observations: observations.data,
      activities: activities.data,
      places: places.data,
      trips: trips.data,
      extraProps,
    },
  };
};

interface IProps {
  observations: XObservation['data'][];
  activities: XActivity['data'][];
  places: XPlace['data'][];
  trips: XTrip['data'][];
  extraProps: IExtraProps;
}
const Main: NextPage<IProps> = ({ observations, activities, places, trips, extraProps }) => {
  const { user } = useAuthContext();
  const [descOpen, setDescOpen] = useState(false);
  const handleDescToggle = () => setDescOpen(old => !old);

  const obsTypeTotals = useMemo(() =>
    observations.reduce((acc: { [key: string]: number; }, cur: XObservation['data']) => {
      const type = cur.attributes?.taxon?.data.attributes?.type;
      if (type != null) { acc[type] = acc[type] == null ? 1 : acc[type] + 1; }
      return acc;
    }, {}), []);

  return (
    <Map extra={extraProps} className={s.container} showPlaces showPark>
      <Head>
        <title key='title'>{extraProps.park?.label || 'PocketPark'}</title>
      </Head>
      <div className={c(s.header, descOpen && s.open)}>
        <div className={c('title', s.title)}>{extraProps.park?.label || 'PocketPark'}</div>
        <div className={s.metaWrapper}>
          {extraProps.park?.phone &&
            <a className={c(s.meta, s.link)} target='_blank' rel='noopener noreferrer'
              href={`tel:${extraProps.park.phone}`}>
              <FaPhoneAlt />
            </a>}
          {extraProps.park?.email &&
            <a className={c(s.meta, s.link)} target='_blank' rel='noopener noreferrer'
              href={`mailto:${extraProps.park.email}`}>
              <FaRegEnvelope />
            </a>}
          {extraProps.park?.open_hours &&
            <div className={c(s.meta, extraProps.park?.closed_unplanned && s.closed)}>
              {extraProps.park?.closed_unplanned ? <FaRegCalendarTimes /> : <FaRegCalendarCheck />}
              <div className={s.text}>
                {extraProps.park?.closed_unplanned
                  ? 'currently closed'
                  : `${extraProps.park?.open_hours}`}
              </div>
            </div>}
        </div>
        {extraProps.park?.description &&
          <div className={c(s.descriptionWrapper, descOpen && s.open)}>
            <div className={s.descriptionHeader} onClick={handleDescToggle}>
              <FaInfoCircle className={s.icon} />
              <div className={s.text}>More info</div>
              <FaChevronDown className={s.arrow} />
            </div>
            <div className={c(s.description, descOpen && s.open)}>
              {extraProps.park?.description}
            </div>
          </div>}
      </div>
      <div className={s.subtitle}>
        <FaRegMap /><div className={s.text}>Discover</div>
      </div>
      <div className={s.cards}>
        {obsTypeTotals?.animals &&
          <Card link={`/observations/search/animals`} key='animals' className={s.card}
            text={`Animals: ${obsTypeTotals?.animals}`}
            image={extraProps.park?.image_animal?.data} />}
        {obsTypeTotals?.plants &&
          <Card link={`/observations/search/plants`} key='plants' className={s.card}
            text={`Plants: ${obsTypeTotals?.plants}`}
            image={extraProps.park?.image_plant?.data} />}
        {activities.length > 0 &&
          <Card link='/activities/search' text={`Activities: ${activities.length}`}
            className={s.card} image={extraProps.park?.image_activity?.data} />}
        {places.length > 0 &&
          <Card link='/park/search' text={`Places: ${places.length}`}
            className={s.card} image={extraProps.park?.image_place?.data} />}
        {trips.length > 0 &&
          <Card link='/trips/search' text={`Trips: ${trips.length}`}
            className={s.card} image={extraProps.park?.image_trip?.data} />}
      </div>
      <div className={s.subtitle}>
        <FaRegPlusSquare /><div className={s.text}>Record</div>
      </div>
      {user?.id != null
        ? <div className={s.cards}>
          <Card link='/observations/new' text='New observation'
            className={s.card} image={extraProps.park?.image_new_observation?.data} />
          <Card link='/trips/new' text='New trip'
            className={s.card} image={extraProps.park?.image_new_trip?.data} />
        </div>
        : <div className={s.recordText} >
          <Link href='/account' scroll={false}><a className={s.link}>Login</a></Link>
          to submit your discoveries!
        </div>}
    </Map>
  );
};

export default Main;
