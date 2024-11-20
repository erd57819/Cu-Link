import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import News from "../components/News";

function Main() {
  const [searchResults, setSearchResults] = useState([]);

  return (
      <div className="app-container">
        <div className="search-bar-container">
          <SearchBar setFilteredArticles={setSearchResults} />
        </div>
        <div className="news-container1">
          <News articles={searchResults} />
        </div>
      </div>
  );
}

export default Main;
