// Module declarations
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Define the RSS parser, that also keeps the media:content field (containing the thumbnail image)
const RSSParser = require('rss-parser');
const parser = new RSSParser({
    customFields: {
      item: [
        ['media:content', 'media', {keepArray: true}],
      ]
    }
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Initial feed list
let feeds = [
    'https://flipboard.com/@raimoseero/feed-nii8kd0sz.rss'
];

// Fetch all feeds
app.get('/api/feeds', async (req, res) => {
    try {
        const allFeeds = await Promise.all(feeds.map(url => parser.parseURL(url)));
        res.json(allFeeds);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Add new feed
app.post('/api/feeds', (req, res) => {
    const { url } = req.body;
    try {
        new URL(url); // This will throw an error if the URL is invalid
    } catch (_) {
        return res.status(400).json({ error: 'Invalid URL' });
    }
    // Add feed to the list
    feeds.push(url);
    res.status(201).send('Feed added');
});

// Delete feed
app.delete('/api/feeds', (req, res) => {
    const { url } = req.body;
    feeds = feeds.filter(feed => feed !== url);
    res.status(200).send('Feed removed');
});

// Article parser
app.post('/api/parse', async (req, res) => {
    try {
        const { url } = req.body;
        const response = await axios.post('https://uptime-mercury-api.azurewebsites.net/webparser', { url });
        res.json(response.data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});
