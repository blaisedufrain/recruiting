from typing import List

from sqlalchemy import String, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import db


# Structure
# [
#     t_start,
#     t_end,
#     {
#         "BodyId": {
#             "position": {"x": ..., "y": ..., "z": ...},
#             "velocity": {"x": ..., "y": ..., "z": ...},
#             "mass": ...,
#             "time": ...,
#             "timeStep": ...
#         }
#     }
# ]


#  [
#    300, t_start
#    400, t_end
#    {
#      "Body2": BodyName
#      {
#       "velocity": {
#          "x": -0.08000246995209007,
#          "y": 0.11128262808986142,
#          "z": 0.0
#       },
#       "position": {
#          "x": 44.253251093115566,
#          "y": 36.516040216336926,
#          "z": 0.0
#       },
#       "mass": 0.0123,
#       "timeStep": 100,
#       "time": 400
#      }
#    }
#  ]

# Data Model Target
# simulation_runs
# simulation_bodies
# simulation_steps

class Simulation(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[str] = mapped_column()
    simulationBodies: Mapped[List["SimulationBody"]] = relationship(
        back_populates="simulation", cascade="all, delete-orphan"
    )

class SimulationBody(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60))
    simulation_id: Mapped[int] = mapped_column(ForeignKey("simulation.id"))
    simulation: Mapped["Simulation"] = relationship(back_populates="simulationBodies")
    mass: Mapped[float] = mapped_column(Float)
    simulationSteps: Mapped[List["SimulationStep"]] = relationship(
        back_populates="body", cascade="all, delete-orphan"
    )

class SimulationStep(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    t_start: Mapped[float] = mapped_column(Float)
    t_end: Mapped[float] = mapped_column(Float)
    time: Mapped[int] = mapped_column()
    pos_x: Mapped[float] = mapped_column(Float)
    pos_y: Mapped[float] = mapped_column(Float)
    pos_z: Mapped[float] = mapped_column(Float)
    vel_x: Mapped[float] = mapped_column(Float)
    vel_y: Mapped[float] = mapped_column(Float)
    vel_z: Mapped[float] = mapped_column(Float)
    time_step: Mapped[float] = mapped_column(Float(precision=2))
    body_id: Mapped[int] = mapped_column(ForeignKey("simulation_body.id"))
    body: Mapped["SimulationBody"] = relationship(back_populates="simulationSteps")


