module.exports = async (req, res) => {
    const fileUrl = 'https://storage.googleapis.com/danhvercel/updated_mrb_basins.json';
  
    try {
      // Fetch the JSON file from Google Cloud Storage
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch the file');
      }
  
      // Parse the JSON data from the file
      const data = await response.json();
  
      // Return the data (first 1000 characters as a sample, for example)
      res.status(200).json({ message: 'File loaded successfully', data: data.slice(0, 1000) });
    } catch (error) {
      console.error('Error fetching or parsing file:', error);
      res.status(500).json({ error: 'Failed to load the file' });
    }
  };
  