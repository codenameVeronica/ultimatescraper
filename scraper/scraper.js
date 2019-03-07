var http = require("http");
var https = require("https");
var cheerio = require("cheerio");
var fs = require("fs");
var Semaphore = require('semaphore');

String.prototype.replaceAll = function(target, replacement) {
  return this.split(target).join(replacement);
};

function Scraper()
{
    this.tasks = new Array();
    this.events = {};
    this.lastDownloadId = 0;
    this.maxDownloads = 8;
    this.downloadsCount = 0;
    this.sem = null;
}

Scraper.prototype.on = function(name, fn)
{
    if (typeof this.events[name] == "undefined")
        this.events[name] = new Array();
    
    this.events[name].push(fn);
}

Scraper.prototype.once = function(name, fn)
{
    if (typeof this.events[name] == "undefined")
        this.events[name] = new Array();
    
    fn.once = true;
    
    this.events[name].push(fn);
}

Scraper.prototype.emit = function(name)
{
    var args = Array.prototype.slice.call(arguments, 1);
    
    if (typeof this.events[name] != "undefined")
    {
        for (var i = 0; i < this.events[name].length; i++)
        {
            this.events[name][i].apply(this, args);
        }
        var cleanRun;
        do {
            cleanRun = true;
            for (var i = 0; i < this.events[name].length; i++)
            {
                if (this.events[name][i].once == true)
                {
                    this.events[name].splice(i, 1);
                    cleanRun = false;
                }
            }
        } while(!cleanRun);
    }   
}

Scraper.prototype.add = function(module, options)
{
    this.tasks.push({module: module, options: options});
}

Scraper.prototype.escapeCSV = function(string)
{
    return string.replaceAll("\"", "\\\"");
}

Scraper.prototype.setupCSVStorage = function(outFile, includeHeader)
{
    this.csvFields = null;
    var that = this;
    
    fs.writeFileSync(outFile, "", {encoding: "utf8"});
    
    this.on("new-contact", function(contact) {
        if (that.csvFields == null)
        {
            that.csvFields = new Array();
            for (var key in contact)
                that.csvFields.push(key);
            
            if (includeHeader)
            {
                var header = "\"" + that.csvFields.join("\",\"") + "\"\n";
                fs.writeFileSync(outFile, header, {encoding: "utf8"});
            }
        }
        
        var line = "";
        for (var i = 0; i < that.csvFields.length; i++)
        {
            line += ("\"" + (contact[that.csvFields[i]]?this.escapeCSV(contact[that.csvFields[i]]):"") + "\"" + (i==(that.csvFields.length-1)?"\n":","));
        }
        fs.appendFileSync(outFile, line, {encoding: "utf8"});
    });
}

Scraper.prototype._setupCSVStorage = function(outFile, includeHeader)
{
    if (includeHeader)
        fs.writeFileSync(outFile, "\"first name\",\"last name\",\"full name\",\"address\",\"country\",\"phone\",\"email\",\"www\"\n", {encoding: "utf8"});
    else fs.writeFileSync(outFile, "", {encoding: "utf8"});
    
    this.on("new-contact", function(contact){
        var newline = "\"" +
            (contact.firstname?this.escapeCSV(contact.firstname):"") + "\",\"" + (contact.lastname?this.escapeCSV(contact.lastname):"") + "\",\"" + (contact.fullname?this.escapeCSV(contact.fullname):"") + "\",\"" + (contact.address?this.escapeCSV(contact.address):"") + "\",\"" + (contact.country?this.escapeCSV(contact.country):"") + "\",\"" + (contact.phone?this.escapeCSV(contact.phone):"") + "\",\"" + (contact.email?this.escapeCSV(contact.email):"") + "\",\""+(contact.www?this.escapeCSV(contact.www):"")+"\"\n";
        
        //console.log(newline);
        fs.appendFileSync(outFile, newline, {encoding: "utf8"});
    });
}


Scraper.prototype.getNextDownloadId = function()
{
    return ++this.lastDownloadId;
}

Scraper.prototype.doDownloadSSL = function(options, onFinished)
{
    var that = this;
    var body = "";
    var id = this.getNextDownloadId();
    var bytesDone = 0;
    
    this.emit("download-starting", {id: id, requestOptions: options.requestOptions});
    
    //console.log(JSON.stringify(options.requestOptions));
    
    var req = https.request(options.requestOptions, function(res){
        res.on("data", function(chunk){
            bytesDone += chunk.length;
            that.emit("download-state", {id: id, requestOptions: options.requestOptions, bytesDone: bytesDone, bytesTotal: 0});
            body += chunk;
        });
        res.on("end", function(){
            var $ = cheerio.load(body);
            that.emit("download-finished", {id: id, requestOptions: options.requestOptions});
            onFinished({id: id, body: body, $: $, requestOptions: options.requestOptions, res: res});
        });
    });
    if (options.postData)
        req.write(options.postData);
    req.on("error", function(e){
        that.emit("download-failed", {id: id, requestOptions: options.requestOptions, error: e});
        that.requestNewDownload(options, onFinished, true); // retry the download
    });
    req.end();
}

