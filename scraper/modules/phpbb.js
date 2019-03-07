/*
http://hostname/path/ucp.php?mode=login
POST DATA: username=myusername&password=mypassword
*/

function getInitialRequests(options)
{
    var path = options.path;
    if (!path)
        path = "/";
    
    if (path[path.length - 1] != "/")
        path += "/";
    
    var postData = "username=" + options.username + "&password=" + options.password;
    
    return [
        {
            requestOptions:
            {
                protocol: "http:",
                hostname: options.hostname,
                host: options.hostname,
                port: Number(options.port),
                method: "POST",
                path: path + "ucp.php?mode=login"
                /*,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length.toString()
                }*/
            },
            postData: postData
        }
    ];
}

var process = [
    function(options, taskOptions, next)
    {
        console.log("Got a cookie: " + options.res.headers["set-cookie"]);
    }
];


function getOptions()
{
    return [
      {id: "hostname", name: "Host name", description: "Hostname", type: "string", mandatory: true},
      {id: "path", name: "Path", description: "Path on which the phpBB script is installed", mandatory: true},
      {id: "port", name: "Port", description: "Port on which phpBB is installed", type: "number", mandatory: false},
      {id: "username", name: "User name", description: "phpBB user name", mandatory: true},
      {id: "password", "name": "Password", "description": "Your password", mandatory: true}
    ];
}


module.exports.process = process;
module.exports.getOptions = getOptions;
module.exports.getInitialRequests = getInitialRequests;
module.exports.name = "phpBB members scraper";
module.exports.description = "Scrap info about board users";