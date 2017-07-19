/**
 * MIT License
 *
 * Copyright (c) 2017 Timofey Klyubin
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 **/


let find = function() {

    var getWayBack = function(url) {
        let apiUrl = 'https://web.archive.org/cdx/search/cdx?url=' + encodeURIComponent(url);
        let xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl, false);
        xhr.send(null);
        var response = xhr.responseText;
        if (response.trim().length == 0) {
            return false;
        }
        response = response.split('\n')[0].split(' ');
        let timestamp = response[1];
        let archivedUrl = response[2];
        let wayBackUrl = 'https://web.archive.org/web/' + timestamp + '/' + archivedUrl.replace(/^http:/, 'https:');

        xhr.open('GET', wayBackUrl, false);
        xhr.send(null);
        let regex = /<span[^>]+id="eow-title"[^>]+>([^<]+)<\/span>/;
        let matches = xhr.responseText.match(regex); 
        if (!matches) {
            return false;
        }
        let videoTitle = matches[1].trim();
        return videoTitle;
    };

    let block = document.getElementById('player-unavailable');
    let classes = Object.keys(block.classList).map(function(k) { return block.classList[k];});
    if (classes.indexOf('hid') === -1) {
        // we're on page with unavailable video
        let videoTitle = getWayBack(document.location.href);
        if (!videoTitle) {
            return 'no';
        }
        window.location.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(videoTitle);
    }
    return 'yes';

};

let setIcon = function(path, tabId) {
    chrome.windows.getLastFocused(null, function(window) {
        chrome.tabs.getSelected(function(tab) {
            chrome.browserAction.setIcon({
                'path': path
            });
        });
    });

    chrome.tabs.query({}, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
            chrome.browserAction.setIcon({
                path: (tabs[i].id == tabId ? path : 'icon_disabled.png'), 
                tabId: tabs[i].id
            });
        }
    });
};

let wrapper = function(tabId) {
    chrome.tabs.executeScript({code:'(' + find.toString() + ')();'}, function(r) {
        if (r == 'no') {
            setIcon("icon_sad.png", tabId);
        }
    });
};

let activateCallback = function(tabId) {
    let tab = chrome.tabs.get(tabId, function(tab) {
        let url = tab.url;
        if (url.match(/^https?:\/\/\w*\.?youtube\.com\/?.*$/)) {
            chrome.storage.local.get(['is_waiting'], function(items) {
                if (items['is_waiting'] == true) {
                    setIcon("icon_waiting.png", tabId);
                } else {
                    setIcon("icon.png", tabId);
                }
            });
            chrome.storage.local.set({is_active: true});
        } else {
            setIcon("icon_disabled.png", tabId);
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
    let tabId = tab.id;
    chrome.storage.local.get(['is_active', 'is_waiting'], function(items) {
        if (items['is_active'] === true) {
            if (items['is_waiting'] !== true) {
                setIcon("icon_waiting.png", tabId);
                chrome.storage.local.set({is_waiting: true});
                wrapper(tabId);
                chrome.storage.local.set({is_waiting: false});
                setIcon("icon.png", tabId);
            }
        }
    });
});

