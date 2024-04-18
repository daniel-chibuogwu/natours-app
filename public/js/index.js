/* eslint-disable */

import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookNowBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault(); // prevents the default which is a full page refresh
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm) {
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();

    // Creating a multipart/form-data
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    console.log(form);

    updateSettings('data', form);
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    const savePasswordBtn = document.querySelector('.btn--save-password');
    const passwordCurrentInput = document.getElementById('password-current');
    const newPasswordInput = document.getElementById('password');
    const newPasswordConfirmInput = document.getElementById('password-confirm');

    savePasswordBtn.textContent = 'Updating...';

    await updateSettings('password', {
      passwordCurrent: passwordCurrentInput.value,
      newPassword: newPasswordInput.value,
      newPasswordConfirm: newPasswordConfirmInput.value,
    });

    // RESETTING THE FIELDS
    savePasswordBtn.textContent = 'Save password';
    passwordCurrentInput.value = '';
    newPasswordInput.value = '';
    newPasswordConfirmInput.value = '';
  });
}

if (bookNowBtn) {
  bookNowBtn.addEventListener('click', e => {
    e.preventDefault();

    const tourID = bookNowBtn.dataset.tourId;
    console.log('Tour ID', tourID);
  });
}
