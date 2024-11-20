import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import News from "../components/News";

function Main() {
  const [searchResults, setSearchResults] = useState(null);

  return (
      <div className="app-container">
        <div className="search-bar-container">
          {/* SearchBar에서 데이터를 받는 즉시 로그 출력 */}
          <SearchBar setSearchResults={(results) => {
            console.log("Search Results received in Main:", results); // 2번: SearchBar에서 데이터 확인
            setSearchResults(results); // 상태 업데이트
          }} />
        </div>
        <div className="news-container1">
          <News searchResults={searchResults} />
        </div>
      </div>
  );
}

export default Main;
