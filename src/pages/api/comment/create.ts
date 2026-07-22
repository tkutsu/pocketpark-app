import { EnumType, XCommentPostReq } from 'shared/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { ICommentAPI } from 'shared/interfaces';
import errorLog from 'shared/utilities/errorLog';
import getJwt from 'shared/utilities/api/getJwt';
import stringToInt from 'shared/utilities/stringToInt';
import constants from 'shared/constants';

const createComment = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id, type, comment }: ICommentAPI = req?.body || {};
    if (!comment || !type || id == null) { throw new Error('no text, id, or type for comment'); }

    const headers = { headers: { Authorization: `Bearer ${getJwt(req)}` } };
    const { data: userData } = await axios.get(`${constants.STRAPI.API}/api/users/me`, headers);
    const creator = stringToInt(userData?.id);
    if (creator == null) { throw new Error('no creator id'); }
    const newComment: XCommentPostReq = { data: { text: comment, creator } };

    if (type === EnumType.trips) { newComment.data.trip = stringToInt(id); }
    else if (type === EnumType.activities) { newComment.data.activity = stringToInt(id); }
    else if (type === EnumType.park) { newComment.data.place = stringToInt(id); }
    else if (type === EnumType.animals || type === EnumType.plants) {
      newComment.data.observation = stringToInt(id);
    } else { throw new Error('wrong comment type'); }

    const { data } = await axios.post(
      `${constants.STRAPI.API}/api/comments?populate=*`,
      newComment,
      headers);
    return res.status(200).json(data);
  } catch (e) {
    errorLog(createComment, e as Error);
    return res.status(400).end();
  }
};

export default createComment;
