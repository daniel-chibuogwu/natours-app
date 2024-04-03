/* eslint-disable */
import '@babel/polyfill';
import axios from 'axios';
import { showAlert } from './alert';

// Type is either 'password' or 'data'
export const updateSettings = async (type, data) => {
  try {
    const urlFragment = type === 'password' ? 'updateMyPassword' : 'updateMe';
    const res = await axios.patch(
      `http://localhost:3000/api/v1/users/${urlFragment}`,
      data,
    );
    if (res.data.status === 'success') {
      showAlert(
        'success',
        `${type[0].toUpperCase() + type.slice(1)} updated successfully!`,
      );
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.response.data.message);
  }
};
