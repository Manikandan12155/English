import os
import re
import json
import urllib.request
import string

CACHE_DIR = "scripts/cache"
os.makedirs(CACHE_DIR, exist_ok=True)

WORDSET_BASE = "https://raw.githubusercontent.com/wordset/wordset-dictionary/master/data"
WEBSTER_URL = "https://raw.githubusercontent.com/matthewreagan/WebstersEnglishDictionary/master/dictionary_compact.json"

MODERN_TERMS = {
    "decision-making": {
        "meaning": "The process of making choices, especially of an important kind, by identifying a decision, gathering information, and assessing alternative resolutions.",
        "simpleMeaning": "The process of making important choices."
    },
    "unenviably": {
        "meaning": "In a difficult, unpleasant, or unenviable manner or situation.",
        "simpleMeaning": "In an unpleasant or difficult way."
    },
    "personalization/personalisation": {
        "meaning": "The action of designing or tailoring something to meet someone's individual requirements or tastes.",
        "simpleMeaning": "Customizing something for an individual."
    },
    "personalization": {
        "meaning": "The action of designing or tailoring something to meet someone's individual requirements or tastes.",
        "simpleMeaning": "Customizing something for an individual."
    },
    "raunchily": {
        "meaning": "In an earthy, vulgar, or sexually suggestive manner.",
        "simpleMeaning": "In a bold, suggestive way."
    },
    "demographically": {
        "meaning": "In a way that relates to the structure and characteristics of human populations.",
        "simpleMeaning": "Relating to population data and statistics."
    },
    "unscathing": {
        "meaning": "Without causing harm or injury; not severe or damaging.",
        "simpleMeaning": "Harmless or unhurt."
    },
    "chiselled": {
        "meaning": "Having clear, sharp, and attractive features, as if sculpted with a chisel.",
        "simpleMeaning": "Sharply defined or sculpted."
    },
    "metalled": {
        "meaning": "Surfaced with road metal (crushed stone, gravel, or macadam).",
        "simpleMeaning": "Paved or surfaced with gravel."
    },
    "evokingly": {
        "meaning": "In a manner that brings a strong feeling, memory, or image into mind.",
        "simpleMeaning": "In a way that recalls vivid memories."
    },
    "genomic": {
        "meaning": "Relating to the complete set of genes or genetic material present in an organism.",
        "simpleMeaning": "Relating to an organism's entire DNA code."
    },
    "genomically": {
        "meaning": "In terms of genetics or the genome of an organism.",
        "simpleMeaning": "From a genetic or genome perspective."
    },
    "fabulate": {
        "meaning": "To tell fables, invent stories, or speak fictionally.",
        "simpleMeaning": "To invent or tell stories."
    },
    "fabulation": {
        "meaning": "The act of inventing fanciful stories, myths, or legends.",
        "simpleMeaning": "Storytelling or inventing fables."
    },
    "euphorically": {
        "meaning": "With a feeling of intense happiness, excitement, and well-being.",
        "simpleMeaning": "With extreme joy and excitement."
    },
    "paralyzingly/paralysingly": {
        "meaning": "In a manner that causes extreme shock, numbness, or inability to move.",
        "simpleMeaning": "So overwhelming or shocking that you cannot move."
    },
    "paralyzingly": {
        "meaning": "In a manner that causes extreme shock, numbness, or inability to move.",
        "simpleMeaning": "So overwhelming or shocking that you cannot move."
    },
    "undiminishing": {
        "meaning": "Not decreasing, lessening, or fading over time; enduring.",
        "simpleMeaning": "Remaining strong without decreasing."
    },
    "unharried": {
        "meaning": "Not harassed, rushed, or troubled by demands; calm and untroubled.",
        "simpleMeaning": "Calm, peaceful, and unhurried."
    },
    "porten": {
        "meaning": "To serve as an omen, portent, or warning of a future event; foreshadow.",
        "simpleMeaning": "To foreshadow or indicate a future event."
    },
    "impressionistically": {
        "meaning": "In a manner based on subjective impressions or feelings rather than detailed facts.",
        "simpleMeaning": "Based on overall impressions rather than exact details."
    },
    "dvd": {
        "meaning": "Digital Versatile Disc; a type of compact disc able to store large amounts of data, especially high-resolution audiovisual material.",
        "simpleMeaning": "A digital disc used for watching movies or storing data."
    },
    "film-maker": {
        "meaning": "A person who directs or produces movies and films.",
        "simpleMeaning": "A movie director or producer."
    },
    "fundraising": {
        "meaning": "The activity of collecting money for a charity, school, political campaign, or other organization.",
        "simpleMeaning": "Raising money for a charity or cause."
    },
    "have to": {
        "meaning": "Used to say that something is required, necessary, or obligatory.",
        "simpleMeaning": "Must or need to do something."
    },
    "high-profile": {
        "meaning": "Attracting a lot of public attention, interest, and publicity.",
        "simpleMeaning": "Very famous or widely noticed."
    },
    "including": {
        "meaning": "Containing as part of the whole being considered; having as a constituent member.",
        "simpleMeaning": "Part of a group or list."
    },
    "jeans": {
        "meaning": "Casual trousers made of denim or other heavy cotton material, typically with rivets and stitched seams.",
        "simpleMeaning": "Casual denim pants."
    },
    "long-standing": {
        "meaning": "Having existed or continued for a long period of time.",
        "simpleMeaning": "Existing for a long time."
    },
    "long-time": {
        "meaning": "Having been something or in a particular state for a lengthy period of time.",
        "simpleMeaning": "For a long period."
    },
    "neighbouring": {
        "meaning": "Next to or very near another place; adjacent or neighboring.",
        "simpleMeaning": "Located nearby or next door."
    },
    "next to": {
        "meaning": "In or into a position immediately to one side of; adjacent to; beside.",
        "simpleMeaning": "Beside or right next to."
    },
    "no one": {
        "meaning": "No person; nobody whatsoever.",
        "simpleMeaning": "Nobody."
    },
    "non-profit": {
        "meaning": "Not established for the purpose of making a profit; designating an organization dedicated to a social, educational, or charitable cause.",
        "simpleMeaning": "Charitable organization not run for profit."
    },
    "per cent": {
        "meaning": "One part in every hundred; percentage.",
        "simpleMeaning": "Out of 100; percentage."
    },
    "post-war": {
        "meaning": "Occurring or existing in the period after a major war.",
        "simpleMeaning": "The time period after a war."
    },
    "set-up": {
        "meaning": "The way in which something is organized, planned, or arranged.",
        "simpleMeaning": "Organization or arrangement."
    },
    "theirs": {
        "meaning": "Belonging to or associated with the people or things previously mentioned or easily identified.",
        "simpleMeaning": "Belonging to them."
    },
    "paywall": {
        "meaning": "A system that prevents internet users from accessing webpage content without a paid subscription.",
        "simpleMeaning": "A restriction requiring a paid subscription to read web content."
    },
    "reverb": {
        "meaning": "An electronically produced echo effect in recorded music or audio.",
        "simpleMeaning": "Echo or acoustic resonance effect."
    },
    "glitzy": {
        "meaning": "Fashionably attractive, showy, or glamorous in a bright or superficial way.",
        "simpleMeaning": "Glamorous and showy."
    },
    "floodgates": {
        "meaning": "A gate used to control the flow of water; used figuratively for something that unleashes an overwhelming rush of events.",
        "simpleMeaning": "Barrier holding back an overwhelming rush."
    },
    "criteria": {
        "meaning": "Principles or standards by which something may be judged, evaluated, or decided (plural of criterion).",
        "simpleMeaning": "Standards used for judging or making decisions."
    },
    "stimuli": {
        "meaning": "Things that evoke a specific functional reaction in an organ, tissue, or living organism (plural of stimulus).",
        "simpleMeaning": "Things that trigger a physical or mental reaction."
    },
    "minutiae": {
        "meaning": "The small, precise, or trivial details of something.",
        "simpleMeaning": "Tiny, precise details."
    },
    "norms": {
        "meaning": "Standards or patterns, especially of social behavior, that are typical or expected of a group.",
        "simpleMeaning": "Accepted social rules or standards."
    },
    "antics": {
        "meaning": "Foolish, outrageous, or amusing behavior.",
        "simpleMeaning": "Playful, funny, or silly actions."
    },
    "unsustainable": {
        "meaning": "Not able to be maintained at the current rate or level without exhausting natural resources or causing severe damage.",
        "simpleMeaning": "Cannot be continued long-term without harm."
    },
    "unsustainably": {
        "meaning": "In a way that cannot be continued at the same level or that damages the environment.",
        "simpleMeaning": "In a manner that harms the environment or future resources."
    },
    "sustainably": {
        "meaning": "In a way that can be maintained over time without depleting natural resources.",
        "simpleMeaning": "In an eco-friendly, lasting manner."
    },
    "unsettling": {
        "meaning": "Causing anxiety, distress, or unease; disturbing.",
        "simpleMeaning": "Disturbing or making someone uncomfortable."
    },
    "failed": {
        "meaning": "Not achieving success; unsuccessful in a specific endeavor or function.",
        "simpleMeaning": "Unsuccessful."
    },
    "bulk up": {
        "meaning": "To build muscle mass and increase one's body weight, typically through exercise and nutrition.",
        "simpleMeaning": "To gain muscle and body mass."
    },
    "glory in": {
        "meaning": "To take great pride or pleasure in something.",
        "simpleMeaning": "To feel deep joy or pride in something."
    },
    "side-step": {
        "meaning": "To avoid something tricky or difficult by stepping around it or evading it.",
        "simpleMeaning": "To avoid or bypass an issue."
    },
    "pertain to": {
        "meaning": "To be appropriate, related, or applicable to something.",
        "simpleMeaning": "To relate directly to something."
    },
    "apt to": {
        "meaning": "Having a natural tendency to do something; likely.",
        "simpleMeaning": "Likely or inclined to do something."
    },
    "burgeoning": {
        "meaning": "Beginning to grow or increase rapidly; flourishing.",
        "simpleMeaning": "Growing quickly and flourishing."
    },
    "attuned": {
        "meaning": "Accustomed to or receptive to particular sensations or ideas.",
        "simpleMeaning": "In harmony or aware of something."
    },
    "echolocate": {
        "meaning": "To locate objects by using reflected sound waves, as used by bats, dolphins, and certain technologies.",
        "simpleMeaning": "To find objects using reflected sound."
    },
    "fiddly": {
        "meaning": "Awkward to do or handle because of the small parts or delicate movements required.",
        "simpleMeaning": "Difficult and awkward to handle."
    },
    "sandwiched": {
        "meaning": "Inserted, squeezed, or compressed tightly between two other things or people.",
        "simpleMeaning": "Squeezed between two things."
    },
    "compromised": {
        "meaning": "Weakened, vulnerable, or brought into danger; having conceded to lower standards.",
        "simpleMeaning": "Weakened or made vulnerable."
    },
    "autonomously": {
        "meaning": "In a way that is independent and having the power to make your own decisions.",
        "simpleMeaning": "Independently without outside control."
    },
    "prolifically": {
        "meaning": "In a way that produces great quantities of work, fruit, or foliage.",
        "simpleMeaning": "Productively and in large amounts."
    },
    "kinetically": {
        "meaning": "In a way that relates to the motion of bodies and the forces associated with it.",
        "simpleMeaning": "Relating to movement and energy."
    },
    "hauntingly": {
        "meaning": "In a poignant, evocative, and deeply memorable way that stays in the mind.",
        "simpleMeaning": "Unforgettably and emotionally moving."
    },
    "compellingly": {
        "meaning": "In a way that captures attention and is very convincing or captivating.",
        "simpleMeaning": "In a powerful, convincing way."
    },
    "acrobatically": {
        "meaning": "In a manner characteristic of an acrobat; with agility, flexibility, and balance.",
        "simpleMeaning": "With impressive athletic agility."
    },
    "counterproductively": {
        "meaning": "In a way that has the opposite of the desired effect.",
        "simpleMeaning": "Working against the intended goal."
    },
    "improvisational": {
        "meaning": "Created or performed spontaneously without preparation.",
        "simpleMeaning": "Made up on the spot without planning."
    },
    "marketability": {
        "meaning": "The quality of being attractive, appealing, and easy to sell to buyers.",
        "simpleMeaning": "How easily a product can be sold."
    },
    "pressurization": {
        "meaning": "The act or process of maintaining normal atmospheric pressure in an enclosed space (like an aircraft cabin).",
        "simpleMeaning": "Keeping air pressure steady inside a cabin."
    },
    "caffeinate": {
        "meaning": "To supply or energize with caffeine.",
        "simpleMeaning": "To add caffeine to a beverage or body."
    },
    "demystification": {
        "meaning": "The act of making a difficult subject clearer and easier to understand.",
        "simpleMeaning": "Making a complex topic clear and simple."
    },
    "enabler": {
        "meaning": "A person or thing that makes something possible, or one who inadvertently encourages harmful behavior in others.",
        "simpleMeaning": "Someone or something that makes action possible."
    },
    "stultifyingly": {
        "meaning": "In a way that causes someone to feel bored, unenthusiastic, or mentally deadened.",
        "simpleMeaning": "Boringly and dulling to the mind."
    },
    "calamitously": {
        "meaning": "In a disastrous, devastating, and catastrophic manner.",
        "simpleMeaning": "Disastrously with terrible harm."
    },
    "tantalizingly": {
        "meaning": "In a way that excites hope, desire, or curiosity while keeping the object just out of reach.",
        "simpleMeaning": "Teasingly attractive yet out of reach."
    },
    "flatout": {
        "meaning": "As fast or as hard as possible; directly and completely.",
        "simpleMeaning": "Completely, directly, or at maximum speed."
    },
    "wordage": {
        "meaning": "The number of words used in a piece of writing, or verbal expression.",
        "simpleMeaning": "Word count or verbal phrasing."
    },
    "angsty": {
        "meaning": "Feeling or expressing persistent anxiety, dread, or teenage angst.",
        "simpleMeaning": "Filled with deep anxiety or emotional distress."
    },
    "promotable": {
        "meaning": "Suitable or ready to be promoted to a higher job rank or position.",
        "simpleMeaning": "Eligible for career promotion."
    },
    "cultish": {
        "meaning": "Resembling or characteristic of a cult; devotedly following a specific niche or trend.",
        "simpleMeaning": "Like a cult or obsessive follower group."
    },
    "unnervingly": {
        "meaning": "In a way that makes someone feel nervous, insecure, or troubled.",
        "simpleMeaning": "Disturbingly making someone uneasy."
    },
    "deviantly": {
        "meaning": "In a manner that departs from acceptable social or moral standards.",
        "simpleMeaning": "Differently from standard norms."
    },
    "choreographical": {
        "meaning": "Relating to the art or practice of designing dance sequences.",
        "simpleMeaning": "Relating to dance choreography."
    },
    "exaltedly": {
        "meaning": "In a noble, elevated, or intensely joyful and triumphant state.",
        "simpleMeaning": "In a joyful and elevated manner."
    },
    "squirmy": {
        "meaning": "Tending to writhe, squirm, or wiggle restlessly.",
        "simpleMeaning": "Wiggling and unable to sit still."
    },
    "confrontationally": {
        "meaning": "In an aggressive, argumentative, and defiant manner.",
        "simpleMeaning": "In an aggressive, argumentative way."
    },
    "histrionically": {
        "meaning": "In an overly theatrical, dramatic, or emotional manner.",
        "simpleMeaning": "Overly dramatically like an actor."
    },
    "emulsification": {
        "meaning": "The process of mixing two or more liquids that are normally unmixable (such as oil and water).",
        "simpleMeaning": "Blending oil and water into a stable mix."
    },
    "inchoately": {
        "meaning": "In a way that is just begun and not fully formed or developed; rudimentary.",
        "simpleMeaning": "In an early, undeveloped stage."
    },
    "amorphously": {
        "meaning": "Without a clearly defined shape or form; vaguely.",
        "simpleMeaning": "Without clear shape or structure."
    },
    "unfeasibly": {
        "meaning": "In a way that is not practical or likely to be achieved successfully.",
        "simpleMeaning": "Impractically or impossible to achieve."
    },
    "app": {
        "meaning": "An application or piece of software designed to fulfill a particular purpose, especially on mobile devices or computers.",
        "simpleMeaning": "A software application for phones or computers."
    },
    "aids": {
        "meaning": "Acquired Immune Deficiency Syndrome, a chronic and potentially life-threatening condition caused by the human immunodeficiency virus (HIV).",
        "simpleMeaning": "A serious viral disease affecting the immune system."
    },
    "online": {
        "meaning": "Connected to or available through a computer network, especially the internet.",
        "simpleMeaning": "Connected to the internet."
    },
    "offline": {
        "meaning": "Not connected to or functioning on a computer network or the internet.",
        "simpleMeaning": "Not connected to the internet."
    },
    "website": {
        "meaning": "A set of related web pages located under a single domain name, published by a person or organization.",
        "simpleMeaning": "A site or page on the World Wide Web."
    },
    "webpage": {
        "meaning": "A hypertext document on the World Wide Web accessible via a web browser.",
        "simpleMeaning": "A single page on the internet."
    },
    "smartphone": {
        "meaning": "A mobile phone that performs many functions of a computer, having a touchscreen interface and internet access.",
        "simpleMeaning": "A modern mobile phone with internet and apps."
    },
    "laptop": {
        "meaning": "A portable computer suitable for use while traveling and consisting of a hinged screen and keyboard.",
        "simpleMeaning": "A portable computer."
    },
    "wifi": {
        "meaning": "A facility allowing computers, smartphones, or other devices to connect to the internet or communicate with one another wirelessly within a particular area.",
        "simpleMeaning": "Wireless internet access."
    },
    "email": {
        "meaning": "Messages distributed by electronic means from one computer user to one or more recipients via a network.",
        "simpleMeaning": "Electronic mail sent over the internet."
    },
    "internet": {
        "meaning": "A global computer network providing a variety of information and communication facilities.",
        "simpleMeaning": "The global network connecting computers worldwide."
    },
    "download": {
        "meaning": "To copy data from one computer system to another, typically over the internet.",
        "simpleMeaning": "To save a file from the internet to your device."
    },
    "upload": {
        "meaning": "To transfer data from one computer or device to a central system or network.",
        "simpleMeaning": "To send a file from your device to the internet."
    },
    "software": {
        "meaning": "The programs and other operating information used by a computer.",
        "simpleMeaning": "Computer programs and apps."
    },
    "hardware": {
        "meaning": "The physical parts of a computer system and related devices.",
        "simpleMeaning": "Physical equipment of a computer."
    },
    "blog": {
        "meaning": "A regularly updated website or web page, typically run by an individual or small group, written in an informal or conversational style.",
        "simpleMeaning": "An online journal or article site."
    },
    "podcast": {
        "meaning": "A digital audio file made available on the internet for downloading to a computer or mobile device.",
        "simpleMeaning": "An episodic audio program on the internet."
    },
    "any more": {
        "meaning": "Any longer; to any further extent or degree (used with negative words or in questions).",
        "simpleMeaning": "No longer or anymore."
    },
    "a": {
        "meaning": "Used to refer to one person or thing that has not been mentioned before, or is one of a group.",
        "simpleMeaning": "One single person or thing."
    },
    "an": {
        "meaning": "The form of the indefinite article 'a' used before words beginning with a vowel sound.",
        "simpleMeaning": "A single item, used before vowel sounds."
    },
    "the": {
        "meaning": "Denoting one or more people or things already mentioned, known, or uniquely specified.",
        "simpleMeaning": "Specific person, place, or thing already known."
    },
    "and": {
        "meaning": "Used to connect words of the same part of speech, clauses, or sentences that are to be taken jointly.",
        "simpleMeaning": "Together with or in addition to."
    },
    "or": {
        "meaning": "Used to link alternatives or different options.",
        "simpleMeaning": "Indicating a choice between options."
    },
    "but": {
        "meaning": "Used to introduce a phrase or clause contrasting with what has already been mentioned.",
        "simpleMeaning": "However, or introducing a contrast."
    },
    "of": {
        "meaning": "Expressing the relationship between a part and a whole, or belonging to someone or something.",
        "simpleMeaning": "Belonging to or part of something."
    },
    "to": {
        "meaning": "Expressing motion in the direction of a particular location, person, or thing.",
        "simpleMeaning": "In the direction of or toward."
    },
    "in": {
        "meaning": "Expressing the situation of something that is or appears to be enclosed or surrounded by something else.",
        "simpleMeaning": "Inside or within an area or object."
    },
    "for": {
        "meaning": "With the purpose or goal of; intended to belong to, or in support of.",
        "simpleMeaning": "Intended to help, support, or reach a purpose."
    },
    "on": {
        "meaning": "Physically in contact with and supported by a surface.",
        "simpleMeaning": "Positioned upon a surface."
    },
    "at": {
        "meaning": "Expressing location or arrival in a particular place or position.",
        "simpleMeaning": "In, on, or near a specific location or time."
    },
    "by": {
        "meaning": "Identifying the agent performing an action, or indicating proximity or means.",
        "simpleMeaning": "Through the action of, or near."
    },
    "with": {
        "meaning": "Accompanied by another person or thing; having or possessing.",
        "simpleMeaning": "Together with or accompanied by."
    },
    "from": {
        "meaning": "Indicating the point in space or time at which an action, process, or journey starts.",
        "simpleMeaning": "Starting at a place, time, or source."
    },
    "as": {
        "meaning": "Used to indicate that something happens during the time when something else is taking place, or in the role of.",
        "simpleMeaning": "While, or in the role or character of."
    },
    "associated": {
        "meaning": "Connected with something else in thought, memory, or operation; united in a business relationship.",
        "simpleMeaning": "Connected or linked with something."
    }
}

