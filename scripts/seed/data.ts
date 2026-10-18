export const petitioners = [{ id: "ngo-a", env: "ORG_NGO_A_PRIVATE_KEY" }, { id: "ngo-b", env: "ORG_NGO_B_PRIVATE_KEY" }] as const;
export const organisations = [{ id: "court", env: "ORG_MUNICIPAL_PRIVATE_KEY", name: "High Court of Vindhya Pradesh", role: "court", court: "VPHC", about: "Synthetic demonstration court." }] as const;

export const cases = [
  {
    "id": "r3-1",
    "title": "Untreated effluent discharge into Kesar lake from Ward 22 storm drains",
    "petitioner": "ngo-b",
    "state": "under-review",
    "extension": false,
    "body": "## Facts\n\n1. Three storm water drains in Ward 22 (at Lal Kuan, Sabzi Mandi and the Gandhi Nagar culvert) carry untreated sewage and dyeing effluent into Kesar lake throughout the year, not only during rain.\n2. Kesar lake is the only open water body in east Ranipur and supplies two municipal tube well fields through recharge.\n3. The petitioner collected grab samples at each outfall on 12 and 26 September 2026 and had them tested at an accredited laboratory.\n\n| Outfall | BOD (mg/L) | COD (mg/L) | Faecal coliform (MPN/100 mL) |\n|---|---:|---:|---:|\n| Lal Kuan | 148 | 412 | 92,000 |\n| Sabzi Mandi | 121 | 356 | 54,000 |\n| Gandhi Nagar culvert | 187 | 530 | 1,60,000 |\n\nThe standard for discharge into inland surface water is 30 mg/L BOD and 250 mg/L COD.\n\n## Grounds\n\n- Discharge of sewage into a lake without treatment violates section 24 of the Water (Prevention and Control of Pollution) Act, 1974.\n- The right to clean water is part of the right to life under Article 21 of the Constitution.\n- The Municipal Corporation's own 2024 drainage plan lists interception of these drains as a priority, with no work begun.\n\n> No person shall knowingly cause or permit any poisonous, noxious or polluting matter … to enter … into any stream or well or sewer or on land.\n\n## Prayer for relief\n\n1. Direct Ranipur Municipal Corporation to intercept the three outfalls and divert flow to the Kesar sewage treatment plant within 90 days.\n2. Direct the State Pollution Control Board to sample the outfalls monthly and publish the results.\n3. Pass any other order this Court finds fit.",
    "decisionReason": null,
    "extensionReason": null
  },
  {
    "id": "r3-2",
    "title": "Open burning of mixed municipal waste at the Bhatgaon landfill site",
    "petitioner": "ngo-a",
    "state": "under-review",
    "extension": true,
    "body": "## Facts\n\nThe Bhatgaon landfill receives about 640 tonnes of unsegregated waste a day from Ranipur. Since March 2026 the waste has been set on fire on most nights, and smoke covers Bhatgaon, Kesar Colony and the Government Girls Inter College.\n\n### Air quality near the site\n\n| Date (2026) | PM2.5 (µg/m³) | PM10 (µg/m³) | Station |\n|---|---:|---:|---|\n| 2 September | 286 | 412 | Bhatgaon (portable) |\n| 6 September | 311 | 455 | Bhatgaon (portable) |\n| 9 September | 248 | 390 | Kesar Colony |\n\nThe 24 hour national standard is 60 µg/m³ for PM2.5 and 100 µg/m³ for PM10.\n\n## Grounds\n\n- Rule 15 of the Solid Waste Management Rules, 2016 requires the local body to segregate waste and to stop open burning.\n- The Corporation has no working fire watch at the site and no boundary wall on the eastern side.\n- Residents' right to life under Article 21 includes the right to breathe clean air.\n\n> The local authorities shall … not allow open burning of waste.\n\n## Prayer for relief\n\n1. Direct the Corporation to station fire tenders at the site at night until burning stops.\n2. Direct segregation at source in all wards within 6 months, with monthly compliance reports.\n3. Direct the State Pollution Control Board to run a continuous air quality monitor at Bhatgaon.",
    "decisionReason": null,
    "extensionReason": "The Corporation has filed an interim affidavit stating that **fire tenders are stationed at the site** from 2 October. A status report on segregation at source is awaited.\n\nReview extended to **21 October 2026** to consider that report."
  },
  {
    "id": "r3-3",
    "title": "Contaminated piped water supply in Wards 14 to 19, Ranipur",
    "petitioner": "ngo-a",
    "state": "accepted",
    "extension": false,
    "body": "## Facts\n\nSince July 2026, households in Wards 14 to 19 have received discoloured and foul smelling water through the municipal pipeline. The ward health centres recorded 412 cases of acute diarrhoea in August, against 96 in August 2025.\n\n| Ward | Samples tested | Faecal coliform present |\n|---|---:|---:|\n| 14 | 3 | 2 |\n| 15 | 3 | 3 |\n| 16 | 3 | 1 |\n| 17 | 3 | 2 |\n| 18 | 3 | 2 |\n| 19 | 3 | 1 |\n\n## Grounds\n\n- Supply of potable water is a core duty of the State under Article 47 and part of the right to life under Article 21.\n- The Moti Bagh feeder main runs through an open drain for 300 m, where the leaks were found.\n\n## Prayer for relief\n\n1. Direct immediate safe water supply by tanker to the affected wards.\n2. Direct repair of the Moti Bagh feeder main within 30 days.\n3. Direct publication of daily water quality results.",
    "decisionReason": "## Order\n\nThe petition is **admitted**. The water quality reports placed on record show faecal contamination in 11 of 18 samples. The respondents do not dispute them.\n\nInterim directions:\n\n1. The Department of Urban Water Supply shall supply safe drinking water by tanker to Wards 14 to 19 from 28 September 2026 until the pipeline is repaired.\n2. The Department shall replace the corroded section of the Moti Bagh feeder main and file a compliance report within 4 weeks.\n3. Results of daily chlorine residual tests shall be published ward wise.\n\nList for compliance on **6 November 2026**.",
    "extensionReason": null
  },
  {
    "id": "r3-4",
    "title": "Footpath encroachment in school zones, Civil Lines",
    "petitioner": "ngo-b",
    "state": "accepted",
    "extension": false,
    "body": "## Facts\n\nFootpaths outside five schools in Civil Lines are occupied by parked vehicles, shop extensions and construction material. Children walk on the carriageway at opening and closing time.\n\n- St. Anne's Convent, Civil Lines\n- Government Inter College No. 2\n- Kendriya Vidyalaya, Cantonment Road\n- Saraswati Shishu Mandir\n- Municipal Primary School, Hospital Road\n\n## Prayer for relief\n\n1. Direct removal of encroachments within 200 m of each school.\n2. Direct traffic wardens at school timings.",
    "decisionReason": "The petition is **allowed**.\n\n1. The Corporation shall clear the footpaths within 200 m of the five schools named in the petition within 3 weeks.\n2. Traffic police shall post wardens at school opening and closing times.\n3. A joint inspection report shall be filed by **15 October 2026**.",
    "extensionReason": null
  },
  {
    "id": "r3-5",
    "title": "Closure of the Station Road weekly haat without notice",
    "petitioner": "ngo-b",
    "state": "rejected",
    "extension": false,
    "body": "## Facts\n\nThe Station Road weekly haat has run every Thursday for over 40 years. About 180 vendors, most of them women selling vegetables and handloom, trade there.\n\nOn 14 August 2026 the Corporation fenced the ground and closed the haat without a written order or notice to the vendors.\n\n## Grounds\n\n- Vendors were not given notice before relocation.\n- No alternative site was offered.\n\n## Prayer for relief\n\n1. Quash the closure and reopen the haat.\n2. Direct the Corporation to consult the town vending committee before any relocation.",
    "decisionReason": "The petition is **dismissed** at the admission stage.\n\nThe closure order concerns the relocation of identified street vendors. The Street Vendors (Protection of Livelihood and Regulation of Street Vending) Act, 2014 provides a grievance redressal committee for exactly this dispute, and the petitioner has not approached it.\n\n> This dismissal does not decide the merits. The petitioner is free to approach the committee, which shall decide within 30 days.",
    "extensionReason": null
  },
  {
    "id": "r3-6",
    "title": "Tanker water pricing during the summer shortage",
    "petitioner": "ngo-a",
    "state": "rejected",
    "extension": false,
    "body": "## Facts\n\nDuring the June to August 2026 shortage, private tankers charged between ₹1,800 and ₹3,200 for 6,000 litres in Wards 3 to 9, against ₹650 fixed by the district administration in 2024.\n\n## Prayer for relief\n\n1. Direct enforcement of the notified tanker rate.\n2. Direct the Corporation to run its own tankers in the affected wards.",
    "decisionReason": "The petition is **dismissed as infructuous**.\n\nThe monsoon reached Ranipur on 28 August 2026 and piped supply has been restored in all wards. Private tanker supply has stopped, so no direction on tanker prices can be given now.\n\nThe petitioner may approach this Court again if the shortage recurs next summer.",
    "extensionReason": null
  },
  {
    "id": "r3-7",
    "title": "Non-functional street lighting at the Station Road underpass",
    "petitioner": "ngo-a",
    "state": "expired",
    "extension": false,
    "body": "## Facts\n\nThe Station Road railway underpass is the only pedestrian route between Ranipur railway station and the bus stand. All 14 light fittings inside the underpass have been dark since June 2026.\n\n- Complaints were filed on the municipal grievance portal on 3 June, 21 July and 30 August 2026. Each was closed as \"resolved\" without repair.\n- Two chain snatching incidents in the underpass were reported to Kotwali police station in August 2026.\n- Women commuters from the night shift at the textile units now walk an extra 1.8 km around the level crossing.\n\n## Grounds\n\nSafe passage on a public road is part of the right to life and personal liberty under Article 21. Street lighting is an obligatory function of the Corporation under the State Municipal Corporations Act.\n\n## Prayer for relief\n\n1. Direct the Corporation to restore all lighting in the underpass within 7 days.\n2. Direct quarterly inspection of underpass lighting, with the report placed on the Corporation website.",
    "decisionReason": null,
    "extensionReason": null
  },
  {
    "id": "r3-8",
    "title": "Groundwater extraction permits near Kesar lake",
    "petitioner": "ngo-b",
    "state": "expired",
    "extension": false,
    "body": "## Facts\n\nBetween January and July 2026 the district groundwater cell issued 23 commercial extraction permits within 1 km of Kesar lake. The lake level has fallen 2.4 m below its average for September.\n\n- 17 of the permits were issued to packaged drinking water units.\n- None of the permits records a hydrogeological study, which the State Groundwater Rules require for an over exploited block.\n\n## Prayer for relief\n\n1. Suspend the 23 permits pending a hydrogeological study.\n2. Direct the groundwater cell to publish all permits for the block with their sanctioned volumes.",
    "decisionReason": null,
    "extensionReason": null
  }
];
