var Scraper = require("./scraper/scraper");
var scraper = new Scraper();


//scraper.add("just-scrape-emails", {urlsFile: "links.txt"});
scraper.add("panoramafirm", {search: "cieszyn"});

scraper.setupCSVStorage("outfile.csv", false);

scraper.on("new-contact", function(contact){
   console.log("Scraped contact: " + JSON.stringify(contact));
});

scraper.on("download-finished", function(options){
   var ro = options.requestOptions;
   console.log("Finished: " + ro.method + " " + ro.protocol + "//" + ro.host + ro.path);
});

scraper.on("download-starting", function(options){
   var ro = options.requestOptions;
   console.log("Starting: " + ro.method + " " + ro.protocol + "//" + ro.host + ro.path);
});

scraper.on("download-failed", function(options){
   var ro = options.requestOptions;
   console.log("Failed: " + ro.method + " " + ro.protocol + "//" + ro.host + ro.path);
});

scraper.on("download-state", function(options){
    var ro = options.requestOptions;
    process.stdout.write("Downloading: " + ro.method + " " + ro.protocol + "//" + ro.host + ro.path + " " + options.bytesDone + "/???\r");
});

scraper.scrape();