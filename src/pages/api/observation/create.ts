import { XObservationPostReq } from 'shared/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { IObservationAPI } from 'shared/interfaces';
import errorLog from 'shared/utilities/errorLog';
import getJwt from 'shared/utilities/api/getJwt';
import stringToInt from 'shared/utilities/stringToInt';
import constants from 'shared/constants';

const createObservation = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const headers = { headers: { Authorization: `Bearer ${getJwt(req)}` } };
    const { data: userData } = await axios.get(`${constants.STRAPI.API}/api/users/me`, headers);
    const creatorId = userData?.id;
    const { meta_values, label, description, geo, imageId, taxonId }: IObservationAPI =
      req?.body || {};
    const creator = stringToInt(creatorId);
    const taxon = stringToInt(taxonId);
    if (taxon == null || creator == null) { throw new Error('no taxon or creator id'); }
    const newObs: XObservationPostReq = { data: { label, description, creator, taxon } };
    const image = stringToInt(imageId);
    if (image != null) { newObs.data.image = image; }
    if (geo?.latitude != null && geo?.longitude != null) { newObs.data.position = geo; }
    if (meta_values != null) { newObs.data.meta_values = meta_values; }
    const { data } = await axios.post(`${constants.STRAPI.API}/api/observations`, newObs, headers);
    return res.status(200).json(data);
  } catch (e) {
    errorLog(createObservation, e as Error);
    return res.status(400).end();
  }
};

export default createObservation;
