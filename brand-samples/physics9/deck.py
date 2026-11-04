from kit import *

SLIDES = []
SECS = [("00", "Opening", "0–3"), ("01", "What is physics?", "3–7"), ("02", "Physical quantities and SI units", "7–13"), ("03", "Scalars and vectors", "13–17"),
        ("04", "Distance and displacement", "17–23"), ("05", "Speed and velocity", "23–30"), ("06", "Uniform and non-uniform motion", "30–35"),
        ("07", "Acceleration", "35–40"), ("08", "Equations of motion", "40–48"), ("09", "Force and Newton's laws", "48–57"), ("10", "Practice and recap", "57–60")]
SEC = {s[0]: s for s in SECS}

def S(sec, body, say, ask="", watch="", time="", label=""):
    n, name, mins = SEC[sec]
    SLIDES.append(dict(sec=sec, name=name, mins=label or f"Minutes {mins}", body=body, say=say, ask=ask, watch=watch, time=time))

def head(ey, title, lead=""):
    return f'<div class="ey">{ey}</div><h2 style="margin-top:18px">{title}</h2>' + (f'<p class="lead" style="margin-top:22px">{lead}</p>' if lead else "")

def ask(q, k="Ask the class"):
    return f'<div class="ask"><svg width="44" height="44" viewBox="0 0 44 44" style="flex:none;margin-top:4px">{circle(22,22,19,BLUE,2.5)}{tx(22,30,"?",24,BLUE,700)}</svg><div><div class="k">{k}</div><div class="q">{q}</div></div></div>'

def work(rows):
    return '<div class="work">' + "".join(f'<div class="l">{a}</div><div class="{"ans" if a == "Answer" else ""}">{b}</div>' for a, b in rows) + "</div>"

def vars_table(rows):
    return '<table class="v"><tr><th>Symbol</th><th>Means</th><th>SI unit</th></tr>' + "".join(f"<tr><td>{K(a)}</td><td>{b}</td><td>{c}</td></tr>" for a, b, c in rows) + "</table>"

# ============================================================ 00 OPENING
S("00", f'''<div style="position:absolute;left:150px;top:0;bottom:0;width:860px;display:flex;flex-direction:column;justify-content:center">
  <div class="ey">CBSE Class 9 · Physics · 60-minute lesson</div>
  <h1 style="font-size:104px;margin-top:26px">Motion<br>and force.</h1>
  <p class="lead" style="margin-top:34px;font-size:34px">Physics from the very first step: how things move, how we measure it, and why it happens.</p>
  <div style="margin-top:56px;display:flex;gap:14px;flex-wrap:wrap"><span class="tag">Units</span><span class="tag">Vectors</span><span class="tag">Speed and velocity</span><span class="tag">Acceleration</span><span class="tag">Newton's laws</span></div></div>
  <div style="position:absolute;right:120px;top:120px;width:760px">{hl("rocket-up", 760)}</div>''',
  "Welcome the class. Today is about the most visible part of physics: things moving. By the end, everyone will be able to describe any motion with numbers and explain what causes it.",
  "Before we start: what is the fastest thing you have seen move today?",
  "", "1 min", "Minute 0")

S("00", head("The plan", "Sixty minutes, ten small steps.") + '<div style="margin-top:56px;display:grid;grid-template-columns:repeat(2,1fr);gap:0 90px">' + "".join(
    f'<div style="display:grid;grid-template-columns:70px 1fr 150px;align-items:baseline;padding:19px 0;border-top:1.5px solid #E8E8ED"><span style="font-size:22px;font-weight:600;color:{BLUE}">{n}</span><span style="font-size:27px;font-weight:500">{nm}</span><span style="font-size:21px;color:{MUTE};text-align:right">{m} min</span></div>'
    for n, nm, m in SECS[1:]) + "</div>" + f'<p class="s" style="margin-top:40px">Aligned to CBSE Class 9 Science 2026–27 (NCERT <i>Exploration</i>: “Describing Motion Around Us” and “How Forces Affect Motion”). Units and vectors are taught as foundations.</p>',
  "Walk through the map in under a minute. Point out the pattern: we start with words, move to measuring, then to calculating, and finish with what causes motion.",
  "", "", "1 min", "Minute 1")

S("00", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("How we will learn", "Every idea gets the same four steps.")}
  <div style="margin-top:50px;display:flex;flex-direction:column;gap:26px">{"".join(f'<div style="display:flex;gap:26px;align-items:baseline"><span style="font-size:22px;font-weight:600;color:{BLUE};width:40px">{i+1:02d}</span><div><div style="font-size:30px;font-weight:600">{a}</div><div class="s" style="margin-top:4px">{b}</div></div></div>' for i, (a, b) in enumerate([("A simple definition", "In words you could explain to a friend."), ("An everyday example", "Cars, bicycles, balls and you."), ("A picture and a formula", "With every symbol and unit explained."), ("A worked problem", "Step by step, then you try one.")]))}</div></div>
  <div>{hl("push-moved", 820)}</div></div>''',
  "Set expectations: no one needs to be good at maths already. Every formula will be built from an everyday idea first.",
  "", "Some students believe physics is 'just formulas'. Stress that each formula is a sentence about the world written in short form.", "1 min", "Minute 2")

# ============================================================ 01 WHAT IS PHYSICS
icons = svg(1600, 300, "".join([
    bicycle(40, 250, 0.95), tx(145, 295, "Cycling to school", 22, SUB),
    car(400, 250, 1.0), tx(520, 295, "Braking a car", 22, SUB),
    ball(880, 190, 52) + ground(800, 960, 250) + arrow(950, 150, 1040, 110, BLUE, 3.5), tx(900, 295, "Bowling a ball", 22, SUB),
    rocket_icon(1300, 250, 1.6), tx(1300, 295, "Launching a rocket", 22, SUB)]))
S("01", head("01 · What is physics?", "Physics is the study of matter, energy, and how they interact.",
           "It explains how things move and why. The same few rules work for a bicycle, a cricket ball and a rocket.") + f'<div style="margin-top:70px">{icons}</div>',
  "Give the definition in one breath, then make it concrete: physics answers two questions about anything that moves. How is it moving? Why is it moving that way? Point at each picture and ask which question it raises.",
  "Which of these four would be hardest to stop, and why?",
  "Students often think physics is only about laboratories. Every picture here is something they do or see daily.", "2 min")

S("01", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Motion is everywhere", "Describing motion needs three things.")}
  <div style="margin-top:44px;display:flex;flex-direction:column;gap:22px">{"".join(f'<div class="card" style="padding:26px 32px"><div style="font-size:28px;font-weight:600">{a}</div><div class="s" style="margin-top:6px">{b}</div></div>' for a, b in [("A reference point", "Where are we measuring from? A school gate, a lamp post, the start line."), ("A measurement", "How far, how fast, how long, with a unit."), ("A direction", "Which way? East, up, towards the wall.")])}</div></div>
  <div><div style="margin-bottom:34px">{svg(780, 330, ln(40,250,740,250,LINE) + "".join(ln(60+i*85,242,60+i*85,258,LINE,2.5) for i in range(9)) + tx(60,295,"0 m",20,MUTE) + tx(400,295,"Reference point: school gate",20,BLUE,600) + ln(400,140,400,250,BLUE,2,"6 8") + car(450, 250, 0.9) + arrow(470, 110, 690, 110, BLUE, 4) + tx(580, 92, "moving away from the gate", 21, BLUE, 600))}</div>
  {ask("Is a student sitting at a desk moving? Think about the Earth.")}</div></div>''',
  "Motion only makes sense compared with something: a reference point. Use the car: it is moving relative to the school gate. Then ask the question on the slide.",
  "Is a student sitting at a desk moving? (Answer: relative to the classroom, no. Relative to the Sun, yes, because the Earth moves. Motion is relative.)",
  "Many students think motion is absolute. Address it here: whether something is moving depends on the reference point.", "2 min")

