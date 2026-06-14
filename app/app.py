# HTTP SERVER
import json
import logging
from datetime import datetime

from flask import Flask, request
from flask_cors import CORS
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from analysis import sim_center_of_mass
from db import db
from db_helper import get_simulation_by_id, store_simulation_run, store_analysis
from models import Simulation, SimulationBody, SimulationSchema, SimulationAnalysis, SimulationAnalysisSchema
from modsim import make_agents
from simulator import Simulator
from store import QRangeStore

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


@app.get("/simulation/latest")
def get_data_latest():
    # Get most recent simulation from database
    sim: Simulation = (Simulation.query
        .order_by(Simulation.id.desc())
        .options(selectinload(Simulation.simulationBodies).joinedload(SimulationBody.simulationSteps))
        .first())
    return SimulationSchema.model_validate(sim).model_dump_json() if sim else []

@app.get("/simulation")
def get_data():
    stmt = (select(Simulation)
            .options(selectinload(Simulation.simulationBodies))
            .order_by(Simulation.id.desc()))

    sims: list[Simulation] = db.session.scalars(stmt).all()
    simulations = []
    for sim in sims:
        simulations.append({
            "id": sim.id,
            "created_at": sim.created_at,
            "description": sim.description,
            "num_bodies": len(sim.simulationBodies),
        })

    return json.dumps(simulations)

@app.get("/simulation/<simulation>")
def get_data_for_sim(simulation: int):
    sim = get_simulation_by_id(simulation)
    return SimulationSchema.model_validate(sim).model_dump_json() if sim else []



@app.post("/simulation")
def simulate():
    # This is the structure I'm working with
    # init = {
    #     "Body1": {"x": 0, "y": 0.1, "vx": 0.1, "vy": 0},
    #     "Body2": {"x": 0, "y": 1, "vx": 1, "vy": 0},
    # }

    # Define time and timeStep for each agent
    init: dict = request.json
    description = init.pop("description", "")
    agents = make_agents(list(init.keys()))
    for key in init.keys():
        init[key]["time"] = 0
        init[key]["timeStep"] = 0.01

    # Create store and simulator
    t = datetime.now()
    store = QRangeStore()
    simulator = Simulator(store=store, init=init, agents=agents)
    logging.info(f"Time to Build: {datetime.now() - t}")

    # Run simulation
    t = datetime.now()
    simulator.simulate()
    logging.info(f"Time to Simulate: {datetime.now() - t}")

    # Save data to database
    simulation_id = store_simulation_run(store, description)

    return json.dumps({"id": simulation_id})



@app.get("/analysis/<simulation>")
def get_simulation_analysis(simulation: int):
    sim: Simulation = get_simulation_by_id(simulation)
    sim_analysis: SimulationAnalysis = sim.simulationAnalysis
    if not sim: return ""
    if not sim_analysis:
        cms: dict = sim_center_of_mass(sim.simulationBodies)
        sim_analysis = store_analysis(cms, simulation)

    return SimulationAnalysisSchema.model_validate(sim_analysis).model_dump_json()
