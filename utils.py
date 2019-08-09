import pandas as pd
import math

DATA_FILE_PATH = "data/data.csv"
AIRPORT_DELAY_FILE_PATH = "data/airport_delay.csv"
ORIGIN_DELAY_FILE_PATH = "static/origin_delay.csv"
AIRPORT_FILE_PATH = "data/airport_location.csv"

origin_col = "ORIGIN"
dest_col = "DEST"
dep_delay_new_col = "DEP_DELAY_NEW"
dep_delay_15_col = "DEP_DEL15"
n_flights_col = "n_flights"

origin_city_col = "origin_city"
origin_lat_col = "origin_lat"
origin_long_col = "origin_long"
dest_lat_col = "dest_lat"
dest_long_col = "dest_long"

airport_city_index = 2
airport_code_index = 4
airport_lat_index = 6
airport_long_index = 7

def save_data(file):
	file.save(DATA_FILE_PATH)

def process_airport_delay(data):
	used_columns = [origin_col, dest_col, dep_delay_new_col, dep_delay_15_col]
	return data[used_columns]

def process_origin_delay(delay_data, airport_info):
	data = delay_data.copy()
	data["n_flights"] = 1
	origin_delay_data = data.groupby(by=origin_col).sum()
	origin_delay_data["avg_delay"] = origin_delay_data[dep_delay_new_col]/origin_delay_data["n_flights"]
	origin_delay_data["pct_delay_flight"] = origin_delay_data[dep_delay_15_col]/origin_delay_data["n_flights"]*100

	origin_delay_data[origin_city_col] = origin_delay_data.index.to_series().apply(find_city, args=(airport_info,))
	origin_delay_data[origin_lat_col] = origin_delay_data.index.to_series().apply(find_latitude, args=(airport_info,))
	origin_delay_data[origin_long_col] = origin_delay_data.index.to_series().apply(find_longitute, args=(airport_info,))
	
	origin_delay_data.to_csv(ORIGIN_DELAY_FILE_PATH)

def load_data():
	return pd.read_csv(DATA_FILE_PATH)

def load_delay_data():
	return pd.read_csv(AIRPORT_DELAY_FILE_PATH)

def load_airport_data():
	return pd.read_csv(AIRPORT_FILE_PATH, header=None)

def find_city(code, airport_info):
	value = ""
	try:
		value = airport_info.loc[airport_info[airport_code_index] == code, airport_city_index].values[0]
	except:
		pass
	return value

def find_latitude(code, airport_info):
	value = math.nan
	try:
		value = airport_info.loc[airport_info[airport_code_index] == code, airport_lat_index].values[0]
	except:
		pass
	return value

def find_longitute(code, airport_info):
	value = math.nan
	try:
		value = airport_info.loc[airport_info[airport_code_index] == code, airport_long_index].values[0]
	except:
		pass
	return value