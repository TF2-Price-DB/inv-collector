# Inventory Collector

_Sometimes, you just need a lot of inventory data for your next project._

## Sources

I find lists of big Team Fortress 2 inventories and download them. The first
source was the Top Inventory list, the second one the active users and bots from
GladiatorTF. I download inventories with express-load.com. I happen to have some
credits there. The requests made by express-load are made to:
`https://steamcommunity.com/inventory/%STEAM64%/440/2?count=2000`

## I am in your dataset, and I don't want to be

I have only downloaded inventory data that was accessible publicly. If your
inventory is Friends Only or Private, I have not downloaded it. I will suggest,
but not require, that you make your inventory private. You may create an issue
on this repository requesting your data be removed from the database. WIthin 28
days of your issue, I will overwrite your inventory with the default empty
inventory response.

## Getting the data

I cannot check in the 48,864,534,528 bytes (50GB) of inventory data I have
collected. Github does not let me. I have compiled a SQLite database and
uploaded a compressed version of this file to store.pricedb.io. You can download
this, free of charge. You can decompress it with `brotli`, the command line
tool. At the time of writing, the uncompressed database contains 39,755
inventories. Some are of the rich and famous, as per the
[Top Backpacks on BPTF](https://backpack.tf/top/backpacks). Others are bots and
users of [Gladiator.TF](https://gladiator.tf). Thanks to the top folks over
there at Gladiator for sharing their active user list.

How to obtain a copy of the database:

```SH
curl https://store.pricedb.io/inventories-2026-02-22.sqlite3.db.br -o inv.db.br
brotli -d --rm inv.db.br
sqlite3 inv.db

.schema
```

```SQL
CREATE TABLE inventories
       (steam64 text PRIMARY KEY, timestamp int NOT NULL, response_body text NOT NULL);
CREATE TABLE inventory_load_failures
       (steam64 text, timestamp int NOT NULL, status_code int NOT NULL);
CREATE INDEX idx_inventory_load_failures_steam64
       ON inventory_load_failures(steam64);
```

If you want to download new data, instead of using data from February 2026. You
can run `deno task download-inventories`. You will have to supply your own
EXPRESS_LOAD_API_KEY in .env. You can change the concurrency of the downloader
at your option. The current value did not result in rate limits.

If you want to download different inventories than those I picked, you can
update the [download-inventories](./bin/download-inventories.ts) script to
source its steam64s from elsewhere.

## Dependencies

By default, this project stores inventories in files and only requires
`node:...` built-ins. You can run with with NodeJS, Deno, or Bun. If you wish to
use the `deno-sqlite` storage engine, you need to run this with
[https://deno.land](Deno). I will accept PRs that create a NodeJS and/or Bun
storage engine for Sqlite.

## License

This project is MIT licensed. The inventory data is subject to copyright by
Valve. The Top Backpack data is owned by Scrap LLC. The user list is owned by
[GladiatorTF](https://gladiator.tf/business).
