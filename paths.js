/* =====================================================================
   THE RABBIT HOLE: your questions live here
   =====================================================================

   How it works
   ------------
   - Every box on the site is one entry below, with a short id in front
     (lowercase letters, numbers, - or _ only, no spaces).
   - "text"    is what the box says.
   - "options" lists the ids of the boxes that branch out of it.
               1 to 7 works (7 is the most the layout is designed for).
   - "detail"  (optional) is smaller text that types in under the title
               when that box is open. Use \n\n to start a new paragraph.
   - A box with no options is an ENDING. Reaching it locks the path,
     shows the star message and earns that ending's star.
   - "star"    (optional, endings only) is a picture to use as that
               ending's star, e.g.  star: "stars/cat.png"
               Without it, the site makes a collage star for you.
   - The site always begins at "start".

   To add a new branch:
     1. Copy a line like   forests: { text: "Forests" },
     2. Give it a new id and text.
     3. Add that id to the "options" list of the box it should grow from.
   ===================================================================== */

window.PATHS = {

  start: {
    text: "How can I rekindle that childlike sense of wonder even as I grow older?",
    options: ["drugs", "nature", "older", "children", "numbing", "ambition", "a_break"]
  },

  /* =================== DRUGS =================== */

  drugs: {
    text: "Drugs",
    options: ["weed", "psychedelics"]
  },

  weed: {
    text: "Weed",
    options: ["weed_numbing", "weed_outdoors", "weed_nature_show"]
  },
  weed_numbing: { text: "Numbing" },
  weed_outdoors: {
    text: "It made me love being outdoors",
    detail: "Growing up as a couch potato, I hated exercise and being outdoors, but when I started smoking weed, being outside made me feel like I was a character in a book or a video game.\n\nI'm not saying this will happen to you, but if you're looking for a sense of wonder, smoke a joint, put some music on and see what happens."
  },
  weed_nature_show: {
    text: "Nature shows and walks, while high",
    detail: "Never have I enjoyed a BBC nature show or a walk outside more than while high. It is lovely and always so interesting."
  },

  psychedelics: {
    text: "Psychedelics",
    options: ["lsd", "mushrooms"]
  },

  lsd: {
    text: "LSD",
    options: ["neuroplasticity", "terrifying", "lsd_kid_again"]
  },
  neuroplasticity: {
    text: "Neuroplasticity",
    detail: "Scientific studies have shown that LSD and other psychedelics promote neurogenesis (the formation of new neurons) and neuroplasticity (the changing of neural connections and formation of new neural pathways), both of which can cause a sense of childlike wonder."
  },
  terrifying: {
    text: "Terrifying experiences",
    options: ["setting", "not_overdoing", "researchers", "defences"]
  },
  setting: {
    text: "Create a creative setting",
    detail: "It's important to try to create a creative setting so this doesn't happen."
  },
  not_overdoing: { text: "Not overdoing it" },
  researchers: {
    text: "The early psychedelic researchers",
    detail: "Look at the life courses of the early psychedelic researchers. They all started out as successful adult professionals… and still ended up pretty dang weird."
  },
  defences: {
    text: "It lowers your defences and heightens your emotions",
    detail: "It's a double-edged sword, really, because you can experience great highs but also leave yourself open to crushing lows, prompted by things which, when sober, you wouldn't think about twice."
  },
  lsd_kid_again: {
    text: "Feel like a kid again",
    options: ["first_time", "reliving", "perspective"]
  },
  first_time: {
    text: "The first time I took it",
    detail: "The first time I took it, I was almost in tears because it reminded me so perfectly of what it was like to be a child. Such an incredible sense of wonder and discovery, almost like I was seeing the world again for the first time and experiencing things brand new. At one point I lay down outside and just watched the clouds moving and changing forms, and my imagination turned it into this crazy battle of ancient Greek gods, with Zeus and Poseidon fighting it out in the sky. I'd forgotten that I had that sort of imagination as a kid, but I rediscovered it on LSD.\n\nNot sure if \"take drugs\" was quite the answer you wanted, but there you go. There are some great suggestions in the rest of the thread, but in my opinion, nothing will really make you feel that childlike wonder like LSD will."
  },
  reliving: { text: "A reliving of wonderment" },
  perspective: {
    text: "It's all about perspective",
    detail: "Seeing the same things with new eyes."
  },

  mushrooms: {
    text: "Mushrooms",
    options: ["mush_kid_again", "mush_lightly"]
  },
  mush_kid_again: {
    text: "They make me feel like a kid again",
    detail: "I marvel at \"ordinary\" things and see everything like it's new."
  },
  mush_lightly: {
    text: "Don't take them lightly",
    detail: "These substances are powerful, both for the good and for the bad. They can heal deep trauma and stress, but they can also induce psychosis and delusion."
  },

  /* =================== BEING IN NATURE =================== */

  nature: {
    text: "Being in nature",
    options: ["forests", "feeling", "good_mushrooms", "staring"]
  },
  forests: { text: "Forests" },

  feeling: {
    text: "Feeling",
    options: ["grass", "present", "dolphins"]
  },
  grass: {
    text: "Lie down on the grass",
    detail: "There's a whole world down there. You can see an ant carrying a grain of food over a patch of moss."
  },
  present: {
    text: "Feeling truly present",
    options: ["peace", "connected"]
  },
  peace: { text: "A sense of peace" },
  connected: {
    text: "Connected with nature and with people",
    detail: "Connected with nature, connected with people, and sharing this experience together."
  },
  dolphins: {
    text: "Swim with dolphins",
    options: ["expensive", "your_norm", "intense"]
  },
  expensive: { text: "Expensive" },
  your_norm: {
    text: "Step out of your norm",
    detail: "It can broaden your horizons."
  },
  intense: {
    text: "Nothing else comes close",
    detail: "I cannot recall another experience in my adult life where I felt that sense of wonder as intensely."
  },

  good_mushrooms: {
    text: "Finding good mushrooms",
    options: ["staring_mush", "eating_mush"]
  },
  staring_mush: { text: "Staring at them" },
  eating_mush: {
    text: "Eating them",
    options: ["more_magical", "husband"]
  },
  more_magical: { text: "Yup, that does make things more magical." },
  husband: {
    text: "My husband confirms",
    detail: "My husband confirms they \"make you feel like a kid again.\""
  },

  staring: {
    text: "Staring",
    options: ["tree_bark", "animals", "leaves", "moon"]
  },
  tree_bark: { text: "Get really close to tree bark" },
  animals: {
    text: "Animals",
    options: ["birds", "rabbits"]
  },
  birds:   { text: "Birds" },
  rabbits: { text: "Rabbits" },
  leaves:  { text: "Seeing the leaves change" },
  moon: {
    text: "Seeing the moon and stars",
    detail: "I find it magical!"
  },

  /* =================== AS YOU GET OLDER IT GOES AWAY =================== */

  older: {
    text: "As you get older it goes away",
    options: ["inevitable", "dont_shrug"]
  },

  inevitable: {
    text: "Inevitable",
    options: ["more_specific", "all_new", "nostalgic"]
  },
  more_specific: {
    text: "You become more \"specific\"",
    detail: "As you get older, you become more \"specific\"; that is, your circle of concern, friends, interests, etc. narrow to the few things that hold meaning — as opposed to \"the next new thing\" that occupies most humans."
  },
  all_new: {
    text: "Everything actually is new",
    detail: "The thing about a childlike sense of wonder: it's not just that everything seems new and wonderful and amazing, everything actually is new and wonderful and amazing to you. You are literally discovering the world for the first time, and will encounter something you've never known of before almost every day."
  },
  nostalgic: {
    text: "You aren't obligated to be nostalgic",
    options: ["remembering", "look_back"]
  },
  remembering: {
    text: "Not nostalgic, but remembering",
    detail: "Nostalgic, no, not in that way, but rather remembering those few things in life that brought memorable pleasure to your life."
  },
  look_back: {
    text: "It's okay to look back fondly",
    detail: "Sometimes people feel like they should always enjoy the same things. It's okay to look back fondly, but also to no longer feel that way in the present."
  },

  dont_shrug: {
    text: "Don't just shrug it off",
    detail: "I don't think we should just shrug and say, \"Eh, everyone gets old and boring, that's the real world.\"",
    options: ["applaud", "finding_new"]
  },
  applaud: {
    text: "We applaud the people who keep it",
    detail: "When notable people maintain that sense of wonder and use it to make great art, start businesses or become political activists, we applaud them, we listen to their podcast interviews, and sometimes they get millions of dollars.",
    options: ["really"]
  },
  really: {
    text: "Do they really, though?",
    detail: "Or do they just maintain an enthusiasm and an open mind when most adults get tired and disinterested?"
  },
  finding_new: {
    text: "They're out there finding new things",
    detail: "Adults able to maintain this sense are out there actually finding new things, when most of us have settled into a daily routine of work, home, family, chores, etc.",
    options: ["overstimulation", "best_of"]
  },
  overstimulation: {
    text: "Cut the overstimulation",
    detail: "I've cut all of the artificial (over)stimulation in my life (caffeine, excessive video games, which increase cortisol levels), and it allowed my dopamine receptor sensitivity to reset to almost default levels. Just give it time (20 to 50 days, depending on your stimulant abuse levels)."
  },
  best_of: {
    text: "Seek out the best of humanity",
    detail: "Most people never search out and enjoy the BEST of humanity and the arts, and as a result of always chasing novelty, i.e., the latest new thing, they walk around bored. (And bored people are boring, ha!)"
  },

  /* =================== HAVE CHILDREN =================== */

  children: {
    text: "Have children",
    options: ["first_things", "keep_asking"]
  },

  first_things: {
    text: "Seeing things for the first time",
    options: ["watch_them", "their_focus", "new_perspective"]
  },
  watch_them: {
    text: "Watch them discover things",
    options: ["reawakened", "with_them"]
  },
  reawakened: { text: "It reawakened my sense of wonder" },
  with_them: {
    text: "Discovering things again with them",
    detail: "It's almost like I'm discovering things again with them.\n\nIt's at the point now that even if my kids aren't in the car and a big truck or digger goes past, I get all giddy and can't wait to tell them when I'm home."
  },
  their_focus: {
    text: "Figure out what they're focusing on",
    detail: "You need to figure out what the child is focusing on. It forces the parent to also focus on things they had been filtering out."
  },
  new_perspective: {
    text: "A new perspective",
    options: ["big_picture", "obscure_details"]
  },
  big_picture: {
    text: "Look at the big picture",
    detail: "Look at the broad view, the big picture. As you get familiar with a thing, you start to focus on minor details within that thing. You are often driven to look for imperfections, which you can abuse or fix depending on how your interaction with that thing goes."
  },
  obscure_details: {
    text: "Find obscure, barely consequential details",
    detail: "Want to appear well-versed in something? Quickly evaluate what can be ignored, and ignore those things."
  },

  keep_asking: {
    text: "Keep asking questions (and follow the research)",
    options: ["what_true", "why_like_that", "where_from"]
  },
  what_true:     { text: "What do I think is true?" },
  why_like_that: { text: "Why is this thing like that?" },
  where_from:    { text: "Where did this come from?" },

  /* =================== STOP NUMBING =================== */

  numbing: {
    text: "Stop numbing",
    options: ["override", "numbing_agents"]
  },
  override: { text: "When you numb, you override a natural curiosity." },
  numbing_agents: {
    text: "Rid yourself of numbing agents",
    options: ["alcohol", "dating_apps", "scrolling", "numbing_weed"]
  },
  alcohol:     { text: "Alcohol" },
  dating_apps: { text: "Dating apps" },
  scrolling:   { text: "Scrolling" },
  numbing_weed: {
    text: "Weed",
    detail: "I was surprised to see weed on here as a positive suggestion, because I think it is a common numbing agent. I think for weed, it depends how you're using it."
  },

  /* =================== DO ACTIVITIES DEVOID OF AMBITION =================== */

  ambition: {
    text: "Do activities devoid of ambition",
    options: ["new_things", "language", "improv"]
  },
  new_things: {
    text: "Try new things that stimulate or surprise you!",
    options: ["videos", "articles", "podcasts", "snowball"]
  },
  videos:   { text: "Watch videos" },
  articles: { text: "Read articles" },
  podcasts: { text: "Listen to podcasts" },
  snowball: {
    text: "Answers to questions you never asked",
    detail: "Sometimes an unprompted answer to a question you never asked can spark new questions and motivate you to discover new things. It's a snowball effect, in a good way!"
  },
  language: {
    text: "Learn a new language",
    detail: "Don't aspire to be a professor or to move to that country. Do it simply for the joy of it."
  },
  improv: {
    text: "Take an improv class",
    options: ["teaches_play", "looking_out", "confidence"]
  },
  teaches_play: {
    text: "It teaches play",
    detail: "It's a beautiful thing to be able to reprogram your brain as an adult to play, be accepting of different ideas, and have goals to make others look good."
  },
  looking_out: { text: "It encourages looking out for others" },
  confidence:  { text: "It teaches confidence" },

  /* =================== TAKING A BREAK =================== */

  a_break: {
    text: "Taking a break",
    options: ["time_off", "meditation", "five_steps", "letting_go"]
  },
  time_off: {
    text: "Time off work",
    detail: "It can be a really beneficial and rejuvenating experience that gives that inner kid a chance to breathe again."
  },
  meditation: {
    text: "Meditation",
    detail: "Who knows, maybe even your own familiar thoughts and feelings will fill you with a sense of wonder when you watch them from a meditative point of view!"
  },

  five_steps: { text: "5 steps", options: ["step_1"] },
  step_1: { text: "Step 1: Find some alone time, away from stress", options: ["step_2"] },
  step_2: { text: "Step 2: It's OK to be vulnerable, so drop your guard", options: ["step_3"] },
  step_3: { text: "Step 3: Relax and reminisce on childhood nostalgia", options: ["step_4"] },
  step_4: { text: "Step 4: Don't overthink. Be in the moment and enjoy the simplest things", options: ["step_5"] },
  step_5: {
    text: "Step 5: Let go of stress completely",
    detail: "Let go of stress completely, until you're satisfied and content with a rekindled, childlike sense of wonder."
  },

  letting_go: {
    text: "Letting go",
    options: ["attachments", "strong_emotions"]
  },
  attachments: { text: "Of attachments" },
  strong_emotions: {
    text: "Of strong emotions",
    options: ["anger"]
  },
  anger: {
    text: "Anger",
    detail: "If someone cuts you off in traffic and you usually have road rage, feel your anger, validate it in your head, and recognize that the anger is coming from a place of ego. Don't give in to cursing or shouting in your car, because no one is going to hear you except yourself, so what did you gain by losing control of yourself? Let the anger wash over you and feel it dissolve. You will feel much better because you let your confidence win instead of your ego."
  }

};
