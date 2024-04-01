/* eslint-disable */

const login = async (email, password) => {
  try {
    const res = await axios.post('http://localhost:3000/api/v1/users/login', {
      email,
      password,
    });
    if (res.data.status === 'success') {
      alert('Logged in successfully!');
      // Routing user to the homepage to refresh and show updated nav bar
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    console.log(err);
    alert(err.response.data.message);
  }
};

document.querySelector('.form').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  login(email, password);
});
