import sqlite3
from sqlite3 import Error
import numpy as np
import heapq

# Import local class for cleaning the text data
from cleaner import DataCleaner

# List of selected subreddits
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


def select_data(connection, limit, subreddit):
    """
    Query all rows in the tasks table
    :param connection: the Connection object
    :param limit Selection limit
    :param subreddit: Name of the subreddit to select
    :return:
    """
    cursor = connection.cursor()
    cursor.execute("SELECT body, subreddit, created_utc, score FROM May2015 WHERE subreddit=? LIMIT " + str(limit), (subreddit,))

    # Fetch all selected data
    data = cursor.fetchall()
    cursor.close()

    return data

def create_table(connection, create_table_sql):
    """ create a table from the create_table_sql statement
    :param connection: Connection object
    :param create_table_sql: a CREATE TABLE query
    :return:
    """
    try:
        cursor = connection.cursor()
        cursor.execute(create_table_sql)
    except Error as e:
        print(e)

def clean_text_data(data):
    processed_data = []
    print("Cleaning text data..")
    for row in data:
        # Clean the text by removing stopwords, punctuations, special characters etc.
        processed_text = DataCleaner.clean_text(row[0])
        # Only save the processed text if the string is longer than 2 characters
        if len(processed_text) > 2:
            # Columns (comment, subreddit, date, score)
            processed_data.append((processed_text, row[1], row[2], row[3]))
                
    print("Cleaning complete!")
    return processed_data
    
def insert_data(connection, data):
    try:
        cursor = connection.cursor()
        # Query the format
        insert_query = """INSERT INTO posts
                        (comment, subreddit, date, score) 
                        VALUES (?, ?, ?, ?);"""
        # Insert all rows as tuples
        cursor.executemany(insert_query, data)
        connection.commit()
        print("Totally", cursor.rowcount, "rows inserted successfully into posts table")
        connection.commit()
        cursor.close()

    except Error as e:
        print(e)

def create_tables(connection):
    sql_create_posts_table = """ CREATE TABLE IF NOT EXISTS posts (
                                    comment text,
                                    subreddit text,
                                    date int,
                                    score int
                            ); """
    with connection:
        # Create posts table
        create_table(connection, sql_create_posts_table)

def main():
    # Establish connection to the new database to insert processed data
    processed_database = r"C:\Users\persj\Desktop\InfoVis\data-preprocessing\reddit-comments-may-2015\database_new.db"    
    connection_insert = create_connection(processed_database)
    # Create a posts table in the new database with parameters: comment, subreddit, date, score
    create_tables(connection_insert)

    # Establish connection to the original database to select unprocessed data
    database = r"C:\Users\persj\Desktop\InfoVis\data-preprocessing\reddit-comments-may-2015\database.sqlite"
    connection_select = create_connection(database)

    with connection_select:
        for subreddit in subreddit_list:
            print("\nSelecting subreddit: ")
            print(subreddit)

            # Select a given number of rows from a specified subreddit
            data = select_data(connection_select, 20000, subreddit)

            # Clean the text
            processed_data = clean_text_data(data)

            # Save the processed data into new database
            with connection_insert:
                insert_data(connection_insert, processed_data)
    
    print("Closing connections..")
    connection_select.close()
    connection_insert.close()
        
if __name__ == '__main__':
    main()