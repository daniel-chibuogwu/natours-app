/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async tourId => {
  const stripe = Stripe(
    'pk_test_51P54QbE0LGbea54GKsLz0QLsSHv7kp3Mii62HBd6oWUcgaFXvDTwhwpT6tXGDHLvWZ8yxYP74YSIt17D8FLTBiXh00a6r1u6Ku',
  );
  // 1) Get checkout session from endpoint
  try {
    const res = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    );

    // 2) Create checkout form and charge the credit card
    return await stripe.redirectToCheckout({ sessionId: res.data.session.id });
  } catch (err) {
    console.log('error:', err);
    showAlert('error', err);
  }
};
