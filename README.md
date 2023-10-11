# @ogginger/crawler

This is a simple web crawler implemented in nodejs that uses puppeteer to navigate webpages looking for something.

#### Getting Started:
1. Include it in your project: 
> npm install @ogginger/crawler
2. Include it in your code.
```javasript: 
import Crawler from "@ogginger/crawler"
import * as puppeteer from "puppeteer"

async function() {
  let crawler = new Crawler();
  let { browser, page }: { browser: puppeteer.Browser, page: puppeteer.Page } = await crawler.open( crawler.browserOptions );
  let target = await crawler.crawl( page, 
    async function pagePredicate( page: puppeteer.Page ): Promise<{ found: boolean, target?: any }> {
      /*
        If you find something in the page then return { found: true, target: "what you want" }.
        Otherwise return { found: false }
      */
    },
    linkList,
    function linkPredicate( link: string, linkBlacklist: any ) {
      // If you want to eventually crawl the link then return true.
      // Otherwise return false.
    }
  );
}
```
