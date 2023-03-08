import { Configuration } from "webpack";

import { getLoaders, loaderByName } from "@craco/craco";

export default {
  webpack: {
    configure: (webpackConfig: Configuration) => {
      const { hasFoundAny, matches } = getLoaders(
        webpackConfig,
        loaderByName("babel-loader")
      );

      if (hasFoundAny) {
        matches.forEach((c) => {
          // Modify test to include cjs for @chainsafe/libp2p-gossipsub rpc module
          if (c.loader.test.toString().includes("mjs")) {
            c.loader.test = /\.(js|cjs|mjs|jsx|ts|tsx)$/;
          }
        });
      }

      return webpackConfig;
    },
  },
};
