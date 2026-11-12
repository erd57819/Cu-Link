import React from 'react';
import '../css/SearchHelp.css';

const examples = [
  { label: 'OR · 또는', query: '교육,의료', meaning: '교육 또는 의료를 포함' },
  { label: 'AND · 모두', query: '교육+AI', meaning: '교육과 AI를 모두 포함' },
  { label: '제외', query: '교육-입시', meaning: '교육 중 입시는 제외' },
];

export default function SearchHelp({ onUseExample }) {
  return (
    <section className="search-help" id="article-search-help" aria-label="검색 조건 사용법">
      <h3>검색 조건 사용법</h3>
      <p>예시를 누르면 검색어가 입력됩니다.</p>
      <ul>
        {examples.map(example => (
          <li key={example.query}>
            <strong>{example.label}</strong>
            <button type="button" onClick={() => onUseExample(example.query)}>{example.query}</button>
            <span>{example.meaning}</span>
          </li>
        ))}
      </ul>
      <p>쉼표 <b>,</b>는 OR, <b>+</b>는 AND, <b>-</b>는 제외입니다.</p>
      <p>단어 하나로도 검색할 수 있습니다. 제외 조건만 입력하지 마세요. 기간을 지정하려면 시작일·종료일을 함께 선택하세요.</p>
    </section>
  );
}
