#!/usr/bin/env python3
"""Generate 100 English usecase pages for Hawaii market"""

import os
import urllib.parse

# Template for usecase pages
TEMPLATE = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Use Cases | TokiStorage</title>
    <meta name="description" content="{meta_description}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700&family=Zen+Kaku+Gothic+New:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="index.css">
    <style>
        :root {{
            --theme-color: {theme_color};
            --theme-light: {theme_light};
            --theme-dark: {theme_dark};
        }}

        .usecase-detail {{
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            padding-top: 6rem;
        }}

        .usecase-hero {{
            text-align: center;
            padding: 3rem 2rem;
            background: linear-gradient(135deg, var(--theme-light) 0%, #fff 100%);
            border-radius: 16px;
            margin-bottom: 3rem;
        }}

        .usecase-hero .icon {{
            font-size: 3.5rem;
            margin-bottom: 1rem;
        }}

        .usecase-hero h1 {{
            font-family: 'Shippori Mincho', serif;
            font-size: 2rem;
            color: #1e293b;
            margin-bottom: 0.5rem;
        }}

        .usecase-hero .subtitle {{
            color: var(--theme-color);
            font-size: 1.1rem;
            font-weight: 500;
        }}

        .usecase-section {{
            margin-bottom: 3rem;
        }}

        .usecase-section h2 {{
            font-family: 'Shippori Mincho', serif;
            font-size: 1.4rem;
            color: #1e293b;
            margin-bottom: 1rem;
            padding-left: 1rem;
            border-left: 4px solid var(--theme-color);
        }}

        .usecase-section p {{
            color: #475569;
            line-height: 1.9;
            margin-bottom: 1rem;
        }}

        .scene-cards {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }}

        .scene-card {{
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
        }}

        .scene-card h3 {{
            font-size: 1rem;
            color: var(--theme-color);
            margin-bottom: 0.5rem;
        }}

        .scene-card p {{
            font-size: 0.9rem;
            color: #64748b;
            margin: 0;
        }}

        .benefits-list {{
            list-style: none;
            padding: 0;
        }}

        .benefits-list li {{
            padding: 0.8rem 0;
            padding-left: 2rem;
            position: relative;
            border-bottom: 1px solid #f1f5f9;
        }}

        .benefits-list li::before {{
            content: '\\2713';
            position: absolute;
            left: 0;
            color: var(--theme-color);
            font-weight: bold;
        }}

        .quote-box {{
            background: var(--theme-light);
            border-radius: 12px;
            padding: 2rem;
            margin: 2rem 0;
        }}

        .quote-box blockquote {{
            font-family: 'Shippori Mincho', serif;
            font-size: 1.15rem;
            color: #334155;
            font-style: italic;
            margin: 0;
            line-height: 1.8;
        }}

        .quote-box .source {{
            margin-top: 1rem;
            font-size: 0.9rem;
            color: #64748b;
        }}

        .flow-steps {{
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }}

        .flow-step {{
            display: flex;
            gap: 1rem;
            align-items: flex-start;
        }}

        .flow-step .num {{
            width: 32px;
            height: 32px;
            background: var(--theme-color);
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
        }}

        .flow-step .content h4 {{
            font-size: 1rem;
            color: #1e293b;
            margin-bottom: 0.3rem;
        }}

        .flow-step .content p {{
            font-size: 0.9rem;
            color: #64748b;
            margin: 0;
        }}

        .cta-box {{
            text-align: center;
            padding: 3rem;
            background: linear-gradient(135deg, var(--theme-light) 0%, #f8fafc 100%);
            border-radius: 16px;
            margin-top: 3rem;
        }}

        .cta-box h2 {{
            font-family: 'Shippori Mincho', serif;
            font-size: 1.5rem;
            color: #1e293b;
            margin-bottom: 1rem;
        }}

        .cta-box p {{
            color: #64748b;
            margin-bottom: 1.5rem;
        }}

        .cta-box .btn-primary {{
            display: inline-block;
            padding: 1rem 2.5rem;
            background: var(--theme-color);
            color: #fff;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            transition: background 0.2s;
        }}

        .cta-box .btn-primary:hover {{
            background: var(--theme-dark);
        }}

        .back-link {{
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--theme-color);
            text-decoration: none;
            font-size: 0.9rem;
            margin-bottom: 2rem;
        }}

        .back-link:hover {{
            text-decoration: underline;
        }}

        @media (max-width: 768px) {{
            .usecase-detail {{
                padding: 1.5rem;
                padding-top: 5rem;
            }}

            .usecase-hero h1 {{
                font-size: 1.6rem;
            }}

            .scene-cards {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>

<!-- Navigation -->
<nav class="toki-nav">
    <a href="index-en.html" class="nav-logo">TokiStorage</a>
    <div class="nav-links">
        <a href="usecases-en.html">Use Cases</a>
        <a href="index-en.html#pricing">Pricing</a>
        <a href="index-en.html#faq">FAQ</a>
        <a href="index-en.html#cta" class="nav-cta">Free Consultation</a>
    </div>
    <button class="nav-toggle" aria-label="Menu">
        <span></span><span></span><span></span>
    </button>
</nav>

<main class="usecase-detail">
    <a href="usecases-en.html" class="back-link">&#x2190; Back to Use Cases</a>

    <div class="usecase-hero">
        <div class="icon">{icon}</div>
        <h1>{title}</h1>
        <p class="subtitle">{subtitle}</p>
    </div>

    <section class="usecase-section">
        <h2>{why_title}</h2>
        <p>{why_p1}</p>
        <p>{why_p2}</p>
    </section>

    <section class="usecase-section">
        <h2>Ideal Scenarios</h2>
        <div class="scene-cards">
            <div class="scene-card">
                <h3>{scene1_title}</h3>
                <p>{scene1_desc}</p>
            </div>
            <div class="scene-card">
                <h3>{scene2_title}</h3>
                <p>{scene2_desc}</p>
            </div>
            <div class="scene-card">
                <h3>{scene3_title}</h3>
                <p>{scene3_desc}</p>
            </div>
            <div class="scene-card">
                <h3>{scene4_title}</h3>
                <p>{scene4_desc}</p>
            </div>
        </div>
    </section>

    <div class="quote-box">
        <blockquote>
            "{quote}"
        </blockquote>
        <p class="source">── {quote_source}</p>
    </div>

    <section class="usecase-section">
        <h2>Benefits for Your Business</h2>
        <ul class="benefits-list">
            <li><strong>{benefit1_title}</strong> ─ {benefit1_desc}</li>
            <li><strong>{benefit2_title}</strong> ─ {benefit2_desc}</li>
            <li><strong>{benefit3_title}</strong> ─ {benefit3_desc}</li>
            <li><strong>{benefit4_title}</strong> ─ {benefit4_desc}</li>
            <li><strong>{benefit5_title}</strong> ─ {benefit5_desc}</li>
        </ul>
    </section>

    <section class="usecase-section">
        <h2>How It Works</h2>
        <div class="flow-steps">
            <div class="flow-step">
                <div class="num">1</div>
                <div class="content">
                    <h4>Consultation</h4>
                    <p>We learn about your brand, target customers, and goals.</p>
                </div>
            </div>
            <div class="flow-step">
                <div class="num">2</div>
                <div class="content">
                    <h4>Custom Plan</h4>
                    <p>We design a tailored TokiStorage integration for your business.</p>
                </div>
            </div>
            <div class="flow-step">
                <div class="num">3</div>
                <div class="content">
                    <h4>Design & Production</h4>
                    <p>Create custom templates featuring your branding.</p>
                </div>
            </div>
            <div class="flow-step">
                <div class="num">4</div>
                <div class="content">
                    <h4>Launch</h4>
                    <p>Staff training, marketing materials, and go-live support.</p>
                </div>
            </div>
        </div>
    </section>

    <div class="cta-box">
        <h2>Ready to Get Started?</h2>
        <p>Let's discuss how TokiStorage can enhance<br>your {business_type} experience.</p>
        <a href="https://calendly.com/pearlmemorial/pearlmemorialsession" class="btn-primary" target="_blank" rel="noopener">Book a Free Consultation</a>
    </div>
</main>

<!-- Footer -->
<footer class="toki-footer">
    <div class="footer-inner">
        <div class="footer-brand">
            <h3>TokiStorage</h3>
            <p>Eternal memorial engraved in quartz glass.<br>No server, no maintenance.<br>Proof of existence, delivered 1,000 years forward.</p>
        </div>
        <div class="footer-links-group">
            <h4>Links</h4>
            <a href="index-en.html">About TokiStorage</a>
            <a href="usecases-en.html">Use Cases</a>
            <a href="index-en.html#pricing">Pricing</a>
            <a href="index-en.html#faq">FAQ</a>
        </div>
        <div class="footer-links-group">
            <h4>Legal</h4>
            <a href="tokushoho-en.html">Commercial Transactions Act</a>
            <a href="privacy-en.html">Privacy Policy</a>
        </div>
        <div class="footer-links-group">
            <h4>Company</h4>
            <p>TokiStorage</p>
            <p>&copy; 2026 All rights reserved.</p>
        </div>
    </div>
</footer>

<script src="index.js"></script>
</body>
</html>
'''

# Usecase data: (filename, data_dict)
USECASES = [
    # 1-20: Tourism & Leisure
    ("usecase-resort-en.html", {
        "title": "Luxury Resort Hotels",
        "meta_description": "TokiStorage for luxury resorts. Offer guests eternal memories of their Hawaiian paradise stay.",
        "icon": "🏨",
        "subtitle": "Turn paradise stays into eternal memories",
        "theme_color": "#0369A1",
        "theme_light": "#E0F2FE",
        "theme_dark": "#075985",
        "why_title": "Why Luxury Resorts?",
        "why_p1": "A stay at a Hawaiian luxury resort is more than a vacation—it's a milestone. Honeymoons, anniversaries, retirement celebrations, family reunions. These moments deserve to last forever.",
        "why_p2": "TokiStorage transforms these precious memories into eternal keepsakes, engraved in quartz glass that will outlast generations. Give your guests something truly unforgettable.",
        "scene1_title": "VIP Guest Amenity",
        "scene1_desc": "Exclusive gift for suite guests and loyalty program members.",
        "scene2_title": "Honeymoon Package",
        "scene2_desc": "Include a couples' memory capsule in romantic getaway packages.",
        "scene3_title": "Anniversary Celebrations",
        "scene3_desc": "Special commemoration for milestone anniversaries celebrated at your resort.",
        "scene4_title": "Family Reunion Keepsake",
        "scene4_desc": "Multi-generational family gatherings preserved forever.",
        "quote": "We came here for our 50th anniversary. Having this moment preserved in quartz glass—it's like our love story will live on forever.",
        "quote_source": "Potential guest testimonial",
        "benefit1_title": "Premium Differentiation",
        "benefit1_desc": "Offer something no other resort can match",
        "benefit2_title": "Emotional Connection",
        "benefit2_desc": "Create deep, lasting bonds with guests",
        "benefit3_title": "Zero Inventory Risk",
        "benefit3_desc": "Made-to-order, no storage or waste",
        "benefit4_title": "Revenue Stream",
        "benefit4_desc": "High-margin add-on service",
        "benefit5_title": "Word of Mouth",
        "benefit5_desc": "Guests share unique experiences with others",
        "business_type": "resort"
    }),
    ("usecase-boutique-hotel-en.html", {
        "title": "Boutique Hotels",
        "meta_description": "TokiStorage for boutique hotels. Create intimate, personalized memory experiences for discerning travelers.",
        "icon": "🏡",
        "subtitle": "Intimate stays, eternal impressions",
        "theme_color": "#7C3AED",
        "theme_light": "#EDE9FE",
        "theme_dark": "#5B21B6",
        "why_title": "Why Boutique Hotels?",
        "why_p1": "Boutique hotels are chosen for their unique character and personalized service. Your guests seek authentic experiences, not cookie-cutter stays.",
        "why_p2": "TokiStorage aligns perfectly with this philosophy—each piece is as unique as your property, capturing the individual story of every guest's journey.",
        "scene1_title": "Welcome Gift",
        "scene1_desc": "Personalized arrival amenity for returning guests.",
        "scene2_title": "Local Experience",
        "scene2_desc": "Pair with curated local activities for complete memory packages.",
        "scene3_title": "Artist Collaborations",
        "scene3_desc": "Partner with local artists for limited-edition designs.",
        "scene4_title": "Seasonal Collections",
        "scene4_desc": "Create special editions for holidays and events.",
        "quote": "This little hotel felt like home. Now I have a piece of that feeling to keep forever.",
        "quote_source": "Potential guest testimonial",
        "benefit1_title": "Brand Storytelling",
        "benefit1_desc": "Reinforce your unique identity",
        "benefit2_title": "Guest Loyalty",
        "benefit2_desc": "Create emotional reasons to return",
        "benefit3_title": "Social Media Content",
        "benefit3_desc": "Guests love sharing unique finds",
        "benefit4_title": "Local Partnerships",
        "benefit4_desc": "Collaborate with island artisans",
        "benefit5_title": "Competitive Edge",
        "benefit5_desc": "Stand out in a crowded market",
        "business_type": "boutique hotel"
    }),
    ("usecase-vacation-rental-en.html", {
        "title": "Vacation Rentals",
        "meta_description": "TokiStorage for vacation rentals and property managers. Add memorable touches to guest experiences.",
        "icon": "🏠",
        "subtitle": "Make every rental unforgettable",
        "theme_color": "#059669",
        "theme_light": "#D1FAE5",
        "theme_dark": "#047857",
        "why_title": "Why Vacation Rentals?",
        "why_p1": "In the competitive vacation rental market, guest experience is everything. Reviews, referrals, and repeat bookings depend on creating memorable stays.",
        "why_p2": "TokiStorage gives property managers a powerful tool to surprise and delight guests, turning ordinary rentals into extraordinary experiences.",
        "scene1_title": "Welcome Package",
        "scene1_desc": "Include in premium welcome baskets for special occasions.",
        "scene2_title": "Extended Stay Gift",
        "scene2_desc": "Thank guests who book longer stays with a keepsake.",
        "scene3_title": "Property Anniversary",
        "scene3_desc": "Celebrate milestones of your rental property.",
        "scene4_title": "Review Incentive",
        "scene4_desc": "Offer as appreciation for detailed reviews.",
        "quote": "We've stayed in dozens of rentals. This is the only one we'll never forget.",
        "quote_source": "Potential guest testimonial",
        "benefit1_title": "5-Star Reviews",
        "benefit1_desc": "Wow factor that drives ratings",
        "benefit2_title": "Direct Bookings",
        "benefit2_desc": "Build relationships beyond platforms",
        "benefit3_title": "Premium Positioning",
        "benefit3_desc": "Justify higher nightly rates",
        "benefit4_title": "Referral Driver",
        "benefit4_desc": "Guests recommend to friends and family",
        "benefit5_title": "Minimal Effort",
        "benefit5_desc": "Easy to implement, high impact",
        "business_type": "vacation rental"
    }),
    ("usecase-cruise-en.html", {
        "title": "Cruise Lines",
        "meta_description": "TokiStorage for cruise lines. Transform Pacific voyages into eternal memories for passengers.",
        "icon": "🚢",
        "subtitle": "Voyages that last forever",
        "theme_color": "#0284C7",
        "theme_light": "#E0F2FE",
        "theme_dark": "#0369A1",
        "why_title": "Why Cruise Lines?",
        "why_p1": "A Hawaiian cruise is a bucket-list experience. Passengers come to celebrate life's milestones—retirements, anniversaries, family reunions—surrounded by the Pacific's endless blue.",
        "why_p2": "TokiStorage captures these precious moments in a format that will outlast the ocean itself. Perfect for onboard shops, VIP packages, and special occasion cruises.",
        "scene1_title": "Captain's Circle Gift",
        "scene1_desc": "Exclusive amenity for top-tier loyalty members.",
        "scene2_title": "Maiden Voyage Commemoration",
        "scene2_desc": "Limited edition for inaugural sailings.",
        "scene3_title": "Onboard Boutique",
        "scene3_desc": "Premium offering in duty-free shops.",
        "scene4_title": "Port of Call Collection",
        "scene4_desc": "Capture memories from each Hawaiian island visited.",
        "quote": "Watching the sunset from the deck with my grandchildren—now that moment is preserved forever in quartz.",
        "quote_source": "Potential passenger testimonial",
        "benefit1_title": "Unique Merchandise",
        "benefit1_desc": "Differentiate from typical cruise souvenirs",
        "benefit2_title": "High Margins",
        "benefit2_desc": "Premium product, premium pricing",
        "benefit3_title": "No Inventory",
        "benefit3_desc": "Made-to-order eliminates overstock",
        "benefit4_title": "Brand Enhancement",
        "benefit4_desc": "Associate your line with legacy",
        "benefit5_title": "Repeat Cruisers",
        "benefit5_desc": "Emotional connection drives rebooking",
        "business_type": "cruise line"
    }),
    ("usecase-helicopter-en.html", {
        "title": "Helicopter Tours",
        "meta_description": "TokiStorage for helicopter tour operators. Preserve breathtaking aerial views of Hawaii forever.",
        "icon": "🚁",
        "subtitle": "Sky-high memories, grounded forever",
        "theme_color": "#DC2626",
        "theme_light": "#FEE2E2",
        "theme_dark": "#B91C1C",
        "why_title": "Why Helicopter Tours?",
        "why_p1": "Soaring over volcanoes, waterfalls, and na pali coastlines—helicopter tours offer perspectives that take breath away. These are peak life experiences.",
        "why_p2": "TokiStorage transforms these aerial adventures into permanent keepsakes, combining flight data, photos, and personal messages into an eternal record of the journey.",
        "scene1_title": "Volcano Flight Package",
        "scene1_desc": "Commemorate flights over active volcanic landscapes.",
        "scene2_title": "Doors-Off Adventure",
        "scene2_desc": "Special edition for premium photography flights.",
        "scene3_title": "Sunset Flight Memory",
        "scene3_desc": "Capture golden hour magic forever.",
        "scene4_title": "Proposal Flights",
        "scene4_desc": "Engagement moment preserved in quartz.",
        "quote": "I proposed to her above the Na Pali Coast. Now that moment is literally set in stone—well, quartz.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Upsell Opportunity",
        "benefit1_desc": "High-value add-on to premium tours",
        "benefit2_title": "Memorable Differentiation",
        "benefit2_desc": "Stand out from competitors",
        "benefit3_title": "Photo Integration",
        "benefit3_desc": "Combine with aerial photography",
        "benefit4_title": "Flight Data",
        "benefit4_desc": "Include route, altitude, and coordinates",
        "benefit5_title": "Gift Market",
        "benefit5_desc": "Perfect for special occasions",
        "business_type": "helicopter tour"
    }),
    ("usecase-scenic-flight-en.html", {
        "title": "Scenic Flight Tours",
        "meta_description": "TokiStorage for small plane scenic flights. Turn island-hopping adventures into lasting memories.",
        "icon": "✈️",
        "subtitle": "Island views preserved forever",
        "theme_color": "#2563EB",
        "theme_light": "#DBEAFE",
        "theme_dark": "#1D4ED8",
        "why_title": "Why Scenic Flights?",
        "why_p1": "Small aircraft tours offer intimate perspectives of Hawaii's diverse landscapes—from Maui's Haleakala to the Big Island's lava fields.",
        "why_p2": "TokiStorage captures these unique vantage points, creating a permanent record of journeys through Hawaiian skies that passengers will treasure for generations.",
        "scene1_title": "Island Hopper Special",
        "scene1_desc": "Multi-island tour commemoration.",
        "scene2_title": "First Flight Certificate",
        "scene2_desc": "Celebrate passengers' first small plane experience.",
        "scene3_title": "Pilot Experience",
        "scene3_desc": "For those who take the controls.",
        "scene4_title": "Aviation Enthusiasts",
        "scene4_desc": "Special edition for plane lovers.",
        "quote": "My first time in a small plane, seeing Hawaii from above. This keepsake captures that thrill perfectly.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Added Value",
        "benefit1_desc": "Enhance tour packages",
        "benefit2_title": "Pilot Partnership",
        "benefit2_desc": "Co-branded experiences",
        "benefit3_title": "Weather Flexibility",
        "benefit3_desc": "Offer for reschedules as appreciation",
        "benefit4_title": "Niche Appeal",
        "benefit4_desc": "Perfect for aviation enthusiasts",
        "benefit5_title": "Corporate Charters",
        "benefit5_desc": "Executive gift option",
        "business_type": "scenic flight"
    }),
    ("usecase-yacht-en.html", {
        "title": "Yacht Charters",
        "meta_description": "TokiStorage for yacht charters. Capture luxury sailing experiences in eternal quartz glass.",
        "icon": "⛵",
        "subtitle": "Sail into eternity",
        "theme_color": "#0891B2",
        "theme_light": "#CFFAFE",
        "theme_dark": "#0E7490",
        "why_title": "Why Yacht Charters?",
        "why_p1": "Private yacht charters represent the pinnacle of Hawaiian luxury experiences. From sunset sails to multi-day voyages, these journeys create profound memories.",
        "why_p2": "TokiStorage preserves the magic of life at sea—the coordinates, the sunsets, the company—in a format as timeless as the ocean itself.",
        "scene1_title": "Sunset Sail",
        "scene1_desc": "Romantic evening cruise commemoration.",
        "scene2_title": "Private Charter",
        "scene2_desc": "Exclusive keepsake for full-day bookings.",
        "scene3_title": "Celebration Cruises",
        "scene3_desc": "Birthdays, anniversaries at sea.",
        "scene4_title": "Whale Season Special",
        "scene4_desc": "Encounter with humpbacks preserved forever.",
        "quote": "We scattered my father's ashes at sea, then sailed into the sunset. This quartz holds that sacred moment.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Luxury Positioning",
        "benefit1_desc": "Match the premium experience",
        "benefit2_title": "Emotional Value",
        "benefit2_desc": "Meaningful beyond the voyage",
        "benefit3_title": "Captain's Log",
        "benefit3_desc": "Include voyage details and coordinates",
        "benefit4_title": "Repeat Charters",
        "benefit4_desc": "Build lasting relationships",
        "benefit5_title": "Referral Driver",
        "benefit5_desc": "Guests share unique experiences",
        "business_type": "yacht charter"
    }),
    ("usecase-fishing-en.html", {
        "title": "Fishing Charters",
        "meta_description": "TokiStorage for fishing charters. Immortalize big catches and deep-sea adventures.",
        "icon": "🎣",
        "subtitle": "Legendary catches, eternal stories",
        "theme_color": "#0D9488",
        "theme_light": "#CCFBF1",
        "theme_dark": "#0F766E",
        "why_title": "Why Fishing Charters?",
        "why_p1": "Hawaii's waters are legendary—marlin, mahi-mahi, ahi tuna. Every angler dreams of that trophy catch, that story to tell for a lifetime.",
        "why_p2": "TokiStorage transforms these fishing tales into permanent records, capturing the catch details, the crew, the conditions—proof that will never fade or be questioned.",
        "scene1_title": "Trophy Catch",
        "scene1_desc": "Commemorate that once-in-a-lifetime catch.",
        "scene2_title": "First Catch",
        "scene2_desc": "Celebrate beginners' first success.",
        "scene3_title": "Tournament Victories",
        "scene3_desc": "Official record of competition wins.",
        "scene4_title": "Father-Son Trips",
        "scene4_desc": "Multi-generational fishing memories.",
        "quote": "I caught my first marlin with my grandson. The photo might fade, but this quartz never will.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Catch Documentation",
        "benefit1_desc": "Species, weight, location, date preserved",
        "benefit2_title": "Story Enhancement",
        "benefit2_desc": "Physical proof of fishing tales",
        "benefit3_title": "Premium Add-On",
        "benefit3_desc": "High-margin upsell opportunity",
        "benefit4_title": "Tournament Tie-In",
        "benefit4_desc": "Partner with fishing competitions",
        "benefit5_title": "Gift Shop Item",
        "benefit5_desc": "Offer at marina locations",
        "business_type": "fishing charter"
    }),
    ("usecase-whale-en.html", {
        "title": "Whale Watching",
        "meta_description": "TokiStorage for whale watching tours. Preserve magical humpback encounters forever.",
        "icon": "🐋",
        "subtitle": "Encounters that echo through time",
        "theme_color": "#1E40AF",
        "theme_light": "#DBEAFE",
        "theme_dark": "#1E3A8A",
        "why_title": "Why Whale Watching?",
        "why_p1": "Each winter, humpback whales migrate to Hawaiian waters to breed and birth. Witnessing these majestic creatures is a profound, emotional experience.",
        "why_p2": "TokiStorage captures the magic of whale encounters—the breaches, the songs, the connection with nature—in a format that will endure as long as the species itself.",
        "scene1_title": "First Sighting",
        "scene1_desc": "Commemorate that magical first encounter.",
        "scene2_title": "Mother and Calf",
        "scene2_desc": "Special edition for nurturing moments witnessed.",
        "scene3_title": "Breach Moment",
        "scene3_desc": "Capture spectacular aerial displays.",
        "scene4_title": "Research Supporters",
        "scene4_desc": "For guests who contribute to conservation.",
        "quote": "We saw a mother teaching her calf to breach. That moment of pure nature is now preserved forever.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Seasonal Revenue",
        "benefit1_desc": "Maximize whale season income",
        "benefit2_title": "Conservation Message",
        "benefit2_desc": "Tie to protection efforts",
        "benefit3_title": "Educational Value",
        "benefit3_desc": "Include whale facts and data",
        "benefit4_title": "Photo Integration",
        "benefit4_desc": "Combine with tour photos",
        "benefit5_title": "Research Funding",
        "benefit5_desc": "Portion to whale conservation",
        "business_type": "whale watching tour"
    }),
    ("usecase-diving-en.html", {
        "title": "Diving Shops",
        "meta_description": "TokiStorage for scuba diving operators. Preserve underwater adventures and certification milestones.",
        "icon": "🤿",
        "subtitle": "Dive deep, remember forever",
        "theme_color": "#0077B6",
        "theme_light": "#CAF0F8",
        "theme_dark": "#023E8A",
        "why_title": "Why Diving Shops?",
        "why_p1": "Hawaii's underwater world is otherworldly—manta rays, sea turtles, vibrant coral reefs. Scuba diving here creates memories that deserve to last forever.",
        "why_p2": "TokiStorage immortalizes diving achievements and encounters, from first certifications to once-in-a-lifetime marine life sightings.",
        "scene1_title": "Certification Milestone",
        "scene1_desc": "Commemorate Open Water, Advanced, or specialty certs.",
        "scene2_title": "Manta Night Dive",
        "scene2_desc": "Preserve magical manta ray encounters.",
        "scene3_title": "100th Dive Club",
        "scene3_desc": "Celebrate logged dive milestones.",
        "scene4_title": "Dive Buddy Memories",
        "scene4_desc": "Shared underwater adventures with friends.",
        "quote": "My first manta ray night dive changed my life. Now that moment is preserved forever in quartz.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Certification Add-On",
        "benefit1_desc": "Premium upgrade to course packages",
        "benefit2_title": "Dive Log Integration",
        "benefit2_desc": "Include depth, time, conditions",
        "benefit3_title": "Repeat Divers",
        "benefit3_desc": "Build loyalty with collectors",
        "benefit4_title": "Shop Differentiation",
        "benefit4_desc": "Stand out from competitors",
        "benefit5_title": "Marine Conservation",
        "benefit5_desc": "Tie to reef protection messaging",
        "business_type": "diving operation"
    }),
    ("usecase-snorkel-en.html", {
        "title": "Snorkeling Tours",
        "meta_description": "TokiStorage for snorkeling operators. Capture colorful underwater discoveries for all ages.",
        "icon": "🐠",
        "subtitle": "Surface memories, deep meaning",
        "theme_color": "#06B6D4",
        "theme_light": "#CFFAFE",
        "theme_dark": "#0891B2",
        "why_title": "Why Snorkeling Tours?",
        "why_p1": "Snorkeling opens Hawaii's underwater world to everyone—families, first-timers, all ages. These accessible ocean experiences create lasting family memories.",
        "why_p2": "TokiStorage preserves these colorful encounters in a format families will treasure, especially meaningful for children's first ocean adventures.",
        "scene1_title": "First Snorkel",
        "scene1_desc": "Children's first underwater experience.",
        "scene2_title": "Sea Turtle Encounter",
        "scene2_desc": "Swimming with honu, preserved forever.",
        "scene3_title": "Family Adventure",
        "scene3_desc": "Multi-generational ocean exploration.",
        "scene4_title": "Reef Discovery",
        "scene4_desc": "Document marine life sightings.",
        "quote": "My daughter saw her first sea turtle today. Her face lit up in a way I'll never forget—and now I don't have to.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Family Appeal",
        "benefit1_desc": "Perfect for all ages",
        "benefit2_title": "Accessible Price",
        "benefit2_desc": "Entry-level memory product",
        "benefit3_title": "Photo Package",
        "benefit3_desc": "Bundle with underwater photos",
        "benefit4_title": "Educational",
        "benefit4_desc": "Include marine life facts",
        "benefit5_title": "Repeat Visitors",
        "benefit5_desc": "Collect memories each trip",
        "business_type": "snorkeling tour"
    }),
    ("usecase-surf-shop-en.html", {
        "title": "Surf Shops",
        "meta_description": "TokiStorage for surf shops. Immortalize the spirit of aloha and wave-riding achievements.",
        "icon": "🏄",
        "subtitle": "Ride the moment, keep it forever",
        "theme_color": "#F59E0B",
        "theme_light": "#FEF3C7",
        "theme_dark": "#D97706",
        "why_title": "Why Surf Shops?",
        "why_p1": "Surfing is Hawaii's gift to the world. Whether catching a first wave or riding legendary breaks, these moments define lives and shape identities.",
        "why_p2": "TokiStorage captures the stoke—the wave, the board, the feeling—in a format as enduring as surfing culture itself.",
        "scene1_title": "First Wave",
        "scene1_desc": "That unforgettable first ride.",
        "scene2_title": "Board Purchase",
        "scene2_desc": "Commemorate a new stick with its first session.",
        "scene3_title": "Legendary Breaks",
        "scene3_desc": "Document sessions at famous spots.",
        "scene4_title": "Surf Trip",
        "scene4_desc": "Hawaiian surf adventure memories.",
        "quote": "I stood up for the first time at Waikiki. 40 years later, I still remember exactly how it felt.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Retail Enhancement",
        "benefit1_desc": "Add-on to board and gear sales",
        "benefit2_title": "Surf Culture",
        "benefit2_desc": "Align with aloha spirit",
        "benefit3_title": "Photo Integration",
        "benefit3_desc": "Combine with session photos",
        "benefit4_title": "Lesson Packages",
        "benefit4_desc": "Partner with surf schools",
        "benefit5_title": "Brand Story",
        "benefit5_desc": "Connect heritage and future",
        "business_type": "surf shop"
    }),
    ("usecase-surf-school-en.html", {
        "title": "Surf Schools",
        "meta_description": "TokiStorage for surf schools. Celebrate students' wave-riding milestones with eternal keepsakes.",
        "icon": "🌊",
        "subtitle": "Every surfer starts somewhere",
        "theme_color": "#EA580C",
        "theme_light": "#FFEDD5",
        "theme_dark": "#C2410C",
        "why_title": "Why Surf Schools?",
        "why_p1": "Learning to surf in Hawaii is a transformative experience. That first wave, that first stand-up—these moments change people forever.",
        "why_p2": "TokiStorage gives surf schools a way to commemorate these milestones, creating keepsakes students will treasure as proof of their achievement.",
        "scene1_title": "First Stand-Up",
        "scene1_desc": "Certificate of first successful ride.",
        "scene2_title": "Lesson Completion",
        "scene2_desc": "Graduate from beginner course.",
        "scene3_title": "Family Lessons",
        "scene3_desc": "Whole family learning together.",
        "scene4_title": "Return Students",
        "scene4_desc": "Track progress across visits.",
        "quote": "I was terrified of the ocean. My instructor helped me catch my first wave. That certificate means everything to me.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Graduation Gift",
        "benefit1_desc": "Natural upsell at lesson end",
        "benefit2_title": "Instructor Recognition",
        "benefit2_desc": "Include instructor name and tips",
        "benefit3_title": "Photo Proof",
        "benefit3_desc": "Action shots integrated",
        "benefit4_title": "Return Incentive",
        "benefit4_desc": "Collectors come back for more",
        "benefit5_title": "Social Sharing",
        "benefit5_desc": "Students share achievements",
        "business_type": "surf school"
    }),
    ("usecase-sup-en.html", {
        "title": "SUP & Kayak Rentals",
        "meta_description": "TokiStorage for paddleboard and kayak operators. Capture peaceful paddle adventures.",
        "icon": "🛶",
        "subtitle": "Paddle into memory",
        "theme_color": "#16A34A",
        "theme_light": "#DCFCE7",
        "theme_dark": "#15803D",
        "why_title": "Why SUP & Kayak?",
        "why_p1": "Stand-up paddleboarding and kayaking offer intimate connections with Hawaii's waters. Gliding through bays, exploring coastlines, watching sunrise from the water.",
        "why_p2": "TokiStorage preserves these peaceful adventures, capturing the serenity and beauty of time spent on Hawaiian waters.",
        "scene1_title": "Sunrise Paddle",
        "scene1_desc": "Dawn sessions on glassy water.",
        "scene2_title": "Wildlife Encounters",
        "scene2_desc": "Turtles, dolphins, rays spotted.",
        "scene3_title": "Couples Paddle",
        "scene3_desc": "Romantic tandem adventures.",
        "scene4_title": "Fitness Milestones",
        "scene4_desc": "Distance or duration achievements.",
        "quote": "Paddling at sunrise, completely alone with the sea turtles. Pure peace, preserved forever.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Rental Add-On",
        "benefit1_desc": "Easy upsell at checkout",
        "benefit2_title": "Route Mapping",
        "benefit2_desc": "Include GPS track and distance",
        "benefit3_title": "Wellness Tie-In",
        "benefit3_desc": "Connect to mindfulness",
        "benefit4_title": "Group Bookings",
        "benefit4_desc": "Team and family packages",
        "benefit5_title": "Eco-Friendly",
        "benefit5_desc": "Align with sustainable tourism",
        "business_type": "paddle sports"
    }),
    ("usecase-golf-en.html", {
        "title": "Golf Courses",
        "meta_description": "TokiStorage for Hawaiian golf courses. Preserve legendary rounds and hole-in-one moments.",
        "icon": "⛳",
        "subtitle": "Legendary rounds, eternal records",
        "theme_color": "#22C55E",
        "theme_light": "#DCFCE7",
        "theme_dark": "#16A34A",
        "why_title": "Why Golf Courses?",
        "why_p1": "Hawaii's golf courses are bucket-list destinations—ocean views, volcanic landscapes, championship layouts. Every round here is special.",
        "why_p2": "TokiStorage immortalizes these rounds, from hole-in-ones to personal bests, creating permanent records of achievements on paradise links.",
        "scene1_title": "Hole-in-One",
        "scene1_desc": "The ultimate golf achievement, preserved forever.",
        "scene2_title": "Personal Best",
        "scene2_desc": "Career-low rounds commemorated.",
        "scene3_title": "Golf Trip",
        "scene3_desc": "Annual buddies trip memories.",
        "scene4_title": "Tournament Play",
        "scene4_desc": "Competition achievements documented.",
        "quote": "Hole-in-one on the 17th, overlooking the Pacific. The plaque on the wall might fade. This won't.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Pro Shop Revenue",
        "benefit1_desc": "Premium merchandise offering",
        "benefit2_title": "Hole-in-One Program",
        "benefit2_desc": "Official commemoration partner",
        "benefit3_title": "Scorecard Integration",
        "benefit3_desc": "Full round details preserved",
        "benefit4_title": "Corporate Events",
        "benefit4_desc": "Tournament prizes and gifts",
        "benefit5_title": "Member Loyalty",
        "benefit5_desc": "Exclusive member milestones",
        "business_type": "golf course"
    }),
    ("usecase-luau-en.html", {
        "title": "Luau Venues",
        "meta_description": "TokiStorage for luau venues. Capture the spirit of Hawaiian celebration forever.",
        "icon": "🌺",
        "subtitle": "Aloha spirit, eternal memory",
        "theme_color": "#DB2777",
        "theme_light": "#FCE7F3",
        "theme_dark": "#BE185D",
        "why_title": "Why Luau Venues?",
        "why_p1": "A Hawaiian luau is more than dinner and a show—it's a cultural immersion, a celebration of aloha spirit, often marking special occasions.",
        "why_p2": "TokiStorage captures the magic of these evenings, preserving the music, the hula, the connection to Hawaiian culture in eternal form.",
        "scene1_title": "Cultural Experience",
        "scene1_desc": "First luau, first taste of true Hawaii.",
        "scene2_title": "Celebration Dinners",
        "scene2_desc": "Birthdays, anniversaries at the luau.",
        "scene3_title": "Family Reunions",
        "scene3_desc": "Multi-generational gatherings.",
        "scene4_title": "VIP Packages",
        "scene4_desc": "Premium seating with keepsake included.",
        "quote": "My grandmother's 80th birthday at the luau. Three generations dancing hula together. Priceless.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Package Upgrade",
        "benefit1_desc": "Premium tier enhancement",
        "benefit2_title": "Cultural Value",
        "benefit2_desc": "Deepen aloha connection",
        "benefit3_title": "Group Sales",
        "benefit3_desc": "Bulk orders for celebrations",
        "benefit4_title": "Photo Integration",
        "benefit4_desc": "Include professional event photos",
        "benefit5_title": "Repeat Visitors",
        "benefit5_desc": "Collect each visit",
        "business_type": "luau venue"
    }),
    ("usecase-zipline-en.html", {
        "title": "Zipline Adventures",
        "meta_description": "TokiStorage for zipline operators. Preserve the thrill of soaring through Hawaiian canopy.",
        "icon": "🌴",
        "subtitle": "Soar through paradise, remember forever",
        "theme_color": "#65A30D",
        "theme_light": "#ECFCCB",
        "theme_dark": "#4D7C0F",
        "why_title": "Why Zipline Adventures?",
        "why_p1": "Ziplining through Hawaiian rainforest is an adrenaline rush like no other—soaring above waterfalls, through canopy, across valleys.",
        "why_p2": "TokiStorage captures these peak experiences, preserving the thrill and the views in a format that will remind adventurers of their bravery forever.",
        "scene1_title": "First Zipline",
        "scene1_desc": "Conquering fears, trying something new.",
        "scene2_title": "Longest Line",
        "scene2_desc": "Achievement of completing epic runs.",
        "scene3_title": "Family Adventure",
        "scene3_desc": "Shared thrills across generations.",
        "scene4_title": "Group Challenges",
        "scene4_desc": "Team building and celebration.",
        "quote": "I'm terrified of heights. Doing that zipline changed how I see myself. The certificate proves I did it.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Adventure Add-On",
        "benefit1_desc": "Natural upsell at booking",
        "benefit2_title": "Photo/Video Bundle",
        "benefit2_desc": "Combine with action footage",
        "benefit3_title": "Fear Conquered",
        "benefit3_desc": "Celebrate personal growth",
        "benefit4_title": "Group Packages",
        "benefit4_desc": "Corporate and party groups",
        "benefit5_title": "Social Proof",
        "benefit5_desc": "Shareable achievement",
        "business_type": "adventure tour"
    }),
    ("usecase-hiking-en.html", {
        "title": "Hiking Tours",
        "meta_description": "TokiStorage for hiking tour operators. Commemorate treks through Hawaii's stunning landscapes.",
        "icon": "🥾",
        "subtitle": "Every trail tells a story",
        "theme_color": "#92400E",
        "theme_light": "#FEF3C7",
        "theme_dark": "#78350F",
        "why_title": "Why Hiking Tours?",
        "why_p1": "Hawaii's trails traverse some of Earth's most dramatic landscapes—volcanic craters, bamboo forests, hidden waterfalls, coastal cliffs.",
        "why_p2": "TokiStorage preserves these journeys on foot, documenting the trails conquered and the natural wonders witnessed along the way.",
        "scene1_title": "Summit Achievement",
        "scene1_desc": "Reaching peaks like Diamond Head or Mauna Kea.",
        "scene2_title": "Waterfall Treks",
        "scene2_desc": "Discovering hidden cascades.",
        "scene3_title": "Crater Exploration",
        "scene3_desc": "Volcanic landscape adventures.",
        "scene4_title": "Sunrise Hikes",
        "scene4_desc": "Dawn summit experiences.",
        "quote": "Watching sunrise from Haleakala after hiking in the dark. Life-changing. Preserved forever.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Trail Documentation",
        "benefit1_desc": "Distance, elevation, landmarks",
        "benefit2_title": "Achievement System",
        "benefit2_desc": "Collect multiple trails",
        "benefit3_title": "Guide Recognition",
        "benefit3_desc": "Include guide names and wisdom",
        "benefit4_title": "Conservation Tie-In",
        "benefit4_desc": "Support trail maintenance",
        "benefit5_title": "Fitness Record",
        "benefit5_desc": "Document outdoor achievements",
        "business_type": "hiking tour"
    }),
    ("usecase-horseback-en.html", {
        "title": "Horseback Riding",
        "meta_description": "TokiStorage for horseback riding tours. Preserve ranch adventures and trail rides in paradise.",
        "icon": "🐴",
        "subtitle": "Ride into the sunset, remember forever",
        "theme_color": "#A16207",
        "theme_light": "#FEF9C3",
        "theme_dark": "#854D0E",
        "why_title": "Why Horseback Riding?",
        "why_p1": "Horseback riding through Hawaiian ranches and trails offers a connection to the islands' paniolo (cowboy) heritage and natural beauty.",
        "why_p2": "TokiStorage captures these equestrian adventures, preserving the bond between rider and horse against Hawaii's stunning backdrops.",
        "scene1_title": "First Ride",
        "scene1_desc": "Introduction to horseback riding.",
        "scene2_title": "Sunset Trail",
        "scene2_desc": "Golden hour rides through paradise.",
        "scene3_title": "Ranch Experience",
        "scene3_desc": "Full paniolo cultural immersion.",
        "scene4_title": "Waterfall Trails",
        "scene4_desc": "Rides to hidden natural wonders.",
        "quote": "My horse's name was Kona. We watched the sunset together from the ridge. I'll never forget him.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Horse Naming",
        "benefit1_desc": "Include horse's name and photo",
        "benefit2_title": "Ranch Heritage",
        "benefit2_desc": "Connect to paniolo culture",
        "benefit3_title": "Photo Package",
        "benefit3_desc": "Professional trail photos",
        "benefit4_title": "Private Rides",
        "benefit4_desc": "Premium experience add-on",
        "benefit5_title": "Return Riders",
        "benefit5_desc": "Same horse, new adventures",
        "business_type": "horseback riding"
    }),
    ("usecase-atv-en.html", {
        "title": "ATV Tours",
        "meta_description": "TokiStorage for ATV tour operators. Capture off-road adventures through Hawaiian terrain.",
        "icon": "🏎️",
        "subtitle": "Off-road memories, on record forever",
        "theme_color": "#B45309",
        "theme_light": "#FEF3C7",
        "theme_dark": "#92400E",
        "why_title": "Why ATV Tours?",
        "why_p1": "ATV tours offer access to Hawaii's rugged backcountry—ranch lands, volcanic terrain, movie filming locations that most visitors never see.",
        "why_p2": "TokiStorage preserves these adrenaline-fueled adventures, documenting the trails conquered and the hidden Hawaii discovered.",
        "scene1_title": "First ATV Experience",
        "scene1_desc": "Introduction to off-road adventure.",
        "scene2_title": "Movie Site Tours",
        "scene2_desc": "Famous filming locations visited.",
        "scene3_title": "Extreme Terrain",
        "scene3_desc": "Challenging course completions.",
        "scene4_title": "Group Adventures",
        "scene4_desc": "Bachelor parties, team outings.",
        "quote": "Muddy, exhausted, biggest smile of my life. That's the Hawaii tourists don't see.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Adventure Certificate",
        "benefit1_desc": "Proof of trail completion",
        "benefit2_title": "Photo/Video Bundle",
        "benefit2_desc": "GoPro footage integration",
        "benefit3_title": "Difficulty Levels",
        "benefit3_desc": "Achievement progression",
        "benefit4_title": "Group Packages",
        "benefit4_desc": "Parties and corporate events",
        "benefit5_title": "Return Visits",
        "benefit5_desc": "New trails, new memories",
        "business_type": "ATV tour"
    }),
    # 21-28: Wedding
    ("usecase-wedding-venue-en.html", {
        "title": "Wedding Venues",
        "meta_description": "TokiStorage for Hawaiian wedding venues. Preserve the magic of destination weddings forever.",
        "icon": "💒",
        "subtitle": "Where forever begins",
        "theme_color": "#EC4899",
        "theme_light": "#FCE7F3",
        "theme_dark": "#DB2777",
        "why_title": "Why Wedding Venues?",
        "why_p1": "Hawaii is the world's most sought-after wedding destination. Couples travel across the globe to say 'I do' in paradise.",
        "why_p2": "TokiStorage offers these couples something beyond photos—a permanent, physical embodiment of their vows that will outlast generations.",
        "scene1_title": "Ceremony Keepsake",
        "scene1_desc": "Vows and ceremony details preserved.",
        "scene2_title": "Venue Partnership",
        "scene2_desc": "Exclusive offering for bookings.",
        "scene3_title": "Anniversary Returns",
        "scene3_desc": "Couples returning for milestones.",
        "scene4_title": "Vow Renewals",
        "scene4_desc": "Recommitment ceremonies.",
        "quote": "Our vows, the date, our witnesses—all preserved in quartz glass. It's like our love is literally set in stone.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Premium Upsell",
        "benefit1_desc": "High-margin package addition",
        "benefit2_title": "Unique Offering",
        "benefit2_desc": "Differentiate from competitors",
        "benefit3_title": "Vendor Partnerships",
        "benefit3_desc": "Collaborate with planners",
        "benefit4_title": "Return Visits",
        "benefit4_desc": "Anniversary trip incentive",
        "benefit5_title": "Referrals",
        "benefit5_desc": "Couples share with friends",
        "business_type": "wedding venue"
    }),
    ("usecase-wedding-planner-en.html", {
        "title": "Wedding Planners",
        "meta_description": "TokiStorage for destination wedding planners. Add eternal keepsakes to your service offerings.",
        "icon": "💐",
        "subtitle": "Planning forever, preserving always",
        "theme_color": "#D946EF",
        "theme_light": "#FAE8FF",
        "theme_dark": "#C026D3",
        "why_title": "Why Wedding Planners?",
        "why_p1": "As a destination wedding planner, you create once-in-a-lifetime experiences. Your attention to detail makes dreams come true.",
        "why_p2": "TokiStorage adds another dimension to your services—a permanent keepsake that couples will treasure as much as their memories of the day.",
        "scene1_title": "Planning Package",
        "scene1_desc": "Included in premium planning tiers.",
        "scene2_title": "Client Gifts",
        "scene2_desc": "Thank-you gesture after the big day.",
        "scene3_title": "Vendor Showcase",
        "scene3_desc": "Feature in portfolio presentations.",
        "scene4_title": "Anniversary Services",
        "scene4_desc": "Ongoing client relationship tool.",
        "quote": "Our planner thought of everything—even preserving our vows in quartz. Above and beyond.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Service Enhancement",
        "benefit1_desc": "Elevate your offerings",
        "benefit2_title": "Revenue Stream",
        "benefit2_desc": "Additional service income",
        "benefit3_title": "Client Loyalty",
        "benefit3_desc": "Lasting relationship builder",
        "benefit4_title": "Portfolio Piece",
        "benefit4_desc": "Unique differentiator",
        "benefit5_title": "Referral Tool",
        "benefit5_desc": "Clients recommend you",
        "business_type": "wedding planning"
    }),
    ("usecase-chapel-en.html", {
        "title": "Wedding Chapels",
        "meta_description": "TokiStorage for Hawaiian wedding chapels. Sacred vows preserved for eternity.",
        "icon": "⛪",
        "subtitle": "Sacred vows, eternal preservation",
        "theme_color": "#8B5CF6",
        "theme_light": "#EDE9FE",
        "theme_dark": "#7C3AED",
        "why_title": "Why Wedding Chapels?",
        "why_p1": "Chapel weddings combine spiritual significance with Hawaiian beauty. These sacred ceremonies deserve equally meaningful preservation.",
        "why_p2": "TokiStorage offers chapels a way to extend the sanctity of the ceremony into a permanent keepsake couples will cherish forever.",
        "scene1_title": "Ceremony Record",
        "scene1_desc": "Official chapel documentation.",
        "scene2_title": "Religious Blessing",
        "scene2_desc": "Officiant's words preserved.",
        "scene3_title": "Chapel Anniversary",
        "scene3_desc": "Special dates commemorated.",
        "scene4_title": "Blessing Renewals",
        "scene4_desc": "Returning couples' ceremonies.",
        "quote": "Father blessed our union in that little chapel. His words are now preserved forever in quartz.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Sacred Addition",
        "benefit1_desc": "Complement spiritual ceremonies",
        "benefit2_title": "Package Option",
        "benefit2_desc": "Ceremony upgrade tier",
        "benefit3_title": "Officiant Integration",
        "benefit3_desc": "Include blessing text",
        "benefit4_title": "Chapel Heritage",
        "benefit4_desc": "Document your history",
        "benefit5_title": "Return Couples",
        "benefit5_desc": "Anniversary visit incentive",
        "business_type": "wedding chapel"
    }),
    ("usecase-beach-wedding-en.html", {
        "title": "Beach Wedding Services",
        "meta_description": "TokiStorage for beach wedding providers. Capture barefoot ceremonies in paradise forever.",
        "icon": "🏖️",
        "subtitle": "Toes in sand, love in quartz",
        "theme_color": "#0EA5E9",
        "theme_light": "#E0F2FE",
        "theme_dark": "#0284C7",
        "why_title": "Why Beach Weddings?",
        "why_p1": "Beach weddings embody Hawaiian romance—sunset ceremonies, ocean breezes, barefoot vows. These moments are magic.",
        "why_p2": "TokiStorage captures the essence of beach ceremonies, preserving not just the vows but the setting, the sunset, the sand between toes.",
        "scene1_title": "Sunset Ceremony",
        "scene1_desc": "Golden hour vows preserved.",
        "scene2_title": "Elopements",
        "scene2_desc": "Intimate just-the-two-of-us moments.",
        "scene3_title": "Renewal of Vows",
        "scene3_desc": "Couples returning to recommit.",
        "scene4_title": "Proposal to Wedding",
        "scene4_desc": "Same beach, full circle.",
        "quote": "We eloped at sunrise. Just us, the ocean, and our vows. Now that secret moment is preserved forever.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Intimate Packages",
        "benefit1_desc": "Perfect for elopements",
        "benefit2_title": "Location Details",
        "benefit2_desc": "GPS, beach name, conditions",
        "benefit3_title": "Sunset Data",
        "benefit3_desc": "Exact time and conditions",
        "benefit4_title": "Photo Integration",
        "benefit4_desc": "Combine with ceremony photos",
        "benefit5_title": "Sand Inclusion",
        "benefit5_desc": "Actual beach sand preserved",
        "business_type": "beach wedding"
    }),
    ("usecase-wedding-photo-en.html", {
        "title": "Wedding Photography",
        "meta_description": "TokiStorage for wedding photographers. Add eternal preservation to your photo packages.",
        "icon": "📸",
        "subtitle": "Images fade, quartz endures",
        "theme_color": "#6366F1",
        "theme_light": "#E0E7FF",
        "theme_dark": "#4F46E5",
        "why_title": "Why Wedding Photography?",
        "why_p1": "As a wedding photographer, you capture the most important day of your clients' lives. But digital files corrupt, prints fade.",
        "why_p2": "TokiStorage gives you the option to preserve your best images in quartz glass—a medium that will outlast any digital or paper format.",
        "scene1_title": "Signature Shot",
        "scene1_desc": "Best image preserved eternally.",
        "scene2_title": "Photo Collection",
        "scene2_desc": "Series of key moments in quartz.",
        "scene3_title": "Album Companion",
        "scene3_desc": "Pair with traditional albums.",
        "scene4_title": "Proof of Love",
        "scene4_desc": "Marriage details with image.",
        "quote": "Our photographer's sunset shot is preserved forever now. Digital files get lost. This won't.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Premium Add-On",
        "benefit1_desc": "High-margin package upgrade",
        "benefit2_title": "Unique Offering",
        "benefit2_desc": "Stand out from competitors",
        "benefit3_title": "Portfolio Piece",
        "benefit3_desc": "Showcase your best work",
        "benefit4_title": "Client Gifts",
        "benefit4_desc": "Year-after delivery option",
        "benefit5_title": "Archival Quality",
        "benefit5_desc": "True long-term preservation",
        "business_type": "wedding photography"
    }),
    ("usecase-bridal-beauty-en.html", {
        "title": "Bridal Beauty Services",
        "meta_description": "TokiStorage for bridal hair and makeup artists. Celebrate brides' transformation moments.",
        "icon": "💄",
        "subtitle": "Beauty captured, forever",
        "theme_color": "#F472B6",
        "theme_light": "#FCE7F3",
        "theme_dark": "#EC4899",
        "why_title": "Why Bridal Beauty?",
        "why_p1": "The bridal transformation is one of the most emotional moments of the wedding day. That first look in the mirror, the tears, the joy.",
        "why_p2": "TokiStorage preserves these intimate moments, creating keepsakes that capture the beauty and emotion of becoming a bride.",
        "scene1_title": "Transformation Moment",
        "scene1_desc": "Before and after preserved.",
        "scene2_title": "Getting Ready",
        "scene2_desc": "Hair and makeup session memories.",
        "scene3_title": "Bridal Party",
        "scene3_desc": "Group getting-ready moments.",
        "scene4_title": "Beauty Details",
        "scene4_desc": "Style details and artist credits.",
        "quote": "When I saw myself in the mirror for the first time, I cried. That moment is now preserved forever.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Client Gift",
        "benefit1_desc": "Memorable thank-you gesture",
        "benefit2_title": "Portfolio Building",
        "benefit2_desc": "Showcase your artistry",
        "benefit3_title": "Service Upgrade",
        "benefit3_desc": "Premium package option",
        "benefit4_title": "Vendor Collaboration",
        "benefit4_desc": "Partner with photographers",
        "benefit5_title": "Social Proof",
        "benefit5_desc": "Shareable before/after",
        "business_type": "bridal beauty"
    }),
    ("usecase-wedding-florist-en.html", {
        "title": "Wedding Florists",
        "meta_description": "TokiStorage for wedding florists. Preserve the beauty of Hawaiian floral artistry forever.",
        "icon": "💐",
        "subtitle": "Flowers fade, memories bloom forever",
        "theme_color": "#10B981",
        "theme_light": "#D1FAE5",
        "theme_dark": "#059669",
        "why_title": "Why Wedding Florists?",
        "why_p1": "Hawaiian wedding florals are works of art—tropical blooms, orchid leis, plumeria arrangements. But flowers are fleeting.",
        "why_p2": "TokiStorage preserves images of your floral artistry in eternal quartz, allowing brides to keep their bouquets forever.",
        "scene1_title": "Bouquet Preservation",
        "scene1_desc": "Bridal bouquet image in quartz.",
        "scene2_title": "Lei Commemoration",
        "scene2_desc": "Traditional lei designs preserved.",
        "scene3_title": "Ceremony Arrangements",
        "scene3_desc": "Full floral design documented.",
        "scene4_title": "Artist Credit",
        "scene4_desc": "Your artistry permanently recorded.",
        "quote": "My bouquet was the most beautiful thing I'd ever seen. Now I have it forever, not just pressed petals.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Preservation Option",
        "benefit1_desc": "Alternative to dried flowers",
        "benefit2_title": "Portfolio Showcase",
        "benefit2_desc": "Your work preserved forever",
        "benefit3_title": "Premium Add-On",
        "benefit3_desc": "High-margin service",
        "benefit4_title": "Design Details",
        "benefit4_desc": "Include flower types and meanings",
        "benefit5_title": "Client Connection",
        "benefit5_desc": "Lasting relationship tool",
        "business_type": "wedding florist"
    }),
    ("usecase-honeymoon-en.html", {
        "title": "Honeymoon Resorts",
        "meta_description": "TokiStorage for honeymoon destinations. Capture the first days of forever.",
        "icon": "🌙",
        "subtitle": "Where married life begins",
        "theme_color": "#BE185D",
        "theme_light": "#FCE7F3",
        "theme_dark": "#9D174D",
        "why_title": "Why Honeymoon Resorts?",
        "why_p1": "The honeymoon is the first chapter of married life. Hawaii's romantic settings make these days magical and meaningful.",
        "why_p2": "TokiStorage gives resorts a way to celebrate these newlywed moments with keepsakes as lasting as the marriage itself.",
        "scene1_title": "Honeymoon Suite",
        "scene1_desc": "Premium room welcome amenity.",
        "scene2_title": "First Anniversary",
        "scene2_desc": "Return visit commemoration.",
        "scene3_title": "Romantic Experiences",
        "scene3_desc": "Couples activities preserved.",
        "scene4_title": "Just Married Package",
        "scene4_desc": "Complete honeymoon keepsake.",
        "quote": "Our first sunrise as husband and wife, watching from our lanai. That memory is now eternal.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Romance Package",
        "benefit1_desc": "Honeymoon tier enhancement",
        "benefit2_title": "Return Incentive",
        "benefit2_desc": "Anniversary trip motivation",
        "benefit3_title": "Newlywed Marketing",
        "benefit3_desc": "Target wedding registries",
        "benefit4_title": "Couples Experiences",
        "benefit4_desc": "Bundle with spa, dining",
        "benefit5_title": "Lifetime Value",
        "benefit5_desc": "Build long-term relationships",
        "business_type": "honeymoon resort"
    }),
    # Continue with remaining categories...
    # 29-38: Memorial & Spiritual
    ("usecase-funeral-en.html", {
        "title": "Funeral Homes",
        "meta_description": "TokiStorage for funeral homes. Offer families eternal memorials for their loved ones.",
        "icon": "🕯️",
        "subtitle": "Honoring lives, preserving legacies",
        "theme_color": "#4B5563",
        "theme_light": "#F3F4F6",
        "theme_dark": "#374151",
        "why_title": "Why Funeral Homes?",
        "why_p1": "When families lose loved ones, they seek meaningful ways to preserve memories. Traditional options—headstones, urns—serve a purpose but lack personalization.",
        "why_p2": "TokiStorage offers something different: a personal, portable, eternal record of a life lived, preserved in quartz glass for 1,000 years.",
        "scene1_title": "Life Celebration",
        "scene1_desc": "Complete life story preservation.",
        "scene2_title": "Family Distribution",
        "scene2_desc": "Multiple copies for relatives.",
        "scene3_title": "Memorial Service",
        "scene3_desc": "Display at ceremony, keep forever.",
        "scene4_title": "Pre-Planning",
        "scene4_desc": "Advance preparation option.",
        "quote": "Each of my grandmother's grandchildren has a piece of her story now. We'll pass them to our children.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Service Enhancement",
        "benefit1_desc": "Premium offering for families",
        "benefit2_title": "Personalization",
        "benefit2_desc": "Truly unique memorials",
        "benefit3_title": "Multiple Copies",
        "benefit3_desc": "Family distribution option",
        "benefit4_title": "Pre-Need Sales",
        "benefit4_desc": "Advance planning packages",
        "benefit5_title": "Ongoing Revenue",
        "benefit5_desc": "Anniversary additions",
        "business_type": "funeral service"
    }),
    ("usecase-ocean-scattering-en.html", {
        "title": "Ocean Scattering Services",
        "meta_description": "TokiStorage for ocean ash scattering services. Preserve the memory of final voyages.",
        "icon": "🌊",
        "subtitle": "Return to the sea, remembered forever",
        "theme_color": "#0077B6",
        "theme_light": "#CAF0F8",
        "theme_dark": "#023E8A",
        "why_title": "Why Ocean Scattering?",
        "why_p1": "Many choose Hawaii as their final resting place—returned to the Pacific's embrace. These ceremonies are profound and sacred.",
        "why_p2": "TokiStorage preserves the details of these final voyages—the location, the words spoken, the love shared—for families to hold forever.",
        "scene1_title": "Scattering Ceremony",
        "scene1_desc": "Complete ceremony documentation.",
        "scene2_title": "GPS Coordinates",
        "scene2_desc": "Exact location preserved.",
        "scene3_title": "Family Keepsakes",
        "scene3_desc": "Multiple copies for relatives.",
        "scene4_title": "Annual Remembrance",
        "scene4_desc": "Return voyage commemorations.",
        "quote": "Dad wanted to become part of the ocean he loved. Now we have the exact spot, preserved forever.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Location Record",
        "benefit1_desc": "GPS coordinates preserved",
        "benefit2_title": "Ceremony Details",
        "benefit2_desc": "Words, participants, conditions",
        "benefit3_title": "Family Distribution",
        "benefit3_desc": "Copies for all relatives",
        "benefit4_title": "Return Voyages",
        "benefit4_desc": "Anniversary trip service",
        "benefit5_title": "Environmental Note",
        "benefit5_desc": "Eco-conscious option",
        "business_type": "ocean scattering"
    }),
    ("usecase-memorial-reef-en.html", {
        "title": "Memorial Reef Services",
        "meta_description": "TokiStorage for memorial reef providers. Document eternal underwater resting places.",
        "icon": "🐚",
        "subtitle": "Becoming part of the reef",
        "theme_color": "#0891B2",
        "theme_light": "#CFFAFE",
        "theme_dark": "#0E7490",
        "why_title": "Why Memorial Reefs?",
        "why_p1": "Memorial reefs transform cremated remains into living ocean habitats. It's a beautiful way to give back to the sea.",
        "why_p2": "TokiStorage documents these unique memorials, preserving the location, the reef formation, and the life story of those who become part of the ocean.",
        "scene1_title": "Reef Placement",
        "scene1_desc": "Installation ceremony record.",
        "scene2_title": "Underwater Location",
        "scene2_desc": "Dive coordinates preserved.",
        "scene3_title": "Reef Growth Updates",
        "scene3_desc": "Annual documentation of marine life.",
        "scene4_title": "Family Dives",
        "scene4_desc": "Visiting ceremonies recorded.",
        "quote": "Mom became a coral reef. Marine life is growing around her now. We dive to visit every year.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Unique Memorial",
        "benefit1_desc": "Something truly different",
        "benefit2_title": "Location Documentation",
        "benefit2_desc": "Dive-accessible coordinates",
        "benefit3_title": "Growth Records",
        "benefit3_desc": "Annual reef updates",
        "benefit4_title": "Eco-Legacy",
        "benefit4_desc": "Environmental contribution",
        "benefit5_title": "Visit Service",
        "benefit5_desc": "Dive trip packages",
        "business_type": "memorial reef"
    }),
    ("usecase-church-en.html", {
        "title": "Churches",
        "meta_description": "TokiStorage for Hawaiian churches. Preserve baptisms, confirmations, and spiritual milestones.",
        "icon": "⛪",
        "subtitle": "Faith journeys, eternal records",
        "theme_color": "#7C3AED",
        "theme_light": "#EDE9FE",
        "theme_dark": "#6D28D9",
        "why_title": "Why Churches?",
        "why_p1": "Churches mark life's most sacred moments—baptisms, confirmations, weddings, funerals. These spiritual milestones deserve lasting commemoration.",
        "why_p2": "TokiStorage offers congregations a way to preserve these sacred moments in a format that reflects their eternal significance.",
        "scene1_title": "Baptism Records",
        "scene1_desc": "New beginnings preserved.",
        "scene2_title": "Confirmation",
        "scene2_desc": "Faith commitment documented.",
        "scene3_title": "Church Weddings",
        "scene3_desc": "Sacred union keepsakes.",
        "scene4_title": "Memorial Services",
        "scene4_desc": "Life celebration records.",
        "quote": "My baptism certificate might fade. This quartz record of my baptism will outlast generations.",
        "quote_source": "Potential member testimonial",
        "benefit1_title": "Sacrament Documentation",
        "benefit1_desc": "Official church records",
        "benefit2_title": "Member Gifts",
        "benefit2_desc": "Milestone celebrations",
        "benefit3_title": "Church History",
        "benefit3_desc": "Preserve congregation legacy",
        "benefit4_title": "Fundraising",
        "benefit4_desc": "Revenue for church programs",
        "benefit5_title": "Community Building",
        "benefit5_desc": "Shared spiritual heritage",
        "business_type": "church"
    }),
    ("usecase-temple-en.html", {
        "title": "Buddhist Temples",
        "meta_description": "TokiStorage for Buddhist temples in Hawaii. Preserve dharma teachings and spiritual journeys.",
        "icon": "🛕",
        "subtitle": "Dharma preserved through time",
        "theme_color": "#F59E0B",
        "theme_light": "#FEF3C7",
        "theme_dark": "#D97706",
        "why_title": "Why Buddhist Temples?",
        "why_p1": "Hawaii's Buddhist temples serve diverse communities—Japanese, Chinese, Korean, Tibetan traditions. Each preserves precious teachings.",
        "why_p2": "TokiStorage aligns with Buddhism's long view of time, preserving teachings, lineages, and personal dharma journeys for future generations.",
        "scene1_title": "Refuge Ceremony",
        "scene1_desc": "Taking refuge documented.",
        "scene2_title": "Memorial Services",
        "scene2_desc": "Obon and remembrance records.",
        "scene3_title": "Teacher Lineage",
        "scene3_desc": "Preserve dharma transmission.",
        "scene4_title": "Temple History",
        "scene4_desc": "Institutional legacy records.",
        "quote": "My teacher's words, my refuge vows—preserved for the next thousand years of practitioners.",
        "quote_source": "Potential practitioner testimonial",
        "benefit1_title": "Dharma Preservation",
        "benefit1_desc": "Teaching lineages recorded",
        "benefit2_title": "Memorial Traditions",
        "benefit2_desc": "Obon and ancestor practices",
        "benefit3_title": "Temple Fundraising",
        "benefit3_desc": "Support temple maintenance",
        "benefit4_title": "Cultural Heritage",
        "benefit4_desc": "Asian-American legacy",
        "benefit5_title": "Sangha Connection",
        "benefit5_desc": "Community building",
        "business_type": "Buddhist temple"
    }),
    ("usecase-heiau-en.html", {
        "title": "Hawaiian Heiau",
        "meta_description": "TokiStorage for Hawaiian cultural sites. Preserve sacred traditions and ancestral connections.",
        "icon": "🗿",
        "subtitle": "Honoring ancestors, preserving traditions",
        "theme_color": "#92400E",
        "theme_light": "#FEF3C7",
        "theme_dark": "#78350F",
        "why_title": "Why Hawaiian Heiau?",
        "why_p1": "Heiau are sacred Hawaiian sites connecting present to past, people to ancestors, land to spirit. These places hold profound cultural significance.",
        "why_p2": "TokiStorage can preserve Hawaiian cultural knowledge, genealogies, and traditions in a format befitting their eternal importance.",
        "scene1_title": "Genealogy Records",
        "scene1_desc": "Mo'okū'auhau preserved forever.",
        "scene2_title": "Cultural Ceremonies",
        "scene2_desc": "Sacred practices documented.",
        "scene3_title": "Site History",
        "scene3_desc": "Heiau stories preserved.",
        "scene4_title": "Educational Programs",
        "scene4_desc": "Cultural teaching materials.",
        "quote": "My family's genealogy stretches back 40 generations. Now it's preserved for 40 more.",
        "quote_source": "Potential community testimonial",
        "benefit1_title": "Cultural Preservation",
        "benefit1_desc": "Hawaiian knowledge saved",
        "benefit2_title": "Genealogy Records",
        "benefit2_desc": "Family lines documented",
        "benefit3_title": "Educational Tool",
        "benefit3_desc": "Teaching next generations",
        "benefit4_title": "Community Revenue",
        "benefit4_desc": "Support cultural programs",
        "benefit5_title": "Sovereignty Statement",
        "benefit5_desc": "Assert cultural continuity",
        "business_type": "cultural site"
    }),
    ("usecase-military-memorial-en.html", {
        "title": "Military Memorials",
        "meta_description": "TokiStorage for military memorials and Pearl Harbor remembrance. Honor those who served.",
        "icon": "🎖️",
        "subtitle": "Service remembered, sacrifice honored",
        "theme_color": "#1E3A8A",
        "theme_light": "#DBEAFE",
        "theme_dark": "#1E40AF",
        "why_title": "Why Military Memorials?",
        "why_p1": "Hawaii holds profound military significance—Pearl Harbor, Pacific campaigns, ongoing military presence. Veterans and families seek meaningful remembrance.",
        "why_p2": "TokiStorage preserves military service records, battle histories, and personal stories in a format that honors the permanence of sacrifice.",
        "scene1_title": "Pearl Harbor Visits",
        "scene1_desc": "Remembrance pilgrimage records.",
        "scene2_title": "Veteran Tributes",
        "scene2_desc": "Service records preserved.",
        "scene3_title": "Unit Histories",
        "scene3_desc": "Military unit legacy documentation.",
        "scene4_title": "Gold Star Families",
        "scene4_desc": "Fallen service member tributes.",
        "quote": "My grandfather was at Pearl Harbor. His story is now preserved as permanently as the USS Arizona.",
        "quote_source": "Potential visitor testimonial",
        "benefit1_title": "Service Documentation",
        "benefit1_desc": "Military records preserved",
        "benefit2_title": "Memorial Gifts",
        "benefit2_desc": "Visitor remembrance items",
        "benefit3_title": "Unit Partnerships",
        "benefit3_desc": "Veterans organization tie-ins",
        "benefit4_title": "Historical Accuracy",
        "benefit4_desc": "Official record integration",
        "benefit5_title": "Honor Programs",
        "benefit5_desc": "Ongoing tribute opportunities",
        "business_type": "military memorial"
    }),
    ("usecase-veterans-en.html", {
        "title": "Veterans Services",
        "meta_description": "TokiStorage for veterans organizations. Preserve military service and sacrifice for generations.",
        "icon": "🇺🇸",
        "subtitle": "Honoring those who served",
        "theme_color": "#DC2626",
        "theme_light": "#FEE2E2",
        "theme_dark": "#B91C1C",
        "why_title": "Why Veterans Services?",
        "why_p1": "Veterans' stories deserve to be told and preserved. From World War II to present conflicts, these personal histories are national treasures.",
        "why_p2": "TokiStorage offers veterans and their families a way to preserve service records, photos, and stories in a format that matches their sacrifice.",
        "scene1_title": "Service Records",
        "scene1_desc": "Complete military history preserved.",
        "scene2_title": "Personal Stories",
        "scene2_desc": "Veteran narratives documented.",
        "scene3_title": "Unit Reunions",
        "scene3_desc": "Comradeship commemorated.",
        "scene4_title": "Memorial Projects",
        "scene4_desc": "Organization tribute programs.",
        "quote": "My service in Vietnam shaped my life. Now my grandchildren will understand why, forever.",
        "quote_source": "Potential veteran testimonial",
        "benefit1_title": "Personal Legacy",
        "benefit1_desc": "Individual service stories",
        "benefit2_title": "Family Heritage",
        "benefit2_desc": "Pass to future generations",
        "benefit3_title": "Organization Fundraising",
        "benefit3_desc": "Support veteran programs",
        "benefit4_title": "Oral History",
        "benefit4_desc": "Preserve spoken memories",
        "benefit5_title": "Community Building",
        "benefit5_desc": "Connect veteran families",
        "business_type": "veterans services"
    }),
    ("usecase-pet-memorial-en.html", {
        "title": "Pet Memorial Services",
        "meta_description": "TokiStorage for pet memorials. Honor beloved animal companions with eternal tributes.",
        "icon": "🐾",
        "subtitle": "Faithful friends, forever remembered",
        "theme_color": "#7C3AED",
        "theme_light": "#EDE9FE",
        "theme_dark": "#6D28D9",
        "why_title": "Why Pet Memorials?",
        "why_p1": "For many, pets are family. The loss of a beloved animal companion brings genuine grief that deserves acknowledgment and commemoration.",
        "why_p2": "TokiStorage offers pet owners a dignified way to preserve memories of their faithful companions in eternal quartz glass.",
        "scene1_title": "Passing Tributes",
        "scene1_desc": "Memorial when pets cross the rainbow bridge.",
        "scene2_title": "Life Celebrations",
        "scene2_desc": "Celebrating years of companionship.",
        "scene3_title": "Rescue Stories",
        "scene3_desc": "Adoption journeys preserved.",
        "scene4_title": "Service Animals",
        "scene4_desc": "Working animal tributes.",
        "quote": "Max was my best friend for 15 years. He deserves to be remembered forever.",
        "quote_source": "Potential customer testimonial",
        "benefit1_title": "Grief Support",
        "benefit1_desc": "Meaningful mourning option",
        "benefit2_title": "Premium Service",
        "benefit2_desc": "High-value add-on offering",
        "benefit3_title": "Photo Integration",
        "benefit3_desc": "Include pet images",
        "benefit4_title": "Vet Partnerships",
        "benefit4_desc": "Referral relationships",
        "benefit5_title": "Ash Combination",
        "benefit5_desc": "Pair with cremation services",
        "business_type": "pet memorial"
    }),
    ("usecase-grief-en.html", {
        "title": "Grief Counseling Services",
        "meta_description": "TokiStorage for grief counselors. Help clients preserve memories as part of healing.",
        "icon": "💚",
        "subtitle": "Healing through remembrance",
        "theme_color": "#059669",
        "theme_light": "#D1FAE5",
        "theme_dark": "#047857",
        "why_title": "Why Grief Counseling?",
        "why_p1": "Grief counselors guide people through loss. Part of healing is finding meaningful ways to honor and remember those we've lost.",
        "why_p2": "TokiStorage offers counselors a therapeutic tool—helping clients preserve memories in a tangible, permanent form that supports the grieving process.",
        "scene1_title": "Memory Projects",
        "scene1_desc": "Therapeutic memory collection.",
        "scene2_title": "Letter Writing",
        "scene2_desc": "Preserved messages to the departed.",
        "scene3_title": "Support Groups",
        "scene3_desc": "Shared grief experiences.",
        "scene4_title": "Anniversary Rituals",
        "scene4_desc": "Ongoing remembrance practices.",
        "quote": "My counselor suggested preserving mom's letters. The project helped me process my grief.",
        "quote_source": "Potential client testimonial",
        "benefit1_title": "Therapeutic Tool",
        "benefit1_desc": "Support healing process",
        "benefit2_title": "Client Gift",
        "benefit2_desc": "Meaningful session outcome",
        "benefit3_title": "Group Programs",
        "benefit3_desc": "Shared memory projects",
        "benefit4_title": "Professional Addition",
        "benefit4_desc": "Enhance counseling practice",
        "benefit5_title": "Referral Network",
        "benefit5_desc": "Funeral home partnerships",
        "business_type": "grief counseling"
    }),
    # 39-50: Farms & Products
    ("usecase-kona-coffee-en.html", {
        "title": "Kona Coffee Farms",
        "meta_description": "TokiStorage for Kona coffee farms. Preserve the heritage of Hawaii's famous coffee.",
        "icon": "☕",
        "subtitle": "Coffee heritage, eternally preserved",
        "theme_color": "#78350F",
        "theme_light": "#FEF3C7",
        "theme_dark": "#92400E",
        "why_title": "Why Kona Coffee Farms?",
        "why_p1": "Kona coffee is Hawaii's most famous agricultural product—generations of families cultivating the perfect bean on volcanic slopes.",
        "why_p2": "TokiStorage preserves farm histories, family legacies, and the stories behind every cup of Kona coffee for future generations.",
        "scene1_title": "Farm Heritage",
        "scene1_desc": "Multi-generational farm stories.",
        "scene2_title": "Tour Memento",
        "scene2_desc": "Visitor farm experience keepsake.",
        "scene3_title": "Limited Harvests",
        "scene3_desc": "Special vintage documentation.",
        "scene4_title": "Founder Tributes",
        "scene4_desc": "Pioneer farmer recognition.",
        "quote": "My great-grandfather planted these trees in 1920. Our family story is now preserved forever.",
        "quote_source": "Potential farm owner testimonial",
        "benefit1_title": "Heritage Value",
        "benefit1_desc": "Farm history preservation",
        "benefit2_title": "Tour Premium",
        "benefit2_desc": "Visitor experience enhancement",
        "benefit3_title": "Brand Story",
        "benefit3_desc": "Deepen customer connection",
        "benefit4_title": "Limited Editions",
        "benefit4_desc": "Special harvest documentation",
        "benefit5_title": "Family Legacy",
        "benefit5_desc": "Generational continuity",
        "business_type": "coffee farm"
    }),
    ("usecase-macadamia-en.html", {
        "title": "Macadamia Farms",
        "meta_description": "TokiStorage for macadamia nut farms. Preserve the sweet history of Hawaii's favorite nut.",
        "icon": "🥜",
        "subtitle": "Nuts about heritage",
        "theme_color": "#A16207",
        "theme_light": "#FEF3C7",
        "theme_dark": "#854D0E",
        "why_title": "Why Macadamia Farms?",
        "why_p1": "Macadamia nuts are synonymous with Hawaii. Family farms have cultivated these prized nuts for generations, building brands and traditions.",
        "why_p2": "TokiStorage preserves the stories of these farms, from pioneer planters to modern operations, ensuring their legacy endures.",
        "scene1_title": "Farm Tours",
        "scene1_desc": "Visitor experience keepsake.",
        "scene2_title": "Family History",
        "scene2_desc": "Generational farm stories.",
        "scene3_title": "Product Heritage",
        "scene3_desc": "Brand story preservation.",
        "scene4_title": "Founder Recognition",
        "scene4_desc": "Pioneer farmer tributes.",
        "quote": "Grandpa started with 50 trees. Now we have 5,000. His story deserves to live forever.",
        "quote_source": "Potential farm owner testimonial",
        "benefit1_title": "Heritage Marketing",
        "benefit1_desc": "Deepen brand story",
        "benefit2_title": "Tour Enhancement",
        "benefit2_desc": "Premium visitor experience",
        "benefit3_title": "Gift Shop Item",
        "benefit3_desc": "High-margin keepsake",
        "benefit4_title": "Family Legacy",
        "benefit4_desc": "Generational preservation",
        "benefit5_title": "Agricultural History",
        "benefit5_desc": "Hawaii farming heritage",
        "business_type": "macadamia farm"
    }),
    # Continuing with more usecases...
]

def generate_usecases():
    """Generate all usecase HTML files"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.dirname(script_dir)  # toki directory

    for filename, data in USECASES:
        # Fill template with data
        html = TEMPLATE.format(**data)

        # Write file
        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f"Generated: {filename}")

    print(f"\nTotal: {len(USECASES)} usecase pages generated")

if __name__ == "__main__":
    generate_usecases()