# ============================================================ 02 SI UNITS
S("02", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("02 · Physical quantities", "A measurement is a number <span class='b'>and</span> a unit.")}
  <div class="def" style="margin-top:44px"><span class="k">Definition</span>A <b>physical quantity</b> is anything we can measure, such as length, mass or time.</div>
  <div style="margin-top:40px;display:flex;gap:26px;align-items:center"><div class="card" style="padding:24px 34px;text-align:center"><div style="font-size:64px;font-weight:600;color:{LINE}">5</div><div class="s">means nothing</div></div>
  <div style="font-size:40px;color:{MUTE}">→</div><div class="card" style="padding:24px 34px;text-align:center;background:{TINT}"><div style="font-size:64px;font-weight:600;color:{BLUE}">5 m</div><div class="s">five metres</div></div></div></div>
  <div>{hl("loupe", 800)}</div></div>''',
  "Hold up a pencil. Ask 'how long is it?' If a student says '15', ask '15 what?' That is the whole point: a number without a unit is not a measurement.",
  "If I say my school is '2' from home, what could I mean? (2 km? 2 minutes? 2 bus stops?)",
  "Students drop units in answers. From today, every answer needs a unit, and marks depend on it in exams.", "1.5 min")

si = [("Length", "metre", "m"), ("Mass", "kilogram", "kg"), ("Time", "second", "s"), ("Electric current", "ampere", "A"), ("Temperature", "kelvin", "K"), ("Amount of substance", "mole", "mol"), ("Luminous intensity", "candela", "cd")]
S("02", head("The SI system", "Seven base units. Everything else is built from them.", "SI stands for the International System of Units, used by scientists in every country.") +
  '<div style="margin-top:44px;display:grid;grid-template-columns:1.25fr 1fr;gap:80px;align-items:start"><table class="v"><tr><th style="text-align:left">Quantity</th><th>Unit</th><th>Symbol</th></tr>' +
  "".join(f'<tr><td style="text-align:left;width:auto;font-weight:{600 if i < 3 else 400};{"color:"+BLUE if i < 3 else ""}">{a}</td><td>{b}</td><td style="font-weight:600">{c}</td></tr>' for i, (a, b, c) in enumerate(si)) +
  f'</table><div><div class="card"><div class="ey" style="font-size:17px">Today we need three</div><p class="p" style="margin-top:14px">Length in <b>metres</b>, mass in <b>kilograms</b> and time in <b>seconds</b>. Speed, acceleration and force are all built from these.</p></div>'
  f'<div class="warn" style="margin-top:26px"><b>Watch out:</b> the symbol for second is <b>s</b>, not "sec". Units named after people, like ampere, still use a small letter when written in full.</div></div></div>',
  "Do not ask students to memorise all seven today. Highlight the first three. Mention that the kilogram is the only base unit with a prefix built in.",
  "",
  "Common errors: writing 'Kg' or 'Sec', and mixing units such as km with seconds in one formula.", "1.5 min")

S("02", f'''<div class="grid2" style="align-items:start;margin-top:10px"><div>{head("Derived units and prefixes", "Bigger and smaller units.")}
  <table class="v" style="margin-top:40px"><tr><th style="text-align:left">Prefix</th><th>Symbol</th><th>Means</th></tr>
  {"".join(f'<tr><td style="text-align:left;width:auto">{a}</td><td>{b}</td><td>{c}</td></tr>' for a, b, c in [("kilo", "k", "× 1000"), ("centi", "c", "÷ 100"), ("milli", "m", "÷ 1000")])}</table>
  <p class="p" style="margin-top:34px">Speed is a <b>derived</b> quantity: distance ÷ time. Its SI unit is the <b>metre per second</b>, {K(r"\text{m/s}")} or {K(r"\text{m s}^{-1}")}.</p></div>
  <div><div class="card" style="background:{TINT}"><div class="ey" style="font-size:17px">The conversion you will use most</div>{E(r"1\ \text{km/h} = \frac{1000\ \text{m}}{3600\ \text{s}} = \frac{5}{18}\ \text{m/s}")}
  <p class="s" style="text-align:center">km/h to m/s: multiply by {K(r"\tfrac{5}{18}")}. &nbsp; m/s to km/h: multiply by {K(r"\tfrac{18}{5}")}.</p></div>
  <div style="margin-top:34px"><div class="ey" style="font-size:17px;color:{MUTE}">Worked example</div><div style="margin-top:16px">{work([("Question", "A car moves at 72 km/h. What is this in m/s?"), ("Formula", K(r"v\ (\text{m/s}) = v\ (\text{km/h}) \times \tfrac{5}{18}")), ("Solve", K(r"72 \times \tfrac{5}{18} = 4 \times 5")), ("Answer", K(r"20\ \text{m/s}"))])}</div></div></div></div>''',
  "Build the 5/18 factor on the board: 1 km is 1000 m, 1 hour is 3600 s, so 1000/3600 simplifies to 5/18. Students remember a factor they derived far better than one they were told.",
  "Quick: what is 36 km/h in m/s? (10 m/s.)",
  "Students multiply by 18/5 when they should multiply by 5/18. Tip: m/s numbers are always smaller than the same speed in km/h.", "2 min")

S("02", '<div style="height:100%;display:flex;flex-direction:column;justify-content:center;max-width:1300px">' + head("Your turn", "Two quick conversions.") + '<div style="margin-top:56px;display:flex;flex-direction:column;gap:28px">' +
  ask(f"A cyclist rides at {K(r'18\ \text{km/h}')}. What is that in m/s?", "Question 1") + ask(f"A cheetah can run at about {K(r'30\ \text{m/s}')}. What is that in km/h?", "Question 2") + "</div></div>",
  "Give 60 seconds. Take answers from two students and ask them to say the factor they used.",
  "Answers: 18 × 5/18 = 5 m/s. 30 × 18/5 = 108 km/h.",
  "", "1 min")

# ============================================================ 03 SCALARS AND VECTORS
compass = svg(560, 420, circle(280, 210, 150, LINE, 2) + tx(280, 42, "N", 24, SUB, 600) + tx(280, 395, "S", 24, SUB, 600) + tx(458, 218, "E", 24, SUB, 600) + tx(102, 218, "W", 24, SUB, 600)
              + arrow(280, 210, 280, 92, BLUE, 6) + circle(280, 210, 7, INK, 0, INK) + tx(312, 150, "5 km north", 24, BLUE, 600, "start"))
S("03", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("03 · Scalars and vectors", "Some quantities need a direction.")}
  <div class="def" style="margin-top:44px"><span class="k">Scalar</span>Has <b>size only</b>. Mass, time, distance, speed, temperature.</div>
  <div class="def" style="margin-top:28px"><span class="k">Vector</span>Has <b>size and direction</b>. Displacement, velocity, acceleration, force.</div>
  <p class="s" style="margin-top:34px">We draw a vector as an arrow: its length shows the size, its head shows the direction.</p></div>
  <div style="text-align:center">{compass}<p class="s" style="margin-top:8px">"5 km" is a scalar. "5 km north" is a vector.</p></div></div>''',
  "Use directions to a friend's house: '5 km' is not enough to find it, '5 km north' is. That is the difference between a scalar and a vector.",
  "",
  "Students think vectors are only arrows on paper. Stress that the direction is part of the quantity itself.", "2 min")

