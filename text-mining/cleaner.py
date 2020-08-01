# Import libraries
import re
from bs4 import BeautifulSoup 

import warnings
warnings.filterwarnings("ignore", category=UserWarning, module='bs4')

# Use english stopwords (list is based on several contribution found here https://gist.github.com/sebleier/554280)
stop_words = set(["able", "about", "above", "abst", "accordance", "according", "accordingly", "across", "act", "actually", "added", "adj", "affected", "affecting", "affects", "after", "afterwards", "again", "against", "ah", "ain", "ain't", "aj", "al", "all", "allow", "allows", "almost", "alone", "along", "already", "also", "although", "always", "am", "among", "amongst", "amoungst", "amount", "an", "and", "announce", "another", "any", "anybody", "anyhow", "anymore", "anyone", "anything", "anyway", "anyways", "anywhere", "ao", "ap", "apart", "apparently", "appear", "appreciate", "appropriate", "approximately", "are", "aren", "arent", "aren't", "arise", "around", "aside", "ask", "asking", "associated", "auth", "available", "away", "awfully", "back", "became", "because", "become", "becomes", "becoming", "been", "before", "beforehand", "begin", "beginning", "beginnings", "begins", "behind", "being", "believe", "below", "beside", "besides", "best", "better", "between", "beyond", "bill", "biol", "both", "bottom", "brief", "briefly", "but", "call", "came", "can", "cannot", "cant", "can't", "cause", "causes", "certain", "certainly", "changes", "cit", "clearly", "c'mon", "com", "come", "comes", "con", "concerning", "consequently", "consider", "considering", "contain", "containing", "contains", "corresponding", "could", "couldn", "couldnt", "couldn't", "course", "cry", "currently", "date", "definitely", "describe", "described", "despite", "detail", "did", "didn", "didn't", "different", "does", "doesn", "doesn't", "doing", "don", "done", "don't", "down", "downwards", "due", "during", "each", "edu", "effect", "eight", "eighty", "either", "eleven", "else", "elsewhere", "empty", "end", "ending", "enough", "entirely", "especially", "est", "et-al", "etc", "even", "ever", "every", "everybody", "everyone", "everything", "everywhere", "exactly", "example", "except", "far", "few", "fifteen", "fifth", "fify", "fill", "find", "fire", "first", "five", "fix", "followed", "following", "follows", "for", "former", "formerly", "forth", "forty", "found", "four", "from", "front", "full", "further", "furthermore", "fyi", "gave", "get", "gets", "getting", "give", "given", "gives", "giving", "goes", "going", "gone", "got", "gotten", "greetings", "had", "hadn", "hadn't", "happens", "hardly", "has", "hasn", "hasnt", "hasn't", "have", "haven", "haven't", "having", "hed", "he'd", "he'll", "hello", "help", "hence", "her", "here", "hereafter", "hereby", "herein", "heres", "here's", "hereupon", "hers", "herself", "hes", "he's", "hid", "him", "himself", "his", "hither", "home", "hopefully", "how", "howbeit", "however", "how's", "http", "https", "hundred", "ibid", "ignored", "i'll", "im", "i'm", "immediate", "immediately", "importance", "important", "inasmuch", "inc", "indeed", "index", "indicate", "indicated", "indicates", "information", "inner", "insofar", "instead", "interest", "into", "invention", "inward", "isn", "isn't", "itd", "it'd", "it'll", "its", "it's", "itself", "i've", "just", "keep", "keeps", "kept", "know", "known", "knows", "largely", "last", "lately", "later", "latter", "latterly", "least", "les", "less", "lest", "let", "lets", "let's", "like", "liked", "likely", "line", "little", "look", "looking", "looks", "los", "ltd", "made", "mainly", "make", "makes", "many", "may", "maybe", "mean", "means", "meantime", "meanwhile", "merely", "might", "mightn", "mightn't", "mill", "million", "mine", "miss", "more", "moreover", "most", "mostly", "move", "much", "mug", "must", "mustn", "mustn't", "myself", "name", "namely", "nay", "near", "nearly", "necessarily", "necessary", "need", "needn", "needn't", "needs", "neither", "never", "nevertheless", "new", "next", "nine", "ninety", "nobody", "non", "none", "nonetheless", "noone", "nor", "normally", "nos", "not", "noted", "nothing", "novel", "now", "nowhere", "obtain", "obtained", "obviously", "off", "often", "okay", "old", "omitted", "once", "one", "ones", "only", "onto", "ord", "org", "other", "others", "otherwise", "ought", "our", "ours", "ourselves", "out", "outside", "over", "overall", "owing", "own", "page", "pagecount", "pages", "par", "part", "particular", "particularly", "pas", "past", "per", "perhaps", "placed", "please", "plus", "poorly", "possible", "possibly", "potentially", "predominantly", "present", "presumably", "previously", "primarily", "probably", "promptly", "proud", "provides", "put", "que", "quickly", "quite", "ran", "rather", "readily", "really", "reasonably", "recent", "recently", "ref", "refs", "regarding", "regardless", "regards", "related", "relatively", "research", "research-articl", "respectively", "resulted", "resulting", "results", "right", "run", "said", "same", "saw", "say", "saying", "says", "sec", "second", "secondly", "section", "see", "seeing", "seem", "seemed", "seeming", "seems", "seen", "self", "selves", "sensible", "sent", "serious", "seriously", "seven", "several", "shall", "shan", "shan't", "she", "shed", "she'd", "she'll", "shes", "she's", "should", "shouldn", "shouldn't", "should've", "show", "showed", "shown", "showns", "shows", "side", "significant", "significantly", "similar", "similarly", "since", "sincere", "six", "sixty", "slightly", "some", "somebody", "somehow", "someone", "somethan", "something", "sometime", "sometimes", "somewhat", "somewhere", "soon", "sorry", "specifically", "specified", "specify", "specifying", "still", "stop", "strongly", "sub", "substantially", "successfully", "such", "sufficiently", "suggest", "sup", "sure", "system", "take", "taken", "taking", "tell", "ten", "tends", "than", "thank", "thanks", "thanx", "that", "that'll", "thats", "that's", "that've", "the", "their", "theirs", "them", "themselves", "then", "thence", "there", "thereafter", "thereby", "thered", "therefore", "therein", "there'll", "thereof", "therere", "theres", "there's", "thereto", "thereupon", "there've", "these", "they", "theyd", "they'd", "they'll", "theyre", "they're", "they've", "thickv", "thin", "thing", "things", "think", "third", "this", "thorough", "thoroughly", "those", "thou", "though", "thoughh", "thought", "thousand", "three", "throug", "through", "throughout", "thru", "thus", "til", "tip", "together", "too", "took", "top", "toward", "towards", "tried", "tries", "truly", "try", "trying", "twelve", "twenty", "twice", "two", "u201d", "under", "unfortunately", "unless", "unlike", "unlikely", "until", "unto", "upon", "ups", "use", "used", "useful", "usefully", "usefulness", "uses", "using", "usually", "value", "various", "very", "via", "viz", "vol", "vols", "volumtype", "want", "wants", "was", "wasn", "wasnt", "wasn't", "way", "wed", "we'd", "welcome", "well", "we'll", "well-b", "went", "were", "we're", "weren", "werent", "weren't", "we've", "what", "whatever", "what'll", "whats", "what's", "when", "whence", "whenever", "when's", "where", "whereafter", "whereas", "whereby", "wherein", "wheres", "where's", "whereupon", "wherever", "whether", "which", "while", "whim", "whither", "who", "whod", "whoever", "whole", "who'll", "whom", "whomever", "whos", "who's", "whose", "why", "why's", "widely", "will", "willing", "wish", "with", "within", "without", "won", "wonder", "wont", "won't", "words", "world", "would", "wouldn", "wouldnt", "wouldn't", "www", "yes", "yet", "you", "youd", "you'd", "you'll", "your", "youre", "you're", "yours", "yourself", "yourselves", "you've", "zero"])

