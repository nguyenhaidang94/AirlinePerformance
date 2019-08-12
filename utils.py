import pandas as pd
import math
import joblib
from sklearn.preprocessing import OneHotEncoder
import xgboost as xgb
from xgboost import DMatrix
import numpy as np
from datetime import datetime,date

DATA_FILE_PATH = "data/data.csv"
AIRPORT_DELAY_FILE_PATH = "data/airport_delay.csv"
ORIGIN_CARRIER_DELAY_FILE_PATH = "data/origin_carrier_delay.csv"

ORIGIN_DELAY_FILE_PATH = "static/origin_delay.csv"
FLIGHT_TIMESERIES_FILE_PATH = "static/flight-timeseries.csv"
CARRIER_DELAY_FILE_PATH = "static/carrier_delay.csv"

AIRPORT_FILE_PATH = "data/airport_location.csv"
UNIQUE_CARRIER_FILE_PATH = "data/unique_carriers.csv"

HEATMAP_CALENDAR_FILE_PATH = "data/heatmap_data.csv"

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


def process_data_barchart(data,typechart):
	dp_columns = ["DAY_OF_WEEK","DEP_DELAY_NEW"]
	ar_columns = ["DAY_OF_WEEK","ARR_DELAY_NEW"]
	if typechart == "CARRIER":
		dp_add_column = ["OP_UNIQUE_CARRIER"]
		ar_add_column = ["OP_UNIQUE_CARRIER"]

	else:

		dp_add_column = ["ORIGIN"]
		ar_add_column = ["DEST"]

	dp_columns = dp_columns + dp_add_column
	ar_columns = ar_columns + ar_add_column


	dep = data[dp_columns].groupby(["DAY_OF_WEEK"]+dp_add_column).\
	        agg('mean').reset_index().\
	        rename(columns={'DEP_DELAY_NEW':'delay_time',dp_add_column[0]:"NAME"}).\
	        sort_values(by="delay_time",ascending=False).\
	            groupby("DAY_OF_WEEK").first()

	dep['type'] = "DEP"

	arrive = data[ar_columns].groupby(["DAY_OF_WEEK"]+ar_add_column).\
	        agg('mean').reset_index().\
	        rename(columns={'ARR_DELAY_NEW':'delay_time',ar_add_column[0]:"NAME"}).\
	        sort_values(by="delay_time",ascending=False).\
	            groupby("DAY_OF_WEEK").first()

	arrive['type'] = "ARR"

	res = pd.concat((dep,arrive),axis=0).reset_index()

	return res

def process_data_sunburst(data):
	used_columns = ["DAY_OF_WEEK","OP_UNIQUE_CARRIER","DEP_DELAY_NEW"]
	res = data[used_columns][data.DEP_DELAY_NEW>0].\
								groupby(["DAY_OF_WEEK","OP_UNIQUE_CARRIER"]).\
							    agg('count')
	res["Node"] = "root"

	return res

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

def process_origin_carrier_delay(data):
	used_columns = [origin_col, "OP_UNIQUE_CARRIER", dep_delay_15_col]
	data[used_columns].to_csv(ORIGIN_CARRIER_DELAY_FILE_PATH)

def process_flight_timeseries(full_data):
	used_columns = ["FL_DATE", "DEP_DEL15"]
	data = full_data[used_columns]
	data["n_flights"] = 1
	flight_timeseries = data.groupby(by="FL_DATE").sum()
	flight_timeseries.to_csv(FLIGHT_TIMESERIES_FILE_PATH)

def process_carrier_delay(full_data):
	used_columns = ["OP_UNIQUE_CARRIER", "DEP_DEL15", "DEP_DELAY_NEW"]
	data = full_data[used_columns]
	data["n_flights"] = 1
	carrier_delay = data.groupby(by="OP_UNIQUE_CARRIER").sum()
	carrier_delay["pct_delay_flight"] = carrier_delay["DEP_DEL15"]/carrier_delay["n_flights"]*100
	carrier_delay["avg_delay"] = carrier_delay["DEP_DELAY_NEW"]/carrier_delay["n_flights"]
	carrier_delay.sort_values(by="n_flights", ascending=False, inplace=True)

	unique_carrier = load_unique_carrier()
	carrier_delay["carrier_name"] = carrier_delay.index.to_series().apply(find_carrier_name, args=(unique_carrier,))
	carrier_delay.to_csv(CARRIER_DELAY_FILE_PATH)

def load_data():
	return pd.read_csv(DATA_FILE_PATH)

def load_delay_data():
	return pd.read_csv(AIRPORT_DELAY_FILE_PATH)

def load_airport_data():
	return pd.read_csv(AIRPORT_FILE_PATH, header=None)

def load_origin_carrier_delay():
	return pd.read_csv(ORIGIN_CARRIER_DELAY_FILE_PATH)

def load_unique_carrier():
	return pd.read_csv(UNIQUE_CARRIER_FILE_PATH)

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

def find_carrier_name(code, unique_carrier):
	value = ""
	try:
		value = unique_carrier.loc[unique_carrier["Code"] == code, "Description"].values[0]
	except:
		pass
	return value

## Function for predict
def ranking(arr):
	array = np.array(arr)
	temp = array.argsort()
	ranks = np.empty_like(temp)
	ranks[temp] = np.arange(len(array))
	return ranks

def prepare_data_predict(data,encoder,onehot_features,con_features):
	cat_data = encoder.transform(data[onehot_features]).toarray()
	con_data = data[con_features].values
	res = np.concatenate((cat_data,con_data),axis=1)
	res = DMatrix(res)
	return res


MODEL_PATH = "model/final.model"
ENCODER_PATH = "model/onehot.encoder"

def load_model():
	model = joblib.load(MODEL_PATH)
	encoder = joblib.load(ENCODER_PATH)
	return model,encoder

def predict(data,encoder,model):
	onehot_features = ['DAY_OF_MONTH', 'DAY_OF_WEEK', 'OP_UNIQUE_CARRIER']
	con_features = ['CRS_DEP_TIME','CRS_ARR_TIME','DISTANCE']
	data = prepare_data_predict(data,encoder,onehot_features,con_features)
	res = model.predict(data)
	res = ranking(res)
	return res

TEST_DATA_PATH = "data/test_data.csv"
def query_data(dep,arr,date):
	data = pd.read_csv(TEST_DATA_PATH)
	data["FL_DATE"] = data["FL_DATE"].apply(pd.Timestamp)
	date = pd.Timestamp(date)
	res = data[(data.FL_DATE == date)&(data.ORIGIN_CITY_NAME==dep)&(data.DEST_CITY_NAME==arr)]
	return res


def process_heatmap_data(data):
	# data = pd.read_csv(DATA_FILE_PATH)
	data = data[['FL_DATE','DEP_DEL15','CANCELLED']]
	data = data.drop( data[(data['CANCELLED'] == 1)].index)
	data.drop(columns=['CANCELLED'],inplace=True)
	data.drop(columns=['CANCELLED'],inplace=True)
	data = (data.groupby('FL_DATE').sum()/data.groupby('FL_DATE').count()*100).reset_index(drop=False)
	data['FL_DATE'] = pd.to_datetime(data['FL_DATE'])
	data['FL_DATE'] = data['FL_DATE'].apply(lambda x: x.strftime('%Y%m%d')).astype(int)
	data.to_csv(path_or_buf=HEATMAP_CALENDAR_FILE_PATH,index = False)
