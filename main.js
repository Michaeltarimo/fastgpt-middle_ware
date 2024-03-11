require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = 'http://xn--pssr82jdve.io/api';

app.use(express.json());

// First, we need to determine and set the appropriate API key routing, there are two, Universal and App specific
app.use((req, res, next) => {
  const path = req.path.toLowerCase();
  if (path.includes('/knowledge_base')) {
    req.apiKey = process.env.KNOWLEDGE_BASE_API_KEY;
    req.baseUrl = process.env.KNOWLEDGE_BASE_API_URL;
  } else if (path.includes('/app')) {
    req.apiKey = process.env.APP_API_KEY;
    req.baseUrl = process.env.APP_API_URL;
  }
  next();
});



// We use this endpoint to create a knowledge base, e.g a user biography
app.post('/create-knowledge-base', async (req, res) => {
  // Assuming the knowledge base creation endpoint is something like /knowledge_base/create
  // and it expects a title and content in the body
  const createKbUrl = `${process.env.KNOWLEDGE_BASE_API_URL}/create`; // Adjust based on actual endpoint
  try {
    const response = await axios.post(createKbUrl, {
      title: "User's Biography",
      content: req.body.biography, // Assuming the biography text is sent in the request body
    }, {
      headers: { 'Authorization': `Bearer ${process.env.KNOWLEDGE_BASE_API_KEY}` },
    });
    
    // Save the knowledge base ID if needed for chatbot creation or reference
    const knowledgeBaseId = response.data.id; // Adjust based on actual response structure

    res.json({ success: true, knowledgeBaseId });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to create knowledge base.');
  }
});

// Endpoint for chatbot interactions, this calls the specific APP API
app.post('/chat-with-bot', async (req, res) => {
  // Assuming the chat interaction endpoint is something like /app/chat
  // and it expects a knowledgeBaseId and message in the body
  const chatUrl = `${process.env.APP_API_URL}/chat`; // Adjust based on actual endpoint
  try {
    const response = await axios.post(chatUrl, {
      knowledgeBaseId: req.body.knowledgeBaseId, // The ID of the knowledge base to use
      message: req.body.message, // The user's message to the chatbot
    }, {
      headers: { 'Authorization': `Bearer ${process.env.APP_API_KEY}` },
    });

    const chatResponse = response.data; // Adjust based on actual response structure
    res.json(chatResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to interact with the chatbot.');
  }
});

// Endpoint to start a conversation with the conversational interface
app.post('/api/v1/chat/completions', async (req, res) => {
  // Adjust the URL and headers as needed. Assuming APP_API_URL is set to 'https://base_url'
  const chatUrl = `${process.env.APP_API_URL}/api/v1/chat/completions`;
  try {
    // Modify the request body as needed to match the external API's expected format, from FastGPT documentation
    const requestBody = {
      chatId: req.body.chatId,
      stream: req.body.stream,
      detail: req.body.detail,
      variables: req.body.variables,
      messages: req.body.messages,
    };

    // Forwarding the modified request to the external API
    const response = await axios.post(chatUrl, requestBody, {
      headers: { 
        'Authorization': `Bearer ${process.env.APP_API_KEY}`, // Ensure this matches the target API's required token in the .env file
        'Content-Type': 'application/json'
      },
    });

    // Sending the response back to the original client
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to start conversation.');
  }
});

// Generic handler that forwards requests
app.use(async (req, res) => {
if (!req.apiKey) {
  return res.status(400).send('Unsupported request type.');
}

try {
  const { data } = await axios({
    method: req.method,
    url: `${req.baseUrl}${req.path}`,
    headers: {
      'Authorization': `Bearer ${req.apiKey}`,
      ...req.headers,
    },
    data: req.body,
  });

  res.json(data);
} catch (error) {
  console.error(error);
  res.status(500).send('An error occurred while processing your request.');
}
});



  // Endpoint to create a training order, imported from the fastGPT documentation
app.post('/create-training-order', async (req, res) => {
  const createTrainingOrderUrl = `${process.env.BASE_URL}/api/support/wallet/usage/createTrainingUsage`;
  try {
    const requestBody = {
      name: req.body.name, // Optional, custom order name e.g., "文档训练-fastgpt.docx"
    };

    // Forwarding the request to the external API
    const response = await axios.post(createTrainingOrderUrl, requestBody, {
      headers: { 
        'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}`, // Make sure this is set to the correct API key
        'Content-Type': 'application/json'
      },
    });

    // Sending the response back to the original client
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to create training order.');
  }
});

// Endpoint to get the list of datasets
app.get('/api/core/dataset/list', async (req, res) => {
  const parentId = req.query.parentId || ''; // Optional query parameter
  const getListUrl = `${process.env.BASE_URL}/core/dataset/list?parentId=${parentId}`;

  try {
    const response = await axios.get(getListUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}`, 
      },
    });

    // Forwarding the response back to the client
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to get dataset list.');
  }
});




  
  // Get Knowledge Base Details
  app.get('/api/core/dataset/detail', async (req, res) => {
    const { id } = req.query;
    try {
      const response = await axios.get(`${process.env.BASE_URL}/core/dataset/detail?id=${id}`, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to get dataset details.');
    }
  });
  
  
  // Delete a Knowledge Base
  app.delete('/api/core/dataset/delete', async (req, res) => {
    const { id } = req.query;
    try {
      const response = await axios.delete(`${process.env.BASE_URL}/core/dataset/delete?id=${id}`, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to delete dataset.');
    }
  });
  

  // Endpoint to create a dataset collection
app.post('/api/core/dataset/collection/create', async (req, res) => {
  try {
    // Forwarding the request to the designated API endpoint with the required data structure
    const response = await axios.post(`${process.env.BASE_URL}/core/dataset/collection/create`, req.body, {
      headers: { 
        'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}`, // Header for authorization
        'Content-Type': 'application/json' // Header to indicate the type of the content
      },
    });

    // Sending back the response from the API to the client
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to create dataset collection.');
  }
});

  
  // Endpoint to create a knowledge base
