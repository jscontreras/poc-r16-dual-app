import { useState } from "react";
import {
  autocomplete,
  getAlgoliaResults,
  Pragma,
  PragmaFrag,
  Render,
} from "@algolia/autocomplete-js";
import { createElement, Fragment, useEffect, useRef } from "react";
import { createLocalStorageRecentSearchesPlugin } from "@algolia/autocomplete-plugin-recent-searches";
import { render } from "react-dom";
import { createQuerySuggestionsPlugin } from "@algolia/autocomplete-plugin-query-suggestions";
import { SearchClient } from "algoliasearch/lite";
import "@algolia/autocomplete-theme-classic";
import "./AutocompleteApp.css";
import { ProductItem } from "../components/ProductItem";
import { createAlgoliaInsightsPlugin } from "@algolia/autocomplete-plugin-algolia-insights";
import { getQueryParam, updateUrlParameter } from "../lib/common";
import { InsightsClient } from "search-insights";
import PubSub from "pubsub-js";

// Constant for Events pub-sub
export const QUERY_UPDATE_EVT = "QUERY_UPDATE_EVT";

// Recent Search Plugin
const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
  key: "navbar",
  limit: 3,
});

// Example fixture for types issues with React/Autocomplete-js
export declare type AutocompleteRenderer = {
  /**
   * The function to create virtual nodes.
   *
   * @default preact.createElement
   */
  createElement: Pragma;
  /**
   * The component to use to create fragments.
   *
   * @default preact.Fragment
   */
  Fragment: PragmaFrag;
  /**
   * The function to render children to an element.
   */
  render?: Render | any;
};

// Using type override for typescript errors
const myReactRenderer: AutocompleteRenderer = {
  createElement,
  Fragment,
  render,
};

// Catalog type
export type Catalog = {
  catalogId: string;
  catalogLabel: string;
  recordsIndex: string;
  suggestionsIndex: string;
  searchPagePath: string;
};

type AutocompleteParams = {
  catalogLabel: string;
  catalogs: Catalog[];
  searchClient: SearchClient;
  insightsClient: InsightsClient;
};

function getActiveCatalog(catalogs: Catalog[]): number {
  let pos = 0;
  catalogs.forEach((catalog, i) => {
    if (window.location.pathname === catalog.searchPagePath) {
      pos = i;
    }
  })
  return pos;
}

/**
 * Auotomplete Search Bar
 */
function AutocompleteApp({
  catalogLabel,
  catalogs,
  searchClient,
  insightsClient,
}: AutocompleteParams) {
  // Check if there is an active catalog
  const initialIndex = getActiveCatalog(catalogs);
  const [selectedOption, setSelectedOption] = useState(catalogs[initialIndex].catalogId);
  const [searchIndices, setSearchIndexes] = useState(catalogs[initialIndex]);
  const containerRef = useRef(null);

  // Query Suggestions Plugin (variates depending on the selected Index)
  const querySuggestionsPlugin = createQuerySuggestionsPlugin({
    searchClient,
    // Index Name changes based on the dropdown selection
    indexName: searchIndices.suggestionsIndex,
    getSearchParams() {
      return {
        hitsPerPage: 3,
      };
    },
  });

  // This Plugin has more options in case you want to forward events to GA4 etc.
  const algoliaInsightsPlugin = createAlgoliaInsightsPlugin({ insightsClient });

  // Dropdown values switcher
  const handleOptionSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Get the new selected value
    const catalogId = event.target.value;
    // Find if there is a configuration that matches the new selected value
    const catalogConfig = catalogs.find(
      (catalog) => catalog.catalogId === catalogId
    );
    // If a configuration is found
    if (catalogConfig) {
      // Ask if I'm in a search result page or not.
      const resultPage = catalogs.find(
        (catalog) => catalog.searchPagePath === window.location.pathname
      );

      if (resultPage) {
        // get the current query
        const query = getQueryParam('q');
        // redirect to the corresponding index + query
        window.location.href = `${catalogConfig.searchPagePath}?q=${query}`;
      } else {
        setSearchIndexes(catalogConfig);
        setSelectedOption(catalogConfig.catalogId);
      }
    }
  };

  // Rendering autocomplete after component mounts
  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }
    const autocompleteInstance = autocomplete({
      container: containerRef.current,
      renderer: myReactRenderer,
      openOnFocus: true,
      insights: true,
      placeholder: "Search for Products",
      onSubmit({ state }) {
        updateUrlParameter("q", state.query);

        // Validate if you are in the searchPage (Otherwise redirect using q param)
        if (window.location.pathname !== searchIndices.searchPagePath) {
          window.location.href = `${searchIndices.searchPagePath}?q=${state.query}`;
        } else {
          PubSub.publish(QUERY_UPDATE_EVT, {
            query: state.query,
            index: searchIndices.recordsIndex,
          });
        }
      },
      plugins: [
        querySuggestionsPlugin,
        recentSearchesPlugin,
        algoliaInsightsPlugin,
      ],
      getSources({ query }) {
        return [
          {
            sourceId: "products",
            getItems() {
              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    // Index Name changes based on the dropdown selection
                    indexName: searchIndices.recordsIndex,
                    query,
                    params: {
                      hitsPerPage: 3,
                    },
                  },
                ],
              });
            },
            templates: {
              item({ item, components }) {
                return (
                  <ProductItem
                    hit={item}
                    components={components}
                    navigator={autocompleteInstance.navigator}
                  />
                );
              },
              noResults() {
                return "No products matching.";
              },
            },
          },
        ];
      },
    });
    // Set the query value if available in url (doesn't trigger a search)
    if (getQueryParam("q") !== "") {
      autocompleteInstance.setQuery(getQueryParam("q"));
    }
    return () => {
      autocompleteInstance.destroy();
    };
    // Refresh when The index is switched
  }, [searchIndices]);

  return (
    <div id="search-bar" className="search-bar">
      <span className="search-bar__app-id">{`<Search Bar App>`}</span>
      <div className="search-bar__catalog-selector">
        <label htmlFor="catalog-select">{catalogLabel}: </label>
        <select
          id="catalog-select"
          value={selectedOption}
          onChange={handleOptionSelect}
        >
          {catalogs.map((catalog) => {
            return (
              <option key={catalog.catalogId} value={catalog.catalogId}>
                {catalog.catalogLabel}
              </option>
            );
          })}
        </select>
      </div>
      <div ref={containerRef} className="search-bar__search-autocomplete" />
    </div>
  );
}

export default AutocompleteApp;
