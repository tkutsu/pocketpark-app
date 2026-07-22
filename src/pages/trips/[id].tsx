import { useState, ChangeEvent, useEffect, useCallback, useMemo, useRef } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import isEmpty from 'lodash/isEmpty';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import {
  FaCameraRetro, FaHeart, FaRegEdit, FaRegHeart, FaRegSave, FaUndoAlt, FaRegTimesCircle
} from 'react-icons/fa';
import Map from 'components/Map';
import Img from 'components/Img';
import LoadWrapper from 'components/LoadWrapper';
import { useAuthContext } from 'shared/utilities/contextAuth';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import {
  XTrip, EnumDrawType, ITripAPI, XObservation, Xuser, IUserAPI, IUserResREST,
  Xgeodata, ICommentaryAPI
} from 'shared/interfaces';
import { useRedisUserContext } from 'shared/utilities/contextRedisUser';
import { useNoteContext } from 'shared/utilities/contextNotes';
import { useMapContext } from 'shared/utilities/contextMap';
import stringToInt from 'shared/utilities/stringToInt';
import isValidImageType from 'shared/utilities/isValidImageType';
import { imgCompressConfig } from 'shared/constants';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const q = `
  query($id: ID!) {
    trips(filters: {id: {eq: $id}}) { data { id attributes {
      label description featured
      creator { data { id } }
      fav_users { data { id } }
      path {latitude longitude}
      image { data { id attributes { url height width } } }
      observations { data { id attributes {
        label
        position { latitude longitude }
        image { data { id attributes { url height width } } }
        taxon { data { attributes { type } } }
      } } }
      comments { data { id attributes {
        createdAt text creator { data { attributes { username } } }
      } } }
      commentaries { data { id attributes {
        comments { id latitude longitude text }
        creator { data { id attributes { username } } }
      } } }
    } } }
  }`;

  const { trips, extraProps } = await getData({ q, params: { id: params?.id }, withPark: true });
  const dataProps = trips?.data[0] || {};
  const notFound = isEmpty(dataProps);
  return { props: { dataProps, extraProps }, notFound };
};

