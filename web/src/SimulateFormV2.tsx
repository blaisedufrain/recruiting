import { Form, FormField, FormLabel } from '@radix-ui/react-form';
import { Button, Card, Flex, Heading, IconButton, Separator, TextField } from '@radix-ui/themes';
import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Routes } from 'routes';

type FormValue = number | '';

interface SimBody {
  name: string;
  position: { x: FormValue; y: FormValue; z: FormValue };
  velocity: { x: FormValue; y: FormValue; z: FormValue };
  mass: FormValue;
}

const defaultBody = (index: number): SimBody => ({
  name: `Body${index + 1}`,
  position: { x: '', y: '', z: '' },
  velocity: { x: '', y: '', z: '' },
  mass: '',
});

const INITIAL_BODIES: SimBody[] = [
  { name: 'Body1', position: { x: -0.73, y: 0, z: 0 }, velocity: { x: 0, y: -0.0015, z: 0 }, mass: 1 },
  { name: 'Body2', position: { x: 60.34, y: 0, z: 0 }, velocity: { x: 0, y: 0.13, z: 0 }, mass: 0.0123 },
];

const SimulateFormV2: React.FC = () => {
  const navigate = useNavigate();
  const [bodies, setBodies] = useState<SimBody[]>(INITIAL_BODIES);

  const handleChange = useCallback((index: number, field: string, value: string) => {
    const parsed: FormValue = value === '' ? '' : parseFloat(value);
    setBodies((prev) => {
      const updated = [...prev];
      const body = { ...updated[index] };
      if (field === 'mass') {
        body.mass = parsed;
      } else {
        const [group, axis] = field.split('.') as ['position' | 'velocity', 'x' | 'y' | 'z'];
        body[group] = { ...body[group], [axis]: parsed };
      }
      updated[index] = body;
      return updated;
    });
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
      // Convert array to the {BodyName: {...}} shape the API expects
      const payload = Object.fromEntries(
        bodies.map((b) => [b.name, { position: b.position, velocity: b.velocity, mass: b.mass }])
      );
      try {
        const response = await fetch('http://localhost:8000/simulation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Network response was not ok');
        navigate(Routes.SIMULATION);
      } catch (error) {
        console.error('Error:', error);
      }
    },
    [bodies]
  );

  return (
    <div style={{ position: 'absolute', top: '5%', left: 'calc(50% - 200px)', overflow: 'scroll' }}>
      <Card style={{ width: '400px' }}>
        <Heading as="h2" size="4" weight="bold" mb="4">
          Run a Simulation
        </Heading>
        <Link to={Routes.SIMULATION}>View previous simulation</Link>
        <Separator size="4" my="5" />
        <Form onSubmit={handleSubmit}>
          {bodies.map((body, index) => (
            <div key={index}>
              <Flex justify="between" align="center" mt={index > 0 ? '4' : undefined}>
                <Heading as="h3" size="3" weight="bold">{body.name}</Heading>
                {bodies.length > 1 && (
                  <IconButton type="button" variant="ghost" color="red" onClick={() => removeBody(index)}>✕</IconButton>
                )}
              </Flex>
              {(['position', 'velocity'] as const).map((group) => (
                (['x', 'y', 'z'] as const).map((axis) => (
                  <FormField key={`${index}.${group}.${axis}`} name={`${index}.${group}.${axis}`}>
                    <FormLabel>Initial {axis.toUpperCase()}-{group}</FormLabel>
                    <TextField.Root
                      type="number"
                      value={body[group][axis]}
                      onChange={(e) => handleChange(index, `${group}.${axis}`, e.target.value)}
                      required
                    />
                  </FormField>
                ))
              ))}
              <FormField name={`${index}.mass`}>
                <FormLabel>Mass</FormLabel>
                <TextField.Root
                  type="number"
                  value={body.mass}
                  onChange={(e) => handleChange(index, 'mass', e.target.value)}
                  required
                />
              </FormField>
              {index < bodies.length - 1 && <Separator size="4" my="4" />}
            </div>
          ))}

          <Flex justify="between" align="center" mt="4" mx="5">
            <Button type="button" variant="soft" onClick={addBody}>+ Add Body</Button>
            <Button type="submit">Submit</Button>
          </Flex>
        </Form>
      </Card>
    </div>
  );
};

export default SimulateFormV2;
