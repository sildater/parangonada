import numpy as np
import json
from flask import Flask, escape, request, render_template

app = Flask(__name__)

@app.route('/')

def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run()



