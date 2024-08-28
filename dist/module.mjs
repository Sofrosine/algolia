import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { useLogger, defineNuxtModule, isNuxt2, addComponentsDir, addPlugin, addImportsDir, addServerHandler } from '@nuxt/kit';
import { defu } from 'defu';
import algoliasearch from 'algoliasearch';
import scraper from 'metadata-scraper';

function createShouldInclude(options) {
  const { include } = options.crawler;
  return typeof include === "function" ? include : (route) => include.some((pattern) => route.match(pattern));
}
function createMetaGetter(options) {
  const { meta } = options.crawler;
  if (typeof meta === "function") {
    return meta;
  }
  const defaultMetaGetter = createDefaultMetaGetter();
  if (Array.isArray(meta)) {
    return async (html, route) => {
      const metadata = await defaultMetaGetter(html, route);
      return meta.reduce((acc, key) => ({ ...acc, [key]: metadata[key] }), {});
    };
  }
  return defaultMetaGetter;
}
function createDefaultMetaGetter() {
  return async (html, route) => {
    return await scraper({
      html,
      url: route
    });
  };
}
function createPageGenerateHook(nuxt, options, pages) {
  const shouldInclude = createShouldInclude(options);
  const getMeta = createMetaGetter(options);
  return async (html, route) => {
    if (shouldInclude(route)) {
      const meta = await getMeta(html, route);
      const page = { href: route, ...meta };
      await nuxt.callHook("crawler:add:before", {
        route,
        html,
        meta,
        page
      });
      pages.push(page);
      await nuxt.callHook("crawler:add:after", {
        route,
        html,
        meta,
        page
      });
    }
  };
}
function createGenerateDoneHook(nuxt, options, pages) {
  return async () => {
    if (pages.length > 0 && options.crawler) {
      const { crawler: { apiKey, indexName }, applicationId } = options;
      const client = algoliasearch(applicationId, apiKey);
      const index = client.initIndex(indexName);
      await nuxt.callHook("crawler:index:before", {
        options,
        pages,
        client,
        index
      });
      await index.replaceAllObjects(pages, {
        autoGenerateObjectIDIfNotExist: true
      });
      await nuxt.callHook("crawler:index:after", {
        options,
        pages,
        client,
        index
      });
    }
  };
}

var InstantSearchThemes = /* @__PURE__ */ ((InstantSearchThemes2) => {
  InstantSearchThemes2[InstantSearchThemes2["reset"] = 0] = "reset";
  InstantSearchThemes2[InstantSearchThemes2["algolia"] = 1] = "algolia";
  InstantSearchThemes2[InstantSearchThemes2["satellite"] = 2] = "satellite";
  return InstantSearchThemes2;
})(InstantSearchThemes || {});

