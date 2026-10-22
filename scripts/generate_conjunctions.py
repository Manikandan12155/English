import json
import os

# Comprehensive list of all English Conjunctions categorized by CEFR Levels A1 - C1
# Includes Coordinating, Subordinating, Correlative, and Conjunctive Adverbs
conjunctions_data = [
    # ==================== A1 (Beginner - 14 Conjunctions) ====================
    {
        "word": "and",
        "meaning": "Used to connect words, phrases, or clauses representing additional information or similar ideas",
        "cefrLevel": "A1",
        "pronunciation": "/ænd/",
        "exampleSentence": "She bought bread and milk from the grocery store."
    },
    {
        "word": "but",
        "meaning": "Used to introduce an added statement that contrasts with what has already been said",
        "cefrLevel": "A1",
        "pronunciation": "/bʌt/",
        "exampleSentence": "I wanted to go for a run, but it started raining."
    },
    {
        "word": "or",
        "meaning": "Used to link alternatives or different possibilities",
        "cefrLevel": "A1",
        "pronunciation": "/ɔːr/",
        "exampleSentence": "Would you prefer coffee or tea with breakfast?"
    },
    {
        "word": "because",
        "meaning": "For the reason that; explaining why something happens",
        "cefrLevel": "A1",
        "pronunciation": "/bɪˈkɒz/",
        "exampleSentence": "She went to bed early because she was exhausted."
    },
    {
        "word": "so",
        "meaning": "And for that reason; as a result of something previously stated",
        "cefrLevel": "A1",
        "pronunciation": "/səʊ/",
        "exampleSentence": "The weather was terrible, so we decided to stay home."
    },
    {
        "word": "if",
        "meaning": "Introducing a condition on which another event depends",
        "cefrLevel": "A1",
        "pronunciation": "/ɪf/",
        "exampleSentence": "If it rains tomorrow, we will stay indoors."
    },
    {
        "word": "when",
        "meaning": "At the time that; on the occasion that",
        "cefrLevel": "A1",
        "pronunciation": "/wen/",
        "exampleSentence": "Call me when you arrive at the airport."
    },
    {
        "word": "then",
        "meaning": "Used to indicate what happens next in time or order",
        "cefrLevel": "A1",
        "pronunciation": "/ðen/",
        "exampleSentence": "First finish your homework, and then we can play video games."
    },
    {
        "word": "before",
        "meaning": "Earlier than the time when something happens",
        "cefrLevel": "A1",
        "pronunciation": "/bɪˈfɔːr/",
        "exampleSentence": "Wash your hands before you sit down to eat."
    },
    {
        "word": "after",
        "meaning": "At a later time than; following an event",
        "cefrLevel": "A1",
        "pronunciation": "/ˈɑːf.tər/",
        "exampleSentence": "We went for a relaxing walk after having dinner."
    },
    {
        "word": "that",
        "meaning": "Used to introduce a subordinate clause providing information or a statement",
        "cefrLevel": "A1",
        "pronunciation": "/ðæt/",
        "exampleSentence": "She said that she would be five minutes late."
    },
    {
        "word": "also",
        "meaning": "In addition; too; used to connect an additional thought",
        "cefrLevel": "A1",
        "pronunciation": "/ˈɔːl.səʊ/",
        "exampleSentence": "He speaks Spanish and he also understands Portuguese."
    },
    {
        "word": "where",
        "meaning": "At, in, or to the place in which",
        "cefrLevel": "A1",
        "pronunciation": "/weər/",
        "exampleSentence": "This is the restaurant where we had dinner yesterday."
    },
    {
        "word": "like",
        "meaning": "In the same manner as; similar to (informal conjunction)",
        "cefrLevel": "A1",
        "pronunciation": "/laɪk/",
        "exampleSentence": "Nobody can sing like she does."
    },

    # ==================== A2 (Elementary - 20 Conjunctions) ====================
    {
        "word": "although",
        "meaning": "In spite of the fact that; introducing a contrasting clause",
        "cefrLevel": "A2",
        "pronunciation": "/ɔːlˈðəʊ/",
        "exampleSentence": "Although he was extremely tired, he kept studying for his exam."
    },
    {
        "word": "while",
        "meaning": "During the period of time that; at the same time as",
        "cefrLevel": "A2",
        "pronunciation": "/waɪl/",
        "exampleSentence": "She listened to music while cleaning the apartment."
    },
    {
        "word": "since",
        "meaning": "From a past time until now; also used to mean 'because'",
        "cefrLevel": "A2",
        "pronunciation": "/sɪns/",
        "exampleSentence": "Since you are already heading to the store, could you buy some eggs?"
    },
    {
        "word": "until",
        "meaning": "Up to the point in time or the event mentioned",
        "cefrLevel": "A2",
        "pronunciation": "/ənˈtɪl/",
        "exampleSentence": "Wait here until I return with the tickets."
    },
    {
        "word": "as",
        "meaning": "Used to indicate that something happens during the time of another event, or because",
        "cefrLevel": "A2",
        "pronunciation": "/æz/",
        "exampleSentence": "As I was leaving the office, my phone rang."
    },
    {
        "word": "so that",
        "meaning": "In order that; expressing purpose or intended outcome",
        "cefrLevel": "A2",
        "pronunciation": "/səʊ ðæt/",
        "exampleSentence": "I set two alarms so that I wouldn't oversleep."
    },
    {
        "word": "as soon as",
        "meaning": "Immediately at the moment when an action happens",
        "cefrLevel": "A2",
        "pronunciation": "/æz suːn æz/",
        "exampleSentence": "Please call me as soon as you receive this email."
    },
    {
        "word": "even if",
        "meaning": "Whether or not; emphasizing that a condition does not alter the result",
        "cefrLevel": "A2",
        "pronunciation": "/ˈiː.vən ɪf/",
        "exampleSentence": "I will attend the meeting even if it rains heavily."
    },
    {
        "word": "even though",
        "meaning": "Despite the fact that (stronger than although)",
        "cefrLevel": "A2",
        "pronunciation": "/ˈiː.vən ðəʊ/",
        "exampleSentence": "Even though he had little experience, he performed brilliantly."
    },
    {
        "word": "both...and",
        "meaning": "Used to emphasize that two connected statements or elements are both true",
        "cefrLevel": "A2",
        "pronunciation": "/bəʊθ ... ænd/",
        "exampleSentence": "She is both intelligent and exceptionally hardworking."
    },
    {
        "word": "either...or",
        "meaning": "Used to connect two possibilities, meaning one or the other",
        "cefrLevel": "A2",
        "pronunciation": "/ˈaɪ.ðər ... ɔːr/",
        "exampleSentence": "You can pay either by credit card or with cash."
    },
    {
        "word": "neither...nor",
        "meaning": "Used to state that not the first thing and not the second thing is true",
        "cefrLevel": "A2",
        "pronunciation": "/ˈnaɪ.ðər ... nɔːr/",
        "exampleSentence": "Neither Mark nor his sister could attend the celebration."
    },
    {
        "word": "yet",
        "meaning": "Nevertheless; but at the same time",
        "cefrLevel": "A2",
        "pronunciation": "/jet/",
        "exampleSentence": "The path was steep and rocky, yet they kept climbing."
    },
    {
        "word": "as long as",
        "meaning": "Provided that; on the condition that",
        "cefrLevel": "A2",
        "pronunciation": "/æz lɒŋ æz/",
        "exampleSentence": "You can borrow my car as long as you drive carefully."
    },
    {
        "word": "however",
        "meaning": "Used to introduce a statement that contrasts with or seems to contradict previous information",
        "cefrLevel": "A2",
        "pronunciation": "/haʊˈev.ər/",
        "exampleSentence": "We wanted to buy the house; however, the price was too high."
    },
    {
        "word": "as well as",
        "meaning": "In addition to; and also",
        "cefrLevel": "A2",
        "pronunciation": "/æz wel æz/",
        "exampleSentence": "She teaches chemistry as well as physics at the high school."
    },
    {
        "word": "unless",
        "meaning": "Except if; used to express a condition without which an action will happen",
        "cefrLevel": "A2",
        "pronunciation": "/ənˈles/",
        "exampleSentence": "We won't catch the train unless we leave right now."
    },
    {
        "word": "than",
        "meaning": "Used in comparisons to introduce the second element",
        "cefrLevel": "A2",
        "pronunciation": "/ðæn/",
        "exampleSentence": "Travelling by plane is much faster than taking the train."
    },
    {
        "word": "once",
        "meaning": "As soon as; at the moment when",
        "cefrLevel": "A2",
        "pronunciation": "/wʌns/",
        "exampleSentence": "Once you learn the fundamentals, coding becomes much easier."
    },
    {
        "word": "whenever",
        "meaning": "At whatever time; on any occasion that",
        "cefrLevel": "A2",
        "pronunciation": "/wenˈev.ər/",
        "exampleSentence": "You are always welcome to stay with us whenever you visit town."
    },

    # ==================== B1 (Intermediate - 22 Conjunctions) ====================
    {
        "word": "whereas",
        "meaning": "In contrast or comparison with the fact that",
        "cefrLevel": "B1",
        "pronunciation": "/weərˈæz/",
        "exampleSentence": "Some people enjoy spicy dishes, whereas others prefer mild flavors."
    },
    {
        "word": "not only...but also",
        "meaning": "Used to emphasize that two related things are equally true and important",
        "cefrLevel": "B1",
        "pronunciation": "/nɒt ˈəʊn.li ... bʌt ˈɔːl.səʊ/",
        "exampleSentence": "She not only won the regional competition, but also broke the national record."
    },
    {
        "word": "whether...or",
        "meaning": "Used to indicate a choice between two alternatives or that something is true in either case",
        "cefrLevel": "B1",
        "pronunciation": "/ˈweð.ər ... ɔːr/",
        "exampleSentence": "We are going camping whether it rains or shines."
    },
    {
        "word": "therefore",
        "meaning": "As a result; consequently; for that reason",
        "cefrLevel": "B1",
        "pronunciation": "/ˈðeə.fɔːr/",
        "exampleSentence": "He had worked fourteen hours straight; therefore, he needed rest."
    },
    {
        "word": "moreover",
        "meaning": "As a further matter; besides; in addition (formal connector)",
        "cefrLevel": "B1",
        "pronunciation": "/mɔːˈrəʊ.vər/",
        "exampleSentence": "The apartment is spacious; moreover, it is close to public transport."
    },
    {
        "word": "furthermore",
        "meaning": "In addition to what has been said; additionally",
        "cefrLevel": "B1",
        "pronunciation": "/ˌfɜː.ðəˈmɔːr/",
        "exampleSentence": "The proposal will save money; furthermore, it will improve service quality."
    },
    {
        "word": "in order that",
        "meaning": "So that; introducing the purpose or intended goal of an action",
        "cefrLevel": "B1",
        "pronunciation": "/ɪn ˈɔː.dər ðæt/",
        "exampleSentence": "Regulations were updated in order that worker safety could be guaranteed."
    },
    {
        "word": "provided that",
        "meaning": "On the condition that; only if",
        "cefrLevel": "B1",
        "pronunciation": "/prəˈvaɪ.dɪd ðæt/",
        "exampleSentence": "You can join the program provided that you submit your forms by Friday."
    },
    {
        "word": "providing that",
        "meaning": "On the condition that; granting that",
        "cefrLevel": "B1",
        "pronunciation": "/prəˈvaɪ.dɪŋ ðæt/",
        "exampleSentence": "The project will launch on time, providing that testing reveals no bugs."
    },
    {
        "word": "in case",
        "meaning": "As a precaution against the possibility that something might happen",
        "cefrLevel": "B1",
        "pronunciation": "/ɪn keɪs/",
        "exampleSentence": "Take an umbrella with you in case the weather turns bad."
    },
    {
        "word": "as if",
        "meaning": "As would be the case if; describing appearance that may not be true",
        "cefrLevel": "B1",
        "pronunciation": "/æz ɪf/",
        "exampleSentence": "He acts as if he knows everything about computers."
    },
    {
        "word": "as though",
        "meaning": "In a way that suggests; as if",
        "cefrLevel": "B1",
        "pronunciation": "/æz ðəʊ/",
        "exampleSentence": "She looked around the room as though searching for a familiar face."
    },
    {
        "word": "otherwise",
        "meaning": "If not; or else; under other circumstances",
        "cefrLevel": "B1",
        "pronunciation": "/ˈʌð.ə.waɪz/",
        "exampleSentence": "You must hurry, otherwise you will miss the morning ferry."
    },
    {
        "word": "nevertheless",
        "meaning": "In spite of that; however; nonetheless",
        "cefrLevel": "B1",
        "pronunciation": "/ˌnev.ə.ðəˈles/",
        "exampleSentence": "The hike was physically grueling; nevertheless, reaching the summit was worth it."
    },
    {
        "word": "nonetheless",
        "meaning": "In spite of that; nevertheless (formal)",
        "cefrLevel": "B1",
        "pronunciation": "/ˌnʌn.ðəˈles/",
        "exampleSentence": "There were several minor errors; nonetheless, the presentation was a triumph."
    },
    {
        "word": "meanwhile",
        "meaning": "In the intervening period of time; at the exact same time",
        "cefrLevel": "B1",
        "pronunciation": "/ˈmiːn.waɪl/",
        "exampleSentence": "The chef prepared the main course; meanwhile, his assistant set the tables."
    },
    {
        "word": "consequently",
        "meaning": "As a result or effect of something previously mentioned",
        "cefrLevel": "B1",
        "pronunciation": "/ˈkɒn.sɪ.kwənt.li/",
        "exampleSentence": "Flights were grounded due to fog; consequently, hundreds of travelers were stranded."
    },
    {
        "word": "besides",
        "meaning": "In addition to; moreover; also",
        "cefrLevel": "B1",
        "pronunciation": "/bɪˈsaɪdz/",
        "exampleSentence": "I don't really want to go out tonight; besides, I have a mountain of work to do."
    },
    {
        "word": "instead",
        "meaning": "As an alternative or substitute",
        "cefrLevel": "B1",
        "pronunciation": "/ɪnˈsted/",
        "exampleSentence": "They didn't buy the expensive sofa; instead, they chose a simpler one."
    },
    {
        "word": "similarly",
        "meaning": "In a similar way; likewise",
        "cefrLevel": "B1",
        "pronunciation": "/ˈsɪm.ɪ.lə.li/",
        "exampleSentence": "The first trial showed promise; similarly, the second yielded positive results."
    },
    {
        "word": "likewise",
        "meaning": "In the same way; also",
        "cefrLevel": "B1",
        "pronunciation": "/ˈlaɪk.waɪz/",
        "exampleSentence": "The teachers were enthusiastic, and the students were likewise engaged."
    },
    {
        "word": "in addition",
        "meaning": "As an extra person, thing, or circumstance; additionally",
        "cefrLevel": "B1",
        "pronunciation": "/ɪn əˈdɪʃ.ən/",
        "exampleSentence": "The hotel offers free breakfast; in addition, guests have complimentary gym access."
    },

    # ==================== B2 (Upper Intermediate - 18 Conjunctions) ====================
    {
        "word": "whereas",
        "meaning": "Taking into consideration the fact that; while on the contrary",
        "cefrLevel": "B2",
        "pronunciation": "/weərˈæz/",
        "exampleSentence": "Urban populations expanded rapidly, whereas rural communities shrank."
    },
    {
        "word": "inasmuch as",
        "meaning": "To the extent that; since or because (formal)",
        "cefrLevel": "B2",
        "pronunciation": "/ˌɪn.əzˈmʌtʃ æz/",
        "exampleSentence": "The initiative succeeded inasmuch as it raised public awareness substantially."
    },
    {
        "word": "insofar as",
        "meaning": "To the degree or extent that",
        "cefrLevel": "B2",
        "pronunciation": "/ˌɪn.səʊˈfɑːr æz/",
        "exampleSentence": "The policy is effective only insofar as citizens comply voluntarily."
    },
    {
        "word": "assuming that",
        "meaning": "Accepting as true or certain without proof; supposing that",
        "cefrLevel": "B2",
        "pronunciation": "/əˈsjuː.mɪŋ ðæt/",
        "exampleSentence": "Assuming that funding is secured, construction will commence next spring."
    },
    {
        "word": "on condition that",
        "meaning": "With the stipulation that; only if",
        "cefrLevel": "B2",
        "pronunciation": "/ɒn kənˈdɪʃ.ən ðæt/",
        "exampleSentence": "He agreed to step down on condition that his staff retain their positions."
    },
    {
        "word": "supposing",
        "meaning": "Used to introduce an imaginary situation and ask what would follow",
        "cefrLevel": "B2",
        "pronunciation": "/səˈpəʊ.zɪŋ/",
        "exampleSentence": "Supposing you won the grant, what research would you conduct first?"
    },
    {
        "word": "for all that",
        "meaning": "In spite of everything that has been mentioned; nevertheless",
        "cefrLevel": "B2",
        "pronunciation": "/fɔːr ɔːl ðæt/",
        "exampleSentence": "He has faults, but for all that, he remains an honorable leader."
    },
    {
        "word": "so long as",
        "meaning": "On the condition that; as long as",
        "cefrLevel": "B2",
        "pronunciation": "/səʊ lɒŋ æz/",
        "exampleSentence": "You may stay in this apartment so long as you pay rent punctually."
    },
    {
        "word": "in the meantime",
        "meaning": "During the period between two events",
        "cefrLevel": "B2",
        "pronunciation": "/ɪn ðə ˈmiːn.taɪm/",
        "exampleSentence": "Repairs will begin in an hour; in the meantime, please remain in the lobby."
    },
    {
        "word": "on the other hand",
        "meaning": "Used to introduce a contrasting aspect or opposing viewpoint",
        "cefrLevel": "B2",
        "pronunciation": "/ɒn ðiː ˈʌð.ər hænd/",
        "exampleSentence": "The job pays exceptionally well; on the other hand, the hours are grueling."
    },
    {
        "word": "in contrast",
        "meaning": "Used to introduce a striking difference between two people or things",
        "cefrLevel": "B2",
        "pronunciation": "/ɪn ˈkɒn.trɑːst/",
        "exampleSentence": "His sister is extroverted and loves parties; in contrast, he prefers quiet solitary evenings."
    },
    {
        "word": "further",
        "meaning": "In addition to what has already occurred; furthermore",
        "cefrLevel": "B2",
        "pronunciation": "/ˈfɜː.ðər/",
        "exampleSentence": "The committee concluded the audit; further, they proposed new guidelines."
    },
    {
        "word": "on the contrary",
        "meaning": "Used to emphasize that the opposite of what was just said is actually true",
        "cefrLevel": "B2",
        "pronunciation": "/ɒn ðə ˈkɒn.trə.ri/",
        "exampleSentence": "The task wasn't difficult at all; on the contrary, it was surprisingly effortless."
    },
    {
        "word": "thus",
        "meaning": "As a result or consequence of this; in this manner",
        "cefrLevel": "B2",
        "pronunciation": "/ðʌs/",
        "exampleSentence": "The company reduced overhead costs; thus, net profits increased substantially."
    },
    {
        "word": "hence",
        "meaning": "As a consequence; for this reason",
        "cefrLevel": "B2",
        "pronunciation": "/hens/",
        "exampleSentence": "The town is surrounded by dense forests, hence its historic timber trade."
    },
    {
        "word": "no sooner...than",
        "meaning": "Used to show that one action happened immediately after another",
        "cefrLevel": "B2",
        "pronunciation": "/nəʊ ˈsuː.nər ... ðæn/",
        "exampleSentence": "No sooner had she walked through the door than the telephone started ringing."
    },
    {
        "word": "hardly...when",
        "meaning": "Barely had one action occurred when a second action took place",
        "cefrLevel": "B2",
        "pronunciation": "/ˈhɑːd.li ... wen/",
        "exampleSentence": "Hardly had they boarded the train when the whistle blew and it departed."
    },
    {
        "word": "scarcely...when",
        "meaning": "Almost immediately after one event, another took place",
        "cefrLevel": "B2",
        "pronunciation": "/ˈskeəs.li ... wen/",
        "exampleSentence": "Scarcely had the speaker finished when the entire audience erupted in applause."
    },

    # ==================== C1 (Advanced - 14 Conjunctions) ====================
    {
        "word": "notwithstanding that",
        "meaning": "In spite of the fact that; although (formal literary/legal)",
        "cefrLevel": "C1",
        "pronunciation": "/ˌnɒt.wɪðˈstæn.dɪŋ ðæt/",
        "exampleSentence": "Notwithstanding that the evidence was circumstantial, the jury convicted the defendant."
    },
    {
        "word": "albeit",
        "meaning": "Although; even if; introducing a concession in literary prose",
        "cefrLevel": "C1",
        "pronunciation": "/ɔːlˈbiː.ɪt/",
        "exampleSentence": "He accepted the promotion, albeit with considerable hesitation."
    },
    {
        "word": "lest",
        "meaning": "With the intention of preventing something undesirable; for fear that",
        "cefrLevel": "C1",
        "pronunciation": "/lest/",
        "exampleSentence": "She tiptoed across the wooden floor lest she wake the sleeping infant."
    },
    {
        "word": "seeing that",
        "meaning": "In view of the fact that; because; considering that",
        "cefrLevel": "C1",
        "pronunciation": "/ˈsiː.ɪŋ ðæt/",
        "exampleSentence": "Seeing that everyone has assembled early, let us begin the symposium."
    },
    {
        "word": "for fear that",
        "meaning": "In case something negative or dangerous should happen",
        "cefrLevel": "C1",
        "pronunciation": "/fɔːr fɪər ðæt/",
        "exampleSentence": "They refrained from making public statements for fear that rumors might spread."
    },
    {
        "word": "by the same token",
        "meaning": "In the same way or for the same reason (formal connector)",
        "cefrLevel": "C1",
        "pronunciation": "/baɪ ðə seɪm ˈtəʊ.kən/",
        "exampleSentence": "Hard work yields success; by the same token, neglect inevitably invites failure."
    },
    {
        "word": "conversely",
        "meaning": "Introducing a statement that reverses the previous proposition",
        "cefrLevel": "C1",
        "pronunciation": "/kənˈvɜːs.li/",
        "exampleSentence": "High tariffs dampen trade; conversely, free trade agreements stimulate exports."
    },
    {
        "word": "in the event that",
        "meaning": "If it should happen that; in case",
        "cefrLevel": "C1",
        "pronunciation": "/ɪn ðiː ɪˈvent ðæt/",
        "exampleSentence": "In the event that the primary server fails, the backup cluster activates automatically."
    },
    {
        "word": "forasmuch as",
        "meaning": "In view of the fact that; seeing that (archaic and formal legal)",
        "cefrLevel": "C1",
        "pronunciation": "/ˌfɔːr.əzˈmʌtʃ æz/",
        "exampleSentence": "Forasmuch as the parties have satisfied their covenants, the agreement stands ratified."
    },
    {
        "word": "save that",
        "meaning": "Except that; other than the fact that",
        "cefrLevel": "C1",
        "pronunciation": "/seɪv ðæt/",
        "exampleSentence": "The two paintings are identical, save that one features a slightly darker background."
    },
    {
        "word": "barring that",
        "meaning": "Except for the possibility that; unless",
        "cefrLevel": "C1",
        "pronunciation": "/ˈbɑː.rɪŋ ðæt/",
        "exampleSentence": "The shipment will arrive on Tuesday, barring that severe storms disrupt logistics."
    },
    {
        "word": "to the end that",
        "meaning": "In order that; with the definitive aim of achieving something",
        "cefrLevel": "C1",
        "pronunciation": "/tuː ðiː end ðæt/",
        "exampleSentence": "Policies were restructured to the end that every child receives equal education."
    },
    {
        "word": "incidentally",
        "meaning": "Used to introduce a new topic by the way, or as an aside",
        "cefrLevel": "C1",
        "pronunciation": "/ˌɪn.sɪˈden.təl.i/",
        "exampleSentence": "The report was approved; incidentally, did you receive the memo regarding parking?"
    },
    {
        "word": "as it were",
        "meaning": "In a way; so to speak; connecting a figurative or unusual expression",
        "cefrLevel": "C1",
        "pronunciation": "/æz ɪt wɜːr/",
        "exampleSentence": "He had become, as it were, the moral compass of the entire scientific team."
    }
]

timestamp = 1700000000000
formatted_conjunctions = []

for idx, item in enumerate(conjunctions_data):
    formatted = {
        "word": item["word"],
        "meaning": item["meaning"],
        "cefrLevel": item["cefrLevel"],
        "partOfSpeech": "conjunction",
        "pronunciation": item.get("pronunciation", ""),
        "exampleSentence": item["exampleSentence"],
        "exampleSentences": [item["exampleSentence"]],
        "status": "new",
        "createdAt": timestamp + idx,
        "reviewCount": 0,
        "correctCount": 0,
        "mistakeCount": 0
    }
    formatted_conjunctions.append(formatted)

out_path = os.path.join(os.path.dirname(__file__), "..", "public", "english-conjunctions.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(formatted_conjunctions, f, indent=2, ensure_ascii=False)

print(f"Successfully generated {len(formatted_conjunctions)} English conjunctions in {out_path}")