Scraper.prototype.doDownload = function(options, onFinished)
{
    if (options.requestOptions.protocol == "https:")
        return this.doDownloadSSL(options, onFinished);
    
    var that = this;
    var body = "";
    var id = this.getNextDownloadId();
    var bytesDone = 0;
    
    this.emit("download-starting", {id: id, requestOptions: options.requestOptions});
    
    //console.log(JSON.stringify(options.requestOptions));
    
    var req = http.request(options.requestOptions, function(res){
        res.on("data", function(chunk){
            bytesDone += chunk.length;
            that.emit("download-state", {id: id, requestOptions: options.requestOptions, bytesDone: bytesDone, bytesTotal: 0});
            body += chunk;
        });
        res.on("end", function(){
            var $ = cheerio.load(body);
            that.emit("download-finished", {id: id, requestOptions: options.requestOptions});
            onFinished({id: id, body: body, $: $, requestOptions: options.requestOptions, res: res});
        });
    });
    if (options.postData)
        req.write(options.postData);
    req.on("error", function(e){
        that.emit("download-failed", {id: id, requestOptions: options.requestOptions, error: e});
        that.requestNewDownload(options, onFinished, true); // retry the download
    });
    req.end();
}


Scraper.prototype.setMaxDownloads = function(num)
{
    console.log("New max downloads: " + num + "(" + typeof(num) + ")");
    this.sem = Semaphore(num);
}

Scraper.prototype.requestNewDownload = function(options, onFinished, retry)
{
    var that = this;
    
    if (!retry)
    {
        this.downloadsCount++;
    
        if (this.sem != null)   // with limit
            this.sem.take(function(){
                that.doDownload(options, function(pageOptions){
                    that.sem.leave();
                    that.downloadsCount--;
                    onFinished(pageOptions);
                });
            });
        else this.doDownload(options, function (pageOptions) {
            that.downloadsCount--;
            onFinished(pageOptions);
        });  // without limit
    }
    else this.doDownload(options, onFinished);
}

Scraper.prototype.runTask = function(num, onDone)
{
    var task = this.tasks[num];
    
    var mod = require("./modules/" + task.module + ".js");
    
    var initReqs = mod.getInitialRequests(task.options);
    
    var that = this;
    
    for (var i = 0; i < initReqs.length; i++)
    {
        var depth = 0;
        
        var doDepth = function(d, downloadOptions)
        {
            that.requestNewDownload(downloadOptions, function(options){
                mod.process[d].call(that, options, task.options, function(_downloadOptions, increaseDepth){
                    doDepth(d+(increaseDepth?1:0), _downloadOptions);
                });
                if (that.downloadsCount <= 0)
                    onDone();
            });
        }
        doDepth(depth, initReqs[i]);
        
        
    }
}


Scraper.prototype._runTask = function(num)
{
    var task = this.tasks[num];
    var body = "";
    
    var id = this.getNextDownloadId();
    var bytesDone = 0;
    
    this.emit("download-starting", {url: task.url, id: id});
    
    var that = this;
    
    http.get(task.url, function(res){
        res.on("end", function(){
            that.emit("download-finished", {url: task.url, id: id});
            var mod = require("./modules/" + task.module + ".js");
            $ = cheerio.load(body);
            mod.process.call(this, {body: body, $: $});
        });
        res.on("data", function(chunk){
            bytesDone += chunk.length;
            that.emit("download-state", {id: id, url: task.url, bytesDone: bytesDone, bytesTotal: 0});
            body += chunk;
        });
    }).on("error", function(e){
       that.emit("download-failed", {url: task.url, id:id, error: e});
    });
}

Scraper.prototype.setCookies = function(res)
{
    var arr = res.header("set-cookie");
    for (var i = 0; i < arr.length; i++)
    {
        var atoms = arr[i].split("; ");
        
    }
}

Scraper.prototype.scrape = function(onDone)
{
    for (var i = 0; i < this.tasks.length; i++)
        this.runTask(i, onDone);
}


module.exports = Scraper;