S("03", head("Sort them", "Scalar or vector?") + '<div style="margin-top:50px;display:grid;grid-template-columns:repeat(4,1fr);gap:22px">' +
  "".join(f'<div class="card" style="text-align:center;padding:34px 20px"><div style="font-size:30px;font-weight:600">{a}</div><div class="s" style="margin-top:8px">{b}</div></div>' for a, b in [("Mass", "of a school bag"), ("Velocity", "of a train going west"), ("Time", "taken for a race"), ("Force", "pushing a door open")]) +
  '</div><div style="margin-top:44px;max-width:1300px">' + ask("Hold up one finger for scalar, two for vector, as I point to each card.") + "</div>",
  "Point to each card in turn and let the class vote with fingers. Then reveal: mass scalar, velocity vector, time scalar, force vector.",
  "Answers: Mass: scalar. Velocity: vector. Time: scalar. Force: vector (a push has a direction).",
  "Some students say time is a vector because it 'goes forwards'. In Class 9 physics, time is a scalar.", "2 min")

# ============================================================ 04 DISTANCE AND DISPLACEMENT
route = svg(860, 520, path("M90 420 C 180 200, 380 470, 470 260 S 700 120, 760 120", INK, 3, dash="2 12")
            + circle(90, 420, 10, INK, 0, INK) + circle(760, 120, 10, INK, 0, INK) + tx(90, 470, "Home", 24, INK, 600) + tx(760, 84, "School", 24, INK, 600)
            + arrow(98, 414, 744, 128, BLUE, 5) + tx(380, 330, "Displacement", 24, BLUE, 600) + tx(255, 360, "", 1)
            + tx(560, 215, "Distance (the path walked)", 22, SUB, 500, "start") + bicycle(560, 470, 0.55))
S("04", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("04 · Distance and displacement", "How far you went, and how far you got.")}
  <div class="def" style="margin-top:40px"><span class="k">Distance</span>The <b>total length of the path</b> travelled. A scalar.</div>
  <div class="def" style="margin-top:26px"><span class="k">Displacement</span>The <b>shortest straight line</b> from start to finish, with direction. A vector.</div>
  <p class="s" style="margin-top:30px">Both are measured in metres (m).</p></div><div>{route}</div></div>''',
  "Ask a student how they come to school. The road twists: that is distance. Now imagine a bird flying straight from home to school: that straight arrow is displacement.",
  "If you walk to the canteen and back to class, what is your displacement? (Zero: you ended where you started.)",
  "Students think displacement is just 'distance with a direction'. It is the straight-line change in position, so it can be much smaller than distance, even zero.", "2 min")

tri = svg(620, 480, ln(90, 400, 390, 400, INK, 4) + ln(390, 400, 390, 80, INK, 4) + arrow(90, 400, 380, 92, BLUE, 5)
          + tx(240, 445, "3 m east", 24, INK, 600) + tx(410, 245, "4 m north", 24, INK, 600, "start") + tx(195, 225, "5 m", 26, BLUE, 700)
          + path("M368 400 L368 378 L390 378", INK, 2) + person(90, 400, 0.55))
S("04", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Worked example", "A walk around the playground.")}
  <div style="margin-top:40px">{work([("Question", "Riya walks 3 m east, then 4 m north. Find the distance and the displacement."),
     ("Distance", f"Add the path lengths: {K(r'3 + 4 = 7\ \text{m}')}"),
     ("Displacement", f"The straight line is the hypotenuse: {K(r'\sqrt{3^2 + 4^2} = \sqrt{25}')}"),
     ("Answer", f"Distance {K(r'= 7\ \text{m}')}. Displacement {K(r'= 5\ \text{m}')} towards the north-east.")])}</div></div>
  <div style="text-align:center">{tri}</div></div>''',
  "Draw the right angle on the board. Most Class 9 students know Pythagoras from maths: link it explicitly. Emphasise that a displacement answer needs a direction.",
  "Which is bigger, and can it ever be the other way round?",
  "Students add 3 + 4 for displacement. Ask: 'Did Riya end up 7 m from where she started?'", "2 min")

track = svg(560, 440, f'<ellipse cx="280" cy="220" rx="230" ry="160" stroke="{INK}" stroke-width="4" fill="none"/>' + f'<ellipse cx="280" cy="220" rx="190" ry="122" stroke="{LINE}" stroke-width="2" fill="none" stroke-dasharray="3 10"/>'
            + ln(50, 220, 90, 220, BLUE, 5) + tx(160, 228, "Start and finish", 22, BLUE, 600, "start") + path("M300 58 L326 60", INK, 3) + arrow(300, 60, 330, 61, INK, 3))
S("04", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Worked example", "One lap of the track.")}
  <div style="margin-top:40px">{work([("Question", "An athlete runs exactly one lap of a 400 m track and stops at the start line."),
     ("Distance", "The whole lap was run: 400 m."),
     ("Displacement", "Start and finish are the same point, so the straight line between them has zero length."),
     ("Answer", f"Distance {K(r'= 400\ \text{m}')}. Displacement {K(r'= 0\ \text{m}')}.")])}</div>
  <div style="margin-top:36px">{ask("Can displacement ever be greater than distance?")}</div></div><div style="text-align:center">{track}</div></div>''',
  "This is the example students remember. Run your finger round the track, then point at the start: 'How far is she from where she began?'",
  "Can displacement ever be greater than distance? (No. It can be equal, when the path is a straight line in one direction, or smaller, but never greater.)",
  "Students think zero displacement means 'did not move'. She ran 400 m; she simply came back.", "2 min")

# ============================================================ 05 SPEED AND VELOCITY
gauge = svg(520, 360, path("M80 300 A 180 180 0 0 1 440 300", LINE, 14) + path("M80 300 A 180 180 0 0 1 340 140", BLUE, 14)
            + "".join(ln(260 + 150 * math.cos(math.radians(180 + i * 22.5)), 300 + 150 * math.sin(math.radians(180 + i * 22.5)), 260 + 168 * math.cos(math.radians(180 + i * 22.5)), 300 + 168 * math.sin(math.radians(180 + i * 22.5)), INK, 3) for i in range(9))
            + ln(260, 300, 360, 170, INK, 5) + circle(260, 300, 12, INK, 0, INK) + tx(260, 350, "km/h", 22, MUTE))
S("05", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("05 · Speed", "How fast something covers distance.")}
  <div class="def" style="margin-top:36px"><span class="k">Definition</span><b>Speed</b> is the distance travelled per unit time. A scalar.</div>
  {E(r"\text{speed} = \frac{\text{distance}}{\text{time}} \qquad v = \frac{s}{t}")}
  {vars_table([("v", "speed", "m/s"), ("s", "distance travelled", "m"), ("t", "time taken", "s")])}</div>
  <div style="text-align:center">{gauge}<p class="s">A speedometer shows the speed at each instant.</p></div></div>''',
  "Speed is something students already feel. Link to the speedometer: it does not care which way the car points, only how fast it goes. That is why speed is a scalar.",
  "",
  "Note that in the speed formula, s means distance here; later, in velocity and the equations of motion, s means displacement. Say this out loud to avoid confusion.", "1.5 min")

