export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Lo-Fi.Study",
  "url": "https://lo-fi.study",
  "logo": "https://lo-fi.study/icon?size=512",
  "description": "Boost your productivity with Lo-Fi.Study - the ultimate focus companion featuring Pomodoro timer, ambient sounds, and progress tracking.",
  "foundingDate": "2024",
  "sameAs": [
    "https://twitter.com/lofistudy"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "https://lo-fi.study/contact"
  }
};

export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Lo-Fi.Study",
  "url": "https://lo-fi.study",
  "description": "Boost your productivity with Lo-Fi.Study - the ultimate focus companion featuring Pomodoro timer, ambient sounds, and progress tracking.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://lo-fi.study/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Lo-Fi.Study Team"
  }
};

export const breadcrumbStructuredData = (items: Array<{name: string, url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});
