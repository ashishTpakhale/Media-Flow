export const getHeaders = (isMultipart = false) => {
  const authToken = localStorage.getItem('token') || 'your-auth-token';
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};