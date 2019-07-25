import pandas as pd

DATA_FILE_PATH = "data/data.csv"

def save_data(file):
	file.save(DATA_FILE_PATH)

def load_data():
	return pd.read_csv(DATA_FILE_PATH)