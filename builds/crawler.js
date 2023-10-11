"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tests = void 0;
const puppeteer = __importStar(require("puppeteer"));
function wait(seconds, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    if (callback)
                        callback();
                    resolve();
                }
                catch (error) {
                    reject(error);
                }
            }, seconds * 1000);
        });
    });
}
class Crawler {
    constructor(input = {}) {
        let self = this;
        if (input.viewport == undefined)
            input.viewport = { width: 1920, height: 1080 };
        let windowSize = `${input.viewport.width}x${input.viewport.height}`;
        self.browserOptions = {
            headless: false,
            executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            ignoreDefaultArgs: ['--enable-automation'],
            args: ["--window-size=" + windowSize],
            defaultViewport: input.viewport
        };
    }
    open(browserOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield puppeteer.launch(browserOptions);
            let [page] = yield browser.pages();
            return { browser, page };
        });
    }
    crawl(page, pagePredicate, linkList, linkPredicate) {
        return __awaiter(this, void 0, void 0, function* () {
            let linkBlacklist = {};
            while (linkList.length != 0) {
                let link;
                for (let index = 0; index <= linkList.length; index++) {
                    try {
                        link = linkList.shift();
                        yield page.goto(link);
                        linkBlacklist[link] = true;
                        break;
                    }
                    catch (error) {
                        console.log(error.message);
                        if (linkList.length == 0)
                            throw new Error("Unable to find the target.");
                    }
                }
                let result = yield pagePredicate(page);
                if (result.found) {
                    return result.target;
                }
                else {
                    let pageLinks = yield page.evaluate(() => {
                        let links = Array.from(document.getElementsByTagName("a"));
                        links = links.map((anchor) => { return anchor.href; });
                        return links;
                    });
                    pageLinks = pageLinks.filter((link) => linkPredicate(link, linkBlacklist));
                    linkList = linkList.concat(pageLinks);
                }
            }
            throw new Error("Unable to find the target.");
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            let self = this;
            yield self.page.close();
            yield self.browser.close();
        });
    }
}
exports.default = Crawler;
exports.tests = [
    {
        name: "Crawler.open",
        context: function () {
            return new Crawler();
        },
        input: [],
        function: function () {
            return __awaiter(this, void 0, void 0, function* () {
                let self = this;
                let result = false;
                try {
                    let { browser, page } = yield self.open(self.browserOptions);
                    self.browser = browser;
                    self.page = page;
                    result = true;
                }
                catch (error) {
                    console.log(error.message);
                }
                finally {
                    yield self.page.close();
                    yield self.browser.close();
                    return result;
                }
            });
        },
        output: true,
        debug: true,
        run: false
    }, {
        name: "Crawler.crawl",
        context: function () {
            return new class mock extends Crawler {
                constructor() {
                    super(...arguments);
                    this.pagePredicateIndex = 0;
                }
                open(browserOptions) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let browser = yield puppeteer.launch(browserOptions);
                        let page = {
                            goto: function (url) {
                                return __awaiter(this, void 0, void 0, function* () { });
                            },
                            evaluate: function (callback) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    return ["https://somewhere.else.com"];
                                });
                            },
                        };
                        return { browser, page };
                    });
                }
            }();
        },
        input: [{
                page: undefined,
                pagePredicate: function (page) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let mock = this;
                        if (mock.pagePredicateIndex == 0) {
                            mock.pagePredicateIndex++;
                            return { found: false, target: undefined };
                        }
                        else {
                            return { found: true, target: true };
                        }
                    });
                },
                linkList: ["https://some.place.com"],
                linkPredicate: function (link, blacklist) {
                    return true;
                }
            }],
        function: function (input) {
            return __awaiter(this, void 0, void 0, function* () {
                let crawler = this;
                let result = false;
                try {
                    let { browser, page } = yield crawler.open(crawler.browserOptions);
                    crawler.browser = browser;
                    crawler.page = page;
                    yield crawler.crawl(page, input.pagePredicate.bind(this), input.linkList, input.linkPredicate);
                    result = true;
                }
                catch (error) {
                    console.log(error.message);
                }
                finally {
                    return result;
                }
            });
        },
        output: true,
        debug: true,
    }
];
//# sourceMappingURL=crawler.js.map