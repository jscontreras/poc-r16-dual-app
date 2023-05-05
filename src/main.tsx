import React from "react";
import ReactDOM from "react-dom";
import AutocompleteApp, { Catalog } from "./apps/AutocompleteApp";
import InstantSearchApp from "./apps/InstantSearchApp";
import "./index.css";
import algoliasearch from "algoliasearch/lite";
import insightsClient from "search-insights";

// Algolia Credentials
const appId = "latency";
const apiKey = "6be0576ff61c053d5f9a3225e2a90f76";

// Initializing Search Client
const searchClient = algoliasearch(appId, apiKey);

// Insights Analytics Client.
insightsClient("init", { appId, apiKey });

const catalogs: Catalog[] = [
  {
    catalogId: "products",
    catalogLabel: "All Products",
    recordsIndex: "instant_search",
    suggestionsIndex: "instant_search_demo_query_suggestions",
    searchPagePath: "/",
  },
  {
    catalogId: "expensiveProducts",
    catalogLabel: "Expensive Products",
    recordsIndex: "instant_search_price_desc",
    suggestionsIndex: "instant_search_query_suggestions_test",
    searchPagePath: "/",
  },
];

/**
 * Initializes app loading Search Results (lazy)
 */
function initializeSearchApps() {
  // Injects the search bar if div is avilable in the DOM
  const searchBarContainer = document.getElementById("search-bar__container");
  if (searchBarContainer) {
    ReactDOM.render(
      <React.StrictMode>
        <AutocompleteApp
          catalogs={catalogs}
          catalogLabel={"Select Catalog"}
          insightsClient={insightsClient}
          searchClient={searchClient}
        />
      </React.StrictMode>,
      searchBarContainer
    );
  }

  // Injects search results app if div is available in the DOM
  const searchAppContainer = document.getElementById("search-results-products");
  if (searchAppContainer) {
    ReactDOM.render(
      <InstantSearchApp indexId="instant_search" searchClient={searchClient} />,
      searchAppContainer
    );
  }


  // Injects search results app2 if div is available in the DOM
  const searchAppContainer2 = document.getElementById("search-results-expensive-products");
  if (searchAppContainer) {
    ReactDOM.render(
      <InstantSearchApp indexId="instant_search_price_desc" searchClient={searchClient} />,
      searchAppContainer2
    );
  }
}

// App trigger
initializeSearchApps();
