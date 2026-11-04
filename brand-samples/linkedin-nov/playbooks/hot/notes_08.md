# Notes 08: Google Cloud London (europe-west2) outage and UK cloud concentration risk (researched 4 Nov 2026)

## Incident (20 Oct 2026)
- Google Service Health incident Xs2XTHzAVC9YnafnPyzj, "Multiple services were experiencing issues in the europe-west2 region." Start 19 Oct 23:00 PDT (07:00 BST 20 Oct), end 20 Oct 05:08 PDT (13:08 BST); final report: 6h08m (preliminary said 6h10m, end 05:10). https://status.cloud.google.com/incidents/Xs2XTHzAVC9YnafnPyzj
- Preliminary report 22 Oct: power grid disruption at datacenter facility hosting europe-west2-b; switch to UPS; primary and backup PLCs failed to start generators; batteries depleted; servers, storage, network lost power. Workloads in europe-west2-a and -c also hit: "instantaneous demand surges on unimpacted compute capacity" and "synchronous control-plane validation dependencies across zonal boundaries". Repost: https://github.com/SecOpsNews/news/issues/75417
- Final report 27 Oct: PLC undervoltage sensing inputs wired upstream of isolated utility feed B breaker; PLC logic did not verify undervoltage plus breaker position; utility feed A cable fault. Actions: PLC validation at all similar global sites by 15 Nov; maintenance freeze at similar sites; EOP updated; automated alert-to-communication mechanism; "require customers to provision failover or cross-zone recovery resources if needed". Report does not name facility operator.
- "Third-party facility": Google statement quoted by AFP: "We have resolved a disruption to Google Cloud services at a third-party facility in our europe-west2 cloud region". Start 0608 GMT, most services normal 1210 GMT. Lloyds and HSBC confirmed customer issues. https://www.enca.com/business/power-outage-hits-google-cloud-services-disrupting-uk-banks
- The Register 20 Oct (5304084, 5304160): start 0608 UTC; zone b; no workaround; "migrate ... to another available location"; 14:03 mitigated for most customers; very small number still affected later; Downdetector: Lloyds, HSBC, Royal Mail, Rightmove, DPD, BT, Screwfix, Revolut. Academic estimate of 38 services.
- PA via Yahoo 20 Oct: HMCTS cloud video platform down; Revolut card payments, transfers, cash withdrawals, sign-in; >1,500 Downdetector reports; "all our customers' money and data are safe"; Halifax aware; Which? advice (backup card, cash). https://uk.news.yahoo.com/banks-courts-affected-disruption-google-114059868.html
- Irish Times 20 Oct: Revolut login, transfers, card payments, ATM; courts video platform; Google: "A power event caused an outage within europe-west2-b zone."
- City AM 20 Oct: FCA "aware of an incident affecting services provided by Google"; "People need to be able to access their money and make payments." Treasury Committee chair wrote to BoE Governor and FCA CEO; initial response by 4 Nov, full in three months. Barclays also reported problems; Downdetector spikes NHS England.

## Regulation
- HM Treasury 10 Jul 2026: CTP designations of Microsoft Ireland Operations Ltd, Google Cloud EMEA Ltd, AWS EMEA SARL, Oracle Corporation UK Ltd; effective 13 Jul 2026; joint BoE/PRA/FCA oversight of systemic services to finance only. https://www.gov.uk/government/news/uk-financial-system-strengthened-with-new-safeguards-for-major-technology-providers
- PS16/24 (12 Nov 2024): rules from 1 Jan 2025, apply on designation; incident reporting, interim self-assessment within 3 months, scenario testing; firms remain accountable.
- Google docs: "Google recommends deploying applications across multiple zones and multiple regions."

## Left out / unverified
- Name and operator of the facility (not disclosed).
- Exact start of power disruption before 07:00 BST (one secondary source says 22:53 PDT; not confirmed).
- Precise number of affected Google products (secondary sources say 35, 38 or 41); used "more than 30".
- Revolut restoration time and "seven countries" claim; NHS England and Spotify impact (only Downdetector/aggregators).
- Treasury Committee letter contents beyond press summary (parliament.uk page blocked); regulator replies not yet published.
- European regulators querying Google (US News/Reuters page unavailable).
- Computer Weekly detail on generators (blocked; Google's report used instead).
