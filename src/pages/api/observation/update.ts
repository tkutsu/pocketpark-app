import { XObservation, XObservationPostReq } from 'shared/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { IObservationAPI } from 'shared/interfaces';
import isUserId from 'shared/utilities/api/isUserId';
import errorLog from 'shared/utilities/errorLog';
import getJwt from 'shared/utilities/api/getJwt';
import stringToInt from 'shared/utilities/stringToInt';
import constants from 'shared/constants';

const updateObservation = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const headers = { headers: { Authorization: `Bearer ${getJwt(req)}` } };
    const superAdminHeaders = { headers: { Authorization: `Bearer ${process.env.STRAPI_TOKEN}` } };
    const { id, meta_values, label, description, geo, imageId }: IObservationAPI = req?.body || {};
    const { data: old }: { data: XObservation } =
      await axios.get(
        `${constants.STRAPI.API}/api/observations/${id}?populate=creator`, superAdminHeaders);
    const isCreator = await isUserId({ id: old?.data?.attributes?.creator?.data?.id, req });
    if (!isCreator) { throw new Error('not the creator'); }
    const newObs: XObservationPostReq = { data: { label, description } };
    const image = stringToInt(imageId);
    if (image != null) { newObs.data.image = image; }
    if (geo?.latitude != null && geo?.longitude != null) { newObs.data.position = geo; }
    if (meta_values != null) { newObs.data.meta_values = meta_values; }

    const populate = '?&populate=position&populate=image&populate[1]=meta_values.metadatum';
    const { data } =
      await axios.put(`${constants.STRAPI.API}/api/observations/${id}${populate}`, newObs, headers);
    return res.status(200).json(data);
  } catch (e) {
    errorLog(updateObservation, e as Error);
    return res.status(400).end();
  }
};

export default updateObservation;
