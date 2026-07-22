import { NextApiRequest } from 'next';
import axios from 'axios';
import constants from 'shared/constants';
import getJwt from 'shared/utilities/api/getJwt';
import errorLog from 'shared/utilities/errorLog';

interface IProps {
  req?: NextApiRequest,
  id?: string,
}

const isUserId = async ({ id, req }: IProps) => {
  if (id == null || req == null) return false;
  try {
    const jwt = getJwt(req);
    const { data } = await axios.get(
      `${constants.STRAPI.API}/api/users/me`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    return data?.id === id;
  } catch (e) {
    errorLog(isUserId, e as Error);
    return false;
  }
};

export default isUserId;
