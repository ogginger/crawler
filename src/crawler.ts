import * as puppeteer from "puppeteer";

interface CrawlerOptions {
    viewport?: { width: number, height: number }
}

interface CrawlerInput {
    page: puppeteer.Page;
    pagePredicate: ( page: puppeteer.Page ) => Promise<{ found: boolean, target: any }>;
    linkList: string[];
    linkPredicate: ( link: string, blacklist: any ) => boolean;
    linkBlacklist?: any;
    exhaustive?: boolean;
}

export default class Crawler {
    public page: puppeteer.Page;
    public browser: puppeteer.Browser;
    public browserOptions: puppeteer.PuppeteerLaunchOptions;
    constructor( input: CrawlerOptions = {} ) {
        let self = this;
        if ( input.viewport == undefined ) input.viewport = { width: 1920, height: 1080 };
        let windowSize: string = `${input.viewport.width}x${input.viewport.height}`;
        self.browserOptions = {
            headless: false,
            executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            ignoreDefaultArgs: ['--enable-automation'],
            args: ["--window-size=" + windowSize],
            defaultViewport: input.viewport
        };
    }
    public async open( browserOptions: puppeteer.PuppeteerLaunchOptions ): Promise<{ browser: puppeteer.Browser, page: puppeteer.Page }> {
        const browser = await puppeteer.launch(browserOptions);
        let [ page ] = await browser.pages();
        return { browser, page };
    }
    public async crawl( page: puppeteer.Page,  pagePredicate: ( page: puppeteer.Page ) => Promise<{ found: boolean, target?: any }> , linkList: string[], linkPredicate: ( link: string, blacklist: any ) => Promise<boolean> | boolean, linkBlacklist: any = {}, exhaustive: boolean = false ) {
        let results: any[] = [];
        while ( linkList.length != 0 ) {
            let link: string;
            for ( let index = 0; index <= linkList.length; index++ ) {
                try {
                    link = linkList.shift();
                    await page.goto( link );
                    linkBlacklist[link] = true;
                    break;
                } catch ( error ) {
                    console.log( error.message );
                    if ( linkList.length == 0 && !exhaustive ) {
                        throw new Error("Unable to find the target.");
                    } else if ( linkList.length == 0 ) {
                        return results;
                    }
                }
            }
            let result = await pagePredicate( page );
            if ( result.found && exhaustive == false ) {
                return result.target;
            } else {
                if ( result.found ) results.push( result.target );
                let pageLinks = await page.evaluate(() => {
                    let links: any[] = Array.from(document.getElementsByTagName("a"));
                    links = links.map(( anchor ) => { return anchor.href });
                    return links;
                });
                let filteredLinks: string[] = [];
                for ( let index = 0; index < pageLinks.length; index++ ) {
                    try {
                        if ( await linkPredicate( pageLinks[index], linkBlacklist ) ) filteredLinks.push( pageLinks[index] );                           
                    } catch ( error ) {
                        console.log( error.message );
                    }
                }
                linkList = linkList.concat( filteredLinks );
            }
        }
        if ( exhaustive ) {
            return results;
        } else {
            throw new Error("Unable to find the target.");
        }
    }
    public async close(): Promise<void> {
        let self = this;
        await self.page.close();
        await self.browser.close();
    }
}
export const tests: any[] = [
    {
        name: "Crawler.open",
        context: function() {
            return new Crawler();
        },
        input: [],
        function: async function() {
            let self: Crawler = this;
            let result = false;
            try {
                let { browser, page } = await self.open( self.browserOptions );
                self.browser = browser;
                self.page = page;
                result = true;
            } catch ( error ) {
                console.log( error.message );
            } finally {
                await self.page.close();
                await self.browser.close();
                return result;
            }
        },
        output: true,
        debug: true,
        run: false
    }, {
        name: "Crawler.crawl",
        context: function() {
            return new class mock extends Crawler {
                public pagePredicateIndex: number = 0;
                public async open( browserOptions: puppeteer.PuppeteerLaunchOptions ): Promise<{ browser: puppeteer.Browser, page: puppeteer.Page }> {
                    let browser: puppeteer.Browser = await puppeteer.launch(browserOptions);
                    let page: any = {
                        goto: async function( url: string ) {},
                        evaluate: async function( callback: () => any ) {
                            return [ "https://somewhere.else.com" ];
                        },
                    };
                    return { browser, page };
                }
            }();
        },
        input: [{
            page: undefined,
            pagePredicate: async function( page: puppeteer.Page ): Promise<any> {
                let mock: any = this;
                if ( mock.pagePredicateIndex == 0 ) {
                    mock.pagePredicateIndex++;
                    return { found: false, target: undefined };
                } else {
                    return { found: true, target: true };
                }
            },
            linkList: ["https://some.place.com"],
            linkPredicate: function( link: string, blacklist: any ) {
                return true;
            }
        }],
        function: async function( input: CrawlerInput ) {
            let crawler: Crawler = this;
            let result = false;
            try {
                let { browser, page } = await crawler.open( crawler.browserOptions );
                crawler.browser = browser;
                crawler.page = page;
                await crawler.crawl( page, input.pagePredicate.bind( this ), input.linkList, input.linkPredicate );
                result = true;
            } catch ( error ) {
                console.log( error.message );
            } finally {
                return result;
            }
        },
        output: true,
        debug: true,
        run: false
    }, {
        name: "Crawler.crawl exhaustive",
        context: function() {
            let context: any = new class mock extends Crawler {
                public pagePredicateIndex: number = 0;
                public async open( browserOptions: puppeteer.PuppeteerLaunchOptions ): Promise<{ browser: puppeteer.Browser, page: puppeteer.Page }> {
                    let browser: puppeteer.Browser = undefined;
                    let page: any = {
                        goto: async function( url: string ) {},
                        evaluate: async function( callback: () => any ): Promise<any[]> {
                            return [];
                        },
                    };
                    return { browser, page };
                }
            }();
            return context;
        },
        input: [{
            page: undefined,
            pagePredicate: async function( page: puppeteer.Page ): Promise<any> {
                let mock: any = this;
                mock.pagePredicateIndex++;
                if ( mock.pagePredicateIndex > 1 ) {
                    return { found: true, target: true };
                } else {
                    return { found: false, target: undefined };
                }
            },
            linkList: ["https://some.place.com/1", "https://some.place.com/2", "https://some.place.com/3" ],
            linkPredicate: function( link: string, blacklist: any ) {
                return true;
            },
            exhaustive: true
        }],
        function: async function( input: CrawlerInput ) {
            let crawler: Crawler = this;
            let { browser, page } = await crawler.open( crawler.browserOptions );
            let results = await crawler.crawl( page, input.pagePredicate.bind( crawler ), input.linkList, input.linkPredicate, {}, input.exhaustive );
            return results;
        },
        output: [true,true],
        debug: true,
    }
];