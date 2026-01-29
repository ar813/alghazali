import React from 'react';

const SchemaOrg = () => {
    const schoolSchema = {
        "@context": "https://schema.org",
        "@type": "School",
        "name": "Al Ghazali High School",
        "alternateName": "Al Ghazali School",
        "description": "Established in 1993, Al Ghazali High School provides quality education combining modern pedagogy with Islamic values in Landhi, Karachi.",
        "url": "https://alghazali.vercel.app",
        "logo": "https://alghazali.vercel.app/logo.png",
        "image": "https://alghazali.vercel.app/logo.png",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Area 36-B, Double Road, Landhi Town",
            "addressLocality": "Korangi, Karachi",
            "addressRegion": "Sindh",
            "postalCode": "75160",
            "addressCountry": "PK"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 24.844437177939817,
            "longitude": 67.17068637515153
        },
        "telephone": "+92 321 9230035",
        "email": "ar3584158@gmail.com",
        "openingHours": "Mo,Tu,We,Th,Sa 08:00-14:10",
        "sameAs": [
            "https://www.facebook.com/p/Al-Ghazali-High-School-36B-Landhi-Karachi-100071529611065/"
        ],
        "parentOrganization": {
            "@type": "Organization",
            "name": "Al Razi Educational & Welfare Society"
        },
        "foundingDate": "1994"
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolSchema) }}
        />
    );
};

export default SchemaOrg;
