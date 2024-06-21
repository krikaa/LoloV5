document.addEventListener('DOMContentLoaded', () => {
    
    // Element declarations
    const articleContainer = document.getElementById('articles');
    const filterContainer = document.getElementById('filters');
    const feedInput = document.getElementById('feed-url');
    const filterDialog = document.getElementById('filterdialog');
    const filterboxButton = document.getElementById('show-filter');
    const filterCheckAllButton = document.getElementById('check-all');
    const filterUncheckAllButton = document.getElementById('uncheck-all');
    const filterApplyButton = document.getElementById('apply-filter');
    const feedContainer = document.getElementById('feeds');
    const feedboxButton = document.getElementById('feed-edit');
    const feedDialog = document.getElementById('feeddialog');
    const addFeedButton = document.getElementById('save-feed');
    const feedApplyButton = document.getElementById('apply-feed');

    // Content arrays
    let feeds = [];             // Stores all loaded feeds
    let checkedFeeds = [];      // Stores selected feed titles
    let checkedCategories = []; // Stores selected category names


    //---Loads all feeds, categories and feedlist + displays all loaded content
    async function loadFeeds() {
        try {
            // Load feeds
            const response = await fetch('/api/feeds');
            feeds = await response.json();
            checkedFeeds = feeds.map(feed => feed.title); // Set all feeds active

            // Clear containers
            feedContainer.innerHTML = '';
            filterContainer.innerHTML = '';
            const unsortedCategories = new Set();
            
            feeds.forEach(feed => {
                // Add feedlist to the sidebar
                const checkbox = document.createElement('div');
                if (feed.feedUrl && feed.title) {
                    checkbox.innerHTML = `
                        <span class="delete-feed" data-url="${feed.feedUrl}">&times;</span>
                        <input type="checkbox" id="${feed.title}" name="${feed.title}" checked>
                        <label for="${feed.title}">${feed.title} (${feed.feedUrl})</label><br>
                        `;
                }
                feedContainer.appendChild(checkbox);

                // Delete button on feeds
                checkbox.querySelector('.delete-feed').addEventListener('click', deleteFeed);
                
                // Load categories
                feed.items.forEach(item => {
                    if (item.categories && item.categories[0] && item.categories[0]._) {
                        // Add categories to set
                        item.categories.forEach(cat => unsortedCategories.add(cat._));
                    }
                    else {
                        // If category property does not exist
                        unsortedCategories.add(undefined);
                    }
                });
            });
            // Add sorted categories to the sidebar
            if (unsortedCategories.size > 0) {
                const categories = Array.from(unsortedCategories).sort(); // Sort the categories
                categories.forEach(category => {
                    const checkbox = document.createElement('div');
                    if (category == undefined) {
                        // If the category is undefined
                        checkbox.innerHTML = `
                        <input type="checkbox" id="${category}" name="" checked>
                        <label for="${category}">Uncategorised</label><br>
                        `;
                    }
                    else {
                        // If the category is defined
                        checkbox.innerHTML = `
                        <input type="checkbox" id="${category}" name="${category}" checked>
                        <label for="${category}">${category}</label><br>
                        `;
                    }
                    filterContainer.appendChild(checkbox);
                });
            }

            // Display the articles without any filters
            displayArticles(feeds, undefined, undefined);

        } catch (error) {
            console.error('Error loading feeds:', error);
        }
    };


    //---Function for displaying article preview boxes (takes in the whole feed, filters by feed title and by categoryname)
    function displayArticles(feeds, feedFilter, catFilter) {
        try {
            articleContainer.innerHTML = '';    // Empties current box window
            const articles = [];                // Temporary object to store filtered articles
            feeds.forEach(feed => {
                // Filters by feed or bypasses
                if (feedFilter == undefined || (feed.title && feedFilter.includes(feed.title))) {
                    feed.items.forEach(item => {
                        // Filters by categories or bypasses
                        if (catFilter == undefined ||
                            (catFilter.includes("") && !(item.categories)) ||
                            (catFilter.includes("") && item.categories[0]._ == undefined) ||
                            (item.categories && item.categories.some(cat => catFilter.includes(cat._)))
                        ) {
                            // Adds articles to object with feed and publishing date
                            if (item.pubDate) {
                                articles.push({
                                    ...item,
                                    pubDate: new Date(item.pubDate),
                                    feed: feed.title
                                });
                            }
                        }
                    });
                }
            });
            // Orders articles by publishing date
            articles.sort((a, b) => b.pubDate - a.pubDate);
            
            // Creates the article preview boxes
            articles.forEach(item => {
                const article = document.createElement('div');
                article.className = 'article';

                if (item.media && item.media[0] && item.media[0].$ && item.media[0].$.url && item.title && item.contentSnippet) {
                    // If both the image and article content exists
                    article.style.gridTemplateRows = '160px 40px 75px 20px 25px';
                    article.innerHTML = `
                    <button class="clickyimg" data-url="${item.link}"><img id="image" src="${item.media && item.media[0] && item.media[0].$ && item.media[0].$.url ? item.media[0].$.url : ''}" alt=""></button>
                    <button class="clickyheader" data-url="${item.link}">${item.title}</button>
                    <button class="clickydesc" data-url="${item.link}">${item.contentSnippet}</button>
                    <div class="details">Author: ${item.author ? item.author : 'Unknown'}</div>
                    <div class="details">From: ${item.feed}</div>
                `;} 
                else if (item.media && item.media[0] && item.media[0].$ && item.media[0].$.url) {
                    // If there is only an image
                    article.style.gridTemplateRows = '265px 10px 20px 25px';
                    article.innerHTML = `
                    <button class="clickyimg" data-url="${item.link}"><img id="image" src="${item.media && item.media[0] && item.media[0].$ && item.media[0].$.url ? item.media[0].$.url : ''}" alt=""></button>
                    <div></div>
                    <div class="details">Author: ${item.author ? item.author : 'Unknown'}</div>
                    <div class="details">From: ${item.feed}</div>
                `;} 
                else {
                    // Other cases
                    article.style.gridTemplateRows = '40px 235px 20px 25px';
                    article.innerHTML = `
                    <button class="clickyheader" data-url="${item.link}">${item.title}</button>
                    <button class="clickydesc" data-url="${item.link}">${item.contentSnippet}</button>
                    <div class="details">Author: ${item.author ? item.author : 'Unknown'}</div>
                    <div class="details">From: ${item.feed}</div>
                `;}
                articleContainer.appendChild(article);
            });
        } catch (error) {
            console.error('Error loading feeds:', error);
        }
    }


    //---Function that displays the article content on a modal
    function displayModal (content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';   // Make the modal visible

        // For correct textarea displaying (scales with window)
        const txtarea = modal.getElementsByTagName("textarea");
        for (let i = 0; i < txtarea.length; i++) {
            txtarea[i].style.height = (txtarea[i].scrollHeight) + "px";
            txtarea[i].readOnly = true;
        }
        window.addEventListener('resize', () => {
            for (let i = 0; i < txtarea.length; i++) {
                txtarea[i].style.height = "1px";
                txtarea[i].style.height = (txtarea[i].scrollHeight) + "px";
            }
        });

        // Close the modal with the button
        modal.querySelector('.close').onclick = function () {
            modal.style.display = 'none';
            document.body.removeChild(modal);
        };
        // Close the modal by clicking outside
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
                document.body.removeChild(modal);
            }
        }
    };


    //---Function for adding feeds
    async function addFeed() {
        const url = feedInput.value;
        if (!url|| !isValidUrl(url)) return; // Checks if input is a valid URL
        try {
            // Posts the feed URL
            await fetch('/api/feeds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            loadFeeds();    // Reloads all feeds, categories
        } catch (error) {
            console.error('Error adding feed:', error);
        }
    };


    //---Function for deleting feeds
    async function deleteFeed(event) {
        const url = event.target.getAttribute('data-url');
        try {
            // Deletes the feed URL
            await fetch('/api/feeds', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            loadFeeds();    // Reloads all feeds, categories
        } catch (error) {
            console.error('Error deleting feed:', error);
        }
    }


    //---Forces all buttons in the article preview grid to parse the content and display the article
    articleContainer.addEventListener('click', async (event) => {
        if (event.target.tagName === 'BUTTON') {
            const url = event.target.getAttribute('data-url');
            try {
                const response = await fetch('/api/parse', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url })
                });
                const data = await response.json();
                if (data.content == undefined) {
                    displayModal("Article not found.")
                }
                else {
                    displayModal(data.content);
                }
            } catch (error) {
                console.error('Error fetching article:', error);
            }
        }
    });


    //---Filterbox opening and closing
    // Open
    filterboxButton.onclick = function () {
        filterDialog.showModal();
    }
    // Close by button
    filterDialog.querySelector('.close').onclick = function () {
        filterDialog.close();
    };
    // Close by clicking outside
    function filterOnClick(event) {
        if (event.target === filterDialog) {
            filterDialog.close();
        }
    }
    filterDialog.addEventListener("click", filterOnClick);

    //---Filterbox buttons
    // Apply filter button, that gets checked categories, displays them and closes the dialog
    filterApplyButton.onclick = function () {
        checkedCategories = Array.from(filterContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.name);
        displayArticles(feeds, checkedFeeds, checkedCategories);
        filterDialog.close();
    };
    // Check all boxes
    filterCheckAllButton.onclick = function () {
        filterContainer.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = true);
    }
    // Uncheck all boxes
    filterUncheckAllButton.onclick = function () {
        filterContainer.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
    }


    //---Feedbox opening and closing
    // Open
    feedboxButton.onclick = function () {
        feedDialog.showModal();
    }
    // Close by button
    feedDialog.querySelector('.close').onclick = function () {
        feedDialog.close();
    };
    // Close by clicking outside
    function feedOnClick(event) {
        if (event.target === feedDialog) {
            feedDialog.close();
        }
    }
    feedDialog.addEventListener("click", feedOnClick);

    //---Feedbox buttons
    // Apply filter button, that gets checked feeds, displays them and closes the dialog
    feedApplyButton.onclick = function () {
        checkedFeeds = Array.from(feedContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.name);
        displayArticles(feeds, checkedFeeds, checkedCategories);
        feedDialog.close();
    };
    addFeedButton.addEventListener('click', addFeed);


    //---Function that checks if the given URL is valid
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Loads all feeds on startup
    loadFeeds();
});