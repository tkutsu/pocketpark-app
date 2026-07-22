import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import getJwt from 'shared/utilities/api/getJwt';
import getData from 'shared/utilities/api/getData';
import constants from 'shared/constants';

const meUser = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const token = getJwt(req);
    const { data } = await axios.get(
      `${constants.STRAPI.API}/api/users/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (data?.id == null) { throw new Error('no id'); }
    const q = `
    query($id: ID!) {
      usersPermissionsUser(id: $id) { data { id attributes {
        username email team team_radius
    		fav_activities { data { id } }
    		fav_observations { data { id } }
    		fav_trips { data { id } }
    		fav_places { data { id } }
    		observations { data { id attributes {
          label
          position { latitude longitude }
          taxon { data { attributes { type } } }
        } } }
      } } }
    }`;
    const { usersPermissionsUser } = await getData({ q, params: { id: data?.id } });
    return res.status(200).json(usersPermissionsUser.data);
  } catch (e) {
    return res.status(500).end();
  }
};

export default meUser;
