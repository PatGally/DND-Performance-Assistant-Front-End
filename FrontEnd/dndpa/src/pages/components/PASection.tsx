import React from 'react';

interface NewsItem {
    id: string;
    image: string;
    title: string;
    /** Small icon shown next to the category label */
    categoryIcon: string;
    category: string;
}

/**
 * PASection
 * -----------
 * Two-column layout:
 *   - LEFT: one large "featured" card with a big image and title below it
 *   - RIGHT: a vertical stack of smaller cards (image on the right, text on
 *            the left) with rounded dark backgrounds
 *
 * Cards share the same shape (`NewsItem`) but render differently depending
 * on whether they're the featured item or part of the stack.
 */
const PASection: React.FC = () => {
    const featured: NewsItem = {
        id: 'featured',
        image: '/placeholder-news-featured.jpg',
        title: 'WE ARE OPEN SOURCE!',
        // categoryIcon: '/placeholder-icon.png',
    };

    const sideItems: NewsItem[] = [
        {
            id: 'n1',
            image: '/placeholder-news-1.jpg',
            title: 'Performance Assistant',
            categoryIcon: '/placeholder-icon.png',
            category: 'ACCURATE - FAST - POWERFUL RECOMMENDATIONS',
        },
        {
            id: 'n2',
            image: '/placeholder-news-2.jpg',
            title: 'Manual Mode',
            categoryIcon: '/placeholder-icon.png',
            category: 'MANUALLY ADJUST STATS, POSITIONING, AND EFFECTS AT ANY TIME',
        },
        {
            id: 'n3',
            image: '/placeholder-news-3.jpg',
            title: 'Customization System',
            categoryIcon: '/placeholder-icon.png',
            category: 'ENSURES EVERY ACTION FOLLOWS D&D 5e RULES',
        },
        {
            id: 'n4',
            image: '/placeholder-news-4.jpg',
            title: 'Dynamic Weighting',
            categoryIcon: '/placeholder-icon.png',
            category: 'ADAPTS AND IMPROVES PERFORMANCE ASSISTANT BASED ON REAL GAMEPLAY',
        },
    ];

    return (
        <section className="pa-news" aria-labelledby="news-heading">
            <div className="pa-news__header">
                <h2 id="news-heading" className="pa-section-title">Why Use DNDPA?</h2>
                {/*<a href="#more-news" className="pa-news__see-more">SEE MORE</a>*/}
            </div>

            <div className="pa-news__grid">
                {/* LEFT: featured card */}
                <article className="pa-news__featured">
                    <a className="pa-news__featured-link">
                        <div
                            className="pa-news__featured-image"
                            style={{ backgroundImage: `url(${featured.image})` }}
                            role="img"
                            aria-label="Featured article image"
                        />
                        <h3 className="pa-news__featured-title">{featured.title}</h3>
                        <div className="pa-news__meta">
                            {/*<div className="pa-news__meta-icon" aria-hidden="true" />*/}
                            <span className="pa-news__meta-label">{featured.category}</span>
                        </div>
                    </a>
                </article>

                {/* RIGHT: stacked list of smaller cards */}
                <div className="pa-news__list">
                    {sideItems.map((item) => (
                        <article key={item.id} className="pa-news__card">
                            <a className="pa-news__card-link">
                                <div className="pa-news__card-body">
                                    <h3 className="pa-news__card-title">{item.title}</h3>
                                    <div className="pa-news__meta">
                                        <div className="pa-news__meta-icon" aria-hidden="true" />
                                        <span className="pa-news__meta-label">{item.category}</span>
                                    </div>
                                </div>
                                <div
                                    className="pa-news__card-image"
                                    style={{ backgroundImage: `url(${item.image})` }}
                                    role="img"
                                    aria-label=""
                                />
                            </a>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PASection;