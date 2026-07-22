import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { serialize } from 'cookie';
import errorLog from 'shared/utilities/errorLog';
import constants from 'shared/constants';

interface IProps {
  username?: string;
  password?: string;
  email?: string;
}

const registerUser = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, email, password }: IProps = req?.body;
  try {
    const { data: { user, jwt } } = await axios.post(
      `${constants.STRAPI.API}/api/auth/local/register`,
      { username, email, password }
    );
    return res
      .status(200)
      .setHeader('Set-Cookie', [serialize('jwt', jwt, constants.STRAPI.JWT({}))])
      .json(user);
  } catch (e) {
    const msg = errorLog(registerUser, e as Error);
    return res.status(500).json({ error: msg });
  }
};

export default registerUser;
