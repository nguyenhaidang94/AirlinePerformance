from flask import Flask, render_template, url_for, request
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'csv'}
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
		file.save("data/data.csv")
		return render_template("upload_success.html")