const MODULE_NAME = "@nuxtjs/algolia";
const logger = useLogger(MODULE_NAME);
function throwError(message) {
  throw new Error(`\`[${MODULE_NAME}]\` ${message}`);
}
const module = defineNuxtModule({
  meta: {
    name: "@nuxtjs/algolia",
    configKey: "algolia",
    compatibility: {
      nuxt: "^3.0.0-rc.9 || ^2.16.0",
      bridge: true
    }
  },
  defaults: {
    applicationId: process.env.ALGOLIA_APPLICATION_ID || "",
    apiKey: process.env.ALGOLIA_API_KEY || "",
    globalIndex: "",
    lite: true,
    cache: false,
    instantSearch: false,
    docSearch: {},
    useFetch: false,
    crawler: {
      apiKey: "",
      indexName: "",
      include: () => true,
      meta: ["title", "description"]
    }
  },
  setup(options, nuxt) {
    const runtimeDir = fileURLToPath(new URL("./runtime", import.meta.url));
    nuxt.options.build.transpile.push(runtimeDir);
    const notRunningInPrepareScript = !nuxt.options._prepare;
    if (!options.apiKey && notRunningInPrepareScript) {
      throwError("Missing `apiKey`");
    }
    if (!options.applicationId && notRunningInPrepareScript) {
      throwError("Missing `applicationId`");
    }
    if (options.crawler.apiKey || options.crawler.indexName) {
      if (!options.crawler.apiKey && notRunningInPrepareScript) {
        throwError("Missing `crawler.apiKey`");
      }
      if (!options.crawler.indexName && notRunningInPrepareScript) {
        throwError("Missing `crawler.indexName`");
      }
      const pages = [];
      const pageGenerator = createPageGenerateHook(nuxt, options, pages);
      const doneGenerator = createGenerateDoneHook(nuxt, options, pages);
      if (isNuxt2(nuxt)) {
        nuxt.addHooks({
          // @ts-expect-error Nuxt 2 only hook
          "generate:page": createPageGenerateHook(nuxt, options, pages),
          "generate:done": createGenerateDoneHook(nuxt, options, pages)
        });
      } else {
        nuxt.hooks.hookOnce("nitro:init", (nitro) => {
          nitro.hooks.hookOnce("prerender:routes", () => {
            nitro.hooks.hook("prerender:route", async ({ route, contents }) => {
              await pageGenerator(contents, route);
            });
            nitro.hooks.hookOnce("close", async () => {
              await doneGenerator();
            });
          });
        });
      }
    }
    if (Object.keys(options.docSearch).length) {
      addComponentsDir({
        path: resolve(runtimeDir, "components"),
        pathPrefix: false,
        prefix: "",
        // @ts-ignore
        level: 999,
        global: true
      });
    }
    if (isNuxt2() && !nuxt?.options?.runtimeConfig?.public?.algolia) {
      nuxt.options.publicRuntimeConfig.algolia = defu(nuxt.options.publicRuntimeConfig.algolia, {
        apiKey: options.apiKey,
        applicationId: options.applicationId,
        lite: options.lite,
        instantSearch: options.instantSearch,
        docSearch: options.docSearch,
        recommend: options.recommend,
        globalIndex: options.globalIndex,
        useFetch: options.useFetch
      });
    }
    nuxt.options.runtimeConfig.public = nuxt.options.runtimeConfig.public || {};
    nuxt.options.runtimeConfig.public.algolia = defu(nuxt.options.runtimeConfig.algolia, {
      apiKey: options.apiKey,
      applicationId: options.applicationId,
      lite: options.lite,
      cache: options.cache,
      instantSearch: options.instantSearch,
      docSearch: options.docSearch,
      recommend: options.recommend,
      globalIndex: options.globalIndex,
      useFetch: options.useFetch
    });
    if (options.instantSearch) {
      nuxt.options.build.transpile.push("vue-instantsearch/vue3");
      if (typeof options.instantSearch === "object") {
        const { theme } = options.instantSearch;
        if (theme) {
          if (theme in InstantSearchThemes) {
            nuxt.options.css.push(`instantsearch.css/themes/${theme}.css`);
          } else {
            logger.error("Invalid theme:", theme);
          }
        }
      }
    }
    nuxt.hook("vite:extendConfig", (config, { isClient }) => {
      if (isClient) {
        config.resolve.alias["@algolia/requester-node-http"] = "unenv/runtime/mock/empty";
      }
    });
    addPlugin(resolve(runtimeDir, "plugin"));
    addImportsDir(resolve(runtimeDir, "composables"));
    if (options?.indexer && Object.keys(options?.indexer).length) {
      const cmsProvider = Object.keys(options.indexer)[0];
      nuxt.options.runtimeConfig.algoliaIndexer = defu(nuxt.options.runtimeConfig.algoliaIndexer, {
        // @ts-ignore
        [cmsProvider]: options.indexer[cmsProvider]
      });
      addServerHandler({
        route: "/api/indexer",
        handler: resolve(runtimeDir, `server/api/${cmsProvider}`)
      });
    }
  }
});

export { InstantSearchThemes, module as default };
