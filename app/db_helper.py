
from models import Simulation, SimulationBody
from sqlalchemy.orm import selectinload

def get_simulation_by_id(simulation: int) -> Simulation:
    return (Simulation.query
                       .options(selectinload(Simulation.simulationBodies).joinedload(SimulationBody.simulationSteps))
                       .get(simulation))