interface IProps {
  dataProps: XTrip['data'];
  extraProps: IExtraProps;
}
const TripPage: NextPage<IProps> = ({ dataProps, extraProps }) => {
  const [data, setData] = useState(dataProps);
  const attr = data?.attributes;
  const id = dataProps.id;
  const { addNote } = useNoteContext();
  const { user } = useAuthContext();
  const { user: { latitude, longitude } } = useRedisUserContext();
  const isOwner = user?.id != null && `${attr?.creator?.data?.id}` === `${user?.id}`;
  const favsExcludingUser = (attr?.fav_users?.data || [])
    ?.filter(u => u?.id != null && `${u?.id}` !== `${user?.id}`)?.length || 0;
  const [faved, setFaved] = useState(false);
  const { mapData, setMapData, resetMapData } = useMapContext();
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState(attr?.label || '');
  const [description, setDescription] = useState(attr?.description || '');
  const [image, setImage] = useState<{ file?: File, url?: string; }>({});
  const [edit, setEdit] = useState(false);
  const [userObs, setUserObs] = useState<XObservation['data'][]>([]);
  const obs = attr?.observations?.data || [];
  const obsIds = obs.filter((o) => o.id != null).map(o => `${o.id}`);
  const [obsIdsSelected, setObsIdsSelected] = useState<string[]>(obsIds);
  const allObs = useMemo(() =>
    [...userObs, ...obs.filter(o => !userObs.some(uo => `${uo.id}` === `${o.id}`))],
    [userObs.length, data]);
  const obsSelected = allObs.filter(o => obsIdsSelected.includes(o.id || ''));
  const canSave = !loading && isOwner && label != null && label !== '';
  const commentaries = attr?.commentaries?.data || [];
  const commentaryCreators = commentaries
    .map(c => ({
      id: c.attributes?.creator?.data.id,
      name: c.attributes?.creator?.data.attributes?.username
    }))
    .filter((val, ind, self) => self.findIndex(v => v.id === val.id) === ind)
    .filter((c) => c?.id !== user?.id)
    .filter((c) => c?.id !== id);
  const getCommentaries = (id?: string) => id != null
    ? (commentaries.find(u => u.attributes?.creator?.data.id === id)?.attributes?.comments || [])
    : [];
  const [newCommentary, setNewCommentary] = useState<string>('');
  const [commentaryUser, setCommentaryUser] = useState<string | undefined>(attr?.creator?.data.id);
  const [currCommentary, setCurrCommentary] =
    useState<Xgeodata[]>(getCommentaries(attr?.creator?.data.id));

  const handleCommentaryUser = (e: ChangeEvent<HTMLSelectElement>) => {
    setCommentaryUser(e.currentTarget.value);
    setCurrCommentary(getCommentaries(e.currentTarget.value));
  };

  const handleToggleEdit = () => {
    const doEdit = isOwner ? !edit : false;
    setMapData({
      drawType: doEdit ? EnumDrawType.path : undefined,
      drawTotal: attr?.path,
    });
    setCommentaryUser(user?.id);
    setCurrCommentary(getCommentaries(user?.id));
    setEdit(doEdit);
  };

  const handleLabel = (e: ChangeEvent<HTMLInputElement>) => setLabel(e.currentTarget.value);
  const handleDescription = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.currentTarget.value);
  };

  const handleCommentaryClick = () => {
    window.scrollTo(0, 0);
  };

  const handleUpload = async () => {
    setLoading(true);
    const path = mapData?.drawTotal || [];
    if (path.length === 0 || path[0]?.latitude == null || path[0]?.longitude == null) {
      addNote({ id: 'save', text: 'Please add map markers', warning: true });
      return;
    } else if (!navigator?.onLine) {
      addNote({ id: 'offline', text: 'You are currently offline', warning: true });
    } else {
      let imageId;
      if (image?.file) {
        try {
          const currentUser = await axios.get('/api/user/me') as Xuser;
          if (currentUser.data?.id != null && id != null) {
            const compressedImg = await imageCompression(image.file, imgCompressConfig);
            const formData = new FormData();
            formData.append('files', compressedImg, image.file.name || 'image.jpeg');
            formData.append('ref', 'trip');
            formData.append('refId', id);
            formData.append('field', 'image');
            const { data } = await axios.post('/api/image/create', formData);
            imageId = (Array.isArray(data) ? data[0] : data)?.id;
          }
        } catch (e) {
          addNote({ id: 'save', text: 'Could not upload image', warning: true });
        }
      }
      try {
        const req: ITripAPI = {
          id, label, description, path, obsIds: obsIdsSelected, imageId
        };
        const { data: _data } = await axios.post('/api/trip/update', req);
        setData(old => ({
          ...old,
          attributes: {
            ...old.attributes,
            label: _data.data.attributes.label,
            description: _data.data.attributes.description,
            path: _data.data.attributes.path,
            image: _data.data.attributes.image,
            observations: _data.data.attributes.observations,
          }
        }));
        setLabel(_data.data.attributes.label || '');
        setDescription(_data.data.attributes.description || '');
        handleToggleEdit();
      } catch (e) {
        addNote({ id: 'save', text: 'Could not save', warning: true });
      }
    }
    setLoading(false);
  };

  const handleResetEdit = () => {
    setLabel(attr?.label || '');
    setDescription(attr?.description || '');
    setImage({});
    resetMapData();
    handleToggleEdit();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const image = (e?.currentTarget?.files || [])[0];
    if (!edit || !image || !isValidImageType(image)) return;
    setImage({ file: image, url: URL.createObjectURL(image) });
  };

  const handleCommentaryUpload = async (comments: Xgeodata[]) => {
    setLoading(true);
    if (!navigator?.onLine) {
      addNote({ id: 'offline', text: 'You are currently offline', warning: true });
    } else {
      try {
        const commentaryId = commentaries.find(c => c.attributes?.creator?.data.id === user?.id)?.id;
        const req: ICommentaryAPI = { commentaryId, tripId: id, comments };
        await axios.post('/api/commentary/createOrUpdate', req);
      } catch (e) {
        addNote({ id: 'save', text: 'Could not save', warning: true });
      }
    }
    setLoading(false);
  };

  const getUserObservations = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/user/me') as Xuser;
      setUserObs(data?.attributes?.observations?.data || []);
    } catch { }
  }, [setUserObs]);

  const handleCheckbox = (id?: string) => () => id != null &&
    setObsIdsSelected(old => old.includes(id) ? old.filter(sel => sel !== id) : [...old, id]);

  useEffect(() => {
    if (!userObs.length && edit) { getUserObservations(); }
  }, [userObs.length, getUserObservations, edit]);

  const handleFav = async () => {
    if (!navigator?.onLine) {
      addNote({ id: 'offline', text: 'You are currently offline', warning: true });
    } else {
      try {
        const numId = stringToInt(id);
        const req: IUserAPI = { fav_trip: numId };
        const { data: _data }: { data: IUserResREST; } = await axios.post('/api/user/update', req);
        setFaved(_data?.fav_trips?.some(f => `${f.id}` === `${id}`) || false);
      } catch (e) {
        addNote({ id: 'fav', text: 'Could not add favorite', warning: true });
      }
    }
  };

  useEffect(() => {
    setFaved(user?.attributes?.fav_trips?.data?.some(f => `${f.id}` === `${id}`) || false);
  }, [user?.attributes?.fav_trips?.data?.length, id]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'inherit';
      textAreaRef.current.style.height =
        `${Math.max(2 + textAreaRef.current.scrollHeight, 6 * 16)}px`;
    }
  }, [description]);

  const handleCommentaryNew = (e: ChangeEvent<HTMLTextAreaElement>) =>
    setNewCommentary(e?.currentTarget?.value || '');

  const handleCommentaryAdd = () => {
    if (newCommentary !== '' && latitude != null && longitude != null) {
      const newComm = [...currCommentary, { latitude, longitude, text: newCommentary }];
      setCurrCommentary(newComm);
      setNewCommentary('');
      handleCommentaryUpload(newComm);
    }
  };

  const handleCommentaryRemove = (ind: number) => () => {
    const newComm = currCommentary.filter(((cc, i) => i !== ind));
    setCurrCommentary(newComm);
    handleCommentaryUpload(newComm);
  };

  return (
    <Map className={s.container} trips={[data]} observations={obsSelected} extra={extraProps}
      commentaries={currCommentary} draw={edit} crumb={{ label: 'Trips', link: `/trips/search/` }}>
      <Head>
        <title key='title'>Trip: {attr?.label}</title>
      </Head>
      <div className={'title'}>{label}</div>
      {user?.id != null &&
        <LoadWrapper className={s.buttons} isLoading={loading}>
          {isOwner && edit &&
            <>
              <button className={c(s.button, loading && s.disabled, s.reset, 'button')}
                onClick={handleResetEdit}>
                <FaUndoAlt className={s.icon} />reset
              </button>
              <button className={c(s.button, !canSave && s.disabled, 'button')}
                onClick={handleUpload}>
                <FaRegSave className={s.icon} />save
              </button>
            </>}
          {isOwner && !edit &&
            <button className={c(s.button, !canSave && s.disabled, 'button')}
              onClick={handleToggleEdit}>
              <FaRegEdit className={s.icon} />edit
            </button>}
          <div className={c(s.favorites, faved && s.faved)} onClick={handleFav}>
            {faved ? <FaHeart className={s.icon} /> : <FaRegHeart className={s.icon} />}
            {(favsExcludingUser || 0) + (faved ? 1 : 0)}
          </div>
        </LoadWrapper>}
      <div className={s.content}>
        <div className={s.image}>
          {edit && <input className={s.fileInput} type='file' accept='image/*' capture='environment'
            onChange={handleFileChange} />}
          {edit &&
            <div className={s.uploadPrompt}>
              <FaCameraRetro className={s.icon} />
              {image?.url ? 'Added photo' : 'Add a photo'}
            </div>}
          <Img image={image?.url || attr?.image?.data} alt={label}
            imgClass={s.img} />
        </div>
        <div className={c(s.meta, edit ? s.edit : s.view)}>
          {edit &&
            <label className={s.inputGroup}>
              <div className={s.label}>Label</div>
              <input type='text' readOnly={!edit} onChange={handleLabel} value={label}
                className={s.input} />
            </label>}
          {(edit || description) &&
            <label className={s.inputGroup}>
              <div className={s.label}>Description</div>
              <textarea className={c(s.input, s.textarea)} role='textbox' readOnly={!edit}
                onChange={handleDescription} value={description} ref={textAreaRef} />
            </label>}
          {(edit && allObs.length > 0) &&
            <div className={s.header}>Created observations</div>}
          {edit && allObs.filter(o => o.id != null).map(o =>
            <label className={c(s.inputGroup, s.checkbox, 'checkbox')} key={o.id}>
              <input type='checkbox' className={s.input} onChange={handleCheckbox(o.id)}
                checked={obsIdsSelected.includes(o.id as string)} />
              <div className={s.label}>{o.attributes?.label}</div>
            </label>)}
        </div>
      </div>
      {!edit &&
        <div className={s.commentary}>
          <div className={s.title}>
            <div>Commentary by:</div>
            <label>
              <select value={commentaryUser} onChange={handleCommentaryUser}>
                <option value={attr?.creator?.data.id}>Author</option>
                {user?.id != null && user?.id !== attr?.creator?.data.id &&
                  latitude != null && longitude != null &&
                  <option value={user.id}>You</option>}
                {commentaryCreators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <div className={s.info}>
            View comments from other users on the map, or add your own
          </div>
          {commentaryUser === user?.id && latitude != null && longitude != null &&
            <div className={s.inputGroup}>
              <textarea className={c(s.input, s.textArea)} role='textbox'
                onChange={handleCommentaryNew} value={newCommentary} />
              <div className={c(s.button, loading && s.disabled, 'button')}
                onClick={handleCommentaryAdd}>
                <FaRegSave className={s.icon} />Add to your coordinates
              </div>
            </div>}
          <div className={s.inputList}>
            {currCommentary.map((cc, ind) =>
              <div key={ind} className={s.inputGroup}>
                <div className={c(s.input, s.textArea, s.view)} onClick={handleCommentaryClick}>
                  <div className={s.number}>{ind + 1}</div>
                  {cc.text}
                </div>
                {commentaryUser === user?.id &&
                  <div className={c(s.button, loading && s.disabled, s.reset, 'button')}
                    onClick={handleCommentaryRemove(ind)}>
                    <FaRegTimesCircle className={s.icon} />Remove
                  </div>}
              </div>)}
          </div>
        </div>}
      {/* <Comments className={s.comments} comments={attr?.comments?.data} id={id}
        type={EnumType.trips} /> */}
    </Map>
  );
};

export default TripPage;

