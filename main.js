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

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function bypass() {
    let url = await getCurrentTab();
    if (url) {
        var urlObj = parseURL(url.url);
        urlObj = urlObj.domain;
        var domain = urlObj.replace('www','');
        chrome.cookies.getAll({ domain: domain }, function (cookies) {
            for (var i = 0; i < cookies.length; i++) {
                chrome.cookies.remove({
                    url: "https://" + cookies[i].domain + cookies[i].path,
                    name: cookies[i].name
                });
            }

            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.reload(tabs[0].id);
                window.close();
            });
        })
    }
}

function documentEvents() {
    document.getElementById('bypass-this').addEventListener("click", bypass);
}

document.addEventListener('DOMContentLoaded', documentEvents, false);



