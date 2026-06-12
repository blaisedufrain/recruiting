import { Form, FormField, FormLabel } from '@radix-ui/react-form';
import { Button, Box, Card, Flex, Heading, Separator, TextField, IconButton } from '@radix-ui/themes';
import React, { useCallback, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Routes } from 'routes';
import {SimulationData} from "./types";

type FormValue = number | '';
type FormString = string | '';
interface SimBody {
  name: FormString
  position: {
      x: FormValue;
      y: FormValue;
      z: FormValue;
  }
  velocity: {
    x: FormValue;
    y: FormValue;
    z: FormValue;
  }
  mass: FormValue;
}

const randomPosOrVel = (min:number, max:number) => {
  return Math.random() * (max - min) + min
}

const defaultBody = (index: number): SimBody => {
  const offset = index + 1;
  return ({
  name: `Planet${offset}`,
  // move the bodies further out from the center
  position: { x: offset*60, y: 0, z: 0 },
  // keep similar velocities
  velocity: { x: 0, y: randomPosOrVel(0.12, 0.14), z: 0 },
  mass: offset * randomPosOrVel(0.1, 0.15),
})
};

// Try to get something that looks like 2 planets
const INITIAL_BODIES: SimBody[] = [
  { name: "Star",    position: { x: 0,    y: 0, z: 0 }, velocity: { x: 0, y: 0,     z: 0 }, mass: 10  },
  { name: "Planet1", position: { x: 60,   y: 0, z: 0 }, velocity: { x: 0, y: 0.13,  z: 0 }, mass: 0.1 },
  { name: "Planet2", position: { x: 240,  y: 0, z: 0 }, velocity: { x: 0, y: 0.13,  z: 0 }, mass: 0.2 },
]

const SimulateForm: React.FC = () => {
  const navigate = useNavigate();
  const [bodies, setBodies] = useState<SimBody[]>(INITIAL_BODIES);
  const { id } = useParams<{ id: string }>();
  const [description, setDescription] = useState<string>('')
  const handleUpdatedDescription = useCallback((value: string) => {
    setDescription(value);
  }, [])

  const handleUpdatedMass = useCallback((index: number, value: string) => {
    const parsedValue: FormValue = value === '' ? '' : parseFloat(value);
    setBodies((prev: any) => {
      const updated: any = [...prev];
      const body = {...updated[index]};
      body.mass = parsedValue;
      updated[index] = body;
      return updated;
    });
  }, []);

  const handleUpdatedName = useCallback((index: number, value: string) => {
    setBodies((prev: any) => {
      const updated: any = [...prev];
      const body = {...updated[index]};
      body.name = value;
      updated[index] = body;
      return updated;
    });
  }, []);

  const handleUpdatedPosition = useCallback((index: number, field: string, value: string) => {
    const parsedValue: FormValue = value === '' ? '' : parseFloat(value);
    setBodies((prev: any) => {
      const updated: any = [...prev];
      const body = {...updated[index]};
      const [group, axis] = field.split('.') as ['position' | 'velocity', 'x' | 'y' | 'z'];
      body[group] = { ...body[group], [axis]: parsedValue };
      updated[index] = body;
      return updated;
    })
  }, []);


  const addBody = useCallback(() => {
    setBodies((prev) => [...prev, defaultBody(prev.length)]);
  }, []);

  const removeBody = useCallback((index: number) => {
    setBodies((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const payload = Object.fromEntries(
        bodies.map(body => [
          body.name,
          {
            position: body.position,
            velocity: body.velocity,
            mass: body.mass
          }
        ])
      )
      payload["description"] = description;
      try {
        const response = await fetch('http://localhost:8000/simulation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const sim_id = (await response.json()).id;
        navigate(Routes.SIMULATION.replace(':id', String(sim_id)))
      } catch (error) {
        console.error('Error:', error);
      }
    },
    [bodies]
  );

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:8000/simulation/${id}`)
      .then((response) => response.json())
      .then((data: SimulationData) => {
        setBodies(data.simulationBodies.map(body => ({
          name: body.name,
          position: { x: body.simulationSteps[0].pos_x, y: body.simulationSteps[0].pos_y, z: body.simulationSteps[0].pos_z },
          velocity: { x: body.simulationSteps[0].vel_x, y: body.simulationSteps[0].vel_y, z: body.simulationSteps[0].vel_z },
          mass: body.mass,
        })))
      })
      .catch(console.error);
  }, [id]);

  return (
    <Flex justify="center" align="start" style={{ minHeight: '100vh', padding: '2rem' }}>
      <Box style={{ width: '100%', maxWidth: '600px' }}>
        {/* Header card */}
        <Card mb="4">
          <Flex justify="between" align="center">
            <Heading as="h2" size="4" weight="bold">Run a Simulation</Heading>
            <Link to={Routes.SIMULATIONS_ALL}>See previous simulations</Link>
          </Flex>
        </Card>

        {/* Body forms */}
        <Card>
          <Form onSubmit={handleSubmit}>
            <Box style={{ marginBottom: '25px' }}>
              <FormField name="description">
                <FormLabel>Details (Optional)</FormLabel>
                <TextField.Root
                  type="text"
                  value={description}
                  onChange={(e) => handleUpdatedDescription(e.target.value)}
                />
              </FormField>
            </Box>

            {bodies.map((body, index) => (
              <Box key={index}>
                {index > 0 && <Separator size="4" my="4" />}
                <Flex justify="between" align="center" mb="3">
                  <Heading as="h3" size="3" weight="bold">
                    {body.name}
                  </Heading>
                  {bodies.length > 1 && (
                    <IconButton type="button" variant="ghost" color="red" onClick={() => removeBody(index)}>✕</IconButton>
                  )}
                </Flex>
                <Flex direction="column" gap="2">
                  <FormField name={`${index}.name`}>
                    <FormLabel>Name</FormLabel>
                    <TextField.Root
                      type="text"
                      value={body.name}
                      onChange={(e) => handleUpdatedName(index, e.target.value)}
                      required
                    />
                  </FormField>
                  {(['position', 'velocity'] as const).map((group) =>
                    (['x', 'y', 'z'] as const).map((axis) => (
                      <FormField key={`${index}.${group}.${axis}`} name={`${index}.${group}.${axis}`}>
                        <FormLabel>Initial {axis.toUpperCase()}-{group}</FormLabel>
                        <TextField.Root type="number" value={body[group][axis]} required onChange={(e) => handleUpdatedPosition(index, `${group}.${axis}`, e.target.value)} />
                      </FormField>
                    ))
                  )}
                  <FormField name={`${index}.mass`}>
                    <FormLabel>Mass</FormLabel>
                    <TextField.Root
                      type="number"
                      value={body.mass}
                      onChange={(e) => handleUpdatedMass(index, e.target.value)}
                      required
                    />
                  </FormField>
                </Flex>
              </Box>
            ))}

            <Flex justify="between" align="center" mt="5">
              <Button type="button" variant="soft" onClick={addBody}>+ Add Body</Button>
              <Button type="submit">Submit</Button>
            </Flex>
          </Form>
        </Card>
      </Box>
    </Flex>
  );
};

export default SimulateForm;
