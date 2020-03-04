# Import packages
from flask import Flask, render_template, jsonify
from flask_cors import CORS
import pandas as pd
import json

import sqlite3
from sqlite3 import Error

import heapq
from operator import itemgetter

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer 
from sklearn.metrics.pairwise import cosine_similarity

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
        for easier jsonify
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
    """ create a database connection to the SQLite database
        specified by the database_file
    :param database_file: database file
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
    """
    Query all rows in the posts table
    :param connection: The Connection object
    :param subreddit: The name of the subreddit of which data to select
    :return: The selected data
    """
    cursor = connection.cursor()
    cursor.execute("SELECT comment, score FROM posts WHERE " + conditions + " ORDER BY date ASC")

    return cursor.fetchall()

def get_top_words(documents, num_words):
    """
    Create a bag of words by counting all words in the documents
    :param documents: An array of all comments of a subreddit
    :param num_words: Number of words to return
    :return: the selected data
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

def data_mine():
    # Create a connection to the database
    database = r"C:\Users\persj\Desktop\InfoVis\reddit-comments-may-2015\processed_database.db"
    connection = create_connection(database)

    nodes = []
    term_documents = []

    print("Loading data..")
    with connection:
        # Set the row format to dictionary
        connection.row_factory = dict_factory

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
            
            # Save the words as a text to use in a term document matrix to compute simularities
            term_documents.append(" ".join(word_list))

            # Save the subreddit as a node
            nodes.append({'id':name, 'size':len(posts), 'words':words})
    
    print("Finished loading data")

    # Compute weights for the linked graph based on the cosine simularities
    print("Computing cosine simularities..")
    links = compute_cosine_simularities(term_documents)

    global data
    data = {'nodes':nodes, 'links':links}  

    # Save data to a file
    with open('data.json', 'w') as outfile:
        print("Saving data to file")
        json.dump(data, outfile)

    print("Data mining complete")
    

def compute_cosine_simularities(documents):
    # Create a sparse document matrix with the word counts
    vectorizer = CountVectorizer()
    count_matrix = vectorizer.fit_transform(documents)

    # Transform the word counts matrix to a tf idf matrix
    tfidf_transformer = TfidfTransformer()
    tfidf_matrix = tfidf_transformer.fit_transform(count_matrix)

    # Minimum tolerance value for cosine simularity
    tolerance = 0.09

    # Number of unique subreddits
    num_subreddits = len(documents)
    
    # Create an undirected linked graph system
    links = []
    for source in range (num_subreddits):
        # Calculate the cosine simularities
        weights = cosine_similarity(tfidf_matrix[source], tfidf_matrix)[0]

        # Compare the weights between the source and targets
        for target in range(source+1, num_subreddits):
            if weights[target] > tolerance:
                links.append({'source':subreddit_list[source],'target':subreddit_list[target], 'value':weights[target]})
        
    return links

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

if __name__ == "__main__":
    data_mine()
    # Run the server
    try:
        app.run()
    finally:
        print("Closing connection to server..")