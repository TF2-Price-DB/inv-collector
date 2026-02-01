# Inventory Collector

_Sometimes, you just need a lot of inventory data for your next project._

## Sources

The accounts I chose to download came from the BackpackTF top inventories list.
[The script](./bin/find-top-inventories-from-backpack.browser.ts) I used to has
been checked in to this repository. The inventories were downloaded from
express-load.com. I happen to have some credits there.

## Getting the data

I cannot check in the 16 gigabytes of inventory data I have collected. Github
does not let me. I have uploaded a zstd compressed tarball on pricedb.io. You
can download this, free of charge. You can decompress it with `tar -xf ...` This
will extract to 8000+ inventories. Some of the top 10,000 inventories were
private, unavailable, or could not be loaded for some other reason. TODO: Add
public URL here.

If you want to download new data, instead of using data from February 2026. You
can run `deno task download-inventories`. You will have to supply your own
EXPRESS_LOAD_API_KEY in .env. You can change the concurrency of the downloader
at your option. The current value did not result in rate limits.

If you want to download different inventories than those I picked, you can edit
the [TOP_INVENTORIES](./src/TOP_INVENTORIES.ts) constant.

## Dependencies

This project is dependency free. It only requires `node:...` built-ins.

## License

This project is MIT licensed. The data is subject to copyright by Valve and
Scrap LLC respectively.
