import pandas as pd
import math

DATA_FILE_PATH = "data/data.csv"
AIRPORT_DELAY_FILE_PATH = "data/airport_delay.csv"
AIRPORT_FILE_PATH = "data/airport_location.csv"

airport_city_index = 2
airport_code_index = 4
airport_lat_index = 6
airport_long_index = 7

def save_data(file):
	file.save(DATA_FILE_PATH)

def load__data():
	return pd.read_csv(DATA_FILE_PATH)

def load_delay_data():
	return pd.read_csv(AIRPORT_DELAY_FILE_PATH)

def load_airport_data():
	return pd.read_csv(AIRPORT_FILE_PATH, header=None)

def find_city(code, airport_data):
	value = ""
	try:
		value = airport_data.loc[airport_data[airport_code_index] == code, airport_city_index].values[0]
	except:
		pass
	return value

def find_latitude(code, airport_data):
	value = math.nan
	try:
		value = airport_data.loc[airport_data[airport_code_index] == code, airport_lat_index].values[0]
	except:
		pass
	return value

def find_longitute(code, airport_data):
	value = math.nan
	try:
		value = airport_data.loc[airport_data[airport_code_index] == code, airport_long_index].values[0]
	except:
		pass
	return value