app.post('/api/core/dataset/create', async (req, res) => {
  const createKnowledgeBaseUrl = `${process.env.KNOWLEDGE_BASE_API_URL}/create`; // Ensure this URL is correct
  try {
    // The request body directly mirrors the CURL command's JSON structure
    const requestBody = {
      parentId: req.body.parentId,
      type: "dataset",
      name: req.body.name,
      intro: req.body.intro,
      avatar: req.body.avatar,
      vectorModel: req.body.vectorModel,
      agentModel: req.body.agentModel,
    };

    // Forwarding the request to the specified URL
    const response = await axios.post(createKnowledgeBaseUrl, requestBody, {
      headers: { 
        'Authorization': `Bearer ${process.env.KNOWLEDGE_BASE_API_KEY}`, // Ensure this matches the required API key
        'Content-Type': 'application/json'
      },
    });

    // Sending the response back to the client
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to create knowledge base.');
  }
});


app.post('/api/core/dataset/collection/create/text', async (req, res) => {
  // Extracting data from the request body
  const {
    text,
    datasetId,
    parentId,
    name,
    trainingType,
    chunkSize,
    chunkSplitter,
    qaPrompt,
    metadata
  } = req.body;

  try {
    // Forwarding the request to the specified API endpoint with the extracted data
    const response = await axios.post(`${process.env.BASE_URL}/core/dataset/collection/create/text`, {
      text,
      datasetId,
      parentId,
      name,
      trainingType,
      chunkSize,
      chunkSplitter,
      qaPrompt,
      metadata
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}`, // Using the provided authorization token
        'Content-Type': 'application/json' // Setting the content type as JSON
      },
    });

    // Sending the API response back to the client
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to create text content in dataset collection.');
  }
});


  
  // Get Collection List
  app.post('/get-collection-list', async (req, res) => {
    const getCollectionListUrl = `${BASE_URL}/core/dataset/collection/list`;
    try {
      const response = await axios.post(getCollectionListUrl, req.body, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to get collection list.');
    }
  });
  
  // Get Collection Details
  app.get('/get-collection-details', async (req, res) => {
    const collectionId = req.query.collectionId;
    const getCollectionDetailsUrl = `${BASE_URL}/core/dataset/collection/detail?id=${collectionId}`;
    try {
      const response = await axios.get(getCollectionDetailsUrl, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to get collection details.');
    }
  });
  
  // Modify Collection Information
  app.put('/update-collection', async (req, res) => {
    const updateCollectionUrl = `${BASE_URL}/core/dataset/collection/update`;
    try {
      const response = await axios.put(updateCollectionUrl, req.body, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to update collection.');
    }
  });
  
  // Delete a Collection
  app.delete('/delete-collection', async (req, res) => {
    const collectionId = req.query.collectionId;
    const deleteCollectionUrl = `${BASE_URL}/core/dataset/collection/delete?id=${collectionId}`;
    try {
      const response = await axios.delete(deleteCollectionUrl, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to delete collection.');
    }
  });
  
  // Add Data to a Collection in Batches
  app.post('/add-data-to-collection', async (req, res) => {
    const addDataToCollectionUrl = `${BASE_URL}/core/dataset/data/pushData`;
    try {
      const response = await axios.post(addDataToCollectionUrl, req.body, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to add data to collection.');
    }
  });
  
  // Get Data List of a Collection
  app.post('/get-data-list', async (req, res) => {
    const getDataListUrl = `${BASE_URL}/core/dataset/data/list`;
    try {
      const response = await axios.post(getDataListUrl, req.body, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to get data list.');
    }
  });
  
  // Get Details of a Single Piece of Data
  app.get('/get-data-details', async (req, res) => {
    const dataId = req.query.dataId;
    const getDataDetailsUrl = `${BASE_URL}/core/dataset/data/detail?id=${dataId}`;
    try {
      const response = await axios.get(getDataDetailsUrl, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to get data details.');
    }
  });
  
  // Modify a Single Piece of Data
  app.put('/update-data', async (req, res) => {
    const updateDataUrl = `${BASE_URL}/core/dataset/data/update`;
    try {
      const response = await axios.put(updateDataUrl, req.body, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to update data.');
    }
  });
  
  // Delete a Single Piece of Data
  app.delete('/delete-data', async (req, res) => {
    const dataId = req.query.dataId;
    const deleteDataUrl = `${BASE_URL}/core/dataset/data/delete?id=${dataId}`;
    try {
      const response = await axios.delete(deleteDataUrl, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to delete data.');
    }
  });
  
  // Search Test
  app.post('/search-test', async (req, res) => {
    const searchTestUrl = `${BASE_URL}/core/dataset/searchTest`;
    try {
      const response = await axios.post(searchTestUrl, req.body, {
        headers: { 'Authorization': `Bearer ${process.env.FASTGPT_API_KEY}` },
      });
  
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Failed to perform search test.');
    }
  });


  // for sharing link identity authentication
app.use('/shareAuth', async (req, res, next) => {
  const { token } = req.body;
  if (token === 'fastgpt') {
    return res.json({ success: true, data: { uid: "user1" } });
  } else {
    return res.status(401).json({ success: false, message: "Authentication failed" });
  }
});

// Endpoint to initialize the shared link
app.post('/shareAuth/init', async (req, res) => {
  res.json({ success: true });
});

// Endpoint to authenticate before starting a dialogue
app.post('/shareAuth/start', async (req, res) => {
  res.json({ success: true });
});

// Endpoint to report dialogue results
app.post('/shareAuth/finish', async (req, res) => {
  res.json({ success: true });
});

// Generic handler that forwards requests
app.use(async (req, res) => {
  if (!req.apiKey) {
    return res.status(400).send('Unsupported request type.');
  }

  try {
    const response = await axios({
      method: req.method.toLowerCase(), // Ensure the method is in lowercase
      url: `${req.baseUrl}${req.path}`,
      headers: {
        'Authorization': `Bearer ${req.apiKey}`,
        // Explicitly set necessary headers here
      },
      data: req.body,
    });

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing your request.');
  }
});


// Generic handler that forwards requests
app.use(async (req, res) => {
  if (!req.apiKey) {
    return res.status(400).send('Unsupported request type.');
  }

  try {
    const { data } = await axios({
      method: req.method,
      url: `${req.baseUrl}${req.path}`,
      headers: {
        'Authorization': `Bearer ${req.apiKey}`,
        ...req.headers,
      },
      data: req.body,
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing your request.');
  }
});


 // Define your API endpoints here
  
 app.listen(PORT, () => {
  console.log(`Unified API Gateway is running on port ${PORT}`);
});
