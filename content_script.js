// Create a link element for the CSS file
const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('style.css'); // Use the correct path to your CSS file

// Append the link element to the head of the web page
document.head.appendChild(link);


function createSearchBar(videoPlayer) {
    const searchBar = document.createElement('input');
    const clearAll = document.createElement('button');
    const myExtensionDiv = document.createElement("div");
    const searchBarWrapper = document.createElement("div");
    const secondaryElement = getElementDimensions('#secondary');
    const queueContainer = document.createElement('div');
    const loadingBar = document.createElement('div');
    console.log('Creating search bar...');

    searchBarWrapper.id = 'search-bar-wrapper';
    searchBar.id = 'search-bar'
    searchBar.type = 'text';
    searchBar.placeholder = 'Search for videos...';

    myExtensionDiv.style.display = 'flex'
    myExtensionDiv.style.flexDirection = 'column'
    myExtensionDiv.style.width = `${secondaryElement.width - 10}px`;
    myExtensionDiv.style.minHeight = '40px';
    myExtensionDiv.id = 'my-extension-div';

    //insert a clearall (x) button on the right side of the search bar
    clearAll.id = "clear-all"
    clearAll.innerHTML = 'x';    
    
    // Create the queue container element
    loadingBar.id='loading-ring';
    loadingBar.style.display = 'none';
    console.log('Creating queue container...');
    queueContainer.id = 'video-queue';
    
    // Insert the search bar and queue container next to the video player
    searchBarWrapper.appendChild(searchBar);
    searchBarWrapper.appendChild(clearAll);
    myExtensionDiv.appendChild(searchBarWrapper);
    myExtensionDiv.appendChild(queueContainer);
    queueContainer.appendChild(loadingBar);

    videoPlayer.parentNode.insertBefore(myExtensionDiv, videoPlayer.previousSibling); // inserting the div before the 'related' div
    console.log('Inserted search bar and queue container!');
    
    // Listen for the "Enter" key press in the search bar to trigger video search
    searchBar.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            document.querySelector('#secondary-inner').style.display = 'none';
            document.querySelector('#video-queue').style.display = 'initial';
            loadingBar.style.display = 'block';
            const searchTerm = searchBar.value.trim();
            if (searchTerm !== '') {
                searchVideos(searchTerm);
            }
        }
    });

    clearAll.addEventListener('click', () => {
        searchBar.value = '';
        console.log('Resetting UI...');
        document.querySelector('#secondary-inner').style.display = 'block';
        document.querySelector('#video-queue').style.display = 'none';
    });
}

function getElementDimensions(elementSelector) {
    const element = document.querySelector(elementSelector);
    if (!element) {
        return null;
    }

    const rect = element.getBoundingClientRect();
    const dimensions = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
    };

    return dimensions;
}

function searchVideos(searchTerm) {
    // Fetch search results using the my backend Express server

    const apiUrl = `https://firstapi.xxtrungxx.repl.co/get-result/${encodeURIComponent(searchTerm)}`

    console.log('Fetching search results...');
    // Make an AJAX request to the API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Process the search results and display them in the queue container
            const queueContainer = document.getElementById('video-queue');
            const loadingBar = document.getElementById('loading-ring');
            if (loadingBar != null) {
                loadingBar.style.display = 'hidden';
            }
            queueContainer.innerHTML = ''; // Clear existing queue

            data.forEach(item => {
                const videoId = item.id
                const videoTitle = item.title;
                let videoUploader = "" 
                // return channel title if defined, return "Artist" if undefined
                if (item.channelTitle == undefined) {
                    videoUploader = "Artist"
                } else {
                    videoUploader = item.channelTitle;
                }

                const videoThumbnail = item.thumbnail.thumbnails[0].url;
                const channelID = 'UC0WP5P-ufpRfjbNrmOWwLBQ';

                // Create a new video element for the search result
                const videoElement = createVideoElement(videoId, videoTitle, videoUploader, videoThumbnail, channelID);
                queueContainer.appendChild(videoElement);
            });
        })
        .catch((error) => {
            console.error('Error fetching search results:', error)
            const loadingBar = document.getElementById('loading-ring');
            const e = document.createElement('p')
            e.id="error"
            e.innerHTML=`An error was occured. Please refresh the page.`

            loadingBar.appendChild(e)
            loadingBar.id = ""   
        })
            
}


function createVideoElement(videoId, videoTitle, videoUploader, videoThumbnail, channelID) {
    const videoElement = document.createElement('div');
    const queueIcon = document.createElement('i');

    queueIcon.className = 'fa-solid fa-list';
    queueIcon.style.color = '#ffffff';

    // !!! modify the thumbnail size
    videoElement.className = 'video-item';
    videoElement.maxWidth = '100%';
    videoElement.style.marginBottom = '5px';
    videoElement.innerHTML = `
        <div style="display:flex; flex-direction:row; align-items:center;">
            <div style="width:200px; height:100px; border-radius:5px; object-position:center">
                <a href="https://www.youtube.com/watch?v=${videoId}" style="text-decoration: none"">
                    <img src="${videoThumbnail}" style="width:200px; height:100%; object-fit:contain" alt="${videoTitle}"/>
                </a>
            </div>
            <div style="display:flex; flex-direction:column; align-items:start; margin-left:15px">
                <a href="https://www.youtube.com/watch?v=${videoId}" style="color:white; margin-bottom:5px; width:100%; font-size:13px; text-decoration:none">
                    ${videoTitle}
                </a>
                <a href="https://www.youtube.com/channel/${channelID}" style="color:#aaaaaa; margin-bottom:8px; width:100%; font-size:11px; text-decoration:none">
                    ${videoUploader}
                </a>
            </div>
        </div>
        `;

    return videoElement;
}


function observeVideoChanges() {
    console.log('Observing video changes...');
    const intervalId = setInterval(() => {
        const videoPlayer = document.querySelector('#secondary-inner');
        if (videoPlayer) {
            console.log('Element found!');
            createSearchBar(videoPlayer);
            clearInterval(intervalId); // Stop the interval once the element is found
        }
    }, 1000); // Check every 1 second (adjust the interval as needed)

    document.addEventListener('yt-navigate-finish', () => {
        clearInterval(intervalId); // Clear the existing interval
        if (document.querySelector('#my-extension-div') === null) { //if not created the custom div, create one
            console.log('Already found custom div, stopped creating new one')
            observeVideoChanges();
        } // Reinitialize the interval to watch for the new video player
    });
}

window.onload = () => {
    observeVideoChanges();
};
