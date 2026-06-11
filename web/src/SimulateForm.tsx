import { Form, FormField, FormLabel } from '@radix-ui/react-form';
import { Button, Card, Section, Flex, Heading, Separator, TextField, IconButton } from '@radix-ui/themes';
import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Routes } from 'routes';

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

const defaultBody = (index: number): SimBody => ({
  name: `Body${index + 1}`,
  position: { x: Math.random(), y: Math.random(), z: Math.random() },
  velocity: { x: 0, y: 0, z: 0 },
  mass: Math.random(),
});

const INITIAL_BODIES :SimBody[] = [
  {name: "Body1", position: {x: -0.73, y: 0, z: 0}, velocity: {x: 0, y: -0.0015, z: 0}, mass: 1 },
  {name: "Body2", position: {x: 60.34, y: 0, z: 0}, velocity: {x: 0, y: 0.13, z: 0}, mass: 0.0123 }
]

const SimulateForm: React.FC = () => {
  const navigate = useNavigate();
  const [bodies, setBodies] = useState<SimBody[]>(INITIAL_BODIES);

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
        navigate(Routes.SIMULATION);
      } catch (error) {
        console.error('Error:', error);
      }
    },
    [bodies]
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: '5%',
        left: 'calc(50% - 200px)',
        overflow: 'scroll',
      }}
    >
      {/* Card: https://www.radix-ui.com/themes/docs/components/card */}
      <Card
        style={{
          width: '400px',
        }}
      >
        <Heading as="h2" size="4" weight="bold" mb="4">
          Run a Simulation
        </Heading>
        <Link to={Routes.SIMULATION}>View previous simulation</Link>
        <Separator size="4" my="5" />
        <Form onSubmit={handleSubmit}>
          {bodies.map((body, index) => (
          <div key={index}>
            <Section align="center" justify="between">
              <Heading as="h3" size="3" weight="bold">
                Initial Configuration for {body.name}
              </Heading>
              {bodies.length > 1 && (
                  <IconButton type="button" variant="classic" color="red" onClick={() => removeBody(index)}>Delete Body</IconButton>
              )}

               <FormField name={`${index}.name`}>
                <FormLabel>Name</FormLabel>
                <TextField.Root
                  type="text"
                  value={body.name}
                  onChange={(e) => handleUpdatedName(index, e.target.value)}
                  required
                />
              </FormField>
              {(['position', 'velocity'] as const).map((group: "velocity" | "position")=>
                  (['x', 'y', 'z'] as const).map((axis: 'x'| 'y'|'z') => (
                  <FormField key={`${index}.${group}.${axis}`} name={`${index}.${group}.${axis}`} >
                    <FormLabel> Initial {axis.toUpperCase()}-{group}</FormLabel>
                    <TextField.Root type="number" value={body[group][axis]} required onChange={(e) => handleUpdatedPosition(index, `${group}.${axis}`, e.target.value)}></TextField.Root>
                  </FormField>
              )))}
               <FormField name={`${index}.mass`}>
                <FormLabel>Mass</FormLabel>
                <TextField.Root
                  type="number"
                  value={body.mass}
                  onChange={(e) => handleUpdatedMass(index, e.target.value)}
                  required
                />
              </FormField>
            </Section>
          </div>
          ))}
          <Flex justify="center" m="5">
            <Button type="submit">Submit</Button>
          </Flex>
        </Form>
      </Card>
    </div>
  );
};

export default SimulateForm;
