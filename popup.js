
function find() {

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
        console.log(xhr);
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

}

function wrapper(btn) {
    btn.disabled = 'disabled';
    btn.innerHTML = 'Loading...';
    chrome.tabs.executeScript({code:'(' + find.toString() + ')();'});
}

document.getElementById('finder-button').addEventListener('click', function(e) {
    wrapper(e.target);
});

console.log(find.toString());

