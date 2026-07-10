import { MasterSpec, Bid, TribalNote } from "./types";

export const masterSpecs: MasterSpec[] = [
  {
    id: "spec-concrete",
    name: "Section 03300: Cast-In-Place Structural Concrete (IS 456 Aligned)",
    sectionCode: "03300",
    specText: `PROJECT MASTER SPECIFICATION - DIVISION 3 CONCRETE
SECTION 03300 - CAST-IN-PLACE CONCRETE (IS 456 & IS 10262 COMPLIANT)

PART 1 - GENERAL MANDATORY CLAUSES (INDIAN REGULATORY FRAMEWORK):
1.1 Daily Site Waste Cleanup and Debris Hauling:
    The subcontractor SHALL perform daily cleanup of all formwork scraps, surplus concrete wash, and chemical solvent drums. All slurry must be cleared and disposed of at approved municipal dumps. General contractor will NOT provide site clean-up labor. Slurry disposal must comply with MPCB/CPCB environmental bylaws.
1.2 Temporary Site Power & Lighting Hookups:
    Subcontractor must provide their own temporary generator sets (silent DG sets conforming to CPCB norms), distribution boards, and weather-proof safety illumination inside deep trenches.
1.3 Workmanship Structural Warranty:
    Provide a comprehensive 12-month workmanship and structural cracking warranty on all poured elements post-handover conforming to Indian Standard guidelines.
1.4 reinforcing steel Specification (TMT rebars):
    All steel reinforcement rebars MUST conform strictly to IS 1786 Grade Fe 500D or Fe 550D (minimum diameter 16mm). Standard mild framing steel or uncertified local rebar is NOT acceptable.
1.5 Extreme-Weather Curing & Temperature Probes:
    For pours conducted during hot summers (above 40 deg C) or cold conditions, water ponding curing or steam blankets with digital temperature tracking probes are required for 10 days post-pour.`,
    mandatoryRequirements: [
      "Daily Site Waste Cleanup and Debris Hauling",
      "Temporary Site Power & CPCB Silent DG Sets",
      "Workmanship Structural Warranty (12 months IS 456)",
      "Reinforcing Steel IS 1786 Grade Fe 500D (16mm min)",
      "Hot/Cold Weather Ponding Curing & Temperature Probes"
    ]
  },
  {
    id: "spec-electrical",
    name: "Section 16000: High-Voltage Electrical Systems (IS 732 Aligned)",
    sectionCode: "16000",
    specText: `PROJECT MASTER SPECIFICATION - DIVISION 16 ELECTRICAL
SECTION 16000 - ELECTRICAL INFRASTRUCTURE AND MAIN ROUTING (IS 732 & IS 3043)

PART 1 - GENERAL MANDATORY CLAUSES (INDIAN ELECTRICAL AUTHORITY RULES):
1.1 Site Power Distribution and Transformers:
    Subcontractor must provision temporary step-down transformer units (11kV to 415V/240V) and certified power distribution boards for other trades.
1.2 Certified CEA Warning Signage and Earthing Pits:
    Install professional high-voltage warning placards as per Central Electricity Authority (CEA) guidelines, safety fencing, rubber mats, and triple plate earthing pits conforming to IS 3043 around all live panel boards.
1.3 GC Milestone Compliance Billing & Mobilization Cap:
    In accordance with Indian procurement norms, advance mobilization deposits are strictly capped at 10% value. Remaining billings are paid ONLY post milestone sign-off.
1.4 Copper Conductor Wire Standards:
    All conductors must be 99.9% oxygen-free copper. Aluminum core wire is strictly forbidden for main feeder lines.
1.5 Firestopping & Core-Sealing:
    Must seal all cable penetrations through firewall bulkheads using certified intumescent firestop sealants with minimum 2-hour rating (IS 12458 compliant).`,
    mandatoryRequirements: [
      "Site Power Distribution and Transformers",
      "Certified CEA Warning Signage & IS 3043 Earthing Pits",
      "Payment Compliance: Capped 10% Mobilization Deposit",
      "99.9% Oxygen-free Copper Wire (No Aluminum Main)",
      "Intumescent Firestopping (2-hour firewall rating IS 12458)"
    ]
  }
];

