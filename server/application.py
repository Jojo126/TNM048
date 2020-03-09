# Import packages
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import json

import sqlite3
from sqlite3 import Error

import heapq
from operator import itemgetter

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer 
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import AgglomerativeClustering

# Declare globals
subreddit_list = ['leagueoflegends', 'DotA2', 'Minecraft', 'smashbros', 'GlobalOffensive', 'speedrun', 'Steam', 'nintendo', 'Games', 'gaming', 'boardgames', 'rpg', 'Overwatch',
                  'soccer', 'hockey', 'nfl', 'bodybuilding', 'powerlifting', 'MMA', 'running', 'bjj', 'nba', 'NASCAR', 'Boxing',
                  'PoliticalDiscussion', 'news', 'politics', 'conspiracy', 'Libertarian', 'Conservative', 'worldnews', 'worldpolitics', 'socialism',
                  'gameofthrones', 'harrypotter', 'television', 'NetflixBestOf', 'startrek', 'marvelstudios', 'movies', 'anime', 'thewalkingdead', 'TopGear', 'breakingbad', 'MovieSuggestions', 'lotr', 'entertainment', 'rupaulsdragrace',
                  'hiphopheads', 'kpop', 'Guitar', 'DJs', 'Music', 'classicalmusic', 'Metal', 'electronicmusic', 'piano', 'WeAreTheMusicMakers',
                  'Christianity', 'DebateReligion', 'atheism','Catholicism', 'Buddhism', 'exmormon', 'islam',
                  'learnprogramming', 'C_Programming', 'hacking', 'technology', 'spacex', 'space', 'science', 'Physics', 'dataisbeautiful', 'datascience', 'gamedev', 'webdev', 'MachineLearning', 'audiophile',
                  'Volvo', 'teslamotors', 'cars', 'Shitty_Car_Mods', 'AutoDetailing', 'Autos', 'MechanicAdvice', 'Cartalk',
                  'vegan', 'loseit', 'EatCheapAndHealthy', 'nutrition', 'food', 'Cooking', 'Baking', 'Pizza',
                  'aww', 'dogs', 'AnimalsBeingBros', 'AnimalsBeingJerks', 'cats', 'Pets',
                  'AdviceAnimals', 'AskReddit', 'LifeProTips', 'Advice', 'legaladvice', 'AskWomen', 'relationships', 'relationship_advice', 'confessions']
data = None

# Derived from python docs. Source: https://docs.python.org/2/library/sqlite3.html#sqlite3.Connection.row_factory
def dict_factory(cursor, row):
    """ A callback function for formatting the selected rows as dictionaries
        for easier jsonify.
    :param cursor: The Cursor object
    :param row: The row object and its parameters
    :return: A dictionary object
    """
    dict = {}
    for index, column in enumerate(cursor.description):
        dict[column[0]] = row[index]
    return dict

# Function derived from SQLite Tutorial. Source: https://www.sqlitetutorial.net/sqlite-python/sqlite-python-select/
def create_connection(database_file):
    """ Create a database connection to the SQLite database
        specified by a file path.
    :param database_file: Database file
    :return: Connection object or None
    """
    connection = None
    try:
        connection = sqlite3.connect(database_file)
    except Error as e:
        print(e)
 
    return connection

# Function derived from SQLite Tutorial. Source: https://www.sqlitetutorial.net/sqlite-python/sqlite-python-select/
def select_data(connection, conditions):
    """ Query all rows in the posts table.
    :param connection: The Connection object
    :param subreddit: The name of the subreddit of which data to select
    :return: The selected data
    """
    cursor = connection.cursor()
    cursor.execute("SELECT comment, score FROM posts WHERE " + conditions + " ORDER BY date ASC")

    return cursor.fetchall()

def get_top_words(documents, num_words):
    """ Create a bag of words by counting all words in the documents.
    :param documents: An array of all comments of a subreddit
    :param num_words: Number of words to return
    :return: A list of top n most common words
    """
    # The vocabulary (Bag of Words) containing all unique words and their frequency
    vocabulary = {}
    for document in documents:
        # Split the document into tokens
        tokens = document['comment'].split()
        score = document['score']

        # Check all tokens if they exist in the vocabulary
        for token in tokens:
            # Add token to the vocabulary
            if token not in vocabulary.keys():
                vocabulary[token] = [1, score]
            # Increment the word count if it already exists
            else:
                vocabulary[token][0] += 1
                vocabulary[token][1] += score

    # Get the top n most common words
    return heapq.nlargest(num_words, vocabulary.items(), key=itemgetter(1))

def merge_top_words(nodes, num_words):
    """ Create a bag of words by merging all word counts in the node word lists.
    :param nodes: An array of subreddits with corresponding word lists
    :param num_words: Number of words to return
    :return: A list of top n most common words
    """
    total_top_words = {}
    for node in nodes:
        for word_object in node['words']:
            word = word_object['word']
            if word not in total_top_words.keys():
                total_top_words[word] = [word_object['amount'], word_object['score']]
            else:
                total_top_words[word][0] += word_object['amount']
                total_top_words[word][1] += word_object['score']
    
    # Get the top n most common words
    return heapq.nlargest(num_words, total_top_words.items(), key=itemgetter(1))

def create_simularity_matrix(term_documents):
    """ Make a term frequency–inverse document frequency matrix 
        from given documents, and compute cosine simularities.
    :param term_documents: A list of documents
    :return: A matrix holding cosine simularities between the documents
    """
    # Create a sparse document matrix with the word counts
    vectorizer = CountVectorizer()
    count_matrix = vectorizer.fit_transform(term_documents)

    # Transform the word counts matrix to a tf idf matrix
    tfidf_transformer = TfidfTransformer()
    tfidf_matrix = tfidf_transformer.fit_transform(count_matrix)

    # Compute document simularities between the different subreddits
    return cosine_similarity(tfidf_matrix)

