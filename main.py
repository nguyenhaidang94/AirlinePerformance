from flask import Flask, render_template, url_for, request, json, Response
from utils import *

ALLOWED_EXTENSIONS = {'csv'}

origin_col = "ORIGIN"
dest_col = "DEST"
dep_delay_new_col = "DEP_DELAY_NEW"
dep_delay_15_col = "DEP_DEL15"
n_flights_col = "n_flights"

origin_lat_col = "origin_lat"
origin_long_col = "origin_long"
dest_lat_col = "dest_lat"
dest_long_col = "dest_long"

full_data = load_data()
airport_data = load_airport_data()

app = Flask(__name__)

@app.route("/")
def home():
	return render_template("index.html")

@app.route("/visualization")
def visualize():
	return render_template("visualization.html")

def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/import", methods=["GET", "POST"])
def import_data():
	if request.method == 'GET':
		return render_template("upload.html")
	else:
		file = request.files["file"]
		if not allowed_file(file.filename):
			return "Only csv files are allowed."
		save_data(file)
		return render_template("upload_success.html")

def get_delayed_airport():
	used_columns = [origin_col, dest_col, dep_delay_new_col, dep_delay_15_col]
	data = full_data[used_columns]
	data[n_flights_col] = 1
	origin_delay_data = data.groupby(by=origin_col).sum()
	origin_delay_data["avg_delay"] = origin_delay_data[dep_delay_new_col]/origin_delay_data[n_flights_col]
	origin_delay_data["pct_delay_flight"] = origin_delay_data[dep_delay_15_col]/origin_delay_data[n_flights_col]*100

	origin_delay_data["origin_city"] = origin_delay_data.index.to_series().apply(find_city, args=(airport_data,))
	origin_delay_data[origin_lat_col] = origin_delay_data.index.to_series().apply(find_latitude, args=(airport_data,))
	origin_delay_data[origin_long_col] = origin_delay_data.index.to_series().apply(find_longitute, args=(airport_data,))
	
	return origin_delay_data

@app.route("/delayed-route/<airportCode>", methods=["GET"])
def get_delayed_route(airportCode):
	# return top 10 destination
	n_top = 10
	used_columns = [dest_col, dep_delay_new_col]
	data = full_data.loc[full_data[origin_col] == airportCode, used_columns].groupby(by=dest_col).sum().sort_values(by=dep_delay_new_col, ascending=False)[0:n_top]
	data[origin_lat_col] = data.index.to_series().apply(find_latitude, args=(airport_data,))
	data[origin_long_col] = data.index.to_series().apply(find_longitute, args=(airport_data,))
	
	json_string = data.to_json(orient="records")
	resp = Response(json_string, status=200, mimetype='application/json')
	return resp