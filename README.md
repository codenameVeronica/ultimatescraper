USAGE

Launch this directory under Electron.


INSTALL

requires two non-standard node modules: cheerio and semaphore

npm install cheerio

npm install semaphore


DESCRIPTION

This scraper is extremally efficient because it opens multiple connections at the same time. You can set the limit for max number of simultaneous connections (default == 8).

Check the /scraper/modules/ directory to see how to write your own modules. Scraper exposes to modules a cheerio object you can use the same way as jQuery to extract elements of a page. Refer to jQuery documentation for help on how to write jQuery expressions.