def create_simularity_links(simularity_matrix, num_subreddits, tolerance):
    """ Make a list of a link system between different subreddits
        based on the cosine simularity.
    :param simularity_matrix: A matrix holding cosine simularities
    :param num_subreddits: The total number of subreddits
    :param tolerance: A tolerance threshold for links
    :return: A list of the linked system
    """
    # Create an undirected linked graph system
    links = []
    for source in range (num_subreddits):
        # Let the simularities be weights
        weights = simularity_matrix[source]

        # Compare the weights between the source and targets
        for target in range(source+1, num_subreddits):
            if weights[target] > tolerance:
                links.append({'source':subreddit_list[source],'target':subreddit_list[target], 'value':weights[target]})

    return links           

                
def cluster_data(simularity_matrix, num_clusters):
    """ Apply hierarchical clustering based on the cosine distance
        between documents.
    :param simularity_matrix: A matrix holding cosine simularities
    :param num_clusters: The total number of clusters
    :return: A list of group ids connected to documents (subreddits in our case)
    """
    # Distances between documents
    dist = 1 - simularity_matrix

    # Apply hierarchical clustering using ward linkage
    cluster = AgglomerativeClustering(n_clusters=num_clusters, affinity='euclidean', linkage='ward')
    groups = cluster.fit_predict(dist)

    # Print the group hierarchy to console
    #print_cluster_grouping(groups, num_clusters)
        
    return groups

def print_cluster_grouping(groups, num_clusters):
    """ Prints all groups with their subreddits to the console
        for analysing purpose.
    :param groups: A list of group ids connected to the documents
    :param num_clusters: The total number of clusters
    """
    group_index = 0
    for group_id in range(num_clusters):
        print("\nGroup " + str(group_id) + " : ")

        for index in range(len(groups)):
            if groups[index] == group_id:
                print(subreddit_list[index])

def data_mine():
    # Create a connection to the database
    database = r"C:\Users\persj\Desktop\InfoVis\reddit-comments-may-2015\processed_database.db"
    connection = create_connection(database)

    nodes = []
    term_documents = []

    print("Creating word frequency vocabularies..")
    with connection:
        # Set the row format to dictionary
        connection.row_factory = dict_factory

        # Process one subreddit at a time
        for name in subreddit_list:
            # Select all data from specified subreddit
            conditions = "subreddit='"+name+"'"
            posts = select_data(connection, conditions)

            # Count word frequency and return the top n words
            top_words = get_top_words(posts, 50)

            words=[]
            word_list = []
            for word in top_words:
                word_list.append(word[0])
                words.append({'word':word[0],'amount':word[1][0], 'score':round(word[1][1] / word[1][0])})
            
            # Save the top words as a text to use in a term document matrix
            term_documents.append(" ".join(word_list))

            # Save the subreddit as a node
            nodes.append({'id':name, 'size':len(posts), 'group': 0, 'words':words})
    
    # Merge word lists for each node and return top 50 words
    total_top_words = merge_top_words(nodes, 50)
    words = []
    for word_object in total_top_words:
        words.append({'word':word_object[0],'amount':word_object[1][0], 'score':word_object[1][1]})

    print("Word frequency vocabularies complete!")

    # Compute document simularities between the subreddits
    simularity_matrix = create_simularity_matrix(term_documents)

    # Compute weights for the linked graph based on the cosine simularities
    links = create_simularity_links(simularity_matrix, num_subreddits=len(term_documents), tolerance=0.09)

    # Cluster the subreddits
    print("Performing hierarchical clustering..")
    groups = cluster_data(simularity_matrix, num_clusters=12)
    print("Hierarchical clustering complete!")

    # Add group ids to the nodes
    for index in range(len(nodes)):
        nodes[index]['group'] = int(groups[index])

    global data
    data = {'nodes':nodes, 'links':links, 'words':words}  

    # Save data to a file
    #with open('data.json', 'w') as outfile:
        #print("Saving data to file..")
        #json.dump(data, outfile)

    print("Data mining complete!")

# Instantiate the application
app = Flask(__name__, template_folder='../app')
CORS(app)

@app.route("/main", methods=["GET","POST"])

@app.route("/", methods=["GET","POST"])
def frontpage():
    return render_template("index.html")

@app.route("/get-data",methods=["GET", "POST"])
def fetch_data():
    global data
    return jsonify(data)

@app.route("/get-wordlist", methods=["GET", "POST"])
def fetch_wordlist():
    print(request.method)
    post_data = request.data.decode('utf-8')
    tokens = str(post_data).split()

    word_list = {}
    with open('../app/data//data.json') as json_file:
        json_data = json.load(json_file)
        subreddits = json_data['nodes']

        for token in tokens:
            for subreddit in subreddits:
                if subreddit['id'] == token:
                    for word_object in subreddit['words']:
                        word = word_object['word']
                        if word not in word_list.keys():
                            word_list[word] = [word_object['amount'], word_object['score']]
                        else:
                            word_list[word][0] += word_object['amount']
                            word_list[word][1] += word_object['score']

    word_list_sorted = heapq.nlargest(50, word_list.items(), key=itemgetter(1))
    word_list_dict = []
    for word_object in word_list_sorted:
        word_list_dict.append({'word':word_object[0],'amount':word_object[1][0], 'score':word_object[1][1]})

    return jsonify(word_list_dict)

if __name__ == "__main__":
    # Uncomment data_mine() to create new data and save to json file
    #data_mine()
    # Run the server
    try:
        app.run()
    finally:
        print("Closing connection to server..")