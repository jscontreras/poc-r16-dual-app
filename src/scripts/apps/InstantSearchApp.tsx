import { SearchClient } from "algoliasearch/lite";
import { ClearRefinements, CurrentRefinements, DynamicWidgets, RefinementList, useInstantSearch, useSearchBox } from "react-instantsearch-hooks-web";
import PubSub from "pubsub-js";
import aa from 'search-insights';
import { createInsightsMiddleware } from 'instantsearch.js/es/middlewares';

// Set user token (this is dynamic!)
aa('setUserToken', 'ma-user-999');
// Set Insights Middleware
function InsightsMiddleware() {
  const { use } = useInstantSearch();

  useEffect(() => {
    const middleware = createInsightsMiddleware({
      insightsClient: aa,
    });

    return use(middleware);
  }, [use]);

  return null;
}



// Include only the reset
import "instantsearch.css/themes/reset.css";
// or include the full Satellite theme
import "instantsearch.css/themes/satellite.css";
import "./InstantSearchApp.css";
import {
  HierarchicalMenu,
  Hits,
  Configure,
  Pagination,
  InstantSearch,
} from "react-instantsearch-hooks-web";
import { HitComponent } from "../components/HitComponent";
import { getQueryParam } from "../lib/common";
import { useEffect } from "react";
import { QUERY_UPDATE_EVT } from "./AutocompleteApp";

type instantSearchParams = {
  searchClient: SearchClient;
  indexId: string;
};

/**
 * Virtual SearchBox that receives updates from Autocomplete
 * @param props
 * @returns
 */
function CustomSearchBox({ indexId }: any) {
  const { refine } = useSearchBox();
  useEffect(() => {
    // Listen to the propagated events and update the app
    const token = PubSub.subscribe(QUERY_UPDATE_EVT, (_msg, data) => {
      if (data.index === indexId) {
        refine(data.query);
      }
    });
    return () => {
      PubSub.unsubscribe(token);
    };
  }, []);

  return <></>;
}

/**
 * Main InstantSearch App component.
 */
const InstantSearchApp = ({ searchClient, indexId }: instantSearchParams) => {
  // Synchronize search via URL during the page load
  const initialUIState: any = {};
  // Set the query value if available in url (doesn't trigger a search)
  const initialQuery = getQueryParam("q");
  initialUIState[indexId] = {
    query: initialQuery,
  };

  return (
    <div className="search-is">
      <span className="search-is__app-id">
        {`<InstantSearch App> (${indexId})`}{" "}
      </span>
      <InstantSearch
        searchClient={searchClient}
        indexName={indexId}
        routing={false}
        initialUiState={initialUIState}
      >
        <Configure hitsPerPage={12} clickAnalytics />
        <InsightsMiddleware />
        <CustomSearchBox indexId={indexId} />
        <main>
          <div className="menu">
            <DynamicWidgets facets={['*']}>
              <RefinementList
                attribute="brand"
                classNames={{ root: "brand-facets" }}
              />
              <HierarchicalMenu
                attributes={[
                  "hierarchicalCategories.lvl0",
                  "hierarchicalCategories.lvl1",
                  "hierarchicalCategories.lvl2",
                  "hierarchicalCategories.lvl3",
                ]}
                separator=" > "
                showMore={true}
              />
            </DynamicWidgets>
          </div>
          <div className="results">
            <div className="refinements-container">
              <CurrentRefinements transformItems={(items) => {
                return items.map((item) => {
                  if (item.label.includes('hierarchicalCategories')) {
                    item.label = 'Category';
                  }
                  return item;
                })
              }} />
              <ClearRefinements />
            </div>

            <Hits hitComponent={HitComponent} />
            <Pagination />
          </div>
        </main>
      </InstantSearch>
    </div>
  );
};

export default InstantSearchApp;