# Add additional stopwords
stop_words.update(('jpg', 'imgur', 'reddit', 'lot', 'pretty'))

# Define all unwanted symbols, characters, etc. from the dataset
contraction_mapping = {"ain't": "is not", "aren't": "are not","can't": "cannot", "'cause": "because", "could've": "could have", "couldn't": "could not",
                            "didn't": "did not", "doesn't": "does not", "don't": "do not", "hadn't": "had not", "hasn't": "has not", "haven't": "have not",
                            "he'd": "he would","he'll": "he will", "he's": "he is", "how'd": "how did", "how'd'y": "how do you", "how'll": "how will", "how's": "how is",
                            "I'd": "I would", "I'd've": "I would have", "I'll": "I will", "I'll've": "I will have","I'm": "I am", "I've": "I have", "i'd": "i would",
                            "i'd've": "i would have", "i'll": "i will",  "i'll've": "i will have","i'm": "i am", "i've": "i have", "isn't": "is not", "it'd": "it would",
                            "it'd've": "it would have", "it'll": "it will", "it'll've": "it will have","it's": "it is", "let's": "let us", "ma'am": "madam",
                            "mayn't": "may not", "might've": "might have","mightn't": "might not","mightn't've": "might not have", "must've": "must have",
                            "mustn't": "must not", "mustn't've": "must not have", "needn't": "need not", "needn't've": "need not have","o'clock": "of the clock",
                            "oughtn't": "ought not", "oughtn't've": "ought not have", "shan't": "shall not", "sha'n't": "shall not", "shan't've": "shall not have",
                            "she'd": "she would", "she'd've": "she would have", "she'll": "she will", "she'll've": "she will have", "she's": "she is",
                            "should've": "should have", "shouldn't": "should not", "shouldn't've": "should not have", "so've": "so have","so's": "so as",
                            "this's": "this is","that'd": "that would", "that'd've": "that would have", "that's": "that is", "there'd": "there would",
                            "there'd've": "there would have", "there's": "there is", "here's": "here is","they'd": "they would", "they'd've": "they would have",
                            "they'll": "they will", "they'll've": "they will have", "they're": "they are", "they've": "they have", "to've": "to have",
                            "wasn't": "was not", "we'd": "we would", "we'd've": "we would have", "we'll": "we will", "we'll've": "we will have", "we're": "we are",
                            "we've": "we have", "weren't": "were not", "what'll": "what will", "what'll've": "what will have", "what're": "what are",
                            "what's": "what is", "what've": "what have", "when's": "when is", "when've": "when have", "where'd": "where did", "where's": "where is",
                            "where've": "where have", "who'll": "who will", "who'll've": "who will have", "who's": "who is", "who've": "who have",
                            "why's": "why is", "why've": "why have", "will've": "will have", "won't": "will not", "won't've": "will not have",
                            "would've": "would have", "wouldn't": "would not", "wouldn't've": "would not have", "y'all": "you all",
                            "y'all'd": "you all would","y'all'd've": "you all would have","y'all're": "you all are","y'all've": "you all have",
                            "you'd": "you would", "you'd've": "you would have", "you'll": "you will", "you'll've": "you will have",
                            "you're": "you are", "you've": "you have"}

class DataCleaner(object):
    """description of class"""
    
    @staticmethod
    def clean_text(text):
        # If text is marked as deleted, return empty string
        if text == '[deleted]':
            return ""

        # Convert all words to lowercase
        new_text = text.lower()

        # Remove HTML tags
        new_text = BeautifulSoup(new_text, "lxml").text

        # Perform contraction mapping (replace contraction with full words)
        new_text = ' '.join([contraction_mapping[t] if t in contraction_mapping else t for t in new_text.split(" ")])   

        # Remove ‘s
        new_text = re.sub(r"'s\b","",new_text)

        # Remove punctations and special characters (non-letters)
        new_text = re.sub("[^a-zA-Z]", " ", new_text) 

        # Remove stopwords
        tokens = [w for w in new_text.split() if not w in stop_words]

        # Only save words longer than 2 characters
        long_words=[]
        for i in tokens:
            if len(i)>=3:                  
                long_words.append(i)   
        
        return (" ".join(long_words)).strip()


