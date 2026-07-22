import { XTripPostReq } from 'shared/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ITripAPI } from 'shared/interfaces';
import errorLog from 'shared/utilities/errorLog';
import getJwt from 'shared/utilities/api/getJwt';
import stringToInt from 'shared/utilities/stringToInt';
import constants from 'shared/constants';

const createTrip = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const headers = { headers: { Authorization: `Bearer ${getJwt(req)}` } };
    const { data: userData } = await axios.get(`${constants.STRAPI.API}/api/users/me`, headers);
    const creatorId = userData?.id;
    const { obsIds, path, imageId, label, description }: ITripAPI = req?.body || {};
    const creator = stringToInt(creatorId);
    if (creator == null) { throw new Error('no creator id'); }
    const newTrip: XTripPostReq = { data: { label, description, creator } };
    const image = stringToInt(imageId);
    if (image != null) { newTrip.data.image = image; }
    const obsList = obsIds?.map(stringToInt).filter((id): id is number => id != null);
    if (obsList != null) { newTrip.data.observations = obsList; }
    if ((path || []).length > 0) {
      newTrip.data.path = path?.filter(p => p?.latitude != null && p?.longitude != null);
    }
    const { data } = await axios.post(`${constants.STRAPI.API}/api/trips`, newTrip, headers);
    return res.status(200).json(data);
  } catch (e) {
    errorLog(createTrip, e as Error);
    return res.status(400).end();
  }
};

export default createTrip;
