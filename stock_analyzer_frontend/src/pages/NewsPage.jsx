import React from 'react';
import NewsFeed from '../components/news/NewsFeed.jsx';

// PUBLIC_INTERFACE
export default function NewsPage() {
  /** News page. */
  return (
    <div className="grid" aria-label="News page">
      <NewsFeed />
    </div>
  );
}
