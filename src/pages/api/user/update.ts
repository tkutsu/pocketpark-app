import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import getJwt from 'shared/utilities/api/getJwt';
import constants from 'shared/constants';
import errorLog from 'shared/utilities/errorLog';
import { IUserAPI, IUserResREST } from 'shared/interfaces';

const updateMeUser = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const headers = { headers: { Authorization: `Bearer ${getJwt(req)}` } };
    const { data }: { data: IUserResREST; } =
      await axios.get(`${constants.STRAPI.API}/api/users/me`, headers);
    if (data?.id == null) { throw new Error('no id'); }
    const reqData: IUserAPI = req?.body || {};
    const toggleFav = (oldFavs: number[] = [], newFav?: number) => {
      if (newFav == null) { return oldFavs; }
      return oldFavs.includes(newFav) ? oldFavs.filter(o => o !== newFav) : [...oldFavs, newFav];
    };
    const newData = {
      username: reqData.username || data.username,
      team: reqData.team != null ? reqData.team : data.team,
      team_radius: reqData.team_radius != null ? reqData.team_radius : data.team_radius,
      fav_observations: toggleFav(data?.fav_observations?.map(o => o.id), reqData?.fav_observation),
      fav_activities: toggleFav(data?.fav_activities?.map(o => o.id), reqData?.fav_activity),
      fav_trips: toggleFav(data?.fav_trips?.map(o => o.id), reqData?.fav_trip),
      fav_places: toggleFav(data?.fav_places?.map(o => o.id), reqData?.fav_place),
    };
    const { data: updatedData } = await axios.put(
      `${constants.STRAPI.API}/api/users-permissions/users/me`, newData, headers,
    );
    return res.status(200).json(updatedData);
  } catch (e) {
    const msg = errorLog(updateMeUser, e as Error);
    return res.status(500).json({ error: msg });
  }
};

export default updateMeUser;
