import { XCommentaryPostReq, XCommentary } from 'shared/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ICommentaryAPI } from 'shared/interfaces';
import isUserId from 'shared/utilities/api/isUserId';
import errorLog from 'shared/utilities/errorLog';
import getJwt from 'shared/utilities/api/getJwt';
import stringToInt from 'shared/utilities/stringToInt';
import constants from 'shared/constants';

const createOrUpdateCommentary = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { commentaryId, tripId, comments }: ICommentaryAPI = req?.body || {};
    if (comments == null || tripId == null) {
      throw new Error('no text or trip for commentary');
    }

    const headers = { headers: { Authorization: `Bearer ${getJwt(req)}` } };
    const { data: userData } = await axios.get(`${constants.STRAPI.API}/api/users/me`, headers);
    const creator = stringToInt(userData?.id);
    if (creator == null) { throw new Error('no creator id'); }
    const curatedComments = (comments || []).filter(c => c.text != null && c.text !== '');
    const newCommentary: XCommentaryPostReq =
      { data: { comments: curatedComments, creator, trip: stringToInt(tripId) } };

    if (commentaryId != null) {
      const { data: old }: { data: XCommentary; } = await axios.get(
        `${constants.STRAPI.API}/api/commentaries/${commentaryId}?populate=creator`,
        headers);
      const isCreator = await isUserId({ id: old?.data?.attributes?.creator?.data?.id, req });
      if (isCreator) {
        const { data } = await axios.put(
          `${constants.STRAPI.API}/api/commentaries/${commentaryId}?populate=*`,
          newCommentary,
          headers);
        return res.status(200).json(data);
      }
    } else {
      const { data } = await axios.post(
        `${constants.STRAPI.API}/api/commentaries?populate=*`,
        newCommentary,
        headers);
      return res.status(200).json(data);
    }
  } catch (e) {
    errorLog(createOrUpdateCommentary, e as Error);
    return res.status(400).end();
  }
};

export default createOrUpdateCommentary;
