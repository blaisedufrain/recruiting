# SIMULATOR
from typing import List

import numpy as np

from models import SimulationBody


def sim_center_of_mass(sim_bodies: List[SimulationBody]):
    # https://docs.scipy.org/doc/scipy/reference/generated/scipy.ndimage.center_of_mass.html
    if not sim_bodies or not sim_bodies[0].simulationSteps: return {}

    masses = [sim.mass for sim in sim_bodies]
    result = []
    step_matrix = [body.simulationSteps for body in sim_bodies]
    for time_segment in zip(*step_matrix):
        current_positions = [
            (step.pos_x, step.pos_y, step.pos_z)
            for step in time_segment
        ]
        result.append([time_segment[0].t_start, time_segment[0].t_end, np.average(np.array(current_positions), axis=0, weights=masses).tolist()])

    return result
