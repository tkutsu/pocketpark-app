import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { serialize } from 'cookie';
import constants from 'shared/constants';
import errorLog from 'shared/utilities/errorLog';

interface IProps {
  username?: string;
  password?: string;
  email?: string;
}

const loginUser = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, email, password }: IProps = req?.body;
  try {
    const { data: { user, jwt } } = await axios.post(
      `${constants.STRAPI.API}/api/auth/local?populate=*`,
      { identifier: username || email, password }
    );
    return res
      .status(200)
      .setHeader('Set-Cookie', [serialize('jwt', jwt, constants.STRAPI.JWT({}))])
      .json(user);
  } catch (e) {
    const msg = errorLog(loginUser, e as Error);
    return res.status(500).json({ error: msg });
  }
};

export default loginUser;
