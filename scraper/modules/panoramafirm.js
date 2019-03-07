String.prototype.replaceAll = function(target, replacement) {
  return this.split(target).join(replacement);
};

function getInitialRequests(options)
{
    var searchChanged = options.search.replaceAll(" ", "_");
    
    return [
        {
            requestOptions:
            {
                protocol: "http:",
                hostname: "panoramafirm.pl",
                host: "panoramafirm.pl",
                path: "/" + searchChanged + "/firmy,1.html",
                method: "GET"
            }
        }
    ];
}

var process = [
    function(options, taskOptions, next)
    {
        var searchChanged = taskOptions.search.replaceAll(" ", "_");
        
        var $ = options.$;
        var totalNum = Number($("span#resultCount").html().replaceAll(" ", ""));
        
        console.log("Total entries to scrape: " + totalNum);
        
        for (var i = 0; i < totalNum; i += 25)
        {
            next({
               requestOptions:
               {
                   protocol: "http:",
                   host: "panoramafirm.pl",
                   hostname: "panoramafirm.pl",
                   path: "/" + searchChanged + "/firmy," + ((i/25)+1) + ".html",
                   method: "GET"
               }
            }, true);
        }
    },
    function(options, taskOptions, next)
    {
        var that = this;
        var $ = options.$;
        
        $("section#serpContent article ul li.hit").each(function(index, value){
           var address = $(value).find(".contacts").html();
           if (address != null && address.search("<br>") != -1)
                address = address.substr(address.search("<br>") + 4);
           if (address != null)
            {
               address = address.replaceAll("\n", "");
               address = address.replaceAll("  ", "");
            }
           that.emit("new-contact", {
               fullname: $(value).find(".title .addax").html(),
               address: address,
               www: $(value).find(".title .contactsLink .icon-link-ext").html(),
               email: $(value).find(".title .contactsLink .titleEmail").html(),
               phone: $(value).find(".contacts a.icon-phone strong.noLP").html()
           });
        });
    }
];


function getOptions()
{
    return [
      {id: "search", name: "Search term", description: "Type in any search term you want the query results to be related to", mandatory: true},
      {id: "startAt", name: "Start item", description: "The index of the first item in the search result (defaults to 0)", mandatory: false},
      {id: "endAt", name: "End item", description: "The index of the last element in the search result (defaults to result count)", mandatory: false}
    ];
}


module.exports.process = process;
module.exports.getOptions = getOptions;
module.exports.getInitialRequests = getInitialRequests;
module.exports.name = "Webscraper for panorama firm .PL...";
module.exports.description = "This module will let you easily dump companies from the polish website panoramafirm.pl based on a search term you provide";