export const preloadedBids: Bid[] = [
  {
    id: "bid-ganga",
    subcontractor: "Ganga Concrete Ltd.",
    trade: "Cast-In-Place Concrete Work",
    date: "2026-07-01",
    totalValue: 2450000,
    auditStatus: "Pending",
    gstin: "27AAACG3948K1Z3",
    gstComplianceRate: 98,
    isMsme: true,
    msmeCategory: "Medium Enterprise",
    panNumber: "AAACG3948K",
    lineItems: [
      { name: "Excavation and trench prep for foundation base", price: 450000, scopeDetails: "Standard grading and digging up to 2m depth. Excavators and hydraulic jackhammers provided." },
      { name: "Pumping and placing structural concrete pour", price: 1400000, scopeDetails: "Supply of high-strength M25 mix. Standard transit mixers and concrete boom pump." },
      { name: "Rebar framing and standard steel insertion", price: 600000, scopeDetails: "Framing with standard structural bars. Rebars are 12mm thickness commercial grade structural framing steel." }
    ],
    rawText: `PROPOSAL FOR FOUNDATION WORKS - NAGPUR SMART INDUSTRIAL LOGISTICS PARK
SUBMITTED BY: GANGA CONCRETE LTD.
TOTAL VALUE: ₹24,50,000.00 (Rupees Twenty-Four Lakhs Fifty Thousand Only)
DATE: July 1, 2026

Scope of Works:
1. Trenching & grading up to 2m depth. Full excavation crews, diesel dumpers and machinery.
2. Concrete supply & boom pump placing of M25 structural concrete.
3. Supply and installation of light framing steel rebars (12mm thickness commercial grade structural framing steel).
4. Laying jute curing bags for moisture insulation.

Exclusions / Terms of Service:
- Ganga Concrete assumes general contractor provides all daily site waste removal, aggregate scrap cleanup, and hauling of chemical cement slurry.
- Ganga Concrete expects temporary silent DG set power hookups and site lighting to be provided by GC.
- Pricing is final; any concrete cracks, settlement issues or remediation post-handover will be treated under a separate paid maintenance contract (no 12-month structural warranty included in this base rate).`
  },
  {
    id: "bid-standard",
    subcontractor: "Standard Electric Co.",
    trade: "Electrical Infrastructure",
    date: "2026-07-03",
    totalValue: 4850000,
    auditStatus: "Pending",
    gstin: "24AAACS1982A1Z5",
    gstComplianceRate: 84,
    isMsme: true,
    msmeCategory: "Small Enterprise",
    panNumber: "AAACS1982A",
    lineItems: [
      { name: "Site feeder cables & main terminal hookups", price: 2200000, scopeDetails: "Laying internal distribution conduits and heavy copper main feeder wires." },
      { name: "Electrical panel boards and circuit breakers", price: 1050000, scopeDetails: "Mounting main break panels and sub-panel boxes throughout levels 1-3." },
      { name: "Labor and certified staging technicians", price: 1600000, scopeDetails: "Journeyman electrician crew for conduits routing and termination. Pricing requires 40% upfront down-payment deposit before logistics begin." }
    ],
    rawText: `PROPOSAL FOR MAIN SUBSTATION INFRASTRUCTURE - MUMBAI TECH BAY STAGE-2
SUBMITTED BY: STANDARD ELECTRIC CO.
TOTAL VALUE: ₹48,50,000.00 (Rupees Forty-Eight Lakhs Fifty Thousand Only)
DATE: July 3, 2026

Detailed Scope:
- Main wiring routing using high-grade oxygen-free copper conduits conforming to building codes.
- Distribution panels, busbars, and safety circuit breakers for building core.
- Staging crew labor and licensing fees.

Contractual Terms & Exclusions:
- Standard Electric Co. requires an upfront 40% mobilization down-payment/advance deposit before dispatching materials to the site (for copper commodity hedging).
- Site transformers (11kV to 415V/240V step-down) and temporary power distribution to other trades must be supplied by the GC.
- CEA hazard signs, rubber safety mats, and earthing pits around live panel blocks are to be set up by GC safety teams.`
  },
  {
    id: "bid-bharat",
    subcontractor: "Bharat Security Systems",
    trade: "Special Systems / Security",
    date: "2026-07-05",
    totalValue: 880000,
    auditStatus: "Pending",
    gstin: "29AAACB1012P1Z0",
    gstComplianceRate: 100,
    isMsme: false,
    panNumber: "AAACB1012P",
    lineItems: [
      { name: "CCTV Camera network and fiber optics", price: 420000, scopeDetails: "IP Dome cameras, weather-proof, mounted along security perimeter." },
      { name: "Access control systems & maglocks", price: 260000, scopeDetails: "Card readers and electronic locks for 14 security checkpoints." },
      { name: "Central security server and software setup", price: 200000, scopeDetails: "Desktop server rack and client-side monitoring software installation." }
    ],
    rawText: `PROPOSAL FOR PERIMETER SECURITY - CHENNAI DATA RESORT
SUBMITTED BY: BHARAT SECURITY SYSTEMS
TOTAL VALUE: ₹8,80,000.00 (Rupees Eight Lakhs Eighty Thousand Only)

Scope:
- Supply 32 IP CCTV perimeter cameras.
- Fire-rated fiber optic cabling inside main shafts.
- Maglocks on 14 card-reader doors.
- Full 12-month systems integration warranty on all electronics.
- Daily cleaning of security cabling debris included.`
  }
];

export const preloadedTribalNotes: TribalNote[] = [
  {
    id: "tribal-ganga",
    subcontractor: "Ganga Concrete Ltd.",
    pmName: "Harish Kumar (Sr. PM)",
    timestamp: "2026-06-15T14:30:00Z",
    rawText: "Ganga Concrete does good pouring, but they are notorious for ignoring site waste. Last year at the Nagpur warehouse, they left concrete slurry washed into the drainage trenches, and we got fined ₹1,50,000 by environmental enforcement. They also delayed our foundation pour by 6 days because their transit mixers were stuck in municipal traffic, but they refused to absorb the overtime cost. Kept disputing our schedule logs.",
    reliability: 3.5,
    performance: 4.0,
    pricing: 2.5,
    summary: "High workmanship quality but notable scheduling friction. Extremely poor site cleaning habits; left concrete slurry washes on Nagpur project causing MPCB environmental fines. Aggressive change order disputation."
  },
  {
    id: "tribal-standard",
    subcontractor: "Standard Electric Co.",
    pmName: "Sanjay Patel (Field Superintendent)",
    timestamp: "2026-06-20T09:15:00Z",
    rawText: "Standard Electric is reliable on schedules and their foreman is smart. But watch their billings like a hawk. They tried to demand an unapproved 40% mobilization deposit on the Mumbai sea-link project, claiming it was for copper hedging. We fought them for a month. Once on site, their work was excellent, but they didn't put up CEA electrical safety barriers or earth pits—we had to purchase safety fences ourselves because of a safety audit warning.",
    reliability: 4.5,
    performance: 4.5,
    pricing: 3.0,
    summary: "Top-tier schedule compliance and craftsmanship. Highly rigid billing demands, including unapproved upfront mobilization payment request. Safety posture is lax; GC had to buy safety fences and insulation panels."
  }
];

