import test from "@ogginger/testsuite";
import * as crawler from "./crawler";
async function main() {
    await test( crawler.tests );
}
main().catch((err) => {
  console.error(err);
});