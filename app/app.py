# HTTP SERVER

import json

from flask import Flask, request, render_template
from flask_cors import CORS
from simulator import Simulator
from store import QRangeStore
from db import db
from models import Simulation
import logging
from datetime import datetime

############################## Application Configuration ##############################

app = Flask(__name__)
CORS(app, origins=["http://localhost:3030"])

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
db.init_app(app)

logging.basicConfig(level=logging.INFO)

with app.app_context():
    db.create_all()


############################## API Endpoints ##############################


@app.get("/")
def health():
    return "<p>Sedaro Nano API - running!</p>"


@app.get("/simulation")
def get_data():
    # Get most recent simulation from database
    simulation: Simulation = Simulation.query.order_by(Simulation.id.desc()).first()

    return render_template("simulation.html", simulation=simulation)


@app.post("/simulation")
def simulate():
    # Get data from request in this form
    # init = {
    #     "Body1": {"x": 0, "y": 0.1, "vx": 0.1, "vy": 0},
    #     "Body2": {"x": 0, "y": 1, "vx": 1, "vy": 0},
    # }

    # Define time and timeStep for each agent
    init: dict = request.json
    for key in init.keys():
        init[key]["time"] = 0
        init[key]["timeStep"] = 0.01

    # Create store and simulator
    t = datetime.now()
    store = QRangeStore()
    simulator = Simulator(store=store, init=init)
    logging.info(f"Time to Build: {datetime.now() - t}")

    # Run simulation
    t = datetime.now()
    simulator.simulate()
    logging.info(f"Time to Simulate: {datetime.now() - t}")

    # Save data to database
    simulation = Simulation(data=json.dumps(store.store))
    db.session.add(simulation)
    db.session.commit()

    return store.store
