/**
 * 20 Distinct Architectural Templates for NYC Catalog Listings
 * Used in Round-Robin to ensure high linguistic and stylistic diversity.
 */

function formatSpecs(prop) {
  const neighborhood = prop.address_subdivision || prop.borough || 'Manhattan';
  const beds = parseInt(prop.bedrooms, 10) || 0;
  const baths = parseFloat(prop.total_bathrooms) || 1;
  const address = prop.address_street || 'Prime Location';
  const unit = prop.frontend_title_unit_number ? ` ${prop.frontend_title_unit_number}` : '';
  const sqft = prop.sqft ? `${Number(prop.sqft).toLocaleString()} square feet` : null;

  const bedText = beds === 0 ? 'studio residence' : `${beds}-bedroom home`;
  const bathText = baths === 1 ? '1 bathroom' : `${baths} bathrooms`;
  const spaceClause = sqft ? `, spanning approximately ${sqft}` : '';

  return { neighborhood, beds, baths, address, unit, sqft, bedText, bathText, spaceClause };
}

const TEMPLATES = [
  // 1. Classic Pre-War Elegance
  (p) => {
    const s = formatSpecs(p);
    const hook = `Gracing a coveted block in ${s.neighborhood}, Residence${s.unit} at ${s.address} is a meticulously maintained ${s.bedText}${s.spaceClause}.`;
    const living = `An inviting formal foyer opens into a grand living room defined by beamed ceilings, refined baseboard moldings, and pristine hardwood floors. Generous proportions provide dedicated zones for relaxed lounging and formal dining with leafy neighborhood views.`;
    const kitchen = `The windowed kitchen is appointed with custom shaker cabinetry, polished granite countertops, and premium stainless steel appliances that harmonize historic warmth with contemporary convenience.`;
    const beds = s.beds === 0
      ? `The flexible studio layout accommodates dedicated sleeping, dining, and workspace nooks with exceptional ease.`
      : `The primary bedroom suite offers tranquil courtyard exposures, deep fitted closets, and an en-suite bath finished in timeless subway tiling.`;
    const building = `Nestled within an established full-service pre-war cooperative offering 24-hour doorman attendance, live-in superintendent, and immediate access to transit and dining.`;
    return { hook, living, kitchen, beds, building };
  },

  // 2. Sun-Drenched Modern Minimalist
  (p) => {
    const s = formatSpecs(p);
    const hook = `Defined by crisp architectural lines and abundant natural light, Residence${s.unit} at ${s.address} offers a turnkey ${s.bedText} in vibrant ${s.neighborhood}.`;
    const living = `Expansive south-facing casement windows flood the open-concept living and entertaining room with day-long sunshine. Wide-plank white oak flooring and minimalist reveals enhance the home's calm, airy aesthetic.`;
    const kitchen = `The streamlined culinary kitchen showcases seamless matte-lacquer cabinetry, a honed quartz breakfast peninsula, and fully integrated European appliances.`;
    const beds = s.beds === 0
      ? `Smart architectural millwork gracefully demarcates the sleeping area from the main entertaining lounge.`
      : `The serene sleeping quarters feature motorized solar shades, expansive wardrobe storage, and a spa-inspired bath with matte black fixtures.`;
    const building = `Residents enjoy a landscaped rooftop terrace with sweeping skyline views, boutique fitness studio, bicycle storage, and virtual concierge service.`;
    return { hook, living, kitchen, beds, building };
  },

  // 3. Industrial Chic Loft
  (p) => {
    const s = formatSpecs(p);
    const hook = `Experience quintessential loft living at ${s.address}, where Residence${s.unit} delivers an authentic ${s.bedText} in ${s.neighborhood}.`;
    const living = `Soaring 10-foot ceilings and structural column accents frame an expansive great room ideal for showcasing art and hosting lively gatherings. Polished concrete and hardwood elements create a striking contemporary ambiance.`;
    const kitchen = `An open chef's kitchen features an oversized waterfall island, commercial-grade Bertazzoni gas range, and blackened steel hardware.`;
    const beds = s.beds === 0
      ? `The open loft configuration affords boundless flexibility for customized interior layouts and bespoke furniture arrangements.`
      : `The secluded bedroom sanctuary is buffered from the living area, featuring an expansive dressing closet and a designer bath with walk-in rainfall shower.`;
    const building = `A converted historic industrial landmark offering key-locked elevator access, package delivery reception, and a landscaped resident lounge.`;
    return { hook, living, kitchen, beds, building };
  },

  // 4. Boutique Condominium Sanctuary
  (p) => {
    const s = formatSpecs(p);
    const hook = `A benchmark of refined residential design, Residence${s.unit} at ${s.address} is a bespoke ${s.bedText} nestled in prime ${s.neighborhood}.`;
    const living = `Double-glazed architectural windows ensure pin-drop quiet tranquility throughout the primary great room. Chevron white oak floors lead gracefully toward an illuminated gallery space.`;
    const kitchen = `Crafted with custom walnut cabinetry, Calacatta quartz countertops, and a full suite of Miele culinary appliances including a concealed wine cooler.`;
    const beds = s.beds === 0
      ? `The residence offers tailored built-in closets and a luxurious marble-clad bathroom with radiant heated floors.`
      : `The primary suite boasts corner exposure, a walk-in wardrobe, and a five-fixture ensuite bathroom with a freestanding soaking tub.`;
    const building = `A discreet full-service condominium featuring 24-hour door attendant, private wellness center, and private storage allocations.`;
    return { hook, living, kitchen, beds, building };
  },

  // 5. Timeless Brownstone Charm
  (p) => {
    const s = formatSpecs(p);
    const hook = `Capturing the romance of historic New York, Residence${s.unit} at ${s.address} is a charismatic ${s.bedText} on one of ${s.neighborhood}'s loveliest tree-lined corridors.`;
    const living = `High ceilings, an ornamental carved fireplace mantle, and exposed brick walls lend immense character to the central parlor room. Oversized wood-framed windows look out onto serene townhouse gardens.`;
    const kitchen = `The country-modern kitchen features open timber shelving, deep farmhouse sink, butcher block and marble accents, and gas cooking.`;
    const beds = s.beds === 0
      ? `A sunlit alcove easily accommodates a queen bed while preserving an open, inviting living and dining footprint.`
      : `The tranquil bedroom overlooks private rear gardens, providing exceptional quiet, generous storage, and an updated ensuite bath.`;
    const building = `Set within an intimate, well-maintained townhouse collective steps away from neighborhood cafes, artisan bakeries, and express subway lines.`;
    return { hook, living, kitchen, beds, building };
  },

  // 6. Art Deco Gem
  (p) => {
    const s = formatSpecs(p);
    const hook = `Showcasing classic 1930s architectural glamour, Residence${s.unit} at ${s.address} is a gracious ${s.bedText} situated in prestigious ${s.neighborhood}.`;
    const living = `A sunken step-down living salon is anchored by curved plaster archways, wrought-iron railings, and original basketweave parquet flooring.`;
    const kitchen = `The modernized pass-through kitchen features brushed brass fixtures, terrazzo tile flooring, custom cabinetry, and energy-efficient appliances.`;
    const beds = s.beds === 0
      ? `The sunken layout naturally separates living and sleeping zones, complete with a dedicated dressing corridor and three generous closets.`
      : `A grand bedroom suite easily accommodates king-sized furnishings and features cross-ventilating exposures and two deep walk-in closets.`;
    const building = `A celebrated Art Deco cooperative boasting a dramatic terrazzo lobby, full-time doorman service, laundry facility, and landscaped common garden.`;
    return { hook, living, kitchen, beds, building };
  },

  // 7. Sleek Glass Tower Horizon
  (p) => {
    const s = formatSpecs(p);
    const hook = `Perched high above ${s.neighborhood}, Residence${s.unit} at ${s.address} delivers a commanding ${s.bedText} with cinematic urban vistas.`;
    const living = `Floor-to-ceiling glass curtain walls frame dramatic skyline horizons. The seamless living and entertaining salon is finished with pale oak floors and recessed architectural cove lighting.`;
    const kitchen = `The minimalist Italian kitchen features seamless flat-panel lacquer cabinetry, marble waterfall island, and integrated Sub-Zero and Bosch appliances.`;
    const beds = s.beds === 0
      ? `Wall-to-wall glass panels create an expansive, luminous studio sanctuary equipped with custom automated roller shades.`
      : `The primary suite offers jaw-dropping city views, dual bespoke closets, and an ensuite bath with frameless glass rain shower.`;
    const building = `A world-class residential glass tower featuring 24-hour concierge, indoor swimming pool, fitness club, children's playroom, and valet parking.`;
    return { hook, living, kitchen, beds, building };
  },

  // 8. High-Floor Corner Residence
  (p) => {
    const s = formatSpecs(p);
    const hook = `Boasting dual corner exposures and panoramic natural illumination, Residence${s.unit} at ${s.address} is an exceptional ${s.bedText} in ${s.neighborhood}.`;
    const living = `Oversized windows to the south and east capture vibrant cityscapes from morning to evening. The expansive corner great room easily hosts both large dinner parties and comfortable casual living.`;
    const kitchen = `A sun-drenched eat-in kitchen offers marble countertops, full-height pantry storage, and premium stainless steel appliances designed for the home chef.`;
    const beds = s.beds === 0
      ? `Multiple exposures give this studio apartment an airy, open feel rare for city residences.`
      : `The split-bedroom floor plan guarantees privacy. The primary suite features a corner window alcove, extensive closets, and an ensuite stone-tiled bath.`;
    const building = `Full-service luxury cooperative with 24-hour doorman, on-site garage, central laundry, and an expansive landscaped roof deck.`;
    return { hook, living, kitchen, beds, building };
  },

  // 9. Modern Scandinavian Haven
  (p) => {
    const s = formatSpecs(p);
    const hook = `Emphasizing natural materials and luminous tranquility, Residence${s.unit} at ${s.address} is a peaceful ${s.bedText} in dynamic ${s.neighborhood}.`;
    const living = `A neutral color palette, wide pale oak flooring, and custom acoustic ceiling treatments create a relaxing haven insulated from the bustling city outside.`;
    const kitchen = `Custom ash-wood flat-panel cabinetry blends seamlessly with Caesarstone countertops and whisper-quiet integrated appliances.`;
    const beds = s.beds === 0
      ? `Custom concealed storage solutions ensure every square foot is optimized for clutter-free urban living.`
      : `The bedroom is oriented toward quiet rear exposures, featuring custom reach-in closets and a bathroom with floating vanity and slate tiles.`;
    const building = `An eco-conscious boutique development equipped with keyless entry, energy-efficient HVAC systems, and a green roof terrace.`;
    return { hook, living, kitchen, beds, building };
  },

  // 10. Historic Full-Floor Loft
  (p) => {
    const s = formatSpecs(p);
    const hook = `Offering dramatic scale and architectural distinction, Residence${s.unit} at ${s.address} is a substantial ${s.bedText} in historic ${s.neighborhood}.`;
    const living = `A sprawling 30-foot open living gallery showcases historic cast-iron columns, exposed timber beams, and continuous rows of oversized windows.`;
    const kitchen = `The entertainer's kitchen features an expansive honed granite prep island, custom wood millwork, wine cooler, and professional Viking gas range.`;
    const beds = s.beds === 0
      ? `Soaring ceiling volumes allow for custom lofted arrangements or an expansive open gallery layout.`
      : `The primary suite features a dedicated dressing corridor, dual walk-in closets, and an ensuite bath with double vanity and deep soaking tub.`;
    const building = `An iconic pre-war loft building with secure key-locked elevator entry, package room, and private basement storage rooms.`;
    return { hook, living, kitchen, beds, building };
  },

  // 11. Sophisticated Urban Retreat
  (p) => {
    const s = formatSpecs(p);
    const hook = `Elevating modern urban comfort, Residence${s.unit} at ${s.address} presents a beautifully appointed ${s.bedText} in ${s.neighborhood}.`;
    const living = `The welcoming living room boasts tailored millwork, integrated display shelving, and solid oak flooring bathed in soft indirect lighting.`;
    const kitchen = `The thoughtfully arranged kitchen features polished quartz counters, glass mosaic tile backsplash, and full-size stainless steel appliances.`;
    const beds = s.beds === 0
      ? `An intuitive layout comfortably balances entertainment, study, and restful sleeping quarters.`
      : `The primary bedroom suite offers generous closet capacity and an adjacent renovated bathroom with polished chrome fixtures and porcelain tiling.`;
    const building = `A well-managed full-service residence featuring a doorman, package reception, bicycle storage, and on-site maintenance staff.`;
    return { hook, living, kitchen, beds, building };
  },

  // 12. Quiet Courtyard Oasis
  (p) => {
    const s = formatSpecs(p);
    const hook = `Overlooking landscaped private gardens, Residence${s.unit} at ${s.address} is a peaceful ${s.bedText} sanctuary in vibrant ${s.neighborhood}.`;
    const living = `Quiet courtyard views provide a tranquil green backdrop to the bright living room. Hardwood flooring and high ceilings amplify the calm, serene atmosphere.`;
    const kitchen = `The renovated galley kitchen offers solid stone work surfaces, contemporary white cabinetry, and stainless steel cooking appliances.`;
    const beds = s.beds === 0
      ? `Tucked away from street bustle, this quiet studio provides restorative peace and excellent closet storage.`
      : `The bedroom easily accommodates a king bed and desk, enjoying tree-framed courtyard views and convenient access to the classic tiled bath.`;
    const building = `A sought-after pre-war cooperative offering residents a beautifully landscaped interior courtyard, laundry center, and resident superintendent.`;
    return { hook, living, kitchen, beds, building };
  },

  // 13. Grand Entertaining Suite
  (p) => {
    const s = formatSpecs(p);
    const hook = `Designed for hospitality and refined city living, Residence${s.unit} at ${s.address} is a magnificent ${s.bedText} in premier ${s.neighborhood}.`;
    const living = `A stately gallery leads into a vast living salon with dedicated dining area capable of hosting dinner parties of ten or more with grace and style.`;
    const kitchen = `The gourmet kitchen boasts an eat-in breakfast counter, marble tilework, custom shaker cabinets, and top-tier culinary appliances.`;
    const beds = s.beds === 0
      ? `A remarkably wide floor plan accommodates expansive living furniture alongside an elegant sleeping area.`
      : `The bedroom wing is separated by a privacy door, featuring an expansive master suite with custom walk-in closet and ensuite bath.`;
    const building = `Full-service doorman building featuring concierge service, private garage parking, fitness center, and children's room.`;
    return { hook, living, kitchen, beds, building };
  },

  // 14. Contemporary Skyline Loft
  (p) => {
    const s = formatSpecs(p);
    const hook = `Blending industrial character with modern luxury, Residence${s.unit} at ${s.address} is an impressive ${s.bedText} in central ${s.neighborhood}.`;
    const living = `High concrete ceilings, industrial black-frame windows, and open architectural vistas create a dynamic and energizing living environment.`;
    const kitchen = `The sleek open kitchen features concrete-hued quartz counters, matte cabinetry, and fully integrated European appliances.`;
    const beds = s.beds === 0
      ? `A flexible studio format with industrial accents and tailored closets designed for effortless urban efficiency.`
      : `Generous bedroom quarters feature blackened steel hardware, custom closets, and an ensuite bath with frameless walk-in glass shower.`;
    const building = `Boutique luxury condominium with landscaped outdoor terrace, fitness studio, virtual doorman, and private bike storage.`;
    return { hook, living, kitchen, beds, building };
  },

  // 15. Historic Tree-Lined Enclave
  (p) => {
    const s = formatSpecs(p);
    const hook = `Overlooking picturesque foliage on an iconic block, Residence${s.unit} at ${s.address} is an enchanting ${s.bedText} in ${s.neighborhood}.`;
    const living = `Sunlight filters through classic double-hung windows onto refinished parquet floors with decorative inlay borders. Generous wall space accommodates curated art.`;
    const kitchen = `The windowed kitchen features butcher-block countertops, crisp white subway tile backsplash, and dependable stainless steel appliances.`;
    const beds = s.beds === 0
      ? `Charming pre-war moldings and an efficient layout provide distinct areas for lounging, dining, and sleeping.`
      : `The primary bedroom offers a sunny south-facing exposure, deep closet storage, and proximity to an updated bathroom with a vintage cast-iron tub.`;
    const building = `A charming elevator cooperative with doorman service, pristine common areas, dedicated storage, and resident superintendent.`;
    return { hook, living, kitchen, beds, building };
  },

  // 16. Designer Showcase Residence
  (p) => {
    const s = formatSpecs(p);
    const hook = `Executed with flawless attention to detail, Residence${s.unit} at ${s.address} is a custom-finished ${s.bedText} in ${s.neighborhood}.`;
    const living = `European rift-sawn oak flooring, architectural shadow reveals, and bespoke millwork elevate the primary living space to gallery standards.`;
    const kitchen = `The custom Poliform kitchen is outfitted with Calacatta marble countertops, Dornbracht fixtures, and integrated Sub-Zero and Miele appliances.`;
    const beds = s.beds === 0
      ? `Bespoke built-in cabinetry seamlessly conceals wardrobe, media, and home office elements in this polished studio.`
      : `The primary suite serves as a five-star retreat, complete with custom leather-trimmed closets and an ensuite marble bathroom.`;
    const building = `An exclusive residential building offering white-glove concierge service, private dining room, and state-of-the-art fitness center.`;
    return { hook, living, kitchen, beds, building };
  },

  // 17. Penthouse Loggia / Terrace View
  (p) => {
    const s = formatSpecs(p);
    const hook = `Boasting exceptional open sky and neighborhood views, Residence${s.unit} at ${s.address} is an extraordinary ${s.bedText} in coveted ${s.neighborhood}.`;
    const living = `Walls of glass frame breathtaking rooftop and skyline vistas. The soaring living and entertaining space transitions seamlessly toward an open sky outlook.`;
    const kitchen = `A sun-drenched culinary kitchen features a waterfall stone island, custom cabinetry with concealed hardware, and professional-grade appliances.`;
    const beds = s.beds === 0
      ? `Rare high-floor studio enjoying sweeping views of the city skyline, abundant natural light, and refined finishes.`
      : `The serene bedroom suite features oversized windows, a large walk-in closet, and a spa-like stone bathroom with double vanity.`;
    const building = `A premier full-service building with doorman, landscaped roof terrace with grilling stations, resident lounge, and fitness center.`;
    return { hook, living, kitchen, beds, building };
  },

  // 18. Park-Adjacent Classic
  (p) => {
    const s = formatSpecs(p);
    const hook = `Positioned moments from the park, Residence${s.unit} at ${s.address} offers a distinguished ${s.bedText} in premier ${s.neighborhood}.`;
    const living = `Graceful proportions, high ceilings, and rich hardwood floors anchor the living room, which receives lovely natural light throughout the day.`;
    const kitchen = `The eat-in kitchen features marble counters, custom glass-front cabinetry, and premium appliances ideal for culinary enthusiasts.`;
    const beds = s.beds === 0
      ? `A gracious entry foyer with two coat closets welcomes you into an expansive studio room with garden vistas.`
      : `The bedrooms are thoughtfully separated from the entertaining rooms, each offering great closet space and bright exposures.`;
    const building = `Distinguished pre-war building with 24-hour doorman, fitness center, bicycle room, and private storage.`;
    return { hook, living, kitchen, beds, building };
  },

  // 19. Polished Mid-Century Modern
  (p) => {
    const s = formatSpecs(p);
    const hook = `Reflecting celebrated mid-century aesthetics, Residence${s.unit} at ${s.address} is a sun-filled ${s.bedText} in thriving ${s.neighborhood}.`;
    const living = `Clean horizontal lines, terrazzo and blonde oak elements, and a wall of windows define the spacious open living and dining area.`;
    const kitchen = `The modernized kitchen features flat-panel walnut veneer cabinetry, quartz counters, and energy-efficient stainless steel appliances.`;
    const beds = s.beds === 0
      ? `An intuitive studio floor plan easily accommodates a queen bed, dining table, and dedicated workstation.`
      : `The bedroom offers sunny exposures, generous closet capacity, and a classic ceramic tile bathroom with modern chrome hardware.`;
    const building = `A well-maintained post-war cooperative featuring a 24-hour doorman, live-in superintendent, laundry facilities, and garage.`;
    return { hook, living, kitchen, beds, building };
  },

  // 20. Palatial Trophy Sanctuary
  (p) => {
    const s = formatSpecs(p);
    const hook = `Representing the pinnacle of New York residential luxury, Residence${s.unit} at ${s.address} is a monumental ${s.bedText} in iconic ${s.neighborhood}.`;
    const living = `Soaring ceilings and dramatic floor-to-ceiling glass frame breathtaking 360-degree vistas. The double-width grand salon is tailored for world-class entertaining.`;
    const kitchen = `The chef's kitchen features custom Smallbone millwork, book-matched quartzite surfaces, Sub-Zero refrigeration, and dual dishwashers.`;
    const beds = s.beds === 0
      ? `A peerless designer studio with sweeping cinematic skyline vistas and top-tier finishes throughout.`
      : `The primary sanctuary encompasses a private corner wing, dual dressing rooms, and a monumental marble bathroom with sculptural soaking tub.`;
    const building = `An internationally acclaimed white-glove tower offering bespoke concierge service, private restaurant, swimming pool, and private spa.`;
    return { hook, living, kitchen, beds, building };
  }
];

function generateDescription(prop, indexOverride = null) {
  const index = indexOverride !== null 
    ? Math.abs(indexOverride) % TEMPLATES.length
    : (parseInt(prop.id, 10) || 0) % TEMPLATES.length;

  const tpl = TEMPLATES[index](prop);

  const overview = `${tpl.hook}\n\n${tpl.living}\n\n${tpl.kitchen}\n\n${tpl.beds}\n\n${tpl.building}`;
  const frontend_overview = `${tpl.hook} ${tpl.living.split('.')[0]}.`;
  const tts_clean_overview = `${tpl.hook} ${tpl.living} ${tpl.kitchen} ${tpl.beds} ${tpl.building}`.replace(/\s+/g, ' ');
  const tts_clean_overview_html = `<p>${tpl.hook}</p><p>${tpl.living}</p><p>${tpl.kitchen}</p><p>${tpl.beds}</p><p>${tpl.building}</p>`;

  return {
    templateIndex: index + 1,
    overview,
    frontend_overview,
    tts_clean_overview,
    tts_clean_overview_html
  };
}

module.exports = {
  TEMPLATES,
  generateDescription
};
