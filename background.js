let find = function() {

    var getWayBack = function(url) {
        let apiUrl = 'https://web.archive.org/cdx/search/cdx?url=' + encodeURIComponent(url);
        let xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl, false);
        xhr.send(null);
        var response = xhr.responseText;
        response = response.split('\n')[0].split(' ');
        let timestamp = response[1];
        let archivedUrl = response[2];
        let wayBackUrl = 'https://web.archive.org/web/' + timestamp + '/' + archivedUrl.replace(/^http:/, 'https:');

        xhr.open('GET', wayBackUrl, false);
        xhr.send(null);
        let regex = /<span[^>]+id="eow-title"[^>]+>([^<]+)<\/span>/;
        let videoTitle = xhr.responseText.match(regex)[1].trim();
        return videoTitle;
    };

    let block = document.getElementById('player-unavailable');
    let classes = Object.keys(block.classList).map(function(k) { return block.classList[k];});
    console.log(classes.indexOf('hid'));
    if (classes.indexOf('hid') === -1) {
        // we're on page with unavailable video
        let videoTitle = getWayBack(document.location.href);
        window.location.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(videoTitle);
    }

};

let wrapper = function() {
    chrome.tabs.executeScript({code:'(' + find.toString() + ')();'});
};

let activateCallback = function(tabId) {
    let tab = chrome.tabs.get(tabId, function(tab) {
        let url = tab.url;
        if (url.match(/^https?:\/\/\w*\.?youtube\.com\/?.*$/)) {
          chrome.browserAction.setIcon({path: "icon.png"}); 
          chrome.storage.local.set({is_active: true});
        } else {
          chrome.browserAction.setIcon({path: "icon_disabled.png"});
          chrome.storage.local.set({is_active: false});
        }
    });
};

chrome.tabs.onActivated.addListener(function(activeInfo) {
    let tabId = activeInfo.tabId;
    activateCallback(tabId);
});

chrome.tabs.onUpdated.addListener(function(tabId) {
    activateCallback(tabId);
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.storage.local.get('is_active', function(items) {
        if (items['is_active'] === true) {
            wrapper();
        }
    });
});

