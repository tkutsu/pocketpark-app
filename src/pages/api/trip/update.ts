import { XTrip, XTripPostReq } from 'shared/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ITripAPI } from 'shared/interfaces';
import isUserId from 'shared/utilities/api/isUserId';
import errorLog from 'shared/utilities/errorLog';
import getJwt from 'shared/utilities/api/getJwt';
import stringToInt from 'shared/utilities/stringToInt';
import constants from 'shared/constants';

const updateTrip = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const headers = { headers: { Authorization: `Bearer ${getJwt(req)}` } };
    const superAdminHeaders = { headers: { Authorization: `Bearer ${process.env.STRAPI_TOKEN}` } };
    const { id, obsIds, imageId, path, label, description }: ITripAPI = req?.body || {};
    const { data: old }: { data: XTrip } =
      await axios.get(
        `${constants.STRAPI.API}/api/trips/${id}?populate=creator`, superAdminHeaders);
    const isCreator = await isUserId({ id: old?.data?.attributes?.creator?.data?.id, req });
    if (!isCreator) { throw new Error('not the creator'); }
    const newTrip: XTripPostReq = { data: { label, description } };
    const image = stringToInt(imageId);
    if (image != null) { newTrip.data.image = image; }
    const obsList = obsIds?.map(stringToInt).filter((id): id is number => id != null);
    if ((obsList || []).length > 0) { newTrip.data.observations = obsList; }
    if ((path || []).length > 0) {
      newTrip.data.path = path?.filter(p => p?.latitude != null && p?.longitude != null);
    }
    const { data } =
      await axios.put(`${constants.STRAPI.API}/api/trips/${id}?populate=*`, newTrip, headers);
    return res.status(200).json(data);
  } catch (e) {
    errorLog(updateTrip, e as Error);
    return res.status(400).end();
  }
};

export default updateTrip;
