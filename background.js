chrome.webRequest.onBeforeRequest.addListener(
    async function (details) {
        var url = parseURL(details.url);
        chrome.storage.sync.get(url.host, function (result) {
            if (result[url.host]) {
                url = url.protocol + "://" + url.domain;
                clearCookies(url)
            }
        });
    },
    { urls: ["*://*/*"] },
    ["requestBody"]
);

 function spoofCrawler(details) {

    const urlObj = parseURL(details.url);
    var blackListedHosts = ['google','glassdoor','gmail','whatsapp','youtube','medium']
    if(blackListedHosts.includes(urlObj.host)){
        return { requestHeaders: details.requestHeaders };
    }

    //Spoof our device as a Google Crawler
    details.requestHeaders = details.requestHeaders.filter(function (header) {
        if (header.name === "User-Agent" || header.name === "X-Forwarded-For") {
            return false
        }
        return true
    })
    var google_adbot_UA = "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z‡ Safari/537.36"
    details.requestHeaders.push({
        "name": "User-Agent",
        "value": google_adbot_UA
    })
    details.requestHeaders.push({
        "name": "X-Forwarded-For",
        "value": "66.249.66.1"
    })
    
    // Redirect Referer
    details.requestHeaders = details.requestHeaders.filter(function (header) {
        if (header.name === "Referer")
            return false
        return true
    })
    details.requestHeaders.push({
        "name": "Referer",
        "value": "https://t.co/"
    })
    return { requestHeaders: details.requestHeaders };
}


//Add listener
chrome.webRequest.onBeforeSendHeaders.addListener(spoofCrawler,
    {
        urls: ["<all_urls>"],
        types: ["main_frame"],
    },
    ["requestHeaders", "blocking", "extraHeaders"]
);


async function clearCookies(url) {
    chrome.cookies.getAll({ url: url }, function (cookies) {
        for (var i = 0; i < cookies.length; i++) {
            chrome.cookies.remove({
                url: "https://" + cookies[i].domain + cookies[i].path,
                name: cookies[i].name
            });
        }
    })
}

function parseURL(url) {
    parsed_url = {}

    if (url == null || url.length == 0)
        return parsed_url;

    protocol_i = url.indexOf('://');
    parsed_url.protocol = url.substr(0, protocol_i);

    remaining_url = url.substr(protocol_i + 3, url.length);
    domain_i = remaining_url.indexOf('/');
    domain_i = domain_i == -1 ? remaining_url.length - 1 : domain_i;
    parsed_url.domain = remaining_url.substr(0, domain_i);
    parsed_url.path = domain_i == -1 || domain_i + 1 == remaining_url.length ? null : remaining_url.substr(domain_i + 1, remaining_url.length);

    domain_parts = parsed_url.domain.split('.');
    switch (domain_parts.length) {
        case 2:
            parsed_url.subdomain = null;
            parsed_url.host = domain_parts[0];
            parsed_url.tld = domain_parts[1];
            break;
        case 3:
            parsed_url.subdomain = domain_parts[0];
            parsed_url.host = domain_parts[1];
            parsed_url.tld = domain_parts[2];
            break;
        case 4:
            parsed_url.subdomain = domain_parts[0];
            parsed_url.host = domain_parts[1];
            parsed_url.tld = domain_parts[2] + '.' + domain_parts[3];
            break;
    }

    parsed_url.parent_domain = parsed_url.host + '.' + parsed_url.tld;


    //  parsed_url = {
    //     domain : "www.facebook.com",
    //     host : "facebook",
    //     path : "100003379429021_356001651189146",
    //     protocol : "https",
    //     subdomain : "www",
    //     tld : "com"
    // }
    return parsed_url;
}
