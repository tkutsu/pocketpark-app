import { useState, ChangeEvent, useEffect, useCallback, useRef } from 'react';
import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { FaCameraRetro, FaRegSave } from 'react-icons/fa';
import Img from 'components/Img';
import Map from 'components/Map';
import LoadWrapper from 'components/LoadWrapper';
import { useRedisUserContext } from 'shared/utilities/contextRedisUser';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import { EnumDrawType, ITripAPI, IMapContext, XObservation, Xuser } from 'shared/interfaces';
import { useNoteContext } from 'shared/utilities/contextNotes';
import { useMapContext } from 'shared/utilities/contextMap';
import isValidImageType from 'shared/utilities/isValidImageType';
import { imgCompressConfig } from 'shared/constants';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

export const getStaticProps: GetStaticProps = async () => {
  const { extraProps } = await getData({ withPark: true });
  return { props: { extraProps }, revalidate: 1 };
};

interface IProps {
  extraProps: IExtraProps;
}

const TripNewPage: NextPage<IProps> = ({ extraProps }) => {
  const { mapData, setMapData } = useMapContext();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<{ file?: File, url?: string; }>({});
  const router = useRouter();
  const { addNote } = useNoteContext();
  const { user } = useRedisUserContext();
  const [obsList, setObsList] = useState<XObservation['data'][]>([]);
  const [obsIdsSelected, setObsIdsSelected] = useState<string[]>([]);
  const obsSelected = obsList.filter(o => obsIdsSelected.includes(o.id || ''));
  const canSave = !loading && label != null && label !== '';

  const handleUpload = async () => {
    setLoading(true);
    const path = mapData?.drawTotal || [];
    if (path.length === 0 || path[0]?.latitude == null || path[0]?.longitude == null) {
      addNote({ id: 'save', text: 'Please add map markers', warning: true });
    } else if (!navigator?.onLine) {
      addNote({ id: 'offline', text: 'You are currently offline', warning: true });
    } else {
      let imageId;
      if (image?.file) {
        try {
          const currentUser = await axios.get('/api/user/me') as Xuser;
          if (currentUser.data?.id != null) {
            const compressedImg = await imageCompression(image.file, imgCompressConfig);
            const formData = new FormData();
            formData.append('files', compressedImg, image.file.name || 'image.jpeg');
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
          label, description, path, imageId, obsIds: obsIdsSelected || [],
        };
        const { data } = await axios.post('/api/trip/create', req);
        data?.data?.id != null && router.push(`/trips/${data?.data?.id}`);
      } catch (e) {
        addNote({ id: 'save', text: 'Could not save', warning: true });
      }
    }
    setLoading(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const image = (e?.currentTarget?.files || [])[0];
    if (!image || !isValidImageType(image)) return;
    setImage({ file: image, url: URL.createObjectURL(image) });
  };

  const handleLabel = (e: ChangeEvent<HTMLInputElement>) => setLabel(e.currentTarget.value);
  const handleDescription = (e: ChangeEvent<HTMLTextAreaElement>) =>
    setDescription(e.currentTarget.value);
  const handleCheckbox = (id?: string) => () => id != null &&
    setObsIdsSelected(old => old.includes(id) ? old.filter(sel => sel !== id) : [...old, id]);

  const getUserObservations = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/user/me') as Xuser;
      setObsList(data?.attributes?.observations?.data || []);
    } catch { }
  }, [setObsList]);

  useEffect(() => { getUserObservations(); }, [getUserObservations]);

  useEffect(() => {
    const _mapData: IMapContext = { drawType: EnumDrawType.path };
    if (user.latitude != null && user.longitude != null && (mapData.drawTotal || []).length === 0) {
      _mapData.drawTotal = [{ latitude: user.latitude, longitude: user.longitude }];
    }
    setMapData(_mapData);
  }, [user.latitude != null, user.longitude != null, (mapData.drawTotal || []).length]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'inherit';
      textAreaRef.current.style.height =
        `${Math.max(2 + textAreaRef.current.scrollHeight, 6 * 16)}px`;
    }
  }, [description]);

  return (
    <Map draw extra={extraProps} observations={obsSelected} className={s.container}>
      <Head>
        <title key='title'>New trip</title>
      </Head>
      <div className={'title'}>{label}</div>
      <LoadWrapper className={s.buttons} isLoading={loading}>
        <button className={c(s.button, !canSave && s.disabled, 'button')} onClick={handleUpload}
          disabled={!canSave}>
          <FaRegSave className={s.icon} />save
        </button>
      </LoadWrapper>
      <div className={s.content}>
        <div className={s.image}>
          <input className={s.fileInput} type='file' accept='image/*' capture='environment'
            onChange={handleFileChange} />
          <div className={s.uploadPrompt}>
            <FaCameraRetro className={s.icon} />
            {image?.url ? 'Added photo' : 'Add a photo'}
          </div>
          <Img image={image?.url} alt={label} imgClass={s.img} />
        </div>
        <div className={s.meta}>
          <label className={s.inputGroup}>
            <div className={s.label}>Label</div>
            <input type='text' onChange={handleLabel} value={label} className={s.input} />
          </label>
          <label className={s.inputGroup}>
            <div className={s.label}>Description</div>
            <textarea onChange={handleDescription} ref={textAreaRef} value={description}
              className={c(s.input, s.textarea)} />
          </label>
          {obsList.length > 0 &&
            <div className={s.header}>Created observations</div>}
          {obsList.filter(o => o.id != null).map(o =>
            <label className={c(s.inputGroup, s.checkbox, 'checkbox')} key={o.id}>
              <input type='checkbox' className={s.input} onChange={handleCheckbox(o.id)}
                checked={obsIdsSelected.includes(o.id as string)} />
              <div className={s.label}>{o.attributes?.label}</div>
            </label>)}
        </div>
      </div>
    </Map>);
};

export default TripNewPage;

