import json
import os

# 105 Essential English Grammar Rules and Topics across CEFR Levels A1 - C1
grammar_topics = [
    # ==================== CEFR A1 (Beginner - 25 Topics) ====================
    {
        "word": "Verb 'To Be' (am, is, are)",
        "meaning": "Subject + am/is/are | Identifies identity, state, age, origin, and characteristics.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + am/is/are + Complement]",
        "exampleSentence": "I am a student and she is my teacher.",
        "exampleSentences": [
            "I am a student and she is my teacher.",
            "They are from Spain.",
            "Are you ready for class?"
        ]
    },
    {
        "word": "Simple Present: Positive",
        "meaning": "Subject + Verb (base / -s/-es) | Used for daily routines, permanent situations, and facts.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + V1 / V1+s/es]",
        "exampleSentence": "She works at a bank and drinks coffee every morning.",
        "exampleSentences": [
            "She works at a bank and drinks coffee every morning.",
            "Water boils at 100 degrees Celsius.",
            "They live in London."
        ]
    },
    {
        "word": "Simple Present: Negative & Questions",
        "meaning": "Do/Does + not + V1 | Used to negate routines or ask questions with 'do' or 'does'.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Do / Does + Sub + V1?]",
        "exampleSentence": "He does not like spicy food. Do you speak English?",
        "exampleSentences": [
            "He does not like spicy food. Do you speak English?",
            "Where does your brother work?",
            "We do not have class on Sundays."
        ]
    },
    {
        "word": "Present Continuous (am/is/are + -ing)",
        "meaning": "Subject + am/is/are + Verb-ing | Describes actions happening right now at the moment of speaking.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + am/is/are + V-ing]",
        "exampleSentence": "Please be quiet, the baby is sleeping right now.",
        "exampleSentences": [
            "Please be quiet, the baby is sleeping right now.",
            "What are you watching on television?",
            "It is raining heavily outside."
        ]
    },
    {
        "word": "Indefinite Articles: A vs An",
        "meaning": "Use 'a' before consonant sounds and 'an' before vowel sounds (a, e, i, o, u sounds) for singular nouns.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[a + consonant sound | an + vowel sound]",
        "exampleSentence": "I need an apple and a bottle of water.",
        "exampleSentences": [
            "I need an apple and a bottle of water.",
            "She wants to become an architect.",
            "He has a university degree."
        ]
    },
    {
        "word": "Definite Article: The",
        "meaning": "Used when both the speaker and listener know the specific person, place, or thing being referred to.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[the + specific noun]",
        "exampleSentence": "Could you please pass me the salt on the table?",
        "exampleSentences": [
            "Could you please pass me the salt on the table?",
            "The sun rises in the east.",
            "I met a doctor; the doctor was very helpful."
        ]
    },
    {
        "word": "Demonstratives: This, That, These, Those",
        "meaning": "This/These indicate nearby items; That/Those indicate distant items in space or time.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[this/that (singular) | these/those (plural)]",
        "exampleSentence": "This book here is mine, but that one over there is yours.",
        "exampleSentences": [
            "This book here is mine, but that one over there is yours.",
            "These shoes are comfortable.",
            "Who are those people standing outside?"
        ]
    },
    {
        "word": "Subject Pronouns (I, you, he, she, it, we, they)",
        "meaning": "Pronouns that perform the action of the verb in a sentence.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Subject position before verb]",
        "exampleSentence": "We invited Sarah, but she was busy.",
        "exampleSentences": [
            "We invited Sarah, but she was busy.",
            "They arrived early at the station.",
            "It is cold outside today."
        ]
    },
    {
        "word": "Object Pronouns (me, you, him, her, it, us, them)",
        "meaning": "Pronouns that receive the action of a verb or preposition.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Verb / Preposition + me/you/him/her/it/us/them]",
        "exampleSentence": "Can you give him the message when you see him?",
        "exampleSentences": [
            "Can you give him the message when you see him?",
            "She called us yesterday evening.",
            "Listen to me carefully."
        ]
    },
    {
        "word": "Possessive Adjectives (my, your, his, her, its, our, their)",
        "meaning": "Words placed before nouns to show ownership or relationship.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Possessive + Noun]",
        "exampleSentence": "Our family visited their house last weekend.",
        "exampleSentences": [
            "Our family visited their house last weekend.",
            "His phone is ringing.",
            "Where did you leave your coat?"
        ]
    },
    {
        "word": "Possessive 's and s'",
        "meaning": "Add 's to singular nouns and an apostrophe ' to regular plural nouns ending in -s to show possession.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Noun + 's / Plural noun + ']",
        "exampleSentence": "That is David's car, and this is the teachers' lounge.",
        "exampleSentences": [
            "That is David's car, and this is the teachers' lounge.",
            "My sister's bag is on the sofa.",
            "The children's toys are everywhere."
        ]
    },
    {
        "word": "Regular Plural Nouns (-s, -es, -ies)",
        "meaning": "Add -s to most nouns, -es after s, x, ch, sh, and change -y to -ies after a consonant.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Noun + -s / -es / -ies]",
        "exampleSentence": "She bought three boxes of strawberries and two watches.",
        "exampleSentences": [
            "She bought three boxes of strawberries and two watches.",
            "The city has many beautiful parks.",
            "Put the glasses in the cabinet."
        ]
    },
    {
        "word": "Irregular Plural Nouns",
        "meaning": "Nouns that do not form plurals with -s (e.g., man/men, child/children, tooth/teeth, foot/feet, mouse/mice).",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[child -> children, person -> people]",
        "exampleSentence": "Many people and young children attended the concert.",
        "exampleSentences": [
            "Many people and young children attended the concert.",
            "He needs to visit the dentist for his teeth.",
            "Two men helped us move the furniture."
        ]
    },
    {
        "word": "There is vs There are",
        "meaning": "Use 'there is' with singular nouns and uncountable nouns; use 'there are' with plural countable nouns.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[There is + Sing/Uncountable | There are + Plural]",
        "exampleSentence": "There is a coffee shop nearby and there are several chairs outside.",
        "exampleSentences": [
            "There is a coffee shop nearby and there are several chairs outside.",
            "Is there any milk left in the fridge?",
            "Are there any questions before we begin?"
        ]
    },
    {
        "word": "Simple Past: Regular Verbs (-ed)",
        "meaning": "Subject + Verb-ed | Completed actions that happened at a specific time in the past.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + V1+ed]",
        "exampleSentence": "We walked in the park and watched a movie yesterday.",
        "exampleSentences": [
            "We walked in the park and watched a movie yesterday.",
            "She started learning Spanish last month.",
            "They arrived in Paris on Tuesday."
        ]
    },
    {
        "word": "Simple Past: Common Irregular Verbs",
        "meaning": "Subject + V2 | Verbs with unique past forms (went, saw, had, came, took, bought, ate, said).",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[go -> went, see -> saw, buy -> bought]",
        "exampleSentence": "She went to the market and bought fresh fruit.",
        "exampleSentences": [
            "She went to the market and bought fresh fruit.",
            "I saw an old friend yesterday.",
            "He had breakfast at 8 AM."
        ]
    },
    {
        "word": "Simple Past: Negative & Questions (Did / Didn't)",
        "meaning": "Did + Subject + V1 (base form)? / Subject + didn't + V1 | Used for questions and negatives in the past.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Did + Sub + V1? | Sub + didn't + V1]",
        "exampleSentence": "Did you lock the door? No, I didn't lock it.",
        "exampleSentences": [
            "Did you lock the door? No, I didn't lock it.",
            "Where did you go last weekend?",
            "She didn't hear the alarm clock."
        ]
    },
    {
        "word": "Modal Verb: Can & Can't (Ability & Permission)",
        "meaning": "Subject + can/can't + V1 (base form) | Expresses physical ability, learned skill, or permission.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + can/can't + base verb]",
        "exampleSentence": "She can speak three languages fluently, but she can't swim.",
        "exampleSentences": [
            "She can speak three languages fluently, but she can't swim.",
            "Can I borrow your pen for a moment?",
            "We can finish this project by tomorrow."
        ]
    },
    {
        "word": "Future with 'Going to'",
        "meaning": "Subject + am/is/are + going to + V1 | Used for planned future intentions and predictions based on present evidence.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[am/is/are + going to + V1]",
        "exampleSentence": "Look at those dark clouds; it is going to rain.",
        "exampleSentences": [
            "Look at those dark clouds; it is going to rain.",
            "I am going to visit my grandparents this weekend.",
            "What are you going to do after work?"
        ]
    },
    {
        "word": "Adverbs of Frequency (always, usually, often, sometimes, never)",
        "meaning": "Placed before main verbs but after the verb 'to be' to indicate how often an action happens.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + Adverb + Verb | Sub + to be + Adverb]",
        "exampleSentence": "He always wakes up at 6 AM, and he is never late for work.",
        "exampleSentences": [
            "He always wakes up at 6 AM, and he is never late for work.",
            "We usually eat dinner together as a family.",
            "I sometimes take the subway instead of driving."
        ]
    },
    {
        "word": "Question Words (Who, What, Where, When, Why, How)",
        "meaning": "Words placed at the beginning of open-ended questions to request specific information.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Wh- word + Auxiliary + Subject + Main Verb?]",
        "exampleSentence": "Where do you work and how do you get there?",
        "exampleSentences": [
            "Where do you work and how do you get there?",
            "Why is the train delayed today?",
            "Who is that person talking to Sarah?"
        ]
    },
    {
        "word": "Imperatives (Commands & Instructions)",
        "meaning": "Base verb used directly without a subject for commands, directions, warnings, and polite instructions with 'please'.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Base Verb + Object! / Don't + Base Verb!]",
        "exampleSentence": "Please open the window and take a deep breath.",
        "exampleSentences": [
            "Please open the window and take a deep breath.",
            "Don't touch that hot pan!",
            "Turn left at the next traffic light."
        ]
    },
    {
        "word": "Countable vs Uncountable Nouns",
        "meaning": "Countable nouns can be counted with numbers (books, chairs); uncountable nouns cannot (water, advice, money).",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Countable: a book / two books | Uncountable: water / some water]",
        "exampleSentence": "She ordered two coffees and a glass of warm milk.",
        "exampleSentences": [
            "She ordered two coffees and a glass of warm milk.",
            "Can you give me some advice on this topic?",
            "We don't have much time before the meeting."
        ]
    },
    {
        "word": "Quantifiers: Some vs Any",
        "meaning": "Use 'some' in positive statements and polite offers; use 'any' in negative statements and general questions.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[some (+) / offers | any (-) / questions (?)]",
        "exampleSentence": "Do you have any apples? Yes, I have some in the basket.",
        "exampleSentences": [
            "Do you have any apples? Yes, I have some in the basket.",
            "Would you like some tea?",
            "There aren't any tickets left for the show."
        ]
    },
    {
        "word": "Basic Conjunctions: And, But, Or, Because",
        "meaning": "And connects similar ideas; But introduces a contrast; Or gives alternatives; Because gives reasons.",
        "cefrLevel": "A1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Clause + and / but / or / because + Clause]",
        "exampleSentence": "I was tired, but I finished the report because it was urgent.",
        "exampleSentences": [
            "I was tired, but I finished the report because it was urgent.",
            "Would you like coffee or tea?",
            "She stayed home and read a book."
        ]
    },

    # ==================== CEFR A2 (Elementary - 25 Topics) ====================
    {
        "word": "Past Continuous (was/were + -ing)",
        "meaning": "Subject + was/were + V-ing | Describes actions in progress at a specific moment in the past or interrupted by another action.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + was/were + V-ing]",
        "exampleSentence": "I was studying in my room when the power went out.",
        "exampleSentences": [
            "I was studying in my room when the power went out.",
            "What were you doing at 8 PM yesterday?",
            "They were having dinner when the guests arrived."
        ]
    },
    {
        "word": "Present Perfect: Life Experience (have/has + V3)",
        "meaning": "Subject + have/has + past participle | Used with 'ever' and 'never' to talk about experiences at unspecified times in life.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + have/has + V3]",
        "exampleSentence": "Have you ever visited Tokyo? No, I have never been to Japan.",
        "exampleSentences": [
            "Have you ever visited Tokyo? No, I have never been to Japan.",
            "She has seen that movie three times.",
            "We have traveled to many different countries."
        ]
    },
    {
        "word": "Present Perfect with Just, Already, and Yet",
        "meaning": "Just = very recently; Already = sooner than expected; Yet = until now (in negatives and questions at clause end).",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[have just/already + V3 | haven't + V3 + yet]",
        "exampleSentence": "I have already finished my work, but he hasn't arrived yet.",
        "exampleSentences": [
            "I have already finished my work, but he hasn't arrived yet.",
            "She has just received the good news.",
            "Have you submitted the application yet?"
        ]
    },
    {
        "word": "Present Perfect vs Simple Past",
        "meaning": "Use Simple Past for finished past actions with specific time words (yesterday, in 2020); use Present Perfect for unfinished time or connected results.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Simple Past + finished time | Present Perfect + unspecified time]",
        "exampleSentence": "I lost my key (I don't have it now). I lost my key yesterday, but found it.",
        "exampleSentences": [
            "I have visited France twice. I visited Paris last summer.",
            "Did you see Tom this morning? Have you seen Tom today?",
            "She lived in Rome for two years, but now lives in Madrid."
        ]
    },
    {
        "word": "Comparative Adjectives (-er / more ... than)",
        "meaning": "Short adjectives add -er (taller); long adjectives use 'more' (more comfortable) to compare two things.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Adj-er than | more Adj than]",
        "exampleSentence": "This laptop is faster and more reliable than my old one.",
        "exampleSentences": [
            "This laptop is faster and more reliable than my old one.",
            "Summer in Athens is hotter than in London.",
            "Public transport is cheaper than driving."
        ]
    },
    {
        "word": "Superlative Adjectives (the -est / the most ...)",
        "meaning": "Used to describe the extreme degree among three or more items (the tallest, the most interesting).",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[the Adj-est | the most Adj]",
        "exampleSentence": "Mount Everest is the highest mountain in the world.",
        "exampleSentences": [
            "Mount Everest is the highest mountain in the world.",
            "This is the most exciting book I have ever read.",
            "She is the youngest member of the research team."
        ]
    },
    {
        "word": "Comparisons of Equality: As ... As",
        "meaning": "As + adjective/adverb + as | Shows that two people, things, or actions are equal or unequal with 'not as ... as'.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[as + adjective + as | not as + adjective + as]",
        "exampleSentence": "He is not as tall as his older brother.",
        "exampleSentences": [
            "He is not as tall as his older brother.",
            "The movie was just as entertaining as the book.",
            "I can run as fast as you can."
        ]
    },
    {
        "word": "Simple Future with 'Will'",
        "meaning": "Subject + will + V1 | Used for spontaneous decisions made at the moment of speaking, promises, offers, and future predictions.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + will / won't + V1]",
        "exampleSentence": "Don't carry that heavy bag alone; I will help you.",
        "exampleSentences": [
            "Don't carry that heavy bag alone; I will help you.",
            "I promise I won't forget to call you.",
            "Experts think the economy will grow next year."
        ]
    },
    {
        "word": "Modal Verbs: Must & Have To (Obligation)",
        "meaning": "Must expresses strong personal obligation; Have to expresses external rules, laws, or company requirements.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[must + V1 | have/has to + V1]",
        "exampleSentence": "All passengers must fasten their seatbelts during takeoff.",
        "exampleSentences": [
            "All passengers must fasten their seatbelts during takeoff.",
            "I have to wake up early tomorrow for an interview.",
            "You must not park your vehicle in front of the gate."
        ]
    },
    {
        "word": "Modal Verbs: Don't Have To vs Mustn't",
        "meaning": "Don't have to = lack of necessity (optional); Mustn't = strict prohibition (forbidden).",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[don't have to = not required | mustn't = forbidden]",
        "exampleSentence": "Tomorrow is a holiday, so you don't have to set an alarm.",
        "exampleSentences": [
            "Tomorrow is a holiday, so you don't have to set an alarm.",
            "You mustn't smoke inside the hospital.",
            "Visitors don't have to pay for parking on Sundays."
        ]
    },
    {
        "word": "Modal Verb: Should & Shouldn't (Advice)",
        "meaning": "Subject + should / shouldn't + V1 | Used to give recommendations, suggestions, or sensible advice.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + should / shouldn't + V1]",
        "exampleSentence": "You look exhausted; you should take a rest and drink some water.",
        "exampleSentences": [
            "You look exhausted; you should take a rest and drink some water.",
            "You shouldn't skip breakfast before a long exam.",
            "What should I wear to the job interview?"
        ]
    },
    {
        "word": "Zero Conditional (General Truths)",
        "meaning": "If / When + Present Simple, Present Simple | Used for universal facts, scientific rules, and natural habits.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[If + Present Simple, ... Present Simple]",
        "exampleSentence": "If you heat ice, it melts into water.",
        "exampleSentences": [
            "If you heat ice, it melts into water.",
            "When the sun sets, the temperature drops quickly.",
            "If people don't get enough sleep, they feel irritable."
        ]
    },
    {
        "word": "First Conditional (Real Future Possibility)",
        "meaning": "If + Present Simple, will + base verb | Used for possible situations in the present or future and their real results.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[If + Present Simple, ... will + V1]",
        "exampleSentence": "If it rains tomorrow, we will postpone the outdoor picnic.",
        "exampleSentences": [
            "If it rains tomorrow, we will postpone the outdoor picnic.",
            "If you practice every day, your English will improve rapidly.",
            "What will you do if you miss the morning bus?"
        ]
    },
    {
        "word": "Quantifiers: Much, Many, and A Lot Of",
        "meaning": "Many + countable nouns; Much + uncountable nouns (mostly in negatives/questions); A lot of + both in positive statements.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[many + plural nouns | much + uncountable nouns]",
        "exampleSentence": "We don't have much milk, but we have many oranges.",
        "exampleSentences": [
            "We don't have much milk, but we have many oranges.",
            "She has a lot of interesting ideas for the project.",
            "How many people are attending the conference?"
        ]
    },
    {
        "word": "Quantifiers: Few vs A Few, Little vs A Little",
        "meaning": "'A few' / 'A little' have a positive meaning (some); 'Few' / 'Little' without 'a' mean almost none (negative tone).",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[a few / a little = positive (enough) | few / little = negative (scarce)]",
        "exampleSentence": "I have a few close friends who live nearby.",
        "exampleSentences": [
            "I have a few close friends who live nearby.",
            "Unfortunately, very few people attended the lecture.",
            "Add a little sugar to the cake batter."
        ]
    },
    {
        "word": "Possessive Pronouns (mine, yours, his, hers, ours, theirs)",
        "meaning": "Stand alone without a noun to replace a possessive adjective + noun combination.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[mine, yours, his, hers, ours, theirs]",
        "exampleSentence": "That jacket looks like mine, but it is actually hers.",
        "exampleSentences": [
            "That jacket looks like mine, but it is actually hers.",
            "Our house is smaller than theirs.",
            "Is this cup yours or his?"
        ]
    },
    {
        "word": "Reflexive Pronouns (myself, yourself, himself, herself, etc.)",
        "meaning": "Used when the subject and the object of the verb are the exact same person or thing.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Subject and Object are the same entity]",
        "exampleSentence": "He cut himself while chopping vegetables in the kitchen.",
        "exampleSentences": [
            "He cut himself while chopping vegetables in the kitchen.",
            "She taught herself how to write computer code.",
            "Make yourselves at home, everyone."
        ]
    },
    {
        "word": "Relative Pronouns: Who, Which, That",
        "meaning": "Who refers to people; Which refers to things and animals; That can refer to both people and things in defining clauses.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Noun + who/which/that + clause]",
        "exampleSentence": "The teacher who helped me yesterday is very experienced.",
        "exampleSentences": [
            "The teacher who helped me yesterday is very experienced.",
            "This is the book that inspired my career.",
            "The restaurant which opened last week serves delicious food."
        ]
    },
    {
        "word": "Gerunds as Subjects and Objects",
        "meaning": "Verb + -ing acting as a noun in subject or object positions (e.g., 'Swimming is fun', 'I enjoy reading').",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[V-ing as Noun]",
        "exampleSentence": "Learning a new language opens up incredible career opportunities.",
        "exampleSentences": [
            "Learning a new language opens up incredible career opportunities.",
            "She avoids eating sugary snacks before bedtime.",
            "Exercising regularly keeps your heart healthy."
        ]
    },
    {
        "word": "Verbs Followed by Gerunds vs Infinitives",
        "meaning": "Some verbs take gerunds (enjoy, avoid, mind), some take infinitives (hope, decide, promise), and some take both with meaning differences.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[enjoy doing | decide to do]",
        "exampleSentence": "They decided to travel to Italy after finishing their exams.",
        "exampleSentences": [
            "They decided to travel to Italy after finishing their exams.",
            "Do you mind waiting for a few minutes?",
            "She promised to call me as soon as she landed."
        ]
    },
    {
        "word": "Used To (Past Habits & States)",
        "meaning": "Subject + used to + V1 | Refers to habits, routines, or states in the past that are no longer true today.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + used to + V1]",
        "exampleSentence": "I used to live in a small village, but now I live in the city.",
        "exampleSentences": [
            "I used to live in a small village, but now I live in the city.",
            "Did you use to play the piano when you were younger?",
            "He didn't use to drink tea, but now he loves it."
        ]
    },
    {
        "word": "So vs Such (Emphasis)",
        "meaning": "So + adjective / adverb; Such + (a/an) + adjective + noun | Used to emphasize quality or degree.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[so + adj | such a/an + adj + noun]",
        "exampleSentence": "The weather was so cold, and it was such a windy day.",
        "exampleSentences": [
            "The weather was so cold, and it was such a windy day.",
            "He spoke so quietly that nobody could hear him.",
            "They are such friendly neighbors."
        ]
    },
    {
        "word": "Too vs Enough",
        "meaning": "'Too' means more than necessary (too hot); 'Enough' means sufficient (placed after adjectives: warm enough; before nouns: enough money).",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[too + adj | adj + enough | enough + noun]",
        "exampleSentence": "The coffee is too hot to drink, and I don't have enough time to wait.",
        "exampleSentences": [
            "The coffee is too hot to drink, and I don't have enough time to wait.",
            "Is the room warm enough for you?",
            "He isn't old enough to drive a car yet."
        ]
    },
    {
        "word": "Prepositions of Place: In, On, At",
        "meaning": "'At' for specific points (at the door, at home); 'On' for surfaces and streets; 'In' for enclosed areas, cities, and countries.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[at a point | on a surface | in an enclosed area]",
        "exampleSentence": "She lives in Berlin, on Oxford Street, and works at a university.",
        "exampleSentences": [
            "She lives in Berlin, on Oxford Street, and works at a university.",
            "The keys are on the kitchen table.",
            "Wait for me at the entrance of the metro."
        ]
    },
    {
        "word": "Prepositions of Time: In, On, At",
        "meaning": "'At' for precise clock times and holidays; 'On' for days and dates; 'In' for months, years, seasons, and periods of the day.",
        "cefrLevel": "A2",
        "partOfSpeech": "grammar",
        "pronunciation": "[at 5 PM / at night | on Monday / on May 5th | in summer / in 2024]",
        "exampleSentence": "The semester starts in September, on a Monday, at 9:00 AM.",
        "exampleSentences": [
            "The semester starts in September, on a Monday, at 9:00 AM.",
            "I usually go jogging in the morning.",
            "We always exchange gifts at Christmas."
        ]
    },

    # ==================== CEFR B1 (Intermediate - 25 Topics) ====================
    {
        "word": "Present Perfect Continuous (have/has been + -ing)",
        "meaning": "Subject + have/has been + V-ing | Emphasizes the duration of an action that started in the past and is still ongoing or just stopped with visible results.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + have/has been + V-ing]",
        "exampleSentence": "I have been working on this software architecture since 8 AM.",
        "exampleSentences": [
            "I have been working on this software architecture since 8 AM.",
            "Why are your clothes dirty? I have been painting the garage.",
            "She has been studying English for over three years."
        ]
    },
    {
        "word": "Present Perfect with 'For' and 'Since'",
        "meaning": "'For' indicates a duration of time (for three hours, for two years); 'Since' marks a specific starting point in time (since 2018, since Monday).",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[for + duration | since + point in time]",
        "exampleSentence": "They have lived in Singapore for five years, ever since 2019.",
        "exampleSentences": [
            "They have lived in Singapore for five years, ever since 2019.",
            "I haven't seen Marcus since our graduation ceremony.",
            "She has worked at the hospital for six months."
        ]
    },
    {
        "word": "Past Perfect Simple (had + V3)",
        "meaning": "Subject + had + past participle | Describes an action completed before another past event or past time point.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + had + V3]",
        "exampleSentence": "When we reached the cinema, the movie had already started.",
        "exampleSentences": [
            "When we reached the cinema, the movie had already started.",
            "She realized she had left her passport on the dining table.",
            "He had never flown in an airplane before that trip."
        ]
    },
    {
        "word": "Past Perfect Continuous (had been + -ing)",
        "meaning": "Subject + had been + V-ing | Emphasizes the continuous duration of an action up until another point in the past.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + had been + V-ing]",
        "exampleSentence": "The ground was soaking wet because it had been raining all night.",
        "exampleSentences": [
            "The ground was soaking wet because it had been raining all night.",
            "He had been driving for four hours before he took a break.",
            "They had been discussing the proposal for weeks before signing."
        ]
    },
    {
        "word": "Second Conditional (Unreal / Hypothetical Present)",
        "meaning": "If + Past Simple, would + base verb | Used for hypothetical, imaginary, or improbable present/future situations.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[If + Past Simple, ... would + V1]",
        "exampleSentence": "If I won the lottery, I would travel around the world.",
        "exampleSentences": [
            "If I won the lottery, I would travel around the world.",
            "If I were you, I would accept the job offer immediately.",
            "What would you do if you found a wallet on the street?"
        ]
    },
    {
        "word": "Third Conditional (Unreal Past & Regrets)",
        "meaning": "If + Past Perfect (had + V3), would have + past participle | Imagines an alternative past scenario and its hypothetical result.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[If + had + V3, ... would have + V3]",
        "exampleSentence": "If I had studied harder, I would have passed the examination.",
        "exampleSentences": [
            "If I had studied harder, I would have passed the examination.",
            "We would have arrived on time if we hadn't encountered heavy traffic.",
            "If she had known you were in town, she would have called you."
        ]
    },
    {
        "word": "Passive Voice: Present Simple",
        "meaning": "Subject + am/is/are + past participle (V3) | Focuses on the receiver of the action rather than the doer.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + am/is/are + V3 (+ by Agent)]",
        "exampleSentence": "Millions of emails are sent across the globe every minute.",
        "exampleSentences": [
            "Millions of emails are sent across the globe every minute.",
            "English is spoken by billions of people worldwide.",
            "The library is cleaned thoroughly every evening."
        ]
    },
    {
        "word": "Passive Voice: Past Simple",
        "meaning": "Subject + was/were + past participle (V3) | Describes completed past actions where the focus is on the object.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + was/were + V3 (+ by Agent)]",
        "exampleSentence": "The famous novel was written by Gabriel Garcia Marquez in 1967.",
        "exampleSentences": [
            "The famous novel was written by Gabriel Garcia Marquez in 1967.",
            "The ancient castle was destroyed during the civil war.",
            "These houses were built in the nineteenth century."
        ]
    },
    {
        "word": "Passive Voice: Present Perfect & Modals",
        "meaning": "have/has been + V3 / modal + be + V3 | Passive forms for completed experiences or modal obligations.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[have/has been + V3 | modal + be + V3]",
        "exampleSentence": "The new policy has been approved and must be implemented today.",
        "exampleSentences": [
            "The new policy has been approved and must be implemented today.",
            "All electronic devices must be switched off during landing.",
            "His bicycle has been stolen from outside the apartment."
        ]
    },
    {
        "word": "Reported Speech: Tense Backshift",
        "meaning": "When reporting what someone said in the past, shift present tenses one step back into the past (is -> was, have -> had, will -> would).",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[He said that + backshifted tense]",
        "exampleSentence": "She said, 'I am tired.' -> She said that she was tired.",
        "exampleSentences": [
            "She told me that she had already booked the flight tickets.",
            "Tom mentioned that he would arrive before noon.",
            "They explained that they were remodeling their apartment."
        ]
    },
    {
        "word": "Reported Questions & Commands",
        "meaning": "Reported questions use statement word order without auxiliary 'do/did'; reported commands use 'to-infinitive' (told me to do).",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[He asked if/where + Sub + Verb | told + object + to V1]",
        "exampleSentence": "The officer asked where I lived and told me to produce my license.",
        "exampleSentences": [
            "The officer asked where I lived and told me to produce my license.",
            "She asked me if I had finished the quarterly report.",
            "The doctor advised him to cut down on sugary drinks."
        ]
    },
    {
        "word": "Defining Relative Clauses",
        "meaning": "Provide essential information necessary to identify the person or thing; no commas are used.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Essential clause - no commas]",
        "exampleSentence": "The candidate who scored highest in the interview received the job.",
        "exampleSentences": [
            "The candidate who scored highest in the interview received the job.",
            "I finally found the document that I had misplaced.",
            "People who exercise regularly tend to live longer."
        ]
    },
    {
        "word": "Non-Defining Relative Clauses",
        "meaning": "Provide extra, non-essential information separated by commas; 'that' cannot replace who/which.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Main clause, who/which + extra info, rest of clause]",
        "exampleSentence": "My older sister, who lives in Toronto, is visiting us next week.",
        "exampleSentences": [
            "My older sister, who lives in Toronto, is visiting us next week.",
            "The Louvre Museum, which houses the Mona Lisa, is in Paris.",
            "This vintage camera, which belonged to my grandfather, still works."
        ]
    },
    {
        "word": "Relative Adverbs: Where, When, Why",
        "meaning": "Connect clauses referring to a place (where), a time (when), or a reason (why).",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[place + where | time + when | reason + why]",
        "exampleSentence": "This is the hospital where I was born thirty years ago.",
        "exampleSentences": [
            "This is the hospital where I was born thirty years ago.",
            "I still remember the day when we first arrived in New York.",
            "The reason why he declined the promotion remains unclear."
        ]
    },
    {
        "word": "Modal Verbs of Deduction: Must, Can't, Might",
        "meaning": "Must = almost certain true; Can't = certain impossible; Might/May/Could = 50% possible in the present.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[must be / can't be / might be + adjective/noun]",
        "exampleSentence": "Her car is parked outside, so she must be at home.",
        "exampleSentences": [
            "Her car is parked outside, so she must be at home.",
            "He can't be thirty; he looks much younger!",
            "Take an umbrella; it might rain later this afternoon."
        ]
    },
    {
        "word": "Tag Questions",
        "meaning": "Short questions added to the end of a statement; positive statements take negative tags, negative statements take positive tags.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Statement (+), negative tag (-) ? | Statement (-), positive tag (+) ?]",
        "exampleSentence": "You haven't seen my car keys anywhere, have you?",
        "exampleSentences": [
            "You haven't seen my car keys anywhere, have you?",
            "She is coming to the party tonight, isn't she?",
            "They won the match easily, didn't they?"
        ]
    },
    {
        "word": "Wishes about the Present: Wish + Past Simple",
        "meaning": "Subject + wish + Past Simple | Expresses desire for things in the present to be different from reality.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + wish + Past Simple]",
        "exampleSentence": "I wish I had more free time to pursue creative hobbies.",
        "exampleSentences": [
            "I wish I had more free time to pursue creative hobbies.",
            "She wishes she could speak fluent Japanese.",
            "We wish the weather were a little warmer."
        ]
    },
    {
        "word": "Wishes about the Past: Wish + Past Perfect",
        "meaning": "Subject + wish + had + V3 | Expresses regret about a past action that cannot be undone.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + wish + had + V3]",
        "exampleSentence": "I wish I had listened to your financial advice earlier.",
        "exampleSentences": [
            "I wish I had listened to your financial advice earlier.",
            "He wishes he hadn't sold his vintage guitar.",
            "They wish they had booked their flights in advance."
        ]
    },
    {
        "word": "Be Used To vs Get Used To",
        "meaning": "'Be used to' = be accustomed to (state); 'Get used to' = the process of becoming accustomed to something (followed by noun or V-ing).",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[be / get used to + Noun / V-ing]",
        "exampleSentence": "Living in London was difficult at first, but I got used to the cold weather.",
        "exampleSentences": [
            "Living in London was difficult at first, but I got used to the cold weather.",
            "As a surgeon, she is used to working long overnight shifts.",
            "It took me several months to get used to driving on the left."
        ]
    },
    {
        "word": "Future Continuous (will be + -ing)",
        "meaning": "Subject + will be + V-ing | Describes actions that will be in progress at a specific time in the future.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + will be + V-ing]",
        "exampleSentence": "This time tomorrow, I will be flying over the Atlantic Ocean.",
        "exampleSentences": [
            "This time tomorrow, I will be flying over the Atlantic Ocean.",
            "Don't phone at 8 PM; we will be having family dinner.",
            "Will you be using the company projector this afternoon?"
        ]
    },
    {
        "word": "Future Perfect (will have + V3)",
        "meaning": "Subject + will have + past participle | Describes an action that will be completed before a designated future deadline.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + will have + V3 (+ by Deadline)]",
        "exampleSentence": "By the end of next month, I will have finished my master's thesis.",
        "exampleSentences": [
            "By the end of next month, I will have finished my master's thesis.",
            "They will have constructed the entire bridge by 2026.",
            "Will you have reviewed the contract before tomorrow's meeting?"
        ]
    },
    {
        "word": "Causative Form: Have / Get Something Done",
        "meaning": "Subject + have/get + object + past participle (V3) | Arranging for someone else (usually a professional) to do a service for you.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[have / get + Object + V3]",
        "exampleSentence": "I am having my car serviced at the local garage tomorrow.",
        "exampleSentences": [
            "I am having my car serviced at the local garage tomorrow.",
            "She had her wisdom teeth removed by an oral surgeon.",
            "We need to get our roof repaired before winter begins."
        ]
    },
    {
        "word": "Connectors of Contrast: Although, Despite, In Spite Of",
        "meaning": "'Although' / 'Even though' are followed by a full subject+verb clause; 'Despite' / 'In spite of' are followed by nouns or gerunds (-ing).",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Although + clause | Despite + noun/V-ing]",
        "exampleSentence": "Despite the heavy rain, they thoroughly enjoyed the outdoor music festival.",
        "exampleSentences": [
            "Despite the heavy rain, they thoroughly enjoyed the outdoor music festival.",
            "Although she felt nervous, her presentation was flawless.",
            "In spite of earning a good salary, he lived very frugally."
        ]
    },
    {
        "word": "Clauses of Purpose: In order to, So that",
        "meaning": "'In order to' / 'So as to' + base verb; 'So that' + clause (subject + modal verb like can/could/would).",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[in order to + V1 | so that + Sub + modal + V1]",
        "exampleSentence": "He woke up early in order to catch the first train to Manchester.",
        "exampleSentences": [
            "He woke up early in order to catch the first train to Manchester.",
            "I saved my files on the cloud so that I wouldn't lose any data.",
            "She spoke slowly so that everyone could understand clearly."
        ]
    },
    {
        "word": "Either ... Or / Neither ... Nor",
        "meaning": "'Either ... or' connects two alternatives; 'Neither ... nor' negates both alternatives.",
        "cefrLevel": "B1",
        "partOfSpeech": "grammar",
        "pronunciation": "[either A or B | neither A nor B]",
        "exampleSentence": "Neither the manager nor the assistant was aware of the policy update.",
        "exampleSentences": [
            "Neither the manager nor the assistant was aware of the policy update.",
            "You can either pay in cash or with a credit card.",
            "He neither called nor texted to explain his absence."
        ]
    },

    # ==================== CEFR B2 (Upper Intermediate - 15 Topics) ====================
    {
        "word": "Past Modals of Deduction (must have, can't have, might have + V3)",
        "meaning": "Must have + V3 = almost certain occurred; Can't have + V3 = certain impossible; Might/could have + V3 = possible in the past.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[must have / can't have / might have + V3]",
        "exampleSentence": "The ground is dry, so it can't have rained last night.",
        "exampleSentences": [
            "The ground is dry, so it can't have rained last night.",
            "She didn't answer her phone; she must have fallen asleep.",
            "He might have taken the earlier flight, but I'm not certain."
        ]
    },
    {
        "word": "Past Modals of Regret: Should have + V3",
        "meaning": "Subject + should have / shouldn't have + past participle | Expresses criticism or regret about past choices.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + should(n't) have + V3]",
        "exampleSentence": "You should have double-checked the reservation before leaving.",
        "exampleSentences": [
            "You should have double-checked the reservation before leaving.",
            "I shouldn't have stayed up so late before the morning interview.",
            "They ought to have informed us about the schedule change."
        ]
    },
    {
        "word": "Mixed Conditionals (Past Condition with Present Result)",
        "meaning": "If + Past Perfect (had + V3), would + base verb | Connects an unreal past action with its hypothetical present result.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[If + had + V3, ... would + V1]",
        "exampleSentence": "If I had accepted that overseas job, I would be living in Tokyo today.",
        "exampleSentences": [
            "If I had accepted that overseas job, I would be living in Tokyo today.",
            "If she hadn't broken her leg last month, she would be running the marathon now.",
            "He would have the qualification if he had completed the training program."
        ]
    },
    {
        "word": "Inversion with Negative Adverbials (Never, Rarely, Seldom)",
        "meaning": "Place negative adverbials at sentence start followed by inverted auxiliary + subject word order for dramatic emphasis.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Negative Adverbial + Aux + Sub + Main Verb]",
        "exampleSentence": "Seldom have I witnessed such an extraordinary display of athletic talent.",
        "exampleSentences": [
            "Seldom have I witnessed such an extraordinary display of athletic talent.",
            "Rarely does she complain about working overtime.",
            "Never in my life had I heard such incredible music."
        ]
    },
    {
        "word": "Inversion with 'Not only ... but also'",
        "meaning": "Not only + auxiliary + subject + verb, but also ... | Emphasizes two related impressive facts.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Not only + Aux + Sub + V, but also ...]",
        "exampleSentence": "Not only did he compose the musical score, but he also directed the film.",
        "exampleSentences": [
            "Not only did he compose the musical score, but he also directed the film.",
            "Not only is the hotel luxurious, but it is also environmentally sustainable.",
            "Not only did she pass the bar exam, but she also finished top of her class."
        ]
    },
    {
        "word": "Cleft Sentences for Focus (It is/was ... that)",
        "meaning": "It is/was + emphasized element + that/who ... | Divides a clause into two parts to emphasize a specific piece of information.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[It was + emphasized word + that/who ...]",
        "exampleSentence": "It was Professor Bennett who first inspired my interest in neuroscience.",
        "exampleSentences": [
            "It was Professor Bennett who first inspired my interest in neuroscience.",
            "It was during the 1990s that mobile communications revolutionized society.",
            "It is punctuality that employers value above all else."
        ]
    },
    {
        "word": "Wh- Cleft Sentences (What I need is ...)",
        "meaning": "What + clause + is/was + emphasized complement | Focuses attention on an action, requirement, or feeling.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[What + Sub + Verb + is/was + Emphasized item]",
        "exampleSentence": "What we really need right now is a sensible long-term strategic plan.",
        "exampleSentences": [
            "What we really need right now is a sensible long-term strategic plan.",
            "What impressed the panel most was her calm problem-solving ability.",
            "All I want is a quiet evening at home with a good book."
        ]
    },
    {
        "word": "Participle Clauses (-ing and -ed Clauses)",
        "meaning": "Present (-ing) or past (-ed) participle clauses that reduce full adverbial clauses of time, reason, or result for concise writing.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Participle phrase, Main Clause]",
        "exampleSentence": "Having completed the financial audit, the accountants submitted their final report.",
        "exampleSentences": [
            "Having completed the financial audit, the accountants submitted their final report.",
            "Shocked by the news, she struggled to find the right words to reply.",
            "Walking through the historic district, we discovered several charming cafés."
        ]
    },
    {
        "word": "Passive Reporting Verbs (It is said that / He is thought to)",
        "meaning": "Used in formal journalism and academic writing to report general beliefs without naming a source.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[It is claimed that ... | Sub + is said to + V1]",
        "exampleSentence": "The ancient fortress is believed to have been constructed over 800 years ago.",
        "exampleSentences": [
            "The ancient fortress is believed to have been constructed over 800 years ago.",
            "It is estimated that renewable energy will power 60% of homes by 2030.",
            "She is reported to be negotiating a major international partnership."
        ]
    },
    {
        "word": "Wish & If Only with 'Would' (Criticism & Complaints)",
        "meaning": "Subject + wish + would + base verb | Used to complain about another person's annoying habit or request a change of behavior.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + wish / If only + would + V1]",
        "exampleSentence": "I wish you would stop interrupting me while I am presenting.",
        "exampleSentences": [
            "I wish you would stop interrupting me while I am presenting.",
            "If only the neighbors would keep their music down late at night.",
            "I wish the rain would stop so we could go hiking."
        ]
    },
    {
        "word": "Hypothetical Situations: As if / As though",
        "meaning": "Used to describe appearance that does not match reality (followed by past tenses for hypothetical comparisons).",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sub + looks/acts + as if / as though + clause]",
        "exampleSentence": "He speaks about the company as if he owned the entire enterprise himself.",
        "exampleSentences": [
            "He speaks about the company as if he owned the entire enterprise himself.",
            "She looked as though she hadn't slept for two days.",
            "They treated the matter as if it were of no consequence."
        ]
    },
    {
        "word": "It is (high / about) time + Past Simple",
        "meaning": "It is high time + subject + Past Simple | Expresses strong urgency that an action should have already happened.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[It is (high) time + Sub + Past Simple]",
        "exampleSentence": "It is high time the government took decisive action on environmental pollution.",
        "exampleSentences": [
            "It is high time the government took decisive action on environmental pollution.",
            "It is about time you decided what university course you want to pursue.",
            "It's time we replaced this outdated computer system."
        ]
    },
    {
        "word": "Would Rather / Would Sooner (Preferences)",
        "meaning": "Would rather + base verb (same subject); Would rather + subject + Past Simple (desiring someone else to do something).",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[would rather + V1 | would rather + Sub + Past Simple]",
        "exampleSentence": "I would rather stay home tonight, but I'd rather you went to the reception.",
        "exampleSentences": [
            "I would rather stay home tonight, but I'd rather you went to the reception.",
            "She would sooner resign than compromise her professional integrity.",
            "Would you rather work remotely or collaborate in person?"
        ]
    },
    {
        "word": "Verbs of Perception with Base Verb vs Gerund",
        "meaning": "Perception verb + object + V1 = saw/heard the complete event; Perception verb + object + -ing = caught the action in progress.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[hear/see + Obj + V1 (complete) | hear/see + Obj + V-ing (in progress)]",
        "exampleSentence": "I saw him cross the entire street. I saw him crossing the street when a car braked.",
        "exampleSentences": [
            "We heard the soprano sing the aria from start to finish.",
            "I noticed someone lurking outside the building.",
            "Did you feel the ground shake during the earthquake?"
        ]
    },
    {
        "word": "Adverbial Clauses of Concession: Whereas, While",
        "meaning": "Used to place two contrasting facts side-by-side in balanced, analytical compound sentences.",
        "cefrLevel": "B2",
        "partOfSpeech": "grammar",
        "pronunciation": "[Fact A, whereas / while + Fact B]",
        "exampleSentence": "Some sectors experienced growth, whereas retail suffered a sharp decline.",
        "exampleSentences": [
            "Some sectors experienced growth, whereas retail suffered a sharp decline.",
            "While online courses offer flexibility, in-person workshops foster deeper networking.",
            "He prefers structured routines, whereas his partner thrives on spontaneity."
        ]
    },

    # ==================== CEFR C1 (Advanced - 15 Topics) ====================
    {
        "word": "Inversion in Conditional Sentences (Had, Were, Should)",
        "meaning": "Formal conditionals formed without 'if' by inverting the auxiliary verb (Had I known..., Were you to ask..., Should you require...).",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Had I + V3 | Were you to + V1 | Should you + V1]",
        "exampleSentence": "Had we been notified earlier, we would have amended the operational protocol.",
        "exampleSentences": [
            "Had we been notified earlier, we would have amended the operational protocol.",
            "Should you require further clarification, please do not hesitate to contact our office.",
            "Were the board to approve the proposal, construction would commence in autumn."
        ]
    },
    {
        "word": "Subjunctive Mood (Mandatory & Formal Requirements)",
        "meaning": "Demand / recommend / insist + that + subject + base verb (without -s, no modals) in formal official writing.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[recommend / insist that + Sub + base verb]",
        "exampleSentence": "The committee insisted that the chief executive resign immediately.",
        "exampleSentences": [
            "The committee insisted that the chief executive resign immediately.",
            "It is imperative that every participant remain in their assigned seats.",
            "The judge demanded that the witness be present during cross-examination."
        ]
    },
    {
        "word": "Advanced Inversion: No sooner ... than / Hardly ... when",
        "meaning": "Shows an immediate sequence of two past events: No sooner had [event 1] than [event 2].",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[No sooner had + Sub + V3 ... than + Past Simple]",
        "exampleSentence": "No sooner had she walked through the door than the telephone began to ring.",
        "exampleSentences": [
            "No sooner had she walked through the door than the telephone began to ring.",
            "Hardly had the aircraft touched down when the severe storm broke out.",
            "Scarcely had we settled into the theater when the performance commenced."
        ]
    },
    {
        "word": "Inversion with 'Only after', 'Only when', 'Under no circumstances'",
        "meaning": "Preposed restrictive clauses require inversion in the main clause for strict formal prohibition or condition.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Under no circumstances may/can + Sub + V1]",
        "exampleSentence": "Under no circumstances should confidential financial records be shared externally.",
        "exampleSentences": [
            "Under no circumstances should confidential financial records be shared externally.",
            "Only when the investigation was completed did the regulatory body issue its findings.",
            "Only after reviewing all candidate portfolios will a final decision be reached."
        ]
    },
    {
        "word": "Absolute Participle Clauses (With independent subjects)",
        "meaning": "Participle clause with its own distinct noun subject, creating concise, elegant literary and journalistic prose.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Noun + participle, Independent Main Clause]",
        "exampleSentence": "Weather permitting, the mountaineering expedition will embark at sunrise.",
        "exampleSentences": [
            "Weather permitting, the mountaineering expedition will embark at sunrise.",
            "All deliberations having concluded, the delegates convened for the closing reception.",
            "Her voice trembling slightly, she delivered an inspiring acceptance speech."
        ]
    },
    {
        "word": "Dangling vs Attached Modifiers",
        "meaning": "Ensuring introductory modifying phrases logically attach to the grammatical subject of the main clause to prevent ambiguity.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Introductory modifier must modify the exact subject that follows]",
        "exampleSentence": "Walking through the forest, we heard the owls (Correct: 'we' walked, not the owls).",
        "exampleSentences": [
            "Having reviewed the architectural blueprints, the engineers identified several structural flaws.",
            "Exhausted by the transatlantic flight, the ambassador immediately retired to his quarters.",
            "Recognized worldwide for innovation, the institute attracted premier researchers."
        ]
    },
    {
        "word": "Noun Clauses with 'Wh-ever' (Whoever, Whatever, Whichever)",
        "meaning": "Whoever/Whatever clauses functioning seamlessly as subject or object complements in complex academic arguments.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Whoever + verb / Whatever + clause as syntactic unit]",
        "exampleSentence": "Whoever leaked the preliminary draft violated strict company non-disclosure agreements.",
        "exampleSentences": [
            "Whoever leaked the preliminary draft violated strict company non-disclosure agreements.",
            "You are welcome to choose whichever specialization aligns with your career aspirations.",
            "Whatever conclusions the tribunal reaches will be binding on all member states."
        ]
    },
    {
        "word": "Ellipsis & Substitution in Cohesive Discourse",
        "meaning": "Omitting repetitive words (ellipsis) or substituting them with words like 'so', 'neither', or 'do' for sophisticated stylistic economy.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Strategic omission / substitution to enhance flow]",
        "exampleSentence": "Some analysts predicted a market rebound; others did not (ellipsis of 'predict a rebound').",
        "exampleSentences": [
            "Will the regulatory reforms pass into law? I certainly hope so.",
            "She wanted to attend the academic symposium, but her commitments prevented her from doing so.",
            "Two delegates supported the resolution, while four vehemently opposed it."
        ]
    },
    {
        "word": "Disjuncts & Sentence Adverbs (Admittedly, Paradoxically, Arguably)",
        "meaning": "Adverbs modifying entire sentences rather than individual verbs, expressing the author's critical stance and rhetorical poise.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Sentence Adverb, Main Clause]",
        "exampleSentence": "Arguably, renewable solar adoption represents the single most cost-effective green transition.",
        "exampleSentences": [
            "Arguably, renewable solar adoption represents the single most cost-effective green transition.",
            "Paradoxically, increasing highway lanes often exacerbates urban vehicular congestion.",
            "Admittedly, the initial deployment costs are substantial, but the long-term ROI is compelling."
        ]
    },
    {
        "word": "Cohesive Fronting & Focus Inversion",
        "meaning": "Moving prepositional phrases, adjectives, or participle phrases to sentence start to maintain unbroken narrative continuity.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Fronted Complement / Adverbial + Verb + Subject]",
        "exampleSentence": "At the summit of the mountain stood a centuries-old weather observatory.",
        "exampleSentences": [
            "At the summit of the mountain stood a centuries-old weather observatory.",
            "Gone are the days when companies could afford to neglect cybersecurity hygiene.",
            "Equally remarkable was her ability to remain composed under intense media scrutiny."
        ]
    },
    {
        "word": "Complex Prepositional Idioms (In light of, In lieu of, Vis-a-vis)",
        "meaning": "Multi-word prepositional connectors utilized in formal diplomacy, legal drafting, and advanced literary rhetoric.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Complex prepositional connector + Noun phrase]",
        "exampleSentence": "In light of unprecedented geopolitical volatility, the council reassessed its trade treaties.",
        "exampleSentences": [
            "In light of unprecedented geopolitical volatility, the council reassessed its trade treaties.",
            "The executive board approved equity shares in lieu of traditional cash bonuses.",
            "The committee evaluated domestic output vis-à-vis peer economies in the OECD."
        ]
    },
    {
        "word": "Parallel Structure in Rhetoric & Balanced Syntax",
        "meaning": "Using identical grammatical forms for two or more coordinated elements in complex argumentative prose.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Coordinated clauses maintain exact grammatical symmetry]",
        "exampleSentence": "The curriculum was designed not to intimidate novice learners, but to empower aspiring scholars.",
        "exampleSentences": [
            "The curriculum was designed not to intimidate novice learners, but to empower aspiring scholars.",
            "She excelled at formulating hypotheses, conducting rigorous trials, and communicating findings.",
            "To understand the past is to illuminate the present and anticipate the future."
        ]
    },
    {
        "word": "Anticipatory 'It' as Formal Dummy Subject",
        "meaning": "Placing 'it' in subject position when the true semantic subject is an infinitive or that-clause deferred to sentence end.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[It + be + adjective + that-clause / infinitive clause]",
        "exampleSentence": "It is customary among diplomatic envoys to present credentials upon official arrival.",
        "exampleSentences": [
            "It is customary among diplomatic envoys to present credentials upon official arrival.",
            "It remains uncertain whether monetary easing will avert an economic downturn.",
            "It behooves senior leaders to uphold impeccable standards of transparent governance."
        ]
    },
    {
        "word": "Hypothetical Concessive Clauses (Be that as it may, Come what may)",
        "meaning": "Archaic and literary subjunctive set-phrases used to establish concessive premises in refined debates.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Fixed concessive subjunctive formula + Main Clause]",
        "exampleSentence": "Be that as it may, fiscal accountability cannot be compromised under any circumstances.",
        "exampleSentences": [
            "Be that as it may, fiscal accountability cannot be compromised under any circumstances.",
            "Come what may, our team remains unconditionally committed to fulfilling our scientific pledge.",
            "Suffice it to say that the outcome exceeded even our most optimistic projections."
        ]
    },
    {
        "word": "Nominalization in Academic & Formal Discourse",
        "meaning": "Converting verbs and adjectives into abstract nouns to create authoritative, objective, and dense formal prose.",
        "cefrLevel": "C1",
        "partOfSpeech": "grammar",
        "pronunciation": "[Verb/Adj -> Abstract Noun (e.g. assess -> assessment)]",
        "exampleSentence": "The rigorous evaluation of systemic vulnerabilities facilitated comprehensive mitigation.",
        "exampleSentences": [
            "The rigorous evaluation of systemic vulnerabilities facilitated comprehensive mitigation.",
            "Rapid industrial modernization catalyzed widespread demographic migration toward urban hubs.",
            "Careful consideration of ethical ramifications is indispensable in artificial intelligence design."
        ]
    }
]

# Write to public/english-grammar.json with timestamps and clean fields
timestamp = 1700000000000
formatted_topics = []

for idx, topic in enumerate(grammar_topics):
    item = {
        "word": topic["word"],
        "meaning": topic["meaning"],
        "cefrLevel": topic["cefrLevel"],
        "partOfSpeech": "grammar",
        "pronunciation": topic.get("pronunciation", ""),
        "exampleSentence": topic["exampleSentence"],
        "exampleSentences": topic.get("exampleSentences", [topic["exampleSentence"]]),
        "status": "new",
        "createdAt": timestamp + idx,
        "reviewCount": 0,
        "correctCount": 0,
        "mistakeCount": 0
    }
    formatted_topics.append(item)

out_path = os.path.join(os.path.dirname(__file__), "..", "public", "english-grammar.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(formatted_topics, f, indent=2, ensure_ascii=False)

print(f"Successfully generated {len(formatted_topics)} grammar topics in {out_path}")
