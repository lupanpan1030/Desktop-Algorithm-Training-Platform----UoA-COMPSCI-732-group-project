import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:6785',
  timeout: 10_000,
});
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // ✨ unify error shape
    return Promise.reject(
      new Error(err.response?.data?.message || err.message),
    );
  }
);
export default api;