opp = svg(860, 360, ground(30, 830, 150) + car(60, 150, 1.0) + arrow(320, 70, 440, 70, BLUE, 5) + tx(380, 50, "60 km/h east", 22, BLUE, 600)
          + ground(30, 830, 330) + f'<g transform="translate(860,0) scale(-1,1)">{car(60, 330, 1.0)}</g>' + arrow(540, 250, 420, 250, BLUE, 5) + tx(480, 230, "60 km/h west", 22, BLUE, 600))
S("05", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Velocity", "Speed with a direction.")}
  <div class="def" style="margin-top:36px"><span class="k">Definition</span><b>Velocity</b> is the displacement per unit time. A vector.</div>
  {E(r"\text{velocity} = \frac{\text{displacement}}{\text{time}}")}
  <p class="p">Same SI unit as speed: <b>m/s</b>. But the answer must say which way.</p></div>
  <div>{opp}<p class="s" style="text-align:center;margin-top:10px">Same speed. Different velocities, because the directions differ.</p></div></div>''',
  "Point to the two cars: same speedometer reading, but they are going opposite ways. Their speeds are equal; their velocities are not.",
  "If a car drives round a roundabout at a steady 30 km/h, is its velocity changing? (Yes: the direction keeps changing.)",
  "Students use speed and velocity as the same word. Whenever a direction matters, use velocity.", "1.5 min")

S("05", f'''{head("Worked examples", "Speed and velocity in numbers.")}
  <div class="grid2" style="margin-top:46px"><div class="card">{svg(640, 150, ground(10, 630, 130) + car(20, 130, 0.62) + arrow(200, 60, 600, 60, BLUE, 4) + tx(400, 40, "150 km in 3 h", 22, BLUE, 600))}
  <div style="margin-top:20px">{work([("Question", "A car covers 150 km in 3 h. Find its average speed."), ("Formula", K(r"v = \tfrac{s}{t}")), ("Solve", K(r"\tfrac{150\ \text{km}}{3\ \text{h}} = 50\ \text{km/h}")), ("Answer", f"{K(r'50\ \text{km/h}')} or about {K(r'13.9\ \text{m/s}')}")])}</div></div>
  <div class="card">{svg(640, 150, ground(10, 630, 130) + bicycle(20, 130, 0.55) + arrow(200, 60, 600, 60, BLUE, 4) + tx(400, 40, "1200 m east in 4 min", 22, BLUE, 600))}
  <div style="margin-top:20px">{work([("Question", "A cyclist rides 1200 m due east in 4 minutes. Find her velocity."), ("Convert", K(r"4\ \text{min} = 4 \times 60 = 240\ \text{s}")), ("Solve", K(r"\tfrac{1200\ \text{m}}{240\ \text{s}} = 5\ \text{m/s}")), ("Answer", f"{K(r'5\ \text{m/s}')} due east")])}</div></div></div>''',
  "Work the first one quickly. In the second, slow down at the conversion: minutes must become seconds before dividing, because the answer must be in m/s.",
  "",
  "Forgetting to convert minutes to seconds. And forgetting the direction in a velocity answer.", "2 min")

S("05", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Average speed", "The trap almost everyone falls into.")}
  {E(r"\text{average speed} = \frac{\text{total distance}}{\text{total time}}")}
  {work([("Question", "Go 60 km at 60 km/h. Return the same 60 km at 30 km/h. Average speed?"), ("Times", "Going: 1 h. Returning: 2 h. Total: 3 h."), ("Solve", K(r"\tfrac{120\ \text{km}}{3\ \text{h}}")), ("Answer", K(r"40\ \text{km/h}") + " (not 45 km/h)")])}</div>
  <div>{ask("Why is the answer not simply the average of 60 and 30?")}<div class="warn" style="margin-top:28px"><b>Remember:</b> never average the speeds. Always divide total distance by total time. The slow part takes longer, so it counts for more.</div></div></div>''',
  "Let the class guess first. Most will say 45. Then work it. This surprise makes the rule stick.",
  "Why is the answer not 45? (Because the car spends twice as long at 30 km/h as at 60 km/h, so the slower speed counts for more of the time.)",
  "Averaging the speeds is the single most common error in average speed questions.", "2 min")

# ============================================================ 06 UNIFORM AND NON-UNIFORM
def strip(y, xs, hi):
    out = ground(80, 1500, y + 6, LINE)
    for i, x in enumerate(xs):
        out += car(x, y, 0.42, INK if not hi else BLUE) if False else circle(x, y - 14, 12, BLUE if hi else INK, 0, BLUE if hi else INK)
        out += tx(x, y + 44, f"{i} s", 19, MUTE)
    return out
dots = svg(1560, 330, tx(80, 50, "Uniform: equal distances in equal times", 24, INK, 600, "start") + strip(110, [120 + i * 240 for i in range(5)], True)
           + "".join(tx(240 + i * 240, 80, "20 m", 19, BLUE, 600) for i in range(4))
           + tx(80, 210, "Non-uniform: unequal distances in equal times", 24, INK, 600, "start") + strip(270, [120, 180, 360, 660, 1080], False)
           + "".join(tx(a, 240, d, 19, SUB, 600) for a, d in [(150, "5 m"), (270, "15 m"), (510, "25 m"), (870, "35 m")]))
S("06", f'''{head("06 · Uniform and non-uniform motion", "Is the speed steady, or changing?")}
  <div style="margin-top:44px">{dots}</div>
  <div class="grid2" style="margin-top:20px;gap:60px"><div class="def"><span class="k">Uniform motion</span>Equal distances in equal intervals of time. A car on cruise control.</div>
  <div class="def" style="border-color:{INK}"><span class="k" style="color:{INK}">Non-uniform motion</span>Unequal distances in equal intervals. A bus leaving a stop.</div></div>''',
  "Each dot is a photograph taken every second. Equal gaps means steady speed. Gaps that grow mean the object is speeding up. Ask which describes traffic in a city.",
  "Is a ball rolling to a stop uniform or non-uniform? (Non-uniform: gaps get smaller.)",
  "Students think 'uniform' means 'moving fast'. It means moving at a steady rate in a straight line.", "2 min")

