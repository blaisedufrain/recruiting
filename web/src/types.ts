export interface SimulationStep {
  id: number;
  t_start: number;
  t_end: number;
  time: number;
  time_step: number;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  vel_x: number;
  vel_y: number;
  vel_z: number;
}

export interface SimulationBody {
  id: number;
  name: string;
  mass: number;
  simulationSteps: SimulationStep[];
}

export interface SimulationData {
  id: number;
  created_at: string;
  simulationBodies: SimulationBody[];
}
