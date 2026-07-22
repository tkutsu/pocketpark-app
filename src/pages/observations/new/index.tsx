import { useState, ChangeEvent, useEffect, useRef } from 'react';
import { GetStaticProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import prependHttp from 'prepend-http';
import { FaCameraRetro, FaRegSave, FaTimes } from 'react-icons/fa';
import Img from 'components/Img';
import Map from 'components/Map';
import Carousel from 'components/Carousel';
import LoadWrapper from 'components/LoadWrapper';
import getData, { IExtraProps } from 'shared/utilities/api/getData';
import { useRedisUserContext } from 'shared/utilities/contextRedisUser';
import { XTaxon, IObservationAPI, EnumDrawType, IMapContext, Xuser, EnumXMetaType, XObservation } from 'shared/interfaces';
import { isCheckbox } from 'shared/utilities/isAssertions';
import { useMapContext } from 'shared/utilities/contextMap';
import { useNoteContext } from 'shared/utilities/contextNotes';
import isValidImageType from 'shared/utilities/isValidImageType';
import { imgCompressConfig } from 'shared/constants';
import c from 'shared/utilities/classname';
import s from './index.module.scss';

export const getStaticProps: GetStaticProps = async () => {
  const q = `{ taxons { data { id attributes {
    images { data { id attributes { url height width } } }
    label species description urls { id value }
    metadata { data { id attributes {
      label datatype description list_values { value } icon { data { id } }
    } } }
    meta_values { id value metadatum { data { id } } }
  } } } }`;
  const { taxons, extraProps } = await getData({ q, withPark: true });
  const dataProps = taxons?.data || [];
  return { props: { dataProps, extraProps }, revalidate: 1 };
};

interface IProps {
  dataProps: XTaxon['data'][];
  extraProps: IExtraProps;
}
const ObservationPage: NextPage<IProps> = ({ dataProps, extraProps }) => {
  const [taxon, setTaxon] = useState<XTaxon['data'] | undefined>();
  const [metaValues, setMetaValues] = useState<IObservationAPI['meta_values']>([]);
  const { mapData, setMapData } = useMapContext();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<{ file?: File, url?: string; }>({});
  const { addNote } = useNoteContext();
  const router = useRouter();
  const { user } = useRedisUserContext();
  const canSave = !loading && label != null && label !== '';
  const taxonImgList = (taxon?.attributes?.images?.data || []).filter(Boolean);

  const handleUpload = async () => {
    setLoading(true);
    const geo = (mapData?.drawTotal || [])[0];
    if (geo?.latitude == null || geo?.longitude == null) {
      addNote({ id: 'save', text: 'Please add a map marker', warning: true });
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
        const req: IObservationAPI = {
          meta_values: metaValues, label, description, geo, taxonId: taxon?.id, imageId
        };
        const { data } = await axios.post('/api/observation/create', req) as { data: XObservation; };
        data?.data?.id != null && router.push(`/observations/${data?.data?.id}`);
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

  const handleTaxon = (e: ChangeEvent<HTMLSelectElement>) => {
    const taxon = dataProps.find(t => t?.attributes?.label === e?.currentTarget?.value);
    const defData = taxon?.attributes?.meta_values
      ?.map(m => ({ value: (m.value || '')?.toLowerCase(), metadatum: m.metadatum?.data?.id }));
    setTaxon(taxon);
    setLabel(old => taxon?.attributes?.label || old);
    setMetaValues(defData || []);
  };

  const handleLabel = (e: ChangeEvent<HTMLInputElement>) => setLabel(e.currentTarget.value);
  const handleDescription = (e: ChangeEvent<HTMLTextAreaElement>) =>
    setDescription(e.target.value);
  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = e.target.name;
    if (name == null || name === '') return;
    const value = isCheckbox(e.target)
      ? (e.target.checked ? 'yes' : 'no')
      : e.target.value;
    setMetaValues((old = []) => old
      .filter(m => m.metadatum !== name)
      .concat([{ metadatum: name, value: (value || '')?.toLowerCase() }]));
  };
  const handleListInput = (id?: string) => (e: ChangeEvent<HTMLSelectElement>) => {
    if (id == null || id === '' || e?.target?.value == null) return;
    setMetaValues((old = []) => old
      .filter((m) => e?.target?.value != null &&
        (m.value || '')?.toLowerCase() !== (e?.target?.value || '')?.toLowerCase())
      .concat([{ metadatum: id, value: (e?.target?.value || '')?.toLowerCase() }]));
  };
  const handleClearListInput = (id: string, value: string) => () =>
    setMetaValues((old = []) => old.filter(m => value == null || m.metadatum !== id ||
      (m.value || '')?.toLowerCase() !== (value || '')?.toLowerCase()));

  const getMetaVals = (id: string) => (metaValues || [])
    .filter(v => v?.metadatum === id && v?.value != null)
    .map(v => (v?.value || '')?.toLowerCase());

  useEffect(() => {
    const _mapData: IMapContext = { drawType: EnumDrawType.point };
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
    <Map draw extra={extraProps} className={s.container}>
      <Head>
        <title key='title'>New observation</title>
      </Head>
      <div className={'title'}>{label}</div>
      <LoadWrapper className={s.buttons} isLoading={loading}>
        <button className={c(s.button, !canSave && s.disabled, 'button')}
          onClick={handleUpload} disabled={!canSave}>
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
            <div className={s.label}>Taxon</div>
            <select className={s.input} value={taxon?.attributes?.label ?? ''} onChange={handleTaxon}>
              {[{ id: -1, attributes: { label: '' } }, ...dataProps].map(v =>
                <option key={v?.id} value={v?.attributes?.label}>{v?.attributes?.label}</option>)}
            </select>
          </label>
          {taxon != null &&
            <div>
              <label className={s.inputGroup}>
                <div className={s.label}>Label</div>
                <input type='text' onChange={handleLabel} value={label} className={s.input} />
              </label>
              <label className={s.inputGroup}>
                <div className={s.label}>Description</div>
                <textarea onChange={handleDescription} ref={textAreaRef} value={description}
                  className={c(s.input, s.textarea)} />
              </label>
              {(taxon?.attributes?.metadata?.data || []).map((m) => {
                if (m?.id == null) return;
                const attr = m?.attributes;
                const vals = getMetaVals(m.id);
                const type = attr?.datatype === EnumXMetaType.yesno
                  ? 'checkbox'
                  : (attr?.datatype === EnumXMetaType.list ? EnumXMetaType.text : attr?.datatype);
                return (
                  <label key={m.id} className={c(s.inputGroup, type)}>
                    <div className={s.label}>{attr?.label}</div>
                    {attr?.datatype === EnumXMetaType.list
                      ? <div className={c(s.input, s.select)}>
                        <select className={s.input} onChange={handleListInput(m.id)}>
                          {[{ value: undefined }, ...(attr?.list_values || [])].map((v, ind) =>
                            <option key={ind} value={v?.value}>{v?.value}</option>)}
                        </select>
                        <div className={s.selected}>
                          {vals.map(val => val != null &&
                            <div className={s.item} key={val}
                              onClick={handleClearListInput(m.id, val)}>
                              {val}<FaTimes className={s.icon} />
                            </div>)}
                        </div>
                      </div>
                      : <input type={type} value={vals[0] || ''} onChange={handleInput}
                        name={m.id} className={s.input} checked={vals[0] === 'yes'} />}
                  </label>
                );
              })}
              {taxon?.attributes?.label &&
                <div className={s.taxon}>
                  <div className={s.title}>{taxon?.attributes?.label}</div>
                  {taxonImgList.length !== 0 && (taxonImgList.length > 1
                    ? <Carousel sliderClass={s.slider} slideClass={s.slide}>{taxonImgList}</Carousel>
                    : <div className={s.taxonImage}>
                      <Img image={taxonImgList} alt={taxon?.attributes?.label} imgClass={s.img} />
                    </div>)}
                  {taxon?.attributes?.description &&
                    <label className={s.inputGroup}>
                      <div className={s.label}>{taxon?.attributes?.label} description</div>
                      <div className={c(s.input, s.textarea)}>{taxon?.attributes?.description}</div>
                    </label>}
                  {taxon?.attributes?.species &&
                    <label className={s.inputGroup}>
                      <div className={s.label}>{taxon?.attributes?.label} species</div>
                      <div className={s.input}>{taxon?.attributes?.species}</div>
                    </label>}
                  {(taxon?.attributes?.urls || []).filter(url => url.value).length > 0 &&
                    <label className={s.inputGroup}>
                      <div className={s.label}>{taxon?.attributes?.label} links</div>
                      <div className={s.multiple}>
                        {taxon?.attributes?.urls?.filter(url => url.value).map(url =>
                          <a key={url.id} href={prependHttp(url.value || '')}
                            rel='noopener noreferrer' target='_blank' className={s.url}>
                            <div className={s.input}>{url.value}</div>
                          </a>)}
                      </div>
                    </label>}
                </div>}
            </div>}
        </div>
      </div>
    </Map >
  );
};

export default ObservationPage;

