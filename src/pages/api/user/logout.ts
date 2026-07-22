import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import constants from 'shared/constants';

const logoutUser = async (req: NextApiRequest, res: NextApiResponse) => {
  return res
    .status(200)
    .setHeader('Set-Cookie', [serialize('jwt', '', constants.STRAPI.JWT({ remove: true }))])
    .end();
};

export default logoutUser;