gx, gy = 100, 400
graph = svg(820, 470, axes(gx, gy, 640, 340, "time t (s)", "distance s (m)")
            + "".join(ln(gx + i * 70, gy, gx + i * 70, gy + 10, INK, 2) for i in range(1, 9)) + "".join(tx(gx + i * 70, gy + 34, str(i), 18, MUTE) for i in (2, 4, 6, 8))
            + "".join(ln(gx - 10, gy - i * 70, gx, gy - i * 70, INK, 2) for i in range(1, 5)) + "".join(tx(gx - 20, gy - i * 70 + 6, str(i * 10), 18, MUTE, 500, "end") for i in range(1, 5))
            + ln(gx, gy, gx + 560, gy - 280, BLUE, 5) + path(f"M{gx} {gy} Q {gx+360} {gy-10} {gx+560} {gy-300}", INK, 3, dash="2 10")
            + ln(gx + 560, gy, gx + 560, gy - 280, LINE, 2, "6 8") + ln(gx, gy - 280, gx + 560, gy - 280, LINE, 2, "6 8")
            + tx(gx + 600, gy - 290, "uniform", 20, BLUE, 600, "start") + tx(gx + 470, gy - 150, "non-uniform", 20, SUB, 600, "start"))
S("06", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Distance–time graphs", "The slope tells you the speed.")}
  <p class="p" style="margin-top:30px">A straight line means <b>uniform</b> speed. A curve means the speed is <b>changing</b>. The steeper the line, the faster the object.</p>
  <div style="margin-top:34px">{work([("Read", "The blue line reaches 40 m at 8 s."), ("Solve", K(r"v = \tfrac{40\ \text{m}}{8\ \text{s}}")), ("Answer", K(r"5\ \text{m/s}"))])}</div></div>
  <div>{graph}</div></div>''',
  "Show how to read two values off the graph. Then trace the curve with your finger: it gets steeper, so the object is speeding up.",
  "A flat horizontal line on a distance–time graph means what? (The object is at rest: distance is not changing.)",
  "Students read a distance–time graph as a picture of the path, like a hill. It is not a map; it shows how distance changes with time.", "3 min")

# ============================================================ 07 ACCELERATION
accel = svg(900, 300, ground(20, 880, 240) + bicycle(40, 240, 0.6) + bicycle(330, 240, 0.6) + bicycle(640, 240, 0.6)
            + arrow(80, 120, 140, 120, BLUE, 4) + arrow(370, 120, 490, 120, BLUE, 4) + arrow(680, 120, 860, 120, BLUE, 4)
            + tx(110, 100, "2 m/s", 20, BLUE, 600) + tx(430, 100, "4 m/s", 20, BLUE, 600) + tx(770, 100, "6 m/s", 20, BLUE, 600)
            + tx(105, 290, "t = 0 s", 19, MUTE) + tx(395, 290, "t = 1 s", 19, MUTE) + tx(705, 290, "t = 2 s", 19, MUTE))
S("07", f'''{head("07 · Acceleration", "How quickly velocity changes.")}
  <div class="grid2" style="margin-top:34px;align-items:start"><div><div class="def"><span class="k">Definition</span><b>Acceleration</b> is the change in velocity per unit time. A vector.</div>
  {E(r"a = \frac{v - u}{t}")}{vars_table([("a", "acceleration", "m/s²"), ("u", "initial velocity", "m/s"), ("v", "final velocity", "m/s"), ("t", "time taken", "s")])}</div>
  <div>{accel}<p class="s" style="text-align:center">Velocity rises by 2 m/s every second: {K(r"a = 2\ \text{m/s}^2")}</p></div></div>''',
  "Walk through the three bicycles: every second, the velocity goes up by the same 2 m/s. That steady change is acceleration. Read the unit aloud: 'metres per second, per second'.",
  "",
  "Students confuse speed and acceleration: 'fast' is not 'accelerating'. A car cruising at 100 km/h in a straight line has zero acceleration.", "2 min")

S("07", f'''{head("Worked examples", "Speeding up and slowing down.")}
  <div class="grid2" style="margin-top:46px"><div class="card">{work([("Question", "A car starts from rest and reaches 20 m/s in 5 s. Find its acceleration."), ("Given", f"{K('u = 0')}, {K(r'v = 20\ \text{m/s}')}, {K(r't = 5\ \text{s}')}"), ("Formula", K(r"a = \tfrac{v-u}{t}")), ("Solve", K(r"\tfrac{20 - 0}{5}")), ("Answer", K(r"a = 4\ \text{m/s}^2"))])}</div>
  <div class="card">{work([("Question", "A cyclist brakes from 6 m/s to rest in 3 s. Find the acceleration."), ("Given", f"{K(r'u = 6\ \text{m/s}')}, {K('v = 0')}, {K(r't = 3\ \text{s}')}"), ("Formula", K(r"a = \tfrac{v-u}{t}")), ("Solve", K(r"\tfrac{0 - 6}{3}")), ("Answer", K(r"a = -2\ \text{m/s}^2") + ", slowing down")])}</div></div>
  <div style="margin-top:34px">{ask("What does the minus sign in the second answer tell us?")}</div>''',
  "Stress 'starts from rest' means u = 0: exam questions use this phrase constantly. In the second example, let the minus sign appear naturally and ask what it means.",
  "What does the minus sign mean? (The acceleration is opposite to the motion, so the cyclist slows down. This is called retardation or deceleration.)",
  "Students think negative acceleration always means slowing down. It means acceleration in the negative direction; it slows the object when it is opposite to the velocity, as here.", "3 min")

# ============================================================ 08 EQUATIONS OF MOTION
vt = svg(720, 440, axes(90, 380, 560, 320, "time t", "velocity v")
         + f'<path d="M90 300 L560 120 L560 380 L90 380 Z" fill="{TINT}" stroke="none"/>' + ln(90, 300, 560, 120, BLUE, 5)
         + ln(560, 120, 560, 380, LINE, 2, "6 8") + tx(76, 306, "u", 24, INK, 600, "end") + tx(580, 128, "v", 24, INK, 600, "start") + tx(560, 410, "t", 22, INK, 600)
         + tx(320, 330, "area = displacement s", 22, BLUE, 600))
S("08", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("08 · Equations of motion", "Three equations for uniform acceleration.")}
  <div style="margin-top:34px">{E(r"v = u + at")}{E(r"s = ut + \tfrac{1}{2}at^2")}{E(r"v^2 = u^2 + 2as")}</div>
  <p class="s" style="margin-top:10px">They work only when the acceleration is <b>uniform</b> (constant) and the motion is in a straight line.</p></div>
  <div style="text-align:center">{vt}<p class="s">On a velocity–time graph, the slope is {K("a")} and the area under the line is {K("s")}.</p></div></div>''',
  "Show where the first equation comes from: rearrange a = (v − u)/t. Mention that the second comes from the shaded area on the graph. The textbook derives all three from this graph; today we focus on using them.",
  "",
  "Students apply these equations when acceleration is not constant. Always check the question says 'uniform acceleration' or 'uniformly'.", "2 min")

