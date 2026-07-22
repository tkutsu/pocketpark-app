import { useState, ChangeEvent, useEffect, useMemo, useRef } from 'react';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import isEmpty from 'lodash/isEmpty';
import axios from 'axios';
import prependHttp from 'prepend-http';
import imageCompression from 'browser-image-compression';
import {
  FaRegHeart, FaHeart, FaRegEdit, FaRegSave, FaUndoAlt, FaCameraRetro, FaTimes
} from 'react-icons/fa';
import Map from 'components/Map';
import Comments from 'components/Comments';
import Img from 'components/Img';
import LoadWrapper from 'components/LoadWrapper';
import Carousel from 'components/Carousel';
import { useAuthContext } from 'shared/utilities/contextAuth';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import {
  XObservation, IObservationAPI, EnumDrawType, Xuser, EnumXMetaType, IUserAPI, IUserResREST, XMeta_value
} from 'shared/interfaces';
import { isCheckbox } from 'shared/utilities/isAssertions';
import { useMapContext } from 'shared/utilities/contextMap';
import stringToInt from 'shared/utilities/stringToInt';
import getUrlDomain from 'shared/utilities/getUrlDomain';
import { useNoteContext } from 'shared/utilities/contextNotes';
import isValidImageType from 'shared/utilities/isValidImageType';
import { imgCompressConfig } from 'shared/constants';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const q = `
    query($id: ID!) {
      observations(filters: {id: {eq: $id}}) { data { id attributes {
        label description
        fav_users { data { id } }
        image { data { id attributes { url height width } } }
        taxon { data { attributes {
          label species description type urls { id value }
          images { data { id attributes { url height width } } }
          metadata { data { id attributes {
            label datatype description list_values { value } icon { data { id } }
          } } }
          meta_values { value metadatum { data { id } } }
        } } }
        meta_values { value metadatum { data { id } } }
        comments {  data { id attributes {
          createdAt text creator { data { attributes { username } } }
        } } }
        position {latitude longitude}
        creator { data { id } }
      } } }
    }`;
  const { observations, extraProps } =
    await getData({ q, params: { id: params?.id }, withPark: true });
  const dataProps = observations?.data[0] || {};
  const notFound = isEmpty(dataProps);
  return { props: { dataProps, extraProps }, notFound };
};

