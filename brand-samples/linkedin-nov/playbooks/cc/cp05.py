from cckit import CCBook, S


def build():
    b = CCBook("Ready for Martyn's Law", 5, "hub", "Hospitality", "7 December 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "A practical playbook for hotels, pubs, bars, restaurants and venues: what Martyn's Law will require, how every shift protects guests and staff on the worst night, and how to be ready before the festive season peaks."
    b.art_cover("Crisis playbook · Hospitality", "Ready for", "Martyn's Law.",
        "Evacuate, invacuate, lock down and tell everyone on site, fast. A practical playbook for hotels, bars, pubs, restaurants and venues, written for the busiest weeks of the year.")
    b.contents()

    b.mark("", "Foreword")
    b.foreword("In a busy bar or hotel, the first minutes belong to the people on shift.", [
        f"On the night of the London Bridge and Borough Market attack in June 2017, the attackers moved through a restaurant courtyard, bars and a restaurant on Stoney Street. The Chief Coroner found that all eight people who died did so within 15 minutes of the attack beginning.{R(10)} In the City Room at Manchester Arena a few weeks earlier, a concern raised by a member of the public did not reach anyone who could act on it, partly because a radio channel was busy.{R(8)}",
        f"Martyn's Law, the Terrorism (Protection of Premises) Act 2025, is named after Martyn Hett, one of the 22 people killed at Manchester Arena.{R(6,8)} It received Royal Assent on 3 April 2025, and the Security Industry Authority expects it to come into force in spring 2027.{R(1,6)} Pubs, bars, restaurants, cafés, hotels and nightclubs where 200 or more people can be expected at the same time will need procedures to evacuate, invacuate, lock down and communicate with everyone on site.{R(1,2,5)}",
        "This playbook is for the people who will make that work on a Saturday night in December: owners, general managers, duty managers, security leads and operations teams. It covers the law as enacted, the roles each shift needs, how to reach guests and staff in minutes, the other emergencies that are far more likely, and a dated plan. The companion intelligence report sets out the evidence in full."])

    b.mark("", "Introduction")
    b.intro("Introduction", "Three things protect people on the worst night.", "Hospitality venues are busy, noisy, open late and staffed by people on different shifts, many of them new. The venues that cope best are not the ones with the thickest plan. They are the ones where every shift knows who decides, what to do and how to tell everyone fast.",
        [("owner", "One person decides", "Every shift has a named duty manager who can declare an evacuation, invacuation or lockdown without waiting for permission, and everyone knows who that is tonight."),
         ("bell", "Everyone hears it at once", "A code phrase, a radio call and an alert to every phone, so the kitchen, the bedrooms and the smoking area hear the same instruction within a minute."),
         ("shield", "Plans people actually know", "Short procedures, briefed at induction and walked through on the late shift, not a binder in the office that nobody has opened.")])
    b.statement("A plan nobody on shift knows is not a plan.", f"The Manchester Arena Inquiry found that on the night, plans \"were not known by everyone who should have known about them\".{R(9)} Martyn's Law asks hospitality to close that gap before the law starts, not after.", "Introduction")

    # PART 01
    b.mark("01", "Know the duty")
    b.opener("01", "Know the<br>duty.", "What the Act requires of hotels, bars, pubs, restaurants and venues, the four procedures, a severity scale every shift can use and how incidents escalate.", [("01", "What the law says, exactly"), ("02", "Four procedures for every venue"), ("03", "A hospitality severity ladder"), ("04", "Escalation from the shift to head office")])
    b.essay("Know the duty", "What Martyn's Law asks of hospitality", [
        f"The Terrorism (Protection of Premises) Act 2025 received Royal Assent on 3 April 2025. The Home Office expects an implementation period of at least 24 months, and there is no legal requirement to comply until the duties come into force.{R(1)} The SIA, which will regulate the Act, says it expects the Act to come into force in spring 2027 and will confirm the exact date ahead of time.{R(6)}",
        f"The Act covers premises wholly or mainly used for purposes listed in Schedule 1. Statutory guidance says the \"food and drink\" use \"includes bars, pubs, restaurants, cafés and food halls\"; \"hotels etc\" also covers hostels and holiday parks; and nightclubs fall under entertainment and leisure.{R(5)}",
        f"Premises are in the standard tier where 200 to 799 people, including staff, can reasonably be expected to be present at the same time from time to time, and in the enhanced tier at 800 or more.{R(1)} Count the busiest realistic night, not a quiet Tuesday: a Christmas party, a New Year's Eve ticketed event or a wedding in the function suite.",
        f"Standard tier premises must notify the SIA and have, so far as is reasonably practicable, appropriate public protection procedures for evacuation, invacuation, lockdown and communication.{R(1,2)} The Home Office says these are simple, low-cost steps that do not require physical alterations or new equipment.{R(1)}",
        f"Enhanced tier premises must also have public protection measures covering monitoring, movement, physical safety and security, and the security of information; document compliance and give it to the SIA; and, where the responsible person is an organisation, designate a senior individual.{R(3)}",
        f"Penalties reach £10,000 for standard duty premises, and £18m or 5% of worldwide revenue for enhanced duty premises.{R(4)} Existing premises will have three months from commencement to notify the SIA, and changes must be notified within 28 days.{R(7)}"],
        "Know the duty", "Count the busiest realistic night, not a quiet Tuesday.")
    b.grid("Four procedures", "Evacuate, invacuate, lock down, communicate", f"The Act's four public protection procedures, as the Home Office defines them, and what each means in a hotel, bar or restaurant.{R(2)}", [
        ("power", "Evacuation", f"\"Getting people away from danger by moving them out of the premises.\" Know every exit, including through the kitchen, and where guests go once they are out.{R(2)}"),
        ("shield", "Invacuation", f"\"Moving people away from danger to a place within the premises.\" A function room, back corridor or cellar away from glass and the main doors.{R(2)}"),
        ("wrench", "Lockdown", f"\"Securing the premises to prevent individuals entering or leaving.\" Who locks which door, who drops the shutters, how fast, and on every shift.{R(2)}"),
        ("bell", "Communication", f"\"Ensuring information is provided to individuals at the premises.\" Staff, guests, bedrooms, terraces, toilets, contractors and the next shift.{R(2)}")], "Know the duty",
        f"The Home Office's own example is a 400-seat restaurant: two evacuation routes, nominated staff who lock doors and close shutters on the shift manager's instruction, and a short briefing for every new starter at induction.{R(2)}")
    b.severity("Severity", "A hospitality severity ladder for every shift", "Grade early and regrade often. If in doubt, go one level higher and step down later. The duty manager can declare any level.", [
        (1, "Critical", "An attack or credible threat at or next to the venue. A fire with people unaccounted for. A crowd crush or several casualties.", "Everyone on site, the on-call general manager, the head office crisis team and security leads. 999 first.", "Code phrase · radio · PA · SMS · voice"),
        (2, "Major", "A full evacuation on a busy night. A suspicious item. A serious assault or suspected spiking needing hospital. Power lost in service. Booking or payment systems down across sites.", "Duty manager, general manager, area or operations manager, IT or facilities on call.", "Radio · SMS · push · escalate after 10 min"),
        (3, "Moderate", "One site's tills or booking system failing. A guest collapse. An aggressive group removed. People trapped in a lift.", "Duty manager, general manager, service desk or facilities helpdesk.", "Radio · push · email"),
        (4, "Minor", "Suspicious behaviour reported and resolved. A near miss. A single device fault. Verbal abuse logged.", "Duty manager, recorded for the weekly review and trend reporting.", "App · email")], "Know the duty")
    b.escalation("Escalation", "How an incident climbs from the shift to head office", "Illustrative timings, to be set by each operator. Each level follows the severity ladder, and escalating never takes away the duty manager's authority to act at once on site.", [
        ("On-shift report", "Suspicious behaviour, an unattended bag, a near miss or a guest unwell. Severity 4.", "The duty manager, by radio, the code phrase or a one-touch alert with location where supported.", "Duty manager, after a quick check with the person who reported it.", "the item cannot be cleared within 5 minutes or anyone is at risk"),
        ("Venue incident", "A guest collapse, an aggressive group, a lift entrapment or one site's tills down. Severity 3.", "Every member of staff on shift, and the on-call general manager.", "Duty manager. The general manager is informed, not asked for permission.", "the venue evacuates, invacuates or locks down, or 999 is called for a threat"),
        ("Major venue incident", "Full evacuation, lockdown, a suspicious item or a serious assault. Severity 2.", "On-call general manager, operations manager, off-duty staff and the next shift.", "Duty manager on site. Operations manager decides on closing and the next shift.", "another venue is affected, anyone is seriously hurt, or media arrive"),
        ("Group crisis", "An attack or credible threat, several venues affected, or a group-wide system outage. Severity 1.", "Head office crisis team, every duty manager nearby, security lead and communications.", "Head office incident lead for closures, statements and bookings; duty managers for safety on site.", "")], "Know the duty",
        "Silence is a trigger too. If the person alerted at any level has not acknowledged within 5 minutes, the alert moves automatically to the next named person, and the gap is recorded for the review.")

    # PART 02
    b.mark("02", "On the night")
    b.opener("02", "On the<br>night.", "The first hour of the worst night, the roles every shift needs, how to reach everyone, and the emergencies that are far more likely.", [("01", "The first hour, and across three venues"), ("02", "Roles and the shift responsibility matrix"), ("03", "Reaching staff and guests fast"), ("04", "Other emergencies and messages ready to send"), ("05", "Tracking what is still outstanding")])
    b.firsthour("The first hour", "Saturday, 22:15: an attack outside", "Illustrative: a city-centre hotel with a bar and restaurant, around 550 people on site. Police instructions always come first.", [
        ("T+00:00", "Door team sees people running from the street", "Shouts of a knife attack nearby. The door supervisor radios the code phrase to the duty manager.", "Door supervisor", 1),
        ("T+00:01", "Lockdown and invacuation declared", "Doors locked, shutters down, music off. Guests moved away from glass to the function room.", "Duty manager", 1),
        ("T+00:02", "999 called, log started", "What, where, which direction, how many on site. Every decision from now is logged with a time.", "Reception", 1),
        ("T+00:03", "Every member of staff alerted", "Code phrase on the PA, radio and an alert to every phone. Staff reply when their area is safe, and replies are tracked by area.", "Duty manager", 1),
        ("T+00:06", "Guests in bedrooms told to stay put", "Room phones and text: stay in your room, lock the door, keep away from windows.", "Night manager", 2),
        ("T+00:12", "Everyone accounted for, escalated", "This is where it often goes wrong: smokers, agency staff and anyone outside. Chase every gap by name. On-call general manager and head office alerted.", "Shift managers", 2),
        ("T+01:00", "Police briefed, people cared for", "Floor plans and numbers to police. Guests and staff stay inside until police advise otherwise. Open actions move to a tracker with owners.", "General manager", 3)], "On the night")
    b.swimlane("Across venues", "One night, three venues and head office", "Illustrative: a group with a hotel, a bar on the same street and a restaurant 1 km away. Red cards show where a multi-venue response breaks down; police instructions always come first.",
        ["Hotel (on scene)", "Bar, same street", "Restaurant, 1 km away", "On-call operations manager", "Head office crisis team"],
        ["22:15", "22:17", "22:20", "22:30", "22:45", "23:30"], [
        (0, 0, "Door team radios the code phrase", "act"), (0, 0, "Duty manager declares lockdown", "dec"),
        (1, 0, "Shouting outside; staff unsure who decides", "risk"),
        (0, 1, "999 called; alert raised with location where supported", "act"), (3, 1, "Alerted; warns every nearby venue", "act"),
        (1, 1, "Duty manager locks doors and invacuates", "dec"),
        (0, 2, "Staff replies tracked area by area", "mon"), (1, 2, "Two agency staff missing from alert list", "risk"),
        (2, 2, "Staff first hear of it on social media", "risk"), (4, 2, "Crisis team activated, roles assigned", "act"),
        (0, 3, "Three staff unaccounted for, chased by name", "mon"), (2, 3, "Guests held inside, away from the cordon", "act"),
        (3, 3, "Decides restaurant takes no new guests", "dec"), (4, 3, "Live view of venues, replies and gaps", "mon"),
        (0, 4, "Guests in bedrooms told to stay put", "act"), (1, 4, "Agency staff found; head count complete", "act"),
        (2, 4, "Guests pushing to leave before police advice", "risk"), (3, 4, "Off-duty staff told not to travel in", "act"),
        (4, 4, "Decides to close all city venues tonight", "dec"),
        (0, 5, "Police briefed with floor plans and numbers", "act"), (2, 5, "Guests released only on police advice", "dec"),
        (3, 5, "Open actions handed to named owners", "mon"), (4, 5, "Holding statement out; bookings contacted", "act")], "On the night",
        "Three things decide how this night goes: every venue hears from the group, not from social media; every person on shift, agency staff included, is on the alert list; and each decision has one named owner who does not wait for someone more senior.")
    b.steps("Roles", "Who does what, on every shift", f"Name the people at the start of each shift. There is no statutory training requirement, but staff with a role in the procedures must know them and what they have to do.{R(2)}", [
        ("Duty manager: decides and declares", "Has authority to call evacuation, invacuation or lockdown at once, and to call 999. Does not wait for head office."),
        ("Door and security team: first eyes", "Spot and report early, lock doors, stop people entering, and give police clear information on arrival."),
        ("Bar and floor staff: move the room", "Each person owns a section: move guests from glass and doors, sweep toilets and terraces, and report when clear."),
        ("Reception or night manager: the hotel", "Calls 999, reaches guests in bedrooms and holds the guest list and today's function bookings."),
        ("Kitchen and back of house: the rear", "Secure the back doors and delivery yard, cut gas if instructed, and know which rooms can be used as safe areas."),
        ("Communicator: who has heard", "Sends the alert, tracks who has replied and chases the rest, and logs who was told what and when.")], "On the night")
    b.raci("Shift matrix", "Shift responsibility matrix", "Who does what in a lockdown, invacuation or evacuation, by shift role. Write tonight's names against each column at the start of the shift.",
        ["Duty manager", "Supervisor", "Door and security", "Front of house", "Kitchen", "Head office"], [
        ("Spot and report a threat by code phrase or one-touch alert", ["A", "R", "R", "R", "R", ""]),
        ("Declare evacuation, invacuation or lockdown", ["A", "I", "C", "I", "I", "I"]),
        ("Call 999 and start the timed incident log", ["A", "R", "I", "R", "", "I"]),
        ("Lock front doors and stop people entering", ["A", "I", "R", "C", "", ""]),
        ("Secure rear doors, the delivery yard and gas", ["A", "I", "", "", "R", ""]),
        ("Move guests from glass and doors to the safe area", ["A", "R", "C", "R", "I", ""]),
        ("Reach guests in bedrooms, toilets and terraces", ["A", "R", "", "R", "", ""]),
        ("Alert all staff, track replies and chase the silent", ["A", "R", "I", "I", "I", "I"]),
        ("Head count of staff and guests by area", ["A", "R", "R", "R", "R", "I"]),
        ("Brief police on arrival with plans and numbers", ["A", "C", "R", "C", "", "I"]),
        ("Media, social media and tomorrow's bookings", ["C", "", "", "I", "", "A"])], "On the night",
        "In a smaller venue one person may hold several columns. What matters is that every row has a name tonight, and that the duty manager never waits for head office to act on safety.")
    b.flow("Communication", "Reaching guests and staff in minutes", "Noise, music, bedrooms, outdoor areas and staff on breaks make hospitality hard to reach. Use more than one route, and confirm who has heard.", [
        ("bell", "A code phrase everyone knows", "A neutral phrase on the PA or radio that tells staff what is happening without alarming guests. Change it if it leaks."),
        ("power", "Stop the music, light the room", "Music off and house lights up so announcements can be heard, unless lockdown means lights off on police advice."),
        ("transfer", "An alert to every phone", "One message to staff on duty by SMS, push and voice, with a reply to confirm. Chase anyone who does not answer."),
        ("eye", "Guests you cannot see", "Bedrooms, toilets, terraces, smoking areas and private dining rooms each need a named person or route."),
        ("owner", "People off site", f"The next shift, off-duty staff and families. Tell them not to come in, and keep updates on a schedule. Counter Terrorism Policing's public advice is RUN, HIDE, TELL.{R(13)}")], "On the night",
        f"At Manchester Arena, a steward without a radio passed on a concern; a colleague with one tried to report it but someone else was talking, and it went no further.{R(8)} Never rely on a single channel.")
    b.table("Guest communication", "Talking to guests: what to consider", "Guests do not know your code phrases, your layout or your staff. Plan how each group is reached, and agree what nobody says.", ["Guests", "How to reach them", "What to say, and what to avoid"], [
        ("In bars, restaurants and function rooms", "Music off, lights up. Staff in each section give the same short instruction face to face.", "Say what to do, not why: \"Please come with me to the back room now.\" Do not shout words that cause panic."),
        ("In bedrooms", "Room phone, a text to the mobile given at booking, and door knocks only where it is safe.", "\"Stay in your room, lock the door, keep away from windows. Next update by [time].\""),
        ("Who do not speak English", "Short translated lines in the languages your guests most often speak, plus showing the way.", "Short sentences and plain words. No idioms, and never the staff code phrase."),
        ("Who need help to move or to hear an alarm", "Ask at booking and check-in; name a member of staff for each guest on the shift.", "Tell them who is coming, where to wait and how they will be told it is safe."),
        ("Outside: terraces, smoking areas, queues", "Bring them in or move them away, as the duty manager decides. In lockdown the door team controls entry.", "\"Come inside now\" or \"Move away from the building\", with a clear direction."),
        ("Everyone, at every stage", "One approved message, repeated, with a time for the next update.", "Never guess the cause or casualties, name anyone involved or post on social media. Media get the holding line.")], "On the night", "52mm 1fr 1fr")
    b.table("Other emergencies", "The emergencies that are far more likely", "Terrorism is rare. Fire, medical emergencies, spiking, power and system failures are not. The same roles and alerts handle them all.", ["Emergency", "First action on site", "First action for managers"], [
        ("Fire alarm in a full venue", "Evacuate by the plan. Sweep sections and bedrooms. Do not let guests collect coats or go back in.", "Account for staff and guests from the booking and room lists. Meet the fire service with the plan."),
        ("Medical emergency", "Call 999, send for the defibrillator and a first aider, clear space and send someone to guide the ambulance.", "Look after witnesses and staff, record what happened and check first aid cover for the rest of the night."),
        ("Suspected spiking", f"Stay with the person, get help and call police or an ambulance if needed. Keep the drink if you can.", f"Report it, keep CCTV and brief door staff. Police received 6,732 reports in a year to April 2023.{R(11)}"),
        ("Power failure", "Emergency lighting check, stop cooking, keep exits clear, and decide quickly whether to evacuate.", "Call the supplier or facilities, plan for lifts, fridges, tills and door locks, and tell arriving guests."),
        ("Booking or payment systems down", f"Switch to the paper booking list and offline or cash procedure. Do not keep restarting terminals.", f"Find out whether it is an outage or an attack, and tell sites what still works. A 2022 cyber incident disrupted IHG's booking channels.{R(14)}"),
        ("Violence or disorder", "Make safe, call 999 if anyone is in danger, and do not detain. Staff safety first.", "Support the staff involved, keep CCTV and review staffing for the next nights.")], "On the night", "40mm 1fr 1fr")
    b.messages("Messages", "Six messages ready to send", "Short, specific and calm. Fill the brackets, never guess the cause, and always say when the next update will come.", [
        ("SMS", "Staff on duty", "LOCKDOWN at [venue]. Move guests away from doors and glass to [area]. Doors stay locked. Do not go outside. Reply 1 when your area is safe.", "Under 160 characters, so it arrives as one message."),
        ("SMS", "Hotel guests", "[Hotel]: police are dealing with an incident nearby. Please stay in your room, lock the door and keep away from windows. Next update by [22:45].", "Only to guests who have given a mobile number."),
        ("SMS", "Off-duty and next shift", "[Venue] is closed tonight due to an incident nearby. Do not travel in. Everyone on site is being looked after. Next update [08:00].", ""),
        ("Email", "Guests with bookings", "Because of an incident near [venue], we are closed this evening. Please do not travel to us. Your booking will be [moved or refunded] and we will contact you by [time].", "Send from the booking system so it reaches tonight's and tomorrow's bookings."),
        ("Email", "Suppliers and booking platforms", "Our booking and payment systems are offline while we investigate. Deliveries continue as booked. Do not act on any request to change bank details; call [known number].", "Attackers often follow an outage with fake payment requests."),
        ("Holding line", "Media", "We are aware of an incident near [venue] this evening. Our priority is the safety of our guests and team, and we are following police advice. We will share more when we can.", "")], "On the night")
    b.tracker("Outstanding actions", "Sunday, 11:00: what is still open", "Illustrative, the morning after the three-venue incident. Every action has one owner, a time and a way of checking it is done, so nothing depends on memory.", [
        ("Account for every member of staff at all three venues", "Operations manager", "Sat 22:45", "Done", "Replies on the alert, gaps called by name"),
        ("Updated holding statement agreed", "Head office comms", "Sun 09:00", "Done", "Approved version saved in the log"),
        ("Keep CCTV from all three venues for police", "Security lead", "Sun 09:00", "In progress", "Police reference recorded in the log"),
        ("Contact guests booked today at closed venues", "Reservations", "Sun 10:00", "Overdue", "Send report from the booking system"),
        ("Add the two missing agency staff to alert lists", "Operations manager", "Sun 10:00", "Overdue", "Test alert, reply received"),
        ("Welfare call to staff who saw the incident", "General manager", "Sun 12:00", "In progress", "Named list, each call logged"),
        ("Brief the next shift before any reopening", "Duty managers", "Sun 14:00", "Open", "Signed shift briefing record"),
        ("Decide whether the hotel bar reopens tonight", "Head office incident lead", "Sun 15:00", "Blocked", "Waiting for police to lift the cordon"),
        ("Notify the insurer and keep the timeline", "Finance", "Mon 12:00", "Open", "Insurer reference in the log")], "On the night",
        "Review the board at a fixed time, not when someone remembers. Overdue and blocked actions go to the head office incident lead, and the board becomes the starting point for the post-incident review.")

    # PART 03
    b.mark("03", "Ready for December")
    b.opener("03", "Ready for<br>December.", "What to do before the first Christmas party, two templates for every shift, a dated plan and a checklist.", [("01", "Festive season readiness"), ("02", "Shift briefing record"), ("03", "Area sweep and head count log"), ("04", "Week, month, quarter"), ("05", "Checklist")])
    b.steps("Festive readiness", "Six steps before the first Christmas party", "The weeks to New Year bring the biggest crowds, the most new staff and the longest nights. Finish these now.", [
        ("Count your peak nights", f"Work out how many people, including staff, can reasonably be expected on your busiest nights, function rooms and terraces included. It decides your tier.{R(1,5)}"),
        ("Name the duty manager for every night", "Publish who decides on each shift until 2 January, with an on-call general manager behind them."),
        ("Brief every seasonal starter", f"A short induction on the four procedures and their role, as in the Home Office restaurant example.{R(2)}"),
        ("Walk through a lockdown", "Ten minutes with the late shift: which doors lock, where guests go, who checks the toilets and terrace."),
        ("Load every contact, including agency staff", "Mobile numbers for everyone on the rota, tested with a short alert that asks for a reply."),
        ("Plan for the outage", "Paper booking lists, an offline payment or cash procedure and a known number for every supplier.")], "Ready for December")
    b.form("Template", "Shift safety briefing record", "Complete at the start of every shift, in two minutes, and keep it with the incident log. Agency and new staff sign the same record as everyone else.",
        [("Date and shift", 1.1), ("Duty manager (decides)", 1.3), ("Code phrase briefed", 1), ("Safe area and lockdown doors", 1.6), ("New or agency staff briefed", 1.4), ("Test alert replies", 1), ("Signed", 0.9)], "Ready for December", rows=15,
        example=("Sat 20 Dec, late", "[Name], on-call GM [name]", "Yes, all sections", "Function room; front, side, yard doors", "3 agency, named, briefed", "41 of 42, 1 chased", "[Initials]"),
        note="Illustrative template. If the test alert does not reach everyone on the rota, fix the contact list before service starts, not after the incident.")
    b.form("Template", "Area sweep and head count log", "Used during an evacuation, invacuation or lockdown. Each area has one named person who sweeps it, counts who is there and reports back to the duty manager.",
        [("Area", 1.3), ("Swept by", 1.1), ("Time clear", 0.8), ("Guests in area", 0.9), ("Staff in area", 0.9), ("Needs help or missing", 1.6), ("Reported to and time", 1.2)], "Ready for December", rows=14,
        example=("Terrace and smoking area", "[Name], floor", "22:19", "14", "2", "1 guest in wheelchair, staff with her", "Duty manager 22:20"),
        note="Illustrative template. List every area before the shift starts: bars, toilets, terraces, function rooms, kitchen, cellar, bedrooms by floor. An area with no name is an area nobody checks.")
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure, and date every action.", ["When", "Actions", "Owner"], [
        ("This week", "Name a duty manager for every night to New Year. Brief the four procedures and the code phrase at every shift start.", "General manager"),
        ("This week", "Load every staff mobile, including agency and seasonal staff, and test an alert that asks for a reply.", "Operations manager"),
        ("This month", "Count peak numbers for every site and room. Decide your likely tier and who the responsible person is.", "Head of security, with legal"),
        ("This month", "Write one page per site: evacuation, invacuation, lockdown and communication. Walk through lockdown on a late shift.", "General manager"),
        ("This quarter", "Prepare for SIA notification within three months of commencement. Enhanced tier: designate a senior individual and start the compliance document.", "Chief operating officer"),
        ("This quarter", "Run a joint exercise with head office on an attack nearby and a system outage. Report gaps and dated fixes to the board.", "Head of security")], "Ready for December", "30mm 1fr 46mm")
    b.checklist("Checklist", "Are you ready for Martyn's Law?", "Tick what is true today. Anything blank is your next action.", [
        ("Peak numbers counted for every site", "Including staff, function rooms and outside areas."),
        ("Four procedures written for every site", "Evacuation, invacuation, lockdown and communication."),
        ("A named duty manager on every shift", "With authority to act at once."),
        ("Every staff member briefed on their role", "Including seasonal, agency and night staff."),
        ("One alert reaches everyone on duty", "With replies tracked and non-responders chased."),
        ("A way to reach guests in bedrooms", "And in toilets, terraces and private rooms."),
        ("Outage procedures for bookings and payments", "Tested on a real shift."),
        ("Ready to notify the SIA", "And, for enhanced tier, a senior individual named.")], "Ready for December")

    # PART 04
    b.mark("04", "Rehearse and review")
    b.opener("04", "Rehearse and<br>review.", "Three scenarios to rehearse, a tabletop exercise for a late shift, a post-incident review template and the questions to ask.", [("01", "Three scenarios"), ("02", "A tabletop exercise"), ("03", "Post-incident review"), ("04", "Questions for leaders")])
    b.usecase("Scenarios", "Three illustrative scenarios to rehearse", [
        ("shield", "City-centre bar and nightclub, 900 capacity", "01:00: a fight spills inside, then reports of a weapon outside", [("Where it goes wrong", "Music still playing, doors open, and staff waiting for someone senior to decide."), ("Who decides", "The duty manager declares lockdown; the door supervisor controls who comes in."), ("How it is monitored", "Each section replies when secure; silent sections are chased by name within minutes."), ("Rehearse", "A five-minute lockdown drill before opening.")]),
        ("owner", "Hotel, 140 bedrooms and a function suite", "21:30: a fire alarm during a 300-guest Christmas party", [("Where it goes wrong", "Party guests returning for coats, drivers blocking the fire lane and bedrooms missed."), ("Who decides", "The duty manager runs the evacuation; the night manager owns the bedrooms."), ("How it is monitored", "Area sweeps and the room list checked off at the assembly point."), ("Rehearse", "A walk-through with the events team and night porter.")]),
        ("laptop", "Restaurant group, 12 sites", "18:00 on the last Saturday before Christmas: bookings and payments fail at every site", [("Where it goes wrong", "Each manager calls IT separately and sites get different instructions."), ("Who decides", "The head office incident lead decides on paper and cash; each manager runs their site."), ("How it is monitored", "Every site acknowledges one instruction; head office sees who is trading."), ("Rehearse", "One site running on paper for an hour.")])], "Rehearse and review")
    b.exercise("Tabletop exercise", "Ninety minutes with the late shift", "An illustrative exercise to run in a quiet afternoon slot. Read each inject aloud, give the room three minutes, and record the answers and the gaps.", [
        ("Duration", "90 minutes, including a 20-minute debrief"), ("Participants", "Duty managers, a supervisor, door team lead, reception and head office operations"),
        ("Objective", "Test the lockdown decision, reaching every member of staff and guest, and the handover to head office"), ("Facilitator", "Head of security, or an outside facilitator who does not take part")], [
        ("00:00", "Friday, 21:40. During a 300-guest Christmas party, a bar supervisor reports an unattended bag in the function suite cloakroom.", "Who decides what happens next? What is the first instruction, on which channel, and who hears it?"),
        ("00:15", "The duty manager moves guests out of the suite. The usual assembly point is next to the outside wall of the cloakroom.", "Where do guests go instead? How do staff in other areas know the plan has changed?"),
        ("00:30", "Twelve of 40 staff have not replied to the alert, including four agency staff and the night porter.", "Who chases them, and how? Do we know their names and numbers tonight?"),
        ("00:45", "Guests in bedrooms above the suite are calling reception, and a video of the evacuation is spreading online.", "What do we tell guests in rooms? Who speaks for the venue, and what do staff post?"),
        ("01:00", "Police confirm the bag is lost property. The party organiser asks to carry on.", "Who decides to stand down? How is the stand-down sent, and what is recorded?"),
        ("01:15", "Monday. Head office asks for a timeline of the first fifteen minutes.", "Could we produce it from our records? What is missing, and who fixes it by when?")], "Rehearse and review",
        "Run it with the late shift as it really is, agency staff and new starters included. The answer \"I would ring the general manager\" is a finding: decide who acts without asking.")
    b.pir("Post-incident review", "Post-incident review template", "Hold it within a week, with the people who were on shift. The aim is to fix the system, not to blame the person. Use the incident log and the actions tracker as the record.", [
        ("What happened, and when", "The timeline from the first report to stand-down, taken from the log, not from memory."),
        ("How we found out", "Who spotted it, how it was reported and how long it took to reach the duty manager."),
        ("The decision", "Who declared what, and when. Did anyone wait for permission they did not need?"),
        ("Reaching staff", "How many replied, how fast, and who was missed: agency, breaks, off-site, new starters."),
        ("Reaching guests", "Bedrooms, toilets, terraces, other languages and guests who needed help."),
        ("Venues and head office", "How other venues and head office heard, and any conflicting instructions."),
        ("People affected", "Welfare of guests and staff, first aid given and the support offered afterwards."),
        ("Actions and checks", "Each fix with one owner and a date, and how the next drill will prove it works.")], "Rehearse and review")
    b.questions("For leaders", "Questions for your leadership team", "Ask them out loud. Vague answers are the finding.", [
        ("The duty", ["Which of our sites are likely to be standard tier, which enhanced, and who is the responsible person for each?", "Could every site evacuate, invacuate, lock down and communicate tonight, and when was it last practised?", "Who on tonight's rota can declare a lockdown without asking anyone?"]),
        ("The people", ["How long would it take to reach every member of staff on duty, and to know who had not replied?", "How would we reach guests in bedrooms, on terraces and in private dining rooms?", "Are our seasonal and agency staff briefed to the same standard as the regulars?"])], "Rehearse and review")
    b.glossary("Words worth knowing", [
        ("Martyn's Law", "The Terrorism (Protection of Premises) Act 2025, named after Martyn Hett, who was killed at Manchester Arena."),
        ("Responsible person", "The person or organisation in control of qualifying premises for the use that brings them into scope."),
        ("Standard tier", "Premises where 200 to 799 people, including staff, can reasonably be expected at the same time."),
        ("Enhanced tier", "Premises where 800 or more people can reasonably be expected at the same time."),
        ("Public protection procedures", "Actions staff can take if they suspect an attack: evacuation, invacuation, lockdown and communication."),
        ("Public protection measures", "Wider enhanced tier measures on monitoring, movement, physical security and information security."),
        ("Invacuation", "Moving people away from danger to a safer place inside the premises."),
        ("Lockdown", "Securing the premises to stop people entering or leaving."),
        ("Reasonably practicable", "Proportionate: weighing what a step achieves against its cost, time and difficulty."),
        ("Immediate vicinity", "The area close to the premises. There is no fixed distance."),
        ("SIA", "The Security Industry Authority, the regulator for Martyn's Law."),
        ("Senior individual", "The person an organisation must designate for enhanced tier premises."),
        ("Acknowledgement", "A recipient's confirmation that an alert has been read and acted on."),
        ("Holding line", "A short, accurate statement used while facts are still being established.")])
    b.platform("How the modules work together in a hospitality incident", "The three-venue night in this playbook, from the first alarm to the review. Each step is an outcome, not a feature.", [
        ("The door supervisor raises the alarm in one touch, with location where supported, so the duty manager knows within seconds.", "SOS"),
        ("Every member of staff on shift, agency staff included, gets the lockdown alert and replies when their area is safe.", "Ping"),
        ("The duty manager activates the incident, assigns roles by area and keeps one log shared with head office.", "Incident Manager"),
        ("Locking doors, sweeping toilets and terraces, reaching bedrooms and the head count become owned tasks that escalate if they stall.", "Task Manager"),
        ("Head office sees every venue, areas secured, staff accounted for and decisions waiting, without phoning each site.", "Control Centre"),
        ("A timestamped record of every alert, reply and decision is ready for the review, the insurer and the regulator.", "Audit & Reporting"),
        ("CRAiG helps the duty manager find information in the incident quickly, such as which areas have not confirmed they are secure.", "CRAiG")])

    b.mark("", "Sources")
    src = [
        "Home Office, Martyn's Law overarching factsheet, updated July 2026, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "Home Office, Standard duty requirements factsheet, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "Home Office, Enhanced duty requirements factsheet, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "Home Office, The regulator, sanctions and enforcement factsheet, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "Home Office, Statutory guidance, April 2026, https://www.gov.uk/government/publications/the-terrorism-protection-of-premises-act-2025/terrorism-protection-of-premises-act-2025-statutory-guidance",
        "Security Industry Authority, Understanding Martyn's Law and the SIA's role as regulator, 17 July 2026, https://www.gov.uk/guidance/understanding-martyns-law-and-the-sias-role-as-regulator",
        "Home Office, Notification requirement guidance, 14 July 2026, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-notification-requirement/terrorism-protection-of-premises-act-2025-notification-requirement-accessible",
        "Manchester Arena Inquiry, Volume 1 (HC 279), 17 June 2021, paras 1.52 to 1.57, https://assets.publishing.service.gov.uk/media/60cc659fe90e07438f7af765/CCS0321126370-002_MAI_Report_Volume_ONE_WebAccessible.pdf",
        "Manchester Arena Inquiry, Volume 2 (HC 757), 3 November 2022, para 21.7, https://www.gov.uk/government/publications/manchester-arena-inquiry-volume-2-emergency-response",
        "Chief Coroner, London Bridge and Borough Market PFD report, 1 November 2019, https://www.judiciary.uk/wp-content/uploads/2019/11/London-Bridge-Borough-Market-Terror-Attack-2019-0332.pdf",
        "Home Office, Understanding and tackling spiking, 19 December 2023, https://www.gov.uk/government/publications/understanding-and-tackling-spiking/report-understanding-and-tackling-spiking-accessible",
        "Crime and Policing Act 2026, section 134 (prospective), https://www.legislation.gov.uk/ukpga/2026/20/section/134",
        "Counter Terrorism Policing, RUN HIDE TELL guidance for the public, ProtectUK, https://www.protectuk.police.uk/advice-and-guidance/response/run-hide-tell",
        "TechCrunch, report on IHG's 6 September 2022 stock exchange filing, 7 September 2022, https://techcrunch.com/2022/09/07/ihg-hotels-outage-cyberattack/",
    ]
    used = set(order)
    src_used = [(k, t) for k, t in enumerate(src, 1) if k in used]
    assert len(src_used) == len(order), (sorted(order), len(src))
    items = sorted((order[k], t) for k, t in src_used)
    b.sources([(f"{n:02d}", t) for n, t in items], "Accessed November 2026. Martyn's Law duties are not yet in force; check GOV.UK and the SIA for the commencement date.")
    b.art_back("Every guest safe.<br>Every shift ready.", "Crises Control helps hotels, bars, restaurants and venues alert every member of staff in seconds, see who has replied, run the incident from one place and keep a full record for the regulator.", "Request a demo",
        next_title="Intelligence report No. 05 · The protect duty")
    return b