S("08", head("Know your letters", "Five quantities. Each equation leaves one out.") + f'''<div style="margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:start">
  {vars_table([("u", "initial velocity", "m/s"), ("v", "final velocity", "m/s"), ("a", "acceleration", "m/s²"), ("t", "time", "s"), ("s", "displacement", "m")])}
  <div><table class="v"><tr><th style="text-align:left">Equation</th><th>Leaves out</th></tr>
  <tr><td style="text-align:left;width:auto">{K("v = u + at")}</td><td>{K("s")}</td></tr><tr><td style="text-align:left;width:auto">{K(r"s = ut + \tfrac12 at^2")}</td><td>{K("v")}</td></tr><tr><td style="text-align:left;width:auto">{K("v^2 = u^2 + 2as")}</td><td>{K("t")}</td></tr></table>
  <div class="card" style="margin-top:34px;background:{TINT}"><div class="ey" style="font-size:17px">The method</div><p class="p" style="margin-top:10px">1. Write what you know. 2. Write what you need. 3. Pick the equation that does not use the one quantity you neither know nor need.</p></div></div></div>''',
  "This slide is the key skill. Teach the 'leave one out' trick: every problem gives three quantities and asks for a fourth; choose the equation without the fifth.",
  "",
  "Students try all three equations at random. Insist on writing 'Given' and 'Find' first, every time.", "1.5 min")

S("08", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Worked example 1", "A car pulls away.")}
  <div style="margin-top:20px">{svg(760, 170, ground(10, 750, 150) + car(30, 150, 0.7) + arrow(230, 60, 520, 60, BLUE, 4) + tx(375, 40, "a = 2 m/s² for 5 s", 22, BLUE, 600))}</div>
  <p class="s" style="margin-top:10px">A car starts from rest and accelerates uniformly at {K(r"2\ \text{m/s}^2")} for {K(r"5\ \text{s}")}. Find its final velocity and the distance covered.</p></div>
  <div class="card">{work([("Given", f"{K('u = 0')}, {K(r'a = 2\ \text{m/s}^2')}, {K(r't = 5\ \text{s}')}"), ("Velocity", K(r"v = u + at = 0 + 2 \times 5 = 10\ \text{m/s}")), ("Distance", K(r"s = ut + \tfrac12 at^2 = 0 + \tfrac12 \times 2 \times 5^2")), ("", K(r"= 25\ \text{m}")), ("Check", K(r"v^2 = 2as \Rightarrow 100 = 2 \times 2 \times 25\ \checkmark")), ("Answer", f"{K(r'v = 10\ \text{m/s}')}, {K(r's = 25\ \text{m}')}")])}</div></div>''',
  "Model the layout students should copy: Given, formula, substitution, answer with unit. Show the check with the third equation: it builds confidence that the answers are right.",
  "",
  "Squaring errors: ½ × 2 × 5² is ½ × 2 × 25, not ½ × 2 × 10.", "2 min")

S("08", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Worked example 2", "A train brakes.")}
  <p class="s" style="margin-top:26px">A train moving at {K(r"20\ \text{m/s}")} brakes with a uniform acceleration of {K(r"-0.5\ \text{m/s}^2")}. How far does it travel before stopping, and how long does it take?</p>
  <div style="margin-top:30px">{ask("Which equation finds the distance without knowing the time?")}</div></div>
  <div class="card">{work([("Given", f"{K(r'u = 20\ \text{m/s}')}, {K('v = 0')}, {K(r'a = -0.5\ \text{m/s}^2')}"), ("Distance", K(r"v^2 = u^2 + 2as \Rightarrow 0 = 400 + 2(-0.5)s")), ("", K(r"s = \tfrac{400}{1} = 400\ \text{m}")), ("Time", K(r"v = u + at \Rightarrow 0 = 20 - 0.5t")), ("", K(r"t = \tfrac{20}{0.5} = 40\ \text{s}")), ("Answer", f"{K(r's = 400\ \text{m}')}, {K(r't = 40\ \text{s}')}")])}</div></div>''',
  "Ask the question on the slide before solving. The answer is the third equation, because time is unknown. Then find the time with the first.",
  "Which equation? (v² = u² + 2as, because it does not contain t.)",
  "Sign errors: braking means a is negative. Students who use +0.5 get a negative distance and get confused.", "2.5 min")

# ============================================================ 09 FORCE AND NEWTON'S LAWS
tug = svg(860, 420, tx(60, 40, "Balanced: equal and opposite", 22, INK, 600, "start") + ground(40, 820, 170) + block(380, 170, 100, 90, INK) + arrow(380, 125, 220, 125, BLUE, 5) + arrow(480, 125, 640, 125, BLUE, 5)
          + tx(270, 105, "50 N", 21, BLUE, 600) + tx(580, 105, "50 N", 21, BLUE, 600) + tx(430, 210, "no change in motion", 20, MUTE)
          + tx(60, 270, "Unbalanced: one side wins", 22, INK, 600, "start") + ground(40, 820, 400) + block(380, 400, 100, 90, INK) + arrow(380, 355, 260, 355, AMBER, 5) + arrow(480, 355, 700, 355, BLUE, 5)
          + tx(300, 335, "30 N", 21, AMBER, 600) + tx(620, 335, "80 N", 21, BLUE, 600) + tx(430, 440, "speeds up to the right", 20, MUTE))
S("09", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("09 · Force", "A push or a pull.")}
  <div class="def" style="margin-top:36px"><span class="k">Definition</span>A <b>force</b> is a push or pull that can change an object's <b>speed</b>, <b>direction</b> or <b>shape</b>. A vector, measured in <b>newtons (N)</b>.</div>
  <p class="p" style="margin-top:30px">Only an <b>unbalanced</b> (net) force changes motion.</p></div><div>{tug}</div></div>''',
  "Push a book across the desk. Then push it from both sides equally: nothing happens. That is balanced versus unbalanced. In the second picture the net force is 80 − 30 = 50 N to the right.",
  "In the second picture, what is the net force? (50 N to the right.)",
  "Students think a moving object must have a force pushing it forwards. Introduce the idea here; the first law settles it.", "1.5 min")

bus = svg(860, 420, ground(30, 830, 330) + path("M120 330 L120 120 Q120 90 150 90 L700 90 Q750 90 770 140 L800 230 L800 330", INK, 3.5)
          + "".join(f'<rect x="{170+i*130}" y="120" width="100" height="70" rx="10" stroke="{INK}" stroke-width="2.2" fill="none"/>' for i in range(4))
          + circle(220, 330, 34, INK, 3.5) + circle(660, 330, 34, INK, 3.5) + person(430, 300, 0.95, INK, 28) + arrow(470, 150, 600, 150, AMBER, 4)
          + tx(535, 130, "body keeps moving", 20, AMBER, 600) + arrow(690, 380, 560, 380, BLUE, 4) + tx(625, 410, "bus brakes", 20, BLUE, 600))
S("09", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Newton's first law", "Objects keep doing what they are doing.")}
  <div class="def" style="margin-top:34px"><span class="k">First law (law of inertia)</span>An object stays at rest, or keeps moving in a straight line at a steady speed, unless an unbalanced force acts on it.</div>
  <p class="p" style="margin-top:28px"><b>Inertia</b> is this tendency to resist a change in motion. More mass means more inertia.</p></div>
  <div>{bus}<p class="s" style="text-align:center">When the bus brakes, your body tends to keep moving forwards.</p></div></div>''',
  "Everyone has lurched forward in a braking bus: the bus stopped, their body did not want to. If possible, do the coin-on-card demonstration: flick the card and the coin drops into the glass.",
  "Why does a ball rolling on grass eventually stop, if no one is pushing back? (Friction is an unbalanced force acting against its motion.)",
  "The big misconception: 'objects need a force to keep moving'. They need a force to change motion. Things stop because friction acts on them.", "2 min")

