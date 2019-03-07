var fs = require("fs");
var url = require("url");

var process = [
    function (options, next)
    {
        var emails = options.body.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
        if (emails != null)
            for (var i = 0; i < emails.length; i++)
                this.emit("new-contact", {email: emails[i]});
    }
];

function getInitialRequests(options)
{
    //console.log(options.urlsFile);
    var buf = fs.readFileSync(options.urlsFile, {encoding: "utf8"});
    var str = buf.toString("utf8");
    var urls = str.split("\n");
    
    var requests = new Array();
    
    for (var i = 0; i < urls.length; i++)
        requests.push({requestOptions: url.parse(urls[i])});
    
    for (var i = 0; i < requests.length; i++)
        requests[i].requestOptions.method = "GET";
    
    return requests;
}

function getOptions()
{
    return [
      {id: "urlsFile", name: "URL list file", description: "Your file with URL addressses, separated by newlines", type: "file-read", mandatory: true}
    ];
}



module.exports.process = process;
module.exports.getInitialRequests = getInitialRequests;
module.exports.getOptions = getOptions;
module.exports.name = "Generic e-mail scraper";
module.exports.description = "This module takes a list of website URLs and processes them one after another extracting e-mail addresses using a regular expression";