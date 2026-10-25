const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const md5 = (data) => crypto.createHash("md5").update(data).digest("hex").slice(0, 8);

module.exports = function (eleventyConfig) {
  // files copied as they are
  eleventyConfig.addPassthroughCopy({
    "src/assets/fonts": "assets/fonts",
    "src/assets/img": "assets/img",
    "src/assets/js": "assets/js",
    "src/assets/media": "assets/media",
  });

  // all stylesheets in src/css/ are joined (in file-name order) into one file, /assets/css/styles.css
  eleventyConfig.addGlobalData("cssBundle", () => {
    const dir = path.join(__dirname, "src/css");
    const css = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".css"))
      .sort()
      .map((f) => fs.readFileSync(path.join(dir, f), "utf8").trim())
      .join("\n\n") + "\n";
    return { css, hash: md5(css) };
  });

  // a short fingerprint of the script, used as ?v= so browsers always fetch the newest copy
  eleventyConfig.addGlobalData("jsHash", () =>
    md5(fs.readFileSync(path.join(__dirname, "src/assets/js/site.js")))
  );

  eleventyConfig.addFilter("dateISO", (d) => new Date(d).toISOString().slice(0, 10));

  // 1 -> "001" (or "01" with a width of 2), for the numbers on cards and pages
  eleventyConfig.addFilter("padStart", (n, width = 3) => String(n).padStart(width, "0"));

  // media address with a short fingerprint of the file: a replaced video gets a new address, so browsers never show an old copy
  eleventyConfig.addFilter("media", (file) => {
    const full = path.join(__dirname, "src/assets/media", file);
    return `/assets/media/${file}?v=${md5(fs.readFileSync(full))}`;
  });

  // One entry per inner page: the "What we do" offers and the "How we work" cases. `group` is the key in sections.json, `number` is the
  // position in its group and `next` wraps around. Read from disk on every build (a data file would be cached), so edits show up while serving.
  eleventyConfig.addGlobalData("details", () => {
    const read = (file) => JSON.parse(fs.readFileSync(path.join("src/_data", file), "utf8"));
    const inGroup = (items, group) => items.map((item, i) => ({ ...item, group, number: i + 1, next: items[(i + 1) % items.length] }));
    return [...inGroup(read("offers.json"), "what"), ...inGroup(read("cases.json"), "how")];
  });
  eleventyConfig.addGlobalData("year", () => new Date().getFullYear());

  eleventyConfig.addWatchTarget("src/css/");
  eleventyConfig.addWatchTarget("src/_data/*.json");   // the details global data reads these from disk, so Eleventy cannot see the dependency itself
  eleventyConfig.addWatchTarget("src/assets/js/");

  return {
    dir: { input: "src", output: "_site" },
    templateFormats: ["njk"],
  };
};