f2 = svg(860, 400, ground(30, 830, 150) + block(150, 150, 110, 80, INK, "1 kg") + arrow(260, 110, 400, 110, BLUE, 5) + tx(330, 90, "F", 24, BLUE, 700, italic=True) + arrow(470, 110, 640, 110, INK, 3) + tx(555, 92, "large a", 20, INK, 600)
         + ground(30, 830, 350) + block(110, 350, 190, 120, INK, "4 kg") + arrow(300, 290, 440, 290, BLUE, 5) + tx(370, 270, "same F", 22, BLUE, 700) + arrow(510, 290, 560, 290, INK, 3) + tx(600, 296, "small a", 20, INK, 600, "start"))
S("09", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Newton's second law", "Force, mass and acceleration.")}
  <div class="def" style="margin-top:30px"><span class="k">Second law</span>The acceleration of an object is directly proportional to the net force and inversely proportional to its mass.</div>
  {E(r"F = ma")}{vars_table([("F", "net force", "newton (N)"), ("m", "mass", "kg"), ("a", "acceleration", "m/s²")])}
  <p class="s" style="margin-top:14px">{K(r"1\ \text{N} = 1\ \text{kg m/s}^2")}</p></div>
  <div>{f2}</div></div>''',
  "Use the trolley picture: the same push on a light trolley and a heavy one. The light one speeds up faster. Then show F = ma as the short form of that sentence. If time allows, add that the textbook states the law using momentum, p = mv: force is the rate of change of momentum, which gives F = ma when mass stays constant.",
  "Which is harder to stop, a cricket ball or a football moving at the same speed? Why? (The football usually has more mass, so more momentum and more inertia.)",
  "Students use mass in grams. Mass must be in kilograms for force to come out in newtons.", "1.5 min")

S("09", f'''{head("Worked examples", "Using F = ma.")}
  <div class="grid2" style="margin-top:46px"><div class="card">{svg(640, 150, ground(10, 630, 130) + car(30, 130, 0.62) + arrow(210, 60, 420, 60, BLUE, 4) + tx(315, 40, "a = 2 m/s²", 21, BLUE, 600))}
  <div style="margin-top:16px">{work([("Question", "What force gives a 1000 kg car an acceleration of 2 m/s²?"), ("Formula", K("F = ma")), ("Solve", K(r"1000 \times 2")), ("Answer", K(r"F = 2000\ \text{N}"))])}</div></div>
  <div class="card">{svg(640, 150, ground(10, 630, 130) + ball(120, 100, 30) + arrow(170, 100, 330, 100, BLUE, 4) + tx(250, 80, "10 N", 21, BLUE, 600))}
  <div style="margin-top:16px">{work([("Question", "A net force of 10 N acts on a 0.5 kg ball. Find its acceleration."), ("Formula", K(r"a = \tfrac{F}{m}")), ("Solve", K(r"\tfrac{10}{0.5}")), ("Answer", K(r"a = 20\ \text{m/s}^2"))])}</div></div></div>''',
  "Do both quickly. In the second, show the rearrangement a = F/m as a separate line.",
  "",
  "Dividing 10 by 0.5 gives 20, not 5. Students who rush often divide the wrong way.", "1.5 min")

pairs = svg(480, 430, ground(20, 460, 400) + person(260, 400, 1.15, INK, 12) + path("M332 150 L332 400", INK, 7) + arrow(332, 262, 452, 262, BLUE, 5) + arrow(324, 300, 190, 300, AMBER, 5)
            + tx(342, 240, "on the wall", 19, BLUE, 600, "start") + tx(130, 306, "on the hand", 19, AMBER, 600))
pairs = f'<div class="row" style="gap:20px;align-items:flex-end"><div>{pairs}<p class="s" style="text-align:center">Two objects, two forces</p></div><div>{hl("rocket-up", 440)}<p class="s" style="text-align:center">Gases pushed down, rocket pushed up</p></div></div>'
S("09", f'''<div class="grid2" style="align-items:center;height:100%"><div>{head("Newton's third law", "Forces come in pairs.")}
  <div class="def" style="margin-top:34px"><span class="k">Third law</span>For every action there is an equal and opposite reaction.</div>
  <p class="p" style="margin-top:28px">The two forces act on <b>different objects</b>, so they never cancel each other out.</p>
  <p class="s" style="margin-top:20px">Walking: your foot pushes the ground back, the ground pushes you forward. Swimming, a gun's recoil and a rocket all work the same way.</p></div>
  <div>{pairs}</div></div>''',
  "Ask a student to push the wall. Can they feel the wall pushing back? Then the rocket: it pushes hot gases down, the gases push the rocket up.",
  "If action and reaction are equal and opposite, why do they not cancel? (They act on different objects: one on the wall, one on the hand.)",
  "The biggest third-law misconception is that the pair cancels. Forces cancel only when they act on the same object.", "1.5 min")

S("09", '<div style="height:100%;display:flex;flex-direction:column;justify-content:center;max-width:1400px">' + head("Your turn", "Which law is it?") + '<div style="margin-top:50px;display:flex;flex-direction:column;gap:24px">' +
  ask("A tablecloth is pulled quickly and the dishes stay on the table.", "Situation A") + ask("Kicking a football harder makes it speed up more.", "Situation B") + ask("A swimmer pushes water backwards and moves forwards.", "Situation C") + "</div></div>",
  "Read each situation. Students answer 1, 2 or 3 with fingers. Ask one student to explain each answer in one sentence.",
  "Answers: A: first law (inertia of the dishes). B: second law (bigger force, bigger acceleration). C: third law (action and reaction).",
  "", "1 min")

# ============================================================ 10 PRACTICE AND RECAP
Q = [("Conceptual", "Can an object have zero displacement but a non-zero distance? Give an example."),
     ("Numerical", "Convert 54 km/h into m/s, and 25 m/s into km/h."),
     ("Numerical", "A bus starts from rest and accelerates uniformly at 0.1 m/s² for 2 minutes. Find its final speed and the distance it travels."),
     ("Numerical", "A train moving at 90 km/h brakes with a uniform acceleration of −0.5 m/s². How far does it travel before it stops?"),
     ("Numerical", "An athlete runs round a circular track of diameter 200 m and completes one round in 40 s. Find the distance and the displacement after 2 min 20 s. (Take π = 22/7.)"),
     ("Numerical", "What net force is needed to give a 1500 kg car an acceleration of 2 m/s²?"),
     ("Conceptual", "Passengers in a bus fall forward when it stops suddenly. Explain why, using Newton's first law."),
     ("Conceptual", "Action and reaction forces are equal and opposite. Explain why they do not cancel each other.")]
def qlist(items, start):
    return "".join(f'<div style="display:grid;grid-template-columns:70px 1fr;gap:20px;padding:22px 0;border-top:1.5px solid #E8E8ED"><span style="font-size:24px;font-weight:600;color:{BLUE}">Q{start+i}</span><div><span class="tag" style="font-size:13px;padding:4px 10px">{t}</span><div style="font-size:27px;line-height:1.45;margin-top:10px">{q}</div></div></div>' for i, (t, q) in enumerate(items))
S("10", head("Practice", "CBSE-style questions.", "Try Q1 and Q2 now. The rest are for homework; full solutions follow.") + f'<div style="margin-top:28px">{qlist(Q[:4], 1)}</div>',
  "Give two minutes for Q1 and Q2 in class. Set Q3 to Q8 as homework. The answer key follows these two slides; share it after students have attempted the questions.",
  "Q1 answer: yes, e.g. one lap of a track. Q2: 15 m/s and 90 km/h.", "", "1.5 min")
S("10", head("Practice", "CBSE-style questions, continued.") + f'<div style="margin-top:36px">{qlist(Q[4:], 5)}</div>',
  "Homework questions. Point out that Q5 is a classic NCERT-style problem: it combines distance, displacement and a circle.", "", "", "Homework", "Homework")

A = [("Q1", "Yes. Distance is the length of the path, displacement is the straight line from start to finish. An athlete who runs one full lap of a track covers a distance of 400 m, but ends at the start, so the displacement is 0."),
     ("Q2", f"{K(r'54 \times \tfrac{5}{18} = 15\ \text{m/s}')}. &nbsp; {K(r'25 \times \tfrac{18}{5} = 90\ \text{km/h}')}."),
     ("Q3", f"{K(r'u = 0,\ a = 0.1\ \text{m/s}^2,\ t = 2\ \text{min} = 120\ \text{s}')}. &nbsp; {K(r'v = u + at = 0.1 \times 120 = 12\ \text{m/s}')}. &nbsp; {K(r's = \tfrac12 at^2 = \tfrac12 \times 0.1 \times 120^2 = 720\ \text{m}')}."),
     ("Q4", f"{K(r'u = 90 \times \tfrac{5}{18} = 25\ \text{m/s}')}, {K('v = 0')}, {K(r'a = -0.5\ \text{m/s}^2')}. &nbsp; {K(r'v^2 = u^2 + 2as \Rightarrow 0 = 625 - s')}, so {K(r's = 625\ \text{m}')}.")]
A2 = [("Q5", f"{K(r'2\ \text{min}\ 20\ \text{s} = 140\ \text{s}')}, so rounds {K(r'= \tfrac{140}{40} = 3.5')}. Circumference {K(r'= \pi d = \tfrac{22}{7} \times 200 = \tfrac{4400}{7}\ \text{m}')}. Distance {K(r'= 3.5 \times \tfrac{4400}{7} = 2200\ \text{m}')}. After 3.5 rounds the athlete is on the opposite side, so displacement {K(r'= d = 200\ \text{m}')}."),
      ("Q6", f"{K(r'F = ma = 1500 \times 2 = 3000\ \text{N}')}."),
      ("Q7", "The bus stops because the brakes act on it, but the passengers' bodies tend to stay in motion because of inertia (Newton's first law), so they move forward."),
      ("Q8", "Action and reaction act on two different objects. Forces can cancel only when they act on the same object, so the pair does not cancel.")]
def alist(items):
    return "".join(f'<div style="display:grid;grid-template-columns:70px 1fr;gap:20px;padding:22px 0;border-top:1.5px solid #E8E8ED"><span style="font-size:24px;font-weight:600;color:{BLUE}">{a}</span><div style="font-size:25px;line-height:1.55">{b}</div></div>' for a, b in items)
S("10", head("Answer key", "Detailed solutions, Q1 to Q4.") + f'<div style="margin-top:30px">{alist(A)}</div>', "Share after the homework is attempted.", "", "", "Homework", "Answer key")
S("10", head("Answer key", "Detailed solutions, Q5 to Q8.") + f'<div style="margin-top:30px">{alist(A2)}</div>', "For Q5, draw the circle and mark where 3.5 rounds ends: directly opposite the start, one diameter away.", "", "", "Homework", "Answer key")

recap = [("Physical quantity", "a number and a unit"), ("Scalar / vector", "size only / size and direction"), ("Distance / displacement", "path length / straight line, with direction"),
         ("Speed / velocity", "distance per time / displacement per time"), ("Uniform motion", "equal distances in equal times"), ("Acceleration", "change in velocity per unit time"),
         ("First law", "inertia: no change without a net force"), ("Second law", "F = ma"), ("Third law", "equal and opposite pairs, on different objects")]
S("10", head("Recap", "Nine ideas to take home.") + '<div style="margin-top:40px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px">' +
  "".join(f'<div class="card" style="padding:26px 30px"><div style="font-size:15px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:{BLUE}">{i+1:02d}</div><div style="font-size:26px;font-weight:600;margin-top:8px">{a}</div><div class="s" style="margin-top:4px">{b}</div></div>' for i, (a, b) in enumerate(recap)) + "</div>",
  "Ask a different student to say each card in their own words. If anyone hesitates, that is tomorrow's starter.", "", "", "1 min")

F = [(r"v = \frac{s}{t}", "speed"), (r"\text{avg speed} = \frac{\text{total distance}}{\text{total time}}", "average speed"), (r"a = \frac{v-u}{t}", "acceleration"), (r"v = u + at", "first equation"),
     (r"s = ut + \tfrac12 at^2", "second equation"), (r"v^2 = u^2 + 2as", "third equation"), (r"F = ma", "Newton's second law"), (r"1\ \text{km/h} = \tfrac{5}{18}\ \text{m/s}", "conversion")]
S("10", head("Formula sheet", "Everything you need for today's questions.") + '<div style="margin-top:44px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px">' +
  "".join(f'<div class="card" style="padding:30px 22px;text-align:center"><div style="font-size:34px;min-height:90px;display:flex;align-items:center;justify-content:center">{K(f)}</div><div class="s" style="margin-top:8px">{n}</div></div>' for f, n in F) + "</div>"
  + f'<p class="s" style="margin-top:30px">Equations of motion apply only to uniform acceleration in a straight line. Always use SI units: m, kg, s.</p>',
  "Students can photograph this slide. Remind them which formulas need uniform acceleration.", "", "", "0.5 min")

S("10", f'''<div class="grid2" style="align-items:center;height:100%"><div><div class="ey">Next lesson</div><h1 style="margin-top:22px">Motion in graphs,<br>and circular motion.</h1>
  <p class="lead" style="margin-top:28px">Homework: practice questions 3 to 8. Bring your answers; we will check them together using the answer key.</p></div>
  <div>{hl("slow", 820)}</div></div>''',
  "Close by linking forward: velocity–time graphs and why moving in a circle at steady speed still counts as acceleration.", "", "", "", "Minute 60")