interface IProps {
  dataProps: XObservation['data'];
  extraProps: IExtraProps;
}
const ObservationPage: NextPage<IProps> = ({ dataProps, extraProps }) => {
  const [data, setData] = useState(dataProps);
  const { addNote } = useNoteContext();
  const { user } = useAuthContext();
  const attr = data?.attributes;
  const id = dataProps.id;
  const isOwner = user?.id != null && `${attr?.creator?.data?.id}` === `${user?.id}`;
  const favsExcludingUser = (attr?.fav_users?.data || [])
    ?.filter(u => u?.id != null && `${u?.id}` !== `${user?.id}`)?.length || 0;
  const [faved, setFaved] = useState(false);
  const { mapData, setMapData, resetMapData } = useMapContext();
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState(attr?.label || '');
  const [description, setDescription] = useState(attr?.description || '');
  const defMeta: IObservationAPI['meta_values'] = useMemo(() =>
    attr?.meta_values?.map(m => ({ value: m.value, metadatum: `${m.metadatum?.data?.id}` })) || [],
    [data]);
  const [metaValues, setMetaValues] = useState<IObservationAPI['meta_values']>(defMeta);
  const [image, setImage] = useState<{ file?: File; url?: string; }>({});
  const [edit, setEdit] = useState(false);
  const taxonAttr = attr?.taxon?.data?.attributes;
  const taxonImgList = useMemo(() => (taxonAttr?.images?.data || []).filter(Boolean), []);
  const comments = attr?.comments?.data;
  const type = attr?.taxon?.data?.attributes?.type;
  const canSave = !loading && isOwner && label != null && label !== '';

  const handleToggleEdit = () => {
    const doEdit = isOwner ? !edit : false;
    setMapData({
      drawType: doEdit ? EnumDrawType.point : undefined,
      drawTotal: attr?.position ? [attr.position] : []
    });
    setEdit(doEdit);
  };

  const handleUpload = async () => {
    const geo = (mapData?.drawTotal || [])[0];
    setLoading(true);
    if (!navigator?.onLine) {
      addNote({ id: 'offline', text: 'You are currently offline', warning: true });
    } else if (geo?.latitude == null || geo?.longitude == null) {
      addNote({ id: 'save', text: 'Please add a map marker', warning: true });
    } else {
      let imageId;
      if (image.file) {
        try {
          const currentUser = await axios.get('/api/user/me') as Xuser;
          if (currentUser.data?.id != null && id != null) {
            const compressedImg = await imageCompression(image.file, imgCompressConfig);
            const formData = new FormData();
            formData.append('files', compressedImg, image.file.name || 'image.jpeg');
            formData.append('ref', 'observation');
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
        const req: IObservationAPI = {
          id, label, description, meta_values: metaValues, geo, imageId
        };
        const { data: _data } = await axios.post('/api/observation/update', req);
        setData(old => ({
          ...old,
          attributes: {
            ...old.attributes,
            label: _data.data.attributes.label,
            description: _data.data.attributes.description,
            position: _data.data.attributes.position,
            image: _data.data.attributes.image,
          }
        }));
        setLabel(_data.data.attributes.label || '');
        setDescription(_data.data.attributes.description || '');
        setMetaValues((_data.data.attributes.meta_values || [])
          ?.map((m: XMeta_value) => ({ value: m.value, metadatum: `${m.metadatum?.data?.id}` })));
        handleToggleEdit();
      } catch (e) {
        addNote({ id: 'save', text: 'Could not save', warning: true });
      }
    }
    setLoading(false);
  };

  const handleResetEdit = () => {
    setMetaValues(defMeta);
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

  const handleLabel = (e: ChangeEvent<HTMLInputElement>) => setLabel(e.currentTarget.value);

  const handleDescription = (e: ChangeEvent<HTMLTextAreaElement>) =>
    setDescription(e.currentTarget.value);

  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.currentTarget.name;
    if (!edit || name == null || name === '') return;
    const value = isCheckbox(e.currentTarget)
      ? (e.currentTarget.checked ? 'yes' : 'no')
      : e.currentTarget.value;
    setMetaValues((old = []) => old
      .filter(m => `${m.metadatum}` !== `${name}`)
      .concat([{ value: (value || '')?.toLowerCase(), metadatum: `${name}` }]));
  };

  const getMetaVals = (id: string) => {
    const obsMeta = (metaValues || [])
      .filter(v => `${v?.metadatum}` === `${id}`)
      .map(v => (v?.value || '')?.toLowerCase())
      .filter(Boolean);
    const taxonMeta = (taxonAttr?.meta_values || [])
      .filter(v => `${v?.metadatum?.data?.id}` === `${id}`)
      .map(v => (v?.value || '')?.toLowerCase())
      .filter(Boolean);
    return obsMeta.length > 0 ? obsMeta : taxonMeta;
  };
  const handleListInput = (id?: string) => (e: ChangeEvent<HTMLSelectElement>) => {
    if (id == null || id === '' || !edit) return;
    setMetaValues((old = []) => old
      .filter((m) => (m.value || '')?.toLowerCase() !== (e?.target?.value || '')?.toLowerCase())
      .concat([{ metadatum: id, value: (e?.target?.value || '')?.toLowerCase() }]));
  };
  const handleClearListInput = (id: string, value: string) => () => edit &&
    setMetaValues((old = []) => old.filter(m => value == null || m.metadatum !== id ||
      (m.value || '')?.toLowerCase() !== (value || '')?.toLowerCase()));

  const handleFav = async () => {
    if (!navigator?.onLine) {
      addNote({ id: 'offline', text: 'You are currently offline', warning: true });
    } else {
      try {
        const numId = stringToInt(id);
        const req: IUserAPI = { fav_observation: numId };
        const { data: _data }: { data: IUserResREST; } = await axios.post('/api/user/update', req);
        setFaved(_data?.fav_observations?.some(f => `${f.id}` === `${id}`) || false);
      } catch (e) {
        addNote({ id: 'fav', text: 'Could not add favorite', warning: true });
      }
    }
  };

  useEffect(() => {
    setFaved(
      user?.attributes?.fav_observations?.data?.some(f => `${f.id}` === `${id}`) || false);
  }, [user?.attributes?.fav_observations?.data?.length, id]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'inherit';
      textAreaRef.current.style.height =
        `${Math.max(2 + textAreaRef.current.scrollHeight, 6 * 16)}px`;
    }
  }, [description]);

  return (
    <Map className={s.container} observations={[data]} draw={edit} extra={extraProps}
      crumb={{ label: type, link: `/observations/search/${type}` }}>
      <Head>
        <title key='title'>{type}: {attr?.label}</title>
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
          {edit &&
            <input className={s.fileInput} type='file' accept='image/*' capture='environment'
              onChange={handleFileChange} />}
          {edit &&
            <div className={s.uploadPrompt}>
              <FaCameraRetro className={s.icon} />
              {image?.url ? 'Added photo' : 'Add a photo'}
            </div>}
          <Img image={image?.url || attr?.image?.data} alt={label} imgClass={s.img} />
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
          <div>
            {(taxonAttr?.metadata?.data || [])
              .map((m) => {
                if (m?.id == null) return;
                const vals = getMetaVals(m.id);
                if (!edit && vals.length === 0) return;
                const attr = m?.attributes;
                const type = attr?.datatype === EnumXMetaType.yesno
                  ? 'checkbox'
                  : (attr?.datatype === EnumXMetaType.list ? EnumXMetaType.text : attr?.datatype);
                return (
                  <label key={m.id} className={c(s.inputGroup, type)}>
                    <div className={s.label}>{attr?.label}</div>
                    {attr?.datatype === EnumXMetaType.list
                      ? <div className={c(s.input, s.select, !edit && s.view)}>
                        {edit &&
                          <select className={s.input} onChange={handleListInput(m.id)}>
                            {[{ value: undefined }, ...(attr?.list_values || [])].map((v, ind) =>
                              <option key={ind} value={v?.value}>{v?.value}</option>)}
                          </select>}
                        <div className={s.selected}>
                          {vals.map(val => val != null &&
                            <div className={s.item} key={val}
                              onClick={handleClearListInput(m.id, val)}>
                              {val}{edit && <FaTimes className={s.icon} />}
                            </div>)}
                        </div>
                      </div>
                      : <input type={type} disabled={!edit} value={vals[0] || ''} name={m.id}
                        onChange={handleInput} className={s.input} checked={vals[0] === 'yes'} />}
                  </label>
                );
              })}
          </div>
          {taxonAttr?.label &&
            <div className={c(s.taxon, edit && s.disabled)}>
              <div className={s.title}>Taxon: {taxonAttr?.label}</div>
              {taxonImgList.length !== 0 && (taxonImgList.length > 1
                ? <Carousel sliderClass={s.slider} slideClass={s.slide}>{taxonImgList}</Carousel>
                : <div className={s.taxonImage}>
                  <Img image={taxonImgList} alt={taxonAttr.label} imgClass={s.img} />
                </div>)}
              {taxonAttr?.description &&
                <label className={s.inputGroup}>
                  <div className={s.label}>{taxonAttr?.label} description</div>
                  <div className={c(s.input, s.textarea)}>{taxonAttr?.description}</div>
                </label>}
              {taxonAttr?.species &&
                <label className={s.inputGroup}>
                  <div className={s.label}>{taxonAttr?.label} species</div>
                  <div className={s.input}>{taxonAttr?.species}</div>
                </label>}
              {(taxonAttr?.urls || []).filter(url => url.value).length > 0 &&
                <label className={s.inputGroup}>
                  <div className={s.label}>{taxonAttr?.label} links</div>
                  <div className={s.multiple}>
                    {taxonAttr?.urls?.filter(url => url.value).map(url =>
                      <a key={url.id} href={prependHttp(url.value || '')}
                        rel='noopener noreferrer' target='_blank' className={s.url}>
                        <div className={s.input}>{getUrlDomain(url.value)}</div>
                      </a>)}
                  </div>
                </label>}
            </div>}
        </div>
      </div>
      <Comments className={s.comments} comments={comments} id={id} type={type} />
    </Map>
  );
};

export default ObservationPage;

