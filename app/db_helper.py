import json
from datetime import datetime
from typing import List

from sqlalchemy.orm import selectinload, joinedload

from db import db
from models import Simulation, SimulationBody, SimulationAnalysis, SimulationStep
from store import QRangeStore


def get_simulation_by_id(simulation: int) -> Simulation:
    return (Simulation.query
                       .options(
                            selectinload(Simulation.simulationBodies).joinedload(SimulationBody.simulationSteps),
                            joinedload(Simulation.simulationAnalysis))
                       .get(simulation))

def store_simulation_run(store: QRangeStore, description: str) -> int:
    (_, _, initial_state) = store.store[0]
    simulation: Simulation = Simulation(
        created_at=datetime.now().isoformat(),
        description=description
    )
    db.session.add(simulation)
    db.session.commit()
    db.session.flush()
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
            pos = body_state['position']
            vel = body_state['velocity']
            steps.append(SimulationStep(
                t_start=t_start,
                t_end=t_end,
                time=body_state['time'],
                pos_x=pos['x'],
                pos_y=pos['y'],
                pos_z=pos['z'],
                vel_x=vel['x'],
                vel_y=vel['y'],
                vel_z=vel['z'],
                time_step=body_state['timeStep'],
                body_id=bodies[body_name].id
            ))
    db.session.add_all(steps)
    db.session.commit()

    return simulation.id

def store_analysis(cms:dict, sim_id: int) -> SimulationAnalysis:
    sim_analysis: Simulation = SimulationAnalysis(
        center_of_mass=json.dumps(cms),
        simulation_id=sim_id
    )
    db.session.add(sim_analysis)
    db.session.commit()
    db.session.flush()

    return sim_analysis
