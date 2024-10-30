import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import News from "../components/News";

function Main() {
  const [filteredArticles, setFilteredArticles] = useState([]); // 필터링된 결과만 관리

  return (
      <div className="app-container">
        <div className="search-bar-container">
          <SearchBar setFilteredArticles={setFilteredArticles} />
        </div>
        <div className="news-container1">
          <News articles={filteredArticles} />
        </div>
      </div>
  );
}

export default Main;
