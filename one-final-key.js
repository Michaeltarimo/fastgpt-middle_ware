app.use('/api/:serviceAction', async (req, res) => {
    const { serviceAction } = req.params; // This could be 'create', 'delete', 'list', etc.
    const servicePath = determineServicePath(serviceAction, req.body); // Function to map action to path
    const apiKey = determineApiKey(servicePath); // Function to choose API key based on the path
    const baseUrl = determineBaseUrl(servicePath); // Function to choose base URL based on the path
  
    try {
      const axiosConfig = {
        method: req.method.toLowerCase(),
        url: `${baseUrl}${servicePath}`,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...req.headers,
          'host': '', // Clear the host header to avoid conflicts
        },
        data: req.body,
      };
  
      const response = await axios(axiosConfig);
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(error.response?.status || 500).send(error.message);
    }
  });
  