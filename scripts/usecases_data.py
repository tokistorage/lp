#!/usr/bin/env python3
"""Usecase data for 100 Hawaii market pages"""

USECASES = [
    # 1-20: Tourism & Leisure
    ("resort", "🏨", "Luxury Resort Hotels", "Turn paradise stays into eternal memories", "#0369A1", "#E0F2FE", "#075985", "resort"),
    ("boutique-hotel", "🏡", "Boutique Hotels", "Intimate stays, eternal impressions", "#7C3AED", "#EDE9FE", "#5B21B6", "boutique hotel"),
    ("vacation-rental", "🏠", "Vacation Rentals", "Make every rental unforgettable", "#059669", "#D1FAE5", "#047857", "vacation rental"),
    ("cruise", "🚢", "Cruise Lines", "Voyages that last forever", "#0284C7", "#E0F2FE", "#0369A1", "cruise line"),
    ("helicopter", "🚁", "Helicopter Tours", "Sky-high memories, grounded forever", "#DC2626", "#FEE2E2", "#B91C1C", "helicopter tour"),
    ("scenic-flight", "✈️", "Scenic Flight Tours", "Island views preserved forever", "#2563EB", "#DBEAFE", "#1D4ED8", "scenic flight"),
    ("yacht", "⛵", "Yacht Charters", "Sail into eternity", "#0891B2", "#CFFAFE", "#0E7490", "yacht charter"),
    ("fishing", "🎣", "Fishing Charters", "Legendary catches, eternal stories", "#0D9488", "#CCFBF1", "#0F766E", "fishing charter"),
    ("whale", "🐋", "Whale Watching", "Encounters that echo through time", "#1E40AF", "#DBEAFE", "#1E3A8A", "whale watching tour"),
    ("diving", "🤿", "Diving Shops", "Dive deep, remember forever", "#0077B6", "#CAF0F8", "#023E8A", "diving operation"),
    ("snorkel", "🐠", "Snorkeling Tours", "Surface memories, deep meaning", "#06B6D4", "#CFFAFE", "#0891B2", "snorkeling tour"),
    ("surf-shop", "🏄", "Surf Shops", "Ride the moment, keep it forever", "#F59E0B", "#FEF3C7", "#D97706", "surf shop"),
    ("surf-school", "🌊", "Surf Schools", "Every surfer starts somewhere", "#EA580C", "#FFEDD5", "#C2410C", "surf school"),
    ("sup", "🛶", "SUP & Kayak Rentals", "Paddle into memory", "#16A34A", "#DCFCE7", "#15803D", "paddle sports"),
    ("golf", "⛳", "Golf Courses", "Legendary rounds, eternal records", "#22C55E", "#DCFCE7", "#16A34A", "golf course"),
    ("luau", "🌺", "Luau Venues", "Aloha spirit, eternal memory", "#DB2777", "#FCE7F3", "#BE185D", "luau venue"),
    ("zipline", "🌴", "Zipline Adventures", "Soar through paradise, remember forever", "#65A30D", "#ECFCCB", "#4D7C0F", "adventure tour"),
    ("hiking", "🥾", "Hiking Tours", "Every trail tells a story", "#92400E", "#FEF3C7", "#78350F", "hiking tour"),
    ("horseback", "🐴", "Horseback Riding", "Ride into the sunset, remember forever", "#A16207", "#FEF9C3", "#854D0E", "horseback riding"),
    ("atv", "🏎️", "ATV Tours", "Off-road memories, on record forever", "#B45309", "#FEF3C7", "#92400E", "ATV tour"),

    # 21-28: Wedding
    ("wedding-venue", "💒", "Wedding Venues", "Where forever begins", "#EC4899", "#FCE7F3", "#DB2777", "wedding venue"),
    ("wedding-planner", "💐", "Wedding Planners", "Planning forever, preserving always", "#D946EF", "#FAE8FF", "#C026D3", "wedding planning"),
    ("chapel", "⛪", "Wedding Chapels", "Sacred vows, eternal preservation", "#8B5CF6", "#EDE9FE", "#7C3AED", "wedding chapel"),
    ("beach-wedding", "🏖️", "Beach Wedding Services", "Toes in sand, love in quartz", "#0EA5E9", "#E0F2FE", "#0284C7", "beach wedding"),
    ("wedding-photo", "📸", "Wedding Photography", "Images fade, quartz endures", "#6366F1", "#E0E7FF", "#4F46E5", "wedding photography"),
    ("bridal-beauty", "💄", "Bridal Beauty Services", "Beauty captured, forever", "#F472B6", "#FCE7F3", "#EC4899", "bridal beauty"),
    ("wedding-florist", "🌸", "Wedding Florists", "Flowers fade, memories bloom forever", "#10B981", "#D1FAE5", "#059669", "wedding florist"),
    ("honeymoon", "🌙", "Honeymoon Resorts", "Where married life begins", "#BE185D", "#FCE7F3", "#9D174D", "honeymoon resort"),

    # 29-38: Memorial & Spiritual
    ("funeral", "🕯️", "Funeral Homes", "Honoring lives, preserving legacies", "#4B5563", "#F3F4F6", "#374151", "funeral service"),
    ("ocean-scattering", "🌊", "Ocean Scattering Services", "Return to the sea, remembered forever", "#0077B6", "#CAF0F8", "#023E8A", "ocean scattering"),
    ("memorial-reef", "🐚", "Memorial Reef Services", "Becoming part of the reef", "#0891B2", "#CFFAFE", "#0E7490", "memorial reef"),
    ("church", "⛪", "Churches", "Faith journeys, eternal records", "#7C3AED", "#EDE9FE", "#6D28D9", "church"),
    ("temple", "🛕", "Buddhist Temples", "Dharma preserved through time", "#F59E0B", "#FEF3C7", "#D97706", "Buddhist temple"),
    ("heiau", "🗿", "Hawaiian Heiau", "Honoring ancestors, preserving traditions", "#92400E", "#FEF3C7", "#78350F", "cultural site"),
    ("military-memorial", "🎖️", "Military Memorials", "Service remembered, sacrifice honored", "#1E3A8A", "#DBEAFE", "#1E40AF", "military memorial"),
    ("veterans", "🇺🇸", "Veterans Services", "Honoring those who served", "#DC2626", "#FEE2E2", "#B91C1C", "veterans services"),
    ("pet-memorial", "🐾", "Pet Memorial Services", "Faithful friends, forever remembered", "#7C3AED", "#EDE9FE", "#6D28D9", "pet memorial"),
    ("grief", "💚", "Grief Counseling Services", "Healing through remembrance", "#059669", "#D1FAE5", "#047857", "grief counseling"),

    # 39-50: Farms & Products
    ("kona-coffee", "☕", "Kona Coffee Farms", "Coffee heritage, eternally preserved", "#78350F", "#FEF3C7", "#92400E", "coffee farm"),
    ("macadamia", "🥜", "Macadamia Farms", "Nuts about heritage", "#A16207", "#FEF3C7", "#854D0E", "macadamia farm"),
    ("pineapple", "🍍", "Pineapple Plantations", "Tropical legacy preserved", "#EAB308", "#FEF9C3", "#CA8A04", "pineapple plantation"),
    ("vanilla", "🌿", "Vanilla Farms", "Essence of paradise, forever", "#65A30D", "#ECFCCB", "#4D7C0F", "vanilla farm"),
    ("chocolate", "🍫", "Chocolate Farms", "Sweet memories, eternal taste", "#92400E", "#FEF3C7", "#78350F", "chocolate farm"),
    ("distillery", "🥃", "Distilleries", "Spirits with stories", "#B45309", "#FEF3C7", "#92400E", "distillery"),
    ("brewery", "🍺", "Craft Breweries", "Brewing memories that last", "#F59E0B", "#FEF3C7", "#D97706", "craft brewery"),
    ("winery", "🍷", "Wineries", "Vintage moments preserved", "#7C2D12", "#FEE2E2", "#991B1B", "winery"),
    ("honey", "🍯", "Honey Farms", "Sweet heritage, golden memories", "#EAB308", "#FEF9C3", "#CA8A04", "honey farm"),
    ("lavender", "💜", "Lavender Farms", "Purple paradise preserved", "#7C3AED", "#EDE9FE", "#6D28D9", "lavender farm"),
    ("tropical-fruit", "🥭", "Tropical Fruit Farms", "Island flavors, lasting memories", "#F97316", "#FFEDD5", "#EA580C", "tropical fruit farm"),
    ("farmers-market", "🧺", "Farmers Markets", "Community roots, eternal connections", "#16A34A", "#DCFCE7", "#15803D", "farmers market"),

    # 51-63: Shops & Crafts
    ("hawaiian-jewelry", "💎", "Hawaiian Jewelry", "Treasures as timeless as your memories", "#0EA5E9", "#E0F2FE", "#0284C7", "jewelry shop"),
    ("lei", "🌺", "Lei Shops", "Aloha woven, memories preserved", "#DB2777", "#FCE7F3", "#BE185D", "lei shop"),
    ("aloha-wear", "👕", "Aloha Wear Shops", "Island style, eternal memories", "#F59E0B", "#FEF3C7", "#D97706", "aloha wear shop"),
    ("ukulele", "🎸", "Ukulele Shops", "Music of the islands, forever", "#92400E", "#FEF3C7", "#78350F", "ukulele shop"),
    ("art-gallery", "🎨", "Art Galleries", "Island artistry, eternal expression", "#6366F1", "#E0E7FF", "#4F46E5", "art gallery"),
    ("tattoo", "✒️", "Tattoo Studios", "Ink tells stories, quartz preserves them", "#1E293B", "#F1F5F9", "#0F172A", "tattoo studio"),
    ("surfboard-shaper", "🏄", "Surfboard Shapers", "Craftsmanship preserved forever", "#0891B2", "#CFFAFE", "#0E7490", "surfboard shaper"),
    ("hawaiian-quilt", "🧵", "Hawaiian Quilt Shops", "Stitched traditions, eternal patterns", "#EC4899", "#FCE7F3", "#DB2777", "quilt shop"),
    ("koa-wood", "🪵", "Koa Wood Crafts", "Island wood, lasting legacy", "#92400E", "#FEF3C7", "#78350F", "koa wood crafts"),
    ("shell-art", "🐚", "Shell Art & Jewelry", "Ocean treasures, eternal beauty", "#06B6D4", "#CFFAFE", "#0891B2", "shell art"),
    ("gift-shop", "🎁", "Gift Shops", "Memories worth keeping forever", "#F472B6", "#FCE7F3", "#EC4899", "gift shop"),
    ("antique", "🏺", "Antique Shops", "History preserved, stories continued", "#B45309", "#FEF3C7", "#92400E", "antique shop"),
    ("bookstore", "📚", "Bookstores", "Stories within stories", "#7C3AED", "#EDE9FE", "#6D28D9", "bookstore"),

    # 64-75: Wellness & Healthcare
    ("spa", "🧘", "Spa & Wellness Retreats", "Renewal remembered forever", "#10B981", "#D1FAE5", "#059669", "spa retreat"),
    ("yoga", "🧘‍♀️", "Yoga Studios", "Practice preserved, journey continued", "#8B5CF6", "#EDE9FE", "#7C3AED", "yoga studio"),
    ("pilates", "💪", "Pilates Studios", "Strength journeys documented", "#EC4899", "#FCE7F3", "#DB2777", "pilates studio"),
    ("meditation", "☯️", "Meditation Centers", "Inner peace, outer preservation", "#6366F1", "#E0E7FF", "#4F46E5", "meditation center"),
    ("lomilomi", "🤲", "Lomilomi Massage", "Healing touch, lasting memory", "#92400E", "#FEF3C7", "#78350F", "lomilomi massage"),
    ("hospital", "🏥", "Hospitals", "Life moments, carefully preserved", "#DC2626", "#FEE2E2", "#B91C1C", "hospital"),
    ("clinic", "🩺", "Medical Clinics", "Health journeys documented", "#0891B2", "#CFFAFE", "#0E7490", "medical clinic"),
    ("dental", "🦷", "Dental Clinics", "Smiles preserved forever", "#0EA5E9", "#E0F2FE", "#0284C7", "dental clinic"),
    ("nursing", "👵", "Nursing Homes", "Life stories, eternally treasured", "#7C3AED", "#EDE9FE", "#6D28D9", "nursing home"),
    ("retirement", "🏡", "Retirement Communities", "Golden years, preserved forever", "#F59E0B", "#FEF3C7", "#D97706", "retirement community"),
    ("rehab", "🏃", "Rehabilitation Centers", "Recovery journeys celebrated", "#16A34A", "#DCFCE7", "#15803D", "rehabilitation center"),
    ("mental-health", "🧠", "Mental Health Services", "Wellness journeys, lasting support", "#8B5CF6", "#EDE9FE", "#7C3AED", "mental health services"),

    # 76-85: Education & Culture
    ("cultural-center", "🏛️", "Cultural Centers", "Hawaiian heritage preserved forever", "#92400E", "#FEF3C7", "#78350F", "cultural center"),
    ("university", "🎓", "Universities", "Academic achievements, eternal records", "#1E40AF", "#DBEAFE", "#1E3A8A", "university"),
    ("language-school", "📖", "Language Schools", "Learning journeys preserved", "#059669", "#D1FAE5", "#047857", "language school"),
    ("hula", "💃", "Hula Schools", "Dance traditions, eternal movement", "#EC4899", "#FCE7F3", "#DB2777", "hula school"),
    ("ukulele-school", "🎵", "Ukulele Schools", "Musical journeys preserved", "#F59E0B", "#FEF3C7", "#D97706", "ukulele school"),
    ("cooking-class", "👨‍🍳", "Cooking Classes", "Recipes and memories preserved", "#DC2626", "#FEE2E2", "#B91C1C", "cooking class"),
    ("museum", "🏛️", "Museums", "History preserved, twice", "#6366F1", "#E0E7FF", "#4F46E5", "museum"),
    ("aquarium", "🐟", "Aquariums", "Ocean wonders, lasting memories", "#0077B6", "#CAF0F8", "#023E8A", "aquarium"),
    ("zoo", "🦁", "Zoos", "Wildlife encounters preserved", "#16A34A", "#DCFCE7", "#15803D", "zoo"),
    ("botanical-garden", "🌺", "Botanical Gardens", "Nature's beauty, eternally captured", "#059669", "#D1FAE5", "#047857", "botanical garden"),

    # 86-95: Business & Services
    ("real-estate", "🏠", "Real Estate", "Property milestones preserved", "#0891B2", "#CFFAFE", "#0E7490", "real estate"),
    ("law-firm", "⚖️", "Law Firms", "Legal milestones documented", "#1E293B", "#F1F5F9", "#0F172A", "law firm"),
    ("insurance", "🛡️", "Insurance Companies", "Protection stories preserved", "#2563EB", "#DBEAFE", "#1D4ED8", "insurance company"),
    ("bank", "🏦", "Banks", "Financial milestones preserved", "#059669", "#D1FAE5", "#047857", "bank"),
    ("car-rental", "🚗", "Car Rentals", "Road trip memories preserved", "#DC2626", "#FEE2E2", "#B91C1C", "car rental"),
    ("limousine", "🚙", "Limousine Services", "Luxury journeys remembered", "#1E293B", "#F1F5F9", "#0F172A", "limousine service"),
    ("concierge", "🎩", "Concierge Services", "Perfect experiences preserved", "#7C3AED", "#EDE9FE", "#6D28D9", "concierge service"),
    ("photo-studio", "📷", "Photography Studios", "Captured moments, preserved forever", "#6366F1", "#E0E7FF", "#4F46E5", "photography studio"),
    ("event-planner", "🎉", "Event Planners", "Celebrations preserved forever", "#EC4899", "#FCE7F3", "#DB2777", "event planning"),
    ("moving", "📦", "Moving & Storage", "Life transitions documented", "#F59E0B", "#FEF3C7", "#D97706", "moving company"),

    # 96-100: Food & Dining
    ("fine-dining", "🍽️", "Fine Dining", "Culinary moments preserved", "#7C2D12", "#FEE2E2", "#991B1B", "fine dining restaurant"),
    ("poke", "🐟", "Poke Shops", "Island flavors, lasting memories", "#0891B2", "#CFFAFE", "#0E7490", "poke shop"),
    ("shave-ice", "🍧", "Shave Ice Shops", "Cool memories, forever sweet", "#06B6D4", "#CFFAFE", "#0891B2", "shave ice shop"),
    ("farm-to-table", "🥗", "Farm-to-Table Restaurants", "Local flavors, lasting stories", "#16A34A", "#DCFCE7", "#15803D", "farm-to-table restaurant"),
    ("bakery", "🥐", "Bakeries", "Sweet traditions preserved", "#F59E0B", "#FEF3C7", "#D97706", "bakery"),
]

