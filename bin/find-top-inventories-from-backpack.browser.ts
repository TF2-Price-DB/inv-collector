(async () => {
  if (!("document" in globalThis)) {
    console.warn(
      "Paste this into the console of any backpack.tf page, then press Enter.",
    );
    return;
  }

  // Settings;
  const START = 1;
  const END = 100;

  const BASE = "https://backpack.tf/top/backpacks/";
  const ids = [];

  for (let p = START; p <= END; p++) {
    console.log(`Fetching page ${p} …`);
    try {
      const res = await fetch(BASE + p);
      if (!res.ok) {
        console.warn(`  HTTP ${res.status} – skipped`);
        continue;
      }
      const html = await res.text();

      const re =
        /<a\s+href="https?:\/\/steamcommunity\.com\/profiles\/([^"]+)"/gi;
      let m;
      while ((m = re.exec(html)) !== null) ids.push(m[1]);
    } catch (e) {
      console.warn("  Network error - skipped", e);
    }

    // Be polite, be effecient, and have a plan to
    // respect the people hosting backpack.tf.
    await new Promise((r) => setTimeout(r, 750));
  }

  console.log(`\nFinished.  Found ${ids.length} IDs:\n`);
  console.log(ids);
  console.log(`Copy this variable into TOP_INVENTORIES.ts`);
})();
