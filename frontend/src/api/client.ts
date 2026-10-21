import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(config => {
  const tenantId = localStorage.getItem('griddispatch_tenant_id') || 'tenant-grid-us-east';
  const token = localStorage.getItem('griddispatch_token');
  config.headers['X-Tenant-ID'] = tenantId;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