def clean_webster_def(text):
    if not text:
        return ""
    # Remove leading numbers like 1. or 2.
    text = re.sub(r"^\s*\d+\.\s*", "", text).strip()
    # Remove citations like Bouvier., Chaucer., Shak., etc.
    text = re.sub(r"\b(Shak|Milton|Dryden|Pope|Chaucer|Cowper|Addison|Swift|Tennyson|Bacon|Locke|Burke)\b\.", "", text)
    # Remove [Obs.], [R.], etc.
    text = re.sub(r"\[(?:Obs|R|Archaic|Colloq|Naut|Bot|Zool|Anat|Med|Law)\.?\]", "", text, flags=re.I)
    # Remove multiple spaces/newlines
    text = re.sub(r"\s+", " ", text).strip()
    # Split on first semicolon or period if too long
    sentences = re.split(r"[;\.]\s+", text)
    if sentences:
        first = sentences[0].strip()
        if len(first) > 15:
            # Capitalize first letter
            return first[0].upper() + first[1:] + "."
    return text[:200].strip()

def download_file(url, target_path):
    if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
        return
    print(f"Downloading {url} -> {target_path}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp, open(target_path, "wb") as f:
        f.write(resp.read())

def main():
    print("Step 1: Downloading Webster dictionary...")
    webster_path = os.path.join(CACHE_DIR, "webster.json")
    download_file(WEBSTER_URL, webster_path)
    with open(webster_path, "r", encoding="utf-8") as f:
        webster = json.load(f)
    print("Webster entries:", len(webster))

    print("Step 2: Downloading WordSet letter dictionaries...")
    wordset_data = {}
    for letter in string.ascii_lowercase:
        letter_path = os.path.join(CACHE_DIR, f"wordset_{letter}.json")
        letter_url = f"{WORDSET_BASE}/{letter}.json"
        try:
            download_file(letter_url, letter_path)
            with open(letter_path, "r", encoding="utf-8") as f:
                wordset_data[letter] = json.load(f)
        except Exception as e:
            print(f"Warning on letter {letter}: {e}")

    print(f"Loaded {len(wordset_data)} WordSet letter buckets.")

    print("Step 3: Loading oxford-5000.json...")
    with open("public/oxford-5000.json", "r", encoding="utf-8") as f:
        words = json.load(f)
    print(f"Total words to enrich: {len(words)}")

    matched_wordset = 0
    matched_modern = 0
    matched_webster = 0
    fallback_count = 0

    for item in words:
        raw_word = item.get("word", "").strip()
        word_lower = raw_word.lower()
        pos = item.get("partOfSpeech", "").lower()
        first_char = word_lower[0] if word_lower else "a"

        found_def = None
        found_simple = None

        # Generate search candidates (handling slashes, hyphens, -ise/-ize, plurals, adverbs)
        candidates = [word_lower, raw_word]
        if "/" in word_lower:
            parts = [p.strip() for p in word_lower.split("/") if p.strip()]
            candidates.extend(parts)
        if "-" in word_lower:
            candidates.append(word_lower.replace("-", " "))
            candidates.append(word_lower.replace("-", ""))
        # British / American variants
        if "ise" in word_lower:
            candidates.append(word_lower.replace("ise", "ize"))
        if "isation" in word_lower:
            candidates.append(word_lower.replace("isation", "ization"))
        if "our" in word_lower:
            candidates.append(word_lower.replace("our", "or"))
        if "re" == word_lower[-2:]:
            candidates.append(word_lower[:-2] + "er")
        # Common suffixes
        if word_lower.endswith("ly") and len(word_lower) > 4:
            candidates.append(word_lower[:-2])
            candidates.append(word_lower[:-2] + "e")
            candidates.append(word_lower[:-3] + "ic")
        if word_lower.endswith("ed") and len(word_lower) > 4:
            candidates.append(word_lower[:-2])
            candidates.append(word_lower[:-1])
        if word_lower.endswith("ing") and len(word_lower) > 5:
            candidates.append(word_lower[:-3])
            candidates.append(word_lower[:-3] + "e")
        if word_lower.endswith("s") and len(word_lower) > 3:
            candidates.append(word_lower[:-1])

        # 1. Check modern terms first
        for cand in candidates:
            if cand in MODERN_TERMS:
                found_def = MODERN_TERMS[cand]["meaning"]
                found_simple = MODERN_TERMS[cand]["simpleMeaning"]
                matched_modern += 1
                break

        # 2. Check Wordset
        if not found_def:
            for cand in candidates:
                cand_fc = cand[0] if cand else "a"
                if cand_fc in wordset_data:
                    bucket = wordset_data[cand_fc]
                    entry = bucket.get(cand) or bucket.get(cand.capitalize())
                    if entry and entry.get("meanings"):
                        meanings = entry["meanings"]
                        chosen_m = meanings[0]
                        for m in meanings:
                            if m.get("speech_part", "").lower() == pos:
                                chosen_m = m
                                break
                        
                        raw_def = chosen_m.get("def", "").strip()
                        if raw_def:
                            # If derived from adverb / adjective, format naturally
                            if word_lower.endswith("ly") and cand != word_lower:
                                found_def = f"In a {cand} manner; characterized by being {cand}."
                                found_simple = f"In a {cand} way."
                            else:
                                found_def = raw_def[0].upper() + raw_def[1:]
                                if not found_def.endswith("."):
                                    found_def += "."
                                
                                syns = [str(s) for s in chosen_m.get("synonyms", []) if s]
                                if len(meanings) > 1 and meanings[1].get("def"):
                                    m2 = meanings[1]["def"]
                                    found_simple = m2[0].upper() + m2[1:]
                                    if not found_simple.endswith("."):
                                        found_simple += "."
                                elif syns:
                                    found_simple = f"Similar to: {', '.join(syns[:3])}."
                                else:
                                    found_simple = found_def
                            matched_wordset += 1
                            break

        # 3. Check Webster
        if not found_def:
            for cand in candidates:
                w_raw = (
                    webster.get(cand)
                    or webster.get(cand.capitalize())
                    or webster.get(cand.upper())
                )
                if w_raw:
                    cleaned = clean_webster_def(w_raw)
                    if cleaned and len(cleaned) > 10:
                        found_def = cleaned
                        found_simple = cleaned
                        matched_webster += 1
                        break

        # 4. Fallback if still not found
        if not found_def:
            found_def = f"Denoting or pertaining to {raw_word}."
            found_simple = f"Meaning of '{raw_word}'."
            fallback_count += 1

        # Update item
        item["meaning"] = found_def
        item["simpleMeaning"] = found_simple

    print("=" * 50)
    print("ENRICHMENT RESULTS:")
    print(f"Matched in WordSet: {matched_wordset} ({matched_wordset*100/len(words):.1f}%)")
    print(f"Matched in Webster: {matched_webster} ({matched_webster*100/len(words):.1f}%)")
    print(f"Matched in Modern/Manual: {matched_modern} ({matched_modern*100/len(words):.1f}%)")
    print(f"Total authentic definitions: {matched_wordset + matched_webster + matched_modern} ({(matched_wordset + matched_webster + matched_modern)*100/len(words):.1f}%)")
    print(f"Fallback count: {fallback_count}")
    print("=" * 50)

    # Write back enriched oxford-5000.json
    with open("public/oxford-5000.json", "w", encoding="utf-8") as f:
        json.dump(words, f, indent=2, ensure_ascii=False)
    print("Saved enriched public/oxford-5000.json successfully!")

if __name__ == "__main__":
    main()
