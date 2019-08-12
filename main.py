from flask import Flask, render_template, url_for, request, json, Response
import pandas as pd
import numpy as np
from flask import jsonify
from utils import *

ALLOWED_EXTENSIONS = {'csv'}

airport_info = load_airport_data()

app = Flask(__name__)

@app.route("/")
def home():
	return render_template("visualization.html")

@app.route("/visualization",methods=["GET", "POST"])
def visualize():
	if request.method =="GET":
		return render_template("visualization.html")
	else:

		dep = request.form["myDepature"]
		arr = request.form["myArrive"]
		date = request.form["date"]
		## test data is dataframe
		test_data = query_data(dep,arr,date)
		model,encoder = load_model()
		if len(test_data) == 0:
			# return '''<h1>The data is: {}</h1>'''.format(date)
			return '''<h1>Do not have flight in {}</h1>'''.format(date)
		elif(len(test_data)>=1):
			test_data['ranking'] = predict(test_data,encoder,model)
			test_data = test_data.sort_values(by='ranking',ascending=True).reset_index()

		result = test_data.head(5)[['OP_UNIQUE_CARRIER',"DEP_DELAY_NEW"]]

		# return '''<h1>The data is: {}</h1>'''.format(result.to_string())
		return render_template("visualization.html",data=result.to_json(orient="records"))

@app.route("/prediction",methods=["POST"])
def predict():
	print(request.get_json())
	return "<h1>OK</h1>"

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
		data = load_data()

		airport_delay_data = process_airport_delay(data)
		airport_delay_data.to_csv(AIRPORT_DELAY_FILE_PATH)

		process_origin_delay(airport_delay_data, airport_info)
		# airport_delay_data = load_delay_data()

		process_origin_carrier_delay(data)
		process_flight_timeseries(data)
		process_carrier_delay(data)
		process_heatmap_data(data)
		return render_template("upload_success.html")

@app.route("/delayed-route/<airportCode>", methods=["GET"])
def get_delayed_route(airportCode):
	airport_delay_data = load_delay_data()
	# return top 10 destinations
	n_top = 10
	used_columns = [dest_col, dep_delay_new_col]
	data = airport_delay_data.loc[airport_delay_data[origin_col] == airportCode, used_columns].groupby(by=dest_col).sum().sort_values(by=dep_delay_new_col, ascending=False)[0:n_top]
	data[origin_lat_col] = data.index.to_series().apply(find_latitude, args=(airport_info,))
	data[origin_long_col] = data.index.to_series().apply(find_longitute, args=(airport_info,))

	json_string = data.to_json(orient="records")
	resp = Response(json_string, status=200, mimetype='application/json')
	return resp

@app.route("/delayed-carrier/<airportCode>", methods=["GET"])
def get_delayed_carrier(airportCode):
	# return top 10 carriers
	n_top = 10
	full_data = load_origin_carrier_delay()
	used_columns = ["OP_UNIQUE_CARRIER", dep_delay_15_col]
	data = full_data.loc[full_data[origin_col] == airportCode, used_columns]
	data["n_flights"] = 1
	carrier_delay = data.groupby(by="OP_UNIQUE_CARRIER").sum()
	carrier_delay["pct_delay_flight"] = carrier_delay["DEP_DEL15"]/carrier_delay["n_flights"]

	unique_carrier = load_unique_carrier()
	carrier_delay["carrier_name"] = carrier_delay.index.to_series().apply(find_carrier_name, args=(unique_carrier,))

	json_string = carrier_delay.sort_values(by="pct_delay_flight", ascending=False)[0:n_top].to_json(orient="records")
	resp = Response(json_string, status=200, mimetype='application/json')
	return resp
