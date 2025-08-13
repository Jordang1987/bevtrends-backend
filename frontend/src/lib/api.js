import axios from 'axios';
import Constants from 'expo-constants';
const baseURL = Constants.expoConfig?.extra?.apiBase || 'http://localhost:3001';
export default axios.create({ baseURL, timeout: 15000 });
