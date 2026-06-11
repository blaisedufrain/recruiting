# HTTP SERVER

from typing import List

from flask import Flask, request, render_template
from flask_cors import CORS
from sqlalchemy.orm import selectinload

from modsim import make_agents
from simulator import Simulator
from store import QRangeStore
from db import db
from models import Simulation, SimulationBody, SimulationStep, SimulationSchema
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
    simulation: Simulation = (Simulation.query
        .order_by(Simulation.id.desc())
        .options(selectinload(Simulation.simulationBodies).joinedload(SimulationBody.simulationSteps))
        .first())
    return SimulationSchema.model_validate(simulation).model_dump_json() if simulation else []


@app.post("/simulation")
def simulate():
    # Get data from request in this form
    # init = {
    #     "Body1": {"x": 0, "y": 0.1, "vx": 0.1, "vy": 0},
    #     "Body2": {"x": 0, "y": 1, "vx": 1, "vy": 0},
    # }

    # Define time and timeStep for each agent
    init: dict = request.json
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
    store_simulation_run(store)

    return store.store


def store_simulation_run(store: QRangeStore):
    simulation = Simulation(created_at=datetime.now().isoformat())
    db.session.add(simulation)
    db.session.commit()
    db.session.flush()
    (_, _, initial_state) = store.store[0]
    bodies: dict[str, SimulationBody] = {}
    for body_name, body_state in initial_state.items():
        body = SimulationBody(
            simulation_id=simulation.id,
            name=body_name,
            mass=body_state['mass']
        )
        db.session.add(body)
        db.session.flush()
        bodies[body_name] = body

    steps: List[SimulationStep] = []
    for (t_start, t_end, state) in store.store:
        for (body_name, body_state) in state.items():
            pos = body_state['position'],
            vel = body_state['velocity'],
            steps.append(SimulationStep(
                t_start=t_start,
                t_end=t_end,
                time=body_state['time'],
                pos_x=pos[0]['x'],
                pos_y=pos[0]['y'],
                pos_z=pos[0]['z'],
                vel_x=vel[0]['x'],
                vel_y=vel[0]['y'],
                vel_z=vel[0]['z'],
                time_step=body_state['timeStep'],
                body_id=bodies[body_name].id
            ))
    db.session.add_all(steps)
    db.session.commit()