# Content templates for each category
CONTENT_TEMPLATES = {
    "tourism": {
        "why_p1": "Hawaii offers once-in-a-lifetime experiences that deserve to be remembered forever. Visitors come seeking adventure, relaxation, and connection with paradise.",
        "why_p2": "TokiStorage transforms these precious moments into eternal keepsakes, engraved in quartz glass that will outlast generations.",
    },
    "wedding": {
        "why_p1": "Hawaii is the world's premier destination wedding location. Couples travel across the globe to celebrate their love in paradise.",
        "why_p2": "TokiStorage offers these couples something beyond photos—a permanent, physical embodiment of their vows that will outlast generations.",
    },
    "memorial": {
        "why_p1": "Honoring those we love is one of humanity's most sacred traditions. Meaningful memorials help us process grief and celebrate lives well lived.",
        "why_p2": "TokiStorage preserves memories in quartz glass—a format as enduring as love itself, lasting a thousand years or more.",
    },
    "farm": {
        "why_p1": "Hawaii's agricultural heritage spans generations. Family farms and local producers have built traditions worth preserving forever.",
        "why_p2": "TokiStorage captures these stories, from pioneer founders to current caretakers, ensuring agricultural legacies endure.",
    },
    "shop": {
        "why_p1": "Hawaiian craftsmanship represents the spirit of aloha—handmade with care, designed with meaning, created with love.",
        "why_p2": "TokiStorage preserves the stories behind the craft, connecting customers to artisans across generations.",
    },
    "wellness": {
        "why_p1": "Wellness journeys are deeply personal. Transformations of body, mind, and spirit deserve recognition and remembrance.",
        "why_p2": "TokiStorage commemorates these milestones in a format as lasting as the changes themselves.",
    },
    "education": {
        "why_p1": "Learning never truly ends, but milestones along the way deserve celebration. Academic and cultural achievements shape who we become.",
        "why_p2": "TokiStorage preserves these accomplishments in eternal quartz glass, creating permanent records of growth and discovery.",
    },
    "business": {
        "why_p1": "Business milestones mark important transitions—new homes, major achievements, life-changing decisions that deserve documentation.",
        "why_p2": "TokiStorage offers a premium way to commemorate these moments for clients and partners.",
    },
    "dining": {
        "why_p1": "Food brings people together. Special meals mark celebrations, create traditions, and build memories that last lifetimes.",
        "why_p2": "TokiStorage captures these culinary moments in eternal quartz, preserving not just the meal but the meaning behind it.",
    },
}

def get_category(index):
    """Get category for content template based on usecase index"""
    if index < 20: return "tourism"
    if index < 28: return "wedding"
    if index < 38: return "memorial"
    if index < 50: return "farm"
    if index < 63: return "shop"
    if index < 75: return "wellness"
    if index < 85: return "education"
    if index < 95: return "business"
    return